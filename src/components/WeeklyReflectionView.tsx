import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Quote,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Heart,
  Target,
  ArrowRight,
  BookOpen,
  Copy,
  Check,
  Trash2,
  ShieldCheck,
  Compass,
  Layers,
} from 'lucide-react';
import type {
  WeeklyReflection,
  JournalEntry,
  UserProfile,
  MemoryThread,
  ReflectionInsight,
} from '../types.ts';
import {
  getWeekRangeFromKey,
  getSelectableWeeks,
  shiftWeek,
  getWeekKey,
  getEntriesForWeek,
} from '../lib/weekUtils.ts';

interface WeeklyReflectionViewProps {
  user: UserProfile;
  entries: JournalEntry[];
  insights: ReflectionInsight[];
  threads: MemoryThread[];
  weeklyReflections: WeeklyReflection[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  onGenerateWeekly: (weekKey: string, forceRegenerate?: boolean) => void;
  onDeleteWeekly: (docIdOrWeekKey: string) => void;
  onNavigateToJournal: (entryId?: string) => void;
  onClearError: () => void;
}

export const WeeklyReflectionView: React.FC<WeeklyReflectionViewProps> = ({
  entries,
  weeklyReflections,
  isGenerating,
  error,
  onGenerateWeekly,
  onDeleteWeekly,
  onNavigateToJournal,
  onClearError,
}) => {
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(() => getWeekKey(new Date()));
  const [copied, setCopied] = useState(false);

  // Derive week range metadata
  const currentWeekRange = useMemo(() => {
    return getWeekRangeFromKey(selectedWeekKey);
  }, [selectedWeekKey]);

  // Derive selectable weeks list
  const selectableWeeks = useMemo(() => {
    return getSelectableWeeks(entries);
  }, [entries]);

  // Entries within this selected week
  const weekEntries = useMemo(() => {
    return getEntriesForWeek(entries, currentWeekRange);
  }, [entries, currentWeekRange]);

  // Existing cached reflection for this week
  const activeReflection = useMemo(() => {
    return weeklyReflections.find((r) => r.weekKey === selectedWeekKey);
  }, [weeklyReflections, selectedWeekKey]);

  // Navigation between weeks
  const handlePrevWeek = () => {
    const prev = shiftWeek(selectedWeekKey, -1);
    setSelectedWeekKey(prev.weekKey);
  };

  const handleNextWeek = () => {
    const next = shiftWeek(selectedWeekKey, 1);
    setSelectedWeekKey(next.weekKey);
  };

  const handleCopyText = async () => {
    if (!activeReflection) return;
    const lines: string[] = [
      `MindMirror Weekly Reflection — ${activeReflection.displayDateRange}`,
      `Generated: ${new Date(activeReflection.generatedAt).toLocaleDateString()}`,
      '',
      'SUMMARY:',
      activeReflection.summary,
      '',
      'MAIN THEMES:',
      ...activeReflection.mainThemes.map((t) => `• ${t.title}: ${t.description}`),
      '',
      'EMOTIONAL PATTERNS:',
      ...activeReflection.emotionalPatterns.map((e) => `• ${e.emotion}: ${e.description}`),
      '',
      'PROGRESS & ACHIEVEMENTS:',
      ...activeReflection.progressAndAchievements.map((p) => `• ${p.achievement}: ${p.description}`),
      '',
      'CHALLENGES & FRICTION:',
      ...activeReflection.challenges.map((c) => `• ${c.challenge}: ${c.description}`),
      '',
      'GROUNDED TAKEAWAYS:',
      ...activeReflection.groundedTakeaways.map((g) => `• ${g.takeaway} (${g.grounding})`),
      '',
      'GENTLE NEXT STEPS:',
      ...activeReflection.gentleNextSteps.map((s, idx) => `${idx + 1}. ${s}`),
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      console.warn('Clipboard write permission denied');
    }
  };

  return (
    <div id="weekly-reflection-view" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Header & Week Selector Bar */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            {activeReflection && (
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Reflected
                </span>
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 font-medium tracking-tight">
              Weekly Reflection
            </h1>
            <p className="text-stone-600 text-sm mt-1">
              A grounded review of your week’s themes, emotions, breakthroughs, and gentle next steps.
            </p>
          </div>

          {/* Week Selector Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center bg-white border border-stone-300 rounded-xl p-1 shadow-2xs">
              <button
                id="btn-prev-week"
                onClick={handlePrevWeek}
                title="Previous Week"
                aria-label="Previous Week"
                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <select
                id="select-week-key"
                value={selectedWeekKey}
                onChange={(e) => setSelectedWeekKey(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-medium text-stone-800 px-2 py-1 outline-hidden cursor-pointer"
              >
                {selectableWeeks.map((w) => (
                  <option key={w.weekKey} value={w.weekKey}>
                    {w.displayRange} {w.isCurrentWeek ? '(Current)' : ''} — {w.entryCount} {w.entryCount === 1 ? 'entry' : 'entries'}
                  </option>
                ))}
              </select>
              <button
                id="btn-next-week"
                onClick={handleNextWeek}
                title="Next Week"
                aria-label="Next Week"
                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {activeReflection && (
              <button
                id="btn-regenerate-weekly"
                onClick={() => onGenerateWeekly(selectedWeekKey, true)}
                disabled={isGenerating || weekEntries.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium bg-white text-stone-700 border border-stone-300 hover:bg-stone-100 disabled:opacity-50 rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Synthesizing...' : 'Regenerate'}
              </button>
            )}
          </div>
        </div>

        {/* Selected Week Status Bar */}
        <div className="mt-4 pt-4 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-stone-600">
          <div className="flex items-center gap-2">
            <span className="font-medium text-stone-800">{currentWeekRange.displayRange}</span>
            <span className="text-stone-400">•</span>
            <span>
              {weekEntries.length} {weekEntries.length === 1 ? 'reflection entry' : 'reflection entries'} recorded
            </span>
          </div>

          {activeReflection && (
            <div className="flex items-center gap-3">
              <span className="text-stone-500 text-xs">
                Reflected on {new Date(activeReflection.generatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              <button
                id="btn-copy-weekly"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 cursor-pointer font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-500" />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Notice Banner */}
      {error && (
        <div id="weekly-error-banner" className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Synthesis Notice</p>
            <p className="text-red-700 text-xs mt-0.5">{error}</p>
          </div>
          <button
            onClick={onClearError}
            className="text-xs text-red-600 hover:text-red-900 font-medium cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {weekEntries.length === 0 ? (
        /* Empty State: No entries written in this selected week */
        <div id="weekly-empty-week" className="bg-white border border-stone-200 rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto border border-amber-200/70">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-serif font-medium text-stone-900">No reflections in this week yet</h3>
            <p className="text-sm text-stone-600">
              You haven’t recorded any journal entries during {currentWeekRange.displayRange}. Write a reflection to unlock your weekly synthesis.
            </p>
          </div>
          <div className="pt-2">
            <button
              id="btn-write-entry-empty"
              onClick={() => onNavigateToJournal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer shadow-xs"
            >
              <BookOpen className="w-4 h-4" />
              Write a Reflection
            </button>
          </div>
        </div>
      ) : !activeReflection ? (
        /* Ready to Generate State */
        <div id="weekly-ready-to-generate" className="bg-white border border-stone-200 rounded-2xl p-8 sm:p-10 shadow-2xs space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="space-y-2 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                Ready to Synthesize
              </span>
              <h2 className="text-xl sm:text-2xl font-serif text-stone-900 font-medium">
                Synthesize {currentWeekRange.displayRange}
              </h2>
              <p className="text-sm text-stone-600 max-w-xl">
                MindMirror will analyze your {weekEntries.length} {weekEntries.length === 1 ? 'reflection' : 'reflections'} from this week to discover overarching themes, emotional journeys, breakthroughs, and grounded takeaways.
              </p>
            </div>

            <button
              id="btn-generate-weekly-primary"
              onClick={() => onGenerateWeekly(selectedWeekKey, false)}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 shadow-sm shrink-0"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Synthesizing Reflection...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Weekly Reflection</span>
                </>
              )}
            </button>
          </div>

          {/* Week's Entries Preview Pills */}
          <div className="pt-4 border-t border-stone-100">
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Entries included in this synthesis ({weekEntries.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {weekEntries.map((e) => (
                <div
                  key={e.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700"
                >
                  <BookOpen className="w-3.5 h-3.5 text-stone-400" />
                  <span className="font-medium text-stone-800">{e.title || 'Untitled Entry'}</span>
                  <span className="text-stone-400">
                    ({new Date(e.createdAt || e.updatedAt).toLocaleDateString(undefined, { weekday: 'short' })})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Full Synthesized Weekly Reflection View */
        <div id="weekly-active-synthesis" className="space-y-8">
          {/* 1. Executive Summary */}
          <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">
              <Compass className="w-4 h-4 text-amber-700" />
              <span>Weekly Executive Summary</span>
            </div>
            <p className="text-base sm:text-lg text-stone-800 leading-relaxed font-serif">
              "{activeReflection.summary}"
            </p>
          </div>

          {/* 2. Main Themes */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-800" />
              <h2 className="text-lg sm:text-xl font-serif font-medium text-stone-900">
                Core Themes Explored
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeReflection.mainThemes.map((theme, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-base font-semibold text-stone-900">{theme.title}</h3>
                    <p className="text-sm text-stone-600 mt-1 leading-relaxed">{theme.description}</p>
                  </div>

                  {theme.evidence && theme.evidence.length > 0 && (
                    <div className="pt-3 border-t border-stone-100 space-y-2">
                      {theme.evidence.map((ev, eIdx) => (
                        <div key={eIdx} className="bg-amber-50/60 border border-amber-200/60 rounded-lg p-2.5 text-xs text-stone-700 space-y-1">
                          <div className="flex items-start gap-1.5 text-amber-900">
                            <Quote className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-700" />
                            <span className="italic font-medium">"{ev.evidenceQuote}"</span>
                          </div>
                          {ev.observation && (
                            <p className="text-stone-600 pl-5 text-2xs">{ev.observation}</p>
                          )}
                          {ev.sourceEntryTitle && (
                            <div className="pl-5 pt-0.5">
                              <span className="inline-block px-1.5 py-0.5 bg-white border border-stone-200 rounded text-3xs font-medium text-stone-600">
                                {ev.sourceEntryTitle}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 3. Emotional Patterns & Progress Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Emotional Patterns */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-700" />
                <h2 className="text-lg font-serif font-medium text-stone-900">
                  Emotional Patterns
                </h2>
              </div>

              <div className="space-y-3">
                {activeReflection.emotionalPatterns.map((pat, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                        {pat.emotion}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{pat.description}</p>
                    {pat.evidence && pat.evidence.length > 0 && (
                      <div className="pt-2 border-t border-stone-100">
                        <p className="text-xs italic text-stone-700 bg-stone-50 p-2 rounded-lg border border-stone-200/70">
                          "{pat.evidence[0].evidenceQuote}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Progress and Achievements */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-700" />
                <h2 className="text-lg font-serif font-medium text-stone-900">
                  Progress & Milestones
                </h2>
              </div>

              <div className="space-y-3">
                {activeReflection.progressAndAchievements.map((prog, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <h4 className="text-sm font-semibold text-stone-900">{prog.achievement}</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{prog.description}</p>
                    {prog.evidence && prog.evidence.length > 0 && (
                      <div className="pt-2 border-t border-stone-100">
                        <p className="text-xs italic text-stone-700 bg-emerald-50/40 p-2 rounded-lg border border-emerald-200/60">
                          "{prog.evidence[0].evidenceQuote}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* 4. Challenges & Recurring Threads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Challenges */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-stone-700" />
                <h2 className="text-lg font-serif font-medium text-stone-900">
                  Challenges Faced
                </h2>
              </div>

              <div className="space-y-3">
                {activeReflection.challenges.map((ch, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs space-y-2"
                  >
                    <h4 className="text-sm font-semibold text-stone-900">{ch.challenge}</h4>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{ch.description}</p>
                    {ch.evidence && ch.evidence.length > 0 && (
                      <div className="pt-2 border-t border-stone-100">
                        <p className="text-xs italic text-stone-700 bg-stone-50 p-2 rounded-lg border border-stone-200/70">
                          "{ch.evidence[0].evidenceQuote}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Recurring Memory Threads */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-700" />
                <h2 className="text-lg font-serif font-medium text-stone-900">
                  Life Patterns & Memory Threads
                </h2>
              </div>

              <div className="space-y-3">
                {activeReflection.recurringThreads.length > 0 ? (
                  activeReflection.recurringThreads.map((th, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs space-y-1.5"
                    >
                      <h4 className="text-sm font-semibold text-amber-900">{th.threadTitle}</h4>
                      <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{th.connection}</p>
                    </div>
                  ))
                ) : (
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs text-stone-500">
                    No recurring memory threads connected to this week yet.
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* 5. Grounded Takeaways & Gentle Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grounded Takeaways */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-800" />
                <h3 className="text-base sm:text-lg font-serif font-medium text-stone-900">
                  Grounded Takeaways
                </h3>
              </div>
              <ul className="space-y-3">
                {activeReflection.groundedTakeaways.map((take, idx) => (
                  <li key={idx} className="bg-white border border-stone-200/80 rounded-xl p-3.5 text-xs sm:text-sm space-y-1">
                    <p className="font-semibold text-stone-900">{take.takeaway}</p>
                    <p className="text-stone-600 text-2xs sm:text-xs">{take.grounding}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Gentle Next Steps */}
            <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-amber-800" />
                <h3 className="text-base sm:text-lg font-serif font-medium text-stone-900">
                  Gentle Next Steps
                </h3>
              </div>
              <ul className="space-y-3">
                {activeReflection.gentleNextSteps.map((step, idx) => (
                  <li key={idx} className="bg-white border border-amber-200/80 rounded-xl p-3.5 text-xs sm:text-sm flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-stone-800 font-medium leading-relaxed">{step}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-200 text-xs text-stone-500">
            <div>
              <span>Analyzed {activeReflection.entriesAnalyzedCount} reflection {activeReflection.entriesAnalyzedCount === 1 ? 'entry' : 'entries'}</span>
              {activeReflection.modelUsed && <span> • Model: {activeReflection.modelUsed}</span>}
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-delete-reflection"
                onClick={() => onDeleteWeekly(activeReflection.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete weekly reflection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
