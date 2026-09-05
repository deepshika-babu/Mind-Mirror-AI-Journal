# AI Journal & Reflections (MindMirror)

A production-grade, user-authenticated reflective journaling and cognitive thinking application built with **Google Gemini 3.6 Flash**, **Cloud Firestore**, and **Firebase Authentication**.

The application offers a private sanctuary for multi-turn conversational reflections, executive summaries, fresh brainstorming perspectives, and action planning. Every interaction is strictly isolated to the authenticated user's Firestore path (`/users/{userId}/entries/{entryId}`), verified by owner-bound Firestore security rules.

---

## Architecture & Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **User Identity** | Firebase Authentication | Secure Google Sign-In (federated auth, zero custom passwords stored). |
| **Backend Database** | Cloud Firestore | Isolated document storage for multi-turn reflections and metadata. |
| **AI Processing Engine** | Gemini 3.6 Flash API (`@google/genai`) | Multi-turn cognitive reflection partner and structured, grounded insights engine with resilient fallback ladder. |
| **Secret Management** | Secret Manager & Env Vars | Zero-hardcoded credentials; API keys stored in Google Cloud Secret Manager. |
| **Token Verification** | Firebase Admin SDK | Cryptographic Bearer token verification on all AI endpoints (`/api/reflect`, `/api/summarize-entry`, `/api/insights`). |
| **Runtime & Host** | Google Cloud Run & Node.js | Containerized full-stack Express + Vite application. |

---

## Data Model & Firestore Architecture

All user data is strictly isolated within the authenticated user's scope:
- **Reflections**: `/users/{userId}/entries/{entryId}`
- **Grounded Insights**: `/users/{userId}/insights/insight_{entryId}` (deterministic 1-to-1 document ID linked to parent entry)

When an entry is deleted, cascading deletion removes both the entry document and its associated insight document synchronously.

---

## API Endpoints & Authentication

All AI endpoints require a valid Firebase ID Token passed via `Authorization: Bearer <token>`:
- `POST /api/reflect`: Multi-turn reflective conversation partner with cognitive framing.
- `POST /api/summarize-entry`: Title synthesis and executive summary generation.
- `POST /api/insights`: Single-entry evidence-grounded insights extraction (themes, emotions, goals, challenges, micro-actions) strictly validated against verbatim quotes from the user's reflection turns. Cached unless `forceRegenerate: true` or entry content has updated since analysis.

---

## 1. Environment & Prerequisites

Before deploying to Google Cloud Run, verify you have the Google Cloud CLI (`gcloud`) and Firebase CLI installed and configured:

```bash
# 1. Install Google Cloud SDK and authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Enable necessary Google Cloud service APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

---

## 2. Secret Management Setup (Zero-Hardcoding Hygiene)

API keys and credentials are never stored in source control. Create the `GEMINI_API_KEY` secret in Google Cloud Secret Manager:

```bash
# Create and populate the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the default Cloud Run runtime service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Database Security Configuration (Cloud Firestore)

All user reflections and chat histories are stored with owner-bound path checking. Deploy the following security rules to your Firebase project:

### `firestore.rules`
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

Deploy the rules via the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Cloud Run Deployment Flow

Build and deploy the application container to Google Cloud Run, mounting the secret from Secret Manager:

```bash
# Deploy to Google Cloud Run
gcloud run deploy ai-journal-reflections \
  --source . \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --set-env-vars NODE_ENV=production
```

---

## 5. Required Campaign Labeling (Verification Binding)

Apply the mandatory challenge verification label to your Cloud Run service:

```bash
gcloud run services update ai-journal-reflections \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-east1
```

---

## 6. Resilient Model Fallback Ladder

The server integrates an automated fallback ladder ordered by availability and latency to ensure high availability:

1. **Primary**: `gemini-3.6-flash`
2. **High-Availability Fallback**: `gemini-3.1-flash-lite`
3. **Dynamic Alias**: `gemini-flash-latest`
4. **Deep Reasoning Fallback**: `gemini-3.7-flash`

The error recovery matrix intercepts recoverable codes (`503 UNAVAILABLE`, `429 RESOURCE_EXHAUSTED`, `404 NOT_FOUND`, `500 INTERNAL`) and sequentially cascades to the next candidate model before bubbling an error up to the client.

---

## 7. Local Development

```bash
# Install dependencies
npm install

# Run full-stack dev server (Express + Vite on port 3000)
npm run dev

# Build production bundle
npm run build

# Start production server
npm run start
```
