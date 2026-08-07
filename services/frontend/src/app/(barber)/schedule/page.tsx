'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Check, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  Save, 
  CheckCircle2, 
  RefreshCw,
  Sliders,
  DollarSign
} from 'lucide-react';
import { api } from '@/lib/axios';
import { cn } from '@/utils/cn';

interface Booking {
  id: string;
  customerName: string;
  timeSlot: string;
  scheduledStart: string;
  status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  otpCode: string;
  price: string;
}

interface HolidayBlock {
  id: string;
  date: string;
  reason: string;
}

export default function BarberSchedulePage() {
  // 1. Availability Settings State
  const [startHour, setStartHour] = useState('09:00');
  const [endHour, setEndHour] = useState('18:00');
  const [workdays, setWorkdays] = useState<Record<string, boolean>>({
    'Dushanba': true,
    'Seshanba': true,
    'Chorshanba': true,
    'Payshanba': true,
    'Juma': true,
    'Shanba': false,
    'Yakshanba': false
  });

  // Holiday blocks state
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayReason, setHolidayReason] = useState('');
  const [holidays, setHolidays] = useState<HolidayBlock[]>([]);

  // UI Save Feedback states
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // 2. Daily Queue calendar state
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  });

  // Daily Bookings Queue state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active OTP Check-in input states
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [otpErrors, setOtpErrors] = useState<Record<string, string>>({});
  const [otpSuccess, setOtpSuccess] = useState<Record<string, boolean>>({});

  // Fetch bookings, schedule, and holidays
  const loadBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const { data } = await api.get(`/bookings/today?date=${dateStr}`);
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const schedRes = await api.get('/barbers/availability/schedule');
      const holRes = await api.get('/barbers/availability/holidays');
      
      if (schedRes.data && schedRes.data.work_hours) {
        let savedDays = schedRes.data.work_hours.days || schedRes.data.work_hours;
        if (typeof savedDays === 'string') {
          try { savedDays = JSON.parse(savedDays); } catch(e){}
        }
        
        // Ensure the days exist
        const defaultDays = {
          'Dushanba': true, 'Seshanba': true, 'Chorshanba': true, 
          'Payshanba': true, 'Juma': true, 'Shanba': false, 'Yakshanba': false
        };
        
        if (!savedDays || Object.keys(savedDays).length === 0 || !savedDays['Dushanba']) {
          setWorkdays(defaultDays);
        } else {
          setWorkdays(savedDays);
        }

        setStartHour(schedRes.data.work_hours.start || '09:00');
        setEndHour(schedRes.data.work_hours.end || '18:00');
      }
      if (holRes.data) {
        setHolidays(holRes.data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [selectedDate]);

  useEffect(() => {
    loadSettings();
  }, []);

  // Date Carousel items (Today + next 6 days)
  const carouselDates = useMemo(() => {
    const list: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const next = new Date();
      next.setDate(next.getDate() + i);
      list.push(next);
    }
    return list;
  }, []);

  // Set workday check toggles
  const toggleWorkday = (day: string) => {
    setWorkdays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  // Add holiday blockout
  const addHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDate || !holidayReason) return;
    
    try {
      await api.post('/barbers/availability/holidays', {
        holiday_date: holidayDate,
        reason: holidayReason
      });
      const newBlock: HolidayBlock = {
        id: `h-${Math.random()}`,
        date: holidayDate,
        reason: holidayReason
      };
      setHolidays([...holidays, newBlock]);
      setHolidayDate('');
      setHolidayReason('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ta\'til qo\'shishda xatolik');
    }
  };

  // Delete holiday blockout
  const deleteHoliday = async (id: string) => {
    try {
      await api.delete(`/barbers/availability/holidays/${id}`);
      setHolidays(holidays.filter(h => h.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ta\'tilni o\'chirishda xatolik');
    }
  };

  // Save Availability Settings via API
  const saveAvailabilityConfig = async () => {
    setIsSavingConfig(true);
    setConfigSuccess(false);
    setConfigError(null);

    try {
      await api.put('/barbers/availability/schedule', {
        work_hours: {
          days: workdays,
          start: startHour,
          end: endHour
        }
      });
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 2000);
    } catch (err: any) {
      console.error('Failed to save config:', err);
      setConfigError(err.response?.data?.message || 'Sozlamalarni saqlashda xatolik');
      setTimeout(() => setConfigError(null), 3000);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // OTP Verification Check-in transaction
  const handleVerifyOtp = async (bookingId: string, scheduledStart: string) => {
    const input = otpInputs[bookingId] || '';
    setOtpErrors(prev => ({ ...prev, [bookingId]: '' }));

    if (input.length < 4) {
      setOtpErrors(prev => ({ ...prev, [bookingId]: 'OTP kod to\'liq emas' }));
      return;
    }

    try {
      await api.post('/bookings/complete', { 
        booking_id: bookingId,
        scheduled_start: scheduledStart,
        otp_code: input 
      });

      // Update local state
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'COMPLETED' } : b));
      setOtpSuccess(prev => ({ ...prev, [bookingId]: true }));
      setTimeout(() => {
        setOtpSuccess(prev => ({ ...prev, [bookingId]: false }));
      }, 2000);

    } catch (err: any) {
      console.error('OTP Checkin failed:', err);
      setOtpErrors(prev => ({ ...prev, [bookingId]: err.response?.data?.message || 'Noto\'g\'ri OTP tasdiqlash kodi.' }));
    }
  };

  return (
    <div className="space-y-8 text-text-primary">
      {/* Top Welcome Title */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-text-primary to-primary bg-clip-text text-transparent">
          Uchrashuvlar Kalendari
        </h1>
        <p className="text-xs text-text-muted mt-1">Sizning bugungi navbatlaringiz va ish vaqtingiz sozlamalari</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Daily Queue List */}
        <div className="lg:col-span-7 space-y-6">
          {/* Day Scrolling Carousel Header */}
          <div className="glass-panel border border-border-glass rounded-xl p-4 bg-surface/50 flex flex-col gap-3">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Sanani tanlang:</span>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {carouselDates.map((date, index) => {
                const isSelected = selectedDate.getDate() === date.getDate() && 
                                   selectedDate.getMonth() === date.getMonth();
                const dayName = date.toLocaleDateString('uz-UZ', { weekday: 'short' });
                const dayNum = date.getDate();

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2.5 rounded-lg border min-w-14 transition-all shrink-0",
                      isSelected 
                        ? "bg-primary border-primary text-white shadow-glow-purple" 
                        : "border-border-glass bg-surface/40 hover:bg-border-glass/40 text-text-muted hover:text-text-primary"
                    )}
                  >
                    <span className="text-[9px] uppercase font-bold">{dayName}</span>
                    <span className="text-sm font-extrabold mt-1">{dayNum}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bookings Queue Grid List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary animate-pulse" />
                <span>Kutish navbatlar ro'yxati:</span>
              </h3>
              <button onClick={loadBookings} className="text-[10px] flex items-center gap-1 text-primary hover:text-primary-hover">
                <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} /> Yangilash
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 gap-3 text-text-muted">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs font-semibold">Navbatlar ro'yxati yangilanmoqda...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-danger border border-dashed border-danger/30 rounded-xl gap-2 bg-danger/5">
                <AlertTriangle className="h-10 w-10 text-danger animate-pulse" />
                <span className="text-xs font-bold">{error}</span>
                <button onClick={loadBookings} className="mt-2 px-4 py-2 bg-danger text-white rounded font-bold text-xs">Qaytadan urinish</button>
              </div>
            ) : bookings.length === 0 ? (
              <div className="glass-panel border border-border-glass rounded-xl p-8 text-center text-xs text-text-muted italic">
                Bugun uchun navbatlar va bronlar mavjud emas.
              </div>
            ) : (
              bookings.map((booking) => {
                const isActive = booking.status === 'PENDING' || booking.status === 'CONFIRMED' || booking.status === 'ACTIVE';
                const isCompleted = booking.status === 'COMPLETED';

                // We need scheduledStart for completion API call
                const scheduledStartIso = new Date(); // Fallback, normally we'd need to reconstruct the full date from `timeSlot` or return it from API
                // For safety we can extract the time from `timeSlot` "14:00 - 15:00"
                const [startHourStr, startMinStr] = booking.timeSlot.split(' - ')[0].split(':');
                scheduledStartIso.setHours(Number(startHourStr), Number(startMinStr), 0, 0);

                return (
                  <div
                    key={booking.id}
                    className={cn(
                      "glass-panel border rounded-xl p-5 flex flex-col sm:flex-row justify-between gap-5 transition-all relative overflow-hidden",
                      isActive ? "border-primary-glow bg-primary/5 shadow-glow-purple" : "border-border-glass bg-surface/40"
                    )}
                  >
                    {/* Left: Client name and slot details */}
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-text-primary">{booking.customerName}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                          <Clock className="h-3 w-3 text-primary" />
                          <span>Vaqt: {booking.timeSlot}</span>
                          <span>•</span>
                          <span className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-0.5 text-success" />
                            {booking.price}
                          </span>
                        </div>
                        
                        {/* Status Badges */}
                        <div className="pt-1.5">
                          {isCompleted ? (
                            <span className="text-[9px] font-bold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Yakunlangan
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                              Kutilmoqda
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Check-in OTP verification section */}
                    {/* Right: Check-in / OTP action */}
                    <div className="flex flex-col items-end justify-between border-t sm:border-t-0 sm:border-l border-border-glass pt-4 sm:pt-0 sm:pl-5 w-full sm:w-auto mt-4 sm:mt-0">
                      {isActive && !isCompleted ? (
                        <div className="w-full space-y-2">
                          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Mijoz OTP kodi (Check-in):</label>
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-1">
                              <input
                                type="text"
                                placeholder="OTP kod"
                                maxLength={6}
                                value={otpInputs[booking.id] || ''}
                                onChange={(e) => setOtpInputs(prev => ({ ...prev, [booking.id]: e.target.value.replace(/\D/g, '') }))}
                                className={cn(
                                  "w-full h-10 bg-canvas border rounded-md px-3 text-sm font-semibold tracking-widest text-text-primary transition-all",
                                  otpErrors[booking.id] ? "border-danger focus:ring-danger/20" : "border-border-glass focus:border-primary focus:ring-primary/20"
                                )}
                              />
                              {otpErrors[booking.id] && (
                                <p className="text-[10px] font-semibold text-danger flex items-center gap-1 mt-1">
                                  <AlertTriangle className="h-3 w-3" /> {otpErrors[booking.id]}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleVerifyOtp(booking.id, booking.scheduledStart)}
                              className="h-10 px-4 bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-bold rounded-md shadow-glow-purple transition-all shrink-0"
                            >
                              Tasdiqlash
                            </button>
                          </div>
                        </div>
                      ) : (
                        isCompleted && (
                          <span className="text-[10px] text-success font-semibold flex items-center gap-1 animate-pulse">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            Muvaffaqiyatli yakunlandi!
                          </span>
                        )
                      )}
                      
                      {!isCompleted && otpSuccess[booking.id] && (
                        <span className="text-[9px] text-success font-semibold flex items-center gap-1 animate-pulse mt-2">
                          <CheckCircle2 className="h-3 w-3 shrink-0" />
                          Muvaffaqiyatli yakunlandi!
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Workdays Schedule & Holidays settings */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Availability Settings block */}
          <div className="glass-panel border border-border-glass rounded-2xl p-6 bg-surface/50 space-y-5">
            <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              <span>Ish vaqti sozlamalari</span>
            </h3>

            {/* Work hours range form */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] text-text-muted">Boshlanish vaqti:</label>
                <input
                  type="time"
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="w-full px-3 h-10 rounded border border-border-glass bg-surface text-text-primary focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] text-text-muted">Tugash vaqti:</label>
                <input
                  type="time"
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="w-full px-3 h-10 rounded border border-border-glass bg-surface text-text-primary focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Weekdays toggles */}
            <div className="space-y-2 text-xs">
              <span className="block text-[10px] text-text-muted font-bold">Ish kunlari:</span>
              <div className="grid grid-cols-4 gap-1.5">
                {Object.keys(workdays).map((day) => {
                  const isActive = workdays[day];
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWorkday(day)}
                      className={cn(
                        "py-1.5 rounded text-[10px] font-semibold border transition-all text-center truncate",
                        isActive 
                          ? "border-primary bg-primary/10 text-primary" 
                          : "border-border-glass text-text-muted hover:text-text-primary"
                      )}
                    >
                      {day.substring(0, 4)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Config actions */}
            <div className="pt-2 border-t border-border-glass flex flex-col gap-3">
              <button
                onClick={saveAvailabilityConfig}
                disabled={isSavingConfig}
                className="w-full flex items-center justify-center gap-2 rounded bg-primary hover:bg-primary-hover py-2.5 text-xs font-bold text-white shadow-glow-purple transition-all active:scale-95 cursor-pointer"
              >
                {isSavingConfig ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>Saqlanmoqda...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Ish vaqtlarini saqlash</span>
                  </>
                )}
              </button>

              {configSuccess && (
                <div className="p-2.5 rounded bg-success/15 border border-success/20 text-success text-[10px] font-semibold text-center animate-pulse">
                  Ish vaqtlari sozlamalari muvaffaqiyatli saqlandi!
                </div>
              )}
              {configError && (
                <div className="p-2.5 rounded bg-danger/15 border border-danger/20 text-danger text-[10px] font-semibold text-center">
                  {configError}
                </div>
              )}
            </div>
          </div>

          {/* Holiday / block-out dates management */}
          <div className="glass-panel border border-border-glass rounded-2xl p-6 bg-surface/50 space-y-4">
            <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Ta'tillar va band kunlar</span>
            </h3>

            {/* Add Holiday Form */}
            <form onSubmit={addHoliday} className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
              <input
                type="date"
                required
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
                className="sm:col-span-5 px-3 h-9 rounded border border-border-glass bg-surface text-text-primary focus:border-primary focus:outline-none"
              />
              <input
                type="text"
                required
                placeholder="Sabab (Masalan: Dam olish)"
                value={holidayReason}
                onChange={(e) => setHolidayReason(e.target.value)}
                className="sm:col-span-5 px-3 h-9 rounded border border-border-glass bg-surface text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                className="sm:col-span-2 flex items-center justify-center rounded bg-primary hover:bg-primary-hover text-white shadow-glow-purple transition-colors h-9"
                aria-label="Add Holiday"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>

            {/* Holidays List */}
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {holidays.length === 0 ? (
                <span className="block text-[10px] text-text-muted italic text-center py-2">
                  Hozircha ta'tillar rejalashtirilmagan.
                </span>
              ) : (
                holidays.map(h => (
                  <div key={h.id} className="flex justify-between items-center bg-surface p-2 rounded border border-border-glass text-[10px]">
                    <div>
                      <span className="font-bold text-text-primary">{h.date}</span>
                      <span className="text-text-muted ml-2">• {h.reason}</span>
                    </div>
                    <button
                      onClick={() => deleteHoliday(h.id)}
                      className="text-danger hover:text-danger-hover transition-colors p-1"
                      aria-label="Delete blockout date"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
