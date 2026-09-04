import type { ReflectionMode, ReflectionResponse } from '../types.ts';

export async function requestReflection(params: {
  prompt: string;
  history?: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>;
  mode?: ReflectionMode;
  titleContext?: string;
}): Promise<ReflectionResponse> {
  const response = await fetch('/api/reflect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

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
  const response = await fetch('/api/summarize-entry', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    return {
      title: 'Personal Reflection',
      summary: text.slice(0, 100),
      tags: ['Journal', 'Reflection'],
    };
  }

  return response.json();
}
