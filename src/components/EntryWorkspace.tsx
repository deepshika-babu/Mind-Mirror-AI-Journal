import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  Tag as TagIcon,
  Download,
  AlertCircle,
  Lightbulb,
  Edit2,
  FileText,
  Clock,
  RotateCcw,
  Compass,
  ArrowLeft,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import type { JournalEntry, JournalTurn, ReflectionMode, ReflectionInsight } from '../types.ts';
import { requestEntryInsights } from '../lib/geminiClient.ts';
import { fetchUserInsight } from '../lib/firebase.ts';
import { ReflectionInsightCard } from './ReflectionInsightCard.tsx';

interface EntryWorkspaceProps {
  entry: JournalEntry | null;
  onSendMessage: (prompt: string, mode: ReflectionMode) => Promise<void>;
  onUpdateEntryMeta: (updates: Partial<JournalEntry>) => Promise<void>;
  isGenerating: boolean;
  activeError: string | null;
  onClearError: () => void;
  onRetry: () => void;
  onBackToList?: () => void;
  initialMode?: ReflectionMode;
  showTimestamps?: boolean;
}

const REFLECTION_MODES: {
  id: ReflectionMode;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: 'reflect',
    label: 'Reflect & Mirror',
    description: 'Empathetic cognitive mirroring and open contemplation',
    icon: '🪞',
  },
  {
    id: 'summarize',
    label: 'Synthesize & Summarize',
    description: 'Executive takeaways, emotional patterns, and themes',
    icon: '📋',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm Perspectives',
    description: 'Fresh angles, creative solutions, and gentle reframes',
    icon: '💡',
  },
  {
    id: 'action_plan',
    label: 'Action & Next Steps',
    description: 'Mindful, pragmatic next micro-actions',
    icon: '🎯',
  },
];

const PROMPT_SEEDS = [
  'What moment felt most energizing or draining today, and what triggered it?',
  'What is a belief or assumption I have been holding that might need re-evaluating?',
  'What is a quiet victory or moment of progress I have not given myself credit for?',
  'Describe a dilemma or friction you are navigating right now and how it makes you feel.',
];

export const EntryWorkspace: React.FC<EntryWorkspaceProps> = ({
  entry,
  onSendMessage,
  onUpdateEntryMeta,
  isGenerating,
  activeError,
  onClearError,
  onRetry,
  onBackToList,
  initialMode = 'reflect',
  showTimestamps = true,
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedMode, setSelectedMode] = useState<ReflectionMode>(initialMode);
  const [activeTab, setActiveTab] = useState<'conversation' | 'insights'>('conversation');
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  // Phase 2A: Insight state
  const [insight, setInsight] = useState<ReflectionInsight | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  useEffect(() => {
    if (initialMode) {
      setSelectedMode(initialMode);
    }
  }, [initialMode]);

  const turnsEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (entry) {
      setTitleDraft(entry.title);
      setInsightError(null);

      // Load cached insight if exists
      if (entry.userId && entry.id) {
        let isMounted = true;
        fetchUserInsight(entry.userId, entry.id).then((saved) => {
          if (isMounted) {
            setInsight((saved as ReflectionInsight) || null);
          }
        });
        return () => {
          isMounted = false;
        };
      }
    } else {
      setInsight(null);
    }
  }, [entry?.id, entry?.userId, entry?.title]);

  useEffect(() => {
    if (activeTab === 'conversation') {
      turnsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entry?.turns.length, isGenerating, activeTab]);

  if (!entry) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-stone-50/50">
        <div className="w-12 h-12 rounded-2xl bg-amber-100/70 text-amber-800 flex items-center justify-center mb-4">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-serif font-medium text-stone-800 mb-2">No Reflection Selected</h3>
        <p className="text-sm text-stone-600 max-w-sm">
          Select a previous journal entry from the history panel or create a new reflection to begin conversing with Gemini.
        </p>
        {onBackToList && (
          <button
            id="empty-back-to-list-btn"
            onClick={onBackToList}
            className="mt-6 md:hidden px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-medium"
          >
            Open Reflections List
          </button>
        )}
      </div>
    );
  }

  const userTurnsCount = entry.turns.filter((t) => t.role === 'user').length;

  const handleExploreInsights = async (forceRegenerate: boolean = false) => {
    if (!entry || isLoadingInsight) return;
    setIsLoadingInsight(true);
    setInsightError(null);
    setActiveTab('insights');

    try {
      const generated = await requestEntryInsights(entry.id, forceRegenerate);
      setInsight(generated);
    } catch (err: any) {
      console.error('Failed to explore reflection insights:', err);
      setInsightError(err?.message || 'Failed to explore reflection insights. Please try again.');
    } finally {
      setIsLoadingInsight(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isGenerating) return;

    const textToSend = inputPrompt.trim();
    setInputPrompt('');
    await onSendMessage(textToSend, selectedMode);

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSaveTitle = async () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== entry.title) {
      await onUpdateEntryMeta({ title: trimmed });
    }
    setIsEditingTitle(false);
  };

  const handleAddTag = async () => {
    const trimmed = newTagInput.trim().replace(/^#/, '');
    if (trimmed && !entry.tags.includes(trimmed)) {
      await onUpdateEntryMeta({ tags: [...entry.tags, trimmed] });
      setNewTagInput('');
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const nextTags = entry.tags.filter((t) => t !== tagToRemove);
    await onUpdateEntryMeta({ tags: nextTags });
  };

  const handleCopyTurn = (turn: JournalTurn) => {
    navigator.clipboard.writeText(turn.content);
    setCopiedTurnId(turn.id);
    setTimeout(() => setCopiedTurnId(null), 2000);
  };

  const handleExport = () => {
    const mdContent = `# ${entry.title || 'Journal Reflection'}
*Date: ${new Date(entry.createdAt).toLocaleDateString()} | Updated: ${new Date(entry.updatedAt).toLocaleDateString()}*
*Tags: ${entry.tags.map((t) => `#${t}`).join(', ') || 'None'}*

${entry.summary ? `> **Core Insight:** ${entry.summary}\n\n` : ''}---

${entry.turns
  .map(
    (turn, idx) => `### ${turn.role === 'user' ? 'You' : 'MindMirror'} (${new Date(turn.timestamp).toLocaleTimeString()})
${turn.content}
`
  )
  .join('\n\n---\n\n')}
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${entry.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'reflection'}.md`);
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="entry-workspace" className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Workspace Header */}
      <div className="p-4 sm:px-8 border-b border-stone-200 bg-white flex flex-col gap-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Title Area */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {onBackToList && (
              <button
                id="mobile-back-to-list-btn"
                onClick={onBackToList}
                className="md:hidden p-1.5 -ml-1 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors shrink-0"
                title="Back to reflections list"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {isEditingTitle ? (
              <div className="flex items-center gap-2 w-full max-w-md">
                <input
                  id="edit-title-input"
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  autoFocus
                  className="text-lg font-serif font-semibold text-stone-900 border-b-2 border-amber-700 bg-transparent px-1 py-0.5 focus:outline-none w-full"
                />
                <button
                  onClick={handleSaveTitle}
                  className="text-xs px-2 py-1 bg-amber-700 text-white rounded font-medium"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0 group">
                <h2
                  id="entry-title-heading"
                  className="text-lg sm:text-xl font-serif font-semibold text-stone-900 truncate cursor-pointer hover:text-amber-800 transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                  title="Click to edit title"
                >
                  {entry.title || 'Untitled Reflection'}
                </h2>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded transition-opacity"
                  title="Rename reflection"
                  aria-label="Rename reflection"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Action Bar & Tab Switcher */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* View Switcher: Conversation vs Insights */}
            <div className="flex items-center p-1 bg-stone-100/90 rounded-xl border border-stone-200 text-xs font-medium">
              <button
                id="tab-conversation-btn"
                type="button"
                onClick={() => setActiveTab('conversation')}
                className={`px-3 py-1.5 min-h-[36px] rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'conversation'
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-stone-500" />
                <span>Conversation</span>
                {entry.turns.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200/80 text-stone-700 font-mono">
                    {entry.turns.length}
                  </span>
                )}
              </button>

              <button
                id="tab-insights-btn"
                type="button"
                onClick={() => setActiveTab('insights')}
                className={`px-3 py-1.5 min-h-[36px] rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'insights'
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-amber-700" />
                <span>Insights</span>
                {insight && (
                  <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" title="Insights ready" />
                )}
              </button>
            </div>

            {/* Quick Explore Insights Trigger */}
            <button
              id="explore-insights-header-btn"
              type="button"
              onClick={() => handleExploreInsights(false)}
              disabled={isLoadingInsight || userTurnsCount === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-medium text-amber-900 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={
                userTurnsCount === 0
                  ? 'Write a reflection turn first to explore insights'
                  : 'Extract themes, emotions, and grounded evidence'
              }
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-700 ${isLoadingInsight ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLoadingInsight ? 'Analyzing...' : 'Explore Insights'}</span>
            </button>

            <button
              id="export-entry-btn"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              title="Download entry as Markdown"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Tags & Meta Row */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-stone-400 flex items-center gap-1">
            <TagIcon className="w-3 h-3" />
            Tags:
          </span>
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium text-[11px] group"
            >
              #{tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="text-stone-400 hover:text-rose-600 ml-0.5 text-xs font-bold leading-none"
                title={`Remove tag #${tag}`}
              >
                ×
              </button>
            </span>
          ))}

          {showTagInput ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="tag name..."
                autoFocus
                className="w-24 text-[11px] px-1.5 py-0.5 border border-amber-600 rounded bg-white text-stone-800 focus:outline-none"
              />
              <button
                onClick={handleAddTag}
                className="text-[10px] px-1.5 py-0.5 bg-amber-700 text-white rounded font-medium"
              >
                Add
              </button>
              <button
                onClick={() => setShowTagInput(false)}
                className="text-[10px] text-stone-500 hover:text-stone-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowTagInput(true)}
              className="text-[11px] text-stone-500 hover:text-amber-800 font-medium transition-colors"
            >
              + Add tag
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: CONVERSATION TAB */}
      {activeTab === 'conversation' && (
        <>
          {/* Mode Selection Pills */}
          <div className="px-4 sm:px-8 py-2.5 bg-stone-50/80 border-b border-stone-200 flex items-center gap-2 overflow-x-auto shrink-0 no-scrollbar">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Compass className="w-3 h-3 text-amber-700" />
              Lens:
            </span>
            {REFLECTION_MODES.map((mode) => {
              const isActive = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                  }`}
                  title={mode.description}
                >
                  <span>{mode.icon}</span>
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Conversation / Turn History Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
            {entry.turns.length === 0 ? (
              <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-xl text-stone-800 font-medium">
                    Begin Your Reflection
                  </h3>
                  <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                    Write freely about your day, emotions, challenges, or thoughts. MindMirror will listen, synthesize themes, and gently mirror cognitive insights back to you.
                  </p>
                </div>

                {/* Prompt Seeds */}
                <div className="pt-4 space-y-2 text-left">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-700" />
                    Contemplative Seeds:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PROMPT_SEEDS.map((seed, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInputPrompt(seed)}
                        className="p-3 text-xs text-stone-700 bg-stone-50/80 hover:bg-amber-50/60 border border-stone-200/80 hover:border-amber-200 rounded-xl text-left transition-all cursor-pointer leading-relaxed"
                      >
                        &ldquo;{seed}&rdquo;
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {entry.turns.map((turn, index) => {
                  const isUser = turn.role === 'user';
                  return (
                    <div
                      key={turn.id || index}
                      id={`turn-${turn.id}`}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1.5 px-1">
                        <span className="text-xs font-serif font-semibold text-stone-800">
                          {isUser ? 'You' : 'MindMirror'}
                        </span>
                        {showTimestamps && (
                          <span className="text-[10px] text-stone-400">
                            {new Date(turn.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                        {!isUser && turn.modelUsed && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-stone-100 text-stone-500 border border-stone-200">
                            {turn.modelUsed}
                          </span>
                        )}
                      </div>

                      <div
                        className={`group relative max-w-2xl rounded-2xl p-4 sm:p-5 text-sm leading-relaxed transition-all ${
                          isUser
                            ? 'bg-amber-700 text-white rounded-tr-xs shadow-xs'
                            : 'bg-stone-50/90 text-stone-900 border border-stone-200/90 rounded-tl-xs shadow-2xs'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{turn.content}</p>
                        ) : (
                          <div className="prose prose-stone prose-sm max-w-none prose-p:my-1.5 prose-ul:my-2 prose-li:my-0.5">
                            <Markdown>{turn.content}</Markdown>
                          </div>
                        )}

                        <div
                          className={`absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                            isUser ? 'text-white/80 hover:text-white' : 'text-stone-400 hover:text-stone-700'
                          }`}
                        >
                          <button
                            onClick={() => handleCopyTurn(turn)}
                            className="p-1 rounded hover:bg-black/10 transition-colors"
                            title="Copy text"
                          >
                            {copiedTurnId === turn.id ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isGenerating && (
                  <div className="flex flex-col items-start max-w-2xl">
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      <span className="text-xs font-serif font-semibold text-stone-800">MindMirror</span>
                      <span className="text-[10px] text-amber-700 animate-pulse">Deeply reflecting...</span>
                    </div>
                    <div className="bg-stone-50 border border-stone-200 rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-2xs w-full">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-600 animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-amber-600 animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 rounded-full bg-amber-600 animate-bounce [animation-delay:0.4s]" />
                        <span className="text-xs text-stone-500 ml-2">Consulting Gemini reflection models...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeError && (
              <div
                id="transaction-error-banner"
                className="max-w-3xl mx-auto w-full p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-3 shadow-xs"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-0.5">Persistence &amp; Generation Notice</p>
                    <p className="text-rose-700 leading-relaxed">{activeError}</p>
                    <p className="text-[11px] text-rose-600 mt-1">
                      Your reflection input draft has been safely preserved below so no thoughts are lost.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-medium text-xs shadow-2xs cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Retry
                  </button>
                  <button
                    onClick={onClearError}
                    className="p-1 text-rose-600 hover:text-rose-900 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            <div ref={turnsEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 sm:p-6 border-t border-stone-200 bg-white shrink-0">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto w-full space-y-2">
              <div className="relative border border-stone-300 rounded-2xl focus-within:border-amber-700 focus-within:ring-1 focus-within:ring-amber-700 bg-white transition-all shadow-xs">
                <textarea
                  id="reflection-input"
                  ref={textareaRef}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Write your reflection (${REFLECTION_MODES.find((m) => m.id === selectedMode)?.label.toLowerCase()} mode)...`}
                  rows={3}
                  disabled={isGenerating}
                  className="w-full p-3.5 sm:p-4 text-sm text-stone-900 placeholder-stone-400 bg-transparent resize-none focus:outline-none"
                />

                <div className="flex items-center justify-between px-3.5 pb-3 pt-1 text-xs text-stone-400 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <span>{inputPrompt.length} / 10,000 chars</span>
                    <span className="hidden sm:inline text-stone-300">•</span>
                    <span className="hidden sm:inline text-stone-400">Press Cmd/Ctrl + Enter to send</span>
                  </div>

                  <button
                    id="send-reflection-btn"
                    type="submit"
                    disabled={!inputPrompt.trim() || isGenerating}
                    className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer text-xs sm:text-sm active:scale-95"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Thinking...</span>
                      </>
                    ) : (
                      <>
                        <span>Send</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </>
      )}

      {/* VIEW 2: INSIGHTS TAB (Phase 2A) */}
      {activeTab === 'insights' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          <div className="max-w-3xl mx-auto">
            {/* Loading State */}
            {isLoadingInsight && (
              <div
                id="insights-loading-card"
                className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-4 shadow-xs"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center animate-spin">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-lg font-semibold text-stone-900">
                    Exploring Reflection Insights
                  </h4>
                  <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                    Reading your reflection turns, validating verbatim quotations, and distilling themes, expressed feelings, and contemplative inquiries...
                  </p>
                </div>
                <div className="flex justify-center gap-1.5 pt-2">
                  <div className="w-2 h-2 rounded-full bg-amber-600 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-amber-600 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-amber-600 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            {/* Error State */}
            {insightError && (
              <div
                id="insights-error-banner"
                className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-3 shadow-xs mb-6"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-0.5">Insight Exploration Notice</p>
                    <p className="text-rose-700 leading-relaxed">{insightError}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleExploreInsights(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-medium text-xs shadow-2xs cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  Retry Analysis
                </button>
              </div>
            )}

            {/* Render Insight Card if Loaded */}
            {!isLoadingInsight && insight && (
              <ReflectionInsightCard
                insight={insight}
                entry={entry}
                onRegenerate={() => handleExploreInsights(true)}
                isRegenerating={isLoadingInsight}
              />
            )}

            {/* Empty / Initial State if No Insight Generated Yet */}
            {!isLoadingInsight && !insight && (
              <div
                id="insights-onboarding-card"
                className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-6 shadow-xs"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 mx-auto flex items-center justify-center">
                  <Compass className="w-7 h-7" />
                </div>
                <div className="space-y-2 max-w-lg mx-auto">
                  <h3 className="font-serif text-xl font-semibold text-stone-900">
                    Explore Evidence-Grounded Insights
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    MindMirror analyzes only this reflection&apos;s written turns to identify underlying themes, expressed feelings, stated intentions, challenges, and contemplative questions.
                  </p>
                  <p className="text-xs text-stone-500 italic">
                    Every observation is strictly anchored in verbatim quotations of what you wrote—never speculative or diagnostic.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    id="explore-insights-primary-btn"
                    type="button"
                    onClick={() => handleExploreInsights(false)}
                    disabled={userTurnsCount === 0}
                    className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>
                      {userTurnsCount === 0
                        ? 'Write a reflection turn first'
                        : 'Explore Insights for this Reflection'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
