'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Clock, 
  UserCheck, 
  FolderCheck, 
  Server, 
  TrendingUp, 
  Cpu, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/axios';
import { cn } from '@/utils/cn';

interface StatsOverview {
  activeDisputes: number;
  avgResolveMinutes: number;
  verifiedToday: number;
  totalModeratedToday: number;
  cpuLoad: number;
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<StatsOverview>({
    activeDisputes: 0,
    avgResolveMinutes: 0,
    verifiedToday: 0,
    totalModeratedToday: 0,
    cpuLoad: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/stats');
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Admin stats API error:', err);
      setError("Statistikani yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 text-text-primary">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-text-primary to-primary bg-clip-text text-transparent">
            Tizim Operatsiyalari Stats
          </h1>
          <p className="text-xs text-text-muted mt-1">Platforma moderatsiya va triage KPI ko'rsatkichlari tahlili</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="p-2.5 rounded bg-surface border border-border-glass text-text-muted hover:text-text-primary hover:bg-border-glass transition-colors"
          aria-label="Refresh stats"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm text-center">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-3">
          <div className="flex justify-between items-center text-xs text-text-muted">
            <span>Faol Nizolar (Triage)</span>
            <Clock className="h-4 w-4 text-danger animate-pulse" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-extrabold text-white">{stats.activeDisputes} ta</span>
            <p className="text-[9px] text-text-muted">Hal qilinishi kutilmoqda</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-3">
          <div className="flex justify-between items-center text-xs text-text-muted">
            <span>SLA O'rtacha Vaqti</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-extrabold text-white">{stats.avgResolveMinutes} minut</span>
            <p className="text-[9px] text-text-muted">Nizolarni hal etish tezligi</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-3">
          <div className="flex justify-between items-center text-xs text-text-muted">
            <span>Bugun Tasdiqlandi</span>
            <UserCheck className="h-4 w-4 text-success" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-extrabold text-white">+{stats.verifiedToday} ta</span>
            <p className="text-[9px] text-text-muted">Yangi usta arizalari yopildi</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-3">
          <div className="flex justify-between items-center text-xs text-text-muted">
            <span>Moderatsiyalangan kontent</span>
            <FolderCheck className="h-4 w-4 text-warning" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-extrabold text-white">{stats.totalModeratedToday} ta</span>
            <p className="text-[9px] text-text-muted">Ular orasida rasm va matnlar</p>
          </div>
        </div>
      </div>

      {/* Server & Operations logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* System Load */}
        <div className="lg:col-span-6 glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-4 text-xs">
          <h3 className="font-display font-bold text-text-primary flex items-center gap-2">
            <Server className="h-4 w-4 text-primary animate-pulse" />
            <span>Operatsion tizim resurslari yuklanishi</span>
          </h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-text-muted font-bold">
                <span>CPU Yuklanishi (Triage Processors):</span>
                <span>{stats.cpuLoad}%</span>
              </div>
              <div className="h-2 w-full bg-border-base rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${stats.cpuLoad}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-text-muted font-bold">
                <span>FastAPI AI Model GPU Memory Load:</span>
                <span>72%</span>
              </div>
              <div className="h-2 w-full bg-border-base rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-600 to-primary transition-all duration-300"
                  style={{ width: `72%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Server status log */}
        <div className="lg:col-span-6 glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-3 font-mono text-[9px] text-text-muted h-40 overflow-y-auto">
          <div className="flex items-center gap-1.5 text-primary">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            <span>[10:48:02] - API gateway reverse proxy health status: OK</span>
          </div>
          <div className="flex items-center gap-1.5 text-primary">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            <span>[10:47:15] - BLPOP Reputation background queue running: Idle</span>
          </div>
          <div className="flex items-center gap-1.5 text-primary">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            <span>[10:46:50] - MongoDB dossiers schemas collections: Synced</span>
          </div>
          <div className="flex items-center gap-1.5 text-warning">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>[10:45:10] - Redis rate-limit: blocked IP (192.168.1.144) for exceeding bounds</span>
          </div>
        </div>

      </div>
    </div>
  );
}
// Helper component for standard notification check
const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
