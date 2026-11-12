import { UserPlus, CreditCard, QrCode, DoorOpen, ArrowRight } from 'lucide-react';

export default function InstructionsSection() {
  const steps = [
    {
      step: '01',
      icon: UserPlus,
      title: 'Fill Registration Form',
      desc: 'Enter your name, department, College ID/PRN, mobile number, and email address.',
      color: 'from-purple-600 to-purple-800',
    },
    {
      step: '02',
      icon: CreditCard,
      title: 'Complete Payment',
      desc: 'Pay ₹300 securely via Razorpay using UPI (Google Pay, PhonePe), debit/credit card or netbanking.',
      color: 'from-blue-600 to-blue-800',
    },
    {
      step: '03',
      icon: QrCode,
      title: 'Receive QR Ticket',
      desc: 'Get your unique QR entry ticket and PDF invoice instantly via email and direct download.',
      color: 'from-purple-600 to-blue-700',
    },
    {
      step: '04',
      icon: DoorOpen,
      title: 'Enter the Event',
      desc: 'Show your QR code at the entry gate. It will be scanned once to grant you access.',
      color: 'from-green-600 to-teal-700',
    },
  ];

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/5 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-900/30 border border-green-700/30 px-4 py-2 rounded-full mb-6">
            <span className="text-green-300 text-sm font-medium">How It Works</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Simple{' '}
            <span className="gradient-text">4-Step</span>{' '}
            Process
          </h2>
        </div>

        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600/50 via-blue-600/50 to-green-600/50 mx-32" />
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6 relative z-10 pulse-glow`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-6xl font-black text-white/5 absolute -top-4 left-1/2 -translate-x-1/2 select-none">
                    {step.step}
                  </div>
                  <h3 className="text-white font-bold text-lg mb-3">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                  {index < steps.length - 1 && (
                    <ArrowRight className="hidden sm:block lg:hidden absolute -right-4 top-6 text-purple-600 w-6 h-6" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

