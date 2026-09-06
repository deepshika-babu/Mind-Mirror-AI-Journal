import { auth } from './firebase.ts';
import type {
  ReflectionMode,
  ReflectionResponse,
  ReflectionInsight,
  JournalEntry,
  MemoryThread,
  ThreadsResponse,
  WeeklyReflection,
  WeeklyReflectionResponse,
  WeeklyReflectionRequest,
} from '../types.ts';

/**
 * Acquire fresh Firebase ID token from current authenticated user
 */
async function getAuthHeaders(forceRefresh = false): Promise<{ 'Content-Type': string; Authorization?: string }> {
  const headers: { 'Content-Type': string; Authorization?: string } = {
    'Content-Type': 'application/json',
  };

  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const idToken = await currentUser.getIdToken(forceRefresh);
      headers.Authorization = `Bearer ${idToken}`;
    } catch {
      console.warn('Could not retrieve Firebase ID token');
    }
  }

  return headers;
}

export async function requestReflection(params: {
  prompt: string;
  history?: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>;
  mode?: ReflectionMode;
  titleContext?: string;
}): Promise<ReflectionResponse> {
  let headers = await getAuthHeaders(false);
  let response = await fetch('/api/reflect', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  // If unauthorized, force-refresh the Firebase ID token and retry once
  if (response.status === 401 && auth.currentUser) {
    headers = await getAuthHeaders(true);
    if (headers.Authorization) {
      response = await fetch('/api/reflect', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });
    }
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Reflection request failed (${response.status})`);
  }

  const data = await response.json();
  return {
    text: data.text,
    modelUsed: data.modelUsed || 'gemini-3.8-flash',
  };
}

export async function generateEntryMetadata(text: string): Promise<{
  title: string;
  summary: string;
  tags: string[];
}> {
  let headers = await getAuthHeaders(false);
  let response = await fetch('/api/summarize-entry', {
    method: 'POST',
    headers,
    body: JSON.stringify({ text }),
  });

  if (response.status === 401 && auth.currentUser) {
    headers = await getAuthHeaders(true);
    if (headers.Authorization) {
      response = await fetch('/api/summarize-entry', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text }),
      });
    }
  }

  if (!response.ok) {
    return {
      title: 'Personal Reflection',
      summary: text.slice(0, 100),
      tags: ['Journal', 'Reflection'],
    };
  }

  return response.json();
}

/**
 * Phase 2A: Single-entry, user-triggered, evidence-grounded reflection insights
 */
export async function requestEntryInsights(
  entryInput: JournalEntry | string,
  forceRegenerate: boolean = false
): Promise<ReflectionInsight> {
  const entryId = typeof entryInput === 'string' ? entryInput : entryInput.id;
  const turns = typeof entryInput === 'object' && Array.isArray(entryInput.turns) ? entryInput.turns : undefined;
  const entryTitle = typeof entryInput === 'object' ? entryInput.title : undefined;
  const entryUpdatedAt = typeof entryInput === 'object' ? entryInput.updatedAt : undefined;

  let headers = await getAuthHeaders(false);
  if (!headers.Authorization) {
    throw new Error('You must be signed in to explore reflection insights.');
  }

  const payload = {
    entryId,
    forceRegenerate,
    turns,
    entryTitle,
    entryUpdatedAt,
  };

  let response = await fetch('/api/insights', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  // If unauthorized, force-refresh the Firebase ID token and retry once
  if (response.status === 401 && auth.currentUser) {
    headers = await getAuthHeaders(true);
    if (headers.Authorization) {
      response = await fetch('/api/insights', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    }
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Insight extraction failed (${response.status})`);
  }

  const data = await response.json();
  if (!data || !data.insight) {
    throw new Error('Received unexpected empty insight response from server.');
  }

  return data.insight as ReflectionInsight;
}

/**
 * Phase 2B: User-triggered Memory Threads across past journal entries and Phase 2A insights
 */
export async function requestMemoryThreads(params: {
  entries: JournalEntry[];
  insights?: ReflectionInsight[];
  forceRegenerate?: boolean;
}): Promise<ThreadsResponse> {
  let headers = await getAuthHeaders(false);
  if (!headers.Authorization) {
    throw new Error('You must be signed in to explore Memory Threads.');
  }

  // Data minimization: transmit titles, dates, all turns, summaries/content, and insights
  const sanitizedEntries = params.entries.map((e: any, entryIdx: number) => {
    let rawTurns: any[] = [];
    if (Array.isArray(e.turns)) {
      rawTurns = e.turns;
    } else if (e.turns && typeof e.turns === 'object') {
      rawTurns = Object.values(e.turns);
    }

    const turns: Array<{ id: string; role: 'user' | 'model'; content: string }> = [];

    for (let tIdx = 0; tIdx < rawTurns.length; tIdx++) {
      const t = rawTurns[tIdx];
      if (!t) continue;
      let text = '';
      if (typeof t.content === 'string') text = t.content;
      else if (typeof t.text === 'string') text = t.text;
      else if (typeof t.message === 'string') text = t.message;
      else if (typeof t.prompt === 'string') text = t.prompt;
      else if (Array.isArray(t.parts)) {
        text = t.parts.map((p: any) => (typeof p === 'string' ? p : p?.text || '')).join(' ');
      }
      text = text.trim();
      if (text.length > 0) {
        turns.push({
          id: String(t.id || `turn-${entryIdx}-${tIdx}`),
          role: (t.role === 'model' || t.role === 'assistant') ? 'model' : 'user',
          content: text.slice(0, 3000),
        });
      }
    }

    // Top-level text fallback (summary, content, text, notes, title)
    const topLevelText = (
      (typeof e.content === 'string' && e.content.trim()) ||
      (typeof e.summary === 'string' && e.summary.trim()) ||
      (typeof e.text === 'string' && e.text.trim()) ||
      (typeof e.notes === 'string' && e.notes.trim()) ||
      (typeof e.title === 'string' && e.title.trim() && e.title !== 'New Reflection' ? e.title.trim() : '') ||
      ''
    );

    if (turns.length === 0 && topLevelText) {
      turns.push({
        id: `content-${e.id || entryIdx}`,
        role: 'user',
        content: topLevelText.slice(0, 3000),
      });
    }

    return {
      id: String(e.id || `entry-${entryIdx}`),
      title: typeof e.title === 'string' && e.title.trim() ? e.title.trim() : 'Reflective Entry',
      summary: typeof e.summary === 'string' ? e.summary : '',
      content: typeof e.content === 'string' ? e.content : (topLevelText || ''),
      createdAt: typeof e.createdAt === 'number' ? e.createdAt : Date.now(),
      updatedAt: typeof e.updatedAt === 'number' ? e.updatedAt : Date.now(),
      tags: Array.isArray(e.tags) ? e.tags : [],
      turns,
    };
  });

  const sanitizedInsights = (params.insights || []).map((ins) => ({
    entryId: ins.entryId,
    themes: ins.themes || [],
    expressedEmotions: ins.expressedEmotions || [],
    goals: ins.goals || [],
    challenges: ins.challenges || [],
    achievements: ins.achievements || [],
  }));

  const payload = {
    entries: sanitizedEntries,
    insights: sanitizedInsights,
    forceRegenerate: params.forceRegenerate || false,
  };

  let response = await fetch('/api/threads', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (response.status === 401 && auth.currentUser) {
    headers = await getAuthHeaders(true);
    if (headers.Authorization) {
      response = await fetch('/api/threads', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    }
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Memory Threads generation failed (${response.status})`);
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.threads)) {
    throw new Error('Received unexpected empty threads response from server.');
  }

  return {
    threads: data.threads as MemoryThread[],
    entriesAnalyzedCount: data.entriesAnalyzedCount || params.entries.length,
    modelUsed: data.modelUsed || 'gemini-3.8-flash',
    notice: data.notice,
  };
}

/**
 * Request Phase 2C Weekly Reflection synthesis from backend
 */
export async function requestWeeklyReflection(
  params: WeeklyReflectionRequest
): Promise<WeeklyReflectionResponse> {
  let headers = await getAuthHeaders();

  const payload = {
    weekKey: params.weekKey,
    startDate: params.startDate,
    endDate: params.endDate,
    forceRegenerate: params.forceRegenerate || false,
    entries: params.entries || [],
    insights: params.insights || [],
    threads: params.threads || [],
  };

  let response = await fetch('/api/weekly-reflection', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (response.status === 401 && auth.currentUser) {
    headers = await getAuthHeaders(true);
    if (headers.Authorization) {
      response = await fetch('/api/weekly-reflection', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    }
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Weekly Reflection generation failed (${response.status})`);
  }

  const data = await response.json();
  if (!data || !data.reflection) {
    throw new Error('Received unexpected empty weekly reflection response from server.');
  }

  return {
    reflection: data.reflection as WeeklyReflection,
    modelUsed: data.modelUsed || 'gemini-3.8-flash',
    fromCache: !!data.fromCache,
  };
}


