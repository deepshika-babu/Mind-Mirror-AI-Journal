import { auth } from './firebase.ts';
import type {
  ReflectionMode,
  ReflectionResponse,
  ReflectionInsight,
  JournalEntry,
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
    modelUsed: data.modelUsed || 'gemini-3.6-flash',
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
