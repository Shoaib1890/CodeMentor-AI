'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Brain, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AnalysisPage() {
  const queryClient = useQueryClient();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(err.message || 'Analysis failed. Please try again.');
      setAnalyzing(false);
    }
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'badge-danger';
      case 'moderate': return 'badge-warning';
      default: return 'badge-success';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Critical gap';
      case 'moderate': return 'Moderate focus';
      default: return 'Mild practice';
    }
  };

  const getScoreColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400';
      case 'moderate': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-7 w-48 bg-[var(--card)] rounded-md" />
        {[1, 2, 3].map(n => <div key={n} className="h-36 bg-[var(--card)] rounded-md border border-[var(--border)]" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="page-header">
          <h1 className="page-title">Weakness analysis</h1>
          <p className="page-description">Ranked breakdown of your DSA topic coverage</p>
        </div>

        <button
          onClick={() => runAnalysisMutation.mutate()}
          disabled={analyzing}
          className="btn-primary text-sm disabled:opacity-40 self-start"
        >
          {analyzing ? 'Running analysis...' : 'Re-run analysis'}
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-md bg-red-500/5 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {report && report.weakTopics && report.weakTopics.length > 0 ? (
          report.weakTopics.map((topic: any) => (
            <div key={topic.topicSlug} className="card p-5 flex flex-col md:flex-row justify-between gap-5">
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{topic.topicName}</span>
                  <span className={`badge ${getSeverityBadge(topic.severity)}`}>
                    {getSeverityLabel(topic.severity)}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">Rank {topic.rank}</span>
                </div>

                <p className="text-sm text-[var(--muted)] leading-relaxed max-w-2xl">
                  {topic.explanation}
                </p>

                <div className="p-3.5 rounded-md bg-[var(--background)] border border-[var(--border)]">
                  <span className="text-[11px] font-medium text-[var(--accent)] block mb-1">Recommended action</span>
                  <span className="text-sm text-[var(--foreground)]">{topic.recommendedAction}</span>
                </div>
              </div>

              <div className="flex flex-col items-center md:items-end justify-center gap-0.5 shrink-0">
                <span className="text-[11px] text-[var(--muted-foreground)] font-medium">Weakness score</span>
                <div className="flex items-baseline gap-0.5">
                  <span className={`text-3xl font-semibold ${getScoreColor(topic.severity)}`}>
                    {Math.round(topic.weaknessScore)}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">%</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-10 text-center flex flex-col items-center gap-4 max-w-md mx-auto">
            <Brain className="w-10 h-10 text-[var(--muted-foreground)]" />
            <h2 className="text-base font-semibold">No analysis yet</h2>
            <p className="text-sm text-[var(--muted)]">Run a diagnostic to analyze your LeetCode data and identify weak topics.</p>
            <button
              onClick={() => runAnalysisMutation.mutate()}
              disabled={analyzing}
              className="btn-primary text-sm"
            >
              Run analysis
            </button>
          </div>
        )}
      </div>

      {report && report.weakTopics && report.weakTopics.length > 0 && (
        <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[var(--accent-muted)] border-blue-500/20">
          <p className="text-sm text-[var(--muted)]">Ready to start practicing? Your study plan is built around these weaknesses.</p>
          <Link href="/study-plan" className="btn-primary text-xs py-2 shrink-0">
            Go to study plan <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {analyzing && (
        <div className="fixed inset-0 bg-[var(--background)]/80 z-50 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
          <span className="text-sm text-[var(--muted)]">Analyzing your profile...</span>
        </div>
      )}
    </div>
  );
}
