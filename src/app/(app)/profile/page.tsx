'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, ShieldAlert, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';

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

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      const json = await res.json();
      const data = json.data;

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

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preparationGoal: goal, targetDate })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to update settings');
      }

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
      <div className="flex flex-col gap-6 animate-pulse max-w-xl">
        <div className="h-7 w-40 bg-[var(--card)] rounded-md" />
        <div className="h-80 bg-[var(--card)] rounded-md border border-[var(--border)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-xl">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-description">Manage your preparation preferences and connected profiles</p>
      </div>

      {success && (
        <div className="p-3.5 rounded-md bg-green-500/5 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-md bg-red-500/5 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="card p-5 flex flex-col gap-6">
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-4">
          <Settings className="w-4 h-4 text-[var(--muted)]" />
          <span className="font-medium text-sm">Account preferences</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs font-medium text-[var(--muted-foreground)] block mb-1">Email</span>
            <span className="text-[var(--foreground)]">{profile?.email}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[var(--muted-foreground)] block mb-1">Member since</span>
            <span className="text-[var(--foreground)]">
              {new Date(profile?.accountStats.memberSince).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">LeetCode username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">Preparation goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="input [color-scheme:dark]"
            >
              <option value="internship">Internship (Easy/Medium focus)</option>
              <option value="placement">Campus Placement (Medium focus)</option>
              <option value="job_switch">Job Switch (Medium/Hard focus)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">Target interview date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="input [color-scheme:dark]"
            />
          </div>
        </div>

        <button
          onClick={() => updateProfileMutation.mutate()}
          disabled={saving}
          className="btn-primary w-full disabled:opacity-40"
        >
          {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
          Save changes
        </button>
      </div>

      <div className="card p-5 border-red-500/20 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium text-sm">Danger zone</span>
        </div>
        <p className="text-sm text-[var(--muted)]">
          Permanently delete your profile, including all LeetCode stats, weakness reports, and study plans.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/15 text-red-400 border border-red-500/20 text-sm font-medium rounded-md transition-colors self-start"
        >
          Delete profile
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="card max-w-sm w-full p-6 flex flex-col gap-4 border-red-500/20">
            <h3 className="font-semibold">Delete your profile?</h3>
            <p className="text-sm text-[var(--muted)]">
              This action cannot be undone. All data will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end mt-1">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary text-sm py-2"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteAccountMutation.mutate()}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-sm font-medium text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
