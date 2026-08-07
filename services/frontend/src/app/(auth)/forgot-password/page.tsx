'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound, Lock } from 'lucide-react';
import { api } from '@/lib/axios';

export default function ForgotPasswordPage() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'SEND_OTP' | 'VERIFY_AND_RESET' | 'SUCCESS'>('SEND_OTP');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Step 1: Send OTP to phone
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!emailOrPhone.trim()) {
      setErrorMsg('Telefon raqam yoki E-mail kiritilishi shart');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password/send-otp', {
        phone_number: emailOrPhone.trim()
      });

      if (data.test_code) {
        setInfoMsg(`TEST REJIM: Kodingiz - ${data.test_code}`);
      } else {
        setInfoMsg('SMS OTP tiklash kodi telefoningizga yuborildi!');
      }
      setStep('VERIFY_AND_RESET');
    } catch (err: any) {
      console.error('Failed to send reset OTP', err);
      const msg = err.response?.data?.message || 'Server bilan ulanishda xatolik yoki hisob topilmadi';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (otpCode.length < 6) {
      setErrorMsg('6 xonali SMS OTP kodini kiriting');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Yangi parol kamida 6 belgidan iborat bo\'lishi kerak');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password/reset', {
        phone_number: emailOrPhone.trim(),
        otp: otpCode.trim(),
        password: newPassword
      });

      setStep('SUCCESS');
    } catch (err: any) {
      console.error('Failed to reset password', err);
      const msg = err.response?.data?.message || 'OTP kod noto\'g\'ri yoki muddati o\'tgan';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-2xl border border-border-glass">
        
        {step === 'SUCCESS' ? (
          /* Success Phase View */
          <div className="text-center space-y-6">
            <div className="flex justify-center text-success">
              <CheckCircle2 className="h-14 w-14 animate-bounce" />
            </div>
            <h2 className="font-display text-2xl font-bold text-text-primary">
              Parol Muvaffaqiyatli Yangilandi!
            </h2>
            <p className="font-sans text-sm text-text-muted leading-relaxed">
              Hisobingiz paroli muvaffaqiyatli tiklandi. Endi yangi parolingiz bilan tizimga kirishingiz mumkin.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-md bg-primary hover:bg-primary-hover px-4 py-2.5 text-sm font-semibold text-white shadow-glow-purple transition-all duration-150"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Tizimga Kirish</span>
              </Link>
            </div>
          </div>
        ) : step === 'VERIFY_AND_RESET' ? (
          /* Step 2: OTP & New Password Input */
          <>
            <div className="text-center">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                Kodni Tasdiqlash & Yangi Parol
              </h2>
              <p className="font-sans text-sm text-text-muted mt-2">
                Telefoningizga yuborilgan 6 xonali SMS kod va yangi parolingizni kiriting
              </p>
            </div>

            {infoMsg && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-primary text-xs font-semibold text-center">
                {infoMsg}
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 p-3 text-xs font-semibold text-danger">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">
                  6 xonali SMS OTP Kodingiz
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    disabled={isLoading}
                    className="block w-full rounded-md border border-border-glass bg-surface/50 pl-10 pr-3 py-2 text-sm font-bold text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">
                  Yangi Parol
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Yangi parolingizni kiriting"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    className="block w-full rounded-md border border-border-glass bg-surface/50 pl-10 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-md bg-primary hover:bg-primary-hover px-4 py-2.5 text-sm font-semibold text-white shadow-glow-purple transition-all duration-150 active:scale-95 disabled:opacity-50 mt-4"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  'Parolni Saqlash va Tiklash'
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('SEND_OTP')}
                  className="text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  Orqaga qaytish (Telefon raqamni o'zgartirish)
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Step 1: Input Form View */
          <>
            <div className="text-center">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                Parolni tiklash
              </h2>
              <p className="font-sans text-sm text-text-muted mt-2">
                Tizimda ro'yxatdan o'tgan telefon raqamingizni kiriting
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 p-3 text-xs font-semibold text-danger">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSendOtp}>
              <div>
                <label htmlFor="identifier" className="block text-xs font-semibold text-text-muted mb-2">
                  Telefon raqam yoki E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    required
                    placeholder="+998901234567 yoki name@example.com"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    disabled={isLoading}
                    className="block w-full rounded-md border border-border-glass bg-surface/50 pl-10 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-md bg-primary hover:bg-primary-hover px-4 py-2.5 text-sm font-semibold text-white shadow-glow-purple transition-all duration-150 active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    'SMS OTP Kodini Yuborish'
                  )}
                </button>
              </div>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Kirish oynasiga qaytish</span>
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
