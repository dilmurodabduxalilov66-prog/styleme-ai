'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldAlert, 
  Check, 
  Search, 
  RefreshCw,
  Mail,
  Lock
} from 'lucide-react';
import { api } from '@/lib/axios';
import { cn } from '@/utils/cn';

interface AdminOperator {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  lastActive: string;
}

export default function OwnerAdminsPage() {
  const [admins, setAdmins] = useState<AdminOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Admin Form States
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/users');
      if (data) {
        setAdmins(data);
      }
    } catch (err) {
      console.error('Owner admins API error:', err);
      setError("Adminlarni yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName || !newAdminEmail || !newAdminPassword) return;

    try {
      const { data } = await api.post('/admin/users', {
        first_name: newAdminName,
        email: newAdminEmail,
        password: newAdminPassword,
        role: 'ADMIN'
      });

      const newAdmin: AdminOperator = {
        id: data?.user?.id || data?.id || `adm-pending`,
        name: newAdminName,
        email: newAdminEmail,
        phone: newAdminEmail,
        role: 'ADMIN',
        status: 'ACTIVE',
        lastActive: 'Bugun'
      };

      setAdmins([...admins, newAdmin]);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setSuccessMsg("Yangi admin operatori qo'shildi!");
      setTimeout(() => setSuccessMsg(null), 2000);

    } catch (err) {
      console.error('Owner create admin API error:', err);
      alert('Admin yaratishda xatolik yuz berdi');
    }
  };

  const handleRevokeAdmin = async (id: string) => {
    if (!confirm("Ushbu admin profilini o'chirishni (huquqlarini bekor qilish) tasdiqlaysizmi?")) return;

    try {
      await api.delete(`/admin/users/${id}/role`);
      setAdmins(admins.filter(a => a.id !== id));
      setSuccessMsg("Admin huquqlari bekor qilindi.");
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (err) {
      console.error('Owner revoke admin API error:', err);
      alert('Admin huquqlarini bekor qilishda xatolik');
    }
  };

  const filteredAdmins = admins.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 text-text-primary">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-text-primary to-primary bg-clip-text text-transparent">
          Adminlar Boshqaruvi
        </h1>
        <p className="text-xs text-text-muted mt-1">Platformadagi verifikatsiya va moderatsiya operatsiyalari adminlari ro'yxati</p>
      </div>

      {successMsg && (
        <div className="p-3 bg-success/15 border border-success/20 rounded-lg text-success text-xs font-semibold text-center animate-pulse">
          {successMsg}
        </div>
      )}

      {/* Grid splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Admins directory list */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 bg-surface/40 p-1 rounded-lg border border-border-glass">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="Admin nomi yoki email qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 h-9 rounded bg-surface border border-border-glass text-xs placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>
            <button
              onClick={fetchAdmins}
              className="p-2 bg-surface hover:bg-border-glass border border-border-glass rounded text-text-muted hover:text-text-primary"
              aria-label="Refresh admins"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="text-center py-12 text-xs text-text-muted italic border border-dashed border-border-glass rounded-xl">
                Qidiruv natijasida adminlar topilmadi.
              </div>
            ) : (
              filteredAdmins.map(admin => (
                <div key={admin.id} className="glass-panel border border-border-glass rounded-xl p-4 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                      <Users className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary">{admin.name}</h4>
                      <p className="text-[9px] text-text-muted">{admin.email} • faol: {new Date(admin.lastActive).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeAdmin(admin.id)}
                    className="p-2 bg-surface hover:bg-danger/10 border border-border-glass hover:border-danger/35 text-text-muted hover:text-danger rounded transition-all cursor-pointer"
                    title="Admin huquqlarini bekor qilish"
                    aria-label="Revoke admin operator rights"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Create Admin Form */}
        <div className="lg:col-span-5">
          <div className="glass-panel border border-border-glass rounded-2xl p-5 bg-surface/50 space-y-4 text-xs">
            <h3 className="font-display text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="h-4.5 w-4.5 text-primary" />
              <span>Yangi Admin Operator Qo'shish</span>
            </h3>

            <form onSubmit={handleAddAdmin} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[10px] text-text-muted">Ism sharifi:</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Aziz Qodirov"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full px-3 h-9 rounded bg-surface border border-border-glass text-xs placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-text-muted">Email pochtasi:</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                  <input
                    type="email"
                    required
                    placeholder="example@styleme.uz"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full pl-8 pr-3 h-9 rounded bg-surface border border-border-glass text-xs placeholder:text-text-muted focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-text-muted">Maxfiy parol:</label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full pl-8 pr-3 h-9 rounded bg-surface border border-border-glass text-xs placeholder:text-text-muted focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded bg-primary hover:bg-primary-hover py-2.5 text-xs font-bold text-white shadow-glow-purple transition-all active:scale-95 cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>Admin qo'shish</span>
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
