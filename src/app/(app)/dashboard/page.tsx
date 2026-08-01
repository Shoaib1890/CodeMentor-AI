'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import StatsRow from '@/components/dashboard/StatsRow';
import DifficultyChart from '@/components/dashboard/DifficultyChart';
import TopicHeatmap from '@/components/dashboard/TopicHeatmap';
import { BrainCircuit, RefreshCw, Clock, ArrowRight, CalendarRange } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      const json = await res.json();
      return json.data;
    }
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/leetcode/sync', { method: 'POST' });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-7 w-40 bg-[var(--card)] rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-24 bg-[var(--card)] rounded-md border border-[var(--border)]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-64 bg-[var(--card)] rounded-md border border-[var(--border)]" />
          <div className="h-64 bg-[var(--card)] rounded-md border border-[var(--border)]" />
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto my-12 flex flex-col items-center gap-4">
        <h2 className="text-base font-semibold">Unable to load dashboard</h2>
        <p className="text-sm text-[var(--muted)]">We couldn&apos;t fetch your LeetCode analytics. Try reconnecting your profile.</p>
        <Link href="/onboarding" className="btn-primary text-sm">
          Reconnect profile
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="page-header">
          <h1 className="page-title">Overview</h1>
          <p className="page-description">
            Analytics for <span className="text-[var(--foreground)] font-medium">@{dashboardData.leetcodeUsername || 'user'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--muted-foreground)]">
            Last synced {dashboardData.lastSyncedAt ? new Date(dashboardData.lastSyncedAt).toLocaleTimeString() : 'never'}
          </span>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn-secondary text-xs py-2 disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
      </div>

      {/* Next steps */}
      <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--accent-muted)] border-blue-500/20">
        <div>
          <p className="text-sm font-medium">Your preparation flow</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">Review your weaknesses, then follow your weekly study plan.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/analysis" className="btn-secondary text-xs py-2">
            <BrainCircuit className="w-3.5 h-3.5" />
            View analysis
          </Link>
          <Link href="/study-plan" className="btn-primary text-xs py-2">
            <CalendarRange className="w-3.5 h-3.5" />
            Study plan
          </Link>
        </div>
      </div>

      <StatsRow stats={dashboardData.stats} overallWeaknessScore={dashboardData.overallWeaknessScore} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <div className="lg:col-span-2 card p-5 flex flex-col">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-4 mb-4">
            <BrainCircuit className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-medium text-sm">AI summary</span>
          </div>
          <p className="text-sm text-[var(--muted)] leading-relaxed whitespace-pre-line flex-1">
            {dashboardData.aiSummary}
          </p>
          <div className="border-t border-[var(--border)] pt-4 mt-4">
            <Link
              href="/analysis"
              className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1 transition-colors"
            >
              Full weakness breakdown <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <DifficultyChart
          easy={dashboardData.stats.easySolved}
          medium={dashboardData.stats.mediumSolved}
          hard={dashboardData.stats.hardSolved}
          total={dashboardData.stats.totalSolved}
        />
      </div>

      <div className="card p-5">
        <TopicHeatmap topicStats={dashboardData.topicStats} />
      </div>

      <div className="card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-4">
          <Clock className="w-4 h-4 text-[var(--muted)]" />
          <span className="font-medium text-sm">Recent activity</span>
        </div>

        <div className="flex flex-col gap-2">
          {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 ? (
            dashboardData.recentActivity.map((act: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-md bg-[var(--background)] border border-[var(--border)]">
                <div>
                  <span className="text-sm font-medium block">{act.problemTitle}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">{act.topicName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${
                    act.difficulty === 'easy' ? 'badge-success' :
                    act.difficulty === 'medium' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {act.difficulty}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {new Date(act.solvedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-6 text-sm text-[var(--muted-foreground)]">
              No recent activity. Sync your profile to pull latest submissions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
