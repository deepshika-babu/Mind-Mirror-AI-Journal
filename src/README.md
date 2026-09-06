# Frontend Source Architecture (`/src`)

The `/src` directory houses the client-side single-page application built with **React 18**, **TypeScript**, and **Tailwind CSS**.

---

## 🗂 File Overview

| File | Purpose |
| :--- | :--- |
| `main.tsx` | React root entry point mounting `<App />` into the DOM. |
| `App.tsx` | Main application shell managing global state, routing, Firebase Auth subscriptions, and top-level modals. |
| `types.ts` | Global TypeScript types, interfaces, and enums representing domain models and API contracts. |
| `index.css` | Global stylesheet importing Tailwind CSS utility directives (`@import "tailwindcss";`). |

---

## 🏗 Application Shell & State Management (`App.tsx`)

`App.tsx` serves as the primary controller for the client-side experience:

### 1. View Routing (`AppView`)
The application implements lightweight, accessible view switching without heavy router dependencies:
- `'home'`: Sanctuary dashboard, greeting, lifetime stats, and reflection starters.
- `'journal'`: Active multi-turn reflection workspace with cognitive lenses.
- `'threads'`: Cross-entry longitudinal theme discovery.
- `'weekly'`: 7-day retrospective reflection view.
- `'privacy'`: Architecture and security compliance review.
- `'settings'`: Account profile, default preferences, and JSON/Markdown export controls.

### 2. Authentication Lifecycle
- Listens to Firebase Auth state via `onAuthStateChanged(auth, callback)`.
- If unauthenticated, gracefully renders `LandingPage.tsx`.
- Once authenticated, immediately attaches real-time Firestore listeners to `/users/{userId}/entries` ordered by `updatedAt desc`.

### 3. Optimistic Updates & Firestore Persistence
- Submitting a reflection immediately appends a local turn to the conversation for zero perceived latency.
- In parallel, persists the turn to Firestore via `setDoc`/`updateDoc` with undefined-stripping.
- If network disconnection occurs, error banners notify the user with non-destructive retry options.

---

## 🧩 Subdirectories

- **[`components/`](./components/README.md)**: Modular UI view components, navigation bars, modals, and evidence cards.
- **[`lib/`](./lib/README.md)**: Firebase SDK client, Gemini API proxy wrapper, design tokens, and date calculation utilities.
