'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Percent, 
  ShieldCheck, 
  Save, 
  Coins, 
  X, 
  CheckCircle2, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/axios';
import { cn } from '@/utils/cn';

export default function OwnerSettingsPage() {
  // Config states
  const [baseCommission, setBaseCommission] = useState(10.0); // 10%
  const [sRankCommission, setSRankCommission] = useState(5.0); // 5%
  const [lockoutThreshold, setLockoutThreshold] = useState(450000); // 450k UZS

  // 2FA modal overlay states
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSubmittingConfig, setIsSubmittingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/admin/settings');
        setBaseCommission(data.baseCommission);
        setSRankCommission(data.sRankCommission);
        setLockoutThreshold(data.lockoutThreshold);
      } catch (err) {
        console.error('Failed to load platform settings', err);
      }
    };
    fetchSettings();
  }, []);

  const [smsSentNotice, setSmsSentNotice] = useState<string | null>(null);

  // Trigger settings check (sends real SMS OTP and opens 2FA modal)
  const handleSettingsSaveTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpCode('');
    setOtpError(null);
    setSmsSentNotice(null);
    setShow2FAModal(true);

    try {
      const { data } = await api.post('/auth/send-settings-otp');
      if (data.test_code) {
        setSmsSentNotice(`SMS kodi yuborildi. (${data.test_code})`);
      } else {
        setSmsSentNotice("SMS Tasdiq kodi telefoningizga yuborildi!");
      }
    } catch (err: any) {
      console.error('Failed to send 2FA SMS', err);
      setSmsSentNotice("SMS kodi yuborildi (yoki test rejimida)");
    }
  };

  // Submit configuration changes with 2FA
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      setOtpError("Iltimos, 6 xonali OTP kodni to'liq kiriting.");
      return;
    }

    setOtpError(null);
    setIsSubmittingConfig(true);

    try {
      // 1. Verify 2FA OTP Code first
      await api.post('/auth/verify-settings-otp', { otp: otpCode });

      // 2. API call updating platform commission and debt thresholds
      await api.post('/admin/settings', {
        baseCommission,
        sRankCommission,
        lockoutThreshold,
        twoFactorToken: otpCode
      });

      setIsSubmittingConfig(false);
      setConfigSuccess(true);
      setTimeout(() => {
        setConfigSuccess(false);
        setShow2FAModal(false);
      }, 1800);

    } catch (err: any) {
      console.warn('2FA verification failed or settings error:', err);
      const errMsg = err.response?.data?.message || "2FA Tasdiqlash kodi noto'g'ri";
      setOtpError(errMsg);
      setIsSubmittingConfig(false);
    }
  };

  return (
    <div className="space-y-8 text-text-primary">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-text-primary to-primary bg-clip-text text-transparent">
          Tizim Stavkalari Sozlamalari
        </h1>
        <p className="text-xs text-text-muted mt-1">Platforma komissiya foizlari, kassa limitlari va xavfsizlik konfiguratsiyalari</p>
      </div>

      {configSuccess && (
        <div className="p-3 bg-success/15 border border-success/20 rounded-lg text-success text-xs font-semibold text-center animate-pulse">
          Tizim stavkalari muvaffaqiyatli yangilandi!
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSettingsSaveTrigger} className="max-w-xl space-y-6">
        <div className="glass-panel border border-border-glass rounded-2xl p-6 bg-surface/50 space-y-5 text-xs">
          <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary animate-pulse" />
            <span>Tizim komissiya ko'rsatkichlari</span>
          </h3>

          {/* Base commission */}
          <div className="space-y-1">
            <label className="block text-[10px] text-text-muted">Asosiy platforma komissiyasi (Base rate):</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="30.0"
                required
                value={baseCommission}
                onChange={(e) => setBaseCommission(Number(e.target.value))}
                className="w-full pl-3 pr-8 h-10 rounded bg-surface border border-border-glass text-xs font-bold focus:border-primary focus:outline-none"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted font-bold">%</span>
            </div>
          </div>

          {/* S Rank commission */}
          <div className="space-y-1">
            <label className="block text-[10px] text-text-muted">Elite S-Rank komissiya stavkasi (Capped rate):</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="20.0"
                required
                value={sRankCommission}
                onChange={(e) => setSRankCommission(Number(e.target.value))}
                className="w-full pl-3 pr-8 h-10 rounded bg-surface border border-border-glass text-xs font-bold focus:border-primary focus:outline-none"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted font-bold">%</span>
            </div>
          </div>

          {/* Lockout threshold */}
          <div className="space-y-1">
            <label className="block text-[10px] text-text-muted">Komissiya qarzi lockout ogohlantirish chegarasi (Threshold):</label>
            <div className="relative">
              <input
                type="number"
                step="10000"
                min="100000"
                max="2000000"
                required
                value={lockoutThreshold}
                onChange={(e) => setLockoutThreshold(Number(e.target.value))}
                className="w-full pl-3 pr-16 h-10 rounded bg-surface border border-border-glass text-xs font-bold focus:border-primary focus:outline-none"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted font-bold">UZS</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded bg-primary hover:bg-primary-hover py-3 text-xs font-bold text-white shadow-glow-purple transition-all active:scale-95 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Sozlamalarni Saqlash</span>
          </button>
        </div>
      </form>

      {/* ============================================================================
          SECURITY 2FA CODE CHALLENGE DIALOG MODAL
         ============================================================================ */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in text-text-primary">
          <form onSubmit={handleVerify2FA} className="w-full max-w-sm glass-panel border border-border-glass rounded-2xl p-6 space-y-6 relative">
            <button
              type="button"
              onClick={() => setShow2FAModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary h-7 w-7 rounded-full bg-surface/50 border border-border-glass flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-display text-base font-bold text-text-primary flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-5 w-5 text-primary animate-pulse" />
                <span>2FA Tasdiqlash talab etiladi</span>
              </h3>
              <p className="font-sans text-xs text-text-muted">
                Tizim sozlamalarini o'zgartirish uchun telefoningizga yuborilgan 6 xonali OTP kodni kiriting.
              </p>
            </div>

            {/* Verification Inputs */}
            <div className="space-y-3 text-xs">
              {smsSentNotice && (
                <div className="p-2 bg-primary/10 border border-primary/20 rounded text-primary text-[11px] font-semibold text-center animate-pulse">
                  {smsSentNotice}
                </div>
              )}
              <div className="space-y-1">
                <label className="block text-[10px] text-text-muted text-center font-bold">SMS Tasdiq kodi:</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 h-11 rounded bg-surface border border-border-glass text-center text-sm font-extrabold tracking-widest focus:border-primary focus:outline-none"
                />
              </div>

              {otpError && (
                <div className="p-2.5 rounded bg-danger/10 border border-danger/20 text-danger text-[10px] font-semibold text-center flex items-center justify-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}
            </div>

            {/* Actions triggers */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={otpCode.length < 6 || isSubmittingConfig}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-lg py-3 text-xs font-bold text-white transition-all shadow-glow-purple",
                  otpCode.length >= 6 && !isSubmittingConfig
                    ? "bg-primary hover:bg-primary-hover active:scale-95 cursor-pointer" 
                    : "bg-surface border border-border-glass text-text-muted cursor-not-allowed"
                )}
              >
                {isSubmittingConfig ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>2FA tekshirilmoqda...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Tasdiqlash va saqlash</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShow2FAModal(false)}
                className="w-full text-center py-2 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
              >
                Orqaga qaytish
              </button>
            </div>

            {configSuccess && (
              <div className="p-3 bg-success/15 border border-success/20 rounded-lg text-success text-xs font-semibold text-center animate-pulse flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                <span>2FA Tasdiqlandi!</span>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
