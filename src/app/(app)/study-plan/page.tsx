'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CalendarRange, Check, CheckSquare, Square, ChevronDown, ChevronUp, ExternalLink, ShieldAlert } from 'lucide-react';

export default function StudyPlanPage() {
  const queryClient = useQueryClient();
  const [regenerating, setRegenerating] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const { data: plan, isLoading } = useQuery({
    queryKey: ['study-plan'],
    queryFn: async () => {
      const res = await fetch('/api/study-plan/current');
      if (!res.ok) throw new Error('Failed to fetch study plan');
      const json = await res.json();
      return json.data;
    }
  });

  const toggleProblemMutation = useMutation({
    mutationFn: async ({ problemId, isCompleted }: { problemId: string; isCompleted: boolean }) => {
      const res = await fetch(`/api/study-plan/problems/${problemId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to toggle problem');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plan'] });
    }
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      setRegenerating(true);
      setError(null);
      const res = await fetch('/api/study-plan/regenerate', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to regenerate plan');
      }
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plan'] });
      setRegenerating(false);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to regenerate plan.');
      setRegenerating(false);
    }
  });

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks(prev => ({ ...prev, [weekId]: !prev[weekId] }));
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'easy': return 'badge-success';
      case 'medium': return 'badge-warning';
      default: return 'badge-danger';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-7 w-48 bg-[var(--card)] rounded-md" />
        <div className="h-20 bg-[var(--card)] rounded-md border border-[var(--border)]" />
        {[1, 2, 3].map(n => <div key={n} className="h-16 bg-[var(--card)] rounded-md border border-[var(--border)]" />)}
      </div>
    );
  }

  const weeks = plan?.weeks || [];
  const totalProblems = plan?.totalProblems || 0;
  const completedProblems = plan?.completedProblems || 0;
  const progressPct = totalProblems > 0 ? Math.round((completedProblems / totalProblems) * 100) : 0;

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="page-header">
          <h1 className="page-title">Study plan</h1>
          <p className="page-description">Week-by-week curriculum targeting your weak areas</p>
        </div>

        {plan && (
          <button
            onClick={() => regenerateMutation.mutate()}
            disabled={regenerating}
            className="btn-secondary text-sm self-start disabled:opacity-40"
          >
            {regenerating ? 'Regenerating...' : 'Regenerate plan'}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-md bg-red-500/5 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {plan ? (
        <div className="flex flex-col gap-6">
          <div className="card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div>
              <span className="text-xs font-medium text-[var(--muted)]">Overall progress</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-semibold">{completedProblems}</span>
                <span className="text-sm text-[var(--muted)]">of {totalProblems} problems</span>
              </div>
              <span className="text-xs text-[var(--muted-foreground)] mt-1 block">
                Target: {plan.targetDate} · {plan.daysRemaining} days remaining
              </span>
            </div>

            <div className="flex-1 w-full max-w-sm flex items-center gap-3">
              <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden flex-1 border border-[var(--border)]">
                <div
                  className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-[var(--accent)] w-10 text-right">{progressPct}%</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {weeks.map((week: any) => {
              const isOpen = expandedWeeks[week.weekId] !== false;
              const weekDoneCount = week.problems.filter((p: any) => p.isCompleted).length;
              const weekTotalCount = week.problems.length;
              const isWeekFullyCompleted = weekDoneCount === weekTotalCount && weekTotalCount > 0;

              return (
                <div
                  key={week.weekId}
                  className={`border rounded-md overflow-hidden transition-colors ${
                    isOpen ? 'border-[var(--border)] bg-[var(--card)]' : 'border-[var(--border)] bg-[var(--card)]'
                  }`}
                >
                  <button
                    onClick={() => toggleWeek(week.weekId)}
                    className="w-full p-4 flex items-center justify-between gap-4 hover:bg-[var(--card-elevated)] transition-colors text-left"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--accent)]">Week {week.weekNumber}</span>
                        <span className="text-[var(--border)]">·</span>
                        <span className="text-sm font-medium">{week.focusTopicName}</span>
                      </div>

                      {isWeekFullyCompleted ? (
                        <span className="badge badge-success inline-flex items-center gap-1 w-fit">
                          <Check className="w-3 h-3" /> Complete
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {weekDoneCount}/{weekTotalCount} solved
                        </span>
                      )}
                    </div>

                    {isOpen ? <ChevronUp className="w-4 h-4 text-[var(--muted)] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[var(--muted)] shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-[var(--border)] pt-4 flex flex-col gap-3">
                      {week.weekDescription && (
                        <p className="text-sm text-[var(--muted)] leading-relaxed p-3 rounded-md bg-[var(--background)] border border-[var(--border)]">
                          {week.weekDescription}
                        </p>
                      )}

                      <div className="flex flex-col gap-1.5">
                        {week.problems.map((problem: any) => (
                          <div
                            key={problem.id}
                            className="flex items-center justify-between p-3 rounded-md bg-[var(--background)] border border-[var(--border)] gap-4"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                onClick={() => toggleProblemMutation.mutate({
                                  problemId: problem.id,
                                  isCompleted: !problem.isCompleted
                                })}
                                className="text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors shrink-0"
                              >
                                {problem.isCompleted ? (
                                  <CheckSquare className="w-4 h-4 text-[var(--accent)]" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                              <span className={`text-sm truncate ${problem.isCompleted ? 'text-[var(--muted-foreground)] line-through' : 'font-medium'}`}>
                                {problem.problemTitle}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`badge ${getDifficultyBadge(problem.difficulty)}`}>
                                {problem.difficulty}
                              </span>
                              <a
                                href={problem.leetcodeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded hover:bg-[var(--card-elevated)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                                title="Open on LeetCode"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card p-10 text-center flex flex-col items-center gap-4 max-w-md mx-auto">
          <CalendarRange className="w-10 h-10 text-[var(--muted-foreground)]" />
          <h2 className="text-base font-semibold">No study plan yet</h2>
          <p className="text-sm text-[var(--muted)]">Generate a plan based on your weakness analysis to get a week-by-week schedule.</p>
          <button
            onClick={() => regenerateMutation.mutate()}
            disabled={regenerating}
            className="btn-primary text-sm"
          >
            Create study plan
          </button>
        </div>
      )}

      {regenerating && (
        <div className="fixed inset-0 bg-[var(--background)]/80 z-50 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
          <span className="text-sm text-[var(--muted)]">Building your study plan...</span>
        </div>
      )}
    </div>
  );
}
