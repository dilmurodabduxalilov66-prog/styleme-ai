'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/auth-store';
import { decodeJwt } from '@/utils/jwt';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Dynamic Client-side Validations
    if (!username.trim()) {
      setErrorMsg('Telefon raqam yoki E-mail kiritilishi shart');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    setIsLoading(true);
    try {
      // Connect to auth-service /login API
      const { data } = await api.post('/auth/login', {
        username: username.trim(),
        password,
      });

      const token = data.access_token;
      const refreshToken = data.refresh_token;
      const decodedUser = decodeJwt(token);

      if (!decodedUser) {
        throw new Error('JWT token claims parsing error');
      }

      // Sync with Zustand store & Cookie manager
      setAuth(token, decodedUser, refreshToken);

      // Route based on role
      if (decodedUser.role === 'USER') router.push('/dashboard');
      else if (decodedUser.role === 'BARBER') router.push('/schedule');
      else if (decodedUser.role === 'ADMIN') router.push('/triage');
      else if (decodedUser.role === 'OWNER') router.push('/bi');
      else router.push('/');
    } catch (err: any) {
      console.error('Login failure:', err);
      // Mask database errors with clean user-facing feedback
      if (err.response?.status === 401) {
        setErrorMsg('Kiritilgan login yoki parol noto\'g\'ri');
      } else if (err.response?.status === 429) {
        setErrorMsg('Juda ko\'p urinishlar qilindi. Iltimos, 15 daqiqadan so\'ng urinib ko\'ring');
      } else {
        setErrorMsg('Server bilan ulanishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-2xl border border-border-glass transition-all duration-500 hover:shadow-glow-purple group">
        <div className="absolute top-[-50%] left-[-10%] w-64 h-64 rounded-full bg-primary/10 blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-500"></div>
        <div className="relative z-10 space-y-8">
        {/* Title Header */}
        <div className="text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-text-primary to-primary bg-clip-text text-transparent">
            Hisobga Kirish
          </h2>
          <p className="font-sans text-sm text-text-muted mt-2">
            StyleMe AI platformasiga xush kelibsiz
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 p-3 text-xs font-semibold text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-text-muted mb-2">
                Telefon raqam yoki E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  placeholder="name@example.com yoki +998..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="block w-full rounded-md border border-border-glass bg-surface/50 pl-10 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-semibold text-text-muted">
                  Parol
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Parolni unutdingizmi?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="block w-full rounded-md border border-border-glass bg-surface/50 pl-10 pr-10 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-semibold text-white shadow-glow-purple hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 transition-all duration-300"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Kirish'
              )}
            </button>
          </div>

          <div className="text-center text-xs text-text-muted mt-4">
            Hisobingiz yo'qmi?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Ro'yxatdan o'tish
            </Link>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
