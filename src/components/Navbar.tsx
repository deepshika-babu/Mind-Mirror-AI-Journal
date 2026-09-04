import React from 'react';
import {
  BookOpen,
  Home,
  ShieldCheck,
  Settings,
  Plus,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import type { UserProfile, AppView } from '../types.ts';

interface NavbarProps {
  user: UserProfile;
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  onNewEntry: () => void;
  onSignOut: () => void;
  isSaving?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentView,
  onSelectView,
  onNewEntry,
  onSignOut,
  isSaving = false,
}) => {
  const NAV_ITEMS: { id: AppView; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header id="app-navbar" className="border-b border-stone-200 bg-white/95 backdrop-blur-sm sticky top-0 z-30 shrink-0">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectView('home')}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-700 text-white flex items-center justify-center shadow-xs group-hover:bg-amber-800 transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-semibold text-stone-900 tracking-tight text-base sm:text-lg">
                  MindMirror
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Firestore Active
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Center Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-stone-100/80 p-1 rounded-xl border border-stone-200/80">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onSelectView(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-700' : 'text-stone-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Center Saving Status (Tablet/Desktop) */}
        {isSaving && (
          <div className="hidden lg:flex items-center gap-2 text-xs text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
            <span>Syncing to Firestore...</span>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="new-entry-btn"
            onClick={onNewEntry}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs sm:text-sm font-medium transition-all shadow-xs cursor-pointer active:scale-95"
            title="Start a new reflection entry"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">New Reflection</span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-stone-200">
            <button
              onClick={() => onSelectView('settings')}
              title="View Account Settings"
              className="flex items-center gap-2 text-left cursor-pointer p-0.5 rounded-lg hover:bg-stone-100 transition-colors"
            >
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
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-medium text-stone-900 leading-tight">
                  {user.displayName}
                </span>
                <span className="text-[10px] text-stone-600 truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>
            </button>

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
