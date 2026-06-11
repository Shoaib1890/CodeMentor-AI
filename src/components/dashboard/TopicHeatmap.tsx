import Link from 'next/link';

interface TopicStat {
  topicSlug: string;
  topicName: string;
  totalSolved: number;
  weaknessScore: number;
  severityLabel: 'mild' | 'moderate' | 'critical';
}

interface TopicHeatmapProps {
  topicStats: TopicStat[];
}

export default function TopicHeatmap({ topicStats }: TopicHeatmapProps) {
  // Map severity styles
  const getSeverityStyle = (score: number, solved: number) => {
    if (solved === 0) {
      return {
        card: 'border-slate-800 bg-slate-950/20 hover:border-slate-700 hover:shadow-slate-500/5',
        badge: 'bg-slate-800 text-slate-400 border border-slate-700/50',
        badgeText: 'Unattempted',
        text: 'text-slate-400'
      };
    }
    if (score >= 75) {
      return {
        card: 'border-rose-500/20 bg-gradient-to-br from-rose-950/20 to-slate-900/10 hover:border-rose-500/40 hover:shadow-rose-500/5',
        badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
        badgeText: 'Critical',
        text: 'text-rose-200'
      };
    }
    if (score >= 45) {
      return {
        card: 'border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-slate-900/10 hover:border-amber-500/40 hover:shadow-amber-500/5',
        badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        badgeText: 'Moderate',
        text: 'text-amber-200'
      };
    }
    return {
      card: 'border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-slate-900/10 hover:border-emerald-500/40 hover:shadow-emerald-500/5',
      badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      badgeText: 'Strong',
      text: 'text-emerald-200'
    };
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
        <div className="flex flex-col">
          <span className="font-bold text-base text-slate-100">DSA Topic Analysis Matrix</span>
          <span className="text-xs text-slate-400">Heatmap of your skill profile sorted by priority</span>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase font-bold tracking-wider">
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/30" /> Critical Weakness
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/30" /> Moderate Gap
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/30" /> Strong Mastery
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" /> Not Attempted
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
        {topicStats.map((topic) => {
          const style = getSeverityStyle(topic.weaknessScore, topic.totalSolved);
          return (
            <div
              key={topic.topicSlug}
              className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all duration-300 shadow-md ${style.card}`}
            >
              <div className="flex flex-col gap-1">
                <span className={`font-semibold text-xs truncate ${style.text}`} title={topic.topicName}>
                  {topic.topicName}
                </span>
                <span className="text-[10px] text-slate-500">
                  {topic.totalSolved} solved
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mt-2">
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${style.badge}`}>
                  {style.badgeText}
                </span>
                {topic.totalSolved > 0 && (
                  <span className="text-[10px] font-extrabold text-slate-400">
                    {Math.round(topic.weaknessScore)}% <span className="text-[9px] font-normal text-slate-500">weak</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
