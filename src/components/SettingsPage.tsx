import React, { useState } from 'react';
import {
  User,
  Shield,
  Download,
  LogOut,
  Sliders,
  Check,
  Compass,
  FileDown,
  Info,
  Sparkles,
} from 'lucide-react';
import type { UserProfile, JournalEntry, ReflectionMode, UserPreferences } from '../types.ts';
import { tokens } from '../lib/designTokens.ts';

interface SettingsPageProps {
  user: UserProfile;
  entries: JournalEntry[];
  preferences: UserPreferences;
  onUpdatePreferences: (newPrefs: Partial<UserPreferences>) => void;
  onSignOut: () => void;
}

const MODES: { id: ReflectionMode; label: string; icon: string; desc: string }[] = [
  {
    id: 'reflect',
    label: 'Reflect & Mirror',
    icon: '🪞',
    desc: 'Empathetic cognitive mirroring and open contemplation',
  },
  {
    id: 'summarize',
    label: 'Synthesize & Summarize',
    icon: '📋',
    desc: 'Executive takeaways, emotional patterns, and themes',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm Perspectives',
    icon: '💡',
    desc: 'Fresh angles, creative solutions, and gentle reframes',
  },
  {
    id: 'action_plan',
    label: 'Action & Next Steps',
    icon: '🎯',
    desc: 'Mindful, pragmatic next micro-actions',
  },
];

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  entries,
  preferences,
  onUpdatePreferences,
  onSignOut,
}) => {
  const [copiedUid, setCopiedUid] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleCopyUid = () => {
    navigator.clipboard.writeText(user.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleExportAllMarkdown = () => {
    if (entries.length === 0) {
      setExportNotice('No reflections to export.');
      setTimeout(() => setExportNotice(null), 3000);
      return;
    }

    let archive = `# MindMirror Journal Archive\n`;
    archive += `User: ${user.displayName || user.email}\n`;
    archive += `Export Date: ${new Date().toLocaleString()}\n`;
    archive += `Total Reflections: ${entries.length}\n\n`;
    archive += `========================================\n\n`;

    entries.forEach((entry, idx) => {
      archive += `## Reflection #${idx + 1}: ${entry.title}\n`;
      archive += `*Created: ${new Date(entry.createdAt).toLocaleString()}*\n`;
      archive += `*Tags: ${entry.tags?.join(', ') || 'None'}*\n\n`;
      if (entry.summary) {
        archive += `> **Summary**: ${entry.summary}\n\n`;
      }

      entry.turns?.forEach((t) => {
        const roleName = t.role === 'user' ? '👤 Reflection' : `✦ Gemini (${t.modelUsed || 'AI'})`;
        archive += `### ${roleName} (${new Date(t.timestamp).toLocaleTimeString()})\n\n${t.content}\n\n`;
      });

      archive += `\n----------------------------------------\n\n`;
    });

    const blob = new Blob([archive], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindmirror-complete-archive-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);

    setExportNotice(`Exported ${entries.length} reflections as Markdown!`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleExportAllJson = () => {
    if (entries.length === 0) {
      setExportNotice('No reflections to export.');
      setTimeout(() => setExportNotice(null), 3000);
      return;
    }

    const exportPayload = {
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      user: {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
      },
      entries,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindmirror-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportNotice(`Exported ${entries.length} reflections as JSON!`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  return (
    <div id="settings-view" className="flex-1 overflow-y-auto bg-stone-100/60 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-2">
          <h1 className={tokens.typography.h1}>Account & Preferences</h1>
          <p className="text-stone-600 text-sm leading-relaxed">
            Manage your personal profile, journaling preferences, and cloud archive portability.
          </p>
        </section>

        {/* Account Profile Card */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h2 className={tokens.typography.metaEyebrow}>Authenticated Profile</h2>
            <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Google Account Verified
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Avatar'}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl border border-stone-200 object-cover shadow-2xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-900 font-serif font-bold text-xl flex items-center justify-center">
                {(user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
              </div>
            )}

            <div className="space-y-1 min-w-0">
              <h3 className="font-serif text-lg font-semibold text-stone-900 truncate">
                {user.displayName || 'Reflective Writer'}
              </h3>
              <p className="text-xs text-stone-600 truncate">{user.email}</p>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[11px] font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200 truncate max-w-[200px] sm:max-w-xs">
                  UID: {user.uid}
                </span>
                <button
                  onClick={handleCopyUid}
                  className="text-[11px] text-amber-700 hover:text-amber-800 font-medium cursor-pointer"
                  title="Copy UID"
                >
                  {copiedUid ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Reflection Defaults Preferences */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="space-y-1">
            <h2 className={tokens.typography.metaEyebrow}>Journaling Preferences</h2>
            <p className="text-xs text-stone-600">
              Customize how Gemini interacts with you when opening a new reflection session.
            </p>
          </div>

          {/* Default Lens Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-700" />
              Default Reflection Lens
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MODES.map((mode) => {
                const isSelected = preferences.defaultMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => onUpdatePreferences({ defaultMode: mode.id })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between ${
                      isSelected
                        ? 'border-amber-700 bg-amber-50/50 shadow-2xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-900">
                        <span>{mode.icon}</span>
                        <span>{mode.label}</span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-snug">{mode.desc}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timestamp Toggle */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-800">Display Message Timestamps</p>
              <p className="text-[11px] text-stone-600">
                Show exact hour and minute next to each reflection and counsel turn
              </p>
            </div>
            <button
              onClick={() => onUpdatePreferences({ showTimestamps: !preferences.showTimestamps })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                preferences.showTimestamps ? 'bg-amber-700' : 'bg-stone-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  preferences.showTimestamps ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Data Sovereignty & Bulk Export */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="space-y-1">
            <h2 className={tokens.typography.metaEyebrow}>Data Sovereignty & Archives</h2>
            <p className="text-xs text-stone-600">
              Download your entire lifetime history directly from Firestore for local backup or transfer.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs text-stone-700">
            <span>Stored in your private Firestore collection:</span>
            <span className="font-semibold text-stone-900">
              {entries.length} {entries.length === 1 ? 'reflection' : 'reflections'}
            </span>
          </div>

          {exportNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{exportNotice}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              id="export-all-md-btn"
              onClick={handleExportAllMarkdown}
              className={`${tokens.buttons.secondary} w-full sm:w-auto`}
            >
              <FileDown className="w-4 h-4 text-amber-700" />
              <span>Export All as Markdown</span>
            </button>

            <button
              id="export-all-json-btn"
              onClick={handleExportAllJson}
              className={`${tokens.buttons.secondary} w-full sm:w-auto`}
            >
              <Download className="w-4 h-4 text-stone-500" />
              <span>Export Full JSON Archive</span>
            </button>
          </div>
        </section>

        {/* Sign Out Section */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">End Current Session</h3>
            <p className="text-xs text-stone-600">
              Safely signs out of Firebase Authentication on this browser.
            </p>
          </div>
          <button
            id="settings-signout-btn"
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-medium text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </section>
      </div>
    </div>
  );
};
