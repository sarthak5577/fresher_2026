'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Download, Filter, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface Registration {
  registration_id: string;
  student_name: string;
  department: string;
  college_id: string;
  phone: string;
  email: string;
  payment_status: string;
  entry_status: string;
  entered_at: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-900/30 text-green-400 border-green-700/30',
  pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-700/30',
  failed: 'bg-red-900/30 text-red-400 border-red-700/30',
  refunded: 'bg-blue-900/30 text-blue-400 border-blue-700/30',
};

const ENTRY_COLORS: Record<string, string> = {
  entered: 'bg-green-900/30 text-green-400 border-green-700/30',
  not_entered: 'bg-slate-900/30 text-slate-400 border-slate-700/30',
};

const DEPARTMENTS = ['Computer', 'IT', 'Mechanical', 'Electrical', 'E&TC', 'AIDS'];

export default function StudentsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [entryFilter, setEntryFilter] = useState('');
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const limit = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(deptFilter && { department: deptFilter }),
        ...(paymentFilter && { paymentStatus: paymentFilter }),
        ...(entryFilter && { entryStatus: entryFilter }),
      });

      const res = await fetch(`/api/admin/registrations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.data || []);
        setTotal(data.count || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, deptFilter, paymentFilter, entryFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  const handleExport = () => {
    window.open('/api/admin/export?format=csv', '_blank');
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Student Registrations</h1>
          <p className="text-slate-400 text-sm">{total} total registrations</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-green-600/20 hover:bg-green-600/30 border border-green-700/30 text-green-400 text-sm font-medium px-4 py-2.5 rounded-xl transition-all"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, college ID, registration ID..."
            className="w-full bg-[#0d0220] border border-purple-900/40 rounded-xl py-2.5 pl-9 pr-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            className="bg-[#0d0220] border border-purple-900/40 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">All Depts</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
            className="bg-[#0d0220] border border-purple-900/40 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={entryFilter}
            onChange={(e) => { setEntryFilter(e.target.value); setPage(1); }}
            className="bg-[#0d0220] border border-purple-900/40 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">All Entry Status</option>
            <option value="entered">Entered</option>
            <option value="not_entered">Not Entered</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full admin-table">
            <thead>
              <tr>
                <th className="text-left">#</th>
                <th className="text-left">Registration ID</th>
                <th className="text-left">Name</th>
                <th className="text-left">Dept</th>
                <th className="text-left">College ID</th>
                <th className="text-left">Payment</th>
                <th className="text-left">Entry</th>
                <th className="text-left">Date</th>
                <th className="text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full spinner mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    No registrations found.
                  </td>
                </tr>
              ) : (
                registrations.map((reg, idx) => (
                  <tr key={reg.registration_id}>
                    <td className="text-slate-500">{(page - 1) * limit + idx + 1}</td>
                    <td className="font-mono text-xs text-purple-300">{reg.registration_id}</td>
                    <td className="font-medium">{reg.student_name}</td>
                    <td>{reg.department}</td>
                    <td className="font-mono text-xs">{reg.college_id}</td>
                    <td>
                      <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[reg.payment_status] || ''}`}>
                        {reg.payment_status}
                      </span>
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-1 rounded-full border ${ENTRY_COLORS[reg.entry_status] || ''}`}>
                        {reg.entry_status === 'entered' ? '✓ Entered' : 'Pending'}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500">
                      {formatDate(reg.created_at)}
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedReg(reg)}
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-purple-900/20">
            <span className="text-slate-500 text-sm">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-purple-900/40 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 rounded-lg bg-purple-900/20 text-white text-sm">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-purple-900/40 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedReg && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReg(null)}>
          <div
            className="glass rounded-2xl p-6 max-w-md w-full border border-purple-700/30"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-lg mb-4">Registration Details</h3>
            <div className="space-y-3">
              {[
                ['Registration ID', selectedReg.registration_id],
                ['Student Name', selectedReg.student_name],
                ['Department', selectedReg.department],
                ['College ID', selectedReg.college_id],
                ['Phone', selectedReg.phone],
                ['Email', selectedReg.email],
                ['Payment Status', selectedReg.payment_status.toUpperCase()],
                ['Entry Status', selectedReg.entry_status],
                ['Entry Time', selectedReg.entered_at ? formatDate(selectedReg.entered_at) : 'N/A'],
                ['Registered On', formatDate(selectedReg.created_at)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-white font-medium text-right break-all">{value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSelectedReg(null)}
              className="mt-6 w-full py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-xl text-sm font-medium transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

