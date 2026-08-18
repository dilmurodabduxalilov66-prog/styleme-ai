'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User, AlertCircle, Mail, Phone } from 'lucide-react';
import { api } from '@/lib/axios';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/auth-store';
import { decodeJwt } from '@/utils/jwt';

type UserRole = 'USER' | 'BARBER';

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [role, setRole] = useState<UserRole>('USER');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // OTP States
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);

  // Countdown timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!phone.replace(/[\s()-]/g, '')) {
      setErrorMsg('OTP qabul qilish uchun Telefon raqam kiritishingiz shart');
      return;
    }
    if (!/^\+?[0-9]{9,15}$/.test(phone.replace(/[\s()-]/g, ''))) {
      setErrorMsg('Telefon raqam formati noto\'g\'ri');
      return;
    }
    if (password.length < 4) {
      setErrorMsg('Parol kamida 4 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { phone_number: phone.replace(/[\s()-]/g, '') });
      if (res.data && res.data.test_code) {
        alert(res.data.message);
        setOtp(res.data.test_code);
      }
      setStep(2);
      setTimer(60); // 60s cooldown
    } catch (err: any) {
      console.error('Send OTP failure:', err);
      setErrorMsg(err.response?.data?.message || 'SMS yuborishda xatolik yuz berdi. Iltimos qayta urinib ko\'ring');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      // 1. Verify OTP
      await api.post('/auth/verify-otp', {
        phone_number: phone.replace(/[\s()-]/g, ''),
        otp: otp.trim(),
      });

      // 2. Signup
      await api.post('/auth/signup', {
        email: email.trim() || undefined,
        phone_number: phone.replace(/[\s()-]/g, ''),
        password: password,
        role,
      });

      // 3. Auto login to set tokens
      const loginRes = await api.post('/auth/login', {
        username: phone.replace(/[\s()-]/g, ''),
        password: password,
      });
      const token = loginRes.data.access_token;
      const refreshToken = loginRes.data.refresh_token;
      const decodedUser = decodeJwt(token);
      if (decodedUser) {
        setAuth(token, decodedUser, refreshToken);
      }

      router.push(`/`);
    } catch (err: any) {
      console.error('Registration failure:', err);
      if (err.response?.status === 409 || err.response?.data?.message?.includes('already exists')) {
        setErrorMsg('Ushbu telefon raqam ro\'yxatdan o\'tgan');
      } else {
        setErrorMsg(err.response?.data?.message || 'Kod noto\'g\'ri yoki xatolik yuz berdi');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-2xl border border-border-glass transition-all duration-500 hover:shadow-glow-purple group relative overflow-hidden">
        <div className="absolute top-[-50%] left-[-10%] w-64 h-64 rounded-full bg-primary/10 blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-500"></div>
        <div className="relative z-10 space-y-8">
        {/* Title Header */}
        <div className="text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-text-primary to-primary bg-clip-text text-transparent">
            Yangi Hisob Ochish
          </h2>
          <p className="font-sans text-sm text-text-muted mt-2">
            StyleMe AI jamoasiga qo'shiling
          </p>
        </div>

        {/* Role Segment Selector */}
        <div className="flex rounded-lg bg-surface/80 p-1 border border-border-glass">
          <button
            type="button"
            onClick={() => setRole('USER')}
            disabled={isLoading}
            className={cn(
              "flex-1 text-center py-2 text-xs font-bold rounded-md transition-all duration-150",
              role === 'USER'
                ? "bg-primary text-white shadow-glow-purple"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            Mijoz (Client)
          </button>
          <button
            type="button"
            onClick={() => setRole('BARBER')}
            disabled={isLoading}
            className={cn(
              "flex-1 text-center py-2 text-xs font-bold rounded-md transition-all duration-150",
              role === 'BARBER'
                ? "bg-primary text-white shadow-glow-purple"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            Sartarosh (Barber)
          </button>
        </div>

        {role === 'BARBER' && (
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-[11px] text-text-muted leading-relaxed">
            Siz sartarosh roligadasiz. Ariza tasdiqlangach, xaritada ko'rinish va buyurtmalarni qabul qilish uchun shaxsiy portfoliosingizni sozlashingiz mumkin.
          </div>
        )}

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 p-3 text-xs font-semibold text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {step === 1 ? (
          <form className="mt-6 space-y-6" onSubmit={handleSendOtp}>
            <div className="space-y-4 rounded-md shadow-sm">
              {/* Phone Input */}
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-text-muted mb-2">
                  Telefon raqam
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="+998901234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                    className="block w-full rounded-md border border-border-glass bg-surface/50 pl-10 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-text-muted mb-2">
                  E-mail (Ixtiyoriy)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="block w-full rounded-md border border-border-glass bg-surface/50 pl-10 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-text-muted mb-2">
                  Parol yarating
                </label>
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

            {/* Legal Checkbox */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-border-glass text-primary focus:ring-primary bg-surface/50"
                />
              </div>
              <div className="ml-3 text-xs">
                <label htmlFor="terms" className="text-text-muted">
                  Xizmat ko'rsatish shartlari va{' '}
                  <Link href="#privacy" className="text-primary hover:underline">
                    Maxfiylik siyosatiga
                  </Link>{' '}
                  roziman.
                </label>
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
                  'SMS Kod Olish'
                )}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-6 space-y-6" onSubmit={handleVerifyAndSignup}>
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="otp" className="block text-xs font-semibold text-text-muted mb-2 text-center">
                  {phone} raqamiga yuborilgan 6 xonali kodni kiriting
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={isLoading}
                  className="block w-full text-center tracking-widest text-2xl rounded-md border border-border-glass bg-surface/50 py-3 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="flex w-full items-center justify-center rounded-md bg-primary hover:bg-primary-hover px-4 py-2.5 text-sm font-semibold text-white shadow-glow-purple transition-all duration-150 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  'Tasdiqlash'
                )}
              </button>
            </div>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={timer > 0 || isLoading}
                className="text-xs font-semibold text-primary hover:underline disabled:text-text-muted disabled:hover:no-underline"
              >
                {timer > 0 ? `Qayta yuborish (${timer}s)` : 'Kodni qayta yuborish'}
              </button>
            </div>
          </form>
        )}

          <div className="text-center text-xs text-text-muted mt-4">
            Hisobingiz bormi?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Kirish
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
