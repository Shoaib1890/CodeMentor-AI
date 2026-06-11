'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Brain, CalendarRange, UserCircle2, Flame, Award, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Fetch minimal details for sidebar
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
        // Refresh profile stats
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

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/analysis', label: 'AI Weakness Analysis', icon: Brain },
    { href: '/study-plan', label: 'Personalized Study Plan', icon: CalendarRange },
    { href: '/profile', label: 'Profile Settings', icon: UserCircle2 }
  ];

  return (
    <aside className="w-64 glass-panel border-r border-[var(--card-border)] hidden lg:flex flex-col h-[calc(100vh-73px)] justify-between p-6 shrink-0">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-3">Navigation</span>
          <div className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'text-white bg-indigo-500/10 border border-indigo-500/20 shadow-md shadow-indigo-500/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {profile?.leetcodeProfile && (
        <div className="flex flex-col gap-4 bg-slate-900/40 border border-[var(--card-border)] p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wide uppercase">LeetCode Stats</span>
            <button 
              onClick={handleSync}
              disabled={syncing}
              className="text-slate-400 hover:text-indigo-400 p-1 rounded-lg hover:bg-slate-800/60 transition-colors disabled:opacity-40"
              title="Sync LeetCode Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium leading-none">Solved Problems</div>
                <div className="text-xs font-bold text-slate-200">{profile.leetcodeProfile.totalSolved} solved</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium leading-none">Current Streak</div>
                <div className="text-xs font-bold text-slate-200">{profile.leetcodeProfile.currentStreak} days</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
