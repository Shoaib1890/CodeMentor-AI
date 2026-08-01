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
    if (pathname === '/onboarding') {
      setLoading(false);
      return;
    }

    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
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
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
        <span className="text-sm text-[var(--muted)]">Loading your profile...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10 max-w-6xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
