import React, { useState, useMemo } from 'react';
import { Search, Calendar, Trash2, Tag, ChevronRight, MessageSquareText } from 'lucide-react';
import type { JournalEntry } from '../types.ts';

interface SidebarHistoryProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  isLoading: boolean;
  onSwitchToWorkspace?: () => void;
}

export const SidebarHistory: React.FC<SidebarHistoryProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onDeleteEntry,
  isLoading,
  onSwitchToWorkspace,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    entries.forEach((entry) => {
      entry.tags?.forEach((t) => tagsSet.add(t));
    });
    return Array.from(tagsSet);
  }, [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.turns.some((t) => t.content.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTag = !selectedTag || entry.tags?.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [entries, searchQuery, selectedTag]);

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <aside id="history-sidebar" className="w-full md:w-80 lg:w-96 flex flex-col border-r border-stone-200 bg-stone-50/70 h-full">
      {/* Search Header */}
      <div className="p-4 border-b border-stone-200 bg-white/50 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
            Journal History ({entries.length})
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-stone-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="entry-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reflections & keywords..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-700 text-stone-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-600 hover:text-stone-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2 py-0.5 rounded-md font-medium shrink-0 transition-colors ${
                selectedTag === null
                  ? 'bg-amber-800 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-2 py-0.5 rounded-md font-medium shrink-0 flex items-center gap-1 transition-colors ${
                  selectedTag === tag
                    ? 'bg-amber-800 text-white'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Tag className="w-2.5 h-2.5" />
                <span>{tag}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entry List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-stone-600 space-y-2">
            <div className="w-5 h-5 border-2 border-amber-800/20 border-t-amber-800 rounded-full animate-spin" />
            <span className="text-xs">Loading isolated entries...</span>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-12 text-center px-4">
            <p className="text-xs font-medium text-stone-600 mb-1">
              {searchQuery || selectedTag ? 'No matching reflections found' : 'No reflections yet'}
            </p>
            <p className="text-[11px] text-stone-600">
              {searchQuery || selectedTag
                ? 'Try a different search keyword or tag filter.'
                : 'Click "+ New Reflection" above to begin your private journal.'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = entry.id === selectedEntryId;
            const firstUserTurn = entry.turns.find((t) => t.role === 'user');
            const previewText = entry.summary || firstUserTurn?.content || 'Empty entry';

            return (
              <div
                key={entry.id}
                id={`entry-card-${entry.id}`}
                onClick={() => onSelectEntry(entry)}
                className={`group relative p-3 rounded-xl transition-all cursor-pointer border text-left ${
                  isSelected
                    ? 'bg-white border-amber-300/80 shadow-xs ring-1 ring-amber-200/50'
                    : 'bg-white/70 hover:bg-white border-stone-200/80 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-medium text-xs sm:text-sm text-stone-900 line-clamp-1 flex-1">
                    {entry.title || 'Untitled Reflection'}
                  </h4>
                  <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-stone-600">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(entry.updatedAt || entry.createdAt)}</span>
                  </div>
                </div>

                <p className="text-[11px] text-stone-600 line-clamp-2 mb-2 leading-relaxed">
                  {previewText}
                </p>

                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded font-medium">
                      <MessageSquareText className="w-2.5 h-2.5" />
                      {entry.turns.length} {entry.turns.length === 1 ? 'turn' : 'turns'}
                    </span>
                    {entry.tags?.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="bg-amber-50 text-amber-900 border border-amber-100 px-1.5 py-0.5 rounded font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                    {(entry.tags?.length || 0) > 2 && (
                      <span className="text-stone-600">+{entry.tags.length - 2}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {confirmDeleteId === entry.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            onDeleteEntry(entry.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-semibold hover:bg-rose-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1.5 py-0.5 bg-stone-200 text-stone-700 rounded text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(entry.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-stone-600 hover:text-rose-600 rounded transition-opacity"
                        title="Delete reflection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-stone-600 ${isSelected ? 'text-amber-800' : ''}`}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedEntryId && onSwitchToWorkspace && (
        <div className="md:hidden p-3 border-t border-stone-200 bg-white">
          <button
            id="mobile-open-workspace-btn"
            onClick={onSwitchToWorkspace}
            className="w-full py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <span>Open Workspace</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
