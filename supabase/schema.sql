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
