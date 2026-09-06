# Utilities & Client Libraries (`/src/lib`)

This directory contains client-side helper libraries, authentication connectors, API proxy wrappers, design tokens, and date computation utilities.

---

## 🗂 Library Index

| File | Purpose |
| :--- | :--- |
| `firebase.ts` | Client Firebase SDK initialization, exporting `auth`, `db` (Firestore), and `GoogleAuthProvider`. |
| `geminiClient.ts` | Typed client interface communicating with backend AI endpoints, managing ID tokens and resilience fallbacks. |
| `designTokens.ts` | Centralized design tokens governing typography scales, color palettes, button styles, and card surfaces. |
| `weekUtils.ts` | ISO-8601 calendar week math (`YYYY-Www`), boundary timestamps, and human-readable range formatting. |

---

## 🔐 Token Acquisition & Resilience (`geminiClient.ts`)

To ensure robust authentication without exposing API keys:

1. **Automatic Bearer Token Extraction**:
   ```typescript
   async function getAuthHeaders(forceRefresh = false): Promise<Record<string, string>> {
     const user = auth.currentUser;
     if (!user) return { 'Content-Type': 'application/json' };
     const token = await user.getIdToken(forceRefresh);
     return {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`,
     };
   }
   ```
2. **Two-Phase 401 Retry**: If an API route returns `401 Unauthorized` (e.g. due to token expiration during a long reflection session), `geminiClient.ts` immediately forces a token refresh (`getIdToken(true)`) and transparently retries the request before throwing an error.

3. **Undefined Stripping**: Cleanses client payloads before transmission to ensure strict serialization hygiene.

---

## 🎨 Design Tokens (`designTokens.ts`)

Defines mathematically coherent design standards:
- **Warm Neutral Palette**: Warm stone backgrounds (`bg-stone-50`, `bg-stone-100`) paired with deep stone typography (`text-stone-900`) and amber accents (`text-amber-800`, `bg-amber-100`).
- **Typography Scale**: Major second ratio ensuring legibility and rhythmic hierarchy.
- **Button Standards**: Explicit 2:1 horizontal-to-vertical padding ratios with distinct active and hover states.
