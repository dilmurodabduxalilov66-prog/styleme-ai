'use client';

import React, { useState } from 'react';
import { 
  Wallet, 
  Coins, 
  AlertTriangle, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Lock,
  Unlock
} from 'lucide-react';
import { api } from '@/lib/axios';
import { cn } from '@/utils/cn';

interface LedgerTransaction {
  id: string;
  type: 'COMMISSION_DEBIT' | 'COMMISSION_CREDIT' | 'PAYOUT' | 'EARNING' | 'USER_PAYMENT' | 'DEPOSIT';
  description: string;
  amount: number;
  date: string;
}

export default function BarberLedgerPage() {
  // Financial balance states
  const [digitalWallet, setDigitalWallet] = useState(0); 
  const [cashWallet, setCashWallet] = useState(0);
  const [commissionDebt, setCommissionDebt] = useState(0); 
  const [lockoutLimit, setLockoutLimit] = useState(500000);

  // Double-entry transaction ledger
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);

  React.useEffect(() => {
    const fetchLedger = async () => {
      try {
        const { data } = await api.get('/payments/ledger');
        setDigitalWallet(data.digitalWallet || 0);
        setCashWallet(data.cashWallet || 0);
        setCommissionDebt(data.commissionDebt || 0);
        if (data.lockoutLimit) {
          setLockoutLimit(data.lockoutLimit);
        }
        setTransactions(data.transactions || []);
      } catch (err) {
        console.error('Failed to fetch ledger:', err);
      }
    };
    fetchLedger();
  }, []);

  // Dynamic Lockout threshold parameters
  const warningLimit = lockoutLimit * 0.7;
  const isLocked = commissionDebt >= lockoutLimit;
  const isWarned = commissionDebt >= warningLimit && commissionDebt < lockoutLimit;

  // Payoff modal state
  const [showPayoffModal, setShowPayoffModal] = useState(false);
  const [payoffAmount, setPayoffAmount] = useState(0);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [isSubmittingPayoff, setIsSubmittingPayoff] = useState(false);
  const [payoffSuccess, setPayoffSuccess] = useState(false);

  // Trigger payoff webhook settlement simulation
  const handlePayoffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.length < 16) return;
    setIsSubmittingPayoff(true);

    try {
      // API call simulating payment webhook settle commission debt limits
      await api.post('/payments/webhooks/click', {
        amount: payoffAmount,
        action: 1, // Complete transaction
        merchant_trans_id: 'barber-001'
      });

      setTimeout(() => {
        setIsSubmittingPayoff(false);
        setCommissionDebt(prev => Math.max(0, prev - payoffAmount));
        
        // Add PAYOUT transaction
        const newTx: LedgerTransaction = {
          id: `tx-${Math.random()}`,
          type: 'PAYOUT',
          description: "Click komissiya qarzi so'ndirildi",
          amount: -payoffAmount,
          date: 'Hozirgina'
        };
        setTransactions([newTx, ...transactions]);

        setPayoffSuccess(true);
        setTimeout(() => {
          setPayoffSuccess(false);
          setShowPayoffModal(false);
          setCardNumber('');
          setCardExpiry('');
        }, 1800);
      }, 1500);

    } catch (err) {
      console.error('Webhook payments API error:', err);
      setIsSubmittingPayoff(false);
      // Removed local simulated payment. The debt will only clear upon a successful webhook API response.
      alert("Xatolik yuz berdi. To'lov tizimi bilan bog'lanib bo'lmadi.");
    }
  };

  return (
    <div className="space-y-8 text-text-primary">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-text-primary to-primary bg-clip-text text-transparent">
            Kassa & Moliyaviy Ledger
          </h1>
          <p className="text-xs text-text-muted mt-1">Sizning balansingiz, platforma oldidagi komissiya qarzlari monitoringi</p>
        </div>
      </div>

      {/* 1. LOCKOUT LIMIT WARNING BLOCK */}
      {isLocked && (
        <div className="bg-danger/10 border-2 border-danger rounded-2xl p-5 flex items-start gap-4 animate-pulse">
          <div className="h-10 w-10 rounded-full bg-danger/20 text-danger flex items-center justify-center shrink-0">
            <Lock className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-display font-bold text-danger">Dashboardingiz bloklandi (Lockout Threshold)!</h4>
            <p className="text-text-muted">
              Sizning naqd pul komissiya qarzingiz ruxsat etilgan limitdan ({lockoutLimit.toLocaleString()} UZS) oshib ketdi. 
              Navbatlarga yangi mijozlarni yozish funksiyasi to'xtatildi. Blokdan chiqarish uchun CLICK/PAYME orqali qarzni so'ndiring.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setPayoffAmount(commissionDebt);
                  setShowPayoffModal(true);
                }}
                className="bg-danger hover:bg-danger/80 text-white font-bold px-4 py-2 rounded text-[10px] transition-all"
              >
                Qarzni hoziroq so'ndirish
              </button>
            </div>
          </div>
        </div>
      )}

      {isWarned && (
        <div className="bg-warning/10 border border-warning/30 rounded-2xl p-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-warning/20 text-warning flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-display font-bold text-warning font-semibold">Komissiya qarzi ogohlantirish limiti!</h4>
            <p className="text-text-muted">
              Komissiya qarzingiz {warningLimit.toLocaleString()} UZS dan oshdi. Agar qarz {lockoutLimit.toLocaleString()} UZS ga yetsa, 
              ish tartibingiz avtomatik bloklanadi. Iltimos, hisob-kitobni amalga oshiring.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setPayoffAmount(commissionDebt);
                  setShowPayoffModal(true);
                }}
                className="bg-warning hover:bg-warning/80 text-black font-bold px-4 py-2 rounded text-[10px] transition-all"
              >
                Qarzni to'lash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {/* Card 1: Wallet Balance */}
          <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-center text-xs text-text-muted">
              <span>Karta Balansi (Digital Wallet)</span>
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-extrabold text-white">
                {digitalWallet.toLocaleString()} UZS
              </span>
              <p className="text-[10px] text-text-muted">Onlayn to'langan mablag'lar</p>
            </div>
          </div>

          {/* Card 1.5: Cash Wallet */}
          <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-center text-xs text-text-muted">
              <span>Qo'ldagi Naqd Pullar</span>
              <Coins className="h-4 w-4 text-success" />
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-extrabold text-white">
                {cashWallet.toLocaleString()} UZS
              </span>
              <p className="text-[10px] text-text-muted">Jami mijozlar bergan naqd</p>
            </div>
          </div>

        {/* Card 2: Commission Debt */}
        <div className={cn(
          "glass-panel border rounded-2xl p-5 space-y-3 relative overflow-hidden transition-all",
          isLocked ? "border-danger/35 bg-danger/5" : "border-border-glass bg-surface/50"
        )}>
          <div className="flex justify-between items-center text-xs text-text-muted">
            <span>Naqd Komissiya Qarzi</span>
            <Coins className="h-4 w-4 text-warning animate-pulse" />
          </div>
          <div className="space-y-1">
            <span className={cn(
              "text-2xl font-extrabold",
              isLocked ? "text-danger" : isWarned ? "text-warning" : "text-white"
            )}>
              {commissionDebt.toLocaleString()} UZS
            </span>
            <div className="flex justify-between text-[9px] text-text-muted">
              <span>Limit: {lockoutLimit.toLocaleString()} UZS</span>
              <span className={isLocked ? "text-danger font-bold" : "text-success font-semibold"}>
                {isLocked ? "BLOKLANGAN" : "FAOL"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Net income */}
        <div className="glass-panel p-6 rounded-2xl border border-border-glass relative overflow-hidden group hover:border-success/30 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 blur-[50px] -mr-10 -mt-10 group-hover:bg-success/20 transition-colors" />
          <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
            <div className="flex justify-between items-start">
              <h3 className="font-display font-semibold text-text-muted text-sm">Sof Daromad (Mavsumiy)</h3>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-extrabold text-white">
                {(digitalWallet + cashWallet - commissionDebt).toLocaleString()} UZS
              </span>
              <p className="text-[10px] text-text-muted">Barcha xarajatlardan so'ng</p>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Financial Income chart & double-entry table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: SVG Earnings Chart */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-5">
            <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary animate-pulse" />
              <span>Daromadlar Dinamikasi (Haftalik)</span>
            </h3>

            {/* Custom SVG Line Chart */}
            <div className="relative w-full h-48 bg-black/40 rounded-xl overflow-hidden border border-border-glass p-2">
              <svg viewBox="0 0 400 200" className="w-full h-full text-primary">
                {/* Horizontal gridlines */}
                <line x1="20" y1="40" x2="380" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                <line x1="20" y1="90" x2="380" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                <line x1="20" y1="140" x2="380" y2="140" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                
                {/* Dynamic SVG Path based on transactions */}
                {(() => {
                  const now = new Date();
                  const weeks = [0, 0, 0, 0];
                  
                  transactions.forEach(tx => {
                    if (tx.type === 'USER_PAYMENT' || tx.type === 'DEPOSIT') {
                      const txDate = new Date(tx.date);
                      const diffTime = Math.abs(now.getTime() - txDate.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      if (diffDays <= 7) weeks[3] += Number(tx.amount);
                      else if (diffDays <= 14) weeks[2] += Number(tx.amount);
                      else if (diffDays <= 21) weeks[1] += Number(tx.amount);
                      else if (diffDays <= 28) weeks[0] += Number(tx.amount);
                    }
                  });
                  
                  // fallback to dummy data if everything is 0 to avoid empty chart
                  const hasData = weeks.some(w => w > 0);
                  const data = hasData ? weeks : [10000, 25000, 20000, 45000];
                  const maxWeekly = Math.max(...data, 1);
                  const getY = (val: number) => 160 - (val / maxWeekly) * 120;
                  
                  const pts = [
                    { x: 40, y: getY(data[0]) },
                    { x: 160, y: getY(data[1]) },
                    { x: 280, y: getY(data[2]) },
                    { x: 360, y: getY(data[3]) }
                  ];
                  
                  // Compute cubic bezier smooth points
                  // cp1.x = p0.x + (p1.x - p0.x)/2
                  // cp1.y = p0.y
                  // cp2.x = cp1.x, cp2.y = p1.y
                  const pathD = `M ${pts[0].x},${pts[0].y} 
                    C ${pts[0].x + 60},${pts[0].y} ${pts[1].x - 60},${pts[1].y} ${pts[1].x},${pts[1].y}
                    C ${pts[1].x + 60},${pts[1].y} ${pts[2].x - 60},${pts[2].y} ${pts[2].x},${pts[2].y}
                    C ${pts[2].x + 40},${pts[2].y} ${pts[3].x - 40},${pts[3].y} ${pts[3].x},${pts[3].y}`;

                  const lastWeek = data[2];
                  const thisWeek = data[3];
                  const trend = lastWeek === 0 ? (thisWeek > 0 ? 100 : 0) : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
                  
                  return (
                    <>
                      <path
                        d={pathD}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="shadow-glow-purple"
                      />
                      {pts.map((pt, i) => (
                        <g key={i}>
                          <circle cx={pt.x} cy={pt.y} r="4.5" className="fill-white" />
                          {hasData && (
                            <text x={pt.x} y={pt.y - 12} fill="rgba(255,255,255,0.8)" fontSize="9" textAnchor="middle">
                              {(data[i] / 1000).toFixed(0)}k
                            </text>
                          )}
                        </g>
                      ))}
                      
                      {/* X labels */}
                      <text x="40" y="185" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">1-Hafta</text>
                      <text x="160" y="185" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">2-Hafta</text>
                      <text x="280" y="185" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">3-Hafta</text>
                      <text x="360" y="185" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">4-Hafta</text>
                      
                      {/* We can sneak the trend text out into the DOM if we want, but SVG can't easily export DOM elements.
                          Instead we leave the bottom row separate, but we compute trend here. */}
                    </>
                  );
                })()}
              </svg>
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-text-muted">
              <span>Haftalik so'nggi hisobot</span>
              {/* We calculate trend again quickly or just show an indicator */}
              <span className="font-bold text-success text-xs">Aktiv Daromadlar jadvali</span>
            </div>
          </div>
        </div>

        {/* Right: Double Entry Ledger List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-4">
            <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span>Double-Entry Tranzaksiyalar</span>
            </h3>

            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {transactions.map(tx => {
                const isDebit = tx.type === 'COMMISSION_DEBIT' || tx.type === 'PAYOUT';

                return (
                  <div key={tx.id} className="flex justify-between items-center bg-surface p-2.5 rounded border border-border-glass text-[10px]">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-7 w-7 rounded-full flex items-center justify-center shrink-0 border",
                        isDebit 
                          ? "bg-danger/10 border-danger/25 text-danger" 
                          : "bg-success/10 border-success/25 text-success"
                      )}>
                        {isDebit ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-bold text-text-primary">{tx.description}</span>
                        <p className="text-[8px] text-text-muted">{tx.date} • {tx.type}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "font-bold shrink-0",
                      isDebit ? "text-danger" : "text-success"
                    )}>
                      {isDebit ? '' : '+'}{tx.amount.toLocaleString()} UZS
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================================
          COMMISSION PAYOFF MODAL DRAW
         ============================================================================ */}
      {showPayoffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handlePayoffSubmit} className="w-full max-w-md glass-panel border border-border-glass rounded-2xl p-6 space-y-6 relative">
            <button
              type="button"
              onClick={() => setShowPayoffModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary h-7 w-7 rounded-full bg-surface/50 border border-border-glass flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-display text-lg font-bold text-text-primary">Komissiya qarzini to'lash</h3>
              <p className="font-sans text-xs text-text-muted">CLICK / PAYME hisob-kitob tizimi</p>
            </div>

            {/* Price detail block */}
            <div className="p-3 bg-surface/50 border border-border-glass rounded-xl flex justify-between items-center text-xs">
              <span className="text-text-muted">So'ndiriladigan miqdor:</span>
              <span className="text-sm font-extrabold text-primary">{payoffAmount.toLocaleString()} UZS</span>
            </div>

            {/* Card fields */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] text-text-muted">Karta raqami (8600...)</label>
                <input
                  type="text"
                  maxLength={16}
                  required
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 h-10 rounded bg-surface border border-border-glass text-xs placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-text-muted">Muddati (MM/YY)</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-3 h-10 rounded bg-surface border border-border-glass text-xs placeholder:text-text-muted focus:border-primary focus:outline-none text-center"
                  />
                </div>
                <div className="space-y-1 bg-surface/30 p-1 rounded border border-border-glass flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-extrabold text-blue-400">CLICK Webhook active</span>
                </div>
              </div>
            </div>

            {/* Actions triggers */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={cardNumber.length < 16 || isSubmittingPayoff}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-lg py-3 text-xs font-bold text-white transition-all shadow-glow-purple",
                  cardNumber.length >= 16 && !isSubmittingPayoff
                    ? "bg-primary hover:bg-primary-hover active:scale-95 cursor-pointer" 
                    : "bg-surface border border-border-glass text-text-muted cursor-not-allowed"
                )}
              >
                {isSubmittingPayoff ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>To'lov settle qilinmoqda...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>Qarzni so'ndirish</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowPayoffModal(false)}
                className="w-full text-center py-2 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
              >
                Bekor qilish
              </button>
            </div>

            {payoffSuccess && (
              <div className="p-3 bg-success/15 border border-success/20 rounded-lg text-success text-xs font-semibold text-center animate-pulse flex items-center justify-center gap-2">
                <Unlock className="h-4 w-4 shrink-0" />
                <span>To'lov qabul qilindi! Blokdan chiqarildi.</span>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
