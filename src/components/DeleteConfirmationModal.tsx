import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import type { JournalEntry } from '../types.ts';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  entry: JournalEntry | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  entry,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  // Handle ESC key to dismiss dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen || !entry) return null;

  const turnsCount = entry.turns?.length || 0;
  const entryTitle = entry.title?.trim() || 'Untitled Reflection';
  const entryDate = new Date(entry.updatedAt || entry.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      id="delete-confirmation-dialog-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={() => {
        if (!isDeleting) onCancel();
      }}
      role="presentation"
    >
      <div
        id="delete-confirmation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="p-6 pb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              id="delete-dialog-icon-container"
              className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-rose-600"
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="delete-dialog-title" className="text-base font-serif font-semibold text-stone-900">
                Delete Reflection?
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                This action is permanent and cannot be reversed.
              </p>
            </div>
          </div>

          <button
            id="close-delete-dialog-btn"
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors disabled:opacity-40"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-2">
          {/* Target Reflection Info Card */}
          <div
            id="delete-entry-preview-card"
            className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 mb-3"
          >
            <h4 className="text-xs font-semibold text-stone-800 line-clamp-1 mb-1">
              "{entryTitle}"
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-stone-500">
              <span>{entryDate}</span>
              <span>•</span>
              <span>{turnsCount} {turnsCount === 1 ? 'turn' : 'turns'}</span>
              {entry.tags && entry.tags.length > 0 && (
                <>
                  <span>•</span>
                  <span>{entry.tags.length} tags</span>
                </>
              )}
            </div>
          </div>

          <p id="delete-dialog-description" className="text-xs text-stone-600 leading-relaxed">
            Deleting this reflection will permanently erase the full conversation history, all reflection turns, and any associated AI insights from your private Firestore database.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-stone-50/70 border-t border-stone-200/70 flex items-center justify-end gap-2.5">
          <button
            id="cancel-delete-btn"
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            id="confirm-delete-btn"
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Reflection</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
