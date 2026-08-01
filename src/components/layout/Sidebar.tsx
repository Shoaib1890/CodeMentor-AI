'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Brain, CalendarRange, UserCircle2, Flame, Award, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

const STEPS = [
  { step: 1, href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { step: 2, href: '/analysis', label: 'Weakness Analysis', icon: Brain },
  { step: 3, href: '/study-plan', label: 'Study Plan', icon: CalendarRange },
  { step: 4, href: '/profile', label: 'Settings', icon: UserCircle2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile(data.data);
        }
      });
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/leetcode/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const pRes = await fetch('/api/profile');
        const pData = await pRes.json();
        if (pData.success) {
          setProfile(pData.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const currentStepIndex = STEPS.findIndex(s => s.href === pathname);

  return (
    <aside className="w-60 border-r border-[var(--border)] bg-[var(--card)] hidden lg:flex flex-col h-[calc(100vh-57px)] shrink-0">
      <div className="p-4 flex flex-col gap-1 flex-1">
        <span className="text-[11px] text-[var(--muted-foreground)] font-medium uppercase tracking-wide px-3 mb-2">
          Preparation Flow
        </span>
        {STEPS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isPast = currentStepIndex > STEPS.indexOf(item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'text-[var(--foreground)] bg-[var(--accent-muted)] border border-blue-500/20'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-elevated)] border border-transparent'
              }`}
            >
              <span className={`flex items-center justify-center w-5 h-5 rounded text-[10px] font-semibold shrink-0 ${
                isActive
                  ? 'bg-[var(--accent)] text-white'
                  : isPast
                    ? 'bg-[var(--card-elevated)] text-[var(--muted)] border border-[var(--border)]'
                    : 'bg-[var(--card-elevated)] text-[var(--muted-foreground)] border border-[var(--border)]'
              }`}>
                {item.step}
              </span>
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--accent)]' : ''}`} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {profile?.leetcodeProfile && (
        <div className="p-4 border-t border-[var(--border)]">
          <div className="card p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--muted)]">LeetCode</span>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="text-[var(--muted)] hover:text-[var(--foreground)] p-1 rounded transition-colors disabled:opacity-40"
                title="Sync LeetCode Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-[var(--accent)]' : ''}`} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <Award className="w-3.5 h-3.5 text-[var(--muted)]" />
                <div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">Problems solved</div>
                  <div className="text-sm font-semibold">{profile.leetcodeProfile.totalSolved}</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Flame className="w-3.5 h-3.5 text-[var(--muted)]" />
                <div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">Current streak</div>
                  <div className="text-sm font-semibold">{profile.leetcodeProfile.currentStreak} days</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
