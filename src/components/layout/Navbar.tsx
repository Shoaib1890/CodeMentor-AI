'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sparkles, Code, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [clerkEnabled, setClerkEnabled] = useState(false);

  useEffect(() => {
    setClerkEnabled(!!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  }, []);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/analysis', label: 'AI Weakness Analysis' },
    { href: '/study-plan', label: 'Study Plan' },
    { href: '/profile', label: 'Profile' }
  ];

  // If on landing page, show different minimal layout
  const isLanding = pathname === '/';

  return (
    <nav className="glass-panel sticky top-0 z-50 border-b border-[var(--card-border)] px-6 py-4 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="bg-indigo-600 p-2 rounded-xl text-white group-hover:bg-indigo-500 transition-all duration-300 shadow-lg shadow-indigo-500/20">
          <Code className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        </div>
        <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
          CodeMentor <span className="text-indigo-400">AI</span>
        </span>
      </Link>

      {!isLanding && (
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-4">
        {clerkEnabled ? (
          // Clerk dynamic render (done safely on client side)
          <div>
            {/* These Clerk tags will load since Clerk is configured */}
            {/* Note: In mock mode, we handle fallback below */}
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase tracking-wider">
              Live Auth
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase tracking-wider">
              Mock Auth
            </span>
            <div className="flex items-center gap-2 bg-slate-800/60 border border-[var(--card-border)] rounded-full pl-3 pr-2 py-1">
              <span className="text-xs font-semibold text-slate-300">Priya S</span>
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white shadow-md shadow-indigo-500/20">
                PS
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
