import React from 'react';
import { Home, BookOpen, Layers, ShieldCheck, Settings, Calendar } from 'lucide-react';
import type { AppView } from '../types.ts';

interface MobileBottomNavProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onSelectView,
}) => {
  const NAV_ITEMS: { id: AppView; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'weekly', label: 'Weekly', icon: Calendar },
    { id: 'threads', label: 'Threads', icon: Layers },
    { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden border-t border-stone-200 bg-white/95 backdrop-blur-md shrink-0 py-1.5 px-1 z-30"
    >
      <div className="grid grid-cols-6 gap-0.5 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => onSelectView(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer min-h-[44px] ${
                isActive
                  ? 'text-amber-700 font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 ${isActive ? 'text-amber-700 scale-105' : 'text-stone-400'}`} />
              <span className="text-[9px] sm:text-[10px] tracking-tight truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
