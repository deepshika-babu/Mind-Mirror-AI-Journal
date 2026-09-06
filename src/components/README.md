# UI Components Directory (`/src/components`)

This directory contains all modular React components, view containers, navigation bars, and modals.

---

## 📋 Component Index

| Component | Responsibility |
| :--- | :--- |
| `LandingPage.tsx` | Unauthenticated public view highlighting Gemini 3.8 Flash, security badges, and Google Sign-In trigger. |
| `HomePage.tsx` | Authenticated dashboard displaying personalized greeting, lifetime statistics, quick reflection starters, and recent history. |
| `EntryWorkspace.tsx` | Core multi-turn reflective journaling workspace with cognitive lens selection, real-time message turns, auto-scroll, and auto-save. |
| `SidebarHistory.tsx` | Searchable, chronological list of past journal reflections with date grouping, turn badges, and deletion controls. |
| `ReflectionInsightCard.tsx` | Structured single-entry insight visualizer displaying themes, emotions, goals, and challenges with verbatim user quotes. |
| `MemoryThreadsView.tsx` | Longitudinal cross-entry theme synthesizer highlighting behavioral patterns, timeline spans, and referenced entries. |
| `WeeklyReflectionView.tsx` | 7-day retrospective reflection view with ISO calendar week selector, emotional patterns, triumphs, and actionable takeaways. |
| `Navbar.tsx` | Desktop header with branding, primary view navigation tabs, active indicators, and user avatar menu. |
| `MobileBottomNav.tsx` | Responsive mobile bottom navigation bar adhering to 44px+ touch-target accessibility standards. |
| `SettingsPage.tsx` | User preferences manager (default lens, timestamps) and full-archive Markdown and JSON export tools. |
| `PrivacyPage.tsx` | Security transparency view detailing Cloud Firestore user isolation, zero-hardcoded secrets, and data rights. |
| `DeleteConfirmationModal.tsx` | Accessible modal dialog preventing accidental deletion of reflections and confirming cascading cleanup. |

---

## 🔍 Deep-Dive: Core Workspaces & Views

### `EntryWorkspace.tsx`
- **Dynamic Cognitive Lenses**: Allows users to dynamically switch between `reflect`, `summarize`, `brainstorm`, and `action_plan` on any turn.
- **Visual Distinction**: User turns render in high-contrast stone cards, while Gemini counsel renders in subtle warm amber cards with model badges (`gemini-3.8-flash`).
- **Resilient Submission**: Guards against empty submissions, disables inputs during in-flight network requests, and displays accessible retry banners upon failure.

### `ReflectionInsightCard.tsx`
- **Quote Grounding**: Observational findings are paired with exact verbatim snippets from user input, highlighted in styled amber pill tags.
- **Interactive Source Linking**: Clicking on a quote badge scrolls the workspace directly to the corresponding turn ID.

### `WeeklyReflectionView.tsx`
- **ISO Week Navigation**: Uses `weekUtils.ts` to compute previous, current, and next week intervals (`YYYY-Www`).
- **Synthesis Engine**: Triggers `/api/weekly-reflection` to aggregate reflections, themes, and emotional patterns for the selected period.
- **Export & Portability**: Provides one-click markdown copy and clean deletion actions.
