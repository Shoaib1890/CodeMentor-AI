'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Code } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [clerkEnabled, setClerkEnabled] = useState(false);

  useEffect(() => {
    setClerkEnabled(!!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  }, []);

  const isLanding = pathname === '/';
  const isOnboarding = pathname === '/onboarding';

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--card)] px-6 py-3.5 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="bg-[var(--accent)] p-1.5 rounded-md text-white">
          <Code className="w-4 h-4" />
        </div>
        <span className="font-semibold text-base tracking-tight text-[var(--foreground)]">
          CodeMentor<span className="text-[var(--muted)]"> AI</span>
        </span>
      </Link>

      {isLanding && (
        <div className="flex items-center gap-3">
          <Link
            href="/onboarding"
            className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Sign in
          </Link>
          <Link href="/onboarding" className="btn-primary text-sm py-2 px-4">
            Get started
          </Link>
        </div>
      )}

      {!isLanding && !isOnboarding && (
        <div className="flex items-center gap-3">
          {clerkEnabled ? (
            <span className="badge badge-success">Live Auth</span>
          ) : (
            <div className="flex items-center gap-3">
              <span className="badge badge-neutral">Demo Mode</span>
              <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-[var(--border)]">
                <span className="text-xs font-medium text-[var(--muted)]">Priya S</span>
                <div className="w-6 h-6 rounded-full bg-[var(--accent-muted)] border border-[var(--border)] flex items-center justify-center text-[10px] font-semibold text-[var(--accent)]">
                  PS
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
