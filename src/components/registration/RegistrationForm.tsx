'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Hash, Phone, Mail, BookOpen, ArrowRight, Loader2, AlertCircle, Shield } from 'lucide-react';
import type { EventSettings } from '@/types/database';

interface RegistrationFormProps {
  settings: Partial<EventSettings>;
}

type FormStep = 'form' | 'submitting' | 'payment' | 'verifying';

export default function RegistrationForm({ settings }: RegistrationFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<FormStep>('form');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    studentName: '',
    department: '',
    collegeId: '',
    phone: '',
    email: '',
  });

  const departments = settings.departments || ['Computer', 'IT', 'Mechanical', 'Electrical', 'E&TC', 'AIDS'];

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.studentName.trim() || formData.studentName.trim().length < 2)
      errors.studentName = 'Please enter your full name (at least 2 characters).';
    if (!formData.department)
      errors.department = 'Please select your department.';
    if (!formData.collegeId.trim() || formData.collegeId.trim().length < 3)
      errors.collegeId = 'Please enter a valid College ID or PRN.';
    if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\s+/g, '')))
      errors.phone = 'Please enter a valid 10-digit Indian mobile number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = 'Please enter a valid email address.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setStep('submitting');

    try {
      // Step 1: Create registration + Paytm order
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        setStep('form');
        return;
      }

      const { registrationId, paytmOrderId, txnToken, mid, paytmBaseUrl, paytmConfigured } = data;

      // Redirect directly to UPI QR & Instant UTR Verification page
      router.push(`/payment/pending?id=${registrationId}&oid=${paytmOrderId}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setStep('form');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, router]);

  const isSubmitting = step === 'submitting' || step === 'verifying';

  const inputClass = (field: string) =>
    `w-full bg-[#0d0220] border ${fieldErrors[field] ? 'border-red-500/70' : 'border-purple-900/50'} rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm`;

  return (
    <section id="register" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent pointer-events-none" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-700/30 px-4 py-2 rounded-full mb-6">
            <span className="text-purple-300 text-sm font-medium">Student Registration</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Register <span className="gradient-text">Now</span>
          </h2>
          <p className="text-slate-400">Fill in your details and pay ₹300 to secure your spot.</p>
        </div>

        <div className="glass rounded-3xl p-8 sm:p-10 relative">
          {/* Status overlay */}
          {(step === 'payment' || step === 'verifying' || step === 'submitting') && (
            <div className="absolute inset-0 bg-[#0a0118]/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-10">
              <Loader2 className="w-12 h-12 text-purple-400 spinner mb-4" />
              <p className="text-white font-semibold text-lg">
                {step === 'submitting' && 'Creating your registration...'}
                {step === 'payment' && 'Redirecting to UPI payment...'}
                {step === 'verifying' && 'Verifying your payment...'}
              </p>
              <p className="text-slate-400 text-sm mt-2">Please do not close this window.</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 bg-red-900/20 border border-red-700/30 rounded-xl p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  className={`${inputClass('studentName')} pl-10`}
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                />
              </div>
              {fieldErrors.studentName && <p className="text-red-400 text-xs mt-1">{fieldErrors.studentName}</p>}
            </div>

            {/* Department */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Department <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className={`${inputClass('department')} pl-10 appearance-none cursor-pointer`}
                  disabled={isSubmitting}
                >
                  <option value="" className="bg-[#0d0220]">Select your department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept} className="bg-[#0d0220]">{dept}</option>
                  ))}
                </select>
              </div>
              {fieldErrors.department && <p className="text-red-400 text-xs mt-1">{fieldErrors.department}</p>}
            </div>

            {/* College ID */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                College ID / PRN Number <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={formData.collegeId}
                  onChange={(e) => setFormData({ ...formData, collegeId: e.target.value })}
                  className={`${inputClass('collegeId')} pl-10`}
                  placeholder="Enter your College ID or PRN"
                  disabled={isSubmitting}
                />
              </div>
              {fieldErrors.collegeId && <p className="text-red-400 text-xs mt-1">{fieldErrors.collegeId}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Mobile Number <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <div className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-500 text-sm">+91</div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className={`${inputClass('phone')} pl-20`}
                  placeholder="10-digit mobile number"
                  disabled={isSubmitting}
                />
              </div>
              {fieldErrors.phone && <p className="text-red-400 text-xs mt-1">{fieldErrors.phone}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`${inputClass('email')} pl-10`}
                  placeholder="your.email@example.com"
                  disabled={isSubmitting}
                />
              </div>
              {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
              <p className="text-slate-500 text-xs mt-1">Your QR ticket and invoice will be sent to this email.</p>
            </div>

            {/* Fee */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/30 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-slate-300 text-sm">Registration Fee</div>
                <div className="text-white font-black text-2xl">₹300</div>
              </div>
              <div className="text-right text-xs text-slate-400">
                <div className="flex items-center gap-1 justify-end text-green-400 font-semibold mb-0.5">
                  <Shield className="w-3 h-3" /> 0% Gateway Fee
                </div>
                <div className="text-slate-300">Direct UPI Payment</div>
                <div className="text-purple-300 font-medium">GPay • PhonePe • Paytm • BHIM</div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !settings.registration_open}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold text-base py-4 rounded-xl btn-glow transition-all duration-300"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 spinner" /> Processing...</>
              ) : !settings.registration_open ? (
                'Registration Closed'
              ) : (
                <>Proceed to Pay ₹300 <ArrowRight className="w-5 h-5" /></>
              )}
            </button>

            <p className="text-center text-slate-500 text-xs">
              By registering, you confirm this is your first-year registration for Freshers 2026 at JSCE.
              Duplicate registrations will be cancelled.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
