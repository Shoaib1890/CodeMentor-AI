'use client';

import Link from 'next/link';
import { ArrowRight, Code, BrainCircuit, CalendarCheck, Flame, Cpu, ArrowUpRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080b11]">
      <Navbar />

      {/* Hero Section */}
      <section className="flex-1 max-w-6xl mx-auto w-full px-6 py-20 md:py-28 flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="flex flex-col gap-6 max-w-xl text-center lg:text-left">
          <div className="inline-flex self-center lg:self-start items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5" /> Powered by Advanced AI Scopes
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Stop solving random <br className="hidden md:inline" />
            LeetCode questions.
          </h1>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            Connect your LeetCode profile, let CodeMentor AI pinpoint your DSA structural weaknesses, and solve a customized week-by-week study plan to land your target SWE role.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mt-2">
            <Link
              href="/onboarding"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all font-bold text-white flex items-center justify-center gap-2 group shadow-lg shadow-indigo-600/30"
            >
              Start Free Analysis <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="text-xs text-slate-500 font-medium sm:text-left">
              No credit card required • Works with public profiles
            </div>
          </div>
        </div>

        {/* Visual Mockup/Hero Graphic */}
        <div className="flex-1 w-full max-w-md lg:max-w-none float-effect">
          <div className="glass-card p-6 rounded-3xl border border-white/5 bg-slate-950/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/60" />
                <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <span className="text-[10px] text-slate-500 font-mono">codementor-ai-dashboard.json</span>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Critical DSA Gap</span>
                <span className="text-lg font-bold text-white">Dynamic Programming (90% Weakness)</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "You've solved 42 problems in Arrays but only 5 Easy problems in DP. interviews at FAANG-tier companies test 2D/3D DP extensively."
                </p>
              </div>

              {/* Progress visualizer */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>WEEK 1 STUDY PLAN: DYNAMIC PROGRAMMING</span>
                  <span>0/3 DONE</span>
                </div>
                <div className="flex flex-col gap-2 mt-1">
                  {['climbing-stairs', 'coin-change', 'longest-common-subsequence'].map((slug, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-white/5 text-xs text-slate-300">
                      <span className="font-mono truncate">{slug}</span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${idx === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                        {idx === 0 ? 'Easy' : 'Medium'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-slate-950/30 border-y border-[var(--card-border)] py-20 px-6">
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-12">
          <div className="text-center max-w-xl mx-auto flex flex-col gap-3">
            <h2 className="text-2xl md:text-4xl font-extrabold text-white">Advanced DSA Diagnostic Engine</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              CodeMentor AI uses data-driven analytics to map out your weaknesses and structure your daily preparation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'LeetCode profile sync',
                description: 'Sync your profile in seconds. We fetch solved counts, tag breakdowns, and difficulty distributions.',
                icon: Code
              },
              {
                title: 'AI Weakness detection',
                description: 'Our rule-based pre-scorer and LLM analyzer grade 23 canonical DSA topics to rank your primary study needs.',
                icon: BrainCircuit
              },
              {
                title: 'Weekly Study Schedules',
                description: 'Get week-by-week DSA guides recommending exact coding problems (with URLs) based on your target dates.',
                icon: CalendarCheck
              }
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="glass-card p-6 rounded-2xl flex flex-col gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-white">{feat.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--card-border)] py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; 2026 CodeMentor AI. All rights reserved. Built for engineering excellence.</span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-slate-300">Privacy Policy</Link>
            <Link href="/" className="hover:text-slate-300">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
