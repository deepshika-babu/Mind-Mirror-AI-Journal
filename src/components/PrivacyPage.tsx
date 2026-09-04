import React from 'react';
import {
  ShieldCheck,
  Lock,
  Database,
  Server,
  UserCheck,
  FileCheck2,
  Sparkles,
  EyeOff,
} from 'lucide-react';
import type { UserProfile } from '../types.ts';
import { tokens } from '../lib/designTokens.ts';

interface PrivacyPageProps {
  user: UserProfile;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ user }) => {
  return (
    <div id="privacy-view" className="flex-1 overflow-y-auto bg-stone-100/60 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Authentication &amp; Access Control Architecture</span>
          </div>
          <h1 className={tokens.typography.h1}>Privacy &amp; Data Protection</h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            MindMirror was designed as a private, contemplative sanctuary. Journal reflections contain intimate thoughts, challenges, and aspirations. Here is how your data, insights, and AI interactions are securely handled.
          </p>
        </section>

        {/* Current Active Security Verification Status */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <h2 className={tokens.typography.metaEyebrow}>Active Session Verification</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <span className="text-[11px] font-medium text-stone-600 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                Authenticated UID
              </span>
              <p className="text-xs font-mono text-stone-900 truncate font-semibold">
                {user.uid}
              </p>
              <p className="text-[10px] text-emerald-800 font-medium">Verified by Firebase Admin SDK</p>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <span className="text-[11px] font-medium text-stone-600 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-700" />
                Private Firestore Scope
              </span>
              <p className="text-xs font-mono text-stone-900 truncate font-semibold">
                /users/{user.uid.slice(0, 8)}.../*
              </p>
              <p className="text-[10px] text-amber-800 font-medium">Owner-bound read &amp; write security</p>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <span className="text-[11px] font-medium text-stone-600 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-amber-700" />
                Server Token Verification
              </span>
              <p className="text-xs font-mono text-stone-900 truncate font-semibold">
                Bearer Token Authentication
              </p>
              <p className="text-[10px] text-emerald-800 font-medium">Zero client-claimed identity trust</p>
            </div>
          </div>
        </section>

        {/* Security Principles Breakdown */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-900">
              1. Federated Identity &amp; Server Token Verification
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Authentication is handled through Firebase Authentication. Every backend endpoint (<code className="bg-stone-100 px-1 py-0.5 rounded text-[11px] text-stone-800">/api/reflect</code>, <code className="bg-stone-100 px-1 py-0.5 rounded text-[11px] text-stone-800">/api/summarize-entry</code>, and <code className="bg-stone-100 px-1 py-0.5 rounded text-[11px] text-stone-800">/api/insights</code>) validates the client&apos;s cryptographically signed Firebase ID token with the Firebase Admin SDK. The user identity is derived exclusively from the verified token.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-900">
              2. Owner-Bound Firestore Storage &amp; Isolation
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              All journal reflections and insights reside strictly within subcollections under <code className="bg-stone-100 px-1 py-0.5 rounded text-[11px] text-stone-800">/users/{'{userId}'}/</code>. Both declarative Firestore security rules and backend database operations enforce strict tenant isolation, guaranteeing users cannot read or write another user&apos;s data.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-900">
              3. On-Demand AI Analysis &amp; Grounded Evidence
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              AI analysis is never executed passively in the background. Reflection turns and structured insights are generated only when you explicitly write a prompt or click &ldquo;Explore Insights&rdquo;. Every extracted observation is grounded in verbatim quotes from your written entries.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-900">
              4. Data Minimization &amp; Safe Logging
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Our server logs omit all journal content, reflection prompt texts, authentication tokens, and full AI outputs. Server logs record only sanitized operational metadata (such as timestamps, endpoint paths, and model status codes) to ensure your privacy remains uncompromised.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-3 md:col-span-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-900">
              5. Sovereign Ownership &amp; Cascading Deletion
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Your journal is entirely yours. You can export reflections at any time as clean Markdown or JSON archives. When you delete a reflection, MindMirror automatically executes a cascading deletion, permanently removing both the journal entry and any associated reflection insight documents from Firestore.
            </p>
          </div>
        </section>

        {/* Firestore Rules Audit Box */}
        <section className="bg-stone-900 text-stone-100 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400">
              Enforced Security Rules Audit
            </span>
            <span className="text-[11px] font-mono text-stone-400">firestore.rules</span>
          </div>
          <pre className="text-xs font-mono bg-black/40 p-4 rounded-xl overflow-x-auto text-emerald-400 leading-relaxed border border-stone-800">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`}
          </pre>
          <p className="text-xs text-stone-400">
            Rules enforce that the database rejects any attempt by one user to read, list, modify, or delete records belonging to another user.
          </p>
        </section>
      </div>
    </div>
  );
};
