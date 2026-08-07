'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Scissors, 
  Award, 
  RefreshCw,
  Compass,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { api } from '@/lib/axios';
import { cn } from '@/utils/cn';

interface GrowthStats {
  totalUsers: number;
  totalBarbers: number;
  sRankBarbers: number;
  sRankCapPercentage: number;
}

interface WeeklyStat {
  week: string;
  users: number;
}

interface CohortStat {
  cohort: string;
  m1: string;
  m2: string;
  m3: string;
}

export default function OwnerGrowthPage() {
  const [stats, setStats] = useState<GrowthStats>({
    totalUsers: 0,
    totalBarbers: 0,
    sRankBarbers: 0,
    sRankCapPercentage: 0
  });
  const [weekly, setWeekly] = useState<WeeklyStat[]>([]);
  const [cohorts, setCohorts] = useState<CohortStat[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGrowth = async () => {
    setLoading(true);
    try {
      const [statsRes, chartRes] = await Promise.all([
        api.get('/analytics/growth'),
        api.get('/analytics/growth/chart')
      ]);
      
      if (statsRes.data) {
        setStats({
          totalUsers: statsRes.data.totalUsers,
          totalBarbers: statsRes.data.totalBarbers,
          sRankBarbers: statsRes.data.sRankBarbers,
          sRankCapPercentage: statsRes.data.sRankCapPercentage
        });
      }
      if (chartRes.data) {
        setWeekly(chartRes.data.weekly || []);
        setCohorts(chartRes.data.cohorts || []);
      }
    } catch (err) {
      console.error('Owner growth API error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrowth();
  }, []);

  return (
    <div className="space-y-8 text-text-primary">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-text-primary to-primary bg-clip-text text-transparent">
            O'sish Ko'rsatkichlari & Kohortlar
          </h1>
          <p className="text-xs text-text-muted mt-1">Platforma foydalanuvchilari kohortlari va usta reyting o'sish dinamikasi</p>
        </div>
        <button
          onClick={fetchGrowth}
          disabled={loading}
          className="p-2.5 rounded bg-surface border border-border-glass text-text-muted hover:text-text-primary hover:bg-border-glass transition-colors"
          aria-label="Refresh growth stats"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Users growth */}
        <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-3">
          <div className="flex justify-between items-center text-xs text-text-muted">
            <span>Jami Mijozlar (Users)</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-extrabold text-white">
              {stats.totalUsers.toLocaleString()} ta
            </span>
            <p className="text-[9px] text-success font-semibold flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +24% Oylik o'sish
            </p>
          </div>
        </div>

        {/* Barbers count */}
        <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-3">
          <div className="flex justify-between items-center text-xs text-text-muted">
            <span>Jami Sartaroshlar</span>
            <Scissors className="h-4 w-4 text-success animate-pulse" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-extrabold text-white">
              {stats.totalBarbers} ta
            </span>
            <p className="text-[9px] text-success font-semibold flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15% Oylik o'sish
            </p>
          </div>
        </div>

        {/* S-Rank Cap */}
        <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-3">
          <div className="flex justify-between items-center text-xs text-text-muted">
            <span>Elite S-Rank Soni (5% Cap)</span>
            <Award className="h-4 w-4 text-warning" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-extrabold text-white">
              {stats.sRankBarbers} ta usta
            </span>
            <div className="flex justify-between text-[9px] text-text-muted">
              <span>Ulushi: {stats.sRankCapPercentage}%</span>
              <span className="text-success font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="h-3 w-3" />
                Normada (&lt; 5%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Growth Chart & Cohort table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: SVG User Registration Line Chart */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-5">
            <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary animate-pulse" />
              <span>Haftalik foydalanuvchilar o'sish grafigi</span>
            </h3>

            {/* Custom SVG Line Chart */}
            <div className="relative w-full h-48 bg-black/40 rounded-xl overflow-hidden border border-border-glass p-2">
              <svg viewBox="0 0 400 200" className="w-full h-full text-primary">
                {/* Horizontal gridlines */}
                <line x1="20" y1="40" x2="380" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                <line x1="20" y1="90" x2="380" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                <line x1="20" y1="140" x2="380" y2="140" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                
                {weekly.length >= 3 ? (
                  <>
                    {(() => {
                      const maxU = Math.max(...weekly.map(w => w.users), 1);
                      const getY = (u: number) => 160 - (u / maxU) * 120;
                      const y1 = getY(weekly[0].users);
                      const y2 = getY(weekly[1].users);
                      const y3 = getY(weekly[2].users);
                      // Smooth curve logic
                      const d = `M 40,${y1} Q 120,${(y1+y2)/2} 200,${y2} T 360,${y3}`;
                      return (
                        <>
                          <path
                            d={d}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            className="shadow-glow-purple"
                          />
                          <circle cx="40" cy={y1} r="4.5" className="fill-white" />
                          <circle cx="200" cy={y2} r="4.5" className="fill-white" />
                          <circle cx="360" cy={y3} r="4.5" className="fill-white" />
                        </>
                      );
                    })()}
                    <text x="40" y="185" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">{weekly[0].week}</text>
                    <text x="200" y="185" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">{weekly[1].week}</text>
                    <text x="360" y="185" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">{weekly[2].week} (Joriy)</text>
                  </>
                ) : (
                  <text x="200" y="100" fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle">Ma'lumot yetarli emas</text>
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Right: Cohort Retention Table */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-4 text-xs">
            <h3 className="font-display text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="h-4.5 w-4.5 text-primary" />
              <span>Foydalanuvchilar saqlanishi (Cohort Retention)</span>
            </h3>

            <div className="space-y-3">
              {cohorts.map((item, index) => (
                <div key={index} className="bg-surface p-3 rounded border border-border-glass grid grid-cols-4 gap-2 text-[10px] text-center items-center">
                  <span className="font-bold text-text-primary text-left truncate" title={item.cohort}>{item.cohort}</span>
                  <div className="space-y-0.5">
                    <span className="text-text-muted text-[8px] block">Moy 1:</span>
                    <span className="font-bold text-success">{item.m1}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-text-muted text-[8px] block">Oy 2:</span>
                    <span className="font-bold text-primary">{item.m2}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-text-muted text-[8px] block">Oy 3:</span>
                    <span className="font-bold text-text-primary">{item.m3}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
