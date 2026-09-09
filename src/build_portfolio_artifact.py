# 포트폴리오 아티팩트 빌드 — 저장소 src/ 안에 둠 (스크래치패드는 macOS 가 3일 뒤 지움). portfolio.html → $ARTIFACT_DIR/portfolio-artifact.html (Artifact용: 데이터·Pretendard 인라인, 홈 링크는 홈페이지 Artifact URL, 문서 래퍼 제거)
import base64, re, os
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(REPO, 'src', 'fonts')
S = os.environ.get('ARTIFACT_DIR', '/private/tmp/claude-501/-Users-hanman-Desktop/8a27b8b3-d97a-4829-92e8-11570e006b17/scratchpad')
HOME_ART = 'https://claude.ai/code/artifact/f7932813-5a9c-4a19-983a-91469634ca5e'
s = open(os.path.join(REPO, 'portfolio.html'), encoding='utf-8').read()
data = open(os.path.join(REPO, 'portfolio-data.js'), encoding='utf-8').read()
# 문서 래퍼 제거 (Artifact가 doctype/html/head/body를 씌운다)
s = s.replace('<!doctype html>\n<html lang="ko">\n', '', 1)
s = re.sub(r'\n</html>\s*$', '\n', s)
# config.js 는 아티팩트에서 쓰지 않음 (Supabase 호출이 CSP 로 막힘)
s = s.replace('<script src="config.js"></script>\n', '', 1)
# 데이터 인라인
s = s.replace('<script src="portfolio-data.js"></script>', '<script>\n' + data + '\n</script>', 1)
assert 'window.PORTFOLIO_DATA' in s
# Pretendard: CDN 링크 → woff2 data URI
faces = []
for wgt, fn in ((400, 'Pretendard-Regular.woff2'), (500, 'Pretendard-Medium.woff2'), (600, 'Pretendard-SemiBold.woff2')):
    b = base64.b64encode(open(os.path.join(FONTS, fn), 'rb').read()).decode()
    faces.append("@font-face{font-family:'Pretendard';font-weight:%d;font-display:swap;src:url(data:font/woff2;base64,%s) format('woff2')}" % (wgt, b))
link = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css">'
assert link in s
s = s.replace(link, '<style>' + ''.join(faces) + '</style>', 1)
# 게시 페이지 링크 (아티팩트 안에서는 상대 경로가 안 됨)
s = s.replace('href="submit.html"', 'href="https://digitalarts-homepage.vercel.app/submit"')
# 홈페이지 링크
s = s.replace('href="index.html"', 'href="' + HOME_ART + '"')
os.makedirs(S, exist_ok=True)
out = os.path.join(S, 'portfolio-artifact.html')
open(out, 'w', encoding='utf-8').write(s)
print('wrote', out, len(s), 'bytes; index links:', s.count(HOME_ART))
