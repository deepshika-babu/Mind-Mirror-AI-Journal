import React from 'react';
import { BookOpen, Plus, LogOut, Sparkles, CheckCircle2 } from 'lucide-react';
import type { UserProfile } from '../types.ts';

interface NavbarProps {
  user: UserProfile;
  onNewEntry: () => void;
  onSignOut: () => void;
  isSaving?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onNewEntry,
  onSignOut,
  isSaving = false,
}) => {
  return (
    <header id="app-navbar" className="border-b border-stone-200 bg-white/95 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-700 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-semibold text-stone-900 tracking-tight">MindMirror</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Firestore Active
              </span>
            </div>
          </div>
        </div>

        {/* Center Saving Status */}
        {isSaving && (
          <div className="hidden md:flex items-center gap-2 text-xs text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
            <span>Syncing to Firestore...</span>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            id="new-entry-btn"
            onClick={onNewEntry}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs sm:text-sm font-medium transition-all shadow-xs cursor-pointer active:scale-95"
            title="Start a new reflection entry"
          >
            <Plus className="w-4 h-4" />
            <span>New Reflection</span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User Avatar'}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-stone-200 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 font-semibold text-xs flex items-center justify-center">
                {(user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
              </div>
            )}
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-medium text-stone-900 leading-tight">
                {user.displayName}
              </span>
              <span className="text-[10px] text-stone-600 truncate max-w-[130px]">
                {user.email}
              </span>
            </div>

            <button
              id="signout-btn"
              onClick={onSignOut}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
