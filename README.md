# MindMirror: AI Journal & Cognitive Reflections

A production-grade, user-authenticated reflective journaling and cognitive thinking application built with **Google Gemini 3.8 Flash**, **Cloud Firestore**, and **Firebase Authentication**, deployed on **Google Cloud Run**.

MindMirror provides a private, distraction-free sanctuary for multi-turn conversational reflections, executive summaries, evidence-grounded insights, longitudinal memory threads, and comprehensive weekly retrospectives. Every piece of user data is strictly isolated within the authenticated user's private Cloud Firestore collections (`/users/{userId}/...`) and protected by verified owner-bound security rules.

---

## 📑 Table of Contents

1. [Architectural Overview & Tech Stack](#-architectural-overview--tech-stack)
2. [End-to-End User Experience](#-end-to-end-user-experience)
3. [AI Processing Engine & Gemini 3.8 Flash Resilience](#-ai-processing-engine--gemini-38-flash-resilience)
4. [Data Model & Firestore Schema](#-data-model--firestore-schema)
5. [Security & Threat Mitigation Standards](#-security--threat-mitigation-standards)
6. [API Endpoints Reference](#-api-endpoints-reference)
7. [Deployment to Google Cloud Run](#-deployment-to-google-cloud-run)
8. [Folder Directory Documentation](#-folder-directory-documentation)
9. [Local Development & Verification](#-local-development--verification)

---

## 🏛 Architectural Overview & Tech Stack

```
[ Client: React 18 + Vite SPA ]
   │
   ├── Google Sign-In (Firebase Auth)
   ├── Private Document Sync (Firestore Client SDK)
   └── Secure API Proxy Calls (Bearer ID Token)
         │
         ▼
[ Backend: Node.js Express Server on Cloud Run (Port 3000) ]
   │
   ├── Firebase Admin SDK (Cryptographic JWT Verification)
   ├── Secret Accessor (Google Cloud Secret Manager: GEMINI_API_KEY)
   ├── Input Sanitization & Verbatim Quote Grounding
   └── Resilient Gemini Fallback Ladder
         │
         ▼
[ Google Gemini 3.8 Flash (`@google/genai`) ]
```

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + TypeScript + Vite | Responsive, accessible SPA styled with Tailwind CSS utility design tokens. |
| **User Identity** | Firebase Authentication | Federated Google Sign-In with passkey compatibility; zero custom password handling. |
| **Database** | Cloud Firestore | Isolated document storage with real-time listeners and offline persistence. |
| **Primary AI Engine** | Google Gemini 3.8 Flash (`@google/genai`) | Multi-turn cognitive counsel, structured quote-grounded insights, memory threads, and weekly retrospectives. |
| **Backend Service** | Express.js on Node.js | Unified backend handling server-side API proxying, JWT verification, and rate limiting. |
| **Secret Management** | Google Cloud Secret Manager | Dynamic API key injection without plaintext source credentials. |
| **Hosting & Ingress** | Google Cloud Run | Serverless container runtime bound to port `3000` and host `0.0.0.0`. |

---

## 🧭 End-to-End User Experience

MindMirror guides the user through five connected cognitive stages:

```
[ 1. Home Dashboard ]
         │
         ▼
[ 2. Journal Workspace ] ──(Multi-Turn Dialogue & Auto-Save)──► [ Firestore /users/{uid}/entries ]
         │
         ▼
[ 3. Grounded Insights ] ──(Verbatim Evidence Verification)──► [ Firestore /users/{uid}/insights ]
         │
         ▼
[ 4. Memory Threads ]    ──(Cross-Entry Theme Synthesis)───► [ Longitudinal Pattern Analysis ]
         │
         ▼
[ 5. Weekly Reflection ] ──(7-Day Progress & Action Steps)─► [ Exportable Structured Review ]
```

### 1. Home Dashboard
- **Sanctuary Greeting**: Dynamic time-of-day greeting referencing the user's Google display name and lifetime reflection statistics.
- **Reflection Starters**: Curated daily prompts that instantly spawn an active journal session with pre-configured cognitive lenses.
- **Recent Sessions**: Fast-access list of previous journal entries with timestamps, turn counts, and extracted tags.

### 2. Multi-Turn Journal Workspace
- **Four Cognitive Lenses**:
  - `reflect` (🪞 **Mirror & Inquire**): Deep Socratic inquiry uncovering unconscious assumptions.
  - `summarize` (📋 **Synthesize & Condense**): Clear structural takeaways, core themes, and key decisions.
  - `brainstorm` (💡 **Explore Angles**): Unconventional analogies, reframing, and alternative perspectives.
  - `action_plan` (🎯 **Action & Next Steps**): Low-friction, practical micro-steps to reduce cognitive friction.
- **Visual Design**: High-contrast, dyslexia-friendly warm neutral canvas (`bg-stone-50`) with clear distinction between user entries and Gemini responses.
- **Real-Time Synthesis**: Automatic generation of entry titles and topic tags once the conversation matures.

### 3. Evidence-Grounded Insights
- **Verbatim Evidence Requirement**: Every synthesized observation (theme, emotion, goal, challenge) must include an exact, verifiable substring quote from the user's journal turns.
- **Categorical Breakdown**:
  - Core Themes & Meaning
  - Expressed Emotional States
  - Expressed Goals & Aspirations
  - Noted Friction & Challenges
  - Concrete Next Steps & Open Questions
- **One-Click Evidence Navigation**: Clicking an evidence card jumps directly to the corresponding turn in the conversation.

### 4. Memory Threads
- **Cross-Entry Discovery**: Analyzes entries across weeks and months to detect recurring behavioral and mental patterns.
- **Timeline Grounding**: Displays date spans, referenced entries, and exact quotes connecting disparate thoughts into coherent developmental arcs.

### 5. Weekly Reflection
- **7-Day Retrospective**: Aggregates all reflections, insights, and threads within any selected ISO calendar week.
- **Balanced Emotional Matrix**: Captures triumphs, recurring tensions, and grounded takeaways.
- **Data Portability**: Full markdown and JSON export options for complete user data sovereignty.

---

## ⚡ AI Processing Engine & Gemini 3.8 Flash Resilience

### Primary Model & Automated Fallback Ladder
The application prioritizes **`gemini-3.8-flash`** for all generation tasks. To prevent availability disruptions, the backend wraps all `@google/genai` calls with a sequential fallback ladder:

```
1. Primary:                 gemini-3.8-flash
2. High-Availability:       gemini-3.6-flash
3. Fast Fallback:           gemini-3.1-flash-lite
4. Dynamic Stable Alias:    gemini-flash-latest
5. Deep Reasoning Fallback: gemini-3.7-flash
```

### Error Recovery Matrix
The backend intercepts recoverable error codes (`503 UNAVAILABLE`, `429 RESOURCE_EXHAUSTED`, `404 NOT_FOUND`, `500 INTERNAL`) and sequentially cascades to the next candidate model in the chain before bubbling an error up to the client.

### Indirect Prompt Injection Delimiters
User-supplied journal text and chat history are strictly wrapped inside explicit XML data boundaries:
```
<user_journal_history>
  <turn role="user" id="...">...</turn>
</user_journal_history>
```
System instructions strictly instruct the model to treat all bracketed content as passive semantic data, never as executable meta-instructions.

---

## 🗄 Data Model & Firestore Schema

All documents exist strictly within the authenticated user's private path hierarchy:

```
/users/{userId}
  │
  ├── /entries/{entryId}
  │     ├── id: string
  │     ├── userId: string
  │     ├── title: string
  │     ├── summary: string
  │     ├── tags: string[]
  │     ├── turns: Array<{ id, role, content, timestamp, mode, modelUsed }>
  │     ├── createdAt: number
  │     └── updatedAt: number
  │
  ├── /insights/insight_{entryId}
  │     ├── id: string (insight_{entryId})
  │     ├── entryId: string
  │     ├── themes: Array<{ observation, evidenceQuote, sourceTurnId }>
  │     ├── expressedEmotions: Array<{ observation, evidenceQuote, sourceTurnId }>
  │     ├── goals: Array<{ observation, evidenceQuote, sourceTurnId }>
  │     ├── challenges: Array<{ observation, evidenceQuote, sourceTurnId }>
  │     ├── possibleActions: string[]
  │     ├── entryUpdatedAtAtAnalysis: number
  │     ├── generatedAt: number
  │     └── modelUsed: string
  │
  └── /weekly_reflections/weekly_{userId}_{weekKey}
        ├── id: string
        ├── userId: string
        ├── weekKey: string (e.g. "2026-W36")
        ├── displayDateRange: string
        ├── summary: string
        ├── mainThemes: Array<{ title, description, evidence }>
        ├── emotionalPatterns: Array<{ emotion, description, evidence }>
        ├── gentleNextSteps: string[]
        └── generatedAt: number
```

---

## 🛡 Security & Threat Mitigation Standards

### 1. Verified Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### 2. Backend Bearer Token Verification
Every API route validates the Firebase ID token in the `Authorization: Bearer <token>` header using `getAdminAuth().verifyIdToken(token)`. Requests with missing, expired, or forged tokens receive a `401 Unauthorized` response with zero execution of downstream AI logic.

### 3. Strict Undefined-Stripping & Payload Hygiene
Before passing any payload to Firestore or the Gemini API, objects are sanitized to eliminate all `undefined` properties, preventing driver serialization exceptions.

### 4. Zero Hardcoded Credentials
API keys are never checked into Git. Secrets are injected at runtime via Google Cloud Secret Manager or environment variables.

---

## 📡 API Endpoints Reference

All endpoints accept and return JSON payloads and require an `Authorization: Bearer <FIREBASE_ID_TOKEN>` header.

### 1. `POST /api/reflect`
Generates a multi-turn reflective response based on chosen lens.
- **Request Body**:
  ```json
  {
    "prompt": "I felt overwhelmed handling three deadlines today.",
    "history": [
      { "role": "user", "parts": [{ "text": "..." }] },
      { "role": "model", "parts": [{ "text": "..." }] }
    ],
    "mode": "reflect",
    "titleContext": "Handling Work Deadlines"
  }
  ```
- **Response**:
  ```json
  {
    "text": "It sounds like the pressure came from having multiple deadlines collide at once...",
    "modelUsed": "gemini-3.8-flash"
  }
  ```

### 2. `POST /api/summarize-entry`
Generates an executive summary, title, and topic tags for an active reflection.
- **Request Body**: `{ "text": "..." }`
- **Response**:
  ```json
  {
    "title": "Navigating Deadline Collisions",
    "summary": "Exploring workload pacing and boundary setting during high-stress deliverables.",
    "tags": ["work", "boundaries", "stress"]
  }
  ```

### 3. `POST /api/insights`
Extracts structured, evidence-grounded insights strictly verified against verbatim quotes.
- **Request Body**:
  ```json
  {
    "entryId": "entry_123",
    "entryTitle": "Navigating Deadline Collisions",
    "entryUpdatedAt": 1725619200000,
    "forceRegenerate": false,
    "userTurns": [
      { "id": "turn_1", "role": "user", "content": "I skipped lunch to finish the presentation." }
    ]
  }
  ```

### 4. `POST /api/threads`
Performs longitudinal cross-entry theme synthesis across multiple historical journal sessions.

### 5. `POST /api/weekly-reflection`
Synthesizes a 7-day retrospective consolidating themes, emotional patterns, breakthroughs, and micro-actions.

---

## 🚀 Deployment to Google Cloud Run

### 1. Prerequisites & Project Setup
```bash
# Authenticate gcloud CLI
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

### 2. Secret Manager Binding
```bash
# Create secret for Gemini API key
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant Secret Accessor role to Cloud Run runtime service account
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 4. Deploy Application to Cloud Run
```bash
gcloud run deploy mindmirror \
  --source . \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --set-env-vars NODE_ENV=production
```

### 5. Mandatory Campaign Verification Label
```bash
gcloud run services update mindmirror \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-east1
```

---

## 📁 Folder Directory Documentation

For detailed architectural and implementation details for each subsystem, consult the dedicated folder READMEs:

- **[`/src/README.md`](./src/README.md)**: Frontend architecture, state management, routing, design tokens, and Firebase synchronization.
- **[`/src/components/README.md`](./src/components/README.md)**: Component reference guide covering views, modals, responsive navigation, and cards.
- **[`/src/lib/README.md`](./src/lib/README.md)**: Helper libraries, Gemini client SDK callers, Firebase initialization, and utility calculations.
- **[`/public/README.md`](./public/README.md)**: Static asset definitions, icons, web manifests, and browser branding.

---

## 💻 Local Development & Verification

```bash
# 1. Install dependencies
npm install

# 2. Run full-stack development server (Express + Vite on port 3000)
npm run dev

# 3. Codebase validation & type-checking
npm run lint

# 4. Production build compilation (Bundles Vite frontend + esbuild server.cjs)
npm run build

# 5. Production start command
npm run start
```
