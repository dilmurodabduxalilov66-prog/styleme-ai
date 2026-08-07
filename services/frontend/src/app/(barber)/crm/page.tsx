'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  BookOpen, 
  Mic, 
  Save, 
  Plus, 
  Upload, 
  Trash2, 
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  MicOff
} from 'lucide-react';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/utils/cn';

interface ClientDossier {
  id: string;
  name: string;
  phone: string;
  joined: string;
  lastVisit?: string;
  totalVisits?: number;
  notes: string[];
  recommendedStyles: string[];
}

interface PortfolioItem {
  id: string;
  title: string;
  imageUrl: string;
}

const MOCK_CLIENTS: ClientDossier[] = [];

const MOCK_PORTFOLIO: PortfolioItem[] = [];

export default function BarberCRMPage() {
  // CRM Dossier States
  const [clients, setClients] = useState<ClientDossier[]>([]);
  const [activeClientId, setActiveClientId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Note writing states
  const [newNote, setNewNote] = useState('');
  
  useEffect(() => {
    const fetchClientsAndPortfolio = async () => {
      try {
        const { data: clientsData } = await api.get('/bookings/crm');
        // data contains id, name, phone, lastVisit, totalVisits
        const mappedClients = (Array.isArray(clientsData) ? clientsData : []).map((c: any) => ({
          ...c,
          joined: c.lastVisit, // fallback
          notes: c.notes || [],
          recommendedStyles: []
        }));
        setClients(mappedClients);
        if (mappedClients.length > 0) {
          setActiveClientId(mappedClients[0].id);
        }

        // Fetch portfolio
        const { data: portfolioData } = await api.get(`/barbers/${useAuthStore.getState().user?.userId || useAuthStore.getState().user?.id}/portfolio`);
        if (portfolioData) {
          setPortfolio(portfolioData.images || (Array.isArray(portfolioData) ? portfolioData : []));
        }
      } catch (err) {
        console.error('Failed to load CRM clients or portfolio:', err);
      }
    };
    fetchClientsAndPortfolio();
  }, []);
  const [isDictating, setIsDictating] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);

  // Portfolio Studio States
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadingProgress, setUploadingProgress] = useState<number | null>(null);
  const [portfolioSuccess, setPortfolioSuccess] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Active Selected client helper
  const selectedClient = clients.find(c => c.id === activeClientId) || clients[0];

  // Filter clients list
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  // Append new note log
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      await api.post(`/barbers/dossiers/${selectedClient.id}/notes`, { note: newNote });

      setClients(clients.map(c => 
        c.id === selectedClient.id 
          ? { ...c, notes: [newNote, ...c.notes] } 
          : c
      ));
      setNewNote('');
      setNoteSuccess(true);
      setTimeout(() => setNoteSuccess(false), 2000);

    } catch (err) {
      console.warn('CRM dossiers POST failed:', err);
      alert('Eslatma saqlashda xatolik');
    }
  };

  // Real Voice dictation note entry (Web Speech API)
  const toggleVoiceDictation = () => {
    if (isDictating) {
      setIsDictating(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Kechirasiz, brauzeringiz ovozli yozishni qo'llab-quvvatlamaydi (Web Speech API topilmadi).");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'uz-UZ'; // O'zbek tili
    recognition.interimResults = false;

    recognition.onstart = () => setIsDictating(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNewNote(prev => (prev ? prev + ' ' : '') + transcript);
    };

    recognition.onerror = (err: any) => {
      console.error('Speech recognition xatosi:', err.error);
      setIsDictating(false);
    };

    recognition.onend = () => setIsDictating(false);

    try {
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsDictating(false);
    }
  };

  // Portfolio image upload flow
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle) return;

    setUploadingProgress(10);

    // Simulated progress uploading tracker for UX
    const interval = setInterval(() => {
      setUploadingProgress(p => {
        if (p === null || p >= 80) return p;
        return p + 10;
      });
    }, 200);

    try {
      const formData = new FormData();
      if (uploadFile) {
        formData.append('image', uploadFile);
      }
      formData.append('title', uploadTitle);

      const res = await api.post('/barbers/portfolio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      clearInterval(interval);
      setUploadingProgress(100);
      
      const localFallbackUrl = uploadFile ? URL.createObjectURL(uploadFile) : '';
      const newItem: PortfolioItem = {
        id: res.data.id || `p-${Math.random()}`,
        title: uploadTitle,
        imageUrl: res.data.image_url || localFallbackUrl || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=300&h=300'
      };
      setPortfolio([newItem, ...portfolio]);
      
      setTimeout(() => {
        setUploadTitle('');
        setUploadFile(null);
        setUploadingProgress(null);
        setPortfolioSuccess(true);
        setTimeout(() => setPortfolioSuccess(false), 2000);
      }, 500);

    } catch (err) {
      clearInterval(interval);
      setUploadingProgress(null);
      console.warn('Portfolio S3 uploader failed:', err);
      alert('Portfolio rasm yuklashda xatolik yuz berdi.');
    }
  };

  // Delete Portfolio photo card
  const handleDeletePortfolio = async (id: string) => {
    if (!confirm("Ushbu portfoliodagi rasmni o'chirishni tasdiqlaysizmi?")) return;

    try {
      await api.delete(`/barbers/portfolio/${id}`);
      setPortfolio(portfolio.filter(p => p.id !== id));
    } catch (err) {
      console.warn('Portfolio delete API offline, using local simulated delete:', err);
      setPortfolio(portfolio.filter(p => p.id !== id));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadFile(file);
    }
  };

  return (
    <div className="space-y-8 text-text-primary">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-text-primary to-primary bg-clip-text text-transparent">
          CRM & Portfolio Studio
        </h1>
        <p className="text-xs text-text-muted mt-1">Mijozlarning soch turmaklash qaydlari va portfoliongizni boshqaring</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ============================================================================
            LEFT COLUMN: CRM CLIENT DOSSIERS SECTION
           ============================================================================ */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 space-y-6">
            <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
              <Users className="h-4 w-4 text-primary animate-pulse" />
              <span>1. Mijozlar reyestri (CRM)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* Client search list selection */}
              <div className="sm:col-span-5 space-y-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Mijoz qidirish..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 h-9 rounded bg-surface border border-border-glass text-xs placeholder:text-text-muted focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {filteredClients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setActiveClientId(c.id)}
                      className={cn(
                        "w-full px-3 py-2 rounded text-left text-xs transition-all flex justify-between items-center",
                        c.id === activeClientId 
                          ? "bg-primary/10 border-l-2 border-primary text-primary" 
                          : "hover:bg-border-glass/40 text-text-muted hover:text-text-primary"
                      )}
                    >
                      <span className="font-semibold">{c.name}</span>
                      <span className="text-[9px] font-mono text-text-muted">{c.phone.substring(0, 7)}...</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active client dossier details & notes log */}
              <div className="sm:col-span-7 border-l border-border-glass pl-4 space-y-5 text-xs">
                {selectedClient ? (
                  <>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-text-primary">{selectedClient.name}</h4>
                      <p className="text-[10px] text-text-muted">
                        Tashriflar: {selectedClient.totalVisits || 0} marta • Oxirgi tashrif: {selectedClient.lastVisit || 'Noma\'lum'}
                      </p>
                      <div className="flex gap-1.5 pt-1.5">
                        {selectedClient.recommendedStyles.map(style => (
                          <span key={style} className="text-[8px] font-semibold bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5" />
                            {style}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Timeline Notes */}
                    <div className="space-y-2.5">
                      <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">Tashqi qaydlar tarixi:</span>
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {selectedClient.notes.map((note, index) => (
                          <div key={index} className="bg-surface/50 p-2.5 rounded border border-border-glass space-y-1 text-[10px]">
                            <p className="text-text-primary leading-relaxed">{note}</p>
                            <span className="text-[8px] text-text-muted flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              2026-yil
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Write new note form */}
                    <form onSubmit={handleSaveNote} className="space-y-2 pt-2 border-t border-border-glass">
                      <div className="relative">
                        <textarea
                          rows={2}
                          placeholder="Mijoz soch xususiyatlari yoki kesish bo'yicha maxsus qaydlar..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="w-full p-2.5 rounded border border-border-glass bg-surface/50 text-[10px] placeholder:text-text-muted focus:border-primary focus:outline-none"
                        />
                        {/* Voice Dictation trigger */}
                        <button
                          type="button"
                          onClick={toggleVoiceDictation}
                          className={cn(
                            "absolute bottom-2.5 right-2.5 h-6 w-6 rounded-full flex items-center justify-center transition-all",
                            isDictating 
                              ? "bg-danger text-white animate-pulse" 
                              : "bg-surface border border-border-glass text-text-muted hover:text-text-primary"
                          )}
                          title="Ovozli yozuv (Speech-to-text)"
                        >
                          {isDictating ? <Mic className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      {isDictating && (
                        <span className="block text-[8px] text-danger font-semibold animate-pulse">
                          Nutq tahlil qilinmoqda, iltimos gapiring...
                        </span>
                      )}

                      <div className="flex justify-between items-center">
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 rounded bg-primary hover:bg-primary-hover px-4 py-2 text-[10px] font-bold text-white shadow-glow-purple transition-all"
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>Qaydni saqlash</span>
                        </button>

                        {noteSuccess && (
                          <span className="text-[9px] text-success font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Saqlandi!
                          </span>
                        )}
                      </div>
                    </form>
                  </>
                ) : (
                  <span className="text-text-muted italic">Mijoz tanlanmagan</span>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ============================================================================
            RIGHT COLUMN: PORTFOLIO STUDIO UPLOAD SECTION
           ============================================================================ */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 space-y-6">
            <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary animate-pulse" />
              <span>2. Portfolio studiyasi (S3)</span>
            </h3>

            {/* Upload form block */}
            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
                  isDraggingFile 
                    ? "border-primary bg-primary/5" 
                    : "border-border-glass bg-surface/40 hover:bg-border-glass/40"
                )}
              >
                <input
                  type="file"
                  id="portfolio-file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="portfolio-file" className="flex flex-col items-center gap-1.5 cursor-pointer text-center">
                  <Upload className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-[10px] font-bold text-text-primary">
                    {uploadFile ? uploadFile.name : "Rasm yuklash (Drag & Drop)"}
                  </span>
                  <p className="text-[8px] text-text-muted">PNG, JPG fayllar (maksimal 10MB)</p>
                </label>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Soch turmagi nomi (Masalan: Fade)"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="flex-1 px-3 h-9 rounded bg-surface border border-border-glass text-[10px] placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={uploadingProgress !== null}
                  className="flex items-center gap-1 rounded bg-primary hover:bg-primary-hover px-3 text-[10px] font-bold text-white shadow-glow-purple transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Qo'shish</span>
                </button>
              </div>

              {uploadingProgress !== null && (
                <div className="space-y-1 pt-1.5">
                  <div className="flex justify-between text-[9px] text-text-muted font-bold">
                    <span>S3 ga yuklanmoqda:</span>
                    <span>{uploadingProgress}%</span>
                  </div>
                  <div className="h-1 w-full bg-border-base rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadingProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {portfolioSuccess && (
                <div className="p-2 rounded bg-success/15 border border-success/20 text-success text-[10px] font-semibold text-center animate-pulse">
                  Portfolio rasmi muvaffaqiyatli saqlandi!
                </div>
              )}
            </form>

            {/* Portfolio Cards Grid */}
            <div className="space-y-2.5 pt-2 border-t border-border-glass">
              <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">Sizning portfoliongiz:</span>
              <div className="grid grid-cols-3 gap-3">
                {portfolio.map(item => (
                  <div key={item.id} className="relative group rounded-lg overflow-hidden border border-border-glass bg-black aspect-square">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    {/* Hover controls overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col justify-between p-2 transition-opacity duration-200">
                      <button
                        onClick={() => handleDeletePortfolio(item.id)}
                        className="self-end p-1 rounded bg-danger/20 hover:bg-danger/80 text-white transition-colors"
                        title="Rasmni o'chirish"
                        aria-label="Delete portfolio item"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <span className="text-[8px] font-bold text-white truncate text-center">{item.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
