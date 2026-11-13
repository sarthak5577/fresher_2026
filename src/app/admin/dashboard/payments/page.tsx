'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Payment {
  id: string;
  registration_id: string;
  utr_number?: string | null;
  paytm_order_id?: string | null;
  paytm_txn_id?: string | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  verified_at: string | null;
  created_at: string;
  registrations?: { student_name: string; department: string; college_id: string };
}

const STATUS_COLORS: Record<string, string> = {
  captured: 'bg-green-900/30 text-green-400 border-green-700/30',
  created: 'bg-yellow-900/30 text-yellow-400 border-yellow-700/30',
  failed: 'bg-red-900/30 text-red-400 border-red-700/30',
  refunded: 'bg-blue-900/30 text-blue-400 border-blue-700/30',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payments?page=${page}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.data || []);
        setTotal(data.count || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Payment Records</h1>
        <p className="text-slate-400 text-sm">{total} total payment transactions</p>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full admin-table">
            <thead>
              <tr>
                <th className="text-left">#</th>
                <th className="text-left">Student</th>
                <th className="text-left">Registration ID</th>
                <th className="text-left">UTR / Transaction ID</th>
                <th className="text-left">Amount</th>
                <th className="text-left">Method</th>
                <th className="text-left">Status</th>
                <th className="text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500">Loading...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500">No payments found.</td></tr>
              ) : (
                payments.map((p, idx) => (
                  <tr key={p.id}>
                    <td className="text-slate-500">{(page - 1) * limit + idx + 1}</td>
                    <td>
                      <div className="text-white font-medium">{p.registrations?.student_name || '-'}</div>
                      <div className="text-slate-500 text-xs">{p.registrations?.department}</div>
                    </td>
                    <td className="font-mono text-xs text-purple-300 font-semibold">{p.registration_id}</td>
                    <td className="font-mono text-xs text-amber-300 font-semibold">
                      {p.utr_number || p.paytm_txn_id || p.razorpay_payment_id || '-'}
                    </td>
                    <td className="text-green-400 font-semibold">₹{p.amount / 100}</td>
                    <td className="text-slate-400 capitalize">{p.payment_method || '-'}</td>
                    <td>
                      <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[p.status] || ''}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500">{formatDate(p.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-purple-900/20">
            <span className="text-slate-500 text-sm">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-purple-900/40 text-slate-400 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 rounded-lg bg-purple-900/20 text-white text-sm">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-purple-900/40 text-slate-400 hover:text-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

