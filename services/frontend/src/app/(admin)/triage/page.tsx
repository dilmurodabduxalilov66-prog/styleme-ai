'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  Check, 
  X, 
  AlertCircle, 
  ArrowRight, 
  Search, 
  User,
  Scissors,
  Coins,
  RefreshCw
} from 'lucide-react';
import { api } from '@/lib/axios';
import { cn } from '@/utils/cn';

interface Complaint {
  id: string;
  clientName: string;
  barberName: string;
  bookingTime: string;
  reason: string;
  details: string;
  slaHoursLeft: number;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  amount: string;
}

export default function AdminTriagePage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState(false);

  // Active selected ticket
  const selectedTicket = activeId ? complaints.find(c => c.id === activeId) : null;

  const fetchTriage = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/triage');
      if (data?.complaints) {
        setComplaints(data.complaints);
        if (data.complaints.length > 0) setActiveId(data.complaints[0].id);
      }
    } catch (err) {
      console.error('Admin triage API error:', err);
      setError("Shikoyatlarni yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriage();
  }, []);

  // Filter complaints
  const filtered = complaints.filter(c => 
    c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.barberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: Pending first, then by SLA hours left
  const sortedComplaints = [...filtered].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'PENDING' ? -1 : 1;
    }
    return a.slaHoursLeft - b.slaHoursLeft;
  });

  // Action: Refund client
  const handleResolveAction = async (id: string, actionType: 'REFUND' | 'DISMISS' | 'WARN_BARBER') => {
    try {
      await api.post(`/admin/triage/${id}/resolve`, { action: actionType });

      setComplaints(complaints.map(c => 
        c.id === id 
          ? { ...c, status: actionType === 'DISMISS' ? 'DISMISSED' : 'RESOLVED' } 
          : c
      ));
      setActionSuccess(true);
      setTimeout(() => setActionSuccess(false), 2000);

    } catch (err) {
      console.error('Admin triage resolve API error:', err);
      setError("Shikoyatni yopishda xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="space-y-8 text-text-primary">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-text-primary to-primary bg-clip-text text-transparent">
          Triage Shikoyatlar Qutisi
        </h1>
        <p className="text-xs text-text-muted mt-1">Mijozlar nizolari, xizmat ko'rsatish shikoyatlari va SLA nazorati</p>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-success/15 border border-success/20 rounded-lg text-success text-xs font-semibold text-center animate-pulse">
          Qaroringiz qabul qilindi. Mijozga push-xabar yuborildi.
        </div>
      )}

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm text-center">
          {error}
        </div>
      )}

      {/* Split pane viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Complaints support queue list */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center gap-3 bg-surface/40 p-1 rounded-lg border border-border-glass">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="Mijoz, usta yoki sabab bo'yicha qidiruv..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 h-9 rounded bg-surface border border-border-glass text-xs placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>
            <button
              onClick={fetchTriage}
              className="p-2 bg-surface hover:bg-border-glass border border-border-glass rounded text-text-muted hover:text-text-primary"
              aria-label="Refresh list"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : sortedComplaints.length === 0 ? (
              <div className="text-center py-12 text-xs text-text-muted italic border border-dashed border-border-glass rounded-xl">
                Triage qutisida shikoyatlar topilmadi.
              </div>
            ) : (
              sortedComplaints.map(ticket => {
                const isPending = ticket.status === 'PENDING';
                const isCritical = ticket.slaHoursLeft < 2 && isPending;
                const isWarning = ticket.slaHoursLeft < 4 && ticket.slaHoursLeft >= 2 && isPending;
                const isActive = activeId === ticket.id;

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setActiveId(ticket.id)}
                    className={cn(
                      "glass-panel border rounded-xl p-4 text-left flex items-start gap-4 transition-all cursor-pointer relative overflow-hidden",
                      isActive 
                        ? "border-primary bg-primary/5 shadow-glow-purple" 
                        : "border-border-glass hover:bg-border-glass/30 hover:scale-[1.01]"
                    )}
                  >
                    {/* SLA Priority colored strip */}
                    {isPending && (
                      <div className={cn(
                        "absolute top-0 bottom-0 left-0 w-1.5",
                        isCritical ? "bg-danger animate-pulse" : isWarning ? "bg-warning" : "bg-primary"
                      )}></div>
                    )}

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-2 pl-1.5">
                        <h4 className="text-xs font-bold text-text-primary truncate">{ticket.clientName}</h4>
                        {/* SLA timers indicators */}
                        {isPending ? (
                          <span className={cn(
                            "text-[8px] font-bold px-2 py-0.5 rounded flex items-center gap-1",
                            isCritical ? "bg-danger/10 border border-danger/25 text-danger animate-bounce" :
                            isWarning ? "bg-warning/10 border border-warning/25 text-warning" :
                            "bg-primary/10 border border-primary/25 text-primary"
                          )}>
                            <Clock className="h-2.5 w-2.5" />
                            <span>SLA: {ticket.slaHoursLeft}h</span>
                          </span>
                        ) : (
                          <span className="text-[8px] font-bold bg-success/15 border border-success/20 text-success px-2 py-0.5 rounded uppercase">
                            Yopilgan
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-text-muted pl-1.5 font-semibold">{ticket.reason}</p>
                      <p className="text-[9px] text-text-muted pl-1.5 truncate">{ticket.details}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Support dispute details and mediation actions */}
        <div className="lg:col-span-6">
          {selectedTicket ? (
            <div className="glass-panel border border-border-glass rounded-2xl p-6 bg-surface/50 space-y-6 animate-fade-in text-xs">
              <div className="flex justify-between items-center border-b border-border-glass pb-4">
                <div>
                  <span className="text-[8px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded uppercase tracking-wider">
                    Nizo Tafsilotlari
                  </span>
                  <h3 className="text-sm font-bold text-text-primary mt-1">Ticket ID: #{selectedTicket.id}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-text-muted">Kompensatsiya miqdori:</span>
                  <p className="text-xs font-bold text-primary">{selectedTicket.amount}</p>
                </div>
              </div>

              {/* Case participants info */}
              <div className="grid grid-cols-2 gap-4 bg-surface p-3.5 rounded-xl border border-border-glass">
                <div className="space-y-1 border-r border-border-glass pr-2">
                  <span className="text-[8px] text-text-muted uppercase font-bold flex items-center gap-1">
                    <User className="h-3 w-3 text-primary" />
                    <span>Da'vogar (Mijoz):</span>
                  </span>
                  <h5 className="font-bold text-text-primary">{selectedTicket.clientName}</h5>
                  <p className="text-[9px] text-text-muted">Buyurtma: {selectedTicket.bookingTime}</p>
                </div>
                <div className="space-y-1 pl-2">
                  <span className="text-[8px] text-text-muted uppercase font-bold flex items-center gap-1">
                    <Scissors className="h-3 w-3 text-primary" />
                    <span>Javobgar (Sartarosh):</span>
                  </span>
                  <h5 className="font-bold text-text-primary">{selectedTicket.barberName}</h5>
                  <p className="text-[9px] text-text-muted">Usta toifasi: S-Grade</p>
                </div>
              </div>

              {/* Complaint case description */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Nizo sababi:</span>
                <div className="p-3.5 bg-black/40 rounded-xl border border-border-glass space-y-1">
                  <span className="font-bold text-text-primary">{selectedTicket.reason}</span>
                  <p className="text-[10px] text-text-muted leading-relaxed font-sans mt-1">"{selectedTicket.details}"</p>
                </div>
              </div>

              {/* Mediation resolution triggers */}
              {selectedTicket.status === 'PENDING' ? (
                <div className="space-y-3 pt-4 border-t border-border-glass">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Mediativ qaror qabul qilish:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Refund */}
                    <button
                      onClick={() => handleResolveAction(selectedTicket.id, 'REFUND')}
                      className="flex items-center justify-center gap-1.5 rounded bg-primary hover:bg-primary-hover py-2.5 text-[10px] font-bold text-white shadow-glow-purple transition-all active:scale-95 cursor-pointer"
                    >
                      <Coins className="h-3.5 w-3.5" />
                      <span>Mijozga refund</span>
                    </button>

                    {/* Warn Barber */}
                    <button
                      onClick={() => handleResolveAction(selectedTicket.id, 'WARN_BARBER')}
                      className="flex items-center justify-center gap-1.5 rounded bg-surface border border-warning/30 hover:bg-warning/15 py-2.5 text-[10px] font-bold text-warning transition-colors cursor-pointer"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>Ustani ogohlantirish</span>
                    </button>

                    {/* Dismiss Case */}
                    <button
                      onClick={() => handleResolveAction(selectedTicket.id, 'DISMISS')}
                      className="flex items-center justify-center gap-1.5 rounded bg-surface border border-border-glass hover:bg-border-glass/40 py-2.5 text-[10px] font-bold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Case yopish</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-success text-[10px] font-semibold text-center flex items-center justify-center gap-2">
                  <Check className="h-4.5 w-4.5" />
                  <span>Ushbu nizo yopilgan va qaror ijroga yo'naltirilgan.</span>
                </div>
              )}

            </div>
          ) : (
            <div className="glass-panel border border-border-glass rounded-2xl p-8 text-center text-xs text-text-muted italic bg-surface/50">
              Tafsilotlarni ko'rish uchun shikoyat kartasini tanlang
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
