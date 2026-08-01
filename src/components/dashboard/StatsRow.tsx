import { Award, Flame, Target, BrainCircuit } from 'lucide-react';

interface StatsRowProps {
  stats: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    acceptanceRate: number;
    currentStreak: number;
  };
  overallWeaknessScore: number;
}

export default function StatsRow({ stats, overallWeaknessScore }: StatsRowProps) {
  const cards = [
    {
      label: 'Problems solved',
      value: stats.totalSolved,
      subtext: `${stats.easySolved} easy · ${stats.mediumSolved} medium · ${stats.hardSolved} hard`,
      icon: Award,
    },
    {
      label: 'Acceptance rate',
      value: `${stats.acceptanceRate}%`,
      subtext: 'Average attempt accuracy',
      icon: Target,
    },
    {
      label: 'Practice streak',
      value: `${stats.currentStreak} days`,
      subtext: 'Consecutive active days',
      icon: Flame,
    },
    {
      label: 'Overall weakness',
      value: `${overallWeaknessScore}%`,
      subtext: overallWeaknessScore > 70 ? 'Critical gaps detected' : (overallWeaknessScore > 40 ? 'Moderate focus areas' : 'On track'),
      icon: BrainCircuit,
      severity: overallWeaknessScore > 70 ? 'danger' : (overallWeaknessScore > 40 ? 'warning' : 'success'),
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="card p-5 flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--muted)]">{card.label}</span>
              <span className="text-2xl font-semibold tracking-tight">{card.value}</span>
              <span className="text-xs text-[var(--muted-foreground)]">{card.subtext}</span>
            </div>
            <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
              card.severity === 'danger' ? 'bg-red-500/10 text-red-400' :
              card.severity === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
              card.severity === 'success' ? 'bg-green-500/10 text-green-400' :
              'bg-[var(--accent-muted)] text-[var(--accent)]'
            }`}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
