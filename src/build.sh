#!/bin/bash
# 홈페이지 빌드 — src/seoularts-base.html 이 유일한 원본입니다.
#   (1) ../index.html            : doctype 래퍼 + CDN 서체 (Vercel 배포용)
#   (2) $ARTIFACT_DIR/seoularts-digital-art.html : Artifact 미리보기용 (Pretendard 400/500/600 내장, 포트폴리오 링크 → 포트폴리오 Artifact 주소)
set -e
cd "$(dirname "$0")"
D="$(cd .. && pwd)"
OUT="${ARTIFACT_DIR:-/private/tmp/claude-501/-Users-hanman-Desktop/8a27b8b3-d97a-4829-92e8-11570e006b17/scratchpad}"
{ printf '<!doctype html>\n<html lang="ko">\n'; cat seoularts-base.html; printf '\n</html>\n'; } > "$D/index.html"
python3 - "$OUT" <<'PY'
import base64, sys, os
out = os.path.join(sys.argv[1], 'seoularts-digital-art.html')
base = open('seoularts-base.html', encoding='utf-8').read()
b64 = lambda fn: base64.b64encode(open(os.path.join('fonts', fn), 'rb').read()).decode()
css = ("<style>\n/* 아티팩트 미리보기용: 외부 서체가 차단되므로 Pretendard 400·500·600 을 파일에 내장 (배포 사이트는 CDN 사용) */\n"
  "@font-face{font-family:'Pretendard';font-weight:400;font-display:swap;src:url(data:font/woff2;base64," + b64('Pretendard-Regular.woff2') + ") format('woff2')}\n"
  "@font-face{font-family:'Pretendard';font-weight:500;font-display:swap;src:url(data:font/woff2;base64," + b64('Pretendard-Medium.woff2') + ") format('woff2')}\n"
  "@font-face{font-family:'Pretendard';font-weight:600;font-display:swap;src:url(data:font/woff2;base64," + b64('Pretendard-SemiBold.woff2') + ") format('woff2')}\n</style>\n")
marker = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600&display=swap">\n'
assert marker in base
s = base.replace(marker, marker + css, 1)
s = s.replace('href="portfolio.html', 'href="https://claude.ai/code/artifact/87670581-6025-4dd2-ad5c-c5d7289ca639')   # 아티팩트 안에서는 상대 경로가 안 됨
os.makedirs(sys.argv[1], exist_ok=True)
open(out, 'w', encoding='utf-8').write(s)
print('built: index.html + ' + out)
PY
