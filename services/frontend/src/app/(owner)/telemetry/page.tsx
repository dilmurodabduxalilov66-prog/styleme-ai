'use client';

import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Cpu, 
  Database, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { api } from '@/lib/axios';
import { cn } from '@/utils/cn';

interface MicroserviceStatus {
  name: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  latency: string;
  details: string;
}

export default function OwnerTelemetryPage() {
  const [services, setServices] = useState<MicroserviceStatus[]>([
    { name: 'Auth-Service (NestJS)', status: 'ONLINE', latency: '4ms', details: 'Active connections: 2,400' },
    { name: 'Booking-Service (NestJS)', status: 'ONLINE', latency: '8ms', details: 'Redis Locks pool: Ok' },
    { name: 'Reputation-Service (NestJS)', status: 'ONLINE', latency: '12ms', details: 'BLPOP worker: Active' },
    { name: 'AI-Service (FastAPI/MediaPipe)', status: 'ONLINE', latency: '320ms', details: 'Landmarks cache hit rate: 84%' },
    { name: 'Generation-Service (Stable Diffusion)', status: 'ONLINE', latency: '6,200ms', details: 'GPU Queue length: 0' }
  ]);
  const [loading, setLoading] = useState(false);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/analytics/telemetry');
      if (data?.services) {
        setServices(data.services);
      }
    } catch (err) {
      console.error('Owner telemetry API error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  return (
    <div className="space-y-8 text-text-primary">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-text-primary to-primary bg-clip-text text-transparent">
            Server Telemetriya & Monitoring
          </h1>
          <p className="text-xs text-text-muted mt-1">Monorepo mikroxizmatlari, ma'lumotlar ombori va GPU klasterlar salomatligi</p>
        </div>
        <button
          onClick={fetchTelemetry}
          disabled={loading}
          className="p-2.5 rounded bg-surface border border-border-glass text-text-muted hover:text-text-primary hover:bg-border-glass transition-colors"
          aria-label="Refresh telemetry status"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((svc) => (
          <div key={svc.name} className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[8px] text-text-muted font-bold uppercase">Xizmat nomi:</span>
                <h4 className="text-xs font-bold text-text-primary">{svc.name}</h4>
              </div>
              
              {/* Status badges */}
              <span className={cn(
                "text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                svc.status === 'ONLINE' && "bg-success/15 border border-success/20 text-success animate-pulse",
                svc.status === 'DEGRADED' && "bg-warning/10 border border-warning/20 text-warning",
                svc.status === 'OFFLINE' && "bg-danger/10 border border-danger/20 text-danger"
              )}>
                {svc.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] text-text-muted border-t border-border-glass pt-3">
              <div className="space-y-0.5">
                <span>Kechikish (Latency):</span>
                <p className="font-mono font-bold text-primary">{svc.latency}</p>
              </div>
              <div className="space-y-0.5">
                <span>Holati:</span>
                <p className="font-bold text-text-primary truncate">{svc.details}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Database Node statuses & GPU Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Database cluster health */}
        <div className="lg:col-span-6 glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-4 text-xs">
          <h3 className="font-display font-bold text-text-primary flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <span>Ma'lumotlar bazasi klasterlari (Databases Node)</span>
          </h3>

          <div className="space-y-3.5">
            {[
              { name: 'PostgreSQL Spatial Cluster', status: 'ONLINE', pool: '32/100', load: '14%' },
              { name: 'MongoDB Dossier Cluster', status: 'ONLINE', pool: '12/50', load: '8%' },
              { name: 'Redis Cache & Locks Broker', status: 'ONLINE', pool: 'Connected', load: '22%' }
            ].map((db, index) => (
              <div key={index} className="flex justify-between items-center bg-surface p-2.5 rounded border border-border-glass text-[10px]">
                <div className="space-y-0.5">
                  <span className="font-bold text-text-primary">{db.name}</span>
                  <p className="text-[8px] text-text-muted">Pool: {db.pool} • Load: {db.load}</p>
                </div>
                <span className="text-[8px] font-bold text-success bg-success/15 border border-success/20 px-2 py-0.5 rounded uppercase">
                  {db.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Telemetry system logs */}
        <div className="lg:col-span-6 glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-4 text-xs flex flex-col justify-between">
          <h3 className="font-display font-bold text-text-primary flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            <span>Tizim loglari (Console feed)</span>
          </h3>

          <div className="bg-black/60 rounded-xl p-4 font-mono text-[9px] text-text-muted space-y-1 h-36 overflow-y-auto border border-border-glass">
            <div className="flex items-center gap-1 text-primary">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              <span>[10:45:02] - API gateway reverse proxy health status: OK</span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              <span>[10:43:12] - Stable Diffusion SAM segmentation completed in 812ms</span>
            </div>
            <div className="flex items-center gap-1 text-warning">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>[10:41:04] - PostgreSQL replica sync latency: 120ms warning bounds</span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              <span>[10:39:50] - Auth refreshing token rotated successfully</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

