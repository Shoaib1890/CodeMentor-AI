'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Brain, ShieldAlert, Sparkles, CheckCircle2, ChevronRight, HelpCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AnalysisPage() {
  const queryClient = useQueryClient();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch latest analysis
  const { data: report, isLoading } = useQuery({
    queryKey: ['analysis'],
    queryFn: async () => {
      const res = await fetch('/api/analysis/latest');
      if (!res.ok) throw new Error('Failed to fetch analysis');
      const json = await res.json();
      return json.data;
    }
  });

  const runAnalysisMutation = useMutation({
    mutationFn: async () => {
      setAnalyzing(true);
      setError(null);
      const res = await fetch('/api/analysis/run', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to trigger re-analysis');
      }
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setAnalyzing(false);
    },
    onError: (err: any) => {
      setError(err.message || 'Analysis run failed. Please try again.');
      setAnalyzing(false);
    }
  });

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'moderate':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'Critical Gap';
      case 'moderate':
        return 'Moderate Focus';
      default:
        return 'Mild Practice';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded-lg" />
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(n => <div key={n} className="h-44 bg-slate-900/40 rounded-2xl border border-white/5" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">AI Topic Diagnostic Matrix</h1>
          <p className="text-xs text-slate-400">
            A comprehensive, ranked analysis of your DSA capability profile.
          </p>
        </div>

        <button
          onClick={() => runAnalysisMutation.mutate()}
          disabled={analyzing}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors font-extrabold text-white text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-40"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {analyzing ? 'Re-analyzing Profile...' : 'Run Diagnostics'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Weakness List */}
      <div className="flex flex-col gap-6">
        {report && report.weakTopics && report.weakTopics.length > 0 ? (
          report.weakTopics.map((topic: any) => {
            const badgeStyle = getSeverityBadgeClass(topic.severity);
            const badgeLabel = getSeverityLabel(topic.severity);

            return (
              <div
                key={topic.topicSlug}
                className="glass-card p-6 rounded-2xl flex flex-col md:flex-row justify-between gap-6 items-start md:items-center border border-white/5 bg-slate-950/20"
              >
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-slate-100">{topic.topicName}</span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badgeStyle}`}>
                      {badgeLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Rank {topic.rank}</span>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed max-w-2xl">
                    {topic.explanation}
                  </p>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col gap-1.5">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wide">Recommended Action Plan</span>
                    <span className="text-xs text-slate-300 leading-relaxed font-semibold">
                      {topic.recommendedAction}
                    </span>
                  </div>
                </div>

                {/* Score Dial */}
                <div className="flex flex-col items-center md:items-end justify-center gap-1 shrink-0 self-center md:self-auto">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Weakness Rating</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-black ${
                      topic.severity === 'critical' ? 'text-rose-400' : (topic.severity === 'moderate' ? 'text-amber-400' : 'text-emerald-400')
                    }`}>
                      {Math.round(topic.weaknessScore)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">%</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-card p-12 rounded-3xl text-center flex flex-col items-center gap-4 max-w-md mx-auto my-6">
            <Brain className="w-12 h-12 text-slate-500 animate-pulse" />
            <h2 className="text-lg font-bold text-white">No Analysis Record Found</h2>
            <p className="text-xs text-slate-400">Trigger a diagnostics run to analyze your LeetCode database and outline your DSA weaknesses.</p>
            <button
              onClick={() => runAnalysisMutation.mutate()}
              disabled={analyzing}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl transition-all"
            >
              Analyze Profile Now
            </button>
          </div>
        )}
      </div>

      {analyzing && (
        <div className="fixed inset-0 bg-[#080b11]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400 animate-pulse">Running AI weakness evaluation models...</span>
        </div>
      )}
    </div>
  );
}
