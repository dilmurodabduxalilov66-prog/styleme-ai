'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { Camera, Calendar, Award, Sparkles, UserCheck, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/axios';

interface ProfileData {
  first_name: string;
  last_name: string;
  avatar_url?: string;
  face_shape?: string;
  loyalty_points: number;
  past_scans: Array<{ id: string; name: string; date: string; img: string }>;
}

interface ActiveBooking {
  id: string;
  usta: string;
  salon: string;
  time: string;
  otp: string;
  price: string;
}

interface MissedBooking {
  id: string;
  usta: string;
  salon: string;
  time: string;
  raw_time: string;
  price: string;
  is_paid: boolean;
  can_refund: boolean;
  has_refund_request: boolean;
  refund_status?: string;
}

export default function ClientDashboard() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([]);
  const [missedBookings, setMissedBookings] = useState<MissedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplyingRefund, setIsApplyingRefund] = useState<string | null>(null);

  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    const activeId = user?.id || user?.userId;
    if (!activeId) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [profileRes, bookingsRes, missedRes, aiRes] = await Promise.all([
          api.get('/auth/profile'),
          api.get('/bookings/client/active'),
          api.get('/bookings/client/missed'),
          api.get(`/ai/recommendations?user_id=${activeId}`)
        ]);
        setProfile(profileRes.data);
        setActiveBookings(bookingsRes.data);
        setMissedBookings(missedRes.data);
        setRecommendations(aiRes.data.recommended_styles || []);
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        setError('Tizimdan ma\'lumotlarni yuklashda xatolik yuz berdi.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const faceShape = profile?.face_shape || 'Aniqlanmagan';
  const loyaltyPoints = profile?.loyalty_points || 0;
  const pastScans = profile?.past_scans || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-text-muted">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-danger/20 bg-danger/5 flex flex-col items-center text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="h-10 w-10 text-danger animate-bounce" />
        <h4 className="text-sm font-bold text-text-primary">Xatolik yuz berdi</h4>
        <p className="text-xs text-text-muted">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-md transition-all duration-150 active:scale-95">
          Qayta urinish
        </button>
      </div>
    );
  }

  const welcomeName = profile?.first_name && profile.first_name !== 'New'
    ? `${profile.first_name} ${profile.last_name || ''}`
    : (user?.email?.split('@')[0] || 'Jasur');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Loyalty Card Banner */}
      <div className="glass-panel group p-6 sm:p-8 rounded-2xl border border-border-glass flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden transition-all duration-500 hover:shadow-glow-purple">
        <div className="absolute top-[-50%] right-[-10%] w-64 h-64 rounded-full bg-primary/20 blur-[80px] pointer-events-none group-hover:bg-primary/30 transition-colors duration-500"></div>
        <div className="space-y-2 relative z-10">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-text-primary to-primary bg-clip-text text-transparent">
            Salom, {welcomeName}! 👤
          </h1>
          <p className="font-sans text-sm text-text-muted">
            Yuz shaklingiz tahlili: <span className="text-primary font-bold shadow-primary/20 drop-shadow-md">{faceShape}</span>
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-4 bg-surface/40 backdrop-blur-md px-5 py-4 rounded-xl border border-border-glass hover:bg-surface/60 transition-colors duration-300">
          <Award className="h-8 w-8 text-primary shrink-0 animate-pulse" />
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Sizning Ballaringiz</p>
            <p className="text-xl font-black text-text-primary drop-shadow-md">{loyaltyPoints} <span className="text-sm font-bold text-primary">ball</span></p>
          </div>
        </div>
      </div>

      {/* Active Booking Widget Preview */}
      {activeBookings.length > 0 ? (
        <div className="glass-panel p-6 rounded-2xl border border-primary-glow bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Calendar className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Keyingi uchrashuv mavjud ({activeBookings[0].time})</h3>
              <p className="text-xs text-text-muted mt-1">{activeBookings[0].salon} • Usta: {activeBookings[0].usta}</p>
            </div>
          </div>
          <Link
            href="/ticket"
            className="flex items-center justify-center gap-2 rounded-md bg-primary hover:bg-primary-hover px-4 h-10 text-xs font-semibold text-white shadow-glow-purple transition-all duration-150 active:scale-95"
          >
            <span>Chiptani Ko'rsatish (OTP: {activeBookings[0].otp})</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-2xl border border-border-glass flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-surface/50 text-text-muted flex items-center justify-center shrink-0">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Yaqin orada faol uchrashuvlaringiz yo'q</h3>
              <p className="text-xs text-text-muted mt-1">Yangi soch turmagi uchun sartaroshga yoziling.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/ticket"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-surface border border-border-glass hover:bg-border-base px-4 h-10 text-xs font-semibold text-text-primary transition-all duration-150 active:scale-95"
            >
              <span>O'tgan uchrashuvlar / Baholash</span>
            </Link>
            <Link
              href="/barbers"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-primary hover:bg-primary-hover px-4 h-10 text-xs font-semibold text-white shadow-glow-purple transition-all duration-150 active:scale-95"
            >
              <span>Sartaroshlarni qidirish</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Missed Bookings for Refund */}
      {missedBookings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">O'tkazib yuborilgan uchrashuvlar</h2>
          {missedBookings.map((mb) => (
            <div key={mb.id} className="glass-panel p-6 rounded-2xl border border-danger/30 bg-danger/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-danger/10 text-danger flex items-center justify-center shrink-0">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Uchrashuv vaqti o'tib ketgan ({mb.time})</h3>
                  <p className="text-xs text-text-muted mt-1">{mb.salon} • Usta: {mb.usta}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {mb.has_refund_request ? (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-surface border border-border-glass text-text-muted">
                    {mb.refund_status === 'PENDING' ? 'Ariza kutilmoqda' : mb.refund_status === 'APPROVED' ? 'Pul qaytarildi' : 'Ariza rad etildi'}
                  </span>
                ) : mb.can_refund ? (
                  <button
                    disabled={isApplyingRefund === mb.id}
                    onClick={async () => {
                      setIsApplyingRefund(mb.id);
                      try {
                        await api.post('/bookings/refunds/apply', { booking_id: mb.id });
                        alert("Ariza muvaffaqiyatli yuborildi! Tasdiqlangach pulingiz qaytariladi.");
                        window.location.reload();
                      } catch (err: any) {
                        alert(err.response?.data?.message || "Xatolik yuz berdi");
                      } finally {
                        setIsApplyingRefund(null);
                      }
                    }}
                    className="flex items-center justify-center gap-2 rounded-md bg-danger hover:bg-danger/80 px-4 h-10 text-xs font-semibold text-white shadow-glow-purple transition-all duration-150 active:scale-95 disabled:opacity-50"
                  >
                    {isApplyingRefund === mb.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Pulni qaytarish (Ariza berish)</span>}
                  </button>
                ) : (
                  <span className="text-xs text-text-muted">
                    {mb.is_paid ? "24 soat o'tgach ariza berish mumkin" : "To'lanmagan"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Style Recommendations Module */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-text-primary flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>Sizga mos tavsiyalar</span>
            </h2>
            <Link href="/tryon" className="text-xs font-semibold text-primary hover:underline">
              Kamerani ochish
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {recommendations.map((rec, i) => (
              <div key={i} className="glass-panel p-5 rounded-xl border border-border-glass flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{rec.name}</h4>
                    <span className="text-[10px] font-bold text-success bg-success/10 px-2.5 py-1 rounded-full border border-success/30 shadow-[0_0_10px_rgba(34,197,94,0.3)] animate-pulse">
                      {rec.compatibility_score}% Moslik
                    </span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">Sizning yuz shaklingizga ({faceShape}) mos keladi.</p>
                </div>
                <Link
                  href="/tryon"
                  className="flex items-center justify-center gap-2 rounded-md bg-surface border border-border-glass hover:bg-border-base w-full h-8 text-xs font-semibold text-text-primary transition-colors"
                >
                  O'z rasmingizda sinash
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* AI Analysis History Teaser Module */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-text-primary flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <span>Tahlillar tarixi</span>
            </h2>
          </div>

          {pastScans.length === 0 ? (
            <div className="glass-panel p-6 rounded-xl border border-border-glass text-center text-text-muted text-xs py-8">
              Skanerlashlar tarixi mavjud emas.
            </div>
          ) : (
            <div className="space-y-4">
              {pastScans.map((scan) => (
                <div key={scan.id} className="glass-panel p-4 rounded-xl border border-border-glass flex items-center gap-4">
                  <img
                    src={scan.img}
                    alt={scan.name}
                    className="h-12 w-12 rounded-lg object-cover border border-border-glass shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-text-primary truncate">{scan.name}</h4>
                    <p className="text-[10px] text-text-muted mt-0.5">{scan.date}</p>
                  </div>
                  <Link
                    href="/tryon"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface hover:bg-border-base text-text-muted hover:text-text-primary border border-border-glass transition-colors shrink-0"
                    aria-label="Re-analyze look"
                  >
                    <UserCheck className="h-4 w-4 text-primary" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
