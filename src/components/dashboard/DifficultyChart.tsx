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
    { label: 'Easy', count: easy, pct: easyPct, color: 'bg-green-500', textClass: 'badge-success' },
    { label: 'Medium', count: medium, pct: mediumPct, color: 'bg-yellow-500', textClass: 'badge-warning' },
    { label: 'Hard', count: hard, pct: hardPct, color: 'bg-red-500', textClass: 'badge-danger' },
  ];

  return (
    <div className="card p-5 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <p className="font-medium text-sm">Difficulty distribution</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">Solved by difficulty</p>
        </div>
        <span className="badge badge-neutral">{total} total</span>
      </div>

      <div className="flex flex-col gap-5 justify-center flex-1">
        {tracks.map((track) => (
          <div key={track.label} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-medium text-[var(--muted)]">{track.label}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold">{track.count}</span>
                <span className={`badge ${track.textClass}`}>{track.pct}%</span>
              </div>
            </div>
            <div className="h-2 w-full bg-[var(--background)] rounded-full overflow-hidden border border-[var(--border)]">
              <div
                className={`h-full ${track.color} rounded-full transition-all duration-700`}
                style={{ width: `${track.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
