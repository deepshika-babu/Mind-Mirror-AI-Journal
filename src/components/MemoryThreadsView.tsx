import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Calendar,
  BookOpen,
  Quote,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type {
  MemoryThread,
  JournalEntry,
  UserProfile,
} from '../types.ts';

interface MemoryThreadsViewProps {
  user: UserProfile;
  entries: JournalEntry[];
  threads: MemoryThread[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  onGenerateThreads: () => void;
  onDeleteThread: (threadId: string) => void;
  onNavigateToJournal: (entryId?: string) => void;
  onClearError: () => void;
}

export const MemoryThreadsView: React.FC<MemoryThreadsViewProps> = ({
  entries,
  threads,
  isLoading,
  isGenerating,
  error,
  onGenerateThreads,
  onDeleteThread,
  onNavigateToJournal,
  onClearError,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});

  // Filter entries that actually have user-written content
  const entriesWithWriting = useMemo(() => {
    return entries.filter((e) => {
      if (!e) return false;
      const hasTurns = Array.isArray(e.turns) && e.turns.some((t) => {
        const content = typeof t.content === 'string' ? t.content : (typeof (t as any).text === 'string' ? (t as any).text : '');
        return content.trim().length > 0;
      });
      const hasTopLevelContent = (
        (typeof e.summary === 'string' && e.summary.trim().length > 0) ||
        (typeof (e as any).content === 'string' && (e as any).content.trim().length > 0) ||
        (typeof (e as any).text === 'string' && (e as any).text.trim().length > 0) ||
        (typeof e.title === 'string' && e.title.trim().length > 0)
      );
      return hasTurns || hasTopLevelContent;
    });
  }, [entries]);

  const hasEnoughEntries = entries.length >= 2 || entriesWithWriting.length >= 2;

  // Filter threads by search query
  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    const query = searchQuery.toLowerCase();
    return threads.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.evidence.some((ev) => ev.quote.toLowerCase().includes(query) || ev.observation.toLowerCase().includes(query)) ||
        t.relatedEntries.some((re) => re.entryTitle.toLowerCase().includes(query))
    );
  }, [threads, searchQuery]);

  const toggleEvidence = (threadId: string) => {
    setExpandedEvidence((prev) => ({
      ...prev,
      [threadId]: !prev[threadId],
    }));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div id="memory-threads-view" className="flex-1 overflow-y-auto bg-stone-100/60 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Section */}
        <header className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
                Memory Threads
              </h1>
              <p className="text-sm text-stone-600 leading-relaxed">
                Uncover recurring themes, dilemmas, and evolutions woven across your past reflections. Every thread is grounded in verbatim quotes from what you wrote.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                id="discover-threads-btn"
                onClick={onGenerateThreads}
                disabled={isGenerating || isLoading || !hasEnoughEntries}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:bg-stone-200 disabled:text-stone-400 text-white text-sm font-medium transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed active:scale-95"
                title={
                  !hasEnoughEntries
                    ? 'Write at least 2 reflection entries to discover memory threads'
                    : 'Discover recurring themes across your reflections'
                }
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Synthesizing Threads...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>{threads.length > 0 ? 'Regenerate Threads' : 'Discover Threads'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Evidence Grounding Guarantee Badge */}
          <div className="mt-6 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Evidence-Grounded Policy:</strong> No hallucinated connections. Themes cite character-for-character quotes from your entries with zero clinical diagnoses.
              </span>
            </div>
            {threads.length > 0 && (
              <span className="text-stone-500 font-medium">
                {threads.length} {threads.length === 1 ? 'thread' : 'threads'} active
              </span>
            )}
          </div>
        </header>

        {/* Error Alert */}
        {error && (
          <div
            id="threads-error-banner"
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 text-sm animate-in fade-in"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Synthesis Notice</p>
                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={onClearError}
              className="text-xs font-semibold underline text-rose-700 hover:text-rose-900 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search & Filter Bar (Only if threads exist) */}
        {threads.length > 0 && (
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="threads-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search threads by theme, keyword, or quote..."
                className="w-full pl-9.5 pr-4 py-2 text-sm bg-transparent placeholder:text-stone-400 text-stone-900 focus:outline-none"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-medium text-stone-500 hover:text-stone-800 px-3 py-1.5 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Loading Spinner / Generating State */}
        {isGenerating && (
          <div
            id="threads-generating-card"
            className="bg-white rounded-3xl border border-amber-200/80 p-8 text-center space-y-4 shadow-xs animate-pulse"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="font-serif text-lg font-semibold text-stone-900">
                Weaving Your Memory Threads
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Analyzing your reflection entries and insights. Finding recurring patterns and validating exact quotes...
              </p>
            </div>
          </div>
        )}

        {/* Not Enough Entries State */}
        {!hasEnoughEntries && (
          <div
            id="threads-not-enough-entries"
            className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center space-y-5 shadow-xs"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 mx-auto flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-amber-600" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="font-serif text-xl font-semibold text-stone-900">
                Begin Journaling to Unlock Threads
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Memory Threads discovers recurring patterns across your entries. You currently have{' '}
                <strong>{entriesWithWriting.length}</strong> written reflection. Write at least <strong>2</strong> reflections to weave cross-entry themes.
              </p>
            </div>
            <button
              id="start-journal-for-threads-btn"
              onClick={() => onNavigateToJournal()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-medium transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <span>Write a Reflection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Has Enough Entries but No Threads Generated Yet */}
        {hasEnoughEntries && !isGenerating && threads.length === 0 && (
          <div
            id="threads-empty-untriggered-state"
            className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center space-y-6 shadow-xs"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 mx-auto flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-amber-600" />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="font-serif text-xl font-semibold text-stone-900">
                Ready to Discover Your Recurring Themes
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                You have <strong>{entriesWithWriting.length}</strong> reflections ready for analysis. Trigger Memory Threads to group related thoughts, ideas, and goals across your journaling journey.
              </p>
            </div>
            <button
              id="trigger-first-discovery-btn"
              onClick={onGenerateThreads}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Discover Memory Threads</span>
            </button>
          </div>
        )}

        {/* Threads List */}
        {!isGenerating && filteredThreads.length > 0 && (
          <div className="space-y-5" id="threads-cards-container">
            {filteredThreads.map((thread, index) => {
              const isEvidenceExpanded = expandedEvidence[thread.id] ?? false;

              return (
                <article
                  key={thread.id}
                  id={`thread-card-${thread.id}`}
                  className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-xs hover:border-amber-200/90 transition-all space-y-5"
                >
                  {/* Thread Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          Thread #{index + 1}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{thread.approximateTimeline.displayText}</span>
                        </div>
                      </div>
                      <h2 className="font-serif text-xl font-semibold text-stone-900 tracking-tight">
                        {thread.title}
                      </h2>
                    </div>

                    <button
                      onClick={() => onDeleteThread(thread.id)}
                      title="Remove this thread"
                      className="self-end sm:self-start p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      aria-label={`Delete thread ${thread.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Thread Description */}
                  <p className="text-sm text-stone-700 leading-relaxed">
                    {thread.description}
                  </p>

                  {/* Related Journal Entries */}
                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <div className="text-xs text-stone-500 font-medium">
                      <span>Related Reflections ({thread.relatedEntries.length}):</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {thread.relatedEntries.map((entry) => (
                        <div
                          key={entry.entryId}
                          id={`thread-${thread.id}-entry-chip-${entry.entryId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-700"
                        >
                          <BookOpen className="w-3 h-3 text-stone-400" />
                          <span className="truncate max-w-[220px]">{entry.entryTitle}</span>
                          <span className="text-[10px] text-stone-400 font-normal">
                            ({formatDate(entry.entryDate)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Supporting Evidence Accordion */}
                  <div className="pt-2 border-t border-stone-100 space-y-3">
                    <button
                      id={`toggle-evidence-btn-${thread.id}`}
                      onClick={() => toggleEvidence(thread.id)}
                      className="w-full flex items-center justify-between py-1.5 text-xs font-semibold text-stone-700 hover:text-amber-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Quote className="w-3.5 h-3.5 text-amber-700" />
                        <span>Supporting Quotes & Evidence ({thread.evidence.length})</span>
                      </div>
                      <div className="flex items-center gap-1 text-stone-500 text-[11px]">
                        <span>{isEvidenceExpanded ? 'Hide' : 'Show details'}</span>
                        {isEvidenceExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {isEvidenceExpanded && (
                      <div className="space-y-3 pt-1 animate-in fade-in">
                        {thread.evidence.map((ev, evIdx) => (
                          <div
                            key={evIdx}
                            className="bg-stone-50/80 rounded-2xl p-3.5 border border-stone-200/80 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500">
                              <span className="font-medium text-stone-700">
                                {ev.entryTitle}
                              </span>
                              <span>{formatDate(ev.entryDate)}</span>
                            </div>

                            <blockquote className="italic text-stone-800 border-l-2 border-amber-600/70 pl-3 py-0.5 font-serif text-sm">
                              "{ev.quote}"
                            </blockquote>

                            <p className="text-stone-600 pl-3 text-[11px]">
                              <strong>Observation:</strong> {ev.observation}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Empty Search Filter State */}
        {!isGenerating && threads.length > 0 && filteredThreads.length === 0 && (
          <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center space-y-3">
            <p className="text-sm text-stone-600">
              No threads found matching "<strong>{searchQuery}</strong>".
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-medium text-amber-800 underline cursor-pointer"
            >
              Clear search query
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
