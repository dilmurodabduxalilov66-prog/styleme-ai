'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Mail, Phone, Clock, AlertCircle } from 'lucide-react';
import { api } from '@/lib/axios';

interface Barber {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string | null;
  lastActive: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function BarbersPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBarber, setNewBarber] = useState({ firstName: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBarbers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/barbers');
      setBarbers(data);
    } catch (err) {
      console.error('Failed to load barbers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbers();
  }, []);

  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/admin/barbers', {
        first_name: newBarber.firstName,
        email: newBarber.email,
        password: newBarber.password
      });
      setIsModalOpen(false);
      setNewBarber({ firstName: '', email: '', password: '' });
      fetchBarbers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Sartarosh qo`shishda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeBarber = async (id: string) => {
    if (!window.confirm("Sartaroshni lavozimidan olib tashlashni xohlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.")) return;
    
    setActionLoading(id);
    try {
      await api.delete(`/admin/barbers/${id}/role`);
      fetchBarbers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBarbers = barbers.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Sartaroshlarni Boshqarish</h1>
          <p className="text-text-muted mt-1">Platformadagi barcha ustalar va salonlarni boshqaring</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Yangi Sartarosh Qo'shish
        </button>
      </div>

      <div className="glass-panel p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
          <input
            type="text"
            placeholder="Ism yoki email bo'yicha qidiring..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-text-muted">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
            Yuklanmoqda...
          </div>
        ) : filteredBarbers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-text-muted">
            Sartaroshlar topilmadi
          </div>
        ) : (
          filteredBarbers.map(barber => (
            <div key={barber.id} className="glass-panel p-6 flex flex-col h-full hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {barber.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{barber.name}</h3>
                    <p className="text-sm text-text-muted">{barber.businessName}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${barber.status === 'ACTIVE' ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'}`}>
                  {barber.status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
                </span>
              </div>
              
              <div className="space-y-2 mb-6 flex-1">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{barber.email}</span>
                </div>
                {barber.phone && (
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Phone className="h-4 w-4" />
                    <span>{barber.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Clock className="h-4 w-4" />
                  <span>Ro'yxatdan o'tgan: {new Date(barber.lastActive).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border-glass mt-auto flex justify-end">
                <button 
                  onClick={() => handleRevokeBarber(barber.id)}
                  disabled={actionLoading === barber.id}
                  className="text-xs font-semibold text-danger hover:text-danger-hover transition-colors flex items-center gap-1.5"
                >
                  <AlertCircle className="h-3 w-3" />
                  {actionLoading === barber.id ? 'Olib tashlanmoqda...' : 'Lavozimidan olish'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4">Yangi Sartarosh Qo'shish</h2>
            
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <form onSubmit={handleAddBarber} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Ism / Salon Nomi</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newBarber.firstName}
                  onChange={(e) => setNewBarber({...newBarber, firstName: e.target.value})}
                  placeholder="Masalan: Sardor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  value={newBarber.email}
                  onChange={(e) => setNewBarber({...newBarber, email: e.target.value})}
                  placeholder="sardor@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Vaqtinchalik Parol</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="input-field"
                  value={newBarber.password}
                  onChange={(e) => setNewBarber({...newBarber, password: e.target.value})}
                  placeholder="Parolni kiriting"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-outline"
                  disabled={submitting}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? 'Qo`shilmoqda...' : 'Sartarosh yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
