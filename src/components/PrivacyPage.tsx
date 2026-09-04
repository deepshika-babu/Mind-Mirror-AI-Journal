import React from 'react';
import {
  ShieldCheck,
  Lock,
  Database,
  Key,
  Server,
  UserCheck,
  FileCheck2,
  Trash2,
  Download,
  AlertCircle,
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
            <span>Cryptographically Verified Security Architecture</span>
          </div>
          <h1 className={tokens.typography.h1}>Privacy & Data Protection</h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            MindMirror was engineered from the ground up as an impenetrable personal sanctuary. We recognize that journal entries contain your most intimate thoughts, dilemmas, and memories. Here is how your data is strictly guarded.
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
              <p className="text-[10px] text-emerald-800 font-medium">Bound to private Firestore subtree</p>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <span className="text-[11px] font-medium text-stone-600 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-700" />
                Firestore Storage Path
              </span>
              <p className="text-xs font-mono text-stone-900 truncate font-semibold">
                /users/{user.uid.slice(0, 8)}.../entries
              </p>
              <p className="text-[10px] text-amber-800 font-medium">Zero cross-user read permissions</p>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <span className="text-[11px] font-medium text-stone-600 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-amber-700" />
                Gemini API Proxy
              </span>
              <p className="text-xs font-mono text-stone-900 truncate font-semibold">
                Backend Server-Side (Cloud Run)
              </p>
              <p className="text-[10px] text-emerald-800 font-medium">Zero browser API key exposure</p>
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
              1. Federated Identity & Zero Password Storage
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              We never collect, process, or store passwords. Authentication is handled exclusively through federated Google OAuth via Firebase Authentication. Your credentials are authenticated by Google directly, and your session is maintained with cryptographically signed JSON Web Tokens (JWT).
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-900">
              2. Firestore Owner-Bound Security Rules
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              All entries are stored in subcollections matching <code className="bg-stone-100 px-1 py-0.5 rounded text-[11px] text-stone-800">/users/{'{userId}'}/entries</code>. Our Firestore security rules enforce that only the verified token owner (<code className="bg-stone-100 px-1 py-0.5 rounded text-[11px] text-stone-800">request.auth.uid == userId</code>) can read or modify documents.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-900">
              3. Secure Server-Side AI Inference
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Gemini API calls are never initiated client-side. Requests are routed through our hardened backend Express service. API credentials reside strictly in Google Cloud Secret Manager or server environment variables, completely concealed from browser inspection.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-900">
              4. Sovereign Ownership & Portability
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Your journal is entirely yours. You may export individual reflections as clean Markdown files or download your entire journal archive at any time from Settings. When you delete a reflection, it is permanently erased from your cloud database.
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
            Guarantees that database rules reject any attempt by User A to read, list, modify, or delete any record belonging to User B.
          </p>
        </section>
      </div>
    </div>
  );
};
