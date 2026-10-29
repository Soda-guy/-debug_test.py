-- BillBless PostgreSQL schema (Supabase)
-- Money stored as BIGINT minor units. Never use floating point for money.
-- Run via Supabase SQL editor or CLI after configuring your project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

create table if not exists public.currencies (
  code text primary key,
  name text not null,
  symbol text not null,
  minor_units smallint not null check (minor_units >= 0 and minor_units <= 4),
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.countries (
  code text primary key,
  name text not null,
  default_currency text not null references public.currencies(code),
  enabled boolean not null default false,
  regions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin', 'moderator')),
  preferred_currency text not null default 'USD' references public.currencies(code),
  locale text not null default 'en-US',
  timezone text not null default 'UTC',
  email_verified boolean not null default false,
  notifications jsonb not null default '{"contributionUpdates":true,"billFunding":true,"marketing":false,"pushEnabled":true}'::jsonb,
  privacy jsonb not null default '{"showOnLeaderboard":false,"anonymizeContributions":true}'::jsonb,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);

-- ---------------------------------------------------------------------------
-- Bills — public vs private separation
-- ---------------------------------------------------------------------------

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles(id),
  category text not null,
  status text not null default 'DRAFT' check (status in (
    'DRAFT','PENDING_REVIEW','NEEDS_INFORMATION','VERIFIED','REJECTED',
    'FULLY_FUNDED','PAYMENT_PENDING','PAID','PAYMENT_FAILED','EXPIRED'
  )),
  country_code text not null references public.countries(code),
  region text,
  currency_code text not null references public.currencies(code),
  amount_due_minor bigint not null check (amount_due_minor > 0),
  amount_funded_minor bigint not null default 0 check (amount_funded_minor >= 0),
  contributor_count integer not null default 0 check (contributor_count >= 0),
  due_date date not null,
  urgency text not null default 'medium' check (urgency in ('low','medium','high','critical')),
  billing_period_start date,
  billing_period_end date,
  previous_balance_minor bigint,
  current_charges_minor bigint,
  -- Sanitized statement JSON (no PII)
  statement jsonb not null,
  verified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint funded_not_over_due check (amount_funded_minor <= amount_due_minor)
);

create index if not exists bills_status_idx on public.bills(status);
create index if not exists bills_country_idx on public.bills(country_code);
create index if not exists bills_category_idx on public.bills(category);
create index if not exists bills_due_date_idx on public.bills(due_date);
create index if not exists bills_feed_idx on public.bills(status, country_code) where status = 'VERIFIED';

-- Private recipient data — NEVER selectable by donors
create table if not exists public.bill_private (
  bill_id uuid primary key references public.bills(id) on delete cascade,
  recipient_full_name text,
  service_address text,
  account_number_encrypted text,
  account_number_last4 text,
  phone_encrypted text,
  email_encrypted text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bill_documents (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills(id) on delete cascade,
  kind text not null check (kind in ('original','sanitized')),
  mime_type text not null,
  storage_path text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0),
  checksum_sha256 text,
  created_at timestamptz not null default now()
);

create index if not exists bill_documents_bill_idx on public.bill_documents(bill_id);

create table if not exists public.bill_verifications (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills(id) on delete cascade,
  reviewer_id uuid references public.profiles(id),
  decision text check (decision in ('approve','reject','needs_info')),
  notes text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Contributions & payments
-- ---------------------------------------------------------------------------

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills(id),
  donor_user_id uuid not null references public.profiles(id),
  amount_minor bigint not null check (amount_minor > 0),
  currency_code text not null references public.currencies(code),
  platform_fee_minor bigint not null check (platform_fee_minor >= 0),
  processing_fee_minor bigint not null default 0 check (processing_fee_minor >= 0),
  tax_minor bigint not null default 0 check (tax_minor >= 0),
  total_charged_minor bigint not null check (total_charged_minor > 0),
  status text not null default 'PENDING' check (status in (
    'PENDING','PROCESSING','SUCCEEDED','FAILED','REFUNDED','CHARGEBACK','CANCELLED'
  )),
  idempotency_key uuid not null unique,
  is_simulated boolean not null default true,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists contributions_donor_idx on public.contributions(donor_user_id);
create index if not exists contributions_bill_idx on public.contributions(bill_id);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.contributions(id),
  provider text not null,
  provider_ref text,
  status text not null default 'PENDING',
  amount_minor bigint not null,
  currency_code text not null references public.currencies(code),
  idempotency_key uuid not null unique,
  is_simulated boolean not null default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Biller payouts — FULLY_FUNDED ≠ PAID
create table if not exists public.bill_payments (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills(id),
  amount_minor bigint not null check (amount_minor > 0),
  currency_code text not null references public.currencies(code),
  status text not null default 'PENDING',
  biller_confirmation_ref text,
  is_simulated boolean not null default true,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create table if not exists public.saved_bills (
  user_id uuid not null references public.profiles(id) on delete cascade,
  bill_id uuid not null references public.bills(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, bill_id)
);

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  read boolean not null default false,
  href text,
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_user_idx on public.user_notifications(user_id, read);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  resource_type text not null,
  resource_id text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_idx on public.admin_audit_logs(created_at desc);

-- ---------------------------------------------------------------------------
-- Concurrency-safe funding function
-- ---------------------------------------------------------------------------

create or replace function public.apply_contribution(
  p_bill_id uuid,
  p_donor_id uuid,
  p_amount_minor bigint,
  p_platform_fee_minor bigint,
  p_processing_fee_minor bigint,
  p_tax_minor bigint,
  p_idempotency_key uuid,
  p_is_simulated boolean default true
) returns public.contributions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bill public.bills%rowtype;
  v_existing public.contributions%rowtype;
  v_contrib public.contributions%rowtype;
  v_remaining bigint;
begin
  -- Idempotency
  select * into v_existing from public.contributions where idempotency_key = p_idempotency_key;
  if found then
    return v_existing;
  end if;

  -- Lock bill row
  select * into v_bill from public.bills where id = p_bill_id for update;
  if not found then
    raise exception 'Bill not found';
  end if;
  if v_bill.status <> 'VERIFIED' then
    raise exception 'Bill not open for contributions';
  end if;

  v_remaining := v_bill.amount_due_minor - v_bill.amount_funded_minor;
  if p_amount_minor <= 0 or p_amount_minor > v_remaining then
    raise exception 'Invalid contribution amount';
  end if;

  insert into public.contributions (
    bill_id, donor_user_id, amount_minor, currency_code,
    platform_fee_minor, processing_fee_minor, tax_minor, total_charged_minor,
    status, idempotency_key, is_simulated, completed_at
  ) values (
    p_bill_id, p_donor_id, p_amount_minor, v_bill.currency_code,
    p_platform_fee_minor, p_processing_fee_minor, p_tax_minor,
    p_amount_minor + p_platform_fee_minor + p_processing_fee_minor + p_tax_minor,
    'SUCCEEDED', p_idempotency_key, p_is_simulated, now()
  ) returning * into v_contrib;

  update public.bills set
    amount_funded_minor = amount_funded_minor + p_amount_minor,
    contributor_count = contributor_count + 1,
    status = case
      when amount_funded_minor + p_amount_minor >= amount_due_minor then 'FULLY_FUNDED'
      else status
    end,
    updated_at = now()
  where id = p_bill_id;

  return v_contrib;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.bills enable row level security;
alter table public.bill_private enable row level security;
alter table public.bill_documents enable row level security;
alter table public.bill_verifications enable row level security;
alter table public.contributions enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.bill_payments enable row level security;
alter table public.saved_bills enable row level security;
alter table public.user_notifications enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.currencies enable row level security;
alter table public.countries enable row level security;

-- Helper: is admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','moderator')
  );
$$;

-- Currencies / countries: public read of enabled
create policy currencies_read on public.currencies for select using (enabled = true or public.is_admin());
create policy countries_read on public.countries for select using (enabled = true or public.is_admin());

-- Profiles
create policy profiles_select_own on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update using (id = auth.uid());

-- Bills: donors see verified+ public rows only (statement has no PII)
create policy bills_public_feed on public.bills for select using (
  status in ('VERIFIED','FULLY_FUNDED','PAYMENT_PENDING','PAID')
  or recipient_user_id = auth.uid()
  or public.is_admin()
);
create policy bills_insert_own on public.bills for insert with check (recipient_user_id = auth.uid());
create policy bills_update_admin on public.bills for update using (
  recipient_user_id = auth.uid() or public.is_admin()
);

-- Private bill data: recipient + admin ONLY
create policy bill_private_owner on public.bill_private for select using (
  exists (
    select 1 from public.bills b
    where b.id = bill_id and (b.recipient_user_id = auth.uid() or public.is_admin())
  )
);

-- Documents: original = owner/admin; sanitized = same as public bill visibility for sanitized kind via storage policies
create policy bill_documents_access on public.bill_documents for select using (
  exists (
    select 1 from public.bills b
    where b.id = bill_id and (
      b.recipient_user_id = auth.uid()
      or public.is_admin()
      or (kind = 'sanitized' and b.status in ('VERIFIED','FULLY_FUNDED','PAYMENT_PENDING','PAID'))
    )
  )
);

-- Contributions
create policy contributions_select on public.contributions for select using (
  donor_user_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.bills b where b.id = bill_id and b.recipient_user_id = auth.uid())
);

-- Payment transactions: donor + admin
create policy payment_tx_select on public.payment_transactions for select using (
  public.is_admin()
  or exists (
    select 1 from public.contributions c
    where c.id = contribution_id and c.donor_user_id = auth.uid()
  )
);

-- Saved bills / notifications
create policy saved_bills_own on public.saved_bills for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_own on public.user_notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Audit logs: admin only
create policy audit_admin on public.admin_audit_logs for select using (public.is_admin());

-- Storage buckets (create in dashboard):
--   bill-originals  (private)
--   bill-sanitized  (authenticated read for verified bills)
-- Never expose original paths via public APIs.
