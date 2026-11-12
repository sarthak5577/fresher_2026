import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Freshers 2026 – Jayawantrao Sawant College of Engineering',
  description:
    'Register for Freshers 2026 at Jayawantrao Sawant College of Engineering. Pay ₹300 and get your QR entry ticket.',
  keywords: 'JSCE, Freshers 2026, college fest, registration, Pune',
  openGraph: {
    title: 'Freshers 2026 – JSCE',
    description: 'Register for the biggest freshers party of the year!',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0a0118" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
