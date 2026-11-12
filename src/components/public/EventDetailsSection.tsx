import {
  Calendar, MapPin, IndianRupee, Building2,
  Users, Clock, CheckCircle,
} from 'lucide-react';
import type { EventSettings } from '@/types/database';

interface EventDetailsSectionProps {
  settings: Partial<EventSettings>;
}

export default function EventDetailsSection({ settings }: EventDetailsSectionProps) {
  const details = [
    {
      icon: Building2,
      label: 'College',
      value: settings.college_name || 'Jayawantrao Sawant College of Engineering',
      color: 'text-purple-400',
      bg: 'bg-purple-900/20',
      border: 'border-purple-700/30',
    },
    {
      icon: Calendar,
      label: 'Event Date',
      value: settings.event_date === 'TBA' || !settings.event_date
        ? 'To Be Announced'
        : settings.event_date,
      isTBA: !settings.event_date || settings.event_date === 'TBA',
      color: 'text-blue-400',
      bg: 'bg-blue-900/20',
      border: 'border-blue-700/30',
    },
    {
      icon: MapPin,
      label: 'Venue',
      value: settings.event_venue === 'TBA' || !settings.event_venue
        ? 'To Be Announced'
        : settings.event_venue,
      isTBA: !settings.event_venue || settings.event_venue === 'TBA',
      color: 'text-pink-400',
      bg: 'bg-pink-900/20',
      border: 'border-pink-700/30',
    },
    {
      icon: IndianRupee,
      label: 'Registration Fee',
      value: `₹${(settings.registration_fee || 30000) / 100} per student`,
      color: 'text-green-400',
      bg: 'bg-green-900/20',
      border: 'border-green-700/30',
    },
    {
      icon: Users,
      label: 'Maximum Capacity',
      value: `${settings.maximum_capacity || 1000} Students`,
      color: 'text-yellow-400',
      bg: 'bg-yellow-900/20',
      border: 'border-yellow-700/30',
    },
    {
      icon: Clock,
      label: 'Registration Status',
      value: settings.registration_open ? 'Open Now' : 'Closed',
      color: settings.registration_open ? 'text-green-400' : 'text-red-400',
      bg: settings.registration_open ? 'bg-green-900/20' : 'bg-red-900/20',
      border: settings.registration_open ? 'border-green-700/30' : 'border-red-700/30',
    },
  ];

  const departments = settings.departments || ['Computer', 'IT', 'Mechanical', 'Electrical', 'E&TC', 'AIDS'];

  return (
    <section id="event-details" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-700/30 px-4 py-2 rounded-full mb-6">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">Event Details</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Everything You Need to{' '}
            <span className="gradient-text">Know</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            All the essential information about Freshers 2026 at JSCE.
          </p>
        </div>

        {/* Details grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {details.map((detail) => {
            const Icon = detail.icon;
            return (
              <div
                key={detail.label}
                className={`${detail.bg} border ${detail.border} rounded-2xl p-6 card-hover`}
              >
                <Icon className={`w-8 h-8 ${detail.color} mb-4`} />
                <div className="text-slate-400 text-sm mb-1">{detail.label}</div>
                <div className={`text-lg font-bold ${detail.isTBA ? 'text-slate-500 italic' : 'text-white'}`}>
                  {detail.value}
                </div>
                {detail.isTBA && (
                  <div className="mt-2 text-xs text-yellow-500/80 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Will be updated soon
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Departments */}
        <div className="glass rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Participating Departments</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {departments.map((dept) => (
              <div
                key={dept}
                className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-700/30 rounded-xl p-4 text-center card-hover"
              >
                <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-2" />
                <div className="text-white font-semibold text-sm">{dept}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

