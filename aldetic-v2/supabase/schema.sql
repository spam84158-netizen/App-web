-- Schéma initial Aldetic. À exécuter une fois dans Supabase > SQL Editor.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  lang text default 'fr',
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_at timestamptz default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists job_offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  published boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references job_offers(id) on delete cascade,
  email text not null,
  cv_url text,
  status text not null default 'received' check (status in ('received','review','interview','hired','rejected','archived')),
  created_at timestamptz default now()
);

create table if not exists user_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','moderator','tech_lead','recruiter','support')),
  primary key (user_id, role)
);

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function handle_new_user();

alter table profiles enable row level security;
alter table projects enable row level security;
alter table posts enable row level security;
alter table job_offers enable row level security;
alter table applications enable row level security;
alter table user_roles enable row level security;

create policy "profils publics" on profiles for select using (true);
create policy "profil modifiable par son auteur" on profiles for update using (auth.uid() = id);

create policy "projets publics ou propres" on projects for select
  using (visibility = 'public' or owner_id = auth.uid());
create policy "creer son projet" on projects for insert with check (owner_id = auth.uid());
create policy "modifier son projet" on projects for update using (owner_id = auth.uid());
create policy "supprimer son projet" on projects for delete using (owner_id = auth.uid());

create policy "publications lisibles" on posts for select using (true);
create policy "publier soi-meme" on posts for insert with check (author_id = auth.uid());
create policy "supprimer sa publication" on posts for delete using (author_id = auth.uid());

create policy "offres publiees" on job_offers for select using (published = true);

create policy "candidater" on applications for insert with check (true);
create policy "lecture candidatures recruteurs" on applications for select
  using (exists (select 1 from user_roles r where r.user_id = auth.uid() and r.role in ('owner','admin','recruiter')));

create policy "roles visibles par leur titulaire" on user_roles for select using (user_id = auth.uid());

-- Dépôts MY GIT et déploiements MY CLOUD
create table if not exists repositories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null check (name ~ '^[A-Za-z0-9._-]+$'),
  description text,
  visibility text not null default 'private' check (visibility in ('public','private')),
  remote_url text,
  created_at timestamptz default now(),
  unique (owner_id, name)
);
create table if not exists deployments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','building','ready','failed')),
  public_url text,
  build_log text,
  created_at timestamptz default now()
);
alter table repositories enable row level security;
alter table deployments enable row level security;
create policy "dépôts publics ou propres" on repositories for select using (visibility = 'public' or owner_id = auth.uid());
create policy "créer son dépôt" on repositories for insert with check (owner_id = auth.uid());
create policy "supprimer son dépôt" on repositories for delete using (owner_id = auth.uid());
create policy "déploiements propres" on deployments for select using (owner_id = auth.uid());
create policy "déploiements créés par soi" on deployments for insert with check (owner_id = auth.uid());

-- ===== Administration =====
create or replace function is_staff(roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from user_roles where user_id = auth.uid() and role = any(roles));
$$;

create policy "candidatures : staff" on applications for select using (is_staff(array['owner','admin','recruiter']));
create policy "candidatures : mise à jour staff" on applications for update using (is_staff(array['owner','admin','recruiter']));
create policy "offres : gestion staff" on job_offers for all using (is_staff(array['owner','admin','recruiter'])) with check (is_staff(array['owner','admin','recruiter']));
create policy "roles : lecture staff" on user_roles for select using (is_staff(array['owner','admin']));

-- Attribution du rôle propriétaire : à exécuter UNE FOIS, après que le compte s'est inscrit.
-- Le compte propriétaire est identifié ici côté base, jamais dans le code du site.
insert into user_roles (user_id, role)
select id, 'owner' from auth.users where email = 'uyurei954@gmail.com'
on conflict do nothing;

-- ===== Téléphone et assistant IA =====
alter table profiles add column if not exists phone text unique;
alter table profiles add column if not exists phone_verified boolean not null default false;

create table if not exists ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
alter table ai_usage enable row level security;
create policy "usage IA : lecture propre" on ai_usage for select using (user_id = auth.uid());
-- Insertion uniquement par la fonction serveur ask-ai (clé service_role).
