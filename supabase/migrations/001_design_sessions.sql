create table if not exists design_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  step integer default 1,
  status text default 'in_progress',
  style text,
  sqft integer,
  bedrooms integer,
  bathrooms numeric,
  shape text,
  street_facing text,
  view_facing text,
  priorities jsonb,
  garage text,
  garage_attachment text,
  features jsonb,
  email text,
  first_name text,
  last_name text,
  phone text,
  layout_state jsonb,
  concept_pdf_url text,
  notes text
);

create table if not exists design_revisions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references design_sessions(id) on delete cascade,
  created_at timestamptz default now(),
  revision_number integer,
  layout_state jsonb,
  change_description text,
  requested_by text
);
