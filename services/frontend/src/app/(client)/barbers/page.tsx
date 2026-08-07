'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  MapPin, 
  Star, 
  Navigation, 
  ChevronRight, 
  Calendar, 
  Clock,
  Coins,
  X,
  Compass,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { api } from '@/lib/axios';
import { cn } from '@/utils/cn';
import dynamic from 'next/dynamic';

const MapWrapper = dynamic(() => import('@/components/map/MapComponent'), { ssr: false });

interface BarberRanking {
  raw_score: number;
  rank_grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
}

interface BarberPortfolio {
  image_url: string;
  title: string;
}

interface Barber {
  user_id: string;
  business_name: string;
  bio: string;
  latitude: number;
  longitude: number;
  skills: string[];
  starting_price: number;
  phone_number: string;
  avatar_url: string;
  ranking: BarberRanking;
  portfolio: BarberPortfolio[];
  distance_km: number;
  address?: string;
}

export default function BarberMarketplacePage() {
  const router = useRouter();

  // Search & Filter state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRank, setSelectedRank] = useState<string>('ALL');
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [maxPrice, setMaxPrice] = useState<number>(10000000);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'price'>('distance');

  // Geolocation state
  const [userLocation, setUserLocation] = useState({ lat: 41.3644, lng: 69.2844 }); // Yunusobod default
  const [locationLoaded, setLocationLoaded] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationLoaded(true);
        },
        (err) => {
          console.warn("Geolocation permission denied or failed, using default.");
          setLocationLoaded(true);
        }
      );
    } else {
      setLocationLoaded(true);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // List & Active selections
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [activeBarberId, setActiveBarberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Modal State
  const [bookingBarber, setBookingBarber] = useState<Barber | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CLICK' | 'PAYME'>('CASH');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<{start: string, end: string, status: string}[]>([]);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Reset selected date when closing modal
  useEffect(() => {
    if (!bookingBarber) {
      setSelectedDate(new Date());
    }
  }, [bookingBarber]);

  useEffect(() => {
    if (bookingBarber) {
      setIsSlotsLoading(true);
      // Format as YYYY-MM-DD using local time
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      
      api.get(`/barbers/availability/${bookingBarber.user_id}/slots?date=${dateStr}`)
        .then(res => setAvailableSlots(res.data.available_slots || []))
        .catch(err => console.error(err))
        .finally(() => setIsSlotsLoading(false));
    } else {
      setAvailableSlots([]);
      setSelectedSlot(null);
    }
  }, [bookingBarber, selectedDate]);

  // Fetch from API without mock fallback
  const loadBarbers = async () => {
    if (!locationLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/bookings/nearby', {
        params: {
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius: maxDistance,
          maxPrice: maxPrice,
          search: debouncedSearch,
          rank: selectedRank
        }
      });
      
      const mapped: Barber[] = data.map((b: any) => ({
        user_id: b.user_id,
        business_name: b.business_name,
        bio: b.bio || '',
        latitude: parseFloat(b.latitude),
        longitude: parseFloat(b.longitude),
        skills: b.skills || [],
        starting_price: parseFloat(b.base_price || 0),
        phone_number: '',
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(b.business_name)}&background=random&size=200`,
        ranking: {
          raw_score: parseFloat(b.raw_score || 0),
          rank_grade: b.rank_grade || 'C'
        },
        portfolio: [],
        distance_km: parseFloat((b.distance_meters / 1000).toFixed(1)),
        address: b.address || ''
      }));
      setBarbers(mapped);
      if (mapped.length > 0 && !activeBarberId) {
        setActiveBarberId(mapped[0].user_id);
      }
    } catch (err) {
      console.error('Failed to load barbers:', err);
      setError("Ma'lumotlarni yuklashda xatolik");
      setBarbers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBarbers();
  }, [maxDistance, maxPrice, debouncedSearch, selectedRank, locationLoaded, userLocation.lat, userLocation.lng]);

  // Frontend Sorting
  const sortedBarbers = useMemo(() => {
    return [...barbers].sort((a, b) => {
      if (sortBy === 'distance') return a.distance_km - b.distance_km;
      if (sortBy === 'rating') return b.ranking.raw_score - a.ranking.raw_score;
      if (sortBy === 'price') return a.starting_price - b.starting_price;
      return 0;
    });
  }, [barbers, sortBy]);

  // Trigger book reservation
  const handleBookSubmit = async () => {
    if (!selectedSlot || !bookingBarber) return;
    setIsBookingSubmitting(true);
    
    try {
      const [hour, minute] = selectedSlot.split(':').map(Number);
      const startTime = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hour, minute);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      await api.post('/bookings/create', {
        barber_id: bookingBarber.user_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        payment_method: paymentMethod
      });

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setBookingBarber(null);
        setSelectedSlot(null);
        router.push('/ticket');
      }, 2000);
    } catch (err: any) {
      console.error('Booking failed:', err);
      alert(err.response?.data?.message || 'Uchrashuvni belgilashda xatolik yuz berdi.');
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-text-primary to-primary bg-clip-text text-transparent">
            Sartaroshlar Xaritasi
          </h1>
          <p className="text-xs text-text-muted mt-1">Yunusobod bo'ylab yaqin atrofdagi eng sara ustalar</p>
        </div>

        {/* Quick Sort Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-surface/50 border border-border-glass">
          <button
            onClick={() => setSortBy('distance')}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
              sortBy === 'distance' ? "bg-primary text-white shadow-glow-purple" : "text-text-muted hover:text-text-primary"
            )}
          >
            Yaqin masofa
          </button>
          <button
            onClick={() => setSortBy('rating')}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
              sortBy === 'rating' ? "bg-primary text-white shadow-glow-purple" : "text-text-muted hover:text-text-primary"
            )}
          >
            Reyting
          </button>
          <button
            onClick={() => setSortBy('price')}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
              sortBy === 'price' ? "bg-primary text-white shadow-glow-purple" : "text-text-muted hover:text-text-primary"
            )}
          >
            Narx
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Sartarosh nomi yoki mahoratini qidiring..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-11 rounded-lg border border-border-glass bg-surface/55 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div className="glass-panel border border-border-glass rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between font-semibold text-text-muted">
                <span>Masofa radiusi:</span>
                <span className="text-primary">{maxDistance} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full accent-primary h-1 bg-border-glass rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between font-semibold text-text-muted">
                <span>Maksimal narx:</span>
                <span className="text-primary">{maxPrice.toLocaleString()} UZS</span>
              </div>
              <input
                type="range"
                min="30000"
                max="10000000"
                step="10000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary h-1 bg-border-glass rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-text-muted">Klass reytingi:</span>
              <div className="flex items-center gap-1.5">
                {['ALL', 'S', 'A', 'B', 'C'].map(rank => (
                  <button
                    key={rank}
                    onClick={() => setSelectedRank(rank)}
                    className={cn(
                      "flex-1 h-7 rounded text-[10px] font-bold border transition-all",
                      selectedRank === rank 
                        ? "bg-primary border-primary text-white shadow-glow-purple"
                        : "border-border-glass bg-surface/40 text-text-muted hover:text-text-primary"
                    )}
                  >
                    {rank}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List Results */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 gap-3 text-text-muted">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs font-semibold">Sartaroshlar ro'yxati yangilanmoqda...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-danger border border-dashed border-danger/30 rounded-xl gap-2 bg-danger/5">
                <AlertTriangle className="h-10 w-10 text-danger animate-pulse" />
                <span className="text-xs font-bold">{error}</span>
                <button onClick={loadBarbers} className="mt-2 px-4 py-2 bg-danger text-white rounded font-bold text-xs">Qaytadan urinish</button>
              </div>
            ) : sortedBarbers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted border border-dashed border-border-glass rounded-xl gap-2">
                <Compass className="h-10 w-10 text-primary animate-pulse" />
                <span className="text-sm font-bold text-text-primary">Sizga yaqin sartarosh topilmadi</span>
                <p className="text-xs max-w-xs mt-1">Filtr parametrlarini o'zgartirib qaytadan urinib ko'ring.</p>
              </div>
            ) : (
              sortedBarbers.map(barber => {
                const isSelected = activeBarberId === barber.user_id;
                const isSRank = barber.ranking.rank_grade === 'S';

                return (
                  <div
                    key={barber.user_id}
                    onClick={() => setActiveBarberId(barber.user_id)}
                    className={cn(
                      "glass-panel rounded-xl border p-4 text-left flex items-start gap-4 transition-all cursor-pointer relative overflow-hidden",
                      isSelected 
                        ? "border-primary bg-primary/5 shadow-glow-purple" 
                        : "border-border-glass hover:bg-border-glass/30 hover:scale-[1.01]"
                    )}
                  >
                    {isSRank && isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none"></div>
                    )}
                    <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 bg-border-glass border border-border-glass">
                      <img src={barber.avatar_url} alt={barber.business_name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-sm font-bold text-text-primary truncate">{barber.business_name}</h3>
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0",
                          barber.ranking.rank_grade === 'S' && "bg-gradient-to-r from-violet-600 to-primary text-white shadow-[0_0_8px_rgba(139,92,246,0.5)] border border-primary-glow animate-pulse",
                          barber.ranking.rank_grade === 'A' && "bg-blue-600/20 text-blue-400 border border-blue-500/25",
                          barber.ranking.rank_grade === 'B' && "bg-green-600/20 text-green-400 border border-green-500/25",
                          barber.ranking.rank_grade === 'C' && "bg-zinc-600/20 text-zinc-400 border border-zinc-500/25"
                        )}>
                          {barber.ranking.rank_grade}-Tier
                        </span>
                      </div>
                      <p className="text-[10px] text-text-muted line-clamp-2">{barber.bio}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-text-muted pt-1">
                        <div className="flex items-center text-warning font-bold">
                          <Star className="h-3 w-3 fill-warning mr-1 shrink-0" />
                          <span>{barber.ranking.raw_score}%</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1 shrink-0" />
                          <span className="truncate max-w-[120px]" title={barber.address}>{barber.address ? barber.address : `${barber.distance_km} km`}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center text-primary font-bold">
                          <Coins className="h-3 w-3 mr-1 shrink-0" />
                          <span>{barber.starting_price.toLocaleString()} UZS</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1.5">
                        {barber.skills.map(skill => (
                          <span key={skill} className="text-[8px] font-semibold bg-surface/60 border border-border-glass text-text-muted px-2 py-0.5 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col justify-between items-end h-full self-stretch shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setBookingBarber(barber);
                        }}
                        className="rounded bg-primary hover:bg-primary-hover p-1.5 text-white shadow-glow-purple transition-all duration-150"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                      <ChevronRight className="h-4 w-4 text-text-muted shrink-0 mt-auto" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel border border-border-glass rounded-2xl p-4 bg-surface/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="h-4 w-4 text-primary animate-pulse" />
                <span>Xarita</span>
              </span>
            </div>
            <div className="relative w-full aspect-square bg-black border border-border-glass rounded-xl overflow-hidden shadow-premium">
              <MapWrapper userLocation={userLocation} barbers={sortedBarbers} activeBarberId={activeBarberId} onBarberSelect={setActiveBarberId} />
            </div>
          </div>
        </div>
      </div>

      {bookingBarber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          {/* Booking Modal details omitted for brevity, but they stay exactly the same */}
          <div className="w-full max-w-md glass-panel border border-border-glass rounded-2xl p-6 space-y-6 relative">
            <button onClick={() => { setBookingBarber(null); setSelectedSlot(null); }} className="absolute top-4 right-4 text-text-muted hover:text-text-primary h-7 w-7 rounded-full bg-surface/50 border border-border-glass flex items-center justify-center transition-colors">
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-4 border-b border-border-glass pb-4">
              <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0 border border-border-glass bg-border-glass">
                <img src={bookingBarber.avatar_url} alt={bookingBarber.business_name} className="h-full w-full object-cover" />
              </div>
              <div>
                <span className="text-[8px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded uppercase tracking-wider">Sartaroshga Yozilish</span>
                <h3 className="text-base font-bold text-text-primary mt-1">{bookingBarber.business_name}</h3>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Sanani tanlang:</span>
              </label>
              <div className="flex gap-2">
                {[0, 1, 2].map((offset) => {
                  const d = new Date();
                  d.setDate(d.getDate() + offset);
                  const isSelected = selectedDate.getDate() === d.getDate() && selectedDate.getMonth() === d.getMonth();
                  const dayName = d.toLocaleDateString('uz-Latn-UZ', { weekday: 'short' });
                  const dateNum = d.getDate();
                  return (
                    <button 
                      key={offset}
                      onClick={() => setSelectedDate(d)}
                      className={cn(
                        "flex-1 py-2 flex flex-col items-center justify-center rounded-lg border transition-all",
                        isSelected ? "border-primary bg-primary/10 text-primary shadow-glow-purple" : "border-border-glass text-text-primary hover:bg-border-glass/40"
                      )}
                    >
                      <span className="text-[10px] font-bold uppercase">{dayName}</span>
                      <span className="text-sm font-black">{dateNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                <span>Bo'sh vaqtlardan birini tanlang:</span>
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {isSlotsLoading ? (
                  <div className="col-span-4 text-center py-4 text-text-muted text-xs">Vaqtlar yuklanmoqda...</div>
                ) : availableSlots.length > 0 ? (
                  availableSlots.map((slot) => {
                    const now = new Date();
                    const isToday = selectedDate.getDate() === now.getDate() && selectedDate.getMonth() === now.getMonth();
                    const [slotH] = slot.start.split(':').map(Number);
                    const isPast = isToday && (now.getHours() >= slotH);
                    const isBooked = slot.status === 'BOOKED' || isPast;

                    return (
                      <button 
                        key={slot.start} 
                        onClick={() => !isBooked && setSelectedSlot(slot.start)} 
                        disabled={isBooked}
                        className={cn(
                          "py-2.5 text-xs font-bold rounded-lg border text-center transition-all", 
                          selectedSlot === slot.start ? "border-primary bg-primary text-white shadow-glow-purple" 
                          : isBooked ? "border-danger bg-danger/10 text-danger opacity-50 cursor-not-allowed" 
                          : "border-success bg-success/10 text-success hover:bg-success/20 cursor-pointer"
                        )}
                      >
                        {slot.start}
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-4 text-center py-4 text-text-muted text-xs">Ushbu kunda bo'sh vaqtlar mavjud emas</div>
                )}
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-text-muted flex items-center gap-1.5"><Coins className="h-4 w-4 text-primary" /><span>To'lov turini tanlang:</span></label>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <button onClick={() => setPaymentMethod('CASH')} className={cn("py-2 rounded-lg border font-bold transition-all", paymentMethod === 'CASH' ? "bg-primary text-white border-primary" : "border-border-glass text-text-primary hover:bg-border-glass/40")}>Naqd</button>
                <button onClick={() => setPaymentMethod('CLICK')} className={cn("py-2 rounded-lg border font-bold transition-all", paymentMethod === 'CLICK' ? "bg-primary text-white border-primary" : "border-border-glass text-text-primary hover:bg-border-glass/40")}>Click</button>
                <button onClick={() => setPaymentMethod('PAYME')} className={cn("py-2 rounded-lg border font-bold transition-all", paymentMethod === 'PAYME' ? "bg-primary text-white border-primary" : "border-border-glass text-text-primary hover:bg-border-glass/40")}>Payme</button>
              </div>
            </div>
            <div className="p-3 bg-surface/50 border border-border-glass rounded-xl space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-text-muted">Xizmat haqi:</span><span className="font-bold text-text-primary">{bookingBarber.starting_price.toLocaleString()} UZS</span></div>
              <div className="flex justify-between border-t border-border-glass pt-2 font-bold text-sm"><span>Jami to'lov:</span><span className="text-primary">{bookingBarber.starting_price.toLocaleString()} UZS</span></div>
            </div>
            <div className="space-y-3">
              <button onClick={handleBookSubmit} disabled={!selectedSlot || isBookingSubmitting} className={cn("w-full flex items-center justify-center gap-2 rounded-lg py-3 text-xs font-bold text-white transition-all shadow-glow-purple", selectedSlot ? "bg-primary hover:bg-primary-hover active:scale-95 cursor-pointer" : "bg-surface border border-border-glass text-text-muted cursor-not-allowed")}>
                {isBookingSubmitting ? <><RefreshCw className="h-4 w-4 animate-spin text-white" /><span>Uchrashuv tasdiqlanmoqda...</span></> : <><Calendar className="h-4 w-4" /><span>Tasdiqlash</span></>}
              </button>
              <button onClick={() => { setBookingBarber(null); setSelectedSlot(null); }} className="w-full text-center py-2 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors">Orqaga qaytish</button>
            </div>
            {bookingSuccess && <div className="p-3 bg-success/15 border border-success/20 rounded-lg text-success text-xs font-semibold text-center animate-pulse">Uchrashuv muvaffaqiyatli rejalashtirildi! Yo'naltirilmoqdasiz...</div>}
          </div>
        </div>
      )}
    </div>
  );
}
