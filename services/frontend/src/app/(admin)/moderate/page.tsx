'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FolderLock, 
  Check, 
  X, 
  AlertTriangle, 
  RefreshCw,
  Keyboard,
  User,
  Image as ImageIcon,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { api } from '@/lib/axios';
import { cn } from '@/utils/cn';

interface ModerationItem {
  id: string;
  type: 'BIO' | 'PORTFOLIO' | 'REVIEW';
  creatorName: string;
  content: string;
  imageUrl?: string;
  flagReason: string;
  submittedAt: string;
}

export default function AdminModeratePage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const activeItem = items[activeIdx];

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/moderate');
      if (data?.items) {
        setItems(data.items);
        setActiveIdx(0);
      }
    } catch (err) {
      console.error('Admin moderate API error:', err);
      setError("Moderatsiya ro'yxatini yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAction = useCallback(async (id: string, action: 'APPROVE' | 'REJECT' | 'SKIP') => {
    if (items.length === 0) return;

    try {
      if (action !== 'SKIP') {
        await api.post(`/admin/moderate/${id}/decision`, { action });
      }

      setToastMsg(`Kontent: ${action === 'APPROVE' ? 'Tasdiqlandi' : action === 'REJECT' ? 'Rad etildi' : 'O\'tkazib yuborildi'}`);
      setTimeout(() => setToastMsg(null), 1500);

      // Remove item or move index
      setItems(prev => prev.filter(item => item.id !== id));
      setActiveIdx(prev => {
        if (prev >= items.length - 1) return 0;
        return prev;
      });

    } catch (err) {
      console.error('Moderate decision API error:', err);
      setError("Qarorni saqlashda xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
      setTimeout(() => setError(null), 3000);
    }
  }, [items]);

  // Bind Keyboard Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeItem) return;
      const key = e.key.toUpperCase();

      if (key === 'A') {
        handleAction(activeItem.id, 'APPROVE');
      } else if (key === 'R') {
        handleAction(activeItem.id, 'REJECT');
      } else if (key === 'S') {
        handleAction(activeItem.id, 'SKIP');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeItem, handleAction]);

  return (
    <div className="space-y-8 text-text-primary">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-text-primary to-primary bg-clip-text text-transparent">
            Kontent Moderatsiya Paneli
          </h1>
          <p className="text-xs text-text-muted mt-1">Sartarosh rasmlari, mijoz sharhlari va profillarini tezkor moderatsiya qilish</p>
        </div>

        {/* Keyboard shortcut legend widget */}
        <div className="flex items-center gap-4 bg-surface/50 border border-border-glass px-4 py-2 rounded-xl text-[10px] text-text-muted">
          <div className="flex items-center gap-1.5 font-bold">
            <Keyboard className="h-4 w-4 text-primary shrink-0" />
            <span>Tezkor tugmalar faol:</span>
          </div>
          <div className="flex gap-2">
            <span className="bg-surface border border-border-glass px-1.5 py-0.5 rounded font-mono text-white">[A] Tasdiqlash</span>
            <span className="bg-surface border border-border-glass px-1.5 py-0.5 rounded font-mono text-white">[R] Rad etish</span>
            <span className="bg-surface border border-border-glass px-1.5 py-0.5 rounded font-mono text-white">[S] O'tkazib yuborish</span>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-2.5 bg-success/15 border border-success/20 rounded-lg text-success text-xs font-semibold text-center animate-pulse">
          {toastMsg}
        </div>
      )}

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm text-center">
          {error}
        </div>
      )}

      {/* Main panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Current active moderation queue card */}
        <div className="lg:col-span-7 space-y-4">
          {loading ? (
            <div className="glass-panel border border-border-glass rounded-2xl p-12 flex justify-center items-center bg-surface/50">
              <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-50" />
            </div>
          ) : items.length === 0 ? (
            <div className="glass-panel border border-border-glass rounded-2xl p-12 text-center text-xs text-text-muted italic bg-surface/50 flex flex-col items-center justify-center gap-3">
              <FolderLock className="h-8 w-8 text-primary animate-pulse" />
              <span>Moderatsiya qilinadigan kontent qolmadi. Navbat toza!</span>
            </div>
          ) : (
            <div className="glass-panel border border-border-glass rounded-2xl p-6 bg-surface/50 space-y-6 relative overflow-hidden min-h-[350px] flex flex-col justify-between">
              
              {/* Type header indicator */}
              <div className="flex justify-between items-center border-b border-border-glass pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                    {activeItem.type === 'PORTFOLIO' && <ImageIcon className="h-4.5 w-4.5" />}
                    {activeItem.type === 'REVIEW' && <MessageSquare className="h-4.5 w-4.5" />}
                    {activeItem.type === 'BIO' && <User className="h-4.5 w-4.5" />}
                  </div>
                  <div>
                    <span className="text-[8px] text-text-muted uppercase font-bold">Tur: {activeItem.type}</span>
                    <h3 className="text-xs font-bold text-text-primary">Yaratuvchi: {activeItem.creatorName}</h3>
                  </div>
                </div>

                <span className="text-[9px] font-mono text-text-muted">{activeItem.submittedAt}</span>
              </div>

              {/* Main Content Viewport */}
              <div className="flex-1 flex flex-col justify-center py-6 gap-4">
                
                {/* Content text */}
                <div className="p-4 bg-black/40 rounded-xl border border-border-glass font-sans text-xs italic text-text-muted leading-relaxed text-center">
                  "{activeItem.content}"
                </div>

                {/* Content Image if exists */}
                {activeItem.imageUrl && (
                  <div className="h-48 w-full rounded-xl overflow-hidden border border-border-glass bg-black relative flex items-center justify-center select-none">
                    <img
                      src={activeItem.imageUrl}
                      alt="Moderate Attachment"
                      className="h-full object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Warning Flag overlay details */}
              <div className="bg-danger/10 border border-danger/25 rounded-xl p-3 flex items-start gap-2.5 text-[10px]">
                <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-0.5">
                  <span className="font-bold text-danger font-semibold">Tizim ogohlantirishi:</span>
                  <p className="text-text-muted">{activeItem.flagReason}</p>
                </div>
              </div>

              {/* Triage buttons controls */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border-glass">
                <button
                  onClick={() => handleAction(activeItem.id, 'APPROVE')}
                  className="flex items-center justify-center gap-1.5 rounded bg-primary hover:bg-primary-hover py-2.5 text-xs font-bold text-white shadow-glow-purple transition-all active:scale-95 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Tasdiqlash [A]</span>
                </button>

                <button
                  onClick={() => handleAction(activeItem.id, 'REJECT')}
                  className="flex items-center justify-center gap-1.5 rounded bg-surface border border-danger/30 hover:bg-danger/10 py-2.5 text-xs font-bold text-danger transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                  <span>O'chirish [R]</span>
                </button>

                <button
                  onClick={() => handleAction(activeItem.id, 'SKIP')}
                  className="flex items-center justify-center gap-1.5 rounded bg-surface border border-border-glass hover:bg-border-glass/40 py-2.5 text-xs font-bold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Skip [S]</span>
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Right column: Moderation queue summary lists preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-4 text-xs">
            <h3 className="font-display text-xs font-bold text-text-primary uppercase tracking-wider">
              Moderatsiya Navbat Ro'yxati ({items.length} ta kontent)
            </h3>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {items.map((item, index) => {
                const isActive = activeIdx === index;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveIdx(index)}
                    className={cn(
                      "w-full p-2.5 rounded-lg border text-left flex items-center justify-between gap-3 transition-all",
                      isActive 
                        ? "border-primary bg-primary/5 shadow-glow-purple" 
                        : "border-border-glass bg-surface/40 hover:bg-border-glass/30"
                    )}
                  >
                    <div className="min-w-0">
                      <span className="text-[8px] text-text-muted uppercase font-bold">Tur: {item.type}</span>
                      <h5 className="font-bold text-text-primary truncate">{item.creatorName}</h5>
                      <p className="text-[9px] text-text-muted truncate mt-0.5">"{item.content}"</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
