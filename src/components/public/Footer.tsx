import Link from 'next/link';
import { GraduationCap, Mail, Phone, Heart } from 'lucide-react';
import type { EventSettings } from '@/types/database';

interface FooterProps {
  settings: Partial<EventSettings>;
}

export default function Footer({ settings }: FooterProps) {
  return (
    <footer id="contact" className="relative border-t border-purple-900/30">
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white font-black text-lg">FRESHERS 2026</div>
                <div className="text-purple-400 text-xs">JSCE</div>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-sm">
              {settings.event_description || 
                'The official Freshers celebration at Jayawantrao Sawant College of Engineering. A grand welcome for all first-year students.'
              }
            </p>
            <div className="text-slate-500 text-xs">
              Jayawantrao Sawant College of Engineering, Pune, Maharashtra
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: 'Home', href: '#home' },
                { label: 'About Event', href: '#about' },
                { label: 'Event Details', href: '#event-details' },
                { label: 'Register', href: '#register' },
                { label: 'FAQs', href: '#faqs' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-purple-400 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <div className="space-y-3">
              {settings.contact_email && (
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="flex items-center gap-2 text-slate-400 hover:text-purple-400 text-sm transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {settings.contact_email}
                </a>
              )}
              {settings.contact_phone && (
                <a
                  href={`tel:${settings.contact_phone}`}
                  className="flex items-center gap-2 text-slate-400 hover:text-purple-400 text-sm transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {settings.contact_phone}
                </a>
              )}
              {!settings.contact_email && !settings.contact_phone && (
                <p className="text-slate-500 text-sm">
                  Contact information will be updated soon.
                </p>
              )}
              <div className="pt-2">
                <Link
                  href="/admin/login"
                  className="text-purple-400/60 hover:text-purple-400 text-xs transition-colors"
                >
                  Admin Login →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-purple-900/30 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Jayawantrao Sawant College of Engineering. All rights reserved.
          </p>
          <p className="text-slate-600 text-xs flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-500" /> for JSCE Students
          </p>
        </div>
      </div>
    </footer>
  );
}

