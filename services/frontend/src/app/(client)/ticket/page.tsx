'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, AlertTriangle, ArrowRight, Star, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { api } from '@/lib/axios';

type ActiveSegment = 'ACTIVE' | 'HISTORY';

export default function ClientTicketPage() {
  const [activeSegment, setActiveSegment] = useState<ActiveSegment>('ACTIVE');
  
  // Review modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const [pastBookings, setPastBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const [activeRes, historyRes] = await Promise.all([
        api.get('/bookings/client/active'),
        api.get('/bookings/client/history')
      ]);
      
      const formatTime = (isoString: string) => new Date(isoString).toLocaleString('uz-UZ', { 
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });

      setActiveBookings(activeRes.data.map((b: any) => ({
        id: b.id, 
        usta: b.usta || b.barber_name || 'Sartarosh', 
        salon: b.salon || b.shop_name || 'Barbershop', 
        time: b.time || formatTime(b.scheduled_start), 
        otp: b.otp || b.otp_code, 
        price: String(b.price).includes('UZS') ? b.price : `${b.price} UZS`
      })));

      setPastBookings(historyRes.data.map((b: any) => ({
        id: b.id, 
        barber_id: b.barber_id, 
        usta: b.usta || b.barber_name || 'Sartarosh', 
        salon: b.salon || b.shop_name || 'Barbershop', 
        time: b.time || formatTime(b.scheduled_start), 
        price: String(b.price).includes('UZS') ? b.price : `${b.price} UZS`, 
        isReviewed: b.isReviewed
      })));
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (id: number) => {
    if (confirm('Uchrashuvni bekor qilishni tasdiqlaysizmi? To\'lov to\'liq qaytariladi.')) {
      try {
        await api.post(`/bookings/cancel/${id}`);
        setActiveBookings(activeBookings.filter((b) => b.id !== id));
        alert('Uchrashuv bekor qilindi. Mablag\' qaytarildi.');
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || 'Xatolik yuz berdi');
      }
    }
  };

  const openReviewDialog = (booking: any) => {
    setSelectedBooking(booking);
    setReviewRating(5);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setIsSubmitting(true);
    try {
      await api.post('/reputation/reviews', {
        booking_id: selectedBooking.id,
        barber_id: selectedBooking.barber_id,
        rating: reviewRating,
        comment: reviewComment
      });
      setPastBookings(pastBookings.map((b) => b.id === selectedBooking.id ? { ...b, isReviewed: true } : b));
      setShowReviewModal(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 2000);
    } catch (err: any) {
      console.error('Failed to submit review', err);
      alert(err.response?.data?.message || 'Sharh qoldirishda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Segment Controller */}
      <div className="flex border-b border-border-glass">
        <button
          onClick={() => setActiveSegment('ACTIVE')}
          className={cn(
            "px-6 py-3 border-b-2 font-semibold text-sm transition-colors duration-150",
            activeSegment === 'ACTIVE'
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          )}
        >
          Faol Buyurtmalar (Active)
        </button>
        <button
          onClick={() => setActiveSegment('HISTORY')}
          className={cn(
            "px-6 py-3 border-b-2 font-semibold text-sm transition-colors duration-150",
            activeSegment === 'HISTORY'
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          )}
        >
          Buyurtmalar Tarixi (History)
        </button>
      </div>

      {showSuccessToast && (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 p-3 text-xs font-semibold text-success animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Fikringiz qabul qilindi. Rahmat! Hisobingizga +10 ball qo'shildi.</span>
        </div>
      )}

      {activeSegment === 'ACTIVE' ? (
        /* ============================================================================
            ACTIVE BOOKINGS
           ============================================================================ */
        activeBookings.length === 0 ? (
          <div className="glass-panel p-8 rounded-xl border border-border-glass flex flex-col items-center justify-center text-center space-y-4">
            <p className="text-text-muted text-sm">Yaqin orada uchrashuvlar mavjud emas.</p>
            {pastBookings.length > 0 && (
              <button
                onClick={() => setActiveSegment('HISTORY')}
                className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 text-primary px-6 py-2.5 font-bold text-sm hover:bg-primary/20 transition-colors"
              >
                O'tgan buyurtmalarni ko'rish va baholash
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {activeBookings.map((booking) => (
              <div key={booking.id} className="glass-panel p-6 rounded-2xl border border-primary-glow bg-primary/5 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-glass pb-4">
                  <div className="flex items-center gap-4">
                    <Calendar className="h-10 w-10 text-primary shrink-0" />
                    <div>
                      <h4 className="font-display text-base font-bold text-text-primary">{booking.usta}</h4>
                      <p className="text-xs text-text-muted">{booking.salon}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-text-primary">{booking.time}</p>
                    <p className="text-xs text-text-muted mt-1">{booking.price}</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* QR code and check-in block */}
                  <div className="flex items-center gap-6">
                    {/* Simulated SVG QR code */}
                    <div className="h-20 w-20 bg-white p-2 rounded-lg shrink-0 flex items-center justify-center">
                      <div className="h-16 w-16 bg-[url('/hero_user.png')] bg-cover"></div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-muted uppercase">Sartaroshga ko'rsatish (Check-in)</p>
                      <p className="text-2xl font-bold tracking-widest text-primary mt-1">OTP: {booking.otp}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    className="flex w-full md:w-auto items-center justify-center rounded-md bg-surface border border-danger/30 hover:bg-danger/10 text-danger px-4 h-10 text-xs font-semibold transition-colors duration-150"
                  >
                    Uchrashuvni Bekor Qilish
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ============================================================================
            BOOKING HISTORY
           ============================================================================ */
        pastBookings.length === 0 ? (
          <div className="glass-panel p-8 rounded-xl border border-border-glass text-center text-text-muted text-sm">
            Tarixda buyurtmalar mavjud emas.
          </div>
        ) : (
          <div className="space-y-4">
            {pastBookings.map((booking) => (
              <div key={booking.id} className="glass-panel p-5 rounded-xl border border-border-glass flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-text-primary">{booking.usta}</h4>
                  <p className="text-xs text-text-muted mt-1">{booking.salon} • {booking.time}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-text-muted">{booking.price}</span>
                  {booking.isReviewed ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-border-glass rounded-md text-text-muted text-xs font-semibold shrink-0 cursor-default">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Baholangan
                    </div>
                  ) : (
                    <button
                      onClick={() => openReviewDialog(booking)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-md text-xs font-semibold transition-colors shrink-0"
                    >
                      <Star className="h-4 w-4 fill-primary" />
                      Baholash
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ============================================================================
          REVIEWS DIALOG MODAL OVERLAY
         ============================================================================ */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <form onSubmit={handleReviewSubmit} className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-2xl border border-border-glass relative space-y-6">
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center space-y-2">
              <h3 className="font-display text-lg font-bold text-text-primary">Xizmatga baho bering</h3>
              <p className="font-sans text-xs text-text-muted">Natija va sartarosh mahorati sizga yoqdimi?</p>
            </div>

            {/* Stars Selector Row */}
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      star <= reviewRating ? "fill-warning text-warning" : "text-text-muted"
                    )}
                  />
                </button>
              ))}
            </div>

            {/* Comments textarea */}
            <div className="space-y-2">
              <label htmlFor="comment" className="block text-xs font-semibold text-text-muted">Sharhingiz</label>
              <textarea
                id="comment"
                rows={3}
                placeholder="Xizmat haqida o'z fikringizni bildiring (ixtiyoriy)..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="block w-full rounded-md border border-border-glass bg-surface/50 p-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 flex items-center justify-center rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Yuborilmoqda...' : 'Yuborish & 10 ball olish'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
