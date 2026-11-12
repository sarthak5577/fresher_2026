# Freshers 2026 – Complete Registration & Management System

**Jayawantrao Sawant College of Engineering**

A complete, production-ready full-stack web application for student registration, Razorpay payment processing, QR ticket generation, and secure event entry management.

---

## 🚀 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (server-side)
- **Database**: Supabase PostgreSQL + Supabase Auth
- **Payment**: Razorpay Standard Checkout
- **Email**: Resend API
- **QR**: qrcode + html5-qrcode
- **Hosting**: Vercel

---

## 📋 Features

- ✅ Student registration with duplicate prevention
- ✅ Razorpay Standard Checkout (UPI, Cards, Net Banking)
- ✅ Payment signature verification (server-side)
- ✅ Razorpay webhooks with idempotency
- ✅ Cryptographically secure QR entry tickets
- ✅ PDF invoice generation (HTML-based, downloadable)
- ✅ Automated confirmation emails via Resend
- ✅ 3 Admin accounts via Supabase Auth
- ✅ Admin dashboard with live stats and charts
- ✅ QR scanner with camera support
- ✅ Atomic entry validation (prevents duplicate entry)
- ✅ Dynamic event settings (date/venue live updates)
- ✅ CSV export
- ✅ Full RLS on Supabase
- ✅ Mobile-responsive premium dark design

---

## 🛠️ Setup Guide

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd freshers-2026
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`. See `.env.example` for reference.

### 3. Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. Run SQL migration: **SQL Editor** → paste contents of `supabase/migrations/001_initial_schema.sql`
3. Enable Email auth in Authentication settings

### 4. Create Admin Accounts (3 required)

Go to **Supabase Dashboard → Authentication → Users → Add User** for each admin.

Then run in SQL Editor (replace UUIDs with actual auth user IDs):

```sql
INSERT INTO admin_profiles (auth_user_id, name, role) VALUES
  ('uuid-of-admin-1', 'Admin One Name', 'super_admin'),
  ('uuid-of-admin-2', 'Admin Two Name', 'admin'),
  ('uuid-of-admin-3', 'Admin Three Name', 'admin');
```

### 5. Razorpay Setup

1. Account at [razorpay.com](https://razorpay.com)
2. Generate Test API Keys → add to `.env.local`
3. Configure Webhook: `https://your-domain.com/api/payment/webhook`
   - Events: `payment.captured`, `payment.failed`, `refund.processed`

### 6. Resend Email Setup

1. Account at [resend.com](https://resend.com)
2. Verify your domain → create API key
3. Add to `.env.local`

### 7. Run

```bash
npm run dev
# Open http://localhost:3000
# Admin: http://localhost:3000/admin/login
```

---

## 🚀 Production Deployment

```bash
# Push to GitHub
# Import in vercel.com
# Add all environment variables in Vercel settings
# Deploy
npm run build  # Test build locally first
```

---

## 🔒 Security

- Razorpay secret key never exposed to browser
- Payment signature verified server-side
- Webhook signature verified via HMAC-SHA256
- QR tokens are cryptographically random (256-bit), only SHA-256 hash stored
- Student data never embedded in QR code
- Supabase service role key never sent to browser
- Row Level Security enabled on all tables

---

## 🧪 Test Cards (Razorpay Test Mode)

- **Card**: `4111 1111 1111 1111`, any future date, any CVV
- **UPI**: Any test UPI ID

---

Built for JSCE Freshers 2026.
