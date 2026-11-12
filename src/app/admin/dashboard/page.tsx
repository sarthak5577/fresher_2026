'use client';

import { useEffect, useState } from 'react';
import { Users, CheckCircle, Clock, XCircle, IndianRupee, DoorOpen, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Stats {
  total: number;
  paid: number;
  pending: number;
  failed: number;
  entered: number;
  remaining: number;
  totalCaptured: number;
  netCollection: number;
  departmentStats: Record<string, number>;
}

const COLORS = ['#7c3aed', '#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const statCards = stats
    ? [
        { label: 'Total Registrations', value: stats.total, icon: Users, color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-700/30' },
        { label: 'Paid', value: stats.paid, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-700/30' },
        { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-700/30' },
        { label: 'Failed', value: stats.failed, icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-700/30' },
        { label: 'Students Entered', value: stats.entered, icon: DoorOpen, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-700/30' },
        { label: 'Not Yet Entered', value: stats.remaining, icon: TrendingUp, color: 'text-pink-400', bg: 'bg-pink-900/20', border: 'border-pink-700/30' },
      ]
    : [];

  const deptChartData = stats
    ? Object.entries(stats.departmentStats).map(([name, value]) => ({ name, value }))
    : [];

  const paymentPieData = stats
    ? [
        { name: 'Paid', value: stats.paid },
        { name: 'Pending', value: stats.pending },
        { name: 'Failed', value: stats.failed },
      ].filter((d) => d.value > 0)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full spinner mx-auto mb-3" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Dashboard Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time statistics for Freshers 2026</p>
      </div>

      {/* Collection summary */}
      {stats && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-6 border border-green-700/30 bg-green-900/10">
            <div className="flex items-center gap-3 mb-2">
              <IndianRupee className="w-6 h-6 text-green-400" />
              <span className="text-slate-400 text-sm">Total Captured</span>
            </div>
            <div className="text-3xl font-black text-green-400">
              ₹{stats.totalCaptured.toLocaleString('en-IN')}
            </div>
            <div className="text-slate-500 text-xs mt-1">From {stats.paid} verified payments</div>
          </div>
          <div className="glass rounded-2xl p-6 border border-blue-700/30 bg-blue-900/10">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <span className="text-slate-400 text-sm">Net Collection</span>
            </div>
            <div className="text-3xl font-black text-blue-400">
              ₹{stats.netCollection.toLocaleString('en-IN')}
            </div>
            <div className="text-slate-500 text-xs mt-1">After refunds</div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`glass rounded-2xl p-5 border ${card.border} ${card.bg}`}>
              <div className="flex items-start justify-between mb-3">
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div className={`text-3xl font-black ${card.color} mb-1`}>{card.value}</div>
              <div className="text-slate-500 text-xs">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      {deptChartData.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Department chart */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">Registrations by Department</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1a0533', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#a855f7' }}
                />
                <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Payment status pie */}
          {paymentPieData.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Payment Status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={paymentPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {paymentPieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a0533', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {!stats && (
        <div className="glass rounded-2xl p-8 text-center border border-purple-900/30">
          <p className="text-slate-400">No statistics available yet. Data will appear after first registrations.</p>
        </div>
      )}
    </div>
  );
}

