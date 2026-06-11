interface DifficultyProps {
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

export default function DifficultyChart({ easy, medium, hard, total }: DifficultyProps) {
  const safeTotal = total || 1;
  const easyPct = Math.round((easy / safeTotal) * 100);
  const mediumPct = Math.round((medium / safeTotal) * 100);
  const hardPct = Math.round((hard / safeTotal) * 100);

  const tracks = [
    {
      label: 'Easy Questions',
      count: easy,
      pct: easyPct,
      color: 'from-emerald-500 to-teal-400 shadow-emerald-500/20',
      textColor: 'text-emerald-400 bg-emerald-500/10'
    },
    {
      label: 'Medium Questions',
      count: medium,
      pct: mediumPct,
      color: 'from-amber-500 to-orange-400 shadow-amber-500/20',
      textColor: 'text-amber-400 bg-amber-500/10'
    },
    {
      label: 'Hard Questions',
      count: hard,
      pct: hardPct,
      color: 'from-rose-500 to-red-400 shadow-rose-500/20',
      textColor: 'text-rose-400 bg-rose-500/10'
    }
  ];

  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
        <div className="flex flex-col">
          <span className="font-bold text-base text-slate-100">Difficulty Distribution</span>
          <span className="text-xs text-slate-400">Solved counts by difficulty category</span>
        </div>
        <span className="text-xs bg-slate-800 text-slate-300 border border-[var(--card-border)] px-2.5 py-1 rounded-full font-semibold">
          {total} Total Solved
        </span>
      </div>

      <div className="flex flex-col gap-6 justify-center flex-1">
        {tracks.map((track, idx) => (
          <div key={idx} className="flex flex-col gap-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-slate-300">{track.label}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-extrabold text-white">{track.count}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${track.textColor}`}>
                  {track.pct}%
                </span>
              </div>
            </div>
            {/* Custom styled HTML bar */}
            <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full bg-gradient-to-r ${track.color} rounded-full transition-all duration-1000 shadow-lg`} 
                style={{ width: `${track.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
