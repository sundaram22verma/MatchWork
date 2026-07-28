-- MatchWork Complete Schema Migration for Supabase Cloud (Dependency Ordered)

-- 1. EXTENSIONS
create extension if not exists vector;

-- 2. ENUMS
create type public.app_role as enum ('candidate', 'employer');
create type public.posting_status as enum ('open', 'closed');
create type public.application_status as enum ('applied', 'viewed', 'shortlisted', 'rejected', 'closed');

-- 3. TABLES (In dependency order)

-- 3.1 profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.2 candidate_profiles
create table public.candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  headline text not null default '',
  bio text not null default '',
  skills_text text not null default '',
  portfolio_links text not null default '',
  availability text not null default '',
  rate_min integer,
  rate_max integer,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.3 companies
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.4 job_postings (references companies)
create table public.job_postings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  required_skills_text text not null default '',
  budget_min integer,
  budget_max integer,
  contract_length text not null default '',
  status public.posting_status not null default 'open',
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.5 applications (references job_postings)
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references auth.users(id) on delete cascade,
  posting_id uuid not null references public.job_postings(id) on delete cascade,
  employer_id uuid not null references auth.users(id) on delete cascade,
  status public.application_status not null default 'applied',
  match_score real,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (candidate_id, posting_id)
);

-- 4. INDEXES
create index if not exists candidate_profiles_embedding_idx on public.candidate_profiles using hnsw (embedding vector_cosine_ops);
create index if not exists job_postings_embedding_idx on public.job_postings using hnsw (embedding vector_cosine_ops);

-- 5. PERMISSIONS & RLS ENABLEMENT
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

grant select, insert, update, delete on public.candidate_profiles to authenticated;
grant all on public.candidate_profiles to service_role;
alter table public.candidate_profiles enable row level security;

grant select, insert, update, delete on public.companies to authenticated;
grant all on public.companies to service_role;
alter table public.companies enable row level security;

grant select, insert, update, delete on public.job_postings to authenticated;
grant all on public.job_postings to service_role;
alter table public.job_postings enable row level security;

grant select, insert, update, delete on public.applications to authenticated;
grant all on public.applications to service_role;
alter table public.applications enable row level security;

-- 6. POLICIES (Created AFTER all tables exist)
-- Profiles policies
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_self" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (auth.uid() = id);

-- Candidate profiles policies
create policy candidate_profiles_select_scoped on public.candidate_profiles
  for select to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.applications a
      where a.candidate_id = candidate_profiles.user_id
        and a.employer_id = auth.uid()
    )
  );

create policy "candidate_profiles_insert_self" on public.candidate_profiles
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "candidate_profiles_update_self" on public.candidate_profiles
  for update to authenticated
  using (auth.uid() = user_id);

create policy "candidate_profiles_delete_self" on public.candidate_profiles
  for delete to authenticated
  using (auth.uid() = user_id);

-- Companies policies
create policy companies_select_scoped on public.companies
  for select to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.job_postings jp
      where jp.company_id = companies.id
    )
  );

create policy "companies_insert_self" on public.companies
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "companies_update_self" on public.companies
  for update to authenticated
  using (auth.uid() = user_id);

create policy "companies_delete_self" on public.companies
  for delete to authenticated
  using (auth.uid() = user_id);

-- Job postings policies
create policy "job_postings_select_auth" on public.job_postings
  for select to authenticated
  using (true);

create policy "job_postings_insert_owner" on public.job_postings
  for insert to authenticated
  with check (auth.uid() = owner_id);

create policy "job_postings_update_owner" on public.job_postings
  for update to authenticated
  using (auth.uid() = owner_id);

create policy "job_postings_delete_owner" on public.job_postings
  for delete to authenticated
  using (auth.uid() = owner_id);

-- Applications policies
create policy "applications_select_participants" on public.applications
  for select to authenticated
  using (auth.uid() = candidate_id or auth.uid() = employer_id);

create policy "applications_insert_candidate" on public.applications
  for insert to authenticated
  with check (auth.uid() = candidate_id);

create policy "applications_update_employer" on public.applications
  for update to authenticated
  using (auth.uid() = employer_id);

-- 7. TRIGGERS
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists trg_candidate_profiles_updated on public.candidate_profiles;
create trigger trg_candidate_profiles_updated before update on public.candidate_profiles for each row execute function public.set_updated_at();

drop trigger if exists trg_companies_updated on public.companies;
create trigger trg_companies_updated before update on public.companies for each row execute function public.set_updated_at();

drop trigger if exists trg_job_postings_updated on public.job_postings;
create trigger trg_job_postings_updated before update on public.job_postings for each row execute function public.set_updated_at();

drop trigger if exists trg_applications_updated on public.applications;
create trigger trg_applications_updated before update on public.applications for each row execute function public.set_updated_at();

-- 8. FUNCTIONS (RPC)
create or replace function public.match_postings_for_candidate(
  p_candidate_id uuid,
  p_budget_min int default null,
  p_budget_max int default null,
  p_contract_length text default null
) returns table (
  id uuid, company_id uuid, title text, description text, required_skills_text text,
  budget_min int, budget_max int, contract_length text, similarity real, created_at timestamptz
)
language sql stable set search_path = public as $$
  with me as (select embedding from public.candidate_profiles where user_id = p_candidate_id)
  select jp.id, jp.company_id, jp.title, jp.description, jp.required_skills_text,
         jp.budget_min, jp.budget_max, jp.contract_length,
         case when me.embedding is null or jp.embedding is null then null
              else (1 - (jp.embedding <=> me.embedding))::real end as similarity,
         jp.created_at
  from public.job_postings jp cross join me
  where jp.status = 'open'
    and (p_budget_min is null or jp.budget_max is null or jp.budget_max >= p_budget_min)
    and (p_budget_max is null or jp.budget_min is null or jp.budget_min <= p_budget_max)
    and (p_contract_length is null or p_contract_length = '' or jp.contract_length ilike '%' || p_contract_length || '%')
  order by similarity desc nulls last, jp.created_at desc;
$$;

grant execute on function public.match_postings_for_candidate(uuid, int, int, text) to authenticated;

create or replace function public.match_candidates_for_posting(
  p_posting_id uuid
) returns table (
  application_id uuid, candidate_id uuid, headline text, bio text, skills_text text,
  portfolio_links text, availability text, rate_min int, rate_max int,
  status public.application_status, similarity real, applied_at timestamptz
)
language sql stable set search_path = public as $$
  with p as (select embedding, owner_id from public.job_postings where id = p_posting_id)
  select a.id, a.candidate_id, cp.headline, cp.bio, cp.skills_text, cp.portfolio_links,
         cp.availability, cp.rate_min, cp.rate_max, a.status,
         case when cp.embedding is null or p.embedding is null then null
              else (1 - (cp.embedding <=> p.embedding))::real end as similarity,
         a.created_at
  from public.applications a
  join public.candidate_profiles cp on cp.user_id = a.candidate_id
  cross join p
  where a.posting_id = p_posting_id
    and a.employer_id = p.owner_id
  order by similarity desc nulls last, a.created_at desc;
$$;

grant execute on function public.match_candidates_for_posting(uuid) to authenticated;
