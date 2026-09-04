/**
 * MindMirror Design Tokens
 * Reusable visual tokens preserving the editorial identity:
 * - Warm orange/amber accent (#b45309 / amber-700)
 * - Cream and stone surfaces (stone-50 / stone-100 / white)
 * - Deep stone typography (stone-900 / stone-800)
 * - Serif display typography (font-serif)
 * - Rounded cards (rounded-2xl) and subtle hairline borders (border-stone-200)
 */

export const tokens = {
  colors: {
    accent: {
      default: 'text-amber-700',
      bg: 'bg-amber-700',
      bgHover: 'hover:bg-amber-800',
      softBg: 'bg-amber-50',
      border: 'border-amber-200',
      focusRing: 'focus:ring-amber-700 focus:border-amber-700',
    },
    surface: {
      canvas: 'bg-stone-100',
      paper: 'bg-white',
      card: 'bg-white border border-stone-200',
      subtle: 'bg-stone-50/80',
      inset: 'bg-stone-100/70 border border-stone-200/80',
    },
    text: {
      title: 'text-stone-900',
      body: 'text-stone-700',
      muted: 'text-stone-500',
      subtle: 'text-stone-400',
    },
    status: {
      successBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      warningBg: 'bg-amber-50 text-amber-800 border-amber-200',
      errorBg: 'bg-rose-50 text-rose-800 border-rose-200',
    },
  },
  typography: {
    h1: 'font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900',
    h2: 'font-serif text-xl sm:text-2xl font-semibold tracking-tight text-stone-900',
    h3: 'font-serif text-lg font-medium text-stone-900',
    editorialQuote: 'font-serif italic text-stone-800',
    metaEyebrow: 'text-xs font-semibold uppercase tracking-wider text-stone-500',
    bodyText: 'text-sm text-stone-700 leading-relaxed',
    bodySubtle: 'text-xs text-stone-500 leading-normal',
  },
  cards: {
    standard: 'bg-white rounded-2xl border border-stone-200 shadow-xs',
    interactive: 'bg-white rounded-2xl border border-stone-200 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer',
    elevated: 'bg-white rounded-2xl border border-stone-200 shadow-sm',
    accentPanel: 'bg-amber-50/50 rounded-2xl border border-amber-200/70 shadow-xs',
  },
  buttons: {
    primary: 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs sm:text-sm transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-40 disabled:pointer-events-none',
    secondary: 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-medium text-xs sm:text-sm transition-all shadow-xs cursor-pointer',
    ghost: 'p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer',
    pill: 'px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1.5',
  },
  badges: {
    accent: 'inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200',
    success: 'inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200',
    neutral: 'inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200',
  },
} as const;
