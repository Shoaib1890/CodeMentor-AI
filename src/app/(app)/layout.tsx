'use client';

import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has connected LeetCode profile, if not redirect to onboarding
    // (Bypass for onboarding page itself)
    if (pathname === '/onboarding') {
      setLoading(false);
      return;
    }

    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // If onboarding is not complete and not on onboarding page, redirect
          if (!data.data.onboardingComplete) {
            router.push('/onboarding');
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b11] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-400 animate-pulse">
          Loading your DSA profile...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#080b11]">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
