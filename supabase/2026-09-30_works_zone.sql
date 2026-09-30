-- works 에 재학생/졸업생 구분 칸 추가 (관리자 페이지 'zone · 구분' 에서 지정, works 페이지 탭으로 나뉨)
-- Supabase 대시보드 > SQL Editor 에서 한 번 실행. 실행 전까지는 모든 작품이 재학생으로 보이고, 관리자 저장도 이 칸만 빼고 정상 저장된다
alter table public.works add column if not exists zone text not null default 'current' check (zone in ('current', 'alumni'));
