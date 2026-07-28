-- Kortingscodes (vast bedrag of percentage, door de admin ingesteld) én
-- cadeaubon-codes (vast tegoed, opgebruikt tot saldo 0) voor bij het boeken
-- van een workshop. Enkel server-side toegankelijk (via /api/create-booking
-- en /api/admin/discount-codes) met de service-role-sleutel — geen publieke
-- RLS-policy, dus codes zijn niet op te vragen/bruteforcen via de anon-key.
create table discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  kind text not null check (kind in ('percent','fixed','giftcard')),
  value numeric(10,2) not null,          -- percent: 0-100, fixed/giftcard: euro
  balance numeric(10,2),                 -- enkel giftcard: resterend tegoed
  max_uses int,                          -- enkel percent/fixed: null = onbeperkt
  uses_count int not null default 0,
  active boolean not null default true,
  expires_at date,
  note text,
  created_at timestamptz not null default now()
);
alter table discount_codes enable row level security;

-- Welke code (indien van toepassing) en welk bedrag er precies is afgetrokken
-- van een boeking — nodig om bij een mislukte/verlopen betaling het
-- codegebruik correct terug te draaien (zelfde patroon als booked_spots).
alter table bookings add column discount_code text;
alter table bookings add column discount_amount numeric(10,2);
