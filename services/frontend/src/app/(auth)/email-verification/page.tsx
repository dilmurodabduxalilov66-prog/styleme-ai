'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldAlert, CheckCircle2, RotateCw } from 'lucide-react';
import { cn } from '@/utils/cn';
import { api } from '@/lib/axios';

function VerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || '+998 (90) 123-45-67';

  const [code, setCode] = useState<string[]>(new Array(6).fill(''));
  const [timer, setTimer] = useState(59);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const inputsRef = useRef<HTMLInputElement[]>([]);

  // Count down resend timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Focus on first input square on mount
  useEffect(() => {
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  const handleChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return; // restrict to digits only

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance focus to next square
    if (value && index < 5 && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1].focus();
    }

    // Trigger auto-submit once 6th digit is entered
    if (newCode.every((digit) => digit !== '') && index === 5) {
      handleAutoSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0 && inputsRef.current[index - 1]) {
      // Focus shift backwards on backspace click
      inputsRef.current[index - 1].focus();
    }
  };

  const handleAutoSubmit = async (otpCode: string) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      await api.post('/auth/verify-otp', {
        phone_number: username,
        otp: otpCode,
      });
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Tasdiqlash kodi noto\'g\'ri. Iltimos qaytadan tekshirib kiriting.');
      setCode(new Array(6).fill(''));
      if (inputsRef.current[0]) inputsRef.current[0].focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setTimer(59);
    setErrorMsg(null);
    setCode(new Array(6).fill(''));
    if (inputsRef.current[0]) inputsRef.current[0].focus();
    
    try {
      const res = await api.post('/auth/send-otp', { phone_number: username });
      if (res.data && res.data.test_code) {
        alert(res.data.message);
        
        // Auto-fill the 6 digits if possible
        const newCode = res.data.test_code.split('').slice(0, 6);
        while (newCode.length < 6) newCode.push('');
        setCode(newCode);
      }
    } catch (err: any) {
      setErrorMsg('SMS yuborishda xatolik yuz berdi. Iltimos qayta urinib ko\'ring.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-2xl border border-border-glass transition-all duration-500 hover:shadow-glow-purple group relative overflow-hidden">
        <div className="absolute top-[-50%] left-[-10%] w-64 h-64 rounded-full bg-primary/10 blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-500"></div>
        <div className="relative z-10 space-y-8">
      {isSuccess ? (
        /* Success Reveal View */
        <div className="text-center space-y-6">
          <div className="flex justify-center text-success">
            <CheckCircle2 className="h-14 w-14 animate-pulse" />
          </div>
          <h2 className="font-display text-2xl font-bold text-text-primary">
            Tasdiqlandi!
          </h2>
          <p className="font-sans text-sm text-text-muted">
            Sizning hisobingiz muvaffaqiyatli tasdiqlandi. Tizimga yo'naltirilmoqdasiz...
          </p>
        </div>
      ) : (
        /* OTP Input View */
        <>
          <div className="text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-text-primary to-primary bg-clip-text text-transparent">
              Kodni kiriting
            </h2>
            <p className="font-sans text-sm text-text-muted mt-2 leading-relaxed">
              Biz <span className="text-text-primary font-semibold">{username}</span> raqamiga/pochtasiga
              6 xonali tasdiqlash kodini yubordik.
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 p-3 text-xs font-semibold text-danger">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-center gap-2 py-4">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  if (el) inputsRef.current[index] = el;
                }}
                type="text"
                maxLength={1}
                inputMode="numeric"
                pattern="[0-9]*"
                value={digit}
                disabled={isLoading}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-14 text-center text-lg font-bold rounded-lg border border-border-glass bg-surface/50 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary focus:shadow-glow-purple transition-all duration-300 disabled:opacity-50"
              />
            ))}
          </div>

          <div className="text-center space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
                <RotateCw className="h-4 w-4 animate-spin text-primary" />
                <span>Tekshirilmoqda...</span>
              </div>
            ) : (
              <div className="text-xs text-text-muted">
                {timer > 0 ? (
                  <span>Kodni qayta yuborish: {timer} soniya qoldi</span>
                ) : (
                  <button
                    onClick={handleResend}
                    className="font-bold text-primary hover:underline focus:outline-none"
                  >
                    Kodni qayta yuborish
                  </button>
                )}
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => router.push('/signup')}
                className="text-xs font-semibold text-text-muted hover:text-text-primary underline"
              >
                Raqamni/E-mailni o'zgartirish
              </button>
            </div>
          </div>
        </>
      )}
        </div>
      </div>
    </div>
  );
}

export default function EmailVerificationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="flex h-40 w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      }>
        <VerificationContent />
      </Suspense>
    </div>
  );
}
