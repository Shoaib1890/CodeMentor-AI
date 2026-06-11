'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Settings, ShieldAlert, CheckCircle, RefreshCw, KeyRound, AlertTriangle, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [goal, setGoal] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      const json = await res.json();
      const data = json.data;

      // Populate local form states
      setGoal(data.preparationGoal || 'placement');
      setTargetDate(data.targetDate || '');
      setUsername(data.leetcodeProfile?.username || '');

      return data;
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      setSaving(true);
      setSuccess(false);
      setError(null);

      // 1. Update preferences
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preparationGoal: goal,
          targetDate
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to update settings');
      }

      // 2. If username changed, connect LeetCode profile
      if (username !== (profile?.leetcodeProfile?.username || '')) {
        const connRes = await fetch('/api/leetcode/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leetcodeUsername: username })
        });
        const connData = await connRes.json();
        if (!connRes.ok || !connData.success) {
          throw new Error(connData.error?.message || 'Failed to update LeetCode username');
        }
      }

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSuccess(true);
      setSaving(false);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update settings.');
      setSaving(false);
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/profile', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete account');
      return true;
    },
    onSuccess: () => {
      router.push('/');
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded-lg" />
        <div className="h-96 bg-slate-900/40 rounded-2xl border border-white/5" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Profile Settings</h1>
        <p className="text-xs text-slate-400">
          Configure your preparation preferences and connected external profiles.
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Profile configuration updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="glass-card p-6 rounded-2xl bg-slate-950/20 border border-white/5 flex flex-col gap-6">
        <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-4">
          <Settings className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-sm text-slate-200">Account Preferences</span>
        </div>

        <div className="flex flex-col gap-5">
          {/* User Identifiers */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Email Address</span>
              <span className="text-slate-300 font-semibold">{profile?.email}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Member Since</span>
              <span className="text-slate-300 font-semibold">
                {new Date(profile?.accountStats.memberSince).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">LeetCode Connected Profile</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950/60 border border-[var(--card-border)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Preparation Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full bg-slate-950/60 border border-[var(--card-border)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all [color-scheme:dark]"
            >
              <option value="internship">Internship (Easy/Medium focus)</option>
              <option value="placement">Campus Placement (Medium DSA focus)</option>
              <option value="job_switch">FAANG Job Switch (Medium/Hard focus)</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Target interview Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-slate-950/60 border border-[var(--card-border)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all [color-scheme:dark]"
            />
          </div>
        </div>

        <button
          onClick={() => updateProfileMutation.mutate()}
          disabled={saving}
          className="mt-4 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 transition-colors disabled:opacity-40"
        >
          {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
          Save Configuration
        </button>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-6 rounded-2xl bg-rose-950/5 border border-rose-500/10 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-bold text-sm">Danger Zone</span>
        </div>
        <p className="text-xs text-slate-400 leading-normal">
          Deleting your profile is permanent. All LeetCode statistics logs, weakness metrics, and study plans will be wiped completely.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-xl transition-colors self-start"
        >
          Delete Profile
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass-card max-w-sm w-full p-6 rounded-2xl border border-rose-500/20 bg-slate-950 flex flex-col gap-4">
            <h3 className="font-extrabold text-white text-base">Are you absolutely sure?</h3>
            <p className="text-xs text-slate-400 leading-normal">
              This action cannot be undone. All database records and history will be cleared.
            </p>
            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteAccountMutation.mutate()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
