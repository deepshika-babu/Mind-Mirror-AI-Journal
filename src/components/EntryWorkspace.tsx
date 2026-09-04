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
} from 'lucide-react';
import type { JournalEntry, JournalTurn, ReflectionMode } from '../types.ts';

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
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

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
    }
  }, [entry?.id, entry?.title]);

  useEffect(() => {
    turnsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entry?.turns.length, isGenerating]);

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
            className="md:hidden mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-700 bg-white shadow-2xs hover:bg-stone-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Reflections List</span>
          </button>
        )}
      </div>
    );
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptToSend = inputPrompt.trim();
    if (!promptToSend || isGenerating) return;

    // We do NOT clear the input until the submission initiates properly
    onClearError();
    try {
      await onSendMessage(promptToSend, selectedMode);
      setInputPrompt('');
    } catch {
      // If error happens, input remains preserved in state!
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTurnId(id);
    setTimeout(() => setCopiedTurnId(null), 2000);
  };

  const handleSaveTitle = async () => {
    if (titleDraft.trim() && titleDraft !== entry.title) {
      await onUpdateEntryMeta({ title: titleDraft.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleAddTag = async () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !entry.tags.includes(trimmed)) {
      const updatedTags = [...entry.tags, trimmed];
      await onUpdateEntryMeta({ tags: updatedTags });
      setNewTagInput('');
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = entry.tags.filter((t) => t !== tagToRemove);
    await onUpdateEntryMeta({ tags: updatedTags });
  };

  const handleExport = () => {
    const dateStr = new Date(entry.createdAt).toLocaleDateString();
    let mdContent = `# ${entry.title}\n*Date: ${dateStr}*\n*Tags: ${entry.tags.join(', ')}*\n\n---\n\n`;

    entry.turns.forEach((turn) => {
      const speaker = turn.role === 'user' ? '### 👤 Reflection' : `### ✦ Gemini (${turn.modelUsed || 'Gemini 3.6 Flash'})`;
      mdContent += `${speaker} (${new Date(turn.timestamp).toLocaleTimeString()})\n\n${turn.content}\n\n---\n\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entry.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.md`;
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

          {/* Action Bar */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-stone-500 hidden sm:flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(entry.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>

            <button
              id="export-entry-btn"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              title="Download entry as Markdown"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>Export</span>
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
          <div className="py-8 max-w-xl mx-auto text-center space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-stone-900 mb-1">
                Begin this reflection session
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                Write down what is currently on your mind. You can share raw thoughts, recent triumphs, or nagging worries. Gemini will listen and provide thoughtful counsel.
              </p>
            </div>

            {/* Prompt Seeds */}
            <div className="text-left space-y-2 pt-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                Inspiration Starters
              </span>
              <div className="grid grid-cols-1 gap-2">
                {PROMPT_SEEDS.map((seed, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputPrompt(seed);
                      textareaRef.current?.focus();
                    }}
                    className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-amber-50/50 hover:border-amber-200 text-left text-xs text-stone-700 transition-all cursor-pointer"
                  >
                    "{seed}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          entry.turns.map((turn) => {
            const isUser = turn.role === 'user';
            const isCopied = copiedTurnId === turn.id;

            return (
              <div
                key={turn.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl mx-auto w-full`}
              >
                {/* Header label */}
                <div className="flex items-center gap-2 mb-1.5 px-1 text-[11px] text-stone-600">
                  {isUser ? (
                    <>
                      <span className="font-medium text-stone-700">You (Journal Reflection)</span>
                      {showTimestamps && (
                        <>
                          <span>•</span>
                          <span>{new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span className="font-medium text-amber-800">
                        Gemini ({turn.modelUsed || 'gemini-3.6-flash'})
                      </span>
                      {showTimestamps && (
                        <>
                          <span>•</span>
                          <span>{new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                      )}
                      {turn.mode && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded text-[10px]">
                          {turn.mode}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Content Card */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl w-full text-sm leading-relaxed relative group ${
                    isUser
                      ? 'bg-stone-100 text-stone-900 border border-stone-200/80 rounded-tr-xs'
                      : 'bg-amber-50/40 text-stone-900 border border-amber-200/70 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap font-sans text-stone-900">{turn.content}</div>
                  ) : (
                    <div className="space-y-3 prose prose-stone max-w-none text-stone-900">
                      <Markdown>{turn.content}</Markdown>
                    </div>
                  )}

                  {/* Copy Button */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopyText(turn.id, turn.content)}
                      className="p-1.5 rounded-md bg-white/80 border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-white shadow-2xs cursor-pointer"
                      title="Copy content"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isGenerating && (
          <div className="max-w-3xl mx-auto w-full flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin text-amber-600" />
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 text-xs text-stone-600 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              <span>Gemini is considering your reflection and synthesizing counsel...</span>
            </div>
          </div>
        )}

        {/* Guaranteed Transaction Verification & Explicit Error Banner */}
        {activeError && (
          <div
            id="transaction-error-banner"
            className="max-w-3xl mx-auto w-full p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-3 shadow-xs"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Persistence & Generation Notice</p>
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer text-xs sm:text-sm active:scale-95"
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
    </div>
  );
};
