'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, GraduationCap } from 'lucide-react';

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Register', href: '#register' },
  { label: 'FAQs', href: '#faqs' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0118]/95 backdrop-blur-xl border-b border-purple-900/30 shadow-lg shadow-purple-900/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="#home" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-bold text-sm leading-tight">FRESHERS 2026</div>
              <div className="text-purple-400 text-xs">JSCE</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-slate-300 hover:text-white hover:bg-purple-900/30 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* CTA + Mobile */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="hidden md:block text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
            >
              Admin
            </Link>
            <Link
              href="#register"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-sm px-5 py-2 rounded-xl btn-glow"
            >
              Register Now
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-white p-2 rounded-lg hover:bg-purple-900/30"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0a0118]/98 backdrop-blur-xl border-t border-purple-900/30">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block text-slate-300 hover:text-white hover:bg-purple-900/30 px-4 py-3 rounded-lg text-sm font-medium transition-all"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin/login"
              onClick={() => setMenuOpen(false)}
              className="block text-purple-400 px-4 py-3 text-sm font-medium"
            >
              Admin Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

