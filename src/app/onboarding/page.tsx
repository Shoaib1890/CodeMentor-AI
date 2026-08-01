'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, ShieldAlert } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { PREPARATION_GOALS } from '@/lib/constants';

const STEPS = [
  { id: 1, label: 'LeetCode profile' },
  { id: 2, label: 'Preparation goal' },
  { id: 3, label: 'Target date' },
];

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
      setError('Please enter your LeetCode username.');
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
      setError('Please select your target interview date.');
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingMessage('Fetching LeetCode statistics...');

    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preparationGoal: goal, targetDate })
      });

      setLoadingMessage('Analyzing topic breakdown...');
      const connectRes = await fetch('/api/leetcode/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leetcodeUsername: username })
      });

      const connectData = await connectRes.json();
      if (!connectRes.ok || !connectData.success) {
        throw new Error(connectData.error?.message || 'Failed to connect profile.');
      }

      setLoadingMessage('Generating weakness analysis...');
      await new Promise(r => setTimeout(r, 1200));

      setLoadingMessage('Building your study plan...');
      await new Promise(r => setTimeout(r, 800));

      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] relative">
      <Navbar />

      <div className="max-w-lg mx-auto w-full px-6 pt-10">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  step >= s.id
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)]'
                }`}>
                  {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                </div>
                <span className={`text-[11px] font-medium hidden sm:block ${
                  step >= s.id ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'
                }`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 mx-3 transition-colors ${
                  step > s.id ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg card p-8">
          {error && (
            <div className="mb-6 p-3.5 rounded-md bg-red-500/5 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-semibold">Connect LeetCode profile</h2>
                <p className="text-sm text-[var(--muted)] mt-1">Enter your public username to analyze your solve history.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-[var(--muted)]">LeetCode username</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. priya_codes"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input flex-1"
                  />
                  <button onClick={handleNextStep} className="btn-primary shrink-0">
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-4">
                <p className="text-xs text-[var(--muted-foreground)] mb-2">Try with a demo profile:</p>
                <div className="flex flex-wrap gap-2">
                  {['priya_codes', 'arjun_codes', 'kavya_codes'].map((mock) => (
                    <button
                      key={mock}
                      onClick={() => handleUseMock(mock)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                        username === mock
                          ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-muted)]'
                          : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border)]'
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
              <div>
                <h2 className="text-lg font-semibold">Select preparation goal</h2>
                <p className="text-sm text-[var(--muted)] mt-1">This determines the difficulty focus of your study plan.</p>
              </div>

              <div className="flex flex-col gap-2">
                {PREPARATION_GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`p-4 rounded-md border text-left transition-colors flex items-start gap-3 ${
                      goal === g.id
                        ? 'border-[var(--accent)] bg-[var(--accent-muted)]'
                        : 'border-[var(--border)] hover:border-[#3f3f46]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      goal === g.id ? 'border-[var(--accent)]' : 'border-[var(--border)]'
                    }`}>
                      {goal === g.id && <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
                    </div>
                    <div>
                      <span className="text-sm font-medium block">{g.name}</span>
                      <span className="text-xs text-[var(--muted)] mt-0.5 block">{g.description}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between border-t border-[var(--border)] pt-4">
                <button onClick={handlePrevStep} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  Back
                </button>
                <button onClick={handleNextStep} className="btn-primary">
                  Continue <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-semibold">Set target interview date</h2>
                <p className="text-sm text-[var(--muted)] mt-1">Your study plan will be paced to this deadline.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-[var(--muted)]">Target date</label>
                <input
                  type="date"
                  value={targetDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="input [color-scheme:dark]"
                />
              </div>

              <div className="flex justify-between border-t border-[var(--border)] pt-4">
                <button onClick={handlePrevStep} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  Back
                </button>
                <button onClick={handleSubmit} className="btn-primary">
                  Analyze profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-[var(--background)]/90 z-50 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-sm font-medium">Setting up your profile</p>
            <p className="text-xs text-[var(--muted)] mt-1">{loadingMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
