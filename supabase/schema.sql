-- 서울예술대학교 디지털아트전공 홈페이지 · 소식 받기 구독자 테이블
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run 하세요.

create table if not exists public.subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique check (position('@' in email) > 1),
  source      text not null default 'homepage',
  created_at  timestamptz not null default now()
);

-- 브라우저(anon key)에서는 insert 만 가능. 목록 조회는 대시보드(Table Editor)에서만.
alter table public.subscribers enable row level security;

drop policy if exists "anon can subscribe" on public.subscribers;
create policy "anon can subscribe"
  on public.subscribers for insert
  to anon
  with check (true);


-- ─────────────────────────────────────────────────────────────
-- 포트폴리오 관리자 페이지 (admin.html) — 작품 · 사이트 정보 · 관리자 · 저장소
-- 이 파일 전체를 SQL Editor 에 붙여넣고 Run 하면 됩니다 (여러 번 실행해도 안전).
-- ─────────────────────────────────────────────────────────────

-- 관리자 목록: 여기 등록된 이메일로 로그인한 계정만 쓰기 가능
create table if not exists public.admins (
  email       text primary key,
  created_at  timestamptz not null default now()
);
alter table public.admins enable row level security;
drop policy if exists "admin reads own row" on public.admins;
create policy "admin reads own row" on public.admins for select to authenticated
  using (email = (auth.jwt() ->> 'email'));

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = (auth.jwt() ->> 'email'));
$$;

-- 작품
create table if not exists public.works (
  id          uuid primary key default gen_random_uuid(),
  sort        integer not null default 0,
  slug        text not null unique,
  title       text not null default '',
  student     text not null default '',
  category    text not null default 'installation',   -- installation | mapping | animation | vfx | game
  year        text not null default '',
  tools       text[] not null default '{}',
  statement   text not null default '',
  paragraphs  text[] not null default '{}',
  ratio       text not null default '16:10',          -- 첫 화면 궤도 타일 화면비
  image       text,                                   -- jpg · png · gif 주소 (portfolio 버킷 공개 URL)
  video       text,                                   -- mp4 · webm 주소
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.works enable row level security;
drop policy if exists "public reads published works" on public.works;
create policy "public reads published works" on public.works for select to anon
  using (published);
drop policy if exists "admin reads all works" on public.works;
create policy "admin reads all works" on public.works for select to authenticated
  using (published or public.is_admin());
drop policy if exists "admin writes works" on public.works;
create policy "admin writes works" on public.works for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 사이트 정보 (statement · taglines · strapline · intro · contact)
create table if not exists public.site (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);
alter table public.site enable row level security;
drop policy if exists "public reads site" on public.site;
create policy "public reads site" on public.site for select to anon, authenticated using (true);
drop policy if exists "admin writes site" on public.site;
create policy "admin writes site" on public.site for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 저장소: 이미지 · GIF · 영상 (공개 읽기, 관리자만 올리기)
insert into storage.buckets (id, name, public, file_size_limit)
  values ('portfolio', 'portfolio', true, 52428800)
  on conflict (id) do update set public = true, file_size_limit = 52428800;
drop policy if exists "portfolio public read" on storage.objects;
create policy "portfolio public read" on storage.objects for select to public
  using (bucket_id = 'portfolio');
drop policy if exists "portfolio admin insert" on storage.objects;
create policy "portfolio admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and public.is_admin());
drop policy if exists "portfolio admin update" on storage.objects;
create policy "portfolio admin update" on storage.objects for update to authenticated
  using (bucket_id = 'portfolio' and public.is_admin());
drop policy if exists "portfolio admin delete" on storage.objects;
create policy "portfolio admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and public.is_admin());

-- 관리자 등록 (이메일을 본인 것으로 바꿔 실행)
-- insert into public.admins (email) values ('admin@example.com') on conflict do nothing;
