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
