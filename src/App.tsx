import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  loginWithGoogle,
  logoutUser,
  mapFirebaseUser,
  fetchUserEntries,
  saveUserEntry,
  deleteUserEntry,
} from './lib/firebase.ts';
import { requestReflection, generateEntryMetadata } from './lib/geminiClient.ts';
import { LandingPage } from './components/LandingPage.tsx';
import { Navbar } from './components/Navbar.tsx';
import { SidebarHistory } from './components/SidebarHistory.tsx';
import { EntryWorkspace } from './components/EntryWorkspace.tsx';
import { HomePage } from './components/HomePage.tsx';
import { PrivacyPage } from './components/PrivacyPage.tsx';
import { SettingsPage } from './components/SettingsPage.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import type {
  JournalEntry,
  JournalTurn,
  ReflectionMode,
  UserProfile,
  AppView,
  UserPreferences,
} from './types.ts';

const PREFS_STORAGE_KEY = 'mindmirror_user_prefs';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  // Application Shell Navigation
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [mobileJournalTab, setMobileJournalTab] = useState<'list' | 'workspace'>('workspace');

  // User Preferences
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(PREFS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return {
      defaultMode: 'reflect',
      showTimestamps: true,
    };
  });

  // Journal entries state
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState<boolean>(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Generation and saving state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeError, setActiveError] = useState<string | null>(null);

  // Pending retry context
  const [lastFailedSubmission, setLastFailedSubmission] = useState<{
    prompt: string;
    mode: ReflectionMode;
  } | null>(null);

  const handleUpdatePreferences = (newPrefs: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...newPrefs };
      try {
        localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        console.warn('Failed to save preferences to localStorage');
      }
      return updated;
    });
  };

  // Monitor Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      const userProfile = mapFirebaseUser(firebaseUser);
      setCurrentUser(userProfile);
      setIsAuthChecking(false);

      if (userProfile) {
        // Load user's private isolated entries
        await loadUserEntries(userProfile.uid);
      } else {
        setEntries([]);
        setSelectedEntryId(null);
        setCurrentView('home');
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserEntries = async (userId: string) => {
    setIsLoadingEntries(true);
    try {
      const userEntries = await fetchUserEntries(userId);
      setEntries(userEntries);
      if (userEntries.length > 0 && !selectedEntryId) {
        setSelectedEntryId(userEntries[0].id);
      }
    } catch {
      console.error('Failed to load user entries from Firestore');
      setActiveError('Could not load your saved reflections. Check your network connection.');
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In error');
      setAuthError(err?.message || 'Authentication could not be completed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setEntries([]);
      setSelectedEntryId(null);
      setCurrentView('home');
    } catch {
      console.error('Sign Out failed');
    }
  };

  const handleCreateNewEntry = (initialPrompt?: string, mode?: ReflectionMode) => {
    if (!currentUser) return;

    const newEntryId = `entry-${Date.now()}`;
    const newEntry: JournalEntry = {
      id: newEntryId,
      userId: currentUser.uid,
      title: 'New Reflection',
      tags: ['Reflection'],
      turns: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setEntries((prev) => [newEntry, ...prev]);
    setSelectedEntryId(newEntryId);
    setActiveError(null);
    setCurrentView('journal');
    setMobileJournalTab('workspace');

    // If initial prompt provided, send immediately
    if (initialPrompt) {
      handleSendMessage(initialPrompt, mode || preferences.defaultMode);
    }
  };

  const handleSelectEntry = (entry: JournalEntry) => {
    setSelectedEntryId(entry.id);
    setActiveError(null);
    setMobileJournalTab('workspace');
  };

  const handleNavigateToJournal = (entryId?: string) => {
    if (entryId) {
      setSelectedEntryId(entryId);
    }
    setCurrentView('journal');
    setMobileJournalTab('workspace');
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!currentUser) return;
    try {
      await deleteUserEntry(currentUser.uid, entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));

      if (selectedEntryId === entryId) {
        const remaining = entries.filter((e) => e.id !== entryId);
        setSelectedEntryId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch {
      console.error('Failed to delete entry from Firestore');
      setActiveError('Failed to delete entry from Firestore.');
    }
  };

  const handleUpdateEntryMeta = async (updates: Partial<JournalEntry>) => {
    if (!currentUser || !selectedEntryId) return;

    const currentEntry = entries.find((e) => e.id === selectedEntryId);
    if (!currentEntry) return;

    const updatedEntry: JournalEntry = {
      ...currentEntry,
      ...updates,
      updatedAt: Date.now(),
    };

    // Optimistically update UI
    setEntries((prev) => prev.map((e) => (e.id === selectedEntryId ? updatedEntry : e)));

    // Persist to isolated Firestore path
    setIsSaving(true);
    try {
      await saveUserEntry(currentUser.uid, updatedEntry);
    } catch {
      console.error('Failed to update entry metadata in Firestore');
      setActiveError('Metadata save failed in Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Guaranteed Transaction Verification (Input-to-Save Completeness):
   * Both user prompt and Gemini response are persisted to Firestore together.
   * If save fails or generation fails, error banner is shown with retry option,
   * and the user's input buffer is preserved.
   */
  const handleSendMessage = useCallback(
    async (prompt: string, mode: ReflectionMode) => {
      if (!currentUser) return;

      let targetEntry = entries.find((e) => e.id === selectedEntryId);

      // If no entry exists yet, instantiate one automatically
      if (!targetEntry) {
        const newEntryId = `entry-${Date.now()}`;
        targetEntry = {
          id: newEntryId,
          userId: currentUser.uid,
          title: prompt.slice(0, 30) + '...',
          tags: ['Reflection'],
          turns: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setEntries((prev) => [targetEntry!, ...prev]);
        setSelectedEntryId(newEntryId);
      }

      setIsGenerating(true);
      setActiveError(null);
      setLastFailedSubmission({ prompt, mode });

      const userTurn: JournalTurn = {
        id: `turn-${Date.now()}-user`,
        role: 'user',
        content: prompt,
        timestamp: Date.now(),
        mode,
      };

      // Prepare conversation history for multi-turn Gemini API
      const historyForApi = targetEntry.turns.map((turn) => ({
        role: turn.role,
        parts: [{ text: turn.content }],
      }));

      try {
        // Request reflection from Gemini API via server-side fallback ladder
        const reflectionResult = await requestReflection({
          prompt,
          history: historyForApi,
          mode,
          titleContext: targetEntry.title,
        });

        const geminiTurn: JournalTurn = {
          id: `turn-${Date.now()}-model`,
          role: 'model',
          content: reflectionResult.text,
          timestamp: Date.now(),
          mode,
          modelUsed: reflectionResult.modelUsed,
        };

        const updatedTurns = [...targetEntry.turns, userTurn, geminiTurn];

        let updatedTitle = targetEntry.title;
        let updatedSummary = targetEntry.summary;
        let updatedTags = targetEntry.tags;

        // Auto-generate title & tags if this is the very first reflection turn
        if (targetEntry.turns.length === 0) {
          try {
            const meta = await generateEntryMetadata(prompt);
            if (meta.title) updatedTitle = meta.title;
            if (meta.summary) updatedSummary = meta.summary;
            if (meta.tags && meta.tags.length > 0) {
              updatedTags = Array.from(new Set([...targetEntry.tags, ...meta.tags]));
            }
          } catch {
            console.warn('Auto metadata generation skipped');
          }
        }

        const completedEntry: JournalEntry = {
          ...targetEntry,
          title: updatedTitle,
          summary: updatedSummary,
          tags: updatedTags,
          turns: updatedTurns,
          updatedAt: Date.now(),
        };

        // Persist to user-isolated Firestore subcollection
        setIsSaving(true);
        await saveUserEntry(currentUser.uid, completedEntry);

        // Update local React state with confirmed persisted data
        setEntries((prev) =>
          prev.map((e) => (e.id === completedEntry.id ? completedEntry : e))
        );

        // Success: clear failed submission tracking
        setLastFailedSubmission(null);
      } catch (err: any) {
        console.error('Reflection interaction failed');
        const errMsg = err?.message || 'Could not complete reflection or save to Firestore.';
        setActiveError(errMsg);
        throw err;
      } finally {
        setIsGenerating(false);
        setIsSaving(false);
      }
    },
    [currentUser, entries, selectedEntryId]
  );

  const handleRetryLast = () => {
    if (lastFailedSubmission) {
      handleSendMessage(lastFailedSubmission.prompt, lastFailedSubmission.mode);
    }
  };

  // Loading screen while checking Firebase Auth status
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-amber-800/20 border-t-amber-800 rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium text-stone-500">Connecting to secure authentication...</p>
      </div>
    );
  }

  // Unauthenticated user -> Landing Page
  if (!currentUser) {
    return (
      <LandingPage
        onSignIn={handleSignIn}
        isLoading={isSigningIn}
        authError={authError}
      />
    );
  }

  // Authenticated user -> Shell & Selected View
  const currentSelectedEntry = entries.find((e) => e.id === selectedEntryId) || null;

  return (
    <div id="authenticated-app" className="h-screen flex flex-col bg-stone-100 text-stone-900 font-sans overflow-hidden">
      <Navbar
        user={currentUser}
        currentView={currentView}
        onSelectView={setCurrentView}
        onNewEntry={() => handleCreateNewEntry()}
        onSignOut={handleSignOut}
        isSaving={isSaving}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* View 1: Home Dashboard */}
        {currentView === 'home' && (
          <HomePage
            user={currentUser}
            entries={entries}
            onNavigateToJournal={handleNavigateToJournal}
            onNewEntry={() => handleCreateNewEntry()}
            onStartWithPrompt={(prompt, mode) => handleCreateNewEntry(prompt, mode)}
          />
        )}

        {/* View 2: Journal Workspace (Responsive: Side-by-Side on Desktop, Tabbed on Mobile) */}
        {currentView === 'journal' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar History: Always visible on desktop; on mobile visible only when 'list' tab active */}
            <div
              className={`h-full ${
                mobileJournalTab === 'list' ? 'flex flex-1' : 'hidden md:flex'
              }`}
            >
              <SidebarHistory
                entries={entries}
                selectedEntryId={selectedEntryId}
                onSelectEntry={handleSelectEntry}
                onDeleteEntry={handleDeleteEntry}
                isLoading={isLoadingEntries}
                onSwitchToWorkspace={() => setMobileJournalTab('workspace')}
              />
            </div>

            {/* Entry Workspace: Always visible on desktop; on mobile visible only when 'workspace' tab active */}
            <div
              className={`h-full flex-1 flex flex-col ${
                mobileJournalTab === 'workspace' ? 'flex' : 'hidden md:flex'
              }`}
            >
              <EntryWorkspace
                entry={currentSelectedEntry}
                onSendMessage={handleSendMessage}
                onUpdateEntryMeta={handleUpdateEntryMeta}
                isGenerating={isGenerating}
                activeError={activeError}
                onClearError={() => setActiveError(null)}
                onRetry={handleRetryLast}
                onBackToList={() => setMobileJournalTab('list')}
                initialMode={preferences.defaultMode}
                showTimestamps={preferences.showTimestamps}
              />
            </div>
          </div>
        )}

        {/* View 3: Privacy & Security Architectural Transparency */}
        {currentView === 'privacy' && <PrivacyPage user={currentUser} />}

        {/* View 4: Account & Preferences Settings */}
        {currentView === 'settings' && (
          <SettingsPage
            user={currentUser}
            entries={entries}
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            onSignOut={handleSignOut}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav currentView={currentView} onSelectView={setCurrentView} />
    </div>
  );
}
