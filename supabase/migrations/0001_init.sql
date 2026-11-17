-- Portfolio schema. Run in the Supabase SQL editor (or `supabase db push`).
-- Owner approach: a fixed email check in RLS via public.is_owner().
-- The owner account must be created in Auth with this exact email and a confirmed address.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- helpers
create or replace function public.is_owner()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'yunuszanzi@gmail.com'
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- tables
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text not null default '',
  hero_eyebrow text not null default '',
  hero_headline text not null default '',
  hero_subheading text not null default '',
  cta_primary_label text not null default 'See the work',
  cta_secondary_label text not null default 'Say hello',
  now_text text not null default '',
  based_text text not null default '',
  open_to_text text not null default '',
  about_headline text not null default '',
  about_paragraphs text not null default '',
  contact_headline text not null default '',
  contact_pitch text not null default '',
  email text not null default '',
  phone text not null default '',
  social_links jsonb not null default '[]'::jsonb,
  seo_title text not null default '',
  seo_description text not null default '',
  og_image_url text,
  og_image_path text,
  accent_color text not null default '#e9b44c',
  resume_url text,
  resume_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Only one settings row can exist.
create unique index site_settings_single_row on public.site_settings ((true));

create table public.stats (
  id uuid primary key default gen_random_uuid(),
  value text not null,
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.project_categories (id) on delete set null,
  title text not null,
  slug text not null unique,
  year text not null default '',
  description text not null default '',
  role text not null default '',
  tech text[] not null default '{}',
  live_url text,
  repo_label text,
  repo_url text,
  is_private boolean not null default false,
  feature_groups jsonb not null default '[]'::jsonb, -- [{ "heading": "", "bullets": [""] }]
  cover_image_url text,
  cover_image_path text,
  featured boolean not null default false,
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_category_idx on public.projects (category_id);

create table public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  image_url text not null,
  storage_path text not null,
  caption text not null default '',
  step_label text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index project_images_project_idx on public.project_images (project_id);

create table public.skill_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  skills text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  company text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  bullets text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.education (
  id uuid primary key default gen_random_uuid(),
  degree text not null,
  institution text not null,
  start_year text not null default '',
  end_year text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.also_shipped (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint messages_name_len check (char_length(name) between 1 and 120),
  constraint messages_email_fmt check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200),
  constraint messages_message_len check (char_length(message) between 10 and 5000)
);

-- ---------------------------------------------------------------- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array[
    'site_settings','stats','services','project_categories','projects','project_images',
    'skill_groups','experiences','education','also_shipped','messages'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_updated_at', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------- Row Level Security
alter table public.site_settings enable row level security;
alter table public.stats enable row level security;
alter table public.services enable row level security;
alter table public.project_categories enable row level security;
alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.skill_groups enable row level security;
alter table public.experiences enable row level security;
alter table public.education enable row level security;
alter table public.also_shipped enable row level security;
alter table public.messages enable row level security;

-- Simple content tables: everyone reads, owner writes.
do $$
declare t text;
begin
  foreach t in array array[
    'site_settings','stats','services','project_categories','skill_groups',
    'experiences','education','also_shipped'
  ] loop
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t || '_read', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_owner())', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_owner()) with check (public.is_owner())', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_owner())', t || '_delete', t);
  end loop;
end $$;

-- Projects: public sees published only; owner sees everything.
create policy projects_read on public.projects
  for select to anon, authenticated
  using (published = true or public.is_owner());
create policy projects_insert on public.projects
  for insert to authenticated with check (public.is_owner());
create policy projects_update on public.projects
  for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy projects_delete on public.projects
  for delete to authenticated using (public.is_owner());

-- Project images follow their project's visibility.
create policy project_images_read on public.project_images
  for select to anon, authenticated
  using (
    public.is_owner()
    or exists (select 1 from public.projects p where p.id = project_id and p.published = true)
  );
create policy project_images_insert on public.project_images
  for insert to authenticated with check (public.is_owner());
create policy project_images_update on public.project_images
  for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy project_images_delete on public.project_images
  for delete to authenticated using (public.is_owner());

-- Messages: anyone may send one (is_read must stay false); only the owner reads or manages them.
create policy messages_insert_public on public.messages
  for insert to anon, authenticated
  with check (is_read = false);
create policy messages_select_owner on public.messages
  for select to authenticated using (public.is_owner());
create policy messages_update_owner on public.messages
  for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy messages_delete_owner on public.messages
  for delete to authenticated using (public.is_owner());

-- ---------------------------------------------------------------- Storage
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do update set public = true;

create policy portfolio_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'portfolio');
create policy portfolio_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portfolio' and public.is_owner());
create policy portfolio_owner_update on storage.objects
  for update to authenticated
  using (bucket_id = 'portfolio' and public.is_owner())
  with check (bucket_id = 'portfolio' and public.is_owner());
create policy portfolio_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'portfolio' and public.is_owner());
