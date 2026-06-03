'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER'); // USER, SELLER, ADMIN
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Account created successfully! Redirecting...');
      
      // Successful registration
      router.refresh();
      setTimeout(() => {
        if (data.user.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (data.user.role === 'SELLER') {
          router.push('/seller/dashboard');
        } else {
          router.push('/products');
        }
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#09090b] text-neutral-100 overflow-hidden px-4">
      {/* Decorative background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full" />
      
      <div className="relative z-10 w-full max-w-md bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:border-neutral-700/80">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-500 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-neutral-400 mt-2 text-sm font-medium">
            Join AasaMedChem Inventory Management
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-950/40 border border-rose-800/60 text-rose-300 rounded-xl text-sm flex items-start space-x-2 animate-shake">
            <svg className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 rounded-xl text-sm flex items-start space-x-2">
            <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 rounded-xl px-4 py-2.5 text-neutral-100 placeholder-neutral-500 focus:outline-none transition-all duration-200"
              placeholder="e.g. Dr. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 rounded-xl px-4 py-2.5 text-neutral-100 placeholder-neutral-500 focus:outline-none transition-all duration-200"
              placeholder="e.g. john@aasamedchem.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 rounded-xl px-4 py-2.5 text-neutral-100 placeholder-neutral-500 focus:outline-none transition-all duration-200"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>



          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Account Type / Role
            </label>
            <div className="grid grid-cols-3 gap-2 bg-neutral-950/80 p-1 border border-neutral-800 rounded-xl text-center">
              <button
                type="button"
                className={`py-2 text-[10px] font-bold rounded-lg transition-all duration-200 ${
                  role === 'USER'
                    ? 'bg-neutral-800 text-emerald-400 border border-neutral-700 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                onClick={() => setRole('USER')}
              >
                Customer
              </button>
              <button
                type="button"
                className={`py-2 text-[10px] font-bold rounded-lg transition-all duration-200 ${
                  role === 'SELLER'
                    ? 'bg-neutral-800 text-emerald-400 border border-neutral-700 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                onClick={() => setRole('SELLER')}
              >
                Seller
              </button>
              <button
                type="button"
                className={`py-2 text-[10px] font-bold rounded-lg transition-all duration-200 ${
                  role === 'ADMIN'
                    ? 'bg-neutral-800 text-emerald-400 border border-neutral-700 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                onClick={() => setRole('ADMIN')}
              >
                Admin
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-neutral-950 font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-neutral-950" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <>
                <span>Sign Up</span>
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-neutral-800 text-center text-sm">
          <span className="text-neutral-400">Already have an account? </span>
          <Link href="/login" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors underline underline-offset-4">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
