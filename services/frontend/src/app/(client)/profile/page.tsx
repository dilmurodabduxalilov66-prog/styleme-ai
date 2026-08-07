'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Award, User, Heart, Settings, ShieldCheck, HeartOff } from 'lucide-react';
import { cn } from '@/utils/cn';
import { api } from '@/lib/axios';
import { useEffect } from 'react';

type ActiveTab = 'FAVORITES' | 'SETTINGS';
type FavSegment = 'STYLES' | 'BARBERS';

export default function ClientProfile() {
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('FAVORITES');
  const [favSegment, setFavSegment] = useState<FavSegment>('STYLES');

  // Form states
  const [hairDensity, setHairDensity] = useState('NORMAL'); 
  const [hairTexture, setHairTexture] = useState('WAVY'); 
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Favorites databases
  const [savedStyles, setSavedStyles] = useState<any[]>([]);
  const [favBarbers, setFavBarbers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, favRes] = await Promise.all([
          api.get('/auth/profile'),
          api.get('/auth/profile/favorites')
        ]);
        
        // Init profile settings
        const hp = profileRes.data.hair_profile || {};
        if (hp.hair_density) setHairDensity(hp.hair_density);
        if (hp.hair_texture) setHairTexture(hp.hair_texture);
        
        // Init favorites
        setSavedStyles(favRes.data.savedStyles || []);
        setFavBarbers(favRes.data.favBarbers || []);
      } catch (err) {
        console.error('Failed to load profile data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/auth/profile/settings', {
        hair_density: hairDensity,
        hair_texture: hairTexture
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setIsSaving(false);
    }
  };

  const removeStyle = async (id: number) => {
    try {
      await api.post('/auth/profile/favorites', { type: 'HAIRSTYLE', id });
      setSavedStyles(savedStyles.filter((style) => style.id !== id));
    } catch (err) {
      console.error('Failed to remove style', err);
    }
  };

  const removeBarber = async (id: number) => {
    try {
      await api.post('/auth/profile/favorites', { type: 'BARBER', id });
      setFavBarbers(favBarbers.filter((barber) => barber.id !== id));
    } catch (err) {
      console.error('Failed to remove barber', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="h-8 w-8 text-primary animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
        <p className="text-xs text-text-muted">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Segment Tab Selector */}
      <div className="flex border-b border-border-glass">
        <button
          onClick={() => setActiveTab('FAVORITES')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-colors duration-150",
            activeTab === 'FAVORITES'
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          )}
        >
          <Heart className="h-4 w-4" />
          <span>Sevimlilar (Favorites)</span>
        </button>
        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-colors duration-150",
            activeTab === 'SETTINGS'
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          )}
        >
          <Settings className="h-4 w-4" />
          <span>Profil Sozlamalari</span>
        </button>
      </div>

      {activeTab === 'FAVORITES' ? (
        /* ============================================================================
            FAVORITES MODULE
           ============================================================================ */
        <div className="space-y-6">
          {/* Sub-segment selector */}
          <div className="flex gap-2 bg-surface/40 p-1 rounded-lg border border-border-glass max-w-xs">
            <button
              onClick={() => setFavSegment('STYLES')}
              className={cn(
                "flex-1 text-center py-1.5 text-xs font-bold rounded-md transition-all duration-150",
                favSegment === 'STYLES' ? "bg-primary text-white" : "text-text-muted hover:text-text-primary"
              )}
            >
              Uslublar
            </button>
            <button
              onClick={() => setFavSegment('BARBERS')}
              className={cn(
                "flex-1 text-center py-1.5 text-xs font-bold rounded-md transition-all duration-150",
                favSegment === 'BARBERS' ? "bg-primary text-white" : "text-text-muted hover:text-text-primary"
              )}
            >
              Sartaroshlar
            </button>
          </div>

          {favSegment === 'STYLES' ? (
            /* Saved Styles Grid */
            savedStyles.length === 0 ? (
              <div className="glass-panel p-8 rounded-xl border border-border-glass text-center text-text-muted text-sm">
                Saqlangan soch uslublari mavjud emas.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedStyles.map((style) => (
                  <div key={style.id} className="glass-panel p-4 rounded-xl border border-border-glass flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img src={style.img} alt={style.name} className="h-14 w-14 rounded-lg object-cover border border-border-glass" />
                      <div>
                        <h4 className="text-sm font-bold text-text-primary">{style.name}</h4>
                        <p className="text-[11px] text-success font-semibold mt-1">{style.match}% Moslik</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeStyle(style.id)}
                      className="h-8 w-8 rounded-lg bg-surface border border-border-glass hover:bg-danger/10 hover:text-danger flex items-center justify-center text-text-muted transition-colors"
                      aria-label="Remove style from favorites"
                    >
                      <HeartOff className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Favorite Barbers Grid */
            favBarbers.length === 0 ? (
              <div className="glass-panel p-8 rounded-xl border border-border-glass text-center text-text-muted text-sm">
                Sevimli sartaroshlar ro'yxati bo'sh.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favBarbers.map((barber) => (
                  <div key={barber.id} className="glass-panel p-4 rounded-xl border border-border-glass flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img src={barber.img} alt={barber.name} className="h-12 w-12 rounded-full object-cover border border-border-glass" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-text-primary">{barber.name}</h4>
                          <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-full">
                            {barber.rank}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-muted mt-1">{barber.rating} yulduzcha • {barber.distance}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeBarber(barber.id)}
                      className="h-8 w-8 rounded-lg bg-surface border border-border-glass hover:bg-danger/10 hover:text-danger flex items-center justify-center text-text-muted transition-colors"
                      aria-label="Remove barber from favorites"
                    >
                      <HeartOff className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      ) : (
        /* ============================================================================
            PROFILE SETTINGS MODULE
           ============================================================================ */
        <form onSubmit={handleSaveSettings} className="glass-panel p-6 sm:p-8 rounded-2xl border border-border-glass space-y-6 max-w-xl">
          <h3 className="font-display text-lg font-bold text-text-primary flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <span>Soch Profili Sozlamalari</span>
          </h3>

          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 p-3 text-xs font-semibold text-success">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Profil ma'lumotlari muvaffaqiyatli saqlandi! Soch tavsiyalari yangilandi.</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Hair Density Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-muted">Soch qalinligi (Density)</label>
              <div className="grid grid-cols-3 gap-2">
                {['THIN', 'NORMAL', 'THICK'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setHairDensity(val)}
                    className={cn(
                      "py-2 text-xs font-bold border rounded-lg transition-all duration-150",
                      hairDensity === val
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border-glass bg-surface/50 text-text-muted hover:text-text-primary"
                    )}
                  >
                    {val === 'THIN' ? 'Siyrak (Thin)' : val === 'NORMAL' ? 'O\'rtacha' : 'Qalin (Thick)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Hair Texture Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-muted">Soch turi (Texture)</label>
              <div className="grid grid-cols-3 gap-2">
                {['STRAIGHT', 'WAVY', 'COILY'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setHairTexture(val)}
                    className={cn(
                      "py-2 text-xs font-bold border rounded-lg transition-all duration-150",
                      hairTexture === val
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border-glass bg-surface/50 text-text-muted hover:text-text-primary"
                    )}
                  >
                    {val === 'STRAIGHT' ? 'Tekis (Straight)' : val === 'WAVY' ? 'To\'lqinli (Wavy)' : 'Jingalak (Coily)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center rounded-md bg-primary hover:bg-primary-hover px-4 py-2.5 text-sm font-semibold text-white shadow-glow-purple transition-all duration-150 active:scale-95"
          >
            Sozlamalarni Saqlash
          </button>
        </form>
      )}
    </div>
  );
}
