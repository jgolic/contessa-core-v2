create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create type public.vessel_role as enum (
  'owner',
  'manager',
  'captain',
  'first_mate',
  'engineer',
  'bosun',
  'deckhand',
  'stewardess',
  'guest'
);

create type public.membership_status as enum (
  'active',
  'invited',
  'inactive'
);

create type public.task_status as enum (
  'pending',
  'in_progress',
  'completed',
  'approved'
);

create type public.task_priority as enum (
  'low',
  'normal',
  'high',
  'critical'
);

create type public.department_code as enum (
  'deck',
  'engineering',
  'interior',
  'bridge',
  'admin',
  'general'
);

create type public.expense_category as enum (
  'boat',
  'crew'
);

create type public.money_status as enum (
  'pending',
  'approved',
  'rejected',
  'paid'
);

create type public.route_status as enum (
  'draft',
  'planned',
  'archived'
);

create type public.document_category as enum (
  'manual',
  'insurance',
  'registration',
  'legal',
  'certificate',
  'photo',
  'other'
);

create type public.entity_type as enum (
  'task',
  'maintenance',
  'certificate',
  'expense',
  'quote',
  'approval',
  'route',
  'document',
  'crew_profile'
);

create type public.audit_event_type as enum (
  'create',
  'update',
  'delete',
  'approve',
  'reject',
  'upload'
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.vessels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  name text not null,
  imo_number text,
  registration_number text,
  length_m numeric(8,2),
  beam_m numeric(8,2),
  draft_m numeric(8,2),
  fuel_capacity_l numeric(12,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  default_role public.vessel_role default 'captain',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vessel_memberships (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.vessel_role not null,
  status public.membership_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (vessel_id, profile_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  title text not null,
  description text,
  department public.department_code not null default 'general',
  status public.task_status not null default 'pending',
  priority public.task_priority not null default 'normal',
  assigned_profile_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  due_date date,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  linked_maintenance_id uuid,
  client_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_profile_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.maintenance_items (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  title text not null,
  description text,
  department public.department_code not null default 'engineering',
  area text,
  status public.task_status not null default 'pending',
  frequency_unit text not null default 'months',
  frequency_value integer not null default 1,
  next_due_date date,
  last_completed_at timestamptz,
  assigned_profile_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crew_profiles (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  full_name text not null,
  role_title text not null,
  department public.department_code not null default 'general',
  nationality text,
  joined_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  crew_profile_id uuid references public.crew_profiles(id) on delete set null,
  name text not null,
  certificate_type text,
  issued_by text,
  issue_date date,
  expiry_date date not null,
  status text not null default 'valid',
  document_file_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  category public.expense_category not null,
  title text not null,
  description text,
  amount numeric(12,2) not null default 0,
  currency text not null default 'USD',
  status public.money_status not null default 'pending',
  linked_task_id uuid references public.tasks(id) on delete set null,
  requested_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  expense_id uuid references public.expenses(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  supplier_name text not null,
  amount numeric(12,2) not null default 0,
  currency text not null default 'USD',
  is_selected boolean not null default false,
  status public.money_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  entity_type public.entity_type not null,
  entity_id uuid not null,
  requested_by uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  status public.money_status not null default 'pending',
  decision_note text,
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  name text not null,
  departure_name text,
  arrival_name text,
  status public.route_status not null default 'draft',
  vessel_draft_m numeric(8,2),
  under_keel_clearance_m numeric(8,2),
  speed_kn numeric(8,2),
  fuel_burn_lph numeric(10,2),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.route_waypoints (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  sort_order integer not null,
  label text,
  lat numeric(10,6) not null,
  lng numeric(10,6) not null,
  depth_m numeric(8,2),
  source_depth_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  category public.document_category not null default 'other',
  title text not null,
  description text,
  storage_path text not null,
  mime_type text,
  file_size_bytes bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action_type text not null,
  entity_type public.entity_type not null,
  entity_id uuid,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  entity_type public.entity_type not null,
  entity_id uuid,
  event_type public.audit_event_type not null,
  before_data jsonb,
  after_data jsonb,
  request_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.device_registrations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  vessel_id uuid references public.vessels(id) on delete cascade,
  platform text not null,
  push_token text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, event_type)
);

create index if not exists idx_vessel_memberships_vessel_id on public.vessel_memberships(vessel_id);
create index if not exists idx_vessel_memberships_profile_id on public.vessel_memberships(profile_id);
create index if not exists idx_tasks_vessel_id on public.tasks(vessel_id);
create index if not exists idx_tasks_assigned_profile_id on public.tasks(assigned_profile_id);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_maintenance_items_vessel_id on public.maintenance_items(vessel_id);
create index if not exists idx_maintenance_items_next_due_date on public.maintenance_items(next_due_date);
create index if not exists idx_crew_profiles_vessel_id on public.crew_profiles(vessel_id);
create index if not exists idx_certificates_vessel_id on public.certificates(vessel_id);
create index if not exists idx_certificates_expiry_date on public.certificates(expiry_date);
create index if not exists idx_expenses_vessel_id on public.expenses(vessel_id);
create index if not exists idx_expenses_status on public.expenses(status);
create index if not exists idx_quotes_vessel_id on public.quotes(vessel_id);
create index if not exists idx_routes_vessel_id on public.routes(vessel_id);
create index if not exists idx_route_waypoints_route_id on public.route_waypoints(route_id);
create index if not exists idx_documents_vessel_id on public.documents(vessel_id);
create index if not exists idx_activity_logs_vessel_id on public.activity_logs(vessel_id);
create index if not exists idx_audit_logs_vessel_id on public.audit_logs(vessel_id);

create or replace trigger set_vessels_updated_at
before update on public.vessels
for each row execute function public.set_current_timestamp_updated_at();

create or replace trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_current_timestamp_updated_at();

create or replace trigger set_tasks_updated_at
before update on public.tasks
for each row execute function public.set_current_timestamp_updated_at();

create or replace trigger set_maintenance_items_updated_at
before update on public.maintenance_items
for each row execute function public.set_current_timestamp_updated_at();

create or replace trigger set_crew_profiles_updated_at
before update on public.crew_profiles
for each row execute function public.set_current_timestamp_updated_at();

create or replace trigger set_certificates_updated_at
before update on public.certificates
for each row execute function public.set_current_timestamp_updated_at();

create or replace trigger set_expenses_updated_at
before update on public.expenses
for each row execute function public.set_current_timestamp_updated_at();

create or replace trigger set_quotes_updated_at
before update on public.quotes
for each row execute function public.set_current_timestamp_updated_at();

create or replace trigger set_routes_updated_at
before update on public.routes
for each row execute function public.set_current_timestamp_updated_at();

create or replace trigger set_route_waypoints_updated_at
before update on public.route_waypoints
for each row execute function public.set_current_timestamp_updated_at();

create or replace trigger set_documents_updated_at
before update on public.documents
for each row execute function public.set_current_timestamp_updated_at();

create or replace trigger set_device_registrations_updated_at
before update on public.device_registrations
for each row execute function public.set_current_timestamp_updated_at();

create or replace trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row execute function public.set_current_timestamp_updated_at();
