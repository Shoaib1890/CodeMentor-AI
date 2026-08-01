'use client';

import Link from 'next/link';
import { ArrowRight, Code, BrainCircuit, CalendarCheck, BarChart3 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      {/* Hero */}
      <section className="flex-1 max-w-5xl mx-auto w-full px-6 py-20 md:py-28">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex flex-col gap-6 max-w-lg text-center lg:text-left">
            <p className="text-sm font-medium text-[var(--accent)]">
              Personalized interview preparation
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--foreground)] leading-[1.15]">
              Prepare for coding interviews with a data-driven plan
            </h1>
            <p className="text-[var(--muted)] text-base leading-relaxed">
              Connect your LeetCode profile, identify your weakest DSA topics, and follow a structured week-by-week study plan built around your interview date.
            </p>
            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3 mt-2">
              <Link href="/onboarding" className="btn-primary w-full sm:w-auto py-3 px-6 text-base">
                Start free analysis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-[var(--muted-foreground)]">
                No credit card required
              </p>
            </div>
          </div>

          {/* Preview card */}
          <div className="flex-1 w-full max-w-md">
            <div className="card p-5">
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 mb-5">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--border)]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--border)]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--border)]" />
                <span className="ml-auto text-[11px] text-[var(--muted-foreground)] font-mono">dashboard</span>
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <span className="badge badge-danger mb-2">Critical gap</span>
                  <p className="text-sm font-semibold">Dynamic Programming</p>
                  <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                    42 array problems solved, but only 5 in DP. Focus here before your target date.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[var(--muted)] mb-2">
                    <span className="font-medium">Week 1: Dynamic Programming</span>
                    <span>0/3</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {['Climbing Stairs', 'Coin Change', 'Longest Common Subsequence'].map((title, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-md bg-[var(--background)] border border-[var(--border)] text-xs">
                        <span className="text-[var(--foreground)]">{title}</span>
                        <span className={`badge ${idx === 0 ? 'badge-success' : 'badge-warning'}`}>
                          {idx === 0 ? 'Easy' : 'Medium'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[var(--border)] py-20 px-6">
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center max-w-lg mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">How it works</h2>
            <p className="text-[var(--muted)] text-sm">
              Three steps from profile sync to a personalized study schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Connect your profile',
                description: 'Link your LeetCode username. We pull solved counts, topic breakdowns, and difficulty distribution.',
                icon: Code
              },
              {
                step: '02',
                title: 'Identify weaknesses',
                description: 'Our analyzer grades 23 DSA topics and ranks where you need the most improvement.',
                icon: BrainCircuit
              },
              {
                step: '03',
                title: 'Follow your plan',
                description: 'Get a week-by-week schedule with specific problems mapped to your target interview date.',
                icon: CalendarCheck
              }
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.step} className="card p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[var(--muted-foreground)]">{feat.step}</span>
                    <div className="w-8 h-8 rounded-md bg-[var(--accent-muted)] text-[var(--accent)] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)]">{feat.title}</h3>
                  <p className="text-[var(--muted)] text-sm leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-t border-[var(--border)] py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-x-12 gap-y-6">
          {[
            { label: 'DSA topics analyzed', value: '23' },
            { label: 'LeetCode integration', value: 'Live sync' },
            { label: 'Study plan format', value: 'Weekly' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4 text-[var(--muted)]" />
              <div>
                <div className="text-sm font-semibold">{stat.value}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--border)] py-6 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--muted-foreground)]">
          <span>&copy; 2026 CodeMentor AI</span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-[var(--muted)] transition-colors">Privacy</Link>
            <Link href="/" className="hover:text-[var(--muted)] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
