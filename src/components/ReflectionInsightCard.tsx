import React from 'react';
import {
  Sparkles,
  RefreshCw,
  Quote,
  Target,
  AlertCircle,
  Award,
  CheckCircle2,
  Users,
  MapPin,
  HelpCircle,
  Lightbulb,
  Clock,
  Compass,
  Heart,
} from 'lucide-react';
import type { ReflectionInsight, JournalEntry } from '../types.ts';

interface ReflectionInsightCardProps {
  insight: ReflectionInsight;
  entry: JournalEntry;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export const ReflectionInsightCard: React.FC<ReflectionInsightCardProps> = ({
  insight,
  entry,
  onRegenerate,
  isRegenerating,
}) => {
  const isStale = insight.entryUpdatedAtAtAnalysis < entry.updatedAt;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasAnyInsights =
    insight.themes.length > 0 ||
    insight.expressedEmotions.length > 0 ||
    insight.goals.length > 0 ||
    insight.challenges.length > 0 ||
    insight.achievements.length > 0 ||
    insight.possibleActions.length > 0 ||
    insight.peopleMentioned.length > 0 ||
    insight.placesMentioned.length > 0 ||
    insight.openQuestions.length > 0;

  return (
    <div id="reflection-insights-container" className="space-y-6">
      {/* Header & Status Banner */}
      <div
        id="insights-header-banner"
        className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs transition-all"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-lg font-semibold text-stone-900">
                  Reflection Insights
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-stone-100 text-stone-600 border border-stone-200">
                  {insight.modelUsed}
                </span>
                {isStale && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Updated since analysis
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Grounded in what you wrote &bull; Generated {formatDate(insight.generatedAt)}
              </p>
            </div>
          </div>

          <button
            id="regenerate-insights-btn"
            type="button"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-medium border border-stone-300 text-stone-700 bg-stone-50 hover:bg-stone-100 active:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin text-amber-700' : 'text-stone-500'}`} />
            <span>{isRegenerating ? 'Reflecting...' : isStale ? 'Update Insights' : 'Regenerate'}</span>
          </button>
        </div>

        {isStale && (
          <div
            id="stale-insight-notice"
            className="mt-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="leading-relaxed">
              You added or edited reflection turns after these insights were created. Click <strong>Update Insights</strong> to review your latest thoughts.
            </span>
          </div>
        )}
      </div>

      {!hasAnyInsights && (
        <div
          id="empty-insights-card"
          className="bg-stone-50/60 border border-stone-200 rounded-2xl p-8 text-center"
        >
          <Sparkles className="w-8 h-8 text-stone-400 mx-auto mb-3" />
          <h4 className="font-serif text-base font-semibold text-stone-800 mb-1">
            No distinct themes detected yet
          </h4>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            Your reflection is saved quietly. As you write more in this entry, MindMirror will gently discover grounded themes and patterns.
          </p>
        </div>
      )}

      {/* Themes & Patterns */}
      {insight.themes.length > 0 && (
        <section id="insight-section-themes" className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <h4 className="font-serif text-sm font-semibold text-stone-900 tracking-wide uppercase">
              Themes &amp; Patterns
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {insight.themes.map((theme, index) => (
              <div
                key={`theme-${index}`}
                id={`insight-theme-${index}`}
                className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md inline-block">
                    Observation
                  </span>
                  <p className="text-sm font-semibold text-stone-900 leading-snug">
                    {theme.observation}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100">
                  <div className="bg-amber-50/50 border border-amber-200/70 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] font-mono font-semibold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                      <Quote className="w-2.5 h-2.5 text-amber-700" />
                      Verbatim Quote From Your Journal:
                    </span>
                    <blockquote className="text-xs font-serif italic text-stone-800 leading-relaxed pl-1">
                      &ldquo;{theme.evidenceQuote}&rdquo;
                    </blockquote>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Expressed Emotions */}
      {insight.expressedEmotions.length > 0 && (
        <section id="insight-section-emotions" className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Heart className="w-4 h-4 text-rose-700" />
            <h4 className="font-serif text-sm font-semibold text-stone-900 tracking-wide uppercase">
              Expressed Feelings &amp; States
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {insight.expressedEmotions.map((emotion, index) => (
              <div
                key={`emotion-${index}`}
                id={`insight-emotion-${index}`}
                className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-rose-900 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md inline-block">
                    Observation
                  </span>
                  <p className="text-sm font-semibold text-stone-900 leading-snug">
                    {emotion.observation}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100">
                  <div className="bg-rose-50/40 border border-rose-200/70 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] font-mono font-semibold text-rose-900 uppercase tracking-wider flex items-center gap-1">
                      <Quote className="w-2.5 h-2.5 text-rose-700" />
                      Verbatim Quote From Your Journal:
                    </span>
                    <blockquote className="text-xs font-serif italic text-stone-800 leading-relaxed pl-1">
                      &ldquo;{emotion.evidenceQuote}&rdquo;
                    </blockquote>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Goals & Intentions */}
      {insight.goals.length > 0 && (
        <section id="insight-section-goals" className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Target className="w-4 h-4 text-teal-700" />
            <h4 className="font-serif text-sm font-semibold text-stone-900 tracking-wide uppercase">
              Goals &amp; Intentions
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {insight.goals.map((goal, index) => (
              <div
                key={`goal-${index}`}
                id={`insight-goal-${index}`}
                className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-teal-900 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-md inline-block">
                    Observation
                  </span>
                  <p className="text-sm font-semibold text-stone-900 leading-snug">
                    {goal.observation}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100">
                  <div className="bg-teal-50/40 border border-teal-200/70 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] font-mono font-semibold text-teal-900 uppercase tracking-wider flex items-center gap-1">
                      <Quote className="w-2.5 h-2.5 text-teal-700" />
                      Verbatim Quote From Your Journal:
                    </span>
                    <blockquote className="text-xs font-serif italic text-stone-800 leading-relaxed pl-1">
                      &ldquo;{goal.evidenceQuote}&rdquo;
                    </blockquote>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Challenges & Dilemmas */}
      {insight.challenges.length > 0 && (
        <section id="insight-section-challenges" className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <h4 className="font-serif text-sm font-semibold text-stone-900 tracking-wide uppercase">
              Tensions &amp; Obstacles
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {insight.challenges.map((challenge, index) => (
              <div
                key={`challenge-${index}`}
                id={`insight-challenge-${index}`}
                className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md inline-block">
                    Observation
                  </span>
                  <p className="text-sm font-semibold text-stone-900 leading-snug">
                    {challenge.observation}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100">
                  <div className="bg-amber-50/50 border border-amber-200/70 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] font-mono font-semibold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                      <Quote className="w-2.5 h-2.5 text-amber-700" />
                      Verbatim Quote From Your Journal:
                    </span>
                    <blockquote className="text-xs font-serif italic text-stone-800 leading-relaxed pl-1">
                      &ldquo;{challenge.evidenceQuote}&rdquo;
                    </blockquote>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Achievements & Breakthroughs */}
      {insight.achievements.length > 0 && (
        <section id="insight-section-achievements" className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Award className="w-4 h-4 text-emerald-700" />
            <h4 className="font-serif text-sm font-semibold text-stone-900 tracking-wide uppercase">
              Achievements &amp; Progress
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {insight.achievements.map((achievement, index) => (
              <div
                key={`achievement-${index}`}
                id={`insight-achievement-${index}`}
                className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-900 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md inline-block">
                    Observation
                  </span>
                  <p className="text-sm font-semibold text-stone-900 leading-snug">
                    {achievement.observation}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100">
                  <div className="bg-emerald-50/40 border border-emerald-200/70 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] font-mono font-semibold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                      <Quote className="w-2.5 h-2.5 text-emerald-700" />
                      Verbatim Quote From Your Journal:
                    </span>
                    <blockquote className="text-xs font-serif italic text-stone-800 leading-relaxed pl-1">
                      &ldquo;{achievement.evidenceQuote}&rdquo;
                    </blockquote>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Possible Next Actions */}
      {insight.possibleActions.length > 0 && (
        <section id="insight-section-actions" className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <CheckCircle2 className="w-4 h-4 text-amber-700" />
            <h4 className="font-serif text-sm font-semibold text-stone-900 tracking-wide uppercase">
              Mindful Micro-Steps
            </h4>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2">
            {insight.possibleActions.map((action, index) => (
              <div
                key={`action-${index}`}
                id={`insight-action-${index}`}
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-stone-50/70 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono">
                  {index + 1}
                </div>
                <p className="text-sm text-stone-800 leading-relaxed">{action}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* People & Places Mentioned */}
      {(insight.peopleMentioned.length > 0 || insight.placesMentioned.length > 0) && (
        <section id="insight-section-entities" className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Lightbulb className="w-4 h-4 text-stone-600" />
            <h4 className="font-serif text-sm font-semibold text-stone-900 tracking-wide uppercase">
              Entities Referenced
            </h4>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {insight.peopleMentioned.length > 0 && (
              <div>
                <span className="text-xs font-mono font-medium text-stone-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5 text-stone-400" /> People Mentioned
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {insight.peopleMentioned.map((person, idx) => (
                    <span
                      key={`person-${idx}`}
                      className="text-xs px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 border border-stone-200/80 font-medium"
                    >
                      {person}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {insight.placesMentioned.length > 0 && (
              <div>
                <span className="text-xs font-mono font-medium text-stone-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" /> Places Mentioned
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {insight.placesMentioned.map((place, idx) => (
                    <span
                      key={`place-${idx}`}
                      className="text-xs px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 border border-stone-200/80 font-medium"
                    >
                      {place}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Contemplative Open Questions */}
      {insight.openQuestions.length > 0 && (
        <section id="insight-section-questions" className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <HelpCircle className="w-4 h-4 text-amber-700" />
            <h4 className="font-serif text-sm font-semibold text-stone-900 tracking-wide uppercase">
              Open Inquiries to Ponder
            </h4>
          </div>
          <div className="space-y-2.5">
            {insight.openQuestions.map((question, index) => (
              <div
                key={`question-${index}`}
                id={`insight-question-${index}`}
                className="bg-amber-50/40 border border-amber-200/60 rounded-2xl p-4 flex items-start gap-3"
              >
                <span className="text-base text-amber-700 mt-0.5 select-none font-serif">&ldquo;</span>
                <p className="font-serif italic text-sm text-stone-800 leading-relaxed">
                  {question}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
