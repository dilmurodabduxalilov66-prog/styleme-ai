'use client';

import React, { useState } from 'react';
import { 
  Award, 
  Star, 
  Award as AwardIcon, 
  CheckCircle2, 
  TrendingUp, 
  ShieldAlert, 
  ChevronRight, 
  MessageSquare,
  ThumbsUp,
  RefreshCw
} from 'lucide-react';
import { api } from '@/lib/axios';
import { cn } from '@/utils/cn';

interface CustomerReview {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

export default function BarberReputationPage() {
  const [grade, setGrade] = useState<'S' | 'A' | 'B' | 'C'>('C');
  const [rawScore, setRawScore] = useState(0.0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [cancellationRate, setCancellationRate] = useState(0.0);

  // Recent reviews list
  const [reviews, setReviews] = useState<CustomerReview[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Recalculating score loader states
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalcSuccess, setRecalcSuccess] = useState(false);

  // Fetch Reputation Status
  React.useEffect(() => {
    const fetchStatus = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get('/reputation/status');
        if (data?.ranking) {
          setGrade(data.ranking.grade as any);
          setRawScore(data.ranking.rawScore);
          setTotalBookings(data.ranking.totalBookings);
          setCancellationRate(data.ranking.cancellationRate);
        }
        if (data?.reviews) {
          setReviews(data.reviews);
        }
      } catch (err) {
        console.error('Failed to fetch reputation data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, []);

  // Trigger Bayesian score recalculation
  const handleRecalculate = async () => {
    setIsRecalculating(true);
    setRecalcSuccess(false);

    try {
      // API call to reputation service recalculate gateway
      await api.post('/reputation/recalculate');

        setTimeout(() => {
          setIsRecalculating(false);
          setRecalcSuccess(true);
          setTimeout(() => setRecalcSuccess(false), 2000);
          // Refetch to get updated scores
          api.get('/reputation/status').then(({ data }) => {
            if (data?.ranking) {
               setGrade(data.ranking.grade as any);
               setRawScore(data.ranking.rawScore);
               setTotalBookings(data.ranking.totalBookings);
               setCancellationRate(data.ranking.cancellationRate);
            }
          });
        }, 1500);
      } catch (err) {
        console.warn('Reputation recalculate API failed:', err);
        setTimeout(() => {
          setIsRecalculating(false);
        }, 1000);
      }
  };

  return (
    <div className="space-y-8 text-text-primary">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-text-primary to-primary bg-clip-text text-transparent">
            Reyting & Mijoz Fikrlari
          </h1>
          <p className="text-xs text-text-muted mt-1">Bayesian formulalari asosidagi darajangiz va reyting tahlili</p>
        </div>

        <button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          className="flex items-center gap-2 rounded bg-primary hover:bg-primary-hover px-4 h-10 text-xs font-bold text-white shadow-glow-purple transition-all duration-150 active:scale-95 cursor-pointer"
        >
          {isRecalculating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
              <span>Qayta hisoblanmoqda...</span>
            </>
          ) : (
            <>
              <Award className="h-4 w-4" />
              <span>Reytingni yangilash</span>
            </>
          )}
        </button>
      </div>

      {recalcSuccess && (
        <div className="p-3 bg-success/15 border border-success/20 rounded-lg text-success text-xs font-semibold text-center animate-pulse flex items-center justify-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          <span>Reytingingiz muvaffaqiyatli qayta hisoblandi va yangilandi!</span>
        </div>
      )}

      {/* Grid panels */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
           <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
           <p className="text-text-muted text-sm">Reyting hisoblanmoqda...</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Bayesian Rank progress metrics */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-panel border border-border-glass rounded-2xl p-6 bg-surface/50 space-y-6">
            <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
              <AwardIcon className="h-4 w-4 text-primary animate-pulse" />
              <span>Reyting daraja tahlili (Bayesian Rank)</span>
            </h3>

            {/* Visual Rank Grade Badge */}
            <div className="flex items-center justify-between p-4 bg-black/40 border border-border-glass rounded-xl gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-text-muted font-bold uppercase">Sizning Hozirgi Darajangiz:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-primary shadow-glow-purple uppercase">{grade}-Grade</span>
                  <span className="text-xs font-semibold text-success">
                    {grade === 'S' && '(Top 5% Usta)'}
                    {grade === 'A' && '(Yuqori Daraja)'}
                    {grade === 'B' && '(Yaxshi Daraja)'}
                    {grade === 'C' && '(Boshlang\'ich)'}
                  </span>
                </div>
              </div>
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-violet-600 to-primary text-white shadow-[0_0_12px_rgba(139,92,246,0.6)] flex items-center justify-center font-display text-2xl font-extrabold border border-primary-glow animate-pulse">
                {grade}
              </div>
            </div>

            {/* Statistics gauges */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-surface p-3 rounded border border-border-glass space-y-1">
                <span className="text-text-muted text-[9px] block">Reyting Bahosi:</span>
                <span className="text-base font-extrabold text-white">{rawScore}%</span>
              </div>
              <div className="bg-surface p-3 rounded border border-border-glass space-y-1">
                <span className="text-text-muted text-[9px] block">Barcha Bronlar:</span>
                <span className="text-base font-extrabold text-white">{totalBookings} ta</span>
              </div>
              <div className="bg-surface p-3 rounded border border-border-glass space-y-1">
                <span className="text-text-muted text-[9px] block">Bekor qilishlar:</span>
                <span className="text-base font-extrabold text-danger">{cancellationRate}%</span>
              </div>
            </div>

            {/* Threshold limits bar */}
            <div className="space-y-2.5 pt-2 border-t border-border-glass text-xs">
              <div className="flex justify-between font-semibold text-text-muted">
                <span>S-Rank darajasini saqlab qolish:</span>
                <span className="text-primary">{totalBookings}/150 uchrashuv</span>
              </div>
              <div className="h-2 w-full bg-border-base rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-600 to-primary transition-all duration-300"
                  style={{ width: `${Math.min(100, (totalBookings / 150) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[9px] text-text-muted">
                <span>Minimal: 150 uchrashuv</span>
                <span className="text-success font-semibold">Bajarildi</span>
              </div>
            </div>

            {/* Commission discounts info block */}
            <div className="p-3.5 bg-success/10 border border-success/20 rounded-xl flex items-start gap-3 text-xs">
              <ThumbsUp className="h-4.5 w-4.5 text-success shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-success">Komissiya imtiyozlari faol!</h4>
                <p className="text-[10px] text-text-muted">
                  Sizning S-Rank darajangiz uchun platforma komissiya stavkasi 10% dan 5% ga tushirilgan. 
                  Bu sizga har bir uchrashuvdan qo'shimcha 5% sof foyda keltirmoqda.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Right: Customer Reviews Timeline feed */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-panel border border-border-glass rounded-2xl p-6 bg-surface/50 space-y-4">
            <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>Mijozlar tomonidan qoldirilgan fikrlar</span>
            </h3>

            {/* Reviews Feed list */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {reviews.length > 0 ? reviews.map(rev => (
                <div key={rev.id} className="bg-surface/60 p-3.5 rounded-xl border border-border-glass space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                        {rev.name.charAt(0)}
                      </div>
                      <span className="font-bold text-text-primary">{rev.name}</span>
                    </div>
                    
                    {/* Stars row */}
                    <div className="flex items-center gap-0.5 text-warning">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={cn(
                            "h-3 w-3",
                            i < rev.rating ? "fill-warning" : "text-text-muted"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-[10px] text-text-muted leading-relaxed font-sans">"{rev.comment}"</p>
                  
                  <div className="text-[8px] text-text-muted text-right">
                    {rev.date}
                  </div>
                </div>
              )) : (
                <div className="p-4 text-center text-text-muted text-xs">
                  Hozircha mijozlar tomonidan qoldirilgan fikrlar yo'q.
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
      )}
    </div>
  );
}
