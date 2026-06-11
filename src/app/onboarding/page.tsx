'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Code, Calendar, Check, ArrowRight, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { PREPARATION_GOALS } from '@/lib/constants';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [goal, setGoal] = useState('placement');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleNextStep = () => {
    if (step === 1 && !username.trim()) {
      setError('Please provide a valid LeetCode username.');
      return;
    }
    setError(null);
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleUseMock = (mockName: string) => {
    setUsername(mockName);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!targetDate) {
      setError('Please select a target preparation date.');
      return;
    }

    setLoading(true);
    setError(null);
    
    // Simulate multi-stage loading to show off premium interface
    setLoadingMessage('Fetching LeetCode submission statistics...');
    
    try {
      // 1. Save onboarding profile preferences
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preparationGoal: goal,
          targetDate
        })
      });

      // 2. Connect profile
      setLoadingMessage('Aggregating DSA solved topics and streaks...');
      const connectRes = await fetch('/api/leetcode/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leetcodeUsername: username })
      });

      const connectData = await connectRes.json();

      if (!connectRes.ok || !connectData.success) {
        throw new Error(connectData.error?.message || 'Failed to connect profile.');
      }

      setLoadingMessage('Evaluating weakness vectors using AI models...');
      // Sleep a tiny bit to show the AI steps
      await new Promise(r => setTimeout(r, 1200));

      setLoadingMessage('Structuring customized week-by-week study plan...');
      await new Promise(r => setTimeout(r, 800));

      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during onboarding. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080b11] relative">
      <Navbar />

      {/* Progress Indicator */}
      <div className="max-w-md mx-auto w-full px-6 pt-12 flex items-center justify-between gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {step > s ? <Check className="w-3.5 h-3.5" /> : s}
            </div>
            <div
              className={`h-1 flex-1 rounded-full transition-all ${
                step > s ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg glass-card p-8 rounded-3xl relative">
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <h2 className="text-xl font-extrabold text-white">Connect LeetCode Profile</h2>
                <p className="text-xs text-slate-400">Enter your public username to scan your solved history.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">LeetCode Username</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="e.g. priya_codes"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-950/60 border border-[var(--card-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleNextStep}
                    className="px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors font-bold text-white text-xs flex items-center gap-1.5"
                  >
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Mock shortcuts */}
              <div className="flex flex-col gap-3 border-t border-[var(--card-border)] pt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Or test with mock profiles:</span>
                <div className="flex flex-wrap gap-2">
                  {['priya_codes', 'arjun_codes', 'kavya_codes'].map((mock) => (
                    <button
                      key={mock}
                      onClick={() => handleUseMock(mock)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        username === mock
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400'
                          : 'bg-slate-900/40 border-[var(--card-border)] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mock}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <h2 className="text-xl font-extrabold text-white">Select Preparation Goal</h2>
                <p className="text-xs text-slate-400">Choose the path that fits your career aspirations.</p>
              </div>

              <div className="flex flex-col gap-3">
                {PREPARATION_GOALS.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${
                      goal === g.id
                        ? 'border-indigo-500 bg-indigo-500/5 text-indigo-400'
                        : 'border-[var(--card-border)] bg-slate-950/20 hover:border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${goal === g.id ? 'border-indigo-500' : 'border-slate-700'}`}>
                      {goal === g.id && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-slate-100">{g.name}</span>
                      <span className="text-xs text-slate-400 leading-normal">{g.description}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-4 border-t border-[var(--card-border)] pt-4">
                <button
                  onClick={handlePrevStep}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors font-bold text-white text-xs flex items-center gap-1"
                >
                  Next step <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <h2 className="text-xl font-extrabold text-white">Set Target Interview Date</h2>
                <p className="text-xs text-slate-400">We will adjust the weekly plan complexity based on remaining days.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-slate-950/60 border border-[var(--card-border)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all [color-scheme:dark]"
                />
              </div>

              <div className="flex justify-between mt-4 border-t border-[var(--card-border)] pt-4">
                <button
                  onClick={handlePrevStep}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 transition-colors font-extrabold text-white text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  Analyze Profile <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-[#080b11]/90 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 relative">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin absolute" />
            <div className="w-10 h-10 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin absolute top-3 left-3 animate-reverse" style={{ animationDuration: '1s' }} />
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <span className="text-sm font-extrabold text-white tracking-wide uppercase">Diagnosing Skill Matrix</span>
            <span className="text-xs text-slate-400 max-w-xs px-4 leading-relaxed animate-pulse">
              {loadingMessage}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
