export type ReflectionMode = 'reflect' | 'summarize' | 'brainstorm' | 'action_plan';

export type AppView = 'home' | 'journal' | 'privacy' | 'settings';

export interface UserPreferences {
  defaultMode: ReflectionMode;
  showTimestamps: boolean;
}

export interface JournalTurn {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  mode?: ReflectionMode;
  modelUsed?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  tags: string[];
  turns: JournalTurn[];
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface ReflectionRequest {
  prompt: string;
  history?: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>;
  mode?: ReflectionMode;
  titleContext?: string;
}

export interface ReflectionResponse {
  text: string;
  modelUsed: string;
  suggestedTitle?: string;
  suggestedTags?: string[];
}
