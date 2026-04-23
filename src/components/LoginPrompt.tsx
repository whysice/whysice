'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PawPrint } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type LoginPromptProps = {
  title?: string
  description?: string
  redirectTo?: string
  browseLink?: { href: string; label: string }
}

export function LoginPrompt({
  title = 'Sign in to track',
  description = 'Create a free account to track your dog’s symptoms, treatments, and vet visits.',
  redirectTo = '/dashboard',
  browseLink = { href: '/wiki/conditions', label: 'Browse conditions' },
}: LoginPromptProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'magic' | 'password' | 'signup'>('magic')
  const [loading, setLoading] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const emailRedirectTo = `${origin}${redirectTo}`

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  async function handlePasswordAuth(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo } })
      if (error) setError(error.message)
      else setSent(true)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else window.location.reload()
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: emailRedirectTo },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="card text-center">
        <PawPrint className="w-10 h-10 text-tanzanite-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-tanzanite-800 mb-2">{title}</h1>
        <p className="text-sm text-slate mb-6">{description}</p>

        {sent ? (
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 font-medium">
              {mode === 'signup'
                ? 'Check your email to confirm your account.'
                : 'Check your email for a sign-in link.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-tanzanite-100 hover:bg-tanzanite-50 transition-colors text-sm font-medium text-body"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-tanzanite-100" />
              <span className="text-xs text-slate">or</span>
              <div className="flex-1 h-px bg-tanzanite-100" />
            </div>

            <div className="flex bg-tanzanite-50 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => { setMode('magic'); setError(null) }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mode === 'magic' ? 'bg-white text-tanzanite-700 shadow-sm' : 'text-slate hover:text-body'
                }`}
              >
                Magic Link
              </button>
              <button
                type="button"
                onClick={() => { setMode('password'); setError(null) }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mode === 'password' ? 'bg-white text-tanzanite-700 shadow-sm' : 'text-slate hover:text-body'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null) }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mode === 'signup' ? 'bg-white text-tanzanite-700 shadow-sm' : 'text-slate hover:text-body'
                }`}
              >
                Sign Up
              </button>
            </div>

            {mode === 'magic' ? (
              <form onSubmit={handleMagicLink} className="space-y-3">
                <label htmlFor="login-email" className="sr-only">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="search-input text-base"
                  required
                  aria-describedby={error ? 'login-error' : undefined}
                />
                {error && <p id="login-error" className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordAuth} className="space-y-3">
                <label htmlFor="login-email-pw" className="sr-only">Email address</label>
                <input
                  id="login-email-pw"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="search-input text-base"
                  required
                />
                <label htmlFor="login-password" className="sr-only">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="search-input text-base"
                  required
                  minLength={6}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Loading...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
                </button>
              </form>
            )}
          </div>
        )}

        {browseLink && (
          <p className="text-xs text-slate mt-6">
            The knowledge base is free to browse without an account.{' '}
            <Link href={browseLink.href} className="text-tanzanite-500 hover:underline">{browseLink.label}</Link>
          </p>
        )}
      </div>
    </div>
  )
}
