import React, { useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  Flame,
  MessageSquare,
  ShieldCheck,
  Compass,
  Tag as TagIcon,
  Layers,
} from 'lucide-react';
import type { JournalEntry, UserProfile, ReflectionMode } from '../types.ts';
import { tokens } from '../lib/designTokens.ts';

interface HomePageProps {
  user: UserProfile;
  entries: JournalEntry[];
  onNavigateToJournal: (entryId?: string) => void;
  onNavigateToThreads?: () => void;
  onNavigateToWeekly?: () => void;
  onNewEntry: () => void;
  onStartWithPrompt?: (prompt: string, mode: ReflectionMode) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  user,
  entries,
  onNavigateToJournal,
  onNavigateToThreads,
  onNavigateToWeekly,
  onNewEntry,
  onStartWithPrompt,
}) => {
  // Compute greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Compute real statistics strictly from Firestore entries
  const stats = useMemo(() => {
    const totalEntries = entries.length;
    const totalTurns = entries.reduce((acc, e) => acc + (e.turns?.length || 0), 0);

    // Calculate unique reflection days
    const uniqueDays = new Set<string>();
    entries.forEach((e) => {
      const dateStr = new Date(e.createdAt).toDateString();
      uniqueDays.add(dateStr);
    });
    const totalActiveDays = uniqueDays.size;

    // Calculate lenses used
    const lensCount: Record<string, number> = {};
    entries.forEach((e) => {
      e.turns?.forEach((t) => {
        if (t.mode) {
          lensCount[t.mode] = (lensCount[t.mode] || 0) + 1;
        }
      });
    });

    // Most used lens
    let topLens: string | null = null;
    let maxLensFreq = 0;
    Object.entries(lensCount).forEach(([lens, count]) => {
      if (count > maxLensFreq) {
        maxLensFreq = count;
        topLens = lens;
      }
    });

    // Last reflection date
    const lastEntry = entries.length > 0 ? entries[0] : null;

    return {
      totalEntries,
      totalTurns,
      totalActiveDays,
      topLens,
      lastEntry,
    };
  }, [entries]);

  // Recent entries for display
  const recentEntries = useMemo(() => {
    return entries.slice(0, 4);
  }, [entries]);

  const TODAY_PROMPTS = [
    {
      mode: 'reflect' as ReflectionMode,
      icon: '🪞',
      label: 'Mirror & Inquire',
      text: 'What single moment or encounter occupied most of my headspace today, and why did it resonate?',
    },
    {
      mode: 'summarize' as ReflectionMode,
      icon: '📋',
      label: 'Synthesize Themes',
      text: 'Looking across my recent decisions and moods, what underlying patterns am I beginning to notice?',
    },
    {
      mode: 'brainstorm' as ReflectionMode,
      icon: '💡',
      label: 'Explore Angles',
      text: 'What is a problem or dilemma I feel stuck on, and how might a trusted mentor suggest reframing it?',
    },
  ];

  return (
    <div id="home-view" className="flex-1 overflow-y-auto bg-stone-100/60 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Welcome Header */}
        <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Personal Reflection Sanctuary</span>
              </div>
              <span className="text-[11px] font-medium text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
                Powered by Gemini 3.8 Flash
              </span>
            </div>
            <h1 className={tokens.typography.h1}>
              {greeting}, {user.displayName?.split(' ')[0] || 'Writer'}.
            </h1>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              Welcome back to your private MindMirror sanctuary. Here, every thought is preserved in secure Firestore cloud isolation and synthesized with thoughtful Gemini 3.8 Flash counsel.
            </p>
            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <button
                id="home-new-reflection-btn"
                onClick={onNewEntry}
                className={tokens.buttons.primary}
              >
                <Plus className="w-4 h-4" />
                <span>Begin New Reflection</span>
              </button>
              <button
                id="home-open-journal-btn"
                onClick={() => onNavigateToJournal()}
                className={tokens.buttons.secondary}
              >
                <BookOpen className="w-4 h-4 text-stone-600" />
                <span>Open Journal Workspace</span>
              </button>
              {onNavigateToWeekly && (
                <button
                  id="home-open-weekly-btn"
                  onClick={onNavigateToWeekly}
                  className={tokens.buttons.secondary}
                >
                  <Calendar className="w-4 h-4 text-amber-700" />
                  <span>Weekly Reflection</span>
                </button>
              )}
              {onNavigateToThreads && (
                <button
                  id="home-open-threads-btn"
                  onClick={onNavigateToThreads}
                  className={tokens.buttons.secondary}
                >
                  <Layers className="w-4 h-4 text-amber-700" />
                  <span>Memory Threads</span>
                </button>
              )}
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-linear-to-l from-amber-50/50 to-transparent pointer-events-none hidden md:block" />
        </section>

        {/* 3-Step Guided Journey Overview */}
        <section className="bg-white/80 border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className={tokens.typography.metaEyebrow}>How MindMirror Works</h2>
            <span className="text-[11px] text-stone-500">Journal → Reflection → Insights</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-100/80 text-amber-900 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                1
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold text-stone-900">Write Privately</h3>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Record candid thoughts, emotions, or dilemmas in a private multi-turn dialogue.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-100/80 text-amber-900 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                2
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold text-stone-900">Mindful Reflection</h3>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Gemini mirrors your cognitive patterns with empathy, concise reframes, and gentle inquiry.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-100/80 text-amber-900 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                3
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold text-stone-900">Grounded Insights</h3>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Explore themes, feelings, and micro-actions strictly justified by verbatim quotes from your writing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Real Firestore Statistics Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className={tokens.typography.metaEyebrow}>Real Reflection Statistics</h2>
            <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-medium">
              Live Firestore Verified
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-600">
                <span className="text-xs font-medium">Total Entries</span>
                <BookOpen className="w-4 h-4 text-amber-700" />
              </div>
              <p className="text-2xl font-serif font-semibold text-stone-900">{stats.totalEntries}</p>
              <p className="text-[11px] text-stone-600">Archived reflections</p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-600">
                <span className="text-xs font-medium">Dialogue Turns</span>
                <MessageSquare className="w-4 h-4 text-amber-700" />
              </div>
              <p className="text-2xl font-serif font-semibold text-stone-900">{stats.totalTurns}</p>
              <p className="text-[11px] text-stone-600">Thoughts & responses</p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-600">
                <span className="text-xs font-medium">Active Days</span>
                <Flame className="w-4 h-4 text-amber-700" />
              </div>
              <p className="text-2xl font-serif font-semibold text-stone-900">{stats.totalActiveDays}</p>
              <p className="text-[11px] text-stone-600">Days with entries</p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-600">
                <span className="text-xs font-medium">Primary Lens</span>
                <Compass className="w-4 h-4 text-amber-700" />
              </div>
              <p className="text-lg font-serif font-semibold text-stone-900 truncate capitalize">
                {stats.topLens || 'Open'}
              </p>
              <p className="text-[11px] text-stone-600">Most explored mode</p>
            </div>
          </div>
        </section>

        {/* Daily Inquiry Prompts */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className={tokens.typography.metaEyebrow}>Reflective Inquiries</h2>
            <span className="text-xs text-stone-600">Click to start writing</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {TODAY_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                id={`prompt-seed-${idx}`}
                onClick={() => {
                  if (onStartWithPrompt) {
                    onStartWithPrompt(item.text, item.mode);
                  } else {
                    onNewEntry();
                  }
                }}
                className="bg-white rounded-2xl border border-stone-200 p-4 text-left shadow-xs hover:border-amber-400 hover:bg-amber-50/30 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-800 font-serif leading-relaxed italic">
                    "{item.text}"
                  </p>
                </div>
                <div className="pt-3 flex items-center justify-end text-xs font-medium text-amber-700 group-hover:translate-x-0.5 transition-transform">
                  <span>Start reflection →</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Reflections Feed */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className={tokens.typography.metaEyebrow}>Recent Reflections</h2>
            {entries.length > 0 && (
              <button
                id="view-all-reflections-btn"
                onClick={() => onNavigateToJournal()}
                className="text-xs font-medium text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View all in Journal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {entries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100/70 text-amber-800 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className={tokens.typography.h3}>Your journal is waiting</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  You have not created any reflections yet. Capture today's thoughts, emotions, or aspirations to begin your private chronicle.
                </p>
              </div>
              <button
                id="empty-state-new-btn"
                onClick={onNewEntry}
                className={tokens.buttons.primary}
              >
                <Plus className="w-4 h-4" />
                <span>Write Your First Reflection</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {recentEntries.map((entry) => {
                const firstUserTurn = entry.turns.find((t) => t.role === 'user');
                const lastModelTurn = [...entry.turns].reverse().find((t) => t.role === 'model');

                return (
                  <div
                    key={entry.id}
                    id={`recent-entry-${entry.id}`}
                    onClick={() => onNavigateToJournal(entry.id)}
                    className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-stone-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-stone-600" />
                          {new Date(entry.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full text-[10px] font-medium border border-stone-200">
                          {entry.turns.length} {entry.turns.length === 1 ? 'turn' : 'turns'}
                        </span>
                      </div>

                      <h3 className="font-serif font-semibold text-stone-900 text-base leading-snug hover:text-amber-800 transition-colors line-clamp-1">
                        {entry.title || 'Untitled Reflection'}
                      </h3>

                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {entry.summary || firstUserTurn?.content || 'No text written yet.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {entry.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <span className="text-[11px] text-amber-700 font-medium inline-flex items-center gap-1">
                        <span>Open reflection</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
