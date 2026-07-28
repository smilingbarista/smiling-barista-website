-- Lesgevers, admin-beheerd, toe te wijzen per workshopsessie (verschillende
-- sessies van hetzelfde workshoptype kunnen door verschillende lesgevers
-- gegeven worden, vandaar per sessie i.p.v. per workshoptype).
create table instructors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table instructors enable row level security;

alter table workshop_sessions add column instructor_id uuid references instructors (id) on delete set null;
