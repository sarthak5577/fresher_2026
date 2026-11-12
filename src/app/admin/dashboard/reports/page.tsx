'use client';

import { Download, FileText, Users, IndianRupee } from 'lucide-react';

export default function ReportsPage() {
  const handleDownload = (type: string) => {
    window.open(`/api/admin/export?format=${type}`, '_blank');
  };

  const reports = [
    {
      title: 'All Registrations (CSV)',
      desc: 'Complete list of all student registrations with payment and entry status.',
      icon: Users,
      action: () => handleDownload('csv'),
      color: 'text-purple-400',
      bg: 'bg-purple-900/20',
      border: 'border-purple-700/30',
    },
    {
      title: 'Paid Students Report',
      desc: 'List of all students with confirmed payment.',
      icon: IndianRupee,
      action: () => window.open('/api/admin/export?format=csv&filter=paid', '_blank'),
      color: 'text-green-400',
      bg: 'bg-green-900/20',
      border: 'border-green-700/30',
    },
    {
      title: 'Entry Report',
      desc: 'Students who have entered the event and timestamp.',
      icon: FileText,
      action: () => window.open('/api/admin/export?format=csv&filter=entered', '_blank'),
      color: 'text-blue-400',
      bg: 'bg-blue-900/20',
      border: 'border-blue-700/30',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Reports & Exports</h1>
        <p className="text-slate-400 text-sm">Download data exports for Freshers 2026.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.title} className={`glass rounded-2xl p-6 border ${report.border} ${report.bg} card-hover`}>
              <Icon className={`w-8 h-8 ${report.color} mb-4`} />
              <h3 className="text-white font-semibold mb-2">{report.title}</h3>
              <p className="text-slate-400 text-sm mb-5 leading-relaxed">{report.desc}</p>
              <button
                onClick={report.action}
                className={`flex items-center gap-2 ${report.color} text-sm font-medium hover:underline`}
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

