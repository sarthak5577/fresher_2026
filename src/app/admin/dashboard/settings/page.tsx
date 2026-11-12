'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, CheckCircle, AlertCircle, Calendar, MapPin, Users, ToggleLeft, Info } from 'lucide-react';

interface Settings {
  event_name: string;
  event_date: string;
  event_venue: string;
  maximum_capacity: number;
  registration_open: boolean;
  departments: string[];
  contact_email: string;
  contact_phone: string;
  event_description: string;
}

export default function EventSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    event_name: 'Freshers 2026',
    event_date: 'TBA',
    event_venue: 'TBA',
    maximum_capacity: 1000,
    registration_open: true,
    departments: ['Computer', 'IT', 'Mechanical', 'Electrical', 'E&TC', 'AIDS'],
    contact_email: '',
    contact_phone: '',
    event_description: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data) setSettings(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully! Changes are live on the public website.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full bg-[#0d0220] border border-purple-900/40 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-400 spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-white">Event Settings</h1>
        <p className="text-slate-400 text-sm">Changes are reflected on the public website instantly.</p>
      </div>

      <div className="glass rounded-2xl p-6 border border-blue-900/30 bg-blue-900/5">
        <div className="flex items-center gap-2 text-blue-400 text-sm">
          <Info className="w-4 h-4" />
          <span>Registration Fee (₹300) cannot be changed here as it affects existing orders. Contact the developer to update it.</span>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          message.type === 'success'
            ? 'bg-green-900/20 border-green-700/30 text-green-300'
            : 'bg-red-900/20 border-red-700/30 text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      <div className="glass rounded-2xl p-6 space-y-6">
        {/* Basic info */}
        <div>
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" /> Event Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Event Name</label>
              <input
                type="text"
                value={settings.event_name}
                onChange={(e) => setSettings({ ...settings, event_name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Event Date
                  <span className="text-slate-500 text-xs ml-2">(Enter "TBA" if not set)</span>
                </label>
                <input
                  type="text"
                  value={settings.event_date}
                  onChange={(e) => setSettings({ ...settings, event_date: e.target.value })}
                  className={inputClass}
                  placeholder="TBA or actual date"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Venue
                  <span className="text-slate-500 text-xs ml-2">(Enter "TBA" if not set)</span>
                </label>
                <input
                  type="text"
                  value={settings.event_venue}
                  onChange={(e) => setSettings({ ...settings, event_venue: e.target.value })}
                  className={inputClass}
                  placeholder="TBA or actual venue"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Event Description</label>
              <textarea
                value={settings.event_description}
                onChange={(e) => setSettings({ ...settings, event_description: e.target.value })}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Brief description shown on the public website..."
              />
            </div>
          </div>
        </div>

        {/* Registration control */}
        <div className="border-t border-purple-900/30 pt-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> Registration Control
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-purple-900/10 rounded-xl border border-purple-900/30">
              <div>
                <div className="text-white font-medium">Registration Status</div>
                <div className="text-slate-400 text-sm">
                  {settings.registration_open ? 'Currently accepting registrations' : 'Registration is closed'}
                </div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, registration_open: !settings.registration_open })}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  settings.registration_open
                    ? 'bg-green-900/30 border border-green-700/30 text-green-400'
                    : 'bg-red-900/30 border border-red-700/30 text-red-400'
                }`}
              >
                <ToggleLeft className="w-4 h-4" />
                {settings.registration_open ? 'Open' : 'Closed'}
              </button>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Maximum Capacity</label>
              <input
                type="number"
                value={settings.maximum_capacity}
                onChange={(e) => setSettings({ ...settings, maximum_capacity: parseInt(e.target.value) || 1000 })}
                className={inputClass}
                min={1}
                max={10000}
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="border-t border-purple-900/30 pt-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-pink-400" /> Contact Information
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Contact Email</label>
              <input
                type="email"
                value={settings.contact_email}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                className={inputClass}
                placeholder="coordinator@jsce.edu.in"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Contact Phone</label>
              <input
                type="text"
                value={settings.contact_phone}
                onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                className={inputClass}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="border-t border-purple-900/30 pt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-70 text-white font-bold py-3.5 px-8 rounded-xl btn-glow transition-all"
          >
            {saving ? <Loader2 className="w-5 h-5 spinner" /> : <Save className="w-5 h-5" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
