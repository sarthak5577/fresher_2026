-- ============================================================
-- FRESHERS 2026 – JSCE Database Migration
-- Run this in Supabase SQL Editor (Project > SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: registrations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.registrations (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id       TEXT UNIQUE NOT NULL,
  student_name          TEXT NOT NULL,
  department            TEXT NOT NULL,
  college_id            TEXT NOT NULL,
  college_id_normalized TEXT NOT NULL,
  phone                 TEXT NOT NULL,
  email                 TEXT NOT NULL,
  payment_status        TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  entry_status          TEXT NOT NULL DEFAULT 'not_entered' CHECK (entry_status IN ('not_entered', 'entered')),
  ticket_token_hash     TEXT,
  paytm_order_id        TEXT,
  invoice_number        TEXT,
  invoice_html          TEXT,
  ticket_html           TEXT,
  reservation_expires_at TIMESTAMPTZ,
  entered_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint on normalized college ID for active registrations
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_college_id_normalized
  ON public.registrations (college_id_normalized);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON public.registrations (payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_entry_status ON public.registrations (entry_status);
CREATE INDEX IF NOT EXISTS idx_registrations_department ON public.registrations (department);
CREATE INDEX IF NOT EXISTS idx_registrations_ticket_token_hash ON public.registrations (ticket_token_hash);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON public.registrations (created_at DESC);

-- ============================================================
-- TABLE: payments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id       TEXT NOT NULL REFERENCES public.registrations (registration_id) ON DELETE CASCADE,
  paytm_order_id        TEXT UNIQUE,
  paytm_txn_id          TEXT,
  utr_number            TEXT,
  amount                INTEGER NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'INR',
  status                TEXT NOT NULL DEFAULT 'created',
  payment_method        TEXT,
  verified_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_registration_id ON public.payments (registration_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_paytm_order_id ON public.payments (paytm_order_id);

-- ============================================================
-- TABLE: admin_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id  UUID UNIQUE NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_profiles_auth_user_id ON public.admin_profiles (auth_user_id);

-- ============================================================
-- TABLE: entry_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.entry_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id TEXT REFERENCES public.registrations (registration_id),
  admin_id        UUID REFERENCES public.admin_profiles (id),
  scanned_at      TIMESTAMPTZ DEFAULT NOW(),
  result          TEXT NOT NULL CHECK (result IN ('success', 'already_entered', 'invalid', 'unpaid'))
);

CREATE INDEX IF NOT EXISTS idx_entry_logs_registration_id ON public.entry_logs (registration_id);
CREATE INDEX IF NOT EXISTS idx_entry_logs_scanned_at ON public.entry_logs (scanned_at DESC);

-- ============================================================
-- TABLE: event_settings (single-row configuration table)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_settings (
  id                  INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  event_name          TEXT NOT NULL DEFAULT 'Freshers 2026',
  college_name        TEXT NOT NULL DEFAULT 'Jayawantrao Sawant College of Engineering',
  event_date          TEXT NOT NULL DEFAULT 'TBA',
  event_venue         TEXT NOT NULL DEFAULT 'TBA',
  registration_fee    INTEGER NOT NULL DEFAULT 30000,
  maximum_capacity    INTEGER NOT NULL DEFAULT 1000,
  registration_open   BOOLEAN NOT NULL DEFAULT true,
  departments         TEXT[] NOT NULL DEFAULT ARRAY['Computer', 'IT', 'Mechanical', 'Electrical', 'E&TC', 'AIDS'],
  contact_email       TEXT DEFAULT '',
  contact_phone       TEXT DEFAULT '',
  event_description   TEXT DEFAULT 'Welcome to Freshers 2026 at Jayawantrao Sawant College of Engineering!',
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings row
INSERT INTO public.event_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TABLE: email_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id TEXT REFERENCES public.registrations (registration_id),
  email_type      TEXT NOT NULL DEFAULT 'confirmation',
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
  sent_at         TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_registration_id ON public.email_logs (registration_id);

-- ============================================================
-- TABLE: webhook_events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id            TEXT UNIQUE NOT NULL,
  event_type          TEXT NOT NULL,
  processed_at        TIMESTAMPTZ,
  processing_status   TEXT NOT NULL DEFAULT 'pending',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events (event_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Event settings: anyone can read (for public website)
CREATE POLICY "Public can read event settings"
  ON public.event_settings FOR SELECT
  USING (true);

-- Admin profiles: authenticated users can read their own profile
CREATE POLICY "Users can read own admin profile"
  ON public.admin_profiles FOR SELECT
  USING (auth.uid() = auth_user_id);

-- All other tables: only service role can access (via admin client)
-- The service role bypasses RLS by default

-- ============================================================
-- HELPER FUNCTION: Get daily registrations (for dashboard chart)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_daily_registrations()
RETURNS TABLE (date TEXT, count BIGINT)
LANGUAGE SQL
AS $$
  SELECT
    TO_CHAR(created_at AT TIME ZONE 'Asia/Kolkata', 'Mon DD') AS date,
    COUNT(*) AS count
  FROM public.registrations
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY TO_CHAR(created_at AT TIME ZONE 'Asia/Kolkata', 'Mon DD'), DATE_TRUNC('day', created_at AT TIME ZONE 'Asia/Kolkata')
  ORDER BY DATE_TRUNC('day', created_at AT TIME ZONE 'Asia/Kolkata');
$$;

-- ============================================================
-- UPDATED_AT trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_registrations_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

