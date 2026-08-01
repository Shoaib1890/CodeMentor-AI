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
  const getSeverityStyle = (score: number, solved: number) => {
    if (solved === 0) {
      return {
        card: 'border-[var(--border)] bg-[var(--background)]',
        badge: 'badge-neutral',
        badgeText: 'Not attempted',
        text: 'text-[var(--muted)]',
      };
    }
    if (score >= 75) {
      return {
        card: 'border-red-500/20 bg-red-500/5',
        badge: 'badge-danger',
        badgeText: 'Critical',
        text: 'text-[var(--foreground)]',
      };
    }
    if (score >= 45) {
      return {
        card: 'border-yellow-500/20 bg-yellow-500/5',
        badge: 'badge-warning',
        badgeText: 'Moderate',
        text: 'text-[var(--foreground)]',
      };
    }
    return {
      card: 'border-green-500/20 bg-green-500/5',
      badge: 'badge-success',
      badgeText: 'Strong',
      text: 'text-[var(--foreground)]',
    };
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div>
          <p className="font-medium text-sm">Topic analysis</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">Your DSA coverage ranked by priority</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500/40" /> Critical
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-500/40" /> Moderate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500/40" /> Strong
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--border)]" /> Not attempted
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {topicStats.map((topic) => {
          const style = getSeverityStyle(topic.weaknessScore, topic.totalSolved);
          return (
            <div
              key={topic.topicSlug}
              className={`p-3.5 rounded-md border flex flex-col justify-between gap-3 transition-colors ${style.card}`}
            >
              <div>
                <span className={`font-medium text-xs block truncate ${style.text}`} title={topic.topicName}>
                  {topic.topicName}
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)] mt-0.5 block">
                  {topic.totalSolved} solved
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className={`badge ${style.badge}`}>{style.badgeText}</span>
                {topic.totalSolved > 0 && (
                  <span className="text-[11px] font-semibold text-[var(--muted)]">
                    {Math.round(topic.weaknessScore)}%
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
