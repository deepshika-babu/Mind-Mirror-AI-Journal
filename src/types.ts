export type ReflectionMode = 'reflect' | 'summarize' | 'brainstorm' | 'action_plan';

export type AppView = 'home' | 'journal' | 'threads' | 'weekly' | 'privacy' | 'settings';

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

export interface GroundedEvidence {
  observation: string;
  evidenceQuote: string;
  sourceTurnId: string;
}

export interface ReflectionInsight {
  id: string; // insight_{entryId}
  entryId: string;
  themes: GroundedEvidence[];
  expressedEmotions: GroundedEvidence[];
  goals: GroundedEvidence[];
  challenges: GroundedEvidence[];
  achievements: GroundedEvidence[];
  possibleActions: string[];
  peopleMentioned: string[];
  placesMentioned: string[];
  openQuestions: string[];
  entryUpdatedAtAtAnalysis: number;
  generatedAt: number;
  modelUsed: string;
  version: number;
}

export interface InsightRequest {
  entryId: string;
  forceRegenerate?: boolean;
}

export interface InsightResponse {
  insight: ReflectionInsight;
}

export interface ThreadEvidence {
  entryId: string;
  entryTitle: string;
  entryDate: number;
  quote: string;
  observation: string;
}

export interface RelatedEntrySummary {
  entryId: string;
  entryTitle: string;
  entryDate: number;
}

export interface MemoryThread {
  id: string;
  userId: string;
  title: string;
  description: string;
  relatedEntries: RelatedEntrySummary[];
  evidence: ThreadEvidence[];
  approximateTimeline: {
    startDate: number;
    endDate: number;
    displayText: string;
  };
  generatedAt: number;
  entriesAnalyzedCount: number;
  modelUsed?: string;
}

export interface ThreadsRequest {
  forceRegenerate?: boolean;
}

export interface ThreadsResponse {
  threads: MemoryThread[];
  entriesAnalyzedCount: number;
  modelUsed: string;
  notice?: string;
}

export interface WeeklyEvidence {
  observation: string;
  evidenceQuote: string;
  sourceEntryId?: string;
  sourceEntryTitle?: string;
  sourceTurnId?: string;
}

export interface WeeklyTheme {
  title: string;
  description: string;
  evidence?: WeeklyEvidence[];
}

export interface WeeklyEmotionalPattern {
  emotion: string;
  description: string;
  evidence?: WeeklyEvidence[];
}

export interface WeeklyProgressAchievement {
  achievement: string;
  description: string;
  evidence?: WeeklyEvidence[];
}

export interface WeeklyChallenge {
  challenge: string;
  description: string;
  evidence?: WeeklyEvidence[];
}

export interface WeeklyThreadSummary {
  threadId?: string;
  threadTitle: string;
  connection: string;
}

export interface WeeklyTakeaway {
  takeaway: string;
  grounding: string;
}

export interface WeeklyReflection {
  id: string; // e.g. weekly_{userId}_{weekKey}
  userId: string;
  weekKey: string; // e.g. "2026-W36"
  startDate: number;
  endDate: number;
  displayDateRange: string;
  summary: string;
  mainThemes: WeeklyTheme[];
  emotionalPatterns: WeeklyEmotionalPattern[];
  progressAndAchievements: WeeklyProgressAchievement[];
  challenges: WeeklyChallenge[];
  recurringThreads: WeeklyThreadSummary[];
  groundedTakeaways: WeeklyTakeaway[];
  gentleNextSteps: string[];
  entriesAnalyzedCount: number;
  entryIds: string[];
  generatedAt: number;
  modelUsed?: string;
}

export interface WeeklyReflectionRequest {
  weekKey: string;
  startDate: number;
  endDate: number;
  forceRegenerate?: boolean;
  entries?: any[];
  insights?: any[];
  threads?: any[];
}

export interface WeeklyReflectionResponse {
  reflection: WeeklyReflection;
  modelUsed: string;
  fromCache?: boolean;
}

