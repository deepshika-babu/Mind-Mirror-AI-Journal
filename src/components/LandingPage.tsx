import React from 'react';
import { Sparkles, ShieldCheck, Database, ArrowRight, Lock, BookOpen } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  isLoading: boolean;
  authError: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, isLoading, authError }) => {
  return (
    <div id="landing-page" className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-700 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight text-stone-900">MindMirror</span>
              <span className="ml-2 text-xs uppercase tracking-wider text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">AI Reflections</span>
            </div>
          </div>
          <button
            id="nav-signin-btn"
            onClick={onSignIn}
            disabled={isLoading}
            className="text-sm font-medium text-stone-700 hover:text-stone-900 px-4 py-2 rounded-lg hover:bg-stone-100 transition-colors"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 flex flex-col items-center text-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-xs font-medium text-stone-600 mb-6">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Strictly User-Isolated Cloud Firestore Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-serif tracking-tight text-stone-900 leading-tight mb-5 max-w-2xl">
          A private sanctuary for honest thought and thoughtful counsel.
        </h1>

        <p className="text-lg text-stone-600 max-w-xl mb-10 leading-relaxed">
          Record your daily reflections and converse with Gemini in multi-turn dialogues. Synthesize emotions, brainstorm creative resolutions, and preserve your personal journey in secure cloud isolation.
        </p>

        {authError && (
          <div id="auth-error-banner" className="mb-6 max-w-md w-full p-4 rounded-xl bg-rose-50 border border-rose-200 text-left text-sm text-rose-800">
            <p className="font-medium mb-1">Authentication Notice</p>
            <p className="text-xs text-rose-700 leading-relaxed">{authError}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md">
          <button
            id="hero-signin-btn"
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 active:scale-[0.99] transition-all shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Sign in with Google</span>
            <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
          </button>
        </div>

        <p className="text-xs text-stone-600 mt-4 flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-stone-600" />
          Passkeys and Google Identity ensure credentials never touch our application code.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full text-left">
          <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-800 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-900 mb-1.5 text-base">Gemini 3.6 Flash Counsel</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Converse in multi-turn depth. Request empathetic mirrors, executive summaries, fresh brainstorming angles, or structured action plans.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-900 mb-1.5 text-base">Firestore User Isolation</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Every journal entry is stored strictly under <code className="text-xs bg-stone-100 px-1 py-0.5 rounded text-stone-800">/users/{'{uid}'}/entries</code>, safeguarded by verified security rules.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-800 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-900 mb-1.5 text-base">Zero-Hardcoded Hygiene</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              All Gemini API operations run through secure backend proxies with resilient model ladders and defensive payload ingestion.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-600">
        <p>AI Journal & Reflections — Built with Google Gemini and Cloud Firestore</p>
      </footer>
    </div>
  );
};
