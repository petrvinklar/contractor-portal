-- Contractor Portal: Database migration
-- Run this in Supabase SQL Editor

-- 1. contractor_profiles
CREATE TABLE IF NOT EXISTS contractor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  ico TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. contractor_submissions
CREATE TABLE IF NOT EXISTS contractor_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  ico TEXT NOT NULL,
  email TEXT NOT NULL,
  contact_person TEXT,
  contractor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invoice_number TEXT,
  date_issued DATE,
  date_due DATE,
  date_taxable DATE,
  total_amount NUMERIC(15,2),
  total_without_vat NUMERIC(15,2),
  currency TEXT DEFAULT 'CZK',
  description TEXT,
  supplier_name TEXT,
  supplier_ico TEXT,
  supplier_dic TEXT,
  buyer_name TEXT,
  buyer_ico TEXT,
  buyer_dic TEXT,
  bank_account TEXT,
  bank_code TEXT,
  iban TEXT,
  variable_symbol TEXT,
  status TEXT DEFAULT 'received' CHECK (status IN ('received','reviewing','approved','rejected','paid')),
  admin_note TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  source_type TEXT DEFAULT 'manual' CHECK (source_type IN ('manual','isdoc','pdf')),
  isdoc_raw JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. contractor_submission_items
CREATE TABLE IF NOT EXISTS contractor_submission_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES contractor_submissions(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,3) DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL,
  vat_rate NUMERIC(5,2) DEFAULT 21,
  total_price NUMERIC(15,2),
  unit TEXT,
  sort_order INT DEFAULT 0
);

-- 4. contractor_submission_files
CREATE TABLE IF NOT EXISTS contractor_submission_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES contractor_submissions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INT NOT NULL,
  storage_path TEXT NOT NULL,
  file_category TEXT DEFAULT 'invoice'
);

-- RLS Policies

ALTER TABLE contractor_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_submission_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_submission_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;

-- contractor_submissions: anyone can INSERT (public upload)
CREATE POLICY "Anyone can insert submissions"
  ON contractor_submissions FOR INSERT
  WITH CHECK (true);

-- contractor_submissions: authenticated users can SELECT own records
CREATE POLICY "Users can view own submissions"
  ON contractor_submissions FOR SELECT
  USING (
    contractor_id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- contractor_submission_items: anyone can INSERT
CREATE POLICY "Anyone can insert submission items"
  ON contractor_submission_items FOR INSERT
  WITH CHECK (true);

-- contractor_submission_items: select via parent submission
CREATE POLICY "Users can view own submission items"
  ON contractor_submission_items FOR SELECT
  USING (
    submission_id IN (
      SELECT id FROM contractor_submissions
      WHERE contractor_id = auth.uid()
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- contractor_submission_files: anyone can INSERT
CREATE POLICY "Anyone can insert submission files"
  ON contractor_submission_files FOR INSERT
  WITH CHECK (true);

-- contractor_submission_files: select via parent submission
CREATE POLICY "Users can view own submission files"
  ON contractor_submission_files FOR SELECT
  USING (
    submission_id IN (
      SELECT id FROM contractor_submissions
      WHERE contractor_id = auth.uid()
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- contractor_profiles: users can manage own profile
CREATE POLICY "Users can view own profile"
  ON contractor_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON contractor_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON contractor_profiles FOR UPDATE
  USING (id = auth.uid());

-- Storage bucket (run via Supabase Dashboard or API)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'contractor-invoices',
--   'contractor-invoices',
--   false,
--   10485760, -- 10 MB
--   ARRAY['application/pdf', 'text/xml', 'application/xml']
-- );

-- Storage policies
-- CREATE POLICY "Anyone can upload invoice files"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'contractor-invoices');
-- CREATE POLICY "Authenticated users can view own files"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'contractor-invoices');
