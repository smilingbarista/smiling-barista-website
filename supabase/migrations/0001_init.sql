-- Workshops (cursuscatalogus). Vervangt de hardcoded Sessions.WORKSHOPS
-- in js/sessions.js — die blijft even bestaan als fallback tot alles is
-- omgeschakeld, maar de database wordt de bron van waarheid.
create table workshops (
  id text primary key,               -- slug, bv. 'latte-art-1'
  name text not null,
  short_name text not null,
  description text,
  bullets text,                      -- "wat je leert"-lijst, één item per regel
  price numeric(10,2) not null,
  duration_label text,               -- bv. "2,5 uur"
  max_spots int not null default 8,
  color text not null default '#0366C5',
  track text,                        -- 'specialty' | 'barista' | 'latte-art' | 'slow-brew'
  level int,                         -- niveau binnen een lijn (1,2,3)
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Een boekbare datum+tijdstip-sessie van een workshop.
create table workshop_sessions (
  id uuid primary key default gen_random_uuid(),
  workshop_id text not null references workshops (id) on delete cascade,
  date date not null,
  time text not null,                -- "14:00"
  max_spots int,                     -- overschrijft workshops.max_spots indien gezet
  booked_spots int not null default 0,
  cancelled boolean not null default false,
  created_at timestamptz not null default now()
);

-- Een klant-boeking + betaalstatus. Bevat persoonsgegevens (naam/e-mail/
-- telefoon) — mag NOOIT publiek leesbaar zijn via de anon-key.
create table bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workshop_sessions (id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  spots int not null default 1,
  amount_total numeric(10,2) not null,
  status text not null default 'pending',   -- pending | paid | cancelled | expired
  mollie_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workshop_sessions_workshop_date_idx on workshop_sessions (workshop_id, date);
create index bookings_session_idx on bookings (session_id);
create index bookings_mollie_payment_idx on bookings (mollie_payment_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Enkel workshops/sessions zijn publiek leesbaar (nodig om de kalender op
-- workshops.html te tonen). Boekingen (met persoonsgegevens) en alle
-- schrijfacties lopen uitsluitend via de serverless API met de
-- service_role-sleutel, die RLS toch omzeilt — er zijn dus geen
-- schrijf-policies nodig voor de anon-rol.
alter table workshops enable row level security;
alter table workshop_sessions enable row level security;
alter table bookings enable row level security;

create policy "workshops_select_public" on workshops
  for select using (active = true);

create policy "workshop_sessions_select_public" on workshop_sessions
  for select using (true);

-- Geen policy op bookings voor anon/authenticated: standaard is dat "alles
-- geweigerd" zodra RLS aanstaat, en dat is precies de bedoeling hier.
