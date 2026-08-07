'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CreditCard, 
  Coins, 
  Star, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  User,
  ShieldCheck
} from 'lucide-react';
import { api } from '@/lib/axios';
import { cn } from '@/utils/cn';

interface Barber {
  id: string;
  name: string;
  salon: string;
  rating: number;
  reviews: number;
  price: string;
  priceRaw: number;
  avatar: string;
  distance: string;
}

const BARBERS_REF: Barber[] = [
  {
    id: 'barber-001',
    name: 'Elyor Karimov',
    salon: 'Elite Barbershop',
    rating: 4.9,
    reviews: 184,
    price: '60,000 UZS',
    priceRaw: 60000,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
    distance: '1.2 km'
  },
  {
    id: 'barber-002',
    name: 'Jasur Mamedov',
    salon: 'Gentlemen Lounge',
    rating: 4.7,
    reviews: 92,
    price: '50,000 UZS',
    priceRaw: 50000,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
    distance: '2.4 km'
  },
  {
    id: 'barber-003',
    name: 'Farhod Rahimov',
    salon: 'Golden Scissors',
    rating: 4.5,
    reviews: 63,
    price: '45,000 UZS',
    priceRaw: 45000,
    avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=200&h=200',
    distance: '3.1 km'
  },
  {
    id: 'barber-004',
    name: 'Sardor Do\'stov',
    salon: 'Modern Style',
    rating: 4.95,
    reviews: 215,
    price: '80,000 UZS',
    priceRaw: 80000,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200',
    distance: '1.8 km'
  },
  {
    id: 'barber-005',
    name: 'Doston Vohidov',
    salon: 'Retro Barber',
    rating: 4.2,
    reviews: 38,
    price: '35,000 UZS',
    priceRaw: 35000,
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200&h=200',
    distance: '4.5 km'
  }
];

export default function BookingCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const barberId = searchParams.get('barberId') || 'barber-001';

  // Selected Barber Details
  const barber = useMemo(() => {
    return BARBERS_REF.find(b => b.id === barberId) || BARBERS_REF[0];
  }, [barberId]);

  // Calendar Date State Variables
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // Time Slots State
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  // Transaction checkout states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generate days grid for the current month picker
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const daysArray: (Date | null)[] = [];

    // Empty spaces for previous month offset
    // Sunday is index 0. Shift so Monday is index 0 if desired, but standard Sun-aligned is fine
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push(null);
    }

    for (let d = 1; d <= totalDays; d++) {
      daysArray.push(new Date(year, month, d));
    }

    return daysArray;
  }, [currentDate]);

  // Available slots seed based on date
  const availableSlots = useMemo(() => {
    const slots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:30', '17:00', '18:30', '20:00'];
    // Randomize availability slightly based on the day to simulate API logic
    const day = selectedDate.getDate();
    return slots.filter((_, idx) => (idx + day) % 3 !== 0);
  }, [selectedDate]);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Check if date is in the past
  const isPastDate = (date: Date | null) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
  };

  // Submit GraphQL Mutation
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setErrorMsg("Iltimos, uchrashuv vaqtini tanlang.");
      return;
    }

    if (paymentMethod === 'CARD') {
      if (cardNumber.length < 16 || cardExpiry.length < 4) {
        setErrorMsg("Iltimos, karta ma'lumotlarini to'liq kiriting.");
        return;
      }
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const scheduledStart = new Date(selectedDate);
      const [hours, minutes] = selectedSlot.split(':');
      scheduledStart.setHours(Number(hours), Number(minutes), 0, 0);

      const scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setHours(scheduledEnd.getHours() + 1); // 1-hour slots

      // GraphQL Mutation structure
      const query = `
        mutation CreateBooking($barberId: UUID!, $startTime: DateTime!, $endTime: DateTime!, $paymentMethod: PaymentMethod!) {
          createBooking(barberId: $barberId, scheduledStart: $startTime, scheduledEnd: $endTime, paymentMethod: $paymentMethod) {
            id
            scheduled_start
            scheduled_end
            current_status
            payment_method
            otp_code
          }
        }
      `;
      const variables = {
        barberId: barber.id === 'barber-001' ? '61fcc450-2cdf-4d57-9156-2e0f41f03d15' : '61fcc450-2cdf-4d57-9156-2e0f41f03d16',
        startTime: scheduledStart.toISOString(),
        endTime: scheduledEnd.toISOString(),
        paymentMethod: paymentMethod === 'CARD' ? 'DIGITAL' : paymentMethod
      };

      const { data } = await api.post('/graphql', { query, variables });

      if (data?.errors) {
        throw new Error(data.errors[0].message);
      }

      setSuccessMsg("Uchrashuv muvaffaqiyatli rejalashtirildi!");
      setTimeout(() => {
        setSuccessMsg(null);
        router.push('/ticket');
      }, 2000);

    } catch (err: any) {
      console.warn('Booking API error, falling back to simulation:', err);
      // Simulate successful checkout transaction
      setSuccessMsg("Uchrashuv muvaffaqiyatli band qilindi (Offline Simulyatsiya)!");
      setTimeout(() => {
        setSuccessMsg(null);
        router.push('/ticket');
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedMonthName = currentDate.toLocaleString('uz-UZ', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 text-text-primary">
      {/* Top Breadcrumb */}
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors duration-150"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Orqaga qaytish</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Calendar and slots */}
        <div className="lg:col-span-8 space-y-6">
          {/* Barber Info Header */}
          <div className="glass-panel border border-border-glass rounded-2xl p-5 flex items-center gap-4 bg-surface/50">
            <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 border border-border-glass">
              <img 
                src={barber.avatar} 
                alt={barber.name} 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded uppercase tracking-wider">
                Bron qilish sahifasi
              </span>
              <h2 className="text-base font-bold text-text-primary">{barber.name}</h2>
              <div className="flex items-center gap-2 text-[10px] text-text-muted">
                <Star className="h-3.5 w-3.5 fill-warning text-warning shrink-0" />
                <span className="font-bold text-white">{barber.rating}</span>
                <span>({barber.reviews} baho)</span>
                <span>•</span>
                <span className="flex items-center">
                  <MapPin className="h-3 w-3 mr-0.5 text-primary" />
                  {barber.distance} uzoqlikda
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Date Picker Calendar Card */}
          <div className="glass-panel border border-border-glass rounded-2xl p-6 bg-surface/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary animate-pulse" />
                <span>1. Uchrashuv kunini tanlang:</span>
              </h3>
              
              {/* Month Navigation controls */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={prevMonth}
                  className="h-8 w-8 rounded-lg bg-surface border border-border-glass flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                  aria-label="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold px-3 text-text-primary capitalize">{formattedMonthName}</span>
                <button 
                  onClick={nextMonth}
                  className="h-8 w-8 rounded-lg bg-surface border border-border-glass flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                  aria-label="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {/* Day names headers */}
              {['Yak', 'Dus', 'Se', 'Chor', 'Pay', 'Jum', 'Sha'].map((name, i) => (
                <div key={i} className="py-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  {name}
                </div>
              ))}

              {/* Days numbers */}
              {calendarDays.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} className="py-2"></div>;

                const isSelected = selectedDate.getDate() === date.getDate() && 
                                   selectedDate.getMonth() === date.getMonth() &&
                                   selectedDate.getFullYear() === date.getFullYear();
                const isPast = isPastDate(date);

                return (
                  <button
                    key={`day-${idx}`}
                    disabled={isPast}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedSlot(null); // Reset slot
                    }}
                    className={cn(
                      "py-2.5 rounded-lg font-bold border transition-all text-center flex items-center justify-center",
                      isSelected 
                        ? "bg-primary border-primary text-white shadow-glow-purple" 
                        : isPast 
                          ? "border-transparent text-text-muted/40 cursor-not-allowed" 
                          : "border-border-glass bg-surface hover:bg-border-glass/40 text-text-primary"
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slot picker selection */}
          <div className="glass-panel border border-border-glass rounded-2xl p-6 bg-surface/50 space-y-4">
            <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary animate-pulse" />
              <span>2. Uchrashuv vaqtini tanlang:</span>
            </h3>

            <div className="grid grid-cols-4 gap-3">
              {availableSlots.length === 0 ? (
                <div className="col-span-4 text-center py-6 text-xs text-text-muted italic">
                  Ushbu sana uchun hech qanday bo'sh vaqt topilmadi.
                </div>
              ) : (
                availableSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedSlot(time)}
                    className={cn(
                      "py-3 text-xs font-bold rounded-lg border text-center transition-all",
                      selectedSlot === time
                        ? "border-primary bg-primary text-white shadow-glow-purple"
                        : "border-border-glass hover:bg-border-glass/40 text-text-primary"
                    )}
                  >
                    {time}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Payment Form & Confirmation receipt */}
        <div className="lg:col-span-4 space-y-6">
          <form onSubmit={handleBookingSubmit} className="space-y-6">
            
            {/* 3. Payment Method Integration Selection */}
            <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-4">
              <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary animate-pulse" />
                <span>3. To'lov turi:</span>
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('CASH');
                    setErrorMsg(null);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all gap-1.5",
                    paymentMethod === 'CASH'
                      ? "border-primary bg-primary/5 shadow-glow-purple text-primary"
                      : "border-border-glass hover:bg-border-glass/30 text-text-muted"
                  )}
                >
                  <Coins className="h-5 w-5" />
                  <span className="text-[10px] font-bold">Naqd to'lash</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('CARD');
                    setErrorMsg(null);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all gap-1.5",
                    paymentMethod === 'CARD'
                      ? "border-primary bg-primary/5 shadow-glow-purple text-primary"
                      : "border-border-glass hover:bg-border-glass/30 text-text-muted"
                  )}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-[10px] font-bold">Plastik karta</span>
                </button>
              </div>

              {/* Simulated Payme/Click Card Fields if CARD chosen */}
              {paymentMethod === 'CARD' && (
                <div className="space-y-3 pt-3 border-t border-border-glass animate-fade-in text-xs">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {/* Visual Brand badges */}
                    <span className="text-[9px] font-extrabold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                      CLICK
                    </span>
                    <span className="text-[9px] font-extrabold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded">
                      PAYME
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-text-muted">Karta raqami (8600, 5614...)</label>
                    <input
                      type="text"
                      maxLength={16}
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 h-9 rounded bg-surface border border-border-glass text-xs placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-text-muted">Muddati (Oy/Yil)</label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 h-9 rounded bg-surface border border-border-glass text-xs placeholder:text-text-muted focus:border-primary focus:outline-none text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-text-muted">CVV/CVC</label>
                      <input
                        type="password"
                        maxLength={3}
                        placeholder="***"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 h-9 rounded bg-surface border border-border-glass text-xs placeholder:text-text-muted focus:border-primary focus:outline-none text-center"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-text-muted">Karta egasi ismi</label>
                    <input
                      type="text"
                      placeholder="KARTA EGASI ISMI"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                      className="w-full px-3 h-9 rounded bg-surface border border-border-glass text-xs placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. Booking Summary Confirmation receipt panel */}
            <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-4">
              <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Buyurtma tafsilotlari:</span>
              </h3>

              <div className="space-y-3 text-xs border-b border-border-glass pb-4">
                <div className="flex justify-between">
                  <span className="text-text-muted">Sana:</span>
                  <span className="font-bold text-text-primary">
                    {selectedDate.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Vaqt:</span>
                  <span className="font-bold text-primary">
                    {selectedSlot ? `${selectedSlot} - ${parseInt(selectedSlot) + 1}:00` : 'Tanlanmagan'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Sartarosh:</span>
                  <span className="font-bold text-text-primary">{barber.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Salon:</span>
                  <span className="font-bold text-text-primary">{barber.salon}</span>
                </div>
              </div>

              {/* Price summary block */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">Xizmat haqi:</span>
                  <span className="font-bold text-text-primary">{barber.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Platforma komissiyasi:</span>
                  <span className="font-semibold text-success">0 UZS (Usta tomonidan qoplanadi)</span>
                </div>
                <div className="flex justify-between border-t border-border-glass pt-2 font-bold text-sm">
                  <span>Jami to'lov:</span>
                  <span className="text-primary">{barber.price}</span>
                </div>
              </div>

              {/* Feedback messages */}
              {errorMsg && (
                <div className="flex items-center gap-1.5 p-3 rounded bg-danger/10 border border-danger/20 text-danger text-[10px] font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-1.5 p-3 rounded bg-success/10 border border-success/20 text-success text-[10px] font-semibold">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Action checkout buttons */}
              <button
                type="submit"
                disabled={!selectedSlot || isSubmitting}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-lg py-3 text-xs font-bold text-white transition-all shadow-glow-purple",
                  selectedSlot && !isSubmitting
                    ? "bg-primary hover:bg-primary-hover active:scale-95 cursor-pointer" 
                    : "bg-surface border border-border-glass text-text-muted cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>Tasdiqlanmoqda...</span>
                  </>
                ) : (
                  <>
                    <span>{paymentMethod === 'CARD' ? "Hozir to'lash va Bron qilish" : "Navbatga yozilish (Tasdiqlash)"}</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
