import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Leaf, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

export default function Login() {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4 font-body">
      {/* Subtle radial gradient backdrop */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,197,94,0.08)_0%,_transparent_60%)]" />

      <div className="relative w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-4">
            <Shield className="h-14 w-14 text-accent-green" />
            <Leaf className="absolute -bottom-1 -right-2 h-5 w-5 text-accent-teal" />
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white">
            GrantShield
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            AI-powered grant fraud prevention
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-navy-700 bg-navy-800 p-8 shadow-2xl shadow-black/30">
          <h2 className="mb-1 font-heading text-xl font-semibold text-white">
            Welcome back
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            Sign in to your account to continue
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-300">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@agency.gov"
                  className={cn(
                    'w-full rounded-lg border border-navy-600 bg-navy-700 py-2.5 pl-10 pr-4 text-sm text-gray-200',
                    'placeholder:text-gray-600 focus:border-accent-green/50 focus:outline-none focus:ring-2 focus:ring-accent-green/20',
                    'transition-colors'
                  )}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={cn(
                    'w-full rounded-lg border border-navy-600 bg-navy-700 py-2.5 pl-10 pr-4 text-sm text-gray-200',
                    'placeholder:text-gray-600 focus:border-accent-green/50 focus:outline-none focus:ring-2 focus:ring-accent-green/20',
                    'transition-colors'
                  )}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-accent-green to-accent-teal',
                'px-4 py-2.5 text-sm font-semibold text-navy-900 shadow-lg shadow-accent-green/20',
                'transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent-green/50',
                'disabled:cursor-not-allowed disabled:opacity-60'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 rounded-lg border border-navy-600 bg-navy-700/50 px-4 py-3">
            <p className="mb-1 text-xs font-medium text-gray-400">Demo Credentials</p>
            <p className="font-mono text-xs text-gray-500">
              admin@grantshield.gov / demo1234
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-600">
          Protected by GrantShield AI fraud detection system
        </p>
      </div>
    </div>
  );
}
