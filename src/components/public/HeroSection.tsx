'use client';

import Link from 'next/link';
import { ArrowRight, Ticket, Sparkles, ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  registrationOpen: boolean;
}

export default function HeroSection({ registrationOpen }: HeroSectionProps) {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center hero-bg animated-gradient overflow-hidden pt-16"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-700/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 glass px-5 py-2.5 rounded-full mb-8 fade-in-up">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-purple-300 text-sm font-medium">Jayawantrao Sawant College of Engineering</span>
          <Sparkles className="w-4 h-4 text-blue-400" />
        </div>

        {/* Main heading */}
        <h1 className="fade-in-up text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-6 leading-none tracking-tight">
          <span className="gradient-text">FRESHERS</span>
          <br />
          <span className="text-white">2026</span>
        </h1>

        <p className="fade-in-up text-xl sm:text-2xl text-slate-300 mb-4 font-light">
          Welcome to the{' '}
          <span className="text-purple-400 font-semibold">biggest celebration</span>{' '}
          of the year
        </p>
        <p className="fade-in-up text-slate-400 mb-10 max-w-xl mx-auto text-base">
          Join thousands of your classmates for an unforgettable evening of music, 
          performances, and memories that will last a lifetime.
        </p>

        {/* Fee badge */}
        <div className="fade-in-up inline-flex items-center gap-3 mb-10">
          <div className="glass px-6 py-3 rounded-2xl">
            <span className="text-slate-400 text-sm">Registration Fee</span>
            <div className="text-3xl font-black text-white">
              ₹300{' '}
              <span className="text-sm font-normal text-green-400">per student</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="fade-in-up flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          {registrationOpen ? (
            <Link
              href="#register"
              className="group flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-lg px-8 py-4 rounded-2xl btn-glow transition-all duration-300"
            >
              <Ticket className="w-5 h-5" />
              Register Now – ₹300
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <div className="flex items-center gap-3 bg-slate-700/50 text-slate-400 font-bold text-lg px-8 py-4 rounded-2xl border border-slate-600 cursor-not-allowed">
              Registration Closed
            </div>
          )}
          <Link
            href="#event-details"
            className="text-slate-300 hover:text-white font-medium text-lg px-8 py-4 rounded-2xl border border-slate-700 hover:border-purple-600 transition-all duration-300"
          >
            View Event Details
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="animate-bounce">
          <ChevronDown className="w-6 h-6 text-purple-400 mx-auto" />
        </div>
      </div>
    </section>
  );
}

