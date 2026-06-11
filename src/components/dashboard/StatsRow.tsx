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
      label: 'LeetCode Solved',
      value: stats.totalSolved,
      subtext: `${stats.easySolved} easy • ${stats.mediumSolved} med • ${stats.hardSolved} hard`,
      icon: Award,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    },
    {
      label: 'Solve Acceptance',
      value: `${stats.acceptanceRate}%`,
      subtext: 'Average attempt accuracy',
      icon: Target,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    },
    {
      label: 'Practice Streak',
      value: `${stats.currentStreak} Days`,
      subtext: 'Consecutive active days',
      icon: Flame,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    },
    {
      label: 'Overall Weakness',
      value: `${overallWeaknessScore}%`,
      subtext: overallWeaknessScore > 70 ? 'Critical gaps detected' : (overallWeaknessScore > 40 ? 'Moderate focus areas' : 'Ready for interviews'),
      icon: BrainCircuit,
      color: overallWeaknessScore > 70 
        ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' 
        : (overallWeaknessScore > 40 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20')
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="glass-card p-6 rounded-2xl flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{card.label}</span>
              <span className="text-3xl font-extrabold text-white tracking-tight">{card.value}</span>
              <span className="text-xs text-slate-500 leading-none">{card.subtext}</span>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${card.color} shadow-lg shadow-black/10`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
