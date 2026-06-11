'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import StatsRow from '@/components/dashboard/StatsRow';
import DifficultyChart from '@/components/dashboard/DifficultyChart';
import TopicHeatmap from '@/components/dashboard/TopicHeatmap';
import { BrainCircuit, RefreshCw, CalendarRange, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  // Fetch dashboard stats
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
        <div className="h-8 w-48 bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-28 bg-slate-900/40 rounded-2xl border border-white/5" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-900/40 rounded-2xl border border-white/5" />
          <div className="h-72 bg-slate-900/40 rounded-2xl border border-white/5" />
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="glass-card p-8 rounded-3xl text-center max-w-md mx-auto my-12 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center font-bold">!</div>
        <h2 className="text-lg font-bold text-white">Error Loading Dashboard</h2>
        <p className="text-xs text-slate-400">We encountered an issue fetching your LeetCode analytics. Please connect your profile again.</p>
        <Link href="/onboarding" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-lg transition-colors">
          Reconnect Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Study Dashboard</h1>
          <span className="text-xs text-slate-400">
            Analytics synced from LeetCode for <strong className="text-indigo-400">@{dashboardData.leetcodeUsername || 'user'}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <span className="text-[10px] text-slate-500 font-mono">
            Last synced: {dashboardData.lastSyncedAt ? new Date(dashboardData.lastSyncedAt).toLocaleTimeString() : 'Never'}
          </span>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white border border-[var(--card-border)] flex items-center gap-2 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-indigo-400' : ''}`} />
            Sync Profile
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsRow stats={dashboardData.stats} overallWeaknessScore={dashboardData.overallWeaknessScore} />

      {/* AI Summary and Difficulty Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* AI Insight Card */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-white/5 bg-slate-950/20 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-indigo-400 border-b border-[var(--card-border)] pb-4">
              <BrainCircuit className="w-5 h-5 pulse-glow text-indigo-400" />
              <span className="font-extrabold text-base text-slate-100">AI Preparation Summary</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {dashboardData.aiSummary}
            </p>
          </div>

          <div className="flex gap-4 border-t border-[var(--card-border)] pt-4 mt-6">
            <Link 
              href="/analysis"
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
            >
              Analyze topic weaknesses <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Difficulty Distribution Chart */}
        <DifficultyChart 
          easy={dashboardData.stats.easySolved} 
          medium={dashboardData.stats.mediumSolved} 
          hard={dashboardData.stats.hardSolved} 
          total={dashboardData.stats.totalSolved} 
        />
      </div>

      {/* Heatmap Grid */}
      <div className="glass-card p-6 rounded-3xl border border-white/5 bg-slate-950/20">
        <TopicHeatmap topicStats={dashboardData.topicStats} />
      </div>

      {/* Recent Activity Feed */}
      <div className="glass-card p-6 rounded-3xl border border-white/5 bg-slate-950/20 flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-4">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-sm text-slate-200">Recent Completed Exercises</span>
        </div>

        <div className="flex flex-col gap-3">
          {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 ? (
            dashboardData.recentActivity.map((act: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/45 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-200">{act.problemTitle}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{act.topicName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    act.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    (act.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20')
                  }`}>
                    {act.difficulty}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(act.solvedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-slate-500 font-medium">
              No recent activity recorded. Run a sync to pull latest submissions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
