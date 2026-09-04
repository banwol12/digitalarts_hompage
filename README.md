# 서울예술대학교 디지털아트전공 홈페이지 — 테스트 배포 안내

정적 페이지 한 장(`index.html`)입니다. 서버 코드가 없어 Vercel 에 그대로 올리면 되고,
05 챕터의 "소식 받기" 폼만 Supabase 테이블에 이메일을 저장합니다.

## 폴더 구성
| 파일 | 역할 |
| --- | --- |
| `index.html` | 홈페이지 전체 (Cascades 토큰·컴포넌트, 픽셀 로고 씬 포함) |
| `config.js` | Supabase URL 과 anon key 를 넣는 자리. 비어 있으면 폼이 "연결 전" 안내만 띄움 |
| `vercel.json` | Vercel 정적 배포 설정 |
| `supabase/schema.sql` | `subscribers` 테이블과 RLS 정책 |
| `logo.png`, `logo-grid.json` | 원본 로고와 32×34 픽셀 그리드 (참고용) |

## 1. Supabase (약 5분)
1. https://supabase.com 에서 New project 생성 (Region: Northeast Asia (Seoul) 권장).
2. 왼쪽 메뉴 SQL Editor → `supabase/schema.sql` 내용을 붙여넣고 Run.
3. Project Settings → API 에서 **Project URL** 과 **anon public** 키를 복사.
4. `config.js` 의 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 에 붙여넣고 저장.
5. 저장된 이메일은 Table Editor → `subscribers` 에서 확인.

## 2. Vercel (약 3분)
터미널에서 이 폴더로 이동한 뒤:

```bash
cd ~/Desktop/seoularts-digital-art
npx vercel login
npx vercel --prod
```

질문이 나오면 모두 Enter(기본값). 끝나면 `https://<프로젝트명>.vercel.app` 주소가 출력됩니다.
CLI 대신 https://vercel.com/new 에서 이 폴더를 드래그해 올려도 같습니다.

수정 후 다시 배포하려면 `npx vercel --prod` 만 다시 실행하면 됩니다.

## 3. 배포 후 확인
- 첫 화면 인트로(픽셀 조립 3초)와 스크롤 챕터 전환
- 05 챕터 폼에 이메일 입력 → "등록되었습니다" → Supabase Table Editor 에 행 생성
- 입학안내 버튼 → 서울예대 입학처 페이지 새 탭

## 4. 포트폴리오 관리자 페이지 (`/admin`)

`admin.html` 에서 작품을 추가·수정·삭제하고 이미지·GIF·영상을 올리면 `portfolio.html` 이 그 데이터를 바로 씁니다.
관리자에서 저장한 작품이 하나도 없으면 사이트는 `portfolio-data.js` 의 자리표시 작품을 보여줍니다.

1. **테이블·저장소 만들기** — Supabase 대시보드 › SQL Editor 에 `supabase/schema.sql` 전체를 붙여넣고 Run.
   (works · site · admins 테이블, `portfolio` 저장소 버킷, 권한 정책이 만들어집니다. 여러 번 실행해도 됩니다.)
2. **관리자 계정** — Authentication › Users › *Add user* 에서 이메일·비밀번호로 계정을 만듭니다.
   Authentication › Providers › Email 에서 *Allow new users to sign up* 을 **끄세요** (아무나 가입하지 못하게).
3. **관리자 등록** — SQL Editor 에서 아래를 실행합니다 (이메일은 2번에서 만든 것).
   ```sql
   insert into public.admins (email) values ('admin@example.com') on conflict do nothing;
   ```
4. **연결 정보** — `config.js` 의 `SUPABASE_URL` · `SUPABASE_ANON_KEY` 를 채웁니다 (1번 Supabase 항목과 같은 값).
5. 배포 뒤 `https://<사이트 주소>/admin` 으로 들어가 로그인합니다.

관리자 페이지에서 할 수 있는 것
- 작품: 제목 · 학생 · 분야(installation / mapping / animation / vfx / game) · 연도 · 도구 · 한 문장 · 본문 · 첫 화면 타일 화면비 · 이미지(jpg/png/gif) · 영상(mp4/webm) · 공개 여부, 목록 순서(▲▼). 번호는 순서대로 001부터 자동.
- 사이트 정보: 목록 페이지 첫 문장, 첫 화면 태그라인, strapline, 소개, 연락처.
- 올린 파일은 Supabase Storage 의 `portfolio` 버킷에 들어가고 공개 주소로 사이트에 표시됩니다.

주의: anon key 는 공개용이라 코드에 넣어도 되지만, 쓰기는 `admins` 에 등록된 이메일로 로그인한 계정만 가능하도록 정책이 걸려 있습니다.
