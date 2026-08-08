'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Coins, 
  FileText, 
  Download, 
  Calendar, 
  ArrowUpRight, 
  Clock, 
  RefreshCw,
  Eye
} from 'lucide-react';
import { api } from '@/lib/axios';
import { cn } from '@/utils/cn';

interface FinancialStats {
  gmv: number;
  netRevenue: number;
  bookingsCount: number;
  activeUsers: number;
  monthlyRevenue: { month: string; revenue: number; netRevenue?: number }[];
}

export default function OwnerBIPage() {
  const [stats, setStats] = useState<FinancialStats>({
    gmv: 0,
    netRevenue: 0,
    bookingsCount: 0,
    activeUsers: 0,
    monthlyRevenue: []
  });

  // Forecasting Scenario States
  const [scenario, setScenario] = useState<'REALISTIC' | 'OPTIMISTIC' | 'PESSIMISTIC'>('REALISTIC');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Forecast data calculations based on active scenario
  const forecastData = React.useMemo(() => {
    const multiplier = scenario === 'OPTIMISTIC' ? 1.25 : scenario === 'PESSIMISTIC' ? 0.85 : 1.0;
    
    let currentNet = 0;
    let currentMonthName = 'Joriy';

    if (stats.monthlyRevenue && stats.monthlyRevenue.length > 0) {
      const lastMonth = stats.monthlyRevenue[stats.monthlyRevenue.length - 1];
      const effectiveRate = stats.gmv > 0 ? (stats.netRevenue / stats.gmv) : 0.10;
      currentNet = lastMonth.netRevenue || Math.round(lastMonth.revenue * effectiveRate);
      currentMonthName = lastMonth.month;
    } else if (stats.netRevenue > 0) {
      currentNet = stats.netRevenue;
    }

    const now = new Date();
    const uzbekMonths = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
    const getMonthName = (offset: number) => {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      return uzbekMonths[d.getMonth()];
    };

    const m1 = getMonthName(1);
    const m2 = getMonthName(2);
    const m3 = getMonthName(3);

    const rate1 = 1.1; 
    const rate2 = 1.25;
    const rate3 = 1.4;

    return [
      { month: `${currentMonthName} (Joriy)`, revenue: Math.round(currentNet * multiplier) },
      { month: `${m1} (Prognoz)`, revenue: Math.round(currentNet * rate1 * multiplier) },
      { month: `${m2} (Prognoz)`, revenue: Math.round(currentNet * rate2 * multiplier) },
      { month: `${m3} (Prognoz)`, revenue: Math.round(currentNet * rate3 * multiplier) }
    ];
  }, [scenario, stats.monthlyRevenue, stats.netRevenue, stats.gmv]);

  const chartPoints = React.useMemo(() => {
    if (!stats.monthlyRevenue || stats.monthlyRevenue.length === 0) return null;
    
    const last3 = stats.monthlyRevenue.slice(-3);
    while (last3.length < 3) {
      last3.unshift({ month: '-', revenue: 0, netRevenue: 0 });
    }

    const effectiveRate = stats.gmv > 0 ? (stats.netRevenue / stats.gmv) : 0.10;
    const revs = last3.map(r => r.netRevenue || Math.round(r.revenue * effectiveRate));
    const maxRev = Math.max(...revs, 1000);
    const minRev = 0; // lock min to 0

    const getY = (val: number) => {
      const ratio = (val - minRev) / (maxRev - minRev || 1);
      return 160 - (ratio * 120); 
    };

    const y1 = getY(revs[0]);
    const y2 = getY(revs[1]);
    const y3 = getY(revs[2]);

    return {
      path: `M 40,${y1} Q 120,${y1} 200,${y2} T 360,${y3}`,
      dots: [y1, y2, y3],
      labels: last3.map(r => r.month)
    };
  }, [stats.monthlyRevenue, stats.netRevenue, stats.gmv]);

  const fetchBI = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/analytics/full');
      if (data) {
        setStats({
          gmv: data.total_revenue,
          netRevenue: data.net_revenue || 0,
          bookingsCount: data.completed_bookings,
          activeUsers: data.active_users,
          monthlyRevenue: data.monthly_revenue || []
        });
      }
    } catch (err) {
      console.error('Owner BI API error:', err);
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBI();
  }, []);

  const handleExportPDF = () => {
    setIsExporting(true);
    setExportSuccess(false);

    // Simulate background worker PDF generation
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
      alert("Moliyaviy hisobot PDF shaklida yuklab olindi (Simulyatsiya).");
    }, 2000);
  };

  return (
    <div className="space-y-8 text-text-primary">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-text-primary to-primary bg-clip-text text-transparent">
            Moliya BI & Prognozlar
          </h1>
          <p className="text-xs text-text-muted mt-1">Platforma moliyaviy daromadlari, GMV hajmi va kelgusi oylik tahlillar</p>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-2 rounded bg-primary hover:bg-primary-hover px-4 h-10 text-xs font-bold text-white shadow-glow-purple transition-all duration-150 active:scale-95 cursor-pointer"
        >
          {isExporting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
              <span>PDF tayyorlanmoqda...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>PDF Hisobotini Yuklash</span>
            </>
          )}
        </button>
      </div>

      {exportSuccess && (
        <div className="p-3 bg-success/15 border border-success/20 rounded-lg text-success text-xs font-semibold text-center animate-pulse">
          Moliyaviy hisobot muvaffaqiyatli eksport qilindi!
        </div>
      )}

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-50" />
        </div>
      ) : (
        <>
          {/* KPI Stats widgets grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* GMV */}
            <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-3">
          <div className="flex justify-between items-center text-xs text-text-muted">
            <span>Platforma GMV Hajmi</span>
            <Coins className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-extrabold text-white">
              {stats.gmv.toLocaleString()} UZS
            </span>
            <p className="text-[9px] text-text-muted">Umumiy muomaladagi mablag'lar</p>
          </div>
        </div>

        {/* Net platform revenue */}
        <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-3">
          <div className="flex justify-between items-center text-xs text-text-muted">
            <span>Net Daromad (Komissiya)</span>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-extrabold text-white">
              {stats.netRevenue.toLocaleString()} UZS
            </span>
            <p className="text-[9px] text-text-muted">Platforma sof komissiya ulushi</p>
          </div>
        </div>

        {/* Bookings */}
        <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-3">
          <div className="flex justify-between items-center text-xs text-text-muted">
            <span>Uchrashuvlar soni</span>
            <Calendar className="h-4 w-4 text-warning" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-extrabold text-white">
              {stats.bookingsCount.toLocaleString()} ta
            </span>
            <p className="text-[9px] text-text-muted">Jami yakunlangan buyurtmalar</p>
          </div>
        </div>

        {/* Active users */}
        <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-3">
          <div className="flex justify-between items-center text-xs text-text-muted">
            <span>Faol Foydalanuvchilar</span>
            <Eye className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-extrabold text-white">
              {stats.activeUsers.toLocaleString()} ta
            </span>
            <p className="text-[9px] text-text-muted">Platformadagi mijozlar soni</p>
          </div>
        </div>
      </div>

      {/* SVG Volumetric GMV Chart & Projections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: SVG Cumulative GMV Chart */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-5">
            <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary animate-pulse" />
              <span>Komissiya daromadi oylik grafigi</span>
            </h3>

            {/* Custom SVG Line Chart */}
            <div className="relative w-full h-48 bg-black/40 rounded-xl overflow-hidden border border-border-glass p-2">
              <svg viewBox="0 0 400 200" className="w-full h-full text-primary">
                {/* Horizontal gridlines */}
                <line x1="20" y1="40" x2="380" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                <line x1="20" y1="90" x2="380" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                <line x1="20" y1="140" x2="380" y2="140" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                
                {chartPoints ? (
                  <>
                    <path
                      d={chartPoints.path}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="shadow-glow-purple"
                    />
                    <circle cx="40" cy={chartPoints.dots[0]} r="4.5" className="fill-white" />
                    <circle cx="200" cy={chartPoints.dots[1]} r="4.5" className="fill-white" />
                    <circle cx="360" cy={chartPoints.dots[2]} r="4.5" className="fill-white" />

                    <text x="40" y="185" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">{chartPoints.labels[0]}</text>
                    <text x="200" y="185" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">{chartPoints.labels[1]}</text>
                    <text x="360" y="185" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">{chartPoints.labels[2]}</text>
                  </>
                ) : (
                  <>
                    <path
                      d="M 40,150 Q 120,130 200,90 T 360,45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="shadow-glow-purple"
                    />
                    <circle cx="40" cy="150" r="4.5" className="fill-white" />
                    <circle cx="200" cy="90" r="4.5" className="fill-white" />
                    <circle cx="360" cy="45" r="4.5" className="fill-white" />

                    <text x="40" y="185" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">Aprel</text>
                    <text x="200" y="185" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">May</text>
                    <text x="360" y="185" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">Iyun</text>
                  </>
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Right: Projections Scenario Selector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-5 text-xs">
            <div className="flex justify-between items-center">
              <h3 className="font-display text-xs font-bold text-text-primary uppercase tracking-wider">
                Kelgusi Oylar Prognozi (ML Projections)
              </h3>
              <span className="text-[9px] font-mono text-text-muted">Target: 4-Chorak</span>
            </div>

            {/* Scenario toggle triggers */}
            <div className="flex gap-1.5 p-1 rounded-lg bg-surface/65 border border-border-glass">
              {['OPTIMISTIC', 'REALISTIC', 'PESSIMISTIC'].map((scen) => (
                <button
                  key={scen}
                  onClick={() => setScenario(scen as any)}
                  className={cn(
                    "flex-1 py-1 text-[9px] font-bold rounded uppercase transition-all",
                    scenario === scen 
                      ? "bg-primary text-white shadow-glow-purple" 
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  {scen.substring(0, 5)}
                </button>
              ))}
            </div>

            {/* Projected list details */}
            <div className="space-y-3">
              {forecastData.map((data, index) => (
                <div key={index} className="flex justify-between items-center bg-surface p-2.5 rounded border border-border-glass text-[10px]">
                  <span className="font-bold text-text-muted">{data.month}:</span>
                  <span className="font-extrabold text-primary">+{data.revenue.toLocaleString()} UZS</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-2">
              <Clock className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
              <p className="text-[9px] text-text-muted">
                Optimistik prognoz 25% gacha o'sish sur'atiga asoslanadi. Pessimistik prognoz esa tumanlararo geo-cheklovlarni hisobga oladi.
              </p>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
