'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, RefreshCw, Clock, User, Building, Hash, Phone, Mail } from 'lucide-react';

interface PendingRegistration {
  registration_id: string;
  student_name: string;
  department: string;
  college_id: string;
  phone: string;
  email: string;
  paytm_order_id: string | null;
  created_at: string;
}

export default function VerifyPaymentsPage() {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [utrInputs, setUtrInputs] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pending-payments');
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.registrations || []);
        setTotal(data.total || 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  const handleAction = async (registrationId: string, action: 'approve' | 'reject') => {
    setProcessing(registrationId);
    try {
      const res = await fetch('/api/admin/approve-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          action,
          utrNumber: utrInputs[registrationId] || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          action === 'approve'
            ? `✅ Payment approved for ${registrationId}. Email sent!`
            : `❌ Payment rejected for ${registrationId}.`,
          action === 'approve' ? 'success' : 'error'
        );
        fetchPending();
      } else {
        showToast(data.error || 'Action failed', 'error');
      }
    } catch {
      showToast('Network error. Try again.', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl text-white font-medium text-sm transition-all ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Verify Payments</h1>
          <p className="text-slate-400 text-sm mt-1">
            {total > 0 ? (
              <span className="text-yellow-400 font-medium">{total} pending verification</span>
            ) : (
              'No pending payments'
            )}
            {' — '}Auto-refreshes every 30s
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchPending(); }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-900/40 rounded-xl text-sm text-slate-300 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
        <h3 className="text-blue-300 font-semibold text-sm mb-2">📋 Verification Process</h3>
        <ol className="text-slate-400 text-xs space-y-1 list-decimal list-inside">
          <li>Student shows UPI payment screenshot or UTR number</li>
          <li>Check ₹300 received on your UPI app (PhonePe / GPay / Paytm)</li>
          <li>Enter the UTR number in the field below (optional but recommended)</li>
          <li>Click <strong className="text-green-400">Approve</strong> → system auto-generates ticket & sends email</li>
        </ol>
      </div>

      {/* Loading */}
      {loading && registrations.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : registrations.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle className="w-16 h-16 text-green-400/40 mx-auto mb-4" />
          <p className="text-slate-400 text-lg font-medium">All caught up!</p>
          <p className="text-slate-600 text-sm">No pending payments to verify.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => (
            <div
              key={reg.registration_id}
              className="glass-card bg-[#0f0528]/60 border border-purple-900/30 rounded-xl p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Student Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <span className="text-yellow-400 text-xs font-medium">{formatDate(reg.created_at)}</span>
                    <span className="ml-auto text-xs font-mono text-slate-500">{reg.registration_id}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <span className="text-white text-sm font-medium">{reg.student_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">{reg.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <span className="text-slate-300 text-sm font-mono">{reg.college_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">{reg.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <Mail className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">{reg.email}</span>
                    </div>
                    {reg.paytm_order_id && (
                      <div className="sm:col-span-2">
                        <span className="text-xs text-slate-500">Order ID: </span>
                        <span className="text-xs font-mono text-slate-400">{reg.paytm_order_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 lg:min-w-56">
                  <input
                    type="text"
                    placeholder="UTR Number (optional)"
                    value={utrInputs[reg.registration_id] || ''}
                    onChange={(e) => setUtrInputs(prev => ({ ...prev, [reg.registration_id]: e.target.value }))}
                    className="px-3 py-2 bg-purple-900/20 border border-purple-900/30 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(reg.registration_id, 'approve')}
                      disabled={processing === reg.registration_id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all"
                    >
                      {processing === reg.registration_id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(reg.registration_id, 'reject')}
                      disabled={processing === reg.registration_id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-900/40 hover:bg-red-700/60 disabled:opacity-50 text-red-300 hover:text-white text-sm font-semibold rounded-lg transition-all border border-red-700/30"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
