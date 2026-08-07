'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/axios';
import { Save, Loader2, MapPin } from 'lucide-react';

// Dynamically import MapSelector with SSR disabled because leaflet needs window
const MapSelector = dynamic(() => import('@/components/MapSelector'), {
  ssr: false,
  loading: () => <div className="h-full w-full min-h-[300px] bg-bg-surface animate-pulse rounded-lg flex items-center justify-center text-text-muted">Xarita yuklanmoqda...</div>
});

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    business_name: '',
    address: '',
    bio: '',
    latitude: 41.2995, // Default: Tashkent
    longitude: 69.2401,
    profile_image_url: '',
    base_price: 50000
  });

  const [verificationStatus, setVerificationStatus] = useState<'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'>('NONE');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState('');
  const [submittingDoc, setSubmittingDoc] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/barbers/availability/profile');
      if (res.data) {
        setFormData({
          business_name: res.data.business_name || '',
          address: res.data.address || '',
          bio: res.data.bio || '',
          latitude: res.data.latitude ? parseFloat(res.data.latitude) : 41.2995,
          longitude: res.data.longitude ? parseFloat(res.data.longitude) : 69.2401,
          profile_image_url: res.data.profile_image_url || '',
          base_price: res.data.base_price !== undefined ? parseInt(res.data.base_price) : 50000
        });
        
        setVerificationStatus(res.data.verification_status || 'NONE');
        setRejectionReason(res.data.rejection_reason || null);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
      alert('Profil ma\'lumotlarini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/barbers/availability/profile', formData);
      alert('Profil muvaffaqiyatli saqlandi');
    } catch (err) {
      console.error('Failed to save profile', err);
      alert('Profilni saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDocSubmit = async () => {
    if (!docUrl) return alert("Iltimos hujjat linkini kiriting");
    try {
      setSubmittingDoc(true);
      await api.post('/barbers/availability/verify', { document_url: docUrl });
      alert("Hujjat muvaffaqiyatli yuborildi!");
      setVerificationStatus('PENDING');
      setRejectionReason(null);
    } catch (err) {
      console.error('Failed to submit document', err);
      alert('Hujjatni yuborishda xatolik yuz berdi');
    } finally {
      setSubmittingDoc(false);
    }
  };

  const handleMapChange = async (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        setFormData(prev => ({ ...prev, address: data.display_name }));
      }
    } catch (error) {
      console.error("Geocoding failed", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Yuklashda xatolik');
      const data = await res.json();
      
      setFormData(prev => ({ ...prev, profile_image_url: data.url }));
    } catch (err) {
      console.error(err);
      alert('Rasmni yuklashda xatolik yuz berdi');
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Profil Sozlamalari</h1>
        <p className="text-text-muted mt-1">Sartaroshxona nomi, manzil va boshqa ma'lumotlarni o'zgartiring</p>
      </div>

      <div className="glass-panel p-6 rounded-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex gap-4 items-center mb-2">
              <div className="w-16 h-16 rounded-full bg-surface border border-border-glass overflow-hidden flex items-center justify-center shrink-0">
                {formData.profile_image_url ? (
                  <img src={formData.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-text-muted text-[10px]">Rasm yo'q</span>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-secondary mb-1">Profil rasmi yuklash (JPEG/PNG)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="input-field w-full"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                {uploadingImage && <p className="text-xs text-primary mt-1 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Yuklanmoqda...</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Sartaroshxona nomi</label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="Masalan: Elite Barbershop"
                value={formData.business_name}
                onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Xizmat narxi (UZS)</label>
              <input
                type="number"
                className="input-field w-full"
                placeholder="Masalan: 50000"
                value={formData.base_price}
                onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Aniq manzil matni</label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="Masalan: Chilonzor, 5-daha, 12-uy"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">O'zingiz va xizmatlar haqida (Bio)</label>
              <textarea
                className="input-field w-full min-h-[120px] resize-none"
                placeholder="Qisqacha ma'lumot qoldiring..."
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-4 flex flex-col h-full">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> 
                Xaritadan belgilash
              </label>
              <p className="text-xs text-text-muted mb-2">Mijozlar sizni xaritadan oson topishi uchun aniq joylashuvni belgilang.</p>
            </div>
            <div className="flex-1 min-h-[300px]">
              <MapSelector 
                initialPosition={[formData.latitude, formData.longitude]} 
                onPositionChange={handleMapChange} 
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border-glass">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Saqlash
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-xl space-y-6 mt-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Akkountni Tasdiqlash</h2>
          <p className="text-sm text-text-muted mt-1">Mijozlar qidiruvida chiqish uchun profilingiz ma'muriyat tomonidan tasdiqlanishi kerak.</p>
        </div>

        <div className="flex items-center gap-3">
          Status: 
          {verificationStatus === 'NONE' && <span className="px-2 py-1 bg-surface text-text-muted rounded text-xs font-bold border border-border-glass">Tasdiqlanmagan</span>}
          {verificationStatus === 'PENDING' && <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-bold border border-primary/30">Ko'rib chiqilmoqda</span>}
          {verificationStatus === 'APPROVED' && <span className="px-2 py-1 bg-success/20 text-success rounded text-xs font-bold border border-success/30">Tasdiqlangan</span>}
          {verificationStatus === 'REJECTED' && <span className="px-2 py-1 bg-danger/20 text-danger rounded text-xs font-bold border border-danger/30">Rad etilgan</span>}
        </div>

        {rejectionReason && (
          <div className="p-3 bg-danger/10 border border-danger/30 text-danger text-sm rounded">
            <strong>Rad etish sababi:</strong> {rejectionReason}
          </div>
        )}

        {(verificationStatus === 'NONE' || verificationStatus === 'REJECTED') && (
          <div className="space-y-4 pt-4 border-t border-border-glass">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Sertifikat yoki diplom URL manzili (JPEG/PNG)</label>
              <div className="flex gap-4">
                <input
                  type="text"
                  className="input-field flex-1"
                  placeholder="https://example.com/certificate.jpg"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                />
                <button
                  onClick={handleDocSubmit}
                  disabled={submittingDoc || !docUrl}
                  className="btn-primary flex items-center gap-2"
                >
                  {submittingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yuborish'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
