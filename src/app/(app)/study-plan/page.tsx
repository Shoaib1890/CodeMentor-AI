'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CalendarRange, Sparkles, Check, CheckSquare, Square, ChevronDown, ChevronUp, ExternalLink, ShieldAlert, Award } from 'lucide-react';

export default function StudyPlanPage() {
  const queryClient = useQueryClient();
  const [regenerating, setRegenerating] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch plan
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
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to toggle problem completion');
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
      setError(err.message || 'Failed to regenerate plan. Try again.');
      setRegenerating(false);
    }
  });

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekId]: !prev[weekId]
    }));
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded-lg" />
        <div className="h-12 w-full bg-slate-900/40 rounded-xl" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(n => <div key={n} className="h-20 bg-slate-900/40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // Auto-expand the first week if not done
  const weeks = plan?.weeks || [];
  
  // Calculate progress
  const totalProblems = plan?.totalProblems || 0;
  const completedProblems = plan?.completedProblems || 0;
  const progressPct = totalProblems > 0 ? Math.round((completedProblems / totalProblems) * 100) : 0;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Personalized study plan</h1>
          <p className="text-xs text-slate-400">
            A step-by-step curriculum targeting your weak areas.
          </p>
        </div>

        {plan && (
          <button
            onClick={() => regenerateMutation.mutate()}
            disabled={regenerating}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors font-extrabold text-white text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {regenerating ? 'Regenerating Plan...' : 'Regenerate Study Plan'}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {plan ? (
        <div className="flex flex-col gap-6">
          {/* Progress Tracker Card */}
          <div className="glass-card p-6 rounded-2xl bg-slate-950/20 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-1.5 w-full md:w-auto">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Overall Completion</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{completedProblems}</span>
                <span className="text-slate-400 text-xs font-semibold">of {totalProblems} problems completed</span>
              </div>
              <span className="text-[10px] text-slate-500">Target interview date: {plan.targetDate} ({plan.daysRemaining} days remaining)</span>
            </div>

            <div className="flex-1 w-full max-w-md flex items-center gap-4">
              <div className="h-3 bg-slate-900 rounded-full overflow-hidden flex-1 border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500 shadow-md shadow-indigo-500/20"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-sm font-extrabold text-indigo-400">{progressPct}%</span>
            </div>
          </div>

          {/* Weeks Accordion */}
          <div className="flex flex-col gap-4">
            {weeks.map((week: any) => {
              const isOpen = expandedWeeks[week.weekId] !== false; // Open by default
              const weekDoneCount = week.problems.filter((p: any) => p.isCompleted).length;
              const weekTotalCount = week.problems.length;
              const isWeekFullyCompleted = weekDoneCount === weekTotalCount && weekTotalCount > 0;

              return (
                <div 
                  key={week.weekId} 
                  className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                    isOpen ? 'border-indigo-500/30 bg-slate-950/20 shadow-lg' : 'border-[var(--card-border)] bg-slate-950/10 hover:border-slate-800'
                  }`}
                >
                  {/* Header */}
                  <div 
                    onClick={() => toggleWeek(week.weekId)}
                    className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/20 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">Week {week.weekNumber}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                        <span className="text-sm font-bold text-slate-200">{week.focusTopicName}</span>
                      </div>
                      
                      {isWeekFullyCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
                          <Check className="w-3 h-3" /> Complete
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {weekDoneCount} of {weekTotalCount} solved
                        </span>
                      )}
                    </div>

                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>

                  {/* Body Content */}
                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-[var(--card-border)] pt-4 flex flex-col gap-4">
                      {week.weekDescription && (
                        <p className="text-xs text-slate-400 leading-relaxed italic bg-slate-900/30 p-3.5 rounded-xl border border-white/5">
                          {week.weekDescription}
                        </p>
                      )}

                      <div className="flex flex-col gap-2">
                        {week.problems.map((problem: any) => (
                          <div 
                            key={problem.id}
                            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-white/5 hover:border-white/10 transition-colors gap-4"
                          >
                            <div className="flex items-center gap-3">
                              {/* Toggle Checkbox */}
                              <button
                                onClick={() => toggleProblemMutation.mutate({
                                  problemId: problem.id,
                                  isCompleted: !problem.isCompleted
                                })}
                                className="text-slate-400 hover:text-indigo-400 transition-colors shrink-0"
                              >
                                {problem.isCompleted ? (
                                  <CheckSquare className="w-4.5 h-4.5 text-indigo-500 fill-indigo-500/10" />
                                ) : (
                                  <Square className="w-4.5 h-4.5 text-slate-600" />
                                )}
                              </button>

                              <div className="flex flex-col gap-0.5">
                                <span className={`text-xs font-bold leading-none ${problem.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                  {problem.problemTitle}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${getDifficultyColor(problem.difficulty)}`}>
                                {problem.difficulty}
                              </span>

                              <a 
                                href={problem.leetcodeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                title="Solve on LeetCode"
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
        <div className="glass-card p-12 rounded-3xl text-center flex flex-col items-center gap-4 max-w-md mx-auto my-6">
          <CalendarRange className="w-12 h-12 text-slate-500 animate-pulse" />
          <h2 className="text-lg font-bold text-white">No Study Plan Active</h2>
          <p className="text-xs text-slate-400">Generate a study plan based on your weakness diagnostics to get a week-by-week schedule.</p>
          <button
            onClick={() => regenerateMutation.mutate()}
            disabled={regenerating}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl transition-all"
          >
            Create First Study Plan
          </button>
        </div>
      )}

      {regenerating && (
        <div className="fixed inset-0 bg-[#080b11]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400 animate-pulse">Running AI study scheduler algorithms...</span>
        </div>
      )}
    </div>
  );
}
