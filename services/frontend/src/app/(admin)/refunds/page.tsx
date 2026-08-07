'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface RefundRequest {
  id: string;
  booking_id: string;
  user_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  amount_to_refund: string;
  created_at: string;
  price: string;
  scheduled_start: string;
  first_name: string;
  last_name: string;
}

export default function AdminRefundsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'OWNER') {
      router.push('/dashboard');
      return;
    }
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/bookings/admin/refunds');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      alert("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Haqiqatdan ham pulni (80%) qaytarmoqchimisiz?')) return;
    setActionId(id);
    try {
      await api.post(`/bookings/admin/refunds/${id}/approve`);
      alert('Pul muvaffaqiyatli qaytarildi');
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setActionId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-text-muted">Arizalar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Pul qaytarish arizalari</h1>
          <p className="text-sm text-text-muted mt-1">Mijozlar tomonidan qoldirilgan 80% pul qaytarish talablari</p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border-glass rounded-lg hover:bg-border-base transition-colors text-sm font-semibold text-text-primary"
        >
          <RefreshCw className="h-4 w-4" />
          Yangilash
        </button>
      </div>

      <div className="glass-panel overflow-hidden border border-border-glass rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface/50 text-text-muted text-xs uppercase tracking-wider border-b border-border-glass">
                <th className="px-6 py-4 font-semibold">Mijoz</th>
                <th className="px-6 py-4 font-semibold">Uchrashuv Vaqti</th>
                <th className="px-6 py-4 font-semibold">To'langan Summa</th>
                <th className="px-6 py-4 font-semibold">Qaytariladigan (80%)</th>
                <th className="px-6 py-4 font-semibold">Ariza Vaqti</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Harakatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-glass">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-surface/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                    {req.first_name} {req.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                    {new Date(req.scheduled_start).toLocaleString('uz-UZ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                    {parseFloat(req.price).toLocaleString()} UZS
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                    {parseFloat(req.amount_to_refund).toLocaleString()} UZS
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                    {new Date(req.created_at).toLocaleString('uz-UZ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        req.status === 'PENDING'
                          ? 'bg-warning/10 text-warning border border-warning/20'
                          : req.status === 'APPROVED'
                          ? 'bg-success/10 text-success border border-success/20'
                          : 'bg-danger/10 text-danger border border-danger/20'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {req.status === 'PENDING' && (
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={actionId === req.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50"
                      >
                        {actionId === req.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" /> Tasdiqlash (Qaytarish)
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-text-muted">
                    Arizalar topilmadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
