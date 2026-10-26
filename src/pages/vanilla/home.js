(function(){
  'use strict';
  document.documentElement.classList.add('js');
  var STATIC = /[?&]static=1/.test(location.search);
  var reduce = STATIC || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PACE = 0.95;                                                /* 모든 연출 시간 배율 (09-28 사용자: 너무 빠르다 → 1.15, 10-06: 전체를 조금 빠르게 → 0.95). 로고 숨쉬기 주기는 따로 */
  var IK = 1.7;                                                    /* 첫 입장 시간 배율 (사용자 2026-09-28: 인트로가 너무 빠르다 → 1 에서 1.5, 다시 '정말 조금만 더' 1.7). 챕터 전환은 PACE */
  var introReduce = true;                                         /* 첫 입장 애니메이션 없음 (사용자 10-12): 로딩 로고가 커져 첫 화면 로고가 된다 (index.html) — STATIC 으로 되돌리면 예전 입장 */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';   /* 새로고침해도 항상 맨 위(00 챕터)에서 시작 */
  var pendingHash = /^#c\d$/.test(location.hash) ? parseInt(location.hash.slice(2), 10) : null;
  if (location.hash && !STATIC) history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo(0, 0);
  var ONLY = STATIC ? (location.search.match(/[?&]only=(\d)/) || [])[1] : null;
  if (STATIC) document.documentElement.classList.add('static');
  if (STATIC) document.documentElement.classList.remove('booting');
  /* 제목 줄 나누기: <br> 로 나뉜 줄마다 마스크(.ln)를 씌운다 — 챕터에 들어올 때 줄 단위로 밀려 올라온다. 00 의 전공명은 낱말 단위 */
  Array.prototype.forEach.call(document.querySelectorAll('.chapter .h2'), function(h){ h.innerHTML = h.innerHTML.split(/<br\s*\/?>/i).map(function(t){ return '<span class="ln"><span>' + t.trim() + '</span></span>'; }).join(''); });
  (function(){ var sub = document.querySelector('.intro-sub'), tt = document.querySelector('.intro-title'); if (sub) sub.innerHTML = '<span class="ln"><span>' + sub.innerHTML + '</span></span>'; if (tt) tt.innerHTML = '<span class="ln">' + tt.textContent.trim().split(/\s+/).map(function(w){ return '<span>' + w + '</span>'; }).join(' ') + '</span>'; })();
  if (ONLY !== null && ONLY !== undefined) { var onlyEl = document.getElementById('c' + ONLY); if (onlyEl) onlyEl.classList.add('only'); document.documentElement.classList.add('only-mode'); }

  /* ── 로고 픽셀 그리드 (32×34) — 원본 로고에서 추출 ── */
  var GRID = [
    "......................#.........",
    "............#####.....#.........",
    ".........############..#........",
    ".......###############.#........",
    "......################.#........",
    ".....#################.#..#.....",
    "....#############.####.#..#.....",
    "...##############.####.#..##....",
    "..###############..##..#.###....",
    ".################..#..##.###....",
    ".################..#..#..####.#.",
    ".##########.#####....##..####.#.",
    "###########..####....##.##.##.#.",
    "############.####...##..##.#..##",
    "############..##....##..##.#.###",
    "############..##....##..##.#.###",
    "############..##...###..##...###",
    "############..##..####...#...###",
    "########.###..#...####...#...###",
    "#######..##.......#####..##..###",
    "#######..##.......#####...#..###",
    ".######..##...##...####.....#.##",
    ".######..#...###...#####......#.",
    ".######..#...##.....####......#.",
    "..#####..##..##.....#####....##.",
    "..######..#...##.....#####...#..",
    "...###.#......##..#..#####..#...",
    "....##.........#..#....###..#...",
    ".....##.........#.##....#..#....",
    "......##...........###..........",
    ".......##..###......###.........",
    "...........###......####........",
    "...........####......###........",
    "............###................."
  ];

  /* ── 씬: 고정 캔버스 하나. 챕터마다 픽셀 배열(포메이션)이 바뀐다 ── */
  var canvas = document.getElementById('scene');
  var chapters = Array.prototype.slice.call(document.querySelectorAll('.chapter'));
  var boxes = [], N = 0, CX = 17, CY = 17, R = 17.7;
  /* 02 챕터에서 픽셀이 풀리며 변하는 코드 조각 — C++ 과 Python 의 변수·함수 (사용자 요청: 터치디자이너 위주에서 변경) */
  var TOKENS = ['float', 'int', 'auto', 'nullptr', 'std::vector', 'std::sin(t)', 'class Particle', 'update(dt)', 'const float dt', '#include <cmath>', 'pos += vel * dt', 'template<T>', 'new Pixel[n]', 'return pos;',
                'def render():', 'import numpy', 'np.zeros(n)', 'self.vel += g', 'lambda x: x * x', 'async def loop', 'yield frame', 'range(len(px))', 'True', 'None', 'print(fps)', '__main__', 'for i in range', 'dt = 1 / 60'];
  var GLYPH = '<>/\\|{}[]#$%&*+=01_', GL_DUR = 0.24;                       /* 01 ③ 글리치: 섞이는 글자 · 길이(초) */
  GRID.forEach(function(row, r){
    for (var c = 0; c < row.length; c++) {
      if (row[c] !== '#') continue;
      var x = c + 0.5 - CX, y = r + 0.5 - CY, d = Math.sqrt(x*x + y*y);
      var bulge = Math.sqrt(Math.max(0, 1 - (d*d) / (R*R)));
      var ang = Math.random() * Math.PI * 2, mag = 24 + Math.random() * 30, seed = Math.random(), seed2 = Math.random();
      boxes.push({ gx: x, gy: y, h: 0.5 + 1.3 * bulge, r: r, c: c, seed: seed, seed2: seed2,
        kind: 'none', token: TOKENS[Math.floor(seed2 * TOKENS.length)], rot: seed * 6.283,
        cur: { x: Math.cos(ang) * mag, y: Math.sin(ang) * mag, z: (Math.random() - 0.5) * 40 },
        from: null, to: null, t0: 0, tw: 0, dur: 1, m: 0, mFrom: 0, mTo: 0, fc: 0, fr: 0,
        ox: 0, oy: 0, vx: 0, vy: 0, pox: 0, poy: 0, sx: 0, sy: 0, sw: 0, sh: 0, held: false, thrown: false, rest: false, launched: false, hitT: 0, drawK: 0,
        pp: 9.2 + Math.random() * 9.3, po: Math.random() * 18, bw: 0.36 + Math.random() * 0.52, pulse: 0,  /* 살아 있는 로고: 픽셀마다 제 주기로 숨쉬고 가끔 앞으로 튀어나온다 (2026-09-28 사용자: 자글자글하다 → 주기 35% 느리게) */
        tl: 0, sa: 0, ax: 0, ay: 0, az: 0, a0: 1, szf0: 1 });                                                            /* 착지 시각·착지 반동 크기·곡선 경로의 휘는 양 */
    }
  });
  N = boxes.length;
  /* 01 ③ 코드로 쓴 로고 (사용자 10-26: 흩어진 코드 조각이 겹쳐 지저분 → 로고 한 줄 한 줄을 코드 한 줄로). 가로로 이어진 칸 묶음(140개)마다 맨 앞 칸이 그 묶음 폭만큼의 코드 한 줄을 맡는다 */
  var SYM = ['{}', '()', '[]', '=>', '++', '::', '<>', '&&', '||', '==', '!=', '//', '0x1', '01', '*=', '->', '%', ';', '#', '|'];   /* 1–3 칸짜리 짧은 묶음은 기호로 */
  function codeLine(){ var s = ''; while (s.length < 90) s += TOKENS[Math.floor(Math.random() * TOKENS.length)] + ' '; return s; }
  (function(){
    var at = {}; boxes.forEach(function(b){ at[b.r + ',' + b.c] = b; });
    GRID.forEach(function(row, r){ for (var c = 0; c < row.length; c++) { if (row[c] !== '#' || row[c - 1] === '#') continue; var n = 0; while (row[c + n] === '#') n++; var b = at[r + ',' + c]; b.kind = 'code'; b.run = { n: n, x: b.gx + (n - 1) / 2 }; b.line = codeLine(); b.pn = -1; } });
  })();
  /* 02 챕터 코드 조각: VS Code Dark+ 배색으로 토큰을 부분별 채색 */
  var VS = { ctrl:'#C586C0', type:'#569CD6', fn:'#DCDCAA', num:'#B5CEA8', str:'#CE9178', vari:'#9CDCFE', td:'#4EC9B0', punc:'#D4D4D4' };
  var VS_PAPER = { '#C586C0':'#A8288F', '#569CD6':'#1D63B8', '#DCDCAA':'#1E7F7A', '#B5CEA8':'#5A3FC0', '#CE9178':'#C0362C', '#9CDCFE':'#2B3440', '#4EC9B0':'#8B5A1E', '#D4D4D4':'#7A808A' };   /* 흰 바탕(01 ③): Xcode·VS Code Light+·GitHub Light 를 참고한 밝은 테마 — 키워드 자홍 · 타입 파랑 · 함수 청록 · 숫자 보라 · 문자열 빨강 · 네임스페이스 갈색 · 변수 먹 · 기호 회색 (사용자 10-12: 너무 한 색 같다) */
  var KW_CTRL = { 'for':1, 'if':1, 'else':1, 'return':1, 'while':1, 'import':1, 'yield':1, 'async':1, 'await':1, 'include':1, 'new':1, 'in':1 };
  var KW_TYPE = { 'float':1, 'int':1, 'void':1, 'const':1, 'auto':1, 'class':1, 'def':1, 'template':1, 'typename':1, 'nullptr':1, 'True':1, 'None':1, 'lambda':1, 'self':1, 'vector':1 };
  var KW_NS = { 'std':1, 'np':1, 'numpy':1, 'Particle':1, 'Pixel':1, 'T':1 };
  function lexParts(tok){
    var re = /(#[0-9A-Fa-f]{3,6}\b)|("[^"]*"|'[^']*')|(0x[0-9A-Fa-f]+|\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|(.)/g, m, parts = [];
    while ((m = re.exec(tok))) {
      if (m[1]) parts.push([m[1], VS.str]);
      else if (m[2]) parts.push([m[2], VS.str]);
      else if (m[3]) parts.push([m[3], VS.num]);
      else if (m[4]) { var w = m[4], nx = tok.charAt(re.lastIndex); parts.push([w, KW_CTRL[w] ? VS.ctrl : KW_TYPE[w] ? VS.type : KW_NS[w] ? VS.td : nx === '(' ? VS.fn : VS.vari]); }
      else if (m[5]) parts.push([m[5], VS.punc]);
      else parts.push([m[6], VS.punc]);
    }
    return parts;
  }
  boxes.forEach(function(b){ b.parts = lexParts(b.token); });
  /* 02 기획·연출 평면도 (사용자 10-26 ②): 칸마다 갈 자리 — 0 바깥벽(입구·출구 틈) · 1 칸막이 둘 · 2 A 영상 스크린 · 3 B 키네틱 기둥 5×9 · 4 C 공(복셀 21칸) · 5 바닥 타일(고른 격자) · 6 관객 · 7 남는 칸(숨김).
     벽·설치물 자리를 먼저 가장 가까운 칸이 맡고, 관객은 동선 위, 바닥은 남은 칸 수에 맞춘 격자 — 격자에 못 든 칸은 숨는다 */
  var FP = [[-12, 13], [-12, 6], [-10.5, -3], [-8.5, -2], [-7.5, 6], [-4, 7.6], [0, 7.4], [3.7, 5], [3.7, -6.5], [6.5, -7.6], [8, -3.6], [12, -4], [12, -13]], FPL = [0], NV = 30;   /* 관객 동선: 입구 → A 영상 앞 → B 키네틱 옆 → C 공 앞 → 출구 */
  for (var fpi = 1; fpi < FP.length; fpi++) FPL.push(FPL[fpi - 1] + Math.hypot(FP[fpi][0] - FP[fpi - 1][0], FP[fpi][1] - FP[fpi - 1][1]));
  function pathAt(u){ var d = u * FPL[FPL.length - 1], k = 1; while (k < FPL.length - 1 && FPL[k] < d) k++; var f = (d - FPL[k - 1]) / (FPL[k] - FPL[k - 1]); return [FP[k - 1][0] + (FP[k][0] - FP[k - 1][0]) * f, FP[k - 1][1] + (FP[k][1] - FP[k - 1][1]) * f]; }
  var KF = [], BALL = [], BC = [10, 4], BR = 2.5, BA0 = Math.PI / 2, BALLR = 1.55, C2F0 = 2.35;   /* B 기둥 자리 · C 공 칸 자리 · 공은 원(BC, BR)을 따라 세 번 튀어 제자리로 · 바닥 높이(그림자 받는 면 바로 위) */
  for (var kx = -2; kx <= 2; kx++) for (var ky = 0; ky < 9; ky++) KF.push([kx * 1.2, -6 + ky * 1.2]);
  for (var bx2 = -2; bx2 <= 2; bx2++) for (var by2 = -2; by2 <= 2; by2++) if (Math.abs(bx2) + Math.abs(by2) < 4) BALL.push([bx2 * 0.62, by2 * 0.62]);
  function ballAt(u){ var ph = u * 3, hp = Math.min(2, Math.floor(ph)), f = ph - hp, a = BA0 + 6.2832 * u; return [BC[0] + BR * Math.cos(a), BC[1] + BR * Math.sin(a), u > 0 && u < 1 ? [3.4, 2.4, 1.5][hp] * 4 * f * (1 - f) : 0]; }   /* 공 중심 x · y · 바닥에서 뜬 높이 (튈 때마다 낮게, 포물선) */
  (function(){
    var T = [], used = {}, put = function(x, y, k){ if (used[x + ',' + y]) return; used[x + ',' + y] = 1; T.push({ x: x, y: y, k: k }); }, x, y, j;
    for (x = -15; x <= 15; x++) { if (x < -13 || x > -11) put(x, 11, 0); if (x < 11 || x > 13) put(x, -11, 0); }
    for (y = -10; y <= 10; y++) { put(-15, y, 0); put(15, y, 0); }
    for (y = -10; y <= 3; y++) put(-5, y, 1); for (y = -3; y <= 10; y++) put(5, y, 1);
    for (x = -13; x <= -7; x++) put(x, -9, 2);
    KF.forEach(function(p, q){ T.push({ x: p[0], y: p[1], k: 3, j: q }); });
    BALL.forEach(function(p){ T.push({ x: BC[0], y: BC[1] + BR, k: 4, ox: p[0], oy: p[1] }); });
    for (j = 0; j < NV; j++) { var vp = pathAt(j / NV); T.push({ x: vp[0], y: vp[1], k: 6, j: j }); }
    var nf = boxes.length - T.length, fl = [], gs;
    var okF = function(x, y){ return Math.abs(x) <= 14.1 && Math.abs(y) <= 10.1 && !(Math.abs(x + 5) < 1 && y < 4) && !(Math.abs(x - 5) < 1 && y > -4) && !(x < -6 && y < -7.9) && !(Math.abs(x) < 3 && y > -6.6 && y < 4.2); };
    for (gs = 1.15; gs < 3; gs += 0.01) { fl = []; for (var gi = -12; gi <= 12; gi++) for (var gj = -9; gj <= 9; gj++) if (okF(gi * gs, gj * gs)) fl.push([gi * gs, gj * gs]); if (fl.length <= nf) break; }
    fl.forEach(function(f){ T.push({ x: f[0], y: f[1], k: 5 }); });
    for (j = fl.length; j < nf; j++) T.push({ x: 0, y: 0, k: 7 });
    T.forEach(function(tg){ var d = Math.hypot(tg.x + 12, tg.y - 11) / 34; tg.ft = tg.k === 5 ? 5.1 + 0.7 * d : tg.k <= 1 ? 5.3 + 0.8 * d : tg.k === 6 ? 6.0 + 0.4 * d : 5.65 + 0.5 * d; });   /* 채워지는 시각: 입구 쪽부터 — 바닥 → 벽 → 설치물 → 관객 */
    var free = boxes.slice();
    T.forEach(function(tg){ var bi = 0, bd = 1e9; for (var q = 0; q < free.length; q++) { var d = (free[q].gx - tg.x) * (free[q].gx - tg.x) + (free[q].gy - tg.y) * (free[q].gy - tg.y); if (d < bd) { bd = d; bi = q; } } free[bi].pl = tg; free.splice(bi, 1); });
  })();
  var FCOLS = 24, FROWS = Math.ceil(N / FCOLS);   /* 24 열: 02 오른쪽 칸(세로로 긴 영역)에 맞게 정사각형에 가깝게 — 원근으로 깊이가 산다 */
  boxes.forEach(function(b, i){ b.fc = i % FCOLS; b.fr = Math.floor(i / FCOLS); });

  /* 포메이션: 각 픽셀의 목표 위치(로고 단위) */
  var FORM = {
    logo:  function(b){ return { x: b.gx, y: b.gy, z: 0 }; },
    code:  function(b){ return { x: b.run ? b.run.x : b.gx, y: b.gy, z: 0 }; },   /* 코드 줄은 제 묶음 가운데, 나머지 칸은 제자리에서 작아져 사라진다 */
    burst: function(b){ return { x: b.gx * (MOBILE() ? 1.5 : 1.25) + (b.seed - 0.5) * 6, y: b.gy * (MOBILE() ? 1.8 : 1.15) + (b.seed2 - 0.5) * 5, z: (b.seed - 0.5) * 26 }; },   /* 폰: 세로로 더 퍼뜨려 좁고 긴 영역을 채운다 */
    field: function(b){ return { x: (b.fc - (FCOLS - 1) / 2) * 1.3, y: (b.fr - (FROWS - 1) / 2) * 1.3, z: 0 }; }
  };
  /* 01 ① 윤곽 추적용: 칸마다 가장자리 여부 · 가장자리에서 안쪽으로 몇 칸인지 (빈칸에서 출발하는 BFS) */
  (function(){
    var LH = GRID.length, LW = 32, dist = new Int16Array(LW * LH).fill(-1), q = [], i, r, c, k;
    for (r = 0; r < LH; r++) for (c = 0; c < LW; c++) if (GRID[r][c] !== '#') { dist[r * LW + c] = 0; q.push(r * LW + c); }
    for (i = 0; i < q.length; i++) { r = Math.floor(q[i] / LW); c = q[i] % LW; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function(d){ var rr = r + d[0], cc = c + d[1]; if (rr < 0 || cc < 0 || rr >= LH || cc >= LW || dist[rr * LW + cc] >= 0) return; dist[rr * LW + cc] = dist[q[i]] + 1; q.push(rr * LW + cc); }); }
    for (k = 0; k < N; k++) { var bb = boxes[k], dd = dist[bb.r * LW + bb.c]; bb.dep = dd < 0 ? 1 + Math.min(bb.r, bb.c, LH - 1 - bb.r, LW - 1 - bb.c) : dd; bb.edge = bb.dep <= 1; bb.ang = Math.atan2(bb.gy, bb.gx); }
  })();
  /* 챕터별 회전·동작 설정. 위치와 크기는 frameFor() 가 화면과 텍스트를 실측해 "빈 영역"에 맞춘다 */
  var CHAPTERS = [
    { form: 'logo',  yaw: 0,    pitch: -0.08, sway: 0,    spin: 0,    morph: 0, flow: 0, live: 1,   sMax: 1.0,  sMin: 0.2,  fit: 0.9, wall: -5.5, head: 1 },   /* sway 0: 첫 챕터는 카메라가 전혀 돌지 않는다 (인트로 끝에 흔들림이 시작되는 게 회전처럼 보였다) */
    { form: 'logo',  yaw: 0,    pitch: 0,     sway: 0,    spin: 0,    morph: 0, flow: 0, live: 0,   sMax: 0.85, sMin: 0.2,  fit: 0.9, flat: 1, wall: -5.5 },   /* 01 은 2D: 정면 · 납작 · 로고 색 하나 · 그림자 없음 (사용자 10-12: ② 3D·VFX 만 입체로 — 그래야 거기서 강렬하다) */
    { form: 'field', yaw: 0,    pitch: -1.1,  sway: 0.02, spin: 0,    morph: 0, flow: 1, live: 0,   sMax: 1.0,  sMin: 0.3,  fit: 0.9, wall: -2.6 },   /* 3D: 벽이 필드 바로 아래 바닥이 된다 */
    { form: 'logo',  yaw: 0.1,  pitch: -0.1,  sway: 0.15, spin: 0,    morph: 0, flow: 0, live: 0.4, sMax: 1.0,  sMin: 0.18, fit: 0.92, alpha: 0.14, wall: -5.5 },
    { form: 'logo',  yaw: 0,    pitch: -0.05, sway: 0.18, spin: 0,    morph: 0, flow: 0, live: 0.6, sMax: 0.6,  sMin: 0.18, fit: 0.9, wall: -5.5 }
  ];
  var VW = function(){ return document.documentElement.clientWidth || window.innerWidth; };
  var VH = function(){ return document.documentElement.clientHeight || window.innerHeight; };
  /* 그리는 도중엔 레이아웃을 읽지 않는다: 폰 배치 여부는 CSS 와 같은 기준(matchMedia 799px), 헤더 높이는 창 크기가 바뀔 때만 (resize 에서 비움) */
  var mqMob = window.matchMedia('(max-width: 799px)'), hdrC = 0;
  var MOBILE = function(){ return mqMob.matches; };
  var HDR = function(){ return hdrC || (hdrC = (document.querySelector('.site-header') || {}).offsetHeight || 64); };

  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d'), shownOp = '';
    /* 3D 씬 (three.js, src/lib/homeScene.js): 로고 칸마다 픽셀 큐브 여러 개 + 실제 조명·부드러운 그림자. 2D 캔버스는 02 챕터 코드 조각만 그린다.
       WebGL2 가 안 되면(또는 ?flat2d=1) 예전 2D 큐브 렌더러가 그대로 돈다 */
    var canvas3d = document.getElementById('scene3d'), S3D = null, scLand = 0, LV = [0, 0, 1];
    if (canvas3d && window.__createHomeScene && !/[?&]flat2d=1/.test(location.search)) {
      try { S3D = window.__createHomeScene({ canvas: canvas3d, cells: boxes.map(function(b){ return { gx: b.gx, gy: b.gy, h: b.h }; }), small: mqMob.matches || window.matchMedia('(pointer: coarse)').matches }); }
      catch (e) { console.warn('3D scene unavailable — 2D fallback', e); S3D = null; }
    }
    if (!S3D && canvas3d) canvas3d.remove();
    var CFX = new Float32Array(N * 4), CM = new Float32Array(N * 2), CZ = new Float32Array(N), lastFrameT = 0;
    var boom = { t0: -1e9, amp: 0, p: 7.5, code: 0, sa: 1 }, BOOMB = new Float32Array(40).fill(1e9), BOOMS = { v: [0, 0, 4.6, 1.3], bl: BOOMB };   /* 01 ② 폭발: 주기 p · [경과, 세기, 되감기 시작, 되감기 길이] · 폭발 10곳 [x, y, 초, 반경] */
    var HS = 0.5;                                                      /* 큐브 반폭: 0.47 이면 이웃 사이에 틈이 생겨 흰 격자 줄로 보였다 (사용자 2026-09-28) → 딱 붙게 */
    /* 프레임마다 다시 만들지 않는 버퍼: 꼭짓점·면 조명·정렬 순서·상자 기록 */
    var PX = new Float32Array(8), PY = new Float32Array(8), RX = new Float32Array(8), RY = new Float32Array(8), RZ = new Float32Array(8);
    var FNX = new Float32Array(6), FNY = new Float32Array(6), FNZ = new Float32Array(6), FR = new Float32Array(6), FG = new Float32Array(6), FB = new Float32Array(6);
    var RECS = [], ORDER; for (var ri0 = 0; ri0 < N; ri0++) RECS.push({ z: 0, a: 1, px: 0, py: 0, pz: 0, dep: 1, szf: 1 }); ORDER = new Uint16Array(N);
    var colCache = new Map();                                                     /* 색 문자열 캐시 (채널 64단계): 프레임마다 수천 개 문자열을 만들지 않는다 */
    function colStr(r, g2, b2){ var ri = (r + 2) >> 2, gi = (g2 + 2) >> 2, bi = (b2 + 2) >> 2; if (ri > 63) ri = 63; if (gi > 63) gi = 63; if (bi > 63) bi = 63; if (ri < 0) ri = 0; if (gi < 0) gi = 0; if (bi < 0) bi = 0; var key = (ri << 12) | (gi << 6) | bi; var st = colCache.get(key); if (!st) { st = 'rgb(' + (ri << 2) + ',' + (gi << 2) + ',' + (bi << 2) + ')'; colCache.set(key, st); } return st; }
    var textW = new Map(), lastFont = null;                                       /* 코드 조각 글자 폭 캐시, 지금 설정된 글꼴 (같으면 다시 설정하지 않는다) */
    /* 큐브 꼭짓점 8개: k 비트 → (x,y,z) 부호. 면과 모서리는 꼭짓점 인덱스로 정의 */
    var CORN = []; for (var k = 0; k < 8; k++) CORN.push([(k & 1) ? 1 : -1, (k & 2) ? 1 : -1, (k & 4) ? 1 : -1]);
    var FACES = [ { n:[0,0,-1], v:[0,1,3,2] }, { n:[0,0,1], v:[4,5,7,6] }, { n:[1,0,0], v:[1,5,7,3] }, { n:[-1,0,0], v:[0,4,6,2] }, { n:[0,-1,0], v:[0,1,5,4] }, { n:[0,1,0], v:[2,3,7,6] } ];
    var EDGES = [[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4],[0,4],[1,5],[3,7],[2,6]];
    var L = [-0.42, -0.62, -0.66]; var ll = Math.sqrt(L[0]*L[0]+L[1]*L[1]+L[2]*L[2]); L = [L[0]/ll, L[1]/ll, L[2]/ll];
    var PAL_INK   = { dark:[24,26,30],  mid:[140,142,146], light:[243,243,243], sky:[244,255,83], fog:[0,0,0] };
    var PAL_PAPER = { dark:[8,8,10],    mid:[52,54,60],    light:[122,126,134], sky:[176,192,20],  fog:[247,247,245] };
    function mix(a, b, t){ return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }
    function rgb(c){ return 'rgb(' + (c[0]|0) + ',' + (c[1]|0) + ',' + (c[2]|0) + ')'; }
    function easeOut(p){ return 1 - Math.pow(1 - p, 3); }
    function easeInOut(p){ return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
    var introEase = (window.anime && window.anime.eases && typeof window.anime.eases.inOut === 'function') ? window.anime.eases.inOut(3) : easeInOut;   /* 인트로 모임 곡선 — anime.js */
    function easeOut4(p){ return 1 - Math.pow(1 - p, 4); }                    /* 챕터 전환: 스크롤과 동시에 바로 움직이고 부드럽게 멈춘다 */

    var W = 0, H = 0, DPR = 1, SHELL = 0;
    /* 캔버스 해상도: 기기 배율 그대로(폰 3배까지) 하나로 고정 — 전에는 움직일 때마다 1.5배로 낮췄다가 멈추면 되돌려
       전환의 시작·끝마다 캔버스를 새로 만들며 끊기고, 폰에선 움직이는 동안 흐릿했다. 화면이 아주 크면 4K 한 장(830만 화소)까지만,
       정말 버거운 기기에서만 govCap 으로 한 단계씩 낮춘다. 기기 배율은 매번 다시 읽는다 (브라우저 확대·다른 모니터) */
    var govCap = 3, PX_BUDGET = 8.3e6, fIv = [], fI = 0, cad = 16.7, fLast = 0, epN = 0, epLate = 0, ups = 0;
    function naturalDPR(){ return Math.min(window.devicePixelRatio || 1, 3, Math.sqrt(PX_BUDGET / (W * H))); }
    function resize(){
      hdrC = 0; lastDraw = 0;                                                     /* 캔버스를 새로 만들면 비워지니 다음 프레임은 건너뛰지 않고 그린다 */
      var sc = canvas.parentNode.getBoundingClientRect();
      W = Math.max(1, Math.round(sc.width || VW())); H = Math.max(1, Math.round(sc.height || VH()));
      DPR = Math.min(govCap, naturalDPR());
      var cw = Math.round(W * DPR), ch = Math.round(H * DPR);
      if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; lastFont = null; }   /* 캔버스를 새로 만들면 글꼴 설정도 풀린다 */
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      if (S3D) S3D.resize(W, H, Math.min(DPR, 2, Math.sqrt(4.2e6 / (W * H))));
      var sh = document.querySelector('.chapter .shell');
      if (sh) { var cs = getComputedStyle(sh); SHELL = sh.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0); }
      if (!sh || SHELL < 200) SHELL = W;
    }
    /* 프레임 감시: 절전 모드·임베드 화면처럼 초당 30장으로 묶인 건 느린 게 아니다 (전에는 이걸 과부하로 읽어 해상도를 1.25배까지 영영 낮췄다).
       화면의 박자(cad) = 최근 15장 간격 중 셋째로 짧은 것 — 절전 모드가 도중에 켜져도 0.5초면 따라간다.
       늦은 프레임 = 박자(최소 60Hz 한 칸)의 1.6배, 또는 박자와 상관없이 40ms(25장) 를 넘는 것. 고르게 초당 30장이면 끊김이 아니니 두고, 그보다 느리면 낮춘다.
       매 장 그리는 구간(전환·인트로·흐름·놀이)이 끝날 때나 120장마다 한 번 판단한다: 1/4 넘게 늦었으면 한 단계(×0.75) 낮추고,
       거의 안 늦었으면 한 단계 되돌린다 (되돌리기는 세 번까지). 긴 인트로는 20장 중 절반 넘게 늦으면 바로 낮춘다 */
    function setCap(v){ govCap = Math.max(1, Math.min(3, v)); resize(); }
    function watchFrames(now, full){
      var dt = now - fLast; fLast = now;
      if (epN && (!full || epN >= 120)) {
        if (epN >= 20) { if (epLate * 4 > epN && DPR > 1.01) setCap(DPR * 0.75); else if (epLate * 20 < epN && ups < 3 && DPR < naturalDPR() - 0.01) { ups++; setCap(DPR / 0.75); } }
        epN = epLate = 0;
      }
      if (!(dt > 0 && dt < 250) || now - start < 800) return;
      if (fIv.length < 15) fIv.push(dt); else { fIv[fI] = dt; fI = (fI + 1) % 15; }
      var a1 = 1e9, a2 = 1e9, a3 = 1e9; for (var k = 0; k < fIv.length; k++) { var v = fIv[k]; if (v < a1) { a3 = a2; a2 = a1; a1 = v; } else if (v < a2) { a3 = a2; a2 = v; } else if (v < a3) a3 = v; }
      if (fIv.length >= 5) cad = a3;
      if (!full) return;
      epN++; if (dt > Math.min(40, Math.max(16.7, cad) * 1.6)) epLate++;
      if (!introDone && epN >= 20 && epLate * 2 > epN && DPR > 1.01) { setCap(DPR * 0.75); epN = epLate = 0; }
    }
    resize();                                                                   /* 창 크기 변경은 아래 한 곳에서 (resize + 배치 다시) */

    /* 포메이션을 주어진 회전·크기로 투영했을 때의 화면상 경계 상자 (중심 0,0 기준 px) */
    function projectBBox(form, sc, yaw, pitch){
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var F = Math.min(W, H) * 1.45, D = 72, fn = FORM[form];
      var minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
      for (var k = 0; k < N; k++) {
        var t = fn(boxes[k], k), px = t.x * sc, py = t.y * sc, pz = t.z * sc;
        var ax = px * cy + pz * sy, az = -px * sy + pz * cy, ay = py * cp - az * sp, az2 = py * sp + az * cp;
        var s2 = F / (az2 + D), X = ax * s2, Y = ay * s2, r = HS * sc * s2 * 1.8;
        if (X - r < minx) minx = X - r; if (X + r > maxx) maxx = X + r; if (Y - r < miny) miny = Y - r; if (Y + r > maxy) maxy = Y + r;
      }
      return { x0: minx, x1: maxx, y0: miny, y1: maxy };
    }
    /* 챕터별 빈 영역(헤더·텍스트·푸터를 실측)에 로고를 contain 방식으로 맞춘다 */
    /* 글 맞춤 (사용자 10-12: 기종마다 따로 맞추지 말고 화면 비율·크기에 맞춰): 단계 챕터(01·02)의 글 묶음을 남는 높이에 맞게 CSS zoom 으로 줄인다.
       폰은 위쪽 로고 자리(헤더 아래의 34%)를 먼저 떼어 두고 남는 높이에, 데스크톱은 글이 화면보다 길 때만. 폰 글은 80% 밑으로 줄이지 않고 그래도 넘치면 로고 자리를 내준다.
       원래 크기(zoom 1)에서 잰 높이로 정한다 — 줄인 채로 재면 줄이 길어진 만큼 단계마다 배율이 조금씩 달라졌다 */
    function fitText(sec, hd){
      var st = sec.querySelector('.stack'); if (!st) return;
      var z0 = st.style.zoom; st.style.zoom = '';
      var T = st.getBoundingClientRect().height, z;
      if (MOBILE()) { var room = H - hd - 34; z = Math.min(1, Math.max((room - 0.34 * (H - hd)) / T, Math.min(0.8, (room - 60) / T))); }
      else z = Math.min(1, Math.max(0.7, (H - hd - 48) / T));
      st.style.zoom = z < 0.995 ? z.toFixed(3) : '';
    }
    function frameFor(i){
      var c = CHAPTERS[i] || CHAPTERS[0], sec = chapters[i], hd = HDR(), M = 24;
      var shellL = (W - SHELL) / 2, shellR = shellL + SHELL, box;
      var hOf = function(sel){ var e = sec.querySelector(sel); return e ? e.getBoundingClientRect().height : 0; };   /* 실제 보이는 높이 (zoom 반영) */
      if (sec.classList.contains('steps')) fitText(sec, hd);
      if (MOBILE()) {
        if (i === 0) box = { x0: shellL, x1: shellR, y0: hd + 16, y1: H - 0.12 * H - hOf('.wordmark') - 20 };
        else {
          var stSel = i === 4 ? '.main .stack' : '.stack', padB = i === 4 ? hOf('.foot') + 12 : 24;
          var topM = H - padB - hOf(stSel);
          box = { x0: shellL, x1: shellR, y0: hd + 10, y1: Math.max(hd + 10 + 56, topM - 10) };
        }
      } else if (i === 0) {
        box = { x0: shellL, x1: shellR, y0: hd + M, y1: H - 0.12 * H - hOf('.wordmark') - M };
      } else if (i === 1) {
        box = { x0: W / 2 + 28, x1: shellR - 56, y0: hd + M, y1: H - M };
      } else if (i === 2) {
        box = { x0: W / 2 + 28, x1: shellR - 56, y0: hd + M, y1: H - M };   /* 02 도 01 처럼 오른쪽 절반을 크게 (사용자 10-12: 그래픽이 너무 작다) */
      } else if (i === 3) {
        box = { x0: shellL, x1: shellR, y0: hd + M, y1: H - M };                 /* 카드 뒤 워터마크 */
      } else {
        var top5 = H - hOf('.foot') - 0.04 * H - hOf('.main .stack');
        box = { x0: shellL, x1: shellR, y0: hd + M, y1: Math.max(hd + M + 80, top5 - 16) };
      }
      var sMax = MOBILE() ? Math.min(1.4, c.sMax * 1.6) : c.sMax, fit = MOBILE() ? Math.min(0.96, c.fit + 0.06) : c.fit;
      var bw = Math.max(40, box.x1 - box.x0), bh = Math.max(40, box.y1 - box.y0), sc = sMax;
      for (var it = 0; it < 2; it++) { var bb = projectBBox(c.form, sc, c.yaw, c.pitch); var k2 = Math.min(bw * fit / (bb.x1 - bb.x0), bh * fit / (bb.y1 - bb.y0)); sc = Math.max(c.sMin, Math.min(sMax, sc * k2)); }
      var bbF = projectBBox(c.form, sc, c.yaw, c.pitch);
      return { s: sc, cx: (box.x0 + box.x1) / 2 - (bbF.x0 + bbF.x1) / 2, cy: (box.y0 + box.y1) / 2 - (bbF.y0 + bbF.y1) / 2 };
    }

    var f0 = frameFor(0), c0 = CHAPTERS[0];
    var g = { cx: f0.cx, cy: f0.cy, s: f0.s, yaw: c0.yaw, pitch: c0.pitch, sway: c0.sway, spin: c0.spin, mode: 1, flow: 0, live: c0.live, alpha: 1, flat: 0, wall: c0.wall, head: c0.head || 0 };
    var gFrom = null, gTo = null, gT0 = 0, gDur = 0.9;
    var active = 0, start = performance.now(), lastSpin = 0, spinAcc = 0;

    var grid = null, flightEnd = 0;                                                               /* 첫 입장 픽셀 격자 — setFormation(0, true) 보다 먼저 있어야 한다 */
    function buildGrid(fr, c, now){
      /* 첫 입장: 검은 화면 전체를 덮는 규칙적인 픽셀 격자 — 평소엔 느끼지 못하는 화면의 해상도 (사용자 요청 2026-09-28: 먼지 같은 입자가 아니라 화면을 이루는 픽셀).
         가운데부터 바깥으로 켜지며 살짝 앞으로 나오고, 잠깐 그대로 멈춰 보인 뒤 가운데로 빨려 들어가 로고가 된다.
         로고 픽셀 530개는 '로고를 화면 크기로 늘린 자리'의 칸에서 출발하고, 나머지 칸은 모이기 시작하는 순간 제자리에서 꺼진다
         (전에는 나머지 칸도 로고 쪽으로 끌려오며 흐려져, 모이는 로고 둘레에 잔상처럼 남았다 — 2026-09-28 사용자 요청으로 제거) */
      var P = Math.max(MOBILE() ? 6 : 8, Math.sqrt(W * H / 20000)), cols = Math.floor(W / P), rows = Math.floor(H / P), n = cols * rows;
      var x0 = (W - (cols - 1) * P) / 2, y0 = (H - (rows - 1) * P) / 2, F = Math.min(W, H) * 1.45, D = 72, cp = Math.cos(c.pitch), sp = Math.sin(c.pitch), unit = fr.s * F / D;
      var G = { n: n, SQ: P * 0.7, SQA: Math.min(P * 0.7, 0.94 * unit * 0.42), sx: new Float32Array(n), sy: new Float32Array(n), tx: new Float32Array(n), ty: new Float32Array(n), tw: new Float32Array(n), t0: new Float32Array(n), du: new Float32Array(n), al: new Float32Array(n) };
      /* 모이는 방식 (사용자 2026-09-28: 모이는 모션이 어색하다 → 화면의 작은 픽셀이 모두 로고 픽셀로 모여 로고가 되게):
         칸마다 '로고를 화면 크기로 늘린 지도'에서 자기 자리에 가장 가까운 로고 픽셀을 맡아, 그 픽셀 안의 한 점으로 날아간다.
         로고 픽셀(큐브)은 맡은 칸들이 도착하는 만큼 차오른다. 출발 순서는 anime.js 격자 stagger(가운데부터), 곡선은 anime.js eases.inOut(3) */
      var LW = 32, LH = GRID.length, near = new Int16Array(LW * LH);
      for (var lr = 0; lr < LH; lr++) for (var lc = 0; lc < LW; lc++) {
        var bestK = 0, bestD = 1e9;
        for (var bk = 0; bk < N; bk++) { var ddc = boxes[bk].c - lc, ddr = boxes[bk].r - lr, dd = ddc * ddc + ddr * ddr; if (dd < bestD) { bestD = dd; bestK = bk; } }
        near[lr * LW + lc] = bestK;
      }
      var AN = window.anime, st = AN && AN.stagger ? AN.stagger(1, { grid: [cols, rows], from: 'center' }) : null, SL = { length: n }, stMax = Math.sqrt(((cols - 1) / 2) * ((cols - 1) / 2) + ((rows - 1) / 2) * ((rows - 1) / 2)) || 1;
      var tA = new Float32Array(N).fill(1e9), tB = new Float32Array(N);
      G.qb = []; for (var q = 0; q < 8; q++) G.qb.push(new Float32Array(3 * n)); G.qn = new Int32Array(8);   /* 불투명도 8단계 그리기 버퍼 — 한 번만 만든다 (전에는 매 프레임 배열 9개를 새로 만들어 GC 가 돌았다) */
      for (var j = 0; j < n; j++) {
        var X = x0 + (j % cols) * P, Y = y0 + Math.floor(j / cols) * P;
        var yr = Y - fr.cy, wy = yr * D / (cp * F - yr * sp), wx = (X - fr.cx) * (wy * sp + D) / F;      /* 화면 좌표 → 로고 좌표 (챕터 0 카메라의 역투영: 격자가 화면에 정확히 반듯하게) */
        var ux = (X - W / 2) / (W * 0.48), uy = (Y - H / 2) / (H * 0.48), rN = Math.min(1, Math.sqrt(ux * ux + uy * uy) / 1.42);
        G.sx[j] = wx / fr.s; G.sy[j] = wy / fr.s;
        var mc = Math.max(0, Math.min(LW - 1, Math.round(ux * R + CX - 0.5))), mr = Math.max(0, Math.min(LH - 1, Math.round(uy * R + CY - 0.5))), mk = near[mr * LW + mc], mb = boxes[mk];
        G.tx[j] = mb.gx + (Math.random() - 0.5) * 0.7; G.ty[j] = mb.gy + (Math.random() - 0.5) * 0.7;   /* 맡은 로고 픽셀 안의 한 점 */
        var sN = st ? Math.min(1, st(null, j, SL) / stMax) : rN;                    /* 가운데에서 떨어진 정도 (anime.js 격자 stagger) */
        /* 첫 입장 전체를 2초 안에 (사용자 2026-09-28: 체감 3초 → 1.8–2초로). 인트로만 초 단위로 — 챕터 전환은 PACE 그대로.
           전: 켜짐 0.2–0.8 · 멈춤 1초 · 모임 1.8–4.1 · 제목 4.8–6.4초 → 이제: 켜짐 0.04–0.34 · 모임 0.66–1.6 · 제목·헤더 1.3–1.9초 */
        G.tw[j] = now + (0.04 + 0.26 * rN + Math.random() * 0.04) * IK;          /* 켜짐: 가운데 → 바깥 */
        G.t0[j] = now + (0.66 + 0.2 * sN + Math.random() * 0.03) * IK;           /* 잠깐 멈춰 보인 뒤 가운데 칸부터 출발 */
        G.du[j] = (0.55 + 0.4 * rN) * IK;                                         /* 먼 칸일수록 오래 난다 — 로고는 가운데부터 차오른다 */
        var arr = G.t0[j] + G.du[j]; if (arr < tA[mk]) tA[mk] = arr; if (arr > tB[mk]) tB[mk] = arr;
        G.al[j] = 0.4 + Math.random() * 0.08;                            /* 밝기 차이는 좁게 */
      }
      for (var k = 0; k < N; k++) {                                              /* 로고 픽셀은 제자리에서, 맡은 칸이 처음 닿을 때부터 마지막이 닿고 조금 뒤까지 차오른다 */
        var b = boxes[k]; if (tA[k] > 1e8) { tA[k] = now + 1.2 * IK; tB[k] = tA[k]; }
        b.cur = { x: b.gx, y: b.gy, z: 0 }; b.tw = tA[k]; b.t0 = tA[k]; b.dur = (tB[k] - tA[k]) + 0.25 * IK; b.tl = b.t0 + b.dur;
      }
      grid = G;
    }
    var ashToCode = false;
    function setFormation(i, initial, instant){
      var c = CHAPTERS[i] || CHAPTERS[0], fr = frameFor(i), now = (performance.now() - start) / 1000, fn = FORM[c.form];
      /* 첫 진입: 화면 전체 격자에 숨어 있던 픽셀들 — 가운데부터 바깥으로 켜진 뒤 로고 칸만 로고 자리로 모인다 (나머지 칸은 제자리에서 꺼짐) */
      /* 전환 순서: 로고가 화면에서 옮겨 가는 쪽의 앞 픽셀부터 떠난다 (제자리 변형이면 가운데부터). 한꺼번에가 아니라 물결처럼 */
      var shx = fr.cx - g.cx, shy = fr.cy - g.cy, shl = Math.sqrt(shx * shx + shy * shy), dvx = shl > 40 ? shx / shl : 0, dvy = shl > 40 ? shy / shl : 0;
      var keys = [], kMin = 1e9, kMax = -1e9;
      for (var k0 = 0; k0 < N; k0++) { var c0b = boxes[k0].cur, kv = (dvx || dvy) ? -(c0b.x * dvx + c0b.y * dvy) : Math.sqrt(c0b.x * c0b.x + c0b.y * c0b.y); keys.push(kv); if (kv < kMin) kMin = kv; if (kv > kMax) kMax = kv; }
      if (initial && !introReduce && !S3D) buildGrid(fr, c, now);
      if (instant) grid = null;
      for (var k = 0; k < N; k++) {
        var b = boxes[k], t = fn(b, k), fd;
        if (initial) {
          fd = Math.sqrt((b.cur.x - t.x) * (b.cur.x - t.x) + (b.cur.y - t.y) * (b.cur.y - t.y));   /* 출발 칸·시각은 buildGrid 가 정해 두었다 */
          b.sa = 0;                                                         /* 착지 반동 없음 (사용자 2026-09-28: 모일 때 피드백 효과가 짜친다) */
        } else {
          /* 챕터 전환 (사용자 2026-09-28: 스크롤보다 반 박자 늦게 딸려온다 → 물결 간격 0.32→0.12초, 비행 0.8–1.25→0.55–0.85초, 느린 출발 없이 바로 움직이는 곡선) */
          fd = Math.sqrt((b.cur.x - t.x) * (b.cur.x - t.x) + (b.cur.y - t.y) * (b.cur.y - t.y));
          b.t0 = now + ((kMax > kMin ? (keys[k] - kMin) / (kMax - kMin) : 0) * 0.12 + Math.random() * 0.04) * PACE;
          b.dur = (0.55 + Math.min(0.3, fd * 0.02) + (Math.abs(b.m - c.morph) > 0.01 ? 0.25 : 0)) * PACE;   /* 코드 ↔ 픽셀 블록 바뀔 땐 0.25초 더 (사용자 10-12: 바뀌는 게 안 느껴진다) */
          b.tl = b.t0 + b.dur;
          b.sa = fd > 1.5 ? 0.3 : 0;                                      /* 멀리서 온 픽셀만 착지 반동 */
        }
        /* 곡선 경로: 이동 방향에 수직으로 살짝 휘고(방향은 픽셀마다 무작위), 가운데쯤 화면 쪽으로 떠오른다 — 직선 이동보다 떼 지어 나는 느낌 */
        var side = (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.65), mvx = t.x - b.cur.x, mvy = t.y - b.cur.y, bend = initial ? 0.05 : 0.1;
        b.ax = -mvy * bend * side; b.ay = mvx * bend * side; b.az = initial ? 0 : -Math.min(4, fd * 0.08);   /* 인트로는 날아오며 앞으로 부풀지 않는다 */
        b.from = { x: b.cur.x, y: b.cur.y, z: b.cur.z }; b.to = t;
        b.mFrom = b.m; b.mTo = c.morph; b.mOut = ashToCode;                                /* 잿더미 → 코드는 코드가 바로 피어나게 */
        b.back = !!initial;
        if ((initial ? introReduce : reduce) || instant) { b.cur = { x: t.x, y: t.y, z: t.z }; b.m = c.morph; b.t0 = now - 10; b.tw = now - 10; b.tl = now - 10; b.sa = 0; b.ax = b.ay = b.az = 0; }
        if (b.tl + 0.5 * PACE > flightEnd) flightEnd = b.tl + 0.5 * PACE;
      }
      ashToCode = false;
      gFrom = { cx: g.cx, cy: g.cy, s: g.s, yaw: g.yaw, pitch: g.pitch, sway: g.sway, spin: g.spin, mode: g.mode, flow: g.flow, live: g.live, alpha: g.alpha, flat: g.flat, wall: g.wall, head: g.head };
      gTo = { cx: fr.cx, cy: fr.cy, s: fr.s, yaw: c.yaw, pitch: c.pitch, sway: c.sway, spin: c.spin, mode: chapters[i].getAttribute('data-mode') === 'ink' ? 1 : 0, flow: c.flow, live: c.live || 0, alpha: (MOBILE() || c.alpha === undefined) ? 1 : c.alpha, flat: c.flat || 0, wall: c.wall, head: c.head || 0 };
      gFrom.yaw = g.yaw + spinAcc; spinAcc = 0;
      var dyaw = gTo.yaw - gFrom.yaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw)); gFrom.yaw = gTo.yaw - dyaw;
      gT0 = now; gDur = (initial || reduce || instant) ? 0.01 : 0.8 * PACE;                     /* 카메라(위치·크기·각도): 스크롤과 함께 바로 출발 */
      if (initial && !introReduce) { gFrom.yaw = c.yaw; gFrom.pitch = c.pitch; gFrom.sway = 0; gFrom.s = fr.s; gT0 = now + 0.6 * IK; gDur = 1.2 * IK; }   /* 카메라 회전 없음 (사용자 요청): 처음부터 정면, 흔들림만 서서히 */
      if (S3D) {
        /* 3D: 칸 목표와 출발 지연을 넘기면 큐브들이 힘으로 날아간다. 첫 입장은 모래 줄기 (화면 왼쪽 밖 → 왼쪽부터 쌓임) */
        var tp = new Float32Array(N * 3), td = new Float32Array(N), snap3 = (initial ? introReduce : reduce) || !!instant;
        for (var k3 = 0; k3 < N; k3++) { var b3 = boxes[k3]; tp[k3 * 3] = b3.to.x; tp[k3 * 3 + 1] = b3.to.y; tp[k3 * 3 + 2] = b3.to.z; td[k3] = initial ? 0 : Math.max(0, b3.t0 - now); }
        S3D.setTargets(tp, td, now, snap3 || initial);
        if (initial) {
          for (var k4 = 0; k4 < N; k4++) { var b4 = boxes[k4]; b4.cur = { x: b4.to.x, y: b4.to.y, z: b4.to.z }; b4.from = null; b4.tl = now - 10; }   /* 코드 조각 자리 계산용 (첫 화면에선 안 보임) */
          if (!introReduce) scLand = S3D.intro(now).land;                     /* 로고가 불타오른 뒤 은빛 띠에 픽셀로 바뀐다 */
        }
      }
    }
    var introDone = false, INTRO_T = 1.55 * IK, sceneT = 0, introAt = 0, extT = 1e9;   /* extT: 첫 화면 로고가 납작한 2D 에서 입체로 솟기 시작하는 시각 (그 전엔 로딩 로고와 똑같은 2D) */
    /* ── 놀이: 01 ③ 단계(로고가 코드로 풀린 때)의 코드 조각을 마우스·손가락으로 잡아 던지면 얼마쯤 날아갔다가 스프링처럼 제자리로 돌아온다.
       점수나 안내 없이 숨어 있다 (조각 위에서 커서가 손 모양으로 바뀌는 것만 힌트) ── */
    var play = { on: false, drag: null, last: 0, trail: [], gx: 0, gy: 0 };
    function codeOn(){ return active === 1 && c1step === 3; }                    /* 코드 조각 놀이는 01 의 ③ 단계에서만 */
    function codeAt(x, y){
      var hit = null;
      for (var i = 0; i < N; i++) { var b = boxes[i]; if (b.kind !== 'code' || !b.sw || b.seenT === undefined || sceneT - b.seenT > 0.2) continue;
        var hw = b.sw / 2 + 8, hh = b.sh / 2 + 8; if (x >= b.sx - hw && x <= b.sx + hw && y >= b.sy - hh && y <= b.sy + hh && (!hit || (b.drawK || 0) >= (hit.drawK || 0))) hit = b; }
      return hit;
    }
    function dragStart(x, y){
      if (!codeOn() || !introDone) return false; var b = codeAt(x, y); if (!b) return false;
      play.on = true; play.drag = b; play.last = sceneT; b.vx = 0; b.vy = 0; b.held = true; b.thrown = false;
      play.gx = x - b.ox; play.gy = y - b.oy; play.trail = [{ x: x, y: y, t: performance.now() }]; return true;
    }
    function dragMove(x, y){ var b = play.drag; if (!b) return; b.ox = x - play.gx; b.oy = y - play.gy; play.trail.push({ x: x, y: y, t: performance.now() }); if (play.trail.length > 6) play.trail.shift(); }
    function dragEnd(){
      var b = play.drag; if (!b) return; var tr = play.trail, a = tr[0], z = tr[tr.length - 1], dt = Math.max(24, z.t - a.t) / 1000;
      b.vx = Math.max(-2600, Math.min(2600, (z.x - a.x) / dt)); b.vy = Math.max(-2600, Math.min(2600, (z.y - a.y) / dt));
      b.held = false; b.thrown = true; b.launched = true; play.drag = null;
    }
    var SPRING = 16, DAMP = 2.8;                                                   /* 되돌아오는 힘과 감쇠: 살짝 넘쳤다가 자리를 잡는다 */
    function updatePlay(t){
      var dt = Math.min(0.05, t - play.last); play.last = t; if (dt <= 0) return;
      var top = HDR() + 10, bottom = H - 10, left = 10, right = W - 10, busy = 0;
      for (var i = 0; i < N; i++) {
        var b = boxes[i]; if (b.kind !== 'code') continue;
        if (b.held) { busy++; continue; }
        if (!b.thrown) continue;
        b.vx += (-SPRING * b.ox - DAMP * b.vx) * dt; b.vy += (-SPRING * b.oy - DAMP * b.vy) * dt;
        b.ox += b.vx * dt; b.oy += b.vy * dt;
        var hw = b.sw / 2, hh = b.sh / 2, x = b.sx - b.pox + b.ox, y = b.sy - b.poy + b.oy;   /* 이번 프레임의 예상 위치 */
        if (x - hw < left) { b.ox += left - (x - hw); b.vx = Math.abs(b.vx) * 0.5; }
        if (x + hw > right) { b.ox -= (x + hw) - right; b.vx = -Math.abs(b.vx) * 0.5; }
        if (y - hh < top) { b.oy += top - (y - hh); b.vy = Math.abs(b.vy) * 0.5; }
        if (y + hh > bottom) { b.oy -= (y + hh) - bottom; b.vy = -Math.abs(b.vy) * 0.5; }
        if (Math.abs(b.ox) < 0.6 && Math.abs(b.oy) < 0.6 && Math.abs(b.vx) < 6 && Math.abs(b.vy) < 6) { b.ox = 0; b.oy = 0; b.vx = 0; b.vy = 0; b.thrown = false; b.launched = false; }
        else busy++;
      }
      if (!busy && !play.drag) play.on = false;
    }
    function resetPlay(){
      for (var i = 0; i < N; i++) { var b = boxes[i]; if (b.kind !== 'code') continue; b.ox = 0; b.oy = 0; b.vx = 0; b.vy = 0; b.held = false; b.thrown = false; b.launched = false; b.hitT = 0; b.drawK = 0; }
      play.on = false; play.drag = null; document.body.style.cursor = '';
    }

    /* 02 챕터: 픽셀 필드 위를 오가는 데이터 패킷 (행·열을 따라 빛이 옮겨 다닌다) */
    var packets = [], boost = new Float32Array(N);
    for (var p = 0; p < 9; p++) packets.push({ col: p >= 5, line: Math.floor(Math.random() * (p >= 5 ? FCOLS : FROWS)), x: Math.random() * (p >= 5 ? FROWS : FCOLS), v: (4 + Math.random() * 4) * (Math.random() < 0.5 ? 1 : -1), len: 2.5 + Math.random() * 2.5 });   /* 02 오디오비주얼 (사용자 10-12: 너무 정적) — 가로 다섯·세로 넷, 빠르게 */
    var lastT = 0;
    function updateFlow(t){
      var dt = Math.min(0.05, t - lastT); lastT = t;
      for (var i = 0; i < N; i++) boost[i] = 0;
      for (var p = 0; p < packets.length; p++) {
        var pk = packets[p], limit = pk.col ? FROWS : FCOLS;
        pk.x += pk.v * dt;
        if (pk.x > limit + 3) { pk.x = -3; pk.line = Math.floor(Math.random() * (pk.col ? FCOLS : FROWS)); }
        if (pk.x < -3) { pk.x = limit + 3; pk.line = Math.floor(Math.random() * (pk.col ? FCOLS : FROWS)); }
        for (var d = -3; d <= 3; d++) {
          var cell = Math.floor(pk.x) + d; if (cell < 0 || cell >= limit) continue;
          var idx = pk.col ? cell * FCOLS + pk.line : pk.line * FCOLS + cell; if (idx >= N) continue;
          var dist = (cell + 0.5 - pk.x) * (pk.v > 0 ? 1 : -1);      /* 진행 방향 뒤로 꼬리 */
          var val = dist > 0 ? Math.exp(-dist * dist * 1.6) : Math.exp(-dist * dist / pk.len);
          if (val > boost[idx]) boost[idx] = val;
        }
      }
    }

    function drawFragment(b, X, Y, sz, P, alpha, pal){
      if (b.kind === 'none') return;
      ctx.globalAlpha = alpha; ctx.lineWidth = 1; ctx.strokeStyle = rgb(pal.mid); ctx.fillStyle = rgb(pal.light);
      if (b.kind === 'code') {
        /* 글자 크기는 0.25px 단위로 — 크기가 매 프레임 조금씩 달라져 글리프를 새로 그리느라 데스크톱에서 프레임당 25ms 가 들던 것 (0.25px 차이는 눈에 안 보인다).
           줄 높이 = 칸 하나, 글자 수 = 묶음 폭에 들어가는 만큼 (고정폭이라 글자 하나 폭으로 나눈다) */
        var fpx = Math.round(Math.max(6, sz * 1.72) * (b.held ? 1.18 : 1) * 4) / 4;
        var font = '500 ' + fpx + 'px ui-monospace, Menlo, Consolas, monospace'; if (font !== lastFont) { ctx.font = font; lastFont = font; }
        var chW = textW.get('0|' + fpx); if (chW === undefined) { chW = ctx.measureText('0000000000').width / 10; textW.set('0|' + fpx, chW); }
        var nCh = Math.max(1, Math.floor(b.run.n * 2 * sz / chW)); if (nCh !== b.pn) { b.pn = nCh; b.token = nCh <= 3 ? SYM[Math.floor(b.seed2 * SYM.length)].slice(0, nCh) : b.line.slice(0, nCh).replace(/ $/, ';'); b.parts = lexParts(b.token); }
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        var parts = b.parts || [[b.token, VS.vari]], total = 0, widths = [];
        for (var pi = 0; pi < parts.length; pi++) { var wkey = parts[pi][0] + '|' + fpx, pw = textW.get(wkey); if (pw === undefined) { pw = ctx.measureText(parts[pi][0]).width; textW.set(wkey, pw); } widths.push(pw); total += pw; }
        b.sx = X; b.sy = Y; b.sw = total; b.sh = fpx * 1.15; b.pox = b.ox || 0; b.poy = b.oy || 0; if (alpha > 0.5) b.seenT = sceneT;
        var cx2 = X - total / 2, gl = b.glT !== undefined ? sceneT - b.glT : -1;
        if (!TOUCH && !play.drag && performance.now() - ptr.t < 2500 && Math.abs(ptr.y - Y) < fpx * 0.6 && Math.abs(ptr.x - X) < total / 2 + 2) {   /* 커서가 올라간 줄: 편집기의 지금 줄처럼 옅은 띠 + 깜박이는 커서 */
          var ink2 = g.mode < 0.5 ? '17,17,17' : '243,243,243', ga0 = ctx.globalAlpha; ctx.fillStyle = 'rgba(' + ink2 + ',0.07)'; ctx.fillRect(cx2 - 4, Y - fpx * 0.62, total + 8, fpx * 1.24);
          if (Math.floor(sceneT * 2) % 2 === 0) { ctx.fillStyle = 'rgba(' + ink2 + ',0.85)'; ctx.fillRect(Math.round(ptr.x), Y - fpx * 0.55, 1.5, fpx * 1.1); }
          ctx.globalAlpha = ga0;
        }
        if (gl >= 0 && gl < GL_DUR) {                                                  /* 지지직: 색이 갈라지고 흔들리며 글자가 뒤섞였다가 다른 함수·변수로 */
          if (gl > GL_DUR * 0.55 && b.nextTok) { b.line = b.nextTok; b.pn = -1; b.nextTok = null; }
          var gk = 1 - gl / GL_DUR, jx = (Math.random() - 0.5) * 12 * gk, sh = 2 + 3 * gk, txt = b.token, scr = '';
          for (var ci = 0; ci < txt.length; ci++) scr += Math.random() < 0.45 * gk ? GLYPH.charAt(Math.floor(Math.random() * GLYPH.length)) : txt.charAt(ci);
          var ga = ctx.globalAlpha; ctx.globalAlpha = ga * 0.6;
          ctx.fillStyle = g.mode < 0.5 ? '#E0137F' : '#FF3DF2'; ctx.fillText(scr, cx2 + jx - sh, Y);
          ctx.fillStyle = g.mode < 0.5 ? '#00A3E0' : '#3DFCFF'; ctx.fillText(scr, cx2 + jx + sh, Y + 1);
          ctx.globalAlpha = ga * (0.55 + 0.45 * Math.random()); ctx.fillStyle = g.mode < 0.5 ? '#16171A' : '#F3F3F3'; ctx.fillText(scr, cx2 + jx, Y);
          ctx.globalAlpha = ga;
        } else
        for (var pj = 0; pj < parts.length; pj++) { ctx.fillStyle = g.mode < 0.5 ? (VS_PAPER[parts[pj][1]] || parts[pj][1]) : parts[pj][1]; ctx.fillText(parts[pj][0], cx2, Y); cx2 += widths[pj]; }
      } else if (b.kind === 'tri') {
        ctx.strokeStyle = rgb(pal.light); ctx.beginPath();
        for (var q = 0; q < 3; q++) { var an = b.rot + q * 2.094, rr = sz * (1.1 + (q === 1 ? 0.5 : 0)); var px = X + Math.cos(an) * rr, py = Y + Math.sin(an) * rr; if (q) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.closePath(); ctx.stroke();
      } else if (b.kind === 'node') {
        var w = sz * 2.4, h = sz * 1.3; ctx.strokeStyle = rgb(pal.light);
        ctx.strokeRect(X - w / 2, Y - h / 2, w, h);
        ctx.strokeStyle = rgb(pal.mid); ctx.beginPath(); ctx.moveTo(X + w / 2 + 1, Y); ctx.lineTo(X + w / 2 + sz * 1.8, Y); ctx.stroke();
      } else if (b.kind === 'wave') {
        ctx.strokeStyle = rgb(pal.light); ctx.beginPath();
        for (var i2 = 0; i2 <= 10; i2++) { var wx = X - sz * 1.6 + i2 * sz * 0.32, wy = Y + Math.sin(i2 * 0.9 + b.rot) * sz * 0.5; if (i2) ctx.lineTo(wx, wy); else ctx.moveTo(wx, wy); }
        ctx.stroke();
      } else if (b.kind === 'dot') {
        ctx.globalAlpha = alpha * 0.55; ctx.fillStyle = rgb(pal.mid); var ds = Math.max(1.5, sz * 0.45); ctx.fillRect(X - ds / 2, Y - ds / 2, ds, ds);
      } else {
        ctx.globalAlpha = alpha * 0.7;
        ctx.strokeStyle = rgb(pal.mid); ctx.beginPath(); ctx.moveTo(X - sz * 0.9, Y); ctx.lineTo(X + sz * 0.9, Y); ctx.moveTo(X, Y - sz * 0.9); ctx.lineTo(X, Y + sz * 0.9); ctx.stroke();
        ctx.fillStyle = rgb(pal.light); ctx.beginPath(); ctx.arc(X, Y, Math.max(1.5, sz * 0.22), 0, 6.283); ctx.fill();
      }
    }

    var PERF = /[?&]perf=1/.test(location.search), perfLog = [], lastDraw = 0, glLast = 0;
    if (PERF) window.__perf = perfLog;
    function render(now){
      if (!canvas.isConnected) { if (S3D) { S3D.dispose(); S3D = null; } return; }   /* 다른 페이지로 가면 멈춘다 */
      var p0 = PERF ? performance.now() : 0;
      var t = (now - start) / 1000; sceneT = t;
      var busy = !!(gFrom && gTo) || !introDone || t < flightEnd;
      var liveK = introDone ? Math.min(1, (t - introAt) / 1.5) : 0;
      /* 그리는 간격: 조용할 때(첫 화면 밖에서 전환·인트로·놀이가 없고 숨쉬기만)는 초당 30장, 그 밖엔 60장 안팎 — 화면 박자(cad)의 정수배로 건너뛴다.
         반 박자 여유를 둬 60·90·100·120·144Hz 어디서나 고르고, 절전 모드 30Hz 에선 매 장 그린다 (전에는 한 장 건너 한 장이라 15장이 됐다) */
      var calm = !STATIC && !busy && !play.on && active !== 0 && active !== 2 && g.flow < 0.01 && !(active === 1 && c1step > 0);   /* 01 의 연출 단계 · 02 는 60장 */
      watchFrames(now, !calm);
      var skipK = Math.max(1, Math.floor((calm ? 33.3 : 16.7) / cad + 0.1));
      if (now - lastDraw < (skipK - 0.5) * cad) { requestAnimationFrame(render); return; }
      lastDraw = now;
      if (play.on) updatePlay(t);
      if (active === 1 && c1step === 3 && introDone && !reduce && t - glLast > 1.5) {   /* 01 ③: 1.5초마다 코드 줄 10% 가 글리치와 함께 다른 코드로 (AI 가 고쳐 쓰듯) */
        glLast = t;
        for (var gi = 0; gi < N; gi++) { var gb = boxes[gi]; if (gb.kind === 'code' && !gb.held && Math.random() < 0.1) { gb.glT = t + Math.random() * 0.3; gb.nextTok = codeLine(); } }
      }
      if (gFrom && gTo) { var gp = Math.max(0, Math.min(1, (t - gT0) / gDur)), ge = easeOut4(gp); for (var key in gTo) g[key] = gFrom[key] + (gTo[key] - gFrom[key]) * ge; if (gp >= 1) gFrom = gTo = null; }
      spinAcc += g.spin * (t - lastSpin); lastSpin = t;
      if (g.flow > 0.01 && !reduce) updateFlow(t); else lastT = t;
      var yaw = g.yaw + Math.sin(t * 0.22) * g.sway + spinAcc;
      yaw = Math.max(-0.35, Math.min(0.35, yaw));                     /* 정면 기준 ±20° 를 넘지 않는다 */
      if (active === 2 && c2step === 3 && introDone && !reduce) { var ak = sstep(0, 1, (t - c2T0 - 0.25) / 0.7); yaw += Math.sin((t - c2T0) * 0.35) * 0.12 * ak; }   /* 02 오디오비주얼: 카메라가 천천히 돈다 */
      if (active === 2 && c2step === 1 && introDone && !reduce) { var tph = ((t - c2T0) * PLAY) % 9; yaw += Math.sin((t - c2T0) * 0.7) * 0.5 * sstep(0, 1, (t - c2T0 - 0.25) / 0.7) * (1 - sstep(5.4, 6.4, tph) + sstep(8.2, 9, tph)); }   /* 02 CG: 모델링·애니메이션 동안 턴테이블처럼 돌고, 렌더 땐 멈춘다 */
      var pitch = g.pitch + Math.sin(t * 0.17) * g.sway * 0.35;
      if (active === 2 && c2step === 0 && introDone && !reduce) { var bph = ((t - c2T0) * PLAY) % C2LEN, ce = function(a, d){ return eio(Math.min(1, Math.max(0, (bph - a) / d))); }, c1 = ce(0.1, 1.5), c2 = ce(3.55, 2.1), cb = 1 - ce(12.8, 1.9), orb = sstep(6.2, 7.4, bph) * (1 - sstep(11.9, 12.9, bph)); yaw += (0.16 * c1 * (1 - c2) + (0.55 - 0.12 * shw.e1 + 0.1 * shw.e3 + 0.1 * Math.sin((bph - 6.4) * 0.5) * orb) * c2) * cb; pitch += (0.1 * c1 * (1 - c2) - 0.8 * c2) * cb; }   /* 02 기획·연출 카메라: 정면 로고 → 똑바로 내려다본 스케치 → 3D 모형 시점(연출 동안 그 존 쪽으로 살짝 돌며 천천히 좌우로) → 다시 정면 */
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var D = 72, F = Math.min(W, H) * 1.45, S = g.s, OX = g.cx, OY = g.cy;
      /* 광원이 아주 천천히 돌고, 부드러운 빛 띠가 표면을 스친다 */
      var lx0 = -0.42 + Math.sin(t * 0.21) * 0.28, ly0 = -0.62 + Math.cos(t * 0.17) * 0.12, lz0 = -0.66; var lnorm = Math.sqrt(lx0*lx0 + ly0*ly0 + lz0*lz0); L = [lx0 / lnorm, ly0 / lnorm, lz0 / lnorm];
      var sweepA = 0.8, sweepPos = Math.sin(t * 0.16) * 26, sweepC = Math.cos(sweepA), sweepS = Math.sin(sweepA);
      var pal = { dark: mix(PAL_PAPER.dark, PAL_INK.dark, g.mode), mid: mix(PAL_PAPER.mid, PAL_INK.mid, g.mode), light: mix(PAL_PAPER.light, PAL_INK.light, g.mode), sky: mix(PAL_PAPER.sky, PAL_INK.sky, g.mode), fog: mix(PAL_PAPER.fog, PAL_INK.fog, g.mode) };
      /* 반투명 워터마크 챕터: 로고는 불투명하게 그리고 투명도는 캔버스 자체(CSS opacity)에 준다 — 겹침 얼룩이 없고 합성은 브라우저가 공짜로 한다.
         (전에는 오프스크린 캔버스에 그린 뒤 화면 전체를 매 프레임 다시 합성해 데스크톱에서 프레임이 떨어졌다. 그 캔버스 한 장 몫의 메모리도 뺐다) */
      var op = g.alpha < 0.999 ? g.alpha.toFixed(3) : ''; if (op !== shownOp) { shownOp = op; canvas.style.opacity = op; if (S3D) canvas3d.style.opacity = op; }
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (S3D && t < flightEnd && !reduce) { ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }   /* 전환 중엔 지난 장면을 35%만 남겨 코드 조각에 옅은 잔상 (3D 큐브 잔상과 비슷한 세기) */
      else ctx.clearRect(0, 0, W, H);

      if (S3D) renderSC(t, yaw, pitch, F, D, S, OX, OY, pal); else {
      /* 프레임 상수: 면 6개의 회전된 법선과 조명은 모든 상자에 같다 → 한 번만 계산 (전에는 상자마다 6번, 3,000번 넘게 반복) */
      for (var f0 = 0; f0 < 6; f0++) {
        var fnn = FACES[f0].n, fnx1 = fnn[0] * cy + fnn[2] * sy, fnz1 = -fnn[0] * sy + fnn[2] * cy, fny2 = fnn[1] * cp - fnz1 * sp, fnz2 = fnn[1] * sp + fnz1 * cp;
        FNX[f0] = fnx1; FNY[f0] = fny2; FNZ[f0] = fnz2;
        var flam = Math.max(0, fnx1 * L[0] + fny2 * L[1] + fnz2 * L[2]);
        var fc = mix(pal.dark, pal.mid, Math.min(1, 0.25 + flam * 0.9)); fc = mix(fc, pal.light, Math.pow(flam, 3) * 0.75); fc = mix(fc, pal.light, Math.max(0, -fny2) * 0.12);
        FR[f0] = fc[0]; FG[f0] = fc[1]; FB[f0] = fc[2];
      }
      if (g.flat > 0.001) for (var f1 = 1; f1 < 6; f1++) { FR[f1] += (FR[0] - FR[f1]) * g.flat; FG[f1] += (FG[0] - FG[f1]) * g.flat; FB[f1] += (FB[0] - FB[f1]) * g.flat; }   /* 단색 챕터(01): 모든 면을 앞면 색 하나로 — 그라데이션 없음 (사용자 2026-09-28) */
      if (grid) {
        /* 격자: 불투명도 8단계로 묶어 경로 8개로 한 번에 채운다 (2만 칸도 가볍게). 색은 로고 큐브 앞면과 같게 — 로고 픽셀이 떠날 때 이음새가 없도록 */
        var Gd = grid, gb = Gd.qb, gn = Gd.qn, gq; gn.fill(0);
        var gcol = colStr(FR[0] + (pal.fog[0] - FR[0]) * 0.135, FG[0] + (pal.fog[1] - FG[0]) * 0.135, FB[0] + (pal.fog[2] - FB[0]) * 0.135), gk = D / F;
        var gInK = 1 / (0.2 * IK), gPopK = 1 / (0.35 * IK), gFadeK = 1 / (0.25 * IK), gLeft = 0, EZ = introEase;   /* 켜짐 0.2 · 튀어나옴 0.35 · 도착 뒤 스며듦 0.25초 (×IK) */
        for (var gj = 0; gj < Gd.n; gj++) {
          if (t < Gd.tw[gj]) { gLeft++; continue; }
          var gpp = (t - Gd.t0[gj]) / Gd.du[gj], ga = Gd.al[gj] * Math.min(1, (t - Gd.tw[gj]) * gInK), gxx = Gd.sx[gj], gyy = Gd.sy[gj], gzz = 0, gs = Gd.SQ, still = gpp <= 0;
          if (still) { var gap = Math.min(1, (t - Gd.tw[gj]) * gPopK); gzz = 5 * (1 - gap) * (1 - gap); }   /* 켜지며 화면 안쪽에서 살짝 앞으로 */
          else if (gpp < 1) { var gee = EZ(gpp); gxx += (Gd.tx[gj] - gxx) * gee; gyy += (Gd.ty[gj] - gyy) * gee; gs += (Gd.SQA - gs) * gee; ga += (0.85 - ga) * gee; }   /* 맡은 로고 픽셀로 날아가며 작아지고 밝아진다 */
          else { var gfo = (t - Gd.t0[gj] - Gd.du[gj]) * gFadeK; if (gfo >= 1) continue; gxx = Gd.tx[gj]; gyy = Gd.ty[gj]; gs = Gd.SQA; ga = 0.85 * (1 - gfo); }   /* 닿으면 차오르는 로고 픽셀 속으로 스며든다 */
          gLeft++;
          if (ga < 0.015) continue;
          var gwx = gxx * S, gwy = gyy * S, gwz = gzz * S, gax = gwx * cy + gwz * sy, gaz = -gwx * sy + gwz * cy, gay = gwy * cp - gaz * sp, gsc = F / (gwy * sp + gaz * cp + D), ghs = gs * gsc * gk / 2;
          var gX = OX + gax * gsc - ghs, gY = OY + gay * gsc - ghs; if (still) { gX = Math.round(gX * DPR) / DPR; gY = Math.round(gY * DPR) / DPR; }   /* 멈춰 있는 격자는 기기 픽셀에 맞춰 또렷하게 */
          var gi = Math.min(7, ga * 16 | 0), go = gn[gi], gbuf = gb[gi]; gbuf[go] = gX; gbuf[go + 1] = gY; gbuf[go + 2] = ghs * 2; gn[gi] = go + 3;
        }
        ctx.fillStyle = gcol;
        for (gq = 0; gq < 8; gq++) {
          var garr = gb[gq], glen = gn[gq]; if (!glen) continue;
          ctx.globalAlpha = (gq + 0.5) / 16; ctx.beginPath();
          for (var gr = 0; gr < glen; gr += 3) ctx.rect(garr[gr], garr[gr + 1], garr[gr + 2], garr[gr + 2]);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (!gLeft) grid = null;                                                  /* 다 꺼지면 바로 놓아준다 (인트로 끝까지 2만 칸을 헛돌지 않게) */
      }


      var nVis = 0, hasLive = g.live > 0.01, hasFlow = g.flow > 0.01;
      for (var i = 0; i < N; i++) {
        var b = boxes[i];
        var p = Math.max(0, Math.min(1, (t - b.t0) / b.dur));
        if (b.from && b.to) { var e = b.back ? easeInOut(p) : easeOut4(p), arc = Math.sin(Math.PI * e); b.cur.x = b.from.x + (b.to.x - b.from.x) * e + b.ax * arc; b.cur.y = b.from.y + (b.to.y - b.from.y) * e + b.ay * arc; b.cur.z = b.from.z + (b.to.z - b.from.z) * e + b.az * arc; b.m = b.mFrom + (b.mTo - b.mFrom) * (b.mOut ? 1 - (1 - p) * (1 - p) : easeInOut(p)); }
        var alpha = 1, dep = 1, szf = 1, lx = 0, ly = 0, lz = 0;
        if (b.back && t < b.t0 + b.dur) {
          if (t < b.t0) continue;                                                              /* 맡은 칸이 닿기 전엔 비어 있다 */
          var ep = easeOut(p);
          alpha = ep; szf = 0.85 + 0.15 * ep; dep = 0.03 + 0.97 * ep;                           /* 도착하는 칸만큼 차오르며 납작한 픽셀 → 로고 두께의 큐브 */
        }
        var sq = (t - b.tl) / (0.5 * PACE);                                                       /* 착지: 제자리에 닿는 순간 화면 쪽으로 살짝 밀려 나왔다가 자리 잡는다 */
        if (b.sa && sq > 0 && sq < 1) lz -= b.sa * Math.sin(Math.PI * sq) * (1 - sq);
        var bob = hasFlow ? Math.sin(t * 0.7 + b.fc * 0.3 + b.fr * 0.5) * 0.18 * g.flow : 0;
        b.pulse = 0;
        if (hasLive) {
          /* 살아 있는 로고: 전에는 위치에 따라 이어지는 물결(sin(gx·0.3+gy·0.18))이 로고 절반을 한 덩어리로 부풀렸다.
             이제는 픽셀마다 제 빠르기로 숨쉬고, 6–12초에 한 번 제 차례에 앞으로 톡 튀어나온다 — 로고 전체에 고르게 흩어진다 */
          var lv = g.live; lz += Math.sin(t * b.bw + b.seed * 6.283) * 0.025 * lv; lx += Math.sin(t * 0.455 + b.seed2 * 6.283) * 0.018 * lv; ly += Math.cos(t * 0.52 + b.seed * 6.283) * 0.018 * lv;
          var ph = ((t + b.po) % b.pp) / b.pp;
          if (ph < 0.1) { var bump = Math.sin(Math.PI * ph / 0.1); b.pulse = bump * bump * lv * liveK; lz -= b.pulse * 0.3; }   /* 숨쉬기·튀어나옴 깊이를 줄여 이웃 면이 계단처럼 갈라지지 않게 */
        }
        var px = (b.cur.x + lx) * S, py = (b.cur.y + ly) * S, pz = (b.cur.z + bob + lz) * S;
        var z1 = -px * sy + pz * cy; var z2 = py * sp + z1 * cp;
        var rc = RECS[i]; rc.z = (b.held || b.thrown) ? -1e9 : z2; rc.a = alpha; rc.px = px; rc.py = py; rc.pz = pz; rc.dep = dep; rc.szf = szf;   /* 잡은·던진 조각은 맨 위에 */
        ORDER[nVis++] = i;
      }
      var ordArr = ORDER.subarray(0, nVis); ordArr.sort(function(a, b2){ return RECS[b2].z - RECS[a].z; });
      var margin = 60, fogA = pal.fog[0], fogB = pal.fog[1], fogC = pal.fog[2], liA = pal.light[0], liB = pal.light[1], liC = pal.light[2], skA = pal.sky[0], skB = pal.sky[1], skC = pal.sky[2];
      /* 한 덩어리 로고 (사용자 2026-09-28: 큐브 사이로 흰 줄이 비쳐 격자처럼 네모네모하다): 큐브를 그리기 전에 모든 큐브의 앞면을
         4% 넓혀 한 색으로 먼저 깐다. 이음새·안티에일리어싱 틈으로 배경 대신 이 색이 비쳐 줄이 사라진다 (코드 조각·차오르는 중인 큐브는 제외) */
      ctx.beginPath(); var ulN = 0;
      for (var u2 = 0; u2 < nVis; u2++) {
        var ur = RECS[ordArr[u2]], ub = boxes[ordArr[u2]]; if (ur.a < 0.99 || ub.m > 0.01) continue;
        var uhs = HS * S * ur.szf * 1.04, uvz = ur.pz - ub.h * S * ur.dep;
        for (var uq = 0; uq < 4; uq++) {
          var uc = uq === 0 ? 0 : uq === 1 ? 1 : uq === 2 ? 3 : 2, uvx = ur.px + (uc & 1 ? uhs : -uhs), uvy = ur.py + (uc & 2 ? uhs : -uhs);
          var uax = uvx * cy + uvz * sy, uaz = -uvx * sy + uvz * cy, uay = uvy * cp - uaz * sp, usc = F / (uvy * sp + uaz * cp + D);
          if (uq) ctx.lineTo(OX + uax * usc, OY + uay * usc); else ctx.moveTo(OX + uax * usc, OY + uay * usc);
        }
        ctx.closePath(); ulN++;
      }
      if (ulN) { var ulF = 0.135 * (1 - g.flat); ctx.fillStyle = colStr(FR[0] + (fogA - FR[0]) * ulF, FG[0] + (fogB - FG[0]) * ulF, FB[0] + (fogC - FB[0]) * ulF); ctx.globalAlpha = 1; ctx.fill(); }   /* 워터마크 챕터의 반투명은 캔버스 opacity 가 맡는다 */
      var lastStyle = null;
      for (var k2 = 0; k2 < nVis; k2++) {
        var it = RECS[ordArr[k2]], bx = boxes[ordArr[k2]], hz = bx.h * S * it.dep, hs = HS * S * it.szf;
        var cx0 = it.px * cy + it.pz * sy, cz0 = -it.px * sy + it.pz * cy, cy0 = it.py * cp - cz0 * sp, cz1 = it.py * sp + cz0 * cp;
        var scC = F / (cz1 + D), X = OX + cx0 * scC, Y = OY + cy0 * scC, sz = hs * scC;
        if (X < -margin || X > W + margin || Y < -margin || Y > H + margin) continue;              /* 화면 밖은 그리지 않는다 */
        var m = bx.m, glow = boost[ordArr[k2]] * g.flow;
        if (m < 0.999) {
          /* 꼭짓점 8개 회전·투영 (재사용 버퍼) */
          for (var q = 0; q < 8; q++) {
            var v = CORN[q], vx = it.px + v[0] * hs, vy = it.py + v[1] * hs, vz = it.pz + v[2] * hz;
            var ax = vx * cy + vz * sy, az = -vx * sy + vz * cy, ay = vy * cp - az * sp, az2 = vy * sp + az * cp;
            var sc = F / (az2 + D); PX[q] = OX + ax * sc; PY[q] = OY + ay * sc; RX[q] = ax; RY[q] = ay; RZ[q] = az2;
          }
          /* 상자 단위 색 보정: 안개(깊이)·빛 띠·데이터 패킷·살아있는 반짝임 */
          var fog = Math.max(0, Math.min(1, (cz1 + 18) / 40)) * 0.3 * (1 - g.flat);   /* 단색 챕터는 깊이 안개·빛 띠도 없음 */
          var sd = (bx.cur.x * sweepC + bx.cur.y * sweepS) - sweepPos; var band = Math.exp(-sd * sd / 26) * 0.09 * (1 - g.flat); if (band < 0.01) band = 0;   /* 빛 띠는 약하게 (한쪽만 밝아 보이지 않게) */
          var flk = bx.pulse * 0.3; if (flk < 0.01) flk = 0;                                    /* 튀어나온 픽셀만 살짝 밝게 */
          ctx.globalAlpha = it.a * (1 - m);
          for (var f = 0; f < 6; f++) {
            var fv = FACES[f].v, i0 = fv[0], i1 = fv[1], i2 = fv[2], i3 = fv[3];
            var fcx = (RX[i0] + RX[i1] + RX[i2] + RX[i3]) * 0.25, fcy = (RY[i0] + RY[i1] + RY[i2] + RY[i3]) * 0.25, fcz = (RZ[i0] + RZ[i1] + RZ[i2] + RZ[i3]) * 0.25;
            if (FNX[f] * fcx + FNY[f] * fcy + FNZ[f] * (fcz + D) >= 0) continue;                    /* 뒷면 제거 */
            var r = FR[f], gg = FG[f], bb = FB[f];
            if (fog > 0) { r += (fogA - r) * fog; gg += (fogB - gg) * fog; bb += (fogC - bb) * fog; }
            if (band > 0) { r += (liA - r) * band; gg += (liB - gg) * band; bb += (liC - bb) * band; }
            if (glow > 0.02) { var gk = Math.min(0.85, glow * (f <= 1 ? 1 : 0.6)); r += (skA - r) * gk; gg += (skB - gg) * gk; bb += (skC - bb) * gk; }
            if (flk > 0) { r += (liA - r) * flk; gg += (liB - gg) * flk; bb += (liC - bb) * flk; }
            var st = colStr(r, gg, bb); if (st !== lastStyle) { ctx.fillStyle = st; lastStyle = st; }
            /* 면을 0.35px 만큼 바깥으로 넓혀 이음새를 지운다 (전에는 면마다 stroke 를 한 번 더 그렸다) */
            var mx = (PX[i0] + PX[i1] + PX[i2] + PX[i3]) * 0.25, my = (PY[i0] + PY[i1] + PY[i2] + PY[i3]) * 0.25;
            ctx.beginPath();
            for (var vq = 0; vq < 4; vq++) { var vi = fv[vq], ex = PX[vi] - mx, ey = PY[vi] - my, el = Math.max(2, Math.sqrt(ex * ex + ey * ey)), kk = 1 + 0.5 / el; if (vq) ctx.lineTo(mx + ex * kk, my + ey * kk); else ctx.moveTo(mx + ex * kk, my + ey * kk); }
            ctx.closePath(); ctx.fill();
          }
        }
        if (m > 0.001) { bx.drawK = k2; drawFragment(bx, X + (bx.ox || 0), Y + (bx.oy || 0), sz, null, it.a * m, pal); lastStyle = null; }
      }
      }
      ctx.globalAlpha = 1;
      if (PERF) { perfLog.push(+(performance.now() - p0).toFixed(2)); if (perfLog.length > 600) perfLog.shift(); }   /* 검수용: 최근 600 프레임의 그리기 비용(ms) */
      if (!introDone && t > INTRO_T) introFinish();
      requestAnimationFrame(render);
    }
    /* 커서·누른 곳 (01 ① 관객이 비추는 빛 · 02 ③ 손) */
    var ptr = { x: -1e4, y: -1e4, t: -1e9 }, taps = [], mfT0 = 0, c2T0 = 0, hand = { u: 0, v: 0 }, shw = { ph: 0, k: 0, bu: 0, fx: 0, e1: 0, e2: 0, e3: 0, bx: 0, by: 0, bh: 0, sq: 0 }, C2LEN = 15.2, PLAY = 1.6, cg = { ph: 0, k: 0 }, trk = { sw: 0, hist: [] }, av = { bi: 0, ph: 0, pump: 0 }, HP = null;   /* PLAY: 로고 플레이(01 ① · 02 ① · 02 ②) 진행 속도 — 사용자 10-26: 35–50% 짧게 → 1.6배 (37.5%). 빨라진 만큼 전환 이징 구간은 1.4–1.5배로 늘려 겹치게 (부드러움 유지) */
    /* 02 CG 렌더 버킷: 4×4 칸 타일 — 가운데서 가까운 순으로 네 개씩(스레드 4) 0.16초마다 */
    var TILE = (function(){
      var has = {}, list = [];
      boxes.forEach(function(b){ b.tile = Math.floor(b.r / 4) * 8 + Math.floor(b.c / 4); if (!has[b.tile]) { has[b.tile] = 1; list.push(b.tile); } });
      list.sort(function(a, b){ var ax = (a % 8) * 4 - 14, ay = Math.floor(a / 8) * 4 - 15, bx = (b % 8) * 4 - 14, by = Math.floor(b / 8) * 4 - 15; return ax * ax + ay * ay - bx * bx - by * by; });
      var T = { n: list.length, at: {}, st: [], tx: [], ty: [] };
      list.forEach(function(id, k){ var s = 0.15 + Math.floor(k / 4) * 0.16; T.at[id] = s; T.st.push(s); T.tx.push(id % 8); T.ty.push(Math.floor(id / 8)); });
      return T;
    })();
    /* 01 ① 화면 위 그림 (사용자 10-26 ②) — 로고 칸 하나 = 2×2 픽셀인 작은 캔버스. 체커 테스트 화면(2.7–3.85) → 대각선으로 넘어가며 우주 영상(프로젝션 · 실감) */
    var MOC = document.createElement('canvas'); MOC.width = 64; MOC.height = 68;
    var MCX = MOC.getContext('2d'), MID = MCX.createImageData(64, 68), MPAL = [[214, 240, 40], [246, 246, 240], [200, 200, 196], [160, 160, 160], [110, 110, 108], [40, 40, 40], [214, 240, 40], [160, 160, 160]];   /* 체커 색: 사이트 색 (라임 · 회색 단계 — 짙은 라임은 탁한 올리브로 보여 뺐다) — 사용자 10-26: 레퍼런스 색 말고 기존 색과 맞게 */
    var MEDGE = (function(){                                                         /* 마스크 윤곽: 칸 모양의 바깥 변 — 각도 순으로 (한 바퀴 돌며 그린다) */
      var occ = {}, E = []; boxes.forEach(function(b){ occ[b.c + ',' + b.r] = 1; });
      boxes.forEach(function(b){ var x0 = b.gx - 0.5, y0 = b.gy - 0.5; if (!occ[b.c + ',' + (b.r - 1)]) E.push([x0, y0, x0 + 1, y0]); if (!occ[b.c + ',' + (b.r + 1)]) E.push([x0, y0 + 1, x0 + 1, y0 + 1]); if (!occ[(b.c - 1) + ',' + b.r]) E.push([x0, y0, x0, y0 + 1]); if (!occ[(b.c + 1) + ',' + b.r]) E.push([x0 + 1, y0, x0 + 1, y0 + 1]); });
      E.forEach(function(e){ e.push(Math.atan2((e[1] + e[3]) / 2, (e[0] + e[2]) / 2)); }); E.sort(function(a, b){ return a[4] - b[4]; }); return E;
    })();
    function mediaPx(ph, t){
      var d = MID.data, ia = ph < 6.6 ? 1 : 1 - sstep(9.35, 9.85, ph), u = Math.min(1, Math.max(0, (ph - 3.6) / 3)), zm = 1 - 0.1 * u, pcx = -8.5 + 2.5 * u, pcy = -4.5 + 0.8 * u, PR = 6.2, wf = -36 + (ph - 3.35) / 0.5 * 70;
      for (var py = 0; py < 68; py++) for (var px = 0; px < 64; px++) {
        var x = px / 2 - 16.75, y = py / 2 - 16.75, o = (py * 64 + px) * 4, r = 0, g = 0, bl = 0, a = 0;
        if (ph < 3.85) { var cc = px >> 1, rr = py >> 1, ck = Math.min(1, Math.max(0, (-19 + (ph - 2.7) / 0.35 * 36 - x) / 3)); if (ck > 0) { var pc = (cc + rr) & 1 ? MPAL[Math.floor(hs(cc * 7.1 + rr * 3.3) * 8)] : [236, 236, 232]; r = pc[0]; g = pc[1]; bl = pc[2]; a = ck; } }   /* 체커: 왼쪽부터 채워진다 */
        if (ph >= 3.35) {
          var m = ph >= 3.85 ? 1 : Math.min(1, Math.max(0, (wf - (x + y)) / 4)), fl = ph < 3.85 ? Math.max(0, 1 - Math.abs(wf - (x + y) - 2) / 2) : 0;   /* 대각선으로 넘어가는 앞머리는 하얗게 */
          if (m > 0) {
            var X = x * zm, Y = y * zm, v = (Y + 17) / 34, sr = 20 + 22 * v, sg = 20 + 22 * v, sb = 19 + 20 * v;   /* 우주는 사이트 색으로: 먹색 바탕 · 회색 성운 · 회색 행성 · 라임은 대기 테두리와 별 몇 개만 */
            var nb = Math.max(0, Math.sin(X * 0.23 + Y * 0.31 + t * 0.6) + Math.sin(X * 0.41 - Y * 0.17 - t * 0.45 + 1.3) + Math.sin((X + Y) * 0.13 + t * 0.3) - 0.7) * 0.55; sr += 130 * nb; sg += 132 * nb; sb += 126 * nb;   /* 흐르는 성운 (회색 연기 — 라임을 어두운 바탕에 섞으면 탁한 올리브가 됐다) */
            var fx = X - 7, fy = Y + 12.5, fe = Math.exp(-(fx * fx + fy * fy) / 22) * (0.9 + 0.1 * Math.sin(t * 2)); sr += 240 * fe; sg += 244 * fe; sb += 214 * fe;   /* 오른쪽 위 빛 번짐 (따뜻한 흰빛) */
            var sid = px + py * 64; if (hs(sid * 0.371) > 0.955) { var tw = 0.5 + 0.5 * Math.sin(t * 4 + sid), lm = hs(sid * 0.13) > 0.8; sr += (lm ? 214 : 216) * tw; sg += (lm ? 240 : 216) * tw; sb += (lm ? 40 : 210) * tw; }   /* 반짝이는 별 (다섯에 하나는 라임) */
            var qx = X - pcx, qy = Y - pcy, pd = Math.sqrt(qx * qx + qy * qy);
            if (pd < PR) { var nz = Math.sqrt(1 - pd * pd / (PR * PR)), lam = Math.max(0, 0.5 * qx / PR - 0.55 * qy / PR + 0.67 * nz), bnd = 0.5 + 0.5 * Math.sin(qx * 0.9 + t * 0.7 + Math.sin(qy * 0.6) * 1.6), lk = 0.12 + 0.95 * lam, gv = (120 + 95 * bnd) * lk; sr = gv; sg = gv; sb = gv * 0.97; }   /* 행성: 로고가 꽉 찬 왼쪽 위에 · 오른쪽 위 빛을 받고 띠가 천천히 돈다 */
            else if (pd < PR + 1.4) { var at = 1 - (pd - PR) / 1.4; at *= at; sr += 190 * at; sg += 214 * at; sb += 30 * at; }   /* 대기 (라임) */
            r += (sr - r) * m; g += (sg - g) * m; bl += (sb - bl) * m; a = Math.max(a * (1 - m), m);
          }
          if (fl > 0) { r += (255 - r) * fl; g += (255 - g) * fl; bl += (255 - bl) * fl; a = Math.max(a, fl); }
        }
        d[o] = r; d[o + 1] = g; d[o + 2] = bl; d[o + 3] = 255 * a * ia;
      }
      MCX.putImageData(MID, 0, 0);
    }
    function drawMedia(t, OX, OY, U, mf){                                          /* 01 ① 화면 위 요소: 정합 표시·스캔선(매핑) · 쏟아지는 픽셀(실감) · 단계 탭 — 로고와 같은 정면 2D 좌표 */
      var en = document.documentElement.lang === 'en', mob = MOBILE(), ph = mf.ph, P = function(x, y){ return [OX + x * U, OY + y * U]; }, ink = 'rgba(17,17,17,';
      ctx.save(); ctx.globalAlpha = mf.k; ctx.lineWidth = 1; ctx.font = '500 ' + (mob ? 9 : 10.5) + 'px "Geist Mono", "Pretendard", ui-monospace, monospace'; lastFont = null; ctx.textBaseline = 'middle';
      var txt = function(s, x, y, al, a){ ctx.fillStyle = ink + (a === undefined ? 0.62 : a) + ')'; ctx.textAlign = al || 'left'; ctx.fillText(s, x, y); return ctx.measureText(s).width; };
      var CP = new Path2D(); for (var ci = 0; ci < N; ci++) { var cb2 = boxes[ci], cs = 1 - SCM[ci * 2]; if (cs < 0.03) continue; CP.rect(OX + (cb2.gx - cs / 2) * U - 0.3, OY + (cb2.gy - cs / 2) * U - 0.3, cs * U + 0.6, cs * U + 0.6); }   /* 칸 모양 (작아진 칸은 작게) — 투사한 빛은 이 안에만 */
      var LIM = 'rgb(150,166,0)', RG = [[-17, -17], [15, -17], [15, 17], [-17, 17]];
      if (ph < 3.45) {                                                               /* 매핑: 비뚤게 뜬 테스트 격자 → 네 모서리 핀을 하나씩 끌어 로고 둘레 정합 표시에 맞춘다 */
        var K0 = [[-20.5, -19.2], [17.2, -14.6], [18.2, 18.6], [-15.2, 20.0]], cn = [], land = [];
        for (var q = 0; q < 4; q++) { var pu = Math.min(1, Math.max(0, (ph - 0.95 - q * 0.25) / 0.6)), pe = pu < 1 ? 1 + 2.2 * Math.pow(pu - 1, 3) + 1.2 * Math.pow(pu - 1, 2) : 1; cn.push([K0[q][0] + (RG[q][0] - K0[q][0]) * pe, K0[q][1] + (RG[q][1] - K0[q][1]) * pe]); land.push(pu); }
        var QP = function(uu, vv){ var ax = cn[0][0] + (cn[1][0] - cn[0][0]) * uu, ay = cn[0][1] + (cn[1][1] - cn[0][1]) * uu, bx2 = cn[3][0] + (cn[2][0] - cn[3][0]) * uu, by2 = cn[3][1] + (cn[2][1] - cn[3][1]) * uu; return P(ax + (bx2 - ax) * vv, ay + (by2 - ay) * vv); };
        var ga = sstep(0.3, 0.42, ph) * (ph < 0.62 ? (hs(Math.floor(ph * 30)) > 0.35 ? 1 : 0.25) : 1) * (1 - sstep(3.0, 3.4, ph)), fls = ph > 2.35 && ph < 2.6 ? 1 - (ph - 2.35) / 0.25 : 0;   /* 켜질 땐 두어 번 깜박 · 다 맞으면 한 번 번쩍 */
        var gcol = function(uu, a){ var w = fls; return 'rgba(' + Math.round(214 - 14 * uu + (255 - 214) * w) + ',' + Math.round(240 - 40 * uu + 15 * w) + ',' + Math.round(40 + 156 * uu + (255 - 40) * w) + ',' + a + ')'; };   /* 격자: 라임 → 밝은 회색 (다 맞으면 하얗게 번쩍) */
        var grid = function(a, lw){
          ctx.lineWidth = lw;
          for (var gi = 0; gi <= 16; gi++) { var uu = gi / 16, p0 = QP(uu, 0), p1 = QP(uu, 1); ctx.strokeStyle = gcol(uu, a); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); }
          for (var gj = 0; gj <= 17; gj++) { var h0 = QP(0, gj / 17), h1 = QP(1, gj / 17), lg = ctx.createLinearGradient(h0[0], h0[1], h1[0], h1[1]); lg.addColorStop(0, gcol(0, a)); lg.addColorStop(0.5, gcol(0.5, a)); lg.addColorStop(1, gcol(1, a)); ctx.strokeStyle = lg; ctx.beginPath(); ctx.moveTo(h0[0], h0[1]); ctx.lineTo(h1[0], h1[1]); ctx.stroke(); }
        };
        if (ga > 0) {
          ctx.save(); ctx.globalAlpha = mf.k * ga; grid(0.16, 1);                    /* 칸 밖으로 샌 빛은 옅게 */
          ctx.clip(CP); grid(0.95, mob ? 1 : 1.3);
          var c0 = QP(0.5, 0), c1 = QP(0.5, 1), c2 = QP(0, 0.5), c3 = QP(1, 0.5); ctx.lineWidth = mob ? 1.6 : 2.2; ctx.strokeStyle = ctx.fillStyle = 'rgba(214,240,40,0.95)'; ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.lineTo(c1[0], c1[1]); ctx.moveTo(c2[0], c2[1]); ctx.lineTo(c3[0], c3[1]); ctx.stroke();   /* 가운데 십자 */
          for (var tj2 = 1; tj2 < 17; tj2 += 2) { var tq = QP(0.5, tj2 / 17); ctx.beginPath(); ctx.moveTo(tq[0] - 3.5, tq[1] - 3); ctx.lineTo(tq[0] + 3.5, tq[1] - 3); ctx.lineTo(tq[0], tq[1] + 3); ctx.fill(); }   /* 정렬 표시 삼각형 */
          ctx.restore();
        }
        var ra = sstep(0.05, 0.4, ph) * (1 - sstep(3.0, 3.4, ph)); ctx.globalAlpha = mf.k * ra; ctx.lineWidth = 1;
        for (var q2 = 0; q2 < 4; q2++) {
          var tg = P(RG[q2][0], RG[q2][1]), sx = q2 === 0 || q2 === 3 ? 1 : -1, sy = q2 < 2 ? 1 : -1, bl2 = 1.2 * U, on = land[q2] >= 1;
          ctx.strokeStyle = on ? LIM : ink + '0.75)'; ctx.beginPath(); ctx.moveTo(tg[0], tg[1] + bl2 * sy); ctx.lineTo(tg[0], tg[1]); ctx.lineTo(tg[0] + bl2 * sx, tg[1]); ctx.stroke();   /* 맞출 자리 (정합 표시) */
          if (ph > 0.6 && ph < 2.6) { var hc = P(cn[q2][0], cn[q2][1]); if (!on) { ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(hc[0], hc[1]); ctx.lineTo(tg[0], tg[1]); ctx.stroke(); ctx.setLineDash([]); } ctx.strokeStyle = on ? LIM : ink + '0.9)'; ctx.strokeRect(hc[0] - 4, hc[1] - 4, 8, 8); ctx.beginPath(); ctx.moveTo(hc[0] - 8, hc[1]); ctx.lineTo(hc[0] + 8, hc[1]); ctx.moveTo(hc[0], hc[1] - 8); ctx.lineTo(hc[0], hc[1] + 8); ctx.stroke(); }   /* 모서리 핀 */
          var pg = ph - 1.55 - q2 * 0.25; if (pg > 0 && pg < 0.4) { ctx.strokeStyle = 'rgba(150,166,0,' + (1 - pg / 0.4) + ')'; ctx.beginPath(); ctx.arc(tg[0], tg[1], 4 + pg * 40, 0, 6.2832); ctx.stroke(); }   /* 맞는 순간 고리 */
        }
        ctx.globalAlpha = mf.k;
      }
      if (ph >= 2.7) {                                                               /* 체커 테스트 화면 → 우주 영상: 작은 캔버스(칸 하나 = 2×2 픽셀)를 칸 모양으로 잘라 얹는다 */
        mediaPx(ph, t); ctx.save(); ctx.clip(CP); ctx.imageSmoothingEnabled = false; ctx.drawImage(MOC, OX - 17 * U, OY - 17 * U, 32 * U, 34 * U); ctx.imageSmoothingEnabled = true; ctx.restore();
      }
      var et = Math.min(1, Math.max(0, (ph - 2.45) / 0.5)), ea = 1 - sstep(3.1, 3.45, ph);
      if (et > 0 && ea > 0) { ctx.globalAlpha = mf.k * ea; ctx.strokeStyle = 'rgba(214,240,40,0.95)'; ctx.lineWidth = mob ? 1.4 : 2; ctx.beginPath(); var ne = Math.floor(MEDGE.length * et); for (var ei = 0; ei < ne; ei++) { var e0 = P(MEDGE[ei][0], MEDGE[ei][1]), e1 = P(MEDGE[ei][2], MEDGE[ei][3]); ctx.moveTo(e0[0], e0[1]); ctx.lineTo(e1[0], e1[1]); } ctx.stroke(); ctx.globalAlpha = mf.k; }   /* 마스크: 로고 윤곽을 한 바퀴 딴다 */
      var da = sstep(2.8, 3.0, ph) * (1 - sstep(3.45, 3.75, ph));
      if (da > 0) {                                                                  /* 체커 화면 치수 */
        ctx.globalAlpha = mf.k * da; ctx.strokeStyle = ink + '0.6)'; ctx.lineWidth = 1; var d0 = P(-17, -18.6), d1 = P(15, -18.6), d2 = P(-18.6, -17), d3 = P(-18.6, 17);
        ctx.beginPath(); ctx.moveTo(d0[0], d0[1]); ctx.lineTo(d1[0], d1[1]); ctx.moveTo(d0[0], d0[1] - 4); ctx.lineTo(d0[0], d0[1] + 4); ctx.moveTo(d1[0], d1[1] - 4); ctx.lineTo(d1[0], d1[1] + 4); ctx.moveTo(d2[0], d2[1]); ctx.lineTo(d3[0], d3[1]); ctx.moveTo(d2[0] - 4, d2[1]); ctx.lineTo(d2[0] + 4, d2[1]); ctx.moveTo(d3[0] - 4, d3[1]); ctx.lineTo(d3[0] + 4, d3[1]); ctx.stroke();
        if (!mob) { txt('3200 mm', (d0[0] + d1[0]) / 2, d0[1] - 9, 'center', 0.7); ctx.save(); ctx.translate(d2[0] - 9, (d2[1] + d3[1]) / 2); ctx.rotate(-1.5708); txt('3400 mm', 0, 0, 'center', 0.7); ctx.restore(); }
        ctx.globalAlpha = mf.k;
      }
      if (mf.pt) {                                                                   /* 실감: 칸에서 떨어진 픽셀이 보는 사람 쪽으로 — 소실점(커서 쪽으로 기움)에서 멀어지며 커지고, 가까워지면 옅어진다 */
        var live = performance.now() - ptr.t < 2500, vx = OX - 0.5 * U + (live ? (ptr.x - OX) * 0.3 : Math.sin(t * 0.4) * 2 * U), vy = OY + (live ? (ptr.y - OY) * 0.3 : Math.cos(t * 0.3) * 1.5 * U), ie = sstep(6.6, 7.0, ph) * (1 - sstep(9.5, 9.9, ph));
        if (mob) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, OY + 19.5 * U); ctx.clip(); }   /* 폰: 아래 설명 글 위로는 쏟아지지 않게 */
        for (var k = 0; k < mf.pt.length; k += 2) {
          var bx = boxes[mf.pt[k]], q = mf.pt[k + 1], ps = 1 / (1 - 0.85 * Math.pow(q, 1.7)), X = vx + (OX + bx.gx * U - vx) * ps, Y = vy + (OY + bx.gy * U - vy) * ps, sz = U * 0.96 * ps, al = ie * Math.min(1, q * 12) * (1 - sstep(0.62, 1, q)) * 0.9;
          if (al < 0.01) continue; var mo2 = ((bx.r * 2) * 64 + bx.c * 2) * 4, md = MID.data; ctx.fillStyle = 'rgba(' + md[mo2] + ',' + md[mo2 + 1] + ',' + md[mo2 + 2] + ',' + al + ')';   /* 떠난 칸의 영상 색 그대로 */ var rot = (hs(k * 3.7) - 0.5) * 5 * q * q; if (Math.abs(rot) < 0.02) ctx.fillRect(X - sz / 2, Y - sz / 2, sz, sz); else { ctx.save(); ctx.translate(X, Y); ctx.rotate(rot); ctx.fillRect(-sz / 2, -sz / 2, sz, sz); ctx.restore(); }   /* 가까워질수록 조금씩 구르며 */
        }
        if (mob) ctx.restore();
      }
      var TB = en ? ['01 MAPPING', '02 PROJECTION', '03 IMMERSIVE'] : ['01 매핑', '02 프로젝션', '03 실감'], tp = P(-16.5, 19.6), tx3 = tp[0];   /* 단계 탭 */
      if (mob) { var mp = P(15.4, -16.2); txt(TB[mf.si], mp[0], mp[1], 'right', 0.92); ctx.fillStyle = ink + '0.8)'; var mw = ctx.measureText(TB[mf.si]).width; ctx.fillRect(mp[0] - mw, mp[1] + 7, mw * Math.min(1, mf.u), 1); ctx.restore(); return; }   /* 폰: 아래는 설명 글과 겹친다 → 로고 오른쪽 위 빈 모서리에 지금 단계만 */
      for (var tj = 0; tj < 3; tj++) { var o1 = tj === mf.si, w3 = txt(TB[tj], tx3, tp[1], 'left', o1 ? 0.92 : 0.32); if (o1) { ctx.fillStyle = ink + '0.8)'; ctx.fillRect(tx3, tp[1] + 8, w3 * Math.min(1, mf.u), 1); } tx3 += w3 + 18; }
      ctx.restore();
    }
    function hudProj(x, y, z){ var h = HP, px = x * h.S, py = y * h.S, pz = z * h.S, cx0 = px * h.cy + pz * h.sy, cz0 = -px * h.sy + pz * h.cy, cy0 = py * h.cp - cz0 * h.sp, sc = h.F / (py * h.sp + cz0 * h.cp + h.D); return [h.OX + cx0 * sc, h.OY + cy0 * sc]; }   /* 로고 좌표 → 화면 (코드 조각 투영과 같은 식) */
    window.addEventListener('pointermove', function(e){ ptr.x = e.clientX; ptr.y = e.clientY; ptr.t = performance.now(); }, { passive: true });
    window.addEventListener('pointerdown', function(e){ ptr.x = e.clientX; ptr.y = e.clientY; ptr.t = performance.now(); taps.push({ x: e.clientX, y: e.clientY, t: sceneT }); if (taps.length > 4) taps.shift(); }, { passive: true });
    function hs(x){ x = Math.sin(x * 12.9898) * 43758.5453; return x - Math.floor(x); }
    /* 02 ① 스케치 도면 획: [x0, y0, x1, y1, 시작 초, 걸리는 초, 종류(0 보조선 · 1 먹선 · 2 점선 · 3 가는 선), 와이어 높이, 휨] — 보조선을 옅게 길게 먼저, 바깥벽 → 칸막이 → A 스크린 → B 기둥 → C 공 → 치수선, 한 획씩 쭉쭉 */
    var SK = (function(){
      var L = [], t = 0.7;
      function seg(x0, y0, x1, y1, k, H, d, adv, bow){ var len = Math.hypot(x1 - x0, y1 - y0); d = d || 0.05 + len * 0.0065; L.push([x0, y0, x1, y1, t, d, k, H || 0, bow === undefined ? hs(L.length * 1.37 + 0.3) - 0.5 : bow]); t += adv === undefined ? d * 0.38 : adv; }
      function arc(cx, cy, r, a0, a1, k, dT, H){ var n = Math.max(10, Math.round(Math.abs(a1 - a0) * r * 1.6)), dd = dT / n; for (var q = 0; q < n; q++) { var p0 = a0 + (a1 - a0) * q / n, p1 = a0 + (a1 - a0) * (q + 1) / n; seg(cx + r * Math.cos(p0), cy + r * Math.sin(p0), cx + r * Math.cos(p1), cy + r * Math.sin(p1), k, H, dd * 1.2, dd, 0); } }
      [[-19, -11.5, 19, -11.5], [-19, 11.5, 19, 11.5], [-15.5, -14.5, -15.5, 14.5], [15.5, -14.5, 15.5, 14.5], [-5, -14, -5, 14], [5, -14, 5, 14]].forEach(function(c){ seg(c[0], c[1], c[2], c[3], 0, 0, 0.3, 0.07, 0); });
      t = 1.1;
      var O = 15.5, I = 14.5, YO = 11.5, YI = 10.5;
      [[-10.5, YO, O, YO], [O, YO, O, -YO], [O, -YO, 13.5, -YO], [10.5, -YO, -O, -YO], [-O, -YO, -O, YO], [-O, YO, -13.5, YO],
       [-10.5, YI, I, YI], [I, YI, I, -YI], [I, -YI, 13.5, -YI], [10.5, -YI, -I, -YI], [-I, -YI, -I, YI], [-I, YI, -13.5, YI]].forEach(function(c){ seg(c[0], c[1], c[2], c[3], 1, 1.7); });
      [[-13.5, YI, -13.5, YO], [-10.5, YI, -10.5, YO], [10.5, -YI, 10.5, -YO], [13.5, -YI, 13.5, -YO]].forEach(function(c){ seg(c[0], c[1], c[2], c[3], 1, 1.7, 0.06, 0.035, 0); });
      [[-5.5, -YI, -5.5, 3.5], [-4.5, -YI, -4.5, 3.5], [-5.5, 3.5, -4.5, 3.5], [4.5, YI, 4.5, -3.5], [5.5, YI, 5.5, -3.5], [4.5, -3.5, 5.5, -3.5]].forEach(function(c){ seg(c[0], c[1], c[2], c[3], 1, 1.5); });
      [[-13.5, -9.5, -6.5, -9.5], [-6.5, -9.5, -6.5, -8.5], [-6.5, -8.5, -13.5, -8.5], [-13.5, -8.5, -13.5, -9.5]].forEach(function(c){ seg(c[0], c[1], c[2], c[3], 1, 3.4); });
      seg(-10, -2.8, -13.5, -8.5, 2, 0, 0.14, 0.05, 0); seg(-10, -2.8, -6.5, -8.5, 2, 0, 0.14, 0.12, 0);
      var tk = t; KF.forEach(function(p){ var x = p[0], y = p[1], r = 0.32, t0 = t; [[x - r, y - r, x + r, y - r], [x + r, y - r, x + r, y + r], [x + r, y + r, x - r, y + r], [x - r, y + r, x - r, y - r]].forEach(function(c){ seg(c[0], c[1], c[2], c[3], 1, 0.75, 0.025, 0.012, 0); }); t = t0 + 0.008; });
      t = tk + 0.2;                                                                   /* 두 번째 펜: 기둥을 그리는 동안 C 공 */
      arc(BC[0], BC[1], BR, BA0, BA0 + 6.2832, 2, 0.2); arc(BC[0], BC[1] + BR, BALLR, -1.5708, 4.7124, 1, 0.15);
      for (var q = 0; q < 3; q++) { var a = BA0 + (q + 0.5) * 2.0944; arc(BC[0] + BR * Math.cos(a), BC[1] + BR * Math.sin(a), 0.42, 0, 6.2832, 3, 0.04); }
      t = 2.55;
      seg(-15.5, -13.3, 15.5, -13.3, 3, 0, 0.3, 0.1, 0); seg(-17, -11.5, -17, 11.5, 3, 0, 0.25, 0.08, 0);
      [-15.5, -5, 5, 15.5].forEach(function(x){ seg(x, -12.1, x, -13.8, 3, 0, 0.04, 0.02, 0); seg(x - 0.35, -12.95, x + 0.35, -13.65, 1, 0, 0.03, 0.02, 0); });
      [-11.5, 3.5, 11.5].forEach(function(y){ seg(-16.1, y, -17.5, y, 3, 0, 0.04, 0.02, 0); seg(-17.35, y + 0.35, -16.65, y - 0.35, 1, 0, 0.03, 0.02, 0); });
      return L;
    })();
    var BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(function(v){ return (v + 0.5) / 16; }), MDK = -0.9, MLT = 1.45, mfX = -1e9, EM = new Float32Array(N);
    var SFX = new Float32Array(N * 4), SVF = new Float32Array(N * 4), SCM = new Float32Array(N * 2), SVM = new Float32Array(N * 2), SZ = new Float32Array(N), SVZ = new Float32Array(N), ovl = { mf: null, mfT: -1, mfK: 1, hs: -1, hk: 1, hT: -1 };   /* 스프링으로 따라가는 칸 값 · 떠나는 화면 표시   /* 4×4 디더 문턱 · ① 어둠/흰빛 밝기 (로고색 #A0A0A0 × (1+값)) */
    function eio(x){ return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2; }   /* 화면 위를 옮겨 가는 움직임: 강한 ease-in-out (quint) */
    function sstep(a, b, x){ x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
    function renderSC(t, yaw, pitch, F, D, S, OX, OY, pal){
      var hasFlow = g.flow > 0.01, nFr = 0, lv = g.live * (introDone ? Math.min(1, (t - introAt) / 1.5) : 0);
      var s1 = active === 1 && introDone ? c1step : 0, s2 = active === 2 && introDone ? c2step : -1;   /* 01·02 단계별 연출 */
      var U = S * F / D, pOn = performance.now() - ptr.t < 2500, mf = null, tau = (t % 3.2) / 3.2;
      /* 01 ① 미디어아트·실감미디어, 10초 (사용자 10-26: 선 긋는 모션·사물 그림은 짜침 → 픽셀 자체가 움직인다):
         ① 매핑 — 비뚤게 뜬 테스트 격자(초록→빨강)를 네 모서리 핀으로 로고에 맞추고, 마스크 윤곽을 딴 뒤 컬러 체커 테스트 화면 →
         ② 프로젝션 — 대각선으로 넘어가며 우주 영상(성운 · 별 · 천천히 도는 행성)이 로고 칸 위에 픽셀로 →
         ③ 실감 — 그 영상 픽셀이 벽에서 떨어져 원근을 따라 커지며 보는 사람 쪽으로 쏟아져 나온다 (커서 쪽으로 흐름이 기운다). 끝엔 다시 점으로.
         커서 둘레는 칸이 작아지는 렌즈, 누르면 작아지는 고리. (사용자 10-26 ②: 매핑은 테스트 이미지를 띄우는 느낌으로, 프로젝션은 다른 디자인으로 — 색은 사이트 색(먹 · 회색 · 라임)으로) */
      if (s1 === 1 && !reduce) {
        var mt = t - mfT0, mph = (mt * PLAY) % 10, msi = mph < 3.6 ? 0 : mph < 6.6 ? 1 : 2;
        mf = { si: msi, ph: mph, u: msi === 0 ? mph / 3.6 : msi === 1 ? (mph - 3.6) / 3 : (mph - 6.6) / 3.4, k: sstep(0, 0.7, mt), ux: (ptr.x - OX) / U, uy: (ptr.y - OY) / U, pt: null };
        if (msi === 2) {                                                             /* 쏟아지는 픽셀 140개: 1.5초마다 다른 칸에서 출발 (상태 없이 시각으로 계산) — 막 떠난 칸은 비었다가 다시 찬다 */
          mf.pt = []; EM.fill(0);
          for (var pj = 0; pj < 140; pj++) { var tt0 = mph - 6.6 - hs(pj * 1.913) * 1.5; if (tt0 < 0 || mph > 9.3 + (tt0 % 2.1)) continue; var cyc = Math.floor(tt0 / 2.1), pq = (tt0 - cyc * 2.1) / 2.1, ci = Math.floor(hs(pj * 7.31 + cyc * 3.17) * N); mf.pt.push(ci, pq); if (pq < 0.35) EM[ci] = Math.max(EM[ci], 1 - pq / 0.35); }
        }
      }
      var mfo = !mf && active === 1 && !reduce ? 1 - (t - mfX) / 0.5 : 0;               /* ① 을 떠나면 0.5초 동안 디더로 다시 회색 */
      var c2k = s2 >= 0 && !reduce ? sstep(0, 1, (t - c2T0 - 0.25) / 0.7) : 0, ct = t - c2T0;   /* 02 연출은 단계에 들어와 로고가 자리 잡은 뒤 서서히 */
      if (s2 === 0) {                                                                  /* 기획·연출 15.2초 (사용자 10-26 ②): 로고 → 선으로만 그리는 스케치 도면 → 선이 3D 와이어로 솟음 → 픽셀이 와이어 안을 채움 → A 영상 · B 키네틱 · C 애니메이션 → 다시 로고 */
        var sp0 = (ct * PLAY) % C2LEN; shw.ph = sp0;
        shw.k = sp0 < 3.7 ? 0 : sp0 < 6.5 ? 1 : sp0 < 8.7 ? 2 : sp0 < 10.9 ? 3 : sp0 < 13.0 ? 4 : 5;   /* 스케치 · 3D · 영상 · 키네틱 · 애니메이션 · 돌아감 */
        shw.fx = -20 + (sp0 - 14.55) / 0.65 * 40;
        shw.e1 = sstep(6.4, 7.0, sp0) * (1 - sstep(8.25, 8.85, sp0)); shw.e2 = sstep(8.55, 9.15, sp0) * (1 - sstep(10.45, 11.05, sp0)); shw.e3 = sstep(10.75, 11.35, sp0) * (1 - sstep(12.55, 13.05, sp0));
        shw.bu = Math.min(1, Math.max(0, (sp0 - 10.95) / 2.0)); var bA = ballAt(shw.bu); shw.bx = bA[0]; shw.by = bA[1]; shw.bh = bA[2]; shw.sq = shw.bu > 0 && shw.bu < 1 ? 1 - Math.min(1, shw.bh / 0.6) : 0;   /* 튀는 공: 닿는 순간 납작 */
      }
      if (s2 === 3) { var BT = 60 / 124; av.bi = Math.floor(ct / BT); av.ph = (ct - av.bi * BT) / BT; av.pump = Math.exp(-av.ph * 5) * (av.bi % 4 === 0 ? 1 : 0.35); }   /* 124 BPM: 박마다 충격파, 네 박마다 크게 */
      if (s2 === 1) { cg.ph = (ct * PLAY) % 9; cg.k = cg.ph < 3 ? 0 : cg.ph < 6 ? 1 : 2; }   /* CG: 모델링 3초 → 애니메이션 3초 → 렌더 3초 */
      if (s2 === 2) {                                                                  /* 손: 커서가 있으면 그 자리, 없으면 스스로 오간다 (부드럽게 따라감) */
        var hu = 9 * Math.sin(t * 0.6), hv = 7 * Math.sin(t * 0.83 + 1);
        if (pOn) { hu = (ptr.x - OX) / U; hv = (ptr.y - OY) / U; }
        hand.u += (hu - hand.u) * 0.12; hand.v += (hv - hand.v) * 0.12; trk.sw = -20 + ((ct % 1.6) / 1.6) * 40;
        trk.hist.push(0.55 * Math.sin(t * 1.3) + 0.3 * Math.sin(t * 3.7 + hand.u * 0.2) + (hs(Math.floor(t * 30)) - 0.5) * 0.15); if (trk.hist.length > 90) trk.hist.shift();
      }
      for (var i = 0; i < N; i++) {
        var b = boxes[i], p = Math.max(0, Math.min(1, (t - b.t0) / b.dur));
        if (b.from && b.to) { var e = easeOut4(p), arc = Math.sin(Math.PI * e); b.cur.x = b.from.x + (b.to.x - b.from.x) * e + b.ax * arc; b.cur.y = b.from.y + (b.to.y - b.from.y) * e + b.ay * arc; b.cur.z = b.from.z + (b.to.z - b.from.z) * e + b.az * arc; b.m = b.mFrom + (b.mTo - b.mFrom) * (b.mOut ? 1 - (1 - p) * (1 - p) : easeInOut(p)); }
        /* 살아 있는 로고: 칸마다 아주 느리게 오르내리는 부드러운 물결 — 짧은 파동 셋이 겹쳐 위로 흐르고 이웃 칸은 함께 움직인다 (툭 튀는 칸 없음) */
        var bob = hasFlow ? Math.sin(t * 0.7 + b.fc * 0.3 + b.fr * 0.5) * 0.18 * g.flow : 0, lvz = 0;
        if (lv > 0.001) lvz = lv * 0.06 * (Math.sin(b.gx * 0.4 + b.gy * 0.55 + t * 0.8) * 0.45 + Math.sin(-b.gx * 0.5 + b.gy * 0.35 + t * 0.6 + 1.7) * 0.35 + Math.sin(b.gx * 0.22 + b.gy * 0.75 + t * 1.0 + 4.2) * 0.2);
        b.pulse = 0;
        CFX[i * 4] = 0; CFX[i * 4 + 1] = 0; CFX[i * 4 + 2] = bob + lvz; CFX[i * 4 + 3] = boost[i] * g.flow;
        CM[i * 2] = b.m; CM[i * 2 + 1] = 0; CZ[i] = 0;
        var gl = 0, tn = 0, d, r, q;
        if (mf) {                                                                        /* 01 ①: Lt 밝기(0 어둠 … 1 흰빛) · sh 작아짐(0 꽉 찬 칸 … 1 사라짐) · dx 가로 어긋남 */
          var gx = b.gx, gy = b.gy, by = BAY[(b.r & 3) * 4 + (b.c & 3)], ph = mf.ph, Lt = 0, sh = 0, dx = 0;
          if (mf.si < 2) sh = ph < 0.4 ? 0.78 * (1 - sstep(0, 0.35, ph)) : 0;           /* 매핑·프로젝션: 칸은 어두운 화면 — 테스트 이미지·영상은 화면 위 그림(drawMedia)으로 칸 모양에 맞춰 얹는다 · 처음엔 점에서 칸으로 */
          else { sh = EM[i]; if (ph > 9.35) sh = 0.78 * sstep(9.35, 10, ph); }           /* 실감: 영상 픽셀이 떠난 칸은 잠깐 비고 → 끝엔 다시 점으로 */
          if (pOn) { d = (gx - mf.ux) * (gx - mf.ux) + (gy - mf.uy) * (gy - mf.uy); sh = Math.max(sh, 0.72 * Math.exp(-d / 10)); }   /* 커서 둘레: 칸이 작아지는 렌즈 */
          for (var ti = 0; ti < taps.length; ti++) { var ta = t - taps[ti].t; if (ta < 0 || ta > 1.3) continue; var tx2 = gx - (taps[ti].x - OX) / U, ty2 = gy - (taps[ti].y - OY) / U; if (Math.abs(Math.sqrt(tx2 * tx2 + ty2 * ty2) - ta * 18) < 1) sh = Math.max(sh, 0.8 * (1 - ta / 1.3)); }
          tn = mf.k > by ? (Lt > 0 ? MDK + (MLT - MDK) * Lt : MDK) : 0;                  /* 들어올 땐 회색에서 디더로 꺼진다 */
          CFX[i * 4] = dx; CFX[i * 4 + 3] = 0; CM[i * 2] = Math.max(CM[i * 2], sh * mf.k); CM[i * 2 + 1] = tn;
        } else if (mfo > 0) {
          CM[i * 2 + 1] = mfo > BAY[(b.r & 3) * 4 + (b.c & 3)] ? MDK : 0;
        } else if (s2 === 0 && c2k > 0) {                                               /* 기획·연출: 스케치 동안 칸은 도면 자리로 흩어지며 숨고 → 입구 쪽부터 바닥에서 솟아 채운다 → 존마다 연출 → 다시 로고 */
          var pl = b.pl, sp = shw.ph, kd = pl.k, rd = Math.min(1, Math.sqrt(b.gx * b.gx + b.gy * b.gy) / 22), st0 = rd * 0.42 + hs(i * 0.61) * 0.08, st1 = (1 - rd) * 0.42 + hs(i * 0.37) * 0.08;   /* 갈 땐 가운데부터, 돌아올 땐 바깥부터 */
          var fo = Math.min(1, Math.max(0, (sp - 0.6 - st0 * 0.9) / 0.8)), fb = Math.min(1, Math.max(0, (sp - 13.45 - st1 * 0.6) / 1.25)), eo = eio(fo), eb = eio(fb), mo = eo * (1 - eb);
          var gr = Math.min(1, Math.max(0, (sp - pl.ft) / 1.1)), gout = 1 - Math.min(1, Math.max(0, (sp - 12.85 - st1 * 0.4) / 0.6)), hg = (1 + 2.6 * Math.pow(gr - 1, 3) + 1.6 * Math.pow(gr - 1, 2)) * gout;   /* 솟을 땐 살짝 넘쳤다 자리 (back) */
          var vis = fb > 0 ? sstep(0.05, 0.45, fb) : sp < 4 ? 1 - sstep(0.1 + st0 * 0.9, 0.6 + st0 * 0.9, sp) : kd === 7 ? 0 : sstep(0, 0.3, gr) * Math.min(1, gout * 2.5);
          var tx = kd === 7 ? b.gx : pl.x, ty = kd === 7 ? b.gy : pl.y, Hc = [1.7, 1.5, 3.4, 0, 0, 0.08, 0.7, 0][kd] * hg, ksh = [0, 0, 0, 0.36, 0.38, 0.08, 0.64, 0][kd], lz = 0, gw = 0, e1 = shw.e1, e2 = shw.e2, e3 = shw.e3;
          var tn = [-0.05, -0.1, -0.6, -0.3, 0.6, 0.32, -0.25, 0][kd];
          if (kd === 6) { var vu = (sp * 0.035 + pl.j / NV) % 1, vp2 = pathAt(vu); tx = vp2[0]; ty = vp2[1]; if (fb <= 0) vis *= Math.min(1, vu / 0.035, (1 - vu) / 0.035); }   /* 관객: 입구에서 나타나 출구에서 사라짐 (돌아갈 땐 다 로고 칸으로 — 끝에 있던 칸이 작은 채로 남아 로고에 구멍이 났다) */
          if (kd === 2 || (kd === 5 && pl.x < -5.5)) {                                    /* A 영상: LED 벽이 켜지고, 그 영상이 바닥으로 번져 줄무늬로 흘러나온다 — 라임은 벽이 번쩍일 때와 앞으로 밀려가는 가는 선 하나만 */
            var dy = pl.y + 8.5, wp = ((sp - 6.5) % 2.0) / 2.0 * 19, lb = Math.exp(-(dy - wp) * (dy - wp) / 0.7);
            if (kd === 2) { tn += 0.12 * (0.5 + 0.5 * Math.sin(t * 0.8 + pl.x * 0.4)) + e1 * (0.35 + 0.9 * (0.5 + 0.5 * Math.sin(pl.x * 1.2 - t * 6))); gw = e1 * 0.3 * Math.exp(-wp * wp / 1.2); }
            else { var vst = 0.5 + 0.5 * Math.sin(dy * 0.9 - t * 5.5 + 0.8 * Math.sin(pl.x * 0.5 + t * 1.3)); tn += e1 * (1.15 * vst * vst - 0.8) * sstep(0, 1, ((sp - 6.5) * 10 - dy) / 4); gw = e1 * 0.45 * lb; }   /* 바닥은 어두워지고 밝은 줄무늬가 흘러간다 (벽에서부터 한 번 번져 나감) */
          }
          if (kd === 3) {                                                                 /* B 키네틱: 쉴 땐 숨쉬듯 낮게 → 연출 땐 가운데서 번지는 물결, 반쯤 지나 대각선 물결로 */
            var r3 = Math.hypot(pl.x, pl.y + 1.2), mw = sstep(9.4, 10.2, sp), aw = (0.5 + 0.5 * Math.sin(r3 * 1.25 - t * 3.4)) * (1 - mw) + (0.5 + 0.5 * Math.sin((pl.x * 0.5 - pl.y * 0.8) * 0.9 - t * 2.8)) * mw;
            Hc = (0.7 + 0.22 * Math.sin(t * 1.3 + pl.x * 0.6 + pl.y * 0.45) + (2.75 * aw - 0.25 - 0.22 * Math.sin(t * 1.3 + pl.x * 0.6 + pl.y * 0.45)) * e2) * hg; tn += e2 * 0.5 * aw; gw = e2 * 0.4 * Math.pow(aw, 6);
          }
          if (kd === 4) {                                                                 /* C 공: 복셀 공이 원을 따라 세 번 튄다 — 닿을 땐 옆으로 퍼지고 납작 */
            var wd = 1 + 0.32 * shw.sq, vz = 1 - 0.36 * shw.sq, hz = Math.sqrt(Math.max(0.1, BALLR * BALLR - pl.ox * pl.ox - pl.oy * pl.oy)) * vz;
            tx = shw.bx + pl.ox * wd; ty = shw.by + pl.oy * wd; Hc = 2 * hz * hg; lz = (shw.bh + BALLR * vz - hz) * hg; gw = 0.3 * e3;
          }
          if (kd === 5 && pl.x > 5.5) { var dsh = (pl.x - shw.bx) * (pl.x - shw.bx) + (pl.y - shw.by) * (pl.y - shw.by); tn -= 0.3 * (1 - shw.bh / 4) * Math.exp(-dsh / 2.4) * sstep(0, 0.3, gr); }   /* 공 아래 접지 그림자 */
          var ag = Math.exp(-Math.max(0, sp - pl.ft - 0.3) * 3.5) * (gr > 0 ? 1 : 0); tn += 0.35 * ag;   /* 솟는 순간 하얗게 반짝 (라임으로 하면 벽 전체가 탁한 올리브색이 됐다) */
          var sh0 = 1 - vis * (1 - (kd === 7 ? 0 : ksh * mo)), sk = Math.max(0.05, 1 - sh0), Sz = Math.max(-0.97, Math.min(8, Hc / (2 * b.h * sk) - 1));
          var zc = C2F0 - Hc - lz + b.h * sk, lift = -2.6 * Math.sin(Math.PI * eb);   /* 윗면 = 바닥 - 높이, 아래로 늘여 바닥에 닿게 · 갈 땐 제자리에서 픽셀로 꺼진 뒤 보이지 않게 옮기고, 돌아올 땐 위로 떴다 내려앉는다 */
          if (kd === 7) zc = 0;
          CFX[i * 4] = (tx - b.gx) * mo * c2k; CFX[i * 4 + 1] = (ty - b.gy) * mo * c2k; CFX[i * 4 + 2] = (zc * mo + lift) * c2k;
          CM[i * 2] = Math.max(CM[i * 2], sh0 * c2k); CZ[i] = (kd === 7 || fb > 0 ? 0 : Sz) * mo * c2k;
          CFX[i * 4 + 3] = gw * c2k; CM[i * 2 + 1] = tn * mo * c2k + (sp > 14.55 ? 0.85 * Math.exp(-Math.pow(b.gx - shw.fx, 2) / 3) * c2k : 0);   /* 다시 로고: 빛이 한 번 휩쓸고 지나간다 */
        } else if (s2 === 1 && c2k > 0) {                                               /* CG: 모델링(아래부터 쌓기) → 애니메이션(줄 미끄러짐·열 튀어나옴) → 렌더(버킷이 칸씩 완성) */
          var ph1 = cg.ph, hsi = hs(i * 1.37), sh1 = 0;
          if (cg.k === 0) {
            var tw = 0.05 + (b.gy + 16.5) / 33 * 0.45 + hsi * 0.08, tb = 0.75 + (16.5 - b.gy) / 33 * 1.8 + hsi * 0.12, yh = 16.5 - (ph1 - 0.75) / 1.8 * 33;
            sh1 = sstep(tw, tw + 0.26, ph1) * (1 - sstep(tb, tb + 0.24, ph1)); tn = -0.3 + (ph1 > 0.75 && ph1 < 2.7 ? 0.9 * Math.exp(-Math.pow(b.gy - yh, 2) / 0.6) : 0);
          } else if (cg.k === 1) {
            var ua = ph1 - 3, rd = b.r * 0.022, cd = b.c * 0.028, k1 = sstep(0.05 + rd, 0.75 + rd, ua) - sstep(1.0 + rd, 1.7 + rd, ua), k2 = sstep(1.5 + cd, 2.0 + cd, ua) - sstep(2.1 + cd, 2.65 + cd, ua);
            k1 = k1 * k1 * (3 - 2 * Math.abs(k1)) * (k1 < 0 ? -1 : 1); CFX[i * 4] = ((b.r & 1) ? 4.2 : -4.2) * k1 * c2k; CFX[i * 4 + 2] = -3.2 * k2 * c2k; CFX[i * 4 + 1] = -0.8 * k2 * c2k; tn = -0.3 + 0.35 * k2;
          } else {
            var st1 = TILE.at[b.tile], ur = ph1 - 6;
            tn = ur < st1 ? -0.48 + 0.1 * hs(i + Math.floor(t * 20)) : ur < st1 + 0.16 ? -0.2 + 0.6 * hs(i * 0.7 + Math.floor(t * 30)) : 0.04 + 0.55 * Math.exp(-(ur - st1 - 0.16) / 0.32);
          }
          CM[i * 2] = Math.max(CM[i * 2], sh1 * c2k); CM[i * 2 + 1] = tn * c2k;
        } else if (s2 === 2 && c2k > 0) {                                               /* 인터랙션·테크 = 트래킹: 손(커서) 둘레의 픽셀이 힘에 밀려 벌어지고 앞으로 솟는다 + 센서 스윕 */
          var tdx = b.gx - hand.u, tdy = b.gy - hand.v, td2 = tdx * tdx + tdy * tdy, tdl = Math.sqrt(td2) || 1, push = 2.4 * Math.exp(-td2 / 16) * c2k;
          CFX[i * 4] = tdx / tdl * push; CFX[i * 4 + 1] = tdy / tdl * push; CFX[i * 4 + 2] = -push * 0.9;
          CM[i * 2 + 1] = (0.32 * Math.exp(-td2 / 12) + 0.28 * Math.exp(-(b.gy - trk.sw) * (b.gy - trk.sw) / 0.5)) * c2k;
        } else if (s2 === 3 && c2k > 0) {                                               /* 오디오비주얼: 박마다 아무 데서나 충격파가 번지고(네 박마다 가운데서 크게), 빛 패킷이 지나간 칸은 튀어 올랐다 가라앉는다 */
          var az = 0, at = 0, BT2 = 60 / 124;
          for (var wj = 0; wj < 4; wj++) { var wb = av.bi - wj, wa = ct - wb * BT2, big = wb % 4 === 0, wx = big ? (FCOLS - 1) / 2 : hs(wb * 1.31) * FCOLS, wy2 = big ? (FROWS - 1) / 2 : hs(wb * 2.71) * FROWS;
            if (wb < 0) continue; r = Math.sqrt((b.fc - wx) * (b.fc - wx) + (b.fr - wy2) * (b.fr - wy2)) - wa * (big ? 13 : 9); q = Math.exp(-r * r / (big ? 4 : 2.5)) * Math.max(0, 1 - wa / (big ? 1.9 : 1.4)) * (big ? 1.25 : 0.7); az += q; at += q; }
          az += 1.4 * boost[i] + av.pump * (0.5 + 0.5 * Math.sin(b.fc * 0.45 + b.fr * 0.3 + t * 3));
          CFX[i * 4 + 2] -= 1.7 * az * c2k; CM[i * 2 + 1] = Math.min(0.6, 0.32 * at + 0.25 * boost[i] + 0.12 * av.pump) * c2k;
        }
        if (b.m > 0.001) ORDER[nFr++] = i;
      }
      /* 빛: 예전처럼 천천히 돈다 (옛 좌표 → three: y·z 뒤집기). 03 필드(g.flow)는 정면과 위 사이 45° 대각선에서 — 막대가 오르내리는 게 명암·그림자로 보인다 */
      var fw = g.flow, fx3 = Math.sin(t * 0.2) * 0.08, fy3 = 0.71, fz3 = 0.71, hd = g.head;   /* 00 은 빛이 카메라 위치에서 (g.head) */
      LV[0] = L[0] + (fx3 - L[0]) * fw; LV[1] = -L[1] + (fy3 + L[1]) * fw; LV[2] = -L[2] + (fz3 + L[2]) * fw;
      LV[0] += (-0.27 - LV[0]) * hd; LV[1] += (0.38 - LV[1]) * hd; LV[2] += (0.88 - LV[2]) * hd;   /* 카메라에 달린 조명: 렌즈 약간 위·왼쪽 */
      /* 01 ② 폭발 시뮬레이션 (셰이더 BOOM): 로고 고르게 흩어진 열 곳이 0.1–0.32초 간격으로 무작위 차례로 터지고 (마지막이 가장 크다),
         2.1초 동안 떨어지고 연기가 피어오른 뒤 한꺼번에 되감기(1.7초), 쉬었다가 다시. 단계를 떠나면 그 자리에서 빠르게 되감는다 */
      var bOn = s1 === 2 && !reduce;
      if (bOn && !boom.amp) { boom.t0 = t - boom.p + 0.45; boom.amp = 1; }              /* 들어오고 0.45초 뒤 첫 폭발 (그 전엔 쉬는 구간이라 켜도 그대로) */
      if (bOn && boom.code) { var bc = t - boom.t0; BOOMS.v[2] = bc; BOOMS.v[3] = 0.5; boom.p = bc + 1.1; boom.code = 0; boom.sa = 1; }   /* 코드로 가다 돌아오면 빠르게 되감고 다시 */
      if (!bOn && boom.amp) {
        if (boom.code) {                                                                 /* ③ 으로: 파편은 계속 날며 녹아 사라지고(코드로 바뀜) 연기는 0.5초에 걷힌다 */
          boom.sa = Math.max(0, 1 - (t - boom.code) / 0.5);
          if (t - boom.code > 1.4) { boom.amp = 0; boom.code = 0; boom.sa = 1; }
        } else {                                                                         /* 그 밖: 지금 자리에서 0.7초 만에 되감은 뒤 끈다 — 예전엔 크기만 줄며 돌아가 비틀린 채 있다가 마지막에 툭 반듯해졌다 */
          var bl = t - boom.t0;
          if (bl < BOOMS.v[2]) { BOOMS.v[2] = bl; BOOMS.v[3] = 0.7; boom.p = bl + 0.7 + 0.6; }
          if (bl >= BOOMS.v[2] + BOOMS.v[3]) boom.amp = 0;
        }
      }
      BOOMS.sa = boom.sa;
      if (bOn && t - boom.t0 >= boom.p) {
        var pts = [boxes[Math.floor(Math.random() * N)].cur];
        while (pts.length < 10) {                                                         /* 고르게 흩어진 자리: 후보 24곳 중 이미 고른 곳에서 가장 먼 곳 */
          var best = null, bd = -1;
          for (var q = 0; q < 24; q++) { var cb = boxes[Math.floor(Math.random() * N)].cur, md = 1e9; pts.forEach(function(pp){ var dx = pp.x - cb.x, dy = pp.y - cb.y; md = Math.min(md, dx * dx + dy * dy); }); if (md > bd) { bd = md; best = cb; } }
          pts.push(best);
        }
        pts.sort(function(){ return Math.random() - 0.5; });                             /* 차례는 무작위 — 여기저기서 */
        var tb = 0;
        pts.forEach(function(pp, q){ BOOMB[q * 4] = pp.x; BOOMB[q * 4 + 1] = -pp.y; BOOMB[q * 4 + 2] = tb; BOOMB[q * 4 + 3] = q === 9 ? 7.5 : 4.2 + Math.random() * 2.6; tb += 0.1 + Math.random() * 0.22; });
        var tl = BOOMB[9 * 4 + 2];
        BOOMS.v[2] = tl + 2.1; BOOMS.v[3] = 1.7; boom.p = tl + 2.1 + 1.7 + 0.5;           /* 다 터진 뒤 2.1초(파편이 땅에 떨어지고 연기가 피어오름) → 1.7초 동안 스르륵 되감기 (사용자 10-26: 로고 플레이 35–50% 짧게, 대신 되감기는 덜 줄여 부드럽게 — 전엔 3.4 · 2 · 1.4초, 간격 0.16–0.5) */
        boom.t0 = t;
      }
      BOOMS.v[0] = t - boom.t0; BOOMS.v[1] = boom.amp;            /* 화면 흔들림은 뺐다 (사용자 10-12: 너무 세다 — 충격은 큐브가 들썩이는 후폭풍으로) */
      /* 칸 연출 값은 스프링으로 따라간다 (사용자 10-26: 단계·루프가 바뀔 때 뚝뚝 끊김) — 목표가 갑자기 바뀌어도 속도를 이어 받아 부드럽게, 위치·크기는 살짝 넘쳤다 자리 잡는다(ζ 0.8) */
      var sdt = Math.min(0.05, Math.max(0, t - (lastFrameT || t)));
      if (reduce || !sdt) { SFX.set(CFX); SCM.set(CM); SZ.set(CZ); } else {
        var w1 = 19, w2 = 30, a1 = w1 * w1 * sdt, b1 = 2 * 0.8 * w1 * sdt, a2 = w2 * w2 * sdt, b2 = 2 * w2 * sdt;
        for (var si = 0; si < N * 4; si++) { SVF[si] += a1 * (CFX[si] - SFX[si]) - b1 * SVF[si]; SFX[si] += SVF[si] * sdt; }
        for (var sz = 0; sz < N; sz++) { SVZ[sz] += a1 * (CZ[sz] - SZ[sz]) - b1 * SVZ[sz]; SZ[sz] = Math.max(-0.97, SZ[sz] + SVZ[sz] * sdt); }   /* 높이 늘이기도 같은 스프링 (-1 아래로 가면 칸이 뒤집힌다) */
        for (var sj = 0; sj < N * 2; sj++) { var ws = sj & 1; SVM[sj] += (ws ? a2 : a1) * (CM[sj] - SCM[sj]) - (ws ? b2 : b1) * SVM[sj]; SCM[sj] += SVM[sj] * sdt; if (!ws) SCM[sj] = Math.min(1, Math.max(0, SCM[sj])); }   /* 밝기는 넘치지 않게 더 빠르게 · 크기는 0–1 안에서만 (넘치면 큐브가 뒤집힌다) */
      }
      S3D.render({ t: t, dt: lastFrameT ? t - lastFrameT : 1 / 60, cx: OX, cy: OY, s: S, yaw: yaw, pitch: pitch, mode: g.mode, flat: g.flat, wall: g.wall, F: F, D: D, ext: extT,
        cellFx: SFX, cellM: SCM, cellZ: SZ, light: LV, head: g.head, boom: BOOMS });
      lastFrameT = t;
      /* 02 챕터 코드 조각만 2D 로 (예전 투영 그대로) */
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      for (var k = 0; k < nFr; k++) {
        var bx = boxes[ORDER[k]], px = bx.cur.x * S, py = bx.cur.y * S, pz = bx.cur.z * S;
        var cx0 = px * cy + pz * sy, cz0 = -px * sy + pz * cy, cy0 = py * cp - cz0 * sp, cz1 = py * sp + cz0 * cp, scC = F / (cz1 + D);
        bx.drawK = k; drawFragment(bx, OX + cx0 * scC + (bx.ox || 0), OY + cy0 * scC + (bx.oy || 0), HS * S * scC, null, bx.m, pal);
      }
      HP = { S: S, F: F, D: D, cy: cy, sy: sy, cp: cp, sp: sp, OX: OX, OY: OY };
      /* 화면 위 표시: 들어올 땐 천천히, 떠날 땐 마지막 모습 그대로 0.3초 동안 옅어진다 (전엔 단계가 바뀌는 순간 사라졌다) */
      if (mf) { drawMedia(t, OX, OY, S * F / D, mf); ovl.mf = mf; ovl.mfT = -1; }
      else if (ovl.mf) { if (ovl.mfT < 0) { ovl.mfT = t; ovl.mfK = ovl.mf.k; } var fo1 = 1 - (t - ovl.mfT) / 0.3; if (fo1 > 0) { ovl.mf.k = ovl.mfK * fo1; drawMedia(t, OX, OY, S * F / D, ovl.mf); } else ovl.mf = null; }
      var hk = active === 2 && introDone && !reduce ? sstep(0, 1, (t - c2T0 - 0.45) / 0.6) : 0;
      if (ovl.hs >= 0 && (hk <= 0 || ovl.hs !== c2step)) { if (ovl.hT < 0) ovl.hT = t; var fo2 = 1 - (t - ovl.hT) / 0.3; if (fo2 > 0) drawHud(t, OX, OY, S * F / D, ovl.hk * fo2, yaw, pitch, ovl.hs); else { ovl.hs = -1; ovl.hT = -1; } }
      if (hk > 0) { drawHud(t, OX, OY, S * F / D, hk, yaw, pitch, c2step); if (ovl.hT < 0) { ovl.hs = c2step; ovl.hk = hk; } }
    }
    /* 02 작업 화면 표시: 로고 둘레 모서리 괄호 + 네 모서리 글 (고정폭 작은 글씨, 먹 55%) — 직업마다 그 일의 화면 */
    function p2(n){ return (n < 10 ? '0' : '') + n; }
    function drawHud(t, OX, OY, U, k, yaw, pitch, s2s){
      if (k <= 0) return;
      var mob = MOBILE(), mg = mob ? 20 : 34, ins = mob ? 14 : 24, fb = s2s === 3 ? projectBBox('field', g.s, yaw, pitch) : null;   /* 폰: 틀이 좁아 여백·글씨를 줄이고 항목도 줄인다 · 필드는 투영한 경계 상자로 */
      var X0 = fb ? OX + fb.x0 - mg + 10 : OX - 17 * U - mg + 4, X1 = fb ? OX + fb.x1 + mg - 10 : OX + 15 * U + mg - 4, Y0 = fb ? OY + fb.y0 - mg - 16 : OY - 17 * U - mg, Y1 = fb ? OY + fb.y1 + mg : OY + 17 * U + mg, ct = t - c2T0, ink = g.mode > 0.5 ? '243,243,243' : '17,17,17', B = mob ? 12 : 16, s2 = s2s;   /* 틀 = 로고 + 여백 띠 (글은 띠 안에 — 로고와 겹치지 않게) */
      var tc = 'TC 00:' + p2(Math.floor(ct / 60) % 60) + ':' + p2(Math.floor(ct) % 60) + ':' + p2(Math.floor(ct * 24) % 24), acc = 'rgb(150,166,0)', TY = Y0 + (mob ? 7 : 10), BY = Y1 - (mob ? 7 : 10);
      ctx.save(); ctx.globalAlpha = k; ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(' + ink + ',0.5)'; ctx.font = '500 ' + (mob ? 9 : 10.5) + 'px "Geist Mono", ui-monospace, Menlo, monospace'; lastFont = null; ctx.textBaseline = 'middle';
      var txt = function(s, x, y, al, a){ ctx.fillStyle = 'rgba(' + ink + ',' + (a === undefined ? 0.62 : a) + ')'; ctx.textAlign = al || 'left'; ctx.fillText(s, x, y); return ctx.measureText(s).width; };
      [[X0, Y0, 1, 1], [X1, Y0, -1, 1], [X0, Y1, 1, -1], [X1, Y1, -1, -1]].forEach(function(c){ ctx.beginPath(); ctx.moveTo(c[0], c[1] + B * c[3]); ctx.lineTo(c[0], c[1]); ctx.lineTo(c[0] + B * c[2], c[1]); ctx.stroke(); });
      if (s2 === 0) {                                                                  /* 기획·연출 (글 없이): 단계 막대 다섯(스케치 · 3D · 영상 · 키네틱 · 애니메이션) · 선 스케치 도면 → 3D 와이어 · 동선 · 지금 연출의 그래픽이 그 자리에 · 아래 연출 블록 셋 */
        var sp = shw.ph, LIME = 'rgb(150,166,0)', LF = function(a){ return 'rgba(150,166,0,' + a + ')'; }, kk = shw.k, SEG = [[0.7, 3.5], [3.5, 6.5], [6.5, 8.7], [8.7, 10.9], [10.9, 13.0]], F0 = C2F0, IR = mob ? 8 : 10;
        for (var j = 0; j < 5; j++) { var bxp = X0 + ins + j * 22, pr = Math.min(1, Math.max(0, (sp - SEG[j][0]) / (SEG[j][1] - SEG[j][0]))); ctx.fillStyle = 'rgba(' + ink + ',0.15)'; ctx.fillRect(bxp, TY - 1, 16, 2); ctx.fillStyle = j >= 2 && j === kk ? LIME : 'rgba(' + ink + ',0.8)'; ctx.fillRect(bxp, TY - 1, 16 * pr, 2); }
        var icon = function(kind, ix, iy, R, on){                                      /* 아이콘: 0 영상(화면+재생) · 1 키네틱(오르내리는 막대) · 2 애니메이션(튀는 공 궤적) */
          ctx.fillStyle = on ? 'rgba(214,240,40,0.95)' : '#f6f6f4'; ctx.strokeStyle = on ? LIME : 'rgba(' + ink + ',0.55)'; ctx.beginPath(); ctx.arc(ix, iy, R, 0, 6.2832); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = 'rgba(' + ink + ',0.9)'; ctx.fillStyle = ctx.strokeStyle; ctx.beginPath();
          if (kind === 0) { ctx.rect(ix - R * 0.55, iy - R * 0.38, R * 1.1, R * 0.76); ctx.stroke(); ctx.beginPath(); ctx.moveTo(ix - R * 0.15, iy - R * 0.2); ctx.lineTo(ix + R * 0.25, iy); ctx.lineTo(ix - R * 0.15, iy + R * 0.2); ctx.fill(); }
          else if (kind === 1) { for (var bj = 0; bj < 4; bj++) { var bh2 = R * (0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 5 + bj * 1.3))); ctx.fillRect(ix - R * 0.5 + bj * R * 0.28, iy + R * 0.35 - bh2, R * 0.16, bh2); } }
          else { ctx.arc(ix - R * 0.35, iy + R * 0.3, R * 0.14, 0, 6.2832); ctx.fill(); ctx.beginPath(); ctx.moveTo(ix - R * 0.5, iy + R * 0.4); ctx.quadraticCurveTo(ix - R * 0.2, iy - R * 0.7, ix + R * 0.1, iy + R * 0.4); ctx.quadraticCurveTo(ix + R * 0.3, iy - R * 0.2, ix + R * 0.5, iy + R * 0.4); ctx.stroke(); }
        };
        var fa = 1 - sstep(5.6, 6.8, sp), wh = eio(Math.min(1, Math.max(0, (sp - 4.05) / 1.4))), head = null;   /* 스케치: 획마다 펜이 빠르게 나가다 끝에서 멈춘다(out-cubic) · 모서리는 살짝 지나치고 선은 아주 조금 휜다 → 3D 시점이 되면 선이 위로 솟아 와이어가 된다 → 픽셀이 채우면 사라진다 */
        if (fa > 0 && sp > 0.6) {
          ctx.lineCap = 'round';
          for (var q = 0; q < SK.length; q++) {
            var sk = SK[q], u = (sp - sk[4]) / sk[5]; if (u <= 0) continue; u = u >= 1 ? 1 : 1 - Math.pow(1 - u, 3);
            var sx0 = sk[0], sy0 = sk[1], sx1 = sk[2], sy1 = sk[3], sl = Math.hypot(sx1 - sx0, sy1 - sy0) || 1, ov = sk[6] === 1 && sk[8] !== 0 ? 0.45 : 0, ux = (sx1 - sx0) / sl, uy = (sy1 - sy0) / sl;
            var ax = sx0 - ux * ov, ay = sy0 - uy * ov, bx = sx1 + ux * ov, by = sy1 + uy * ov, bw = sk[8] * Math.min(0.9, sl * 0.035), qx = (ax + bx) / 2 - uy * bw, qy = (ay + by) / 2 + ux * bw;
            var m1x = ax + (qx - ax) * u, m1y = ay + (qy - ay) * u, ex = m1x + (qx + (bx - qx) * u - m1x) * u, ey = m1y + (qy + (by - qy) * u - m1y) * u;
            var P0 = hudProj(ax, ay, F0), P1 = hudProj(m1x, m1y, F0), P2 = hudProj(ex, ey, F0);
            ctx.strokeStyle = 'rgba(' + ink + ',' + [0.13, 0.85, 0.5, 0.42][sk[6]] * fa + ')'; ctx.lineWidth = sk[6] === 1 ? 1.25 : 1; if (sk[6] === 2) ctx.setLineDash([3, 4]);
            ctx.beginPath(); ctx.moveTo(P0[0], P0[1]); ctx.quadraticCurveTo(P1[0], P1[1], P2[0], P2[1]); ctx.stroke(); ctx.setLineDash([]);
            if (u < 1) head = P2;
            if (sk[7] > 0 && wh > 0 && u >= 1) { var wz = F0 - sk[7] * wh, T0 = hudProj(sx0, sy0, wz), T1 = hudProj(sx1, sy1, wz), B0 = hudProj(sx0, sy0, F0), B1 = hudProj(sx1, sy1, F0); ctx.strokeStyle = 'rgba(' + ink + ',' + 0.62 * fa + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(B0[0], B0[1]); ctx.lineTo(T0[0], T0[1]); ctx.lineTo(T1[0], T1[1]); ctx.lineTo(B1[0], B1[1]); ctx.stroke(); }
          }
          if (head) { ctx.fillStyle = 'rgba(' + ink + ',0.9)'; ctx.beginPath(); ctx.arc(head[0], head[1], mob ? 1.8 : 2.2, 0, 6.2832); ctx.fill(); }   /* 펜 끝 */
          ctx.lineCap = 'butt';
        }
        var plk = sstep(2.8, 3.05, sp) * (1 - sstep(12.6, 13.2, sp));
        if (plk > 0) {                                                                 /* 관객 동선: 점선이 입구에서 출구까지 그려지고 계속 흐른다 */
          var rv = sstep(2.9, 3.5, sp), segs = [], tot = 0;
          for (var f = 1; f < FP.length; f++) { var pa0 = hudProj(FP[f - 1][0], FP[f - 1][1], F0), pa1 = hudProj(FP[f][0], FP[f][1], F0), sl2 = Math.hypot(pa1[0] - pa0[0], pa1[1] - pa0[1]); segs.push([pa0, pa1, sl2]); tot += sl2; }
          var lim = tot * rv, run = 0, tip = null; ctx.globalAlpha = k * plk * (1 - 0.55 * Math.max(shw.e1, shw.e2, shw.e3)); ctx.setLineDash([3, 6]); ctx.lineDashOffset = -t * 18; ctx.strokeStyle = 'rgba(' + ink + ',0.5)'; ctx.beginPath();
          segs.forEach(function(sg){ if (run >= lim) return; var fr = Math.min(1, (lim - run) / sg[2]), e = [sg[0][0] + (sg[1][0] - sg[0][0]) * fr, sg[0][1] + (sg[1][1] - sg[0][1]) * fr]; ctx.moveTo(sg[0][0], sg[0][1]); ctx.lineTo(e[0], e[1]); tip = [e[0], e[1], Math.atan2(sg[1][1] - sg[0][1], sg[1][0] - sg[0][0])]; run += sg[2]; });
          ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
          if (tip) { ctx.fillStyle = 'rgba(' + ink + ',0.65)'; ctx.beginPath(); ctx.moveTo(tip[0] + Math.cos(tip[2]) * 6, tip[1] + Math.sin(tip[2]) * 6); ctx.lineTo(tip[0] + Math.cos(tip[2] + 2.6) * 5, tip[1] + Math.sin(tip[2] + 2.6) * 5); ctx.lineTo(tip[0] + Math.cos(tip[2] - 2.6) * 5, tip[1] + Math.sin(tip[2] - 2.6) * 5); ctx.fill(); }
          ctx.globalAlpha = k;
        }
        if (shw.e1 > 0) { var ip0 = hudProj(-10, -9, F0 - 5.2); ctx.globalAlpha = k * shw.e1; icon(0, ip0[0], ip0[1], IR, true); ctx.globalAlpha = k; }
        if (shw.e2 > 0) { var ip1 = hudProj(0, -1.2, F0 - 4.8); ctx.globalAlpha = k * shw.e2; icon(1, ip1[0], ip1[1], IR, true); ctx.globalAlpha = k; }
        if (shw.e3 > 0) {                                                              /* 애니메이션: 궤적(점선) + 지나온 자리에 어니언 스킨 + 공을 따라가는 아이콘 */
          ctx.globalAlpha = k * shw.e3; ctx.setLineDash([2, 4]); ctx.strokeStyle = LF(0.55); ctx.beginPath();
          for (var bq = 0; bq <= 60; bq++) { var bb = ballAt(bq / 60), bp = hudProj(bb[0], bb[1], F0 - bb[2] - BALLR); if (bq) ctx.lineTo(bp[0], bp[1]); else ctx.moveTo(bp[0], bp[1]); }
          ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1.2;
          for (var oq = 1; oq <= 4; oq++) { var ou = shw.bu - oq * 0.04; if (ou <= 0 || shw.bu >= 1) continue; var ob = ballAt(ou), oc = hudProj(ob[0], ob[1], F0 - ob[2] - BALLR), oe = hudProj(ob[0], ob[1], F0 - ob[2]); ctx.strokeStyle = LF(0.8 - oq * 0.17); ctx.beginPath(); ctx.arc(oc[0], oc[1], Math.hypot(oe[0] - oc[0], oe[1] - oc[1]), 0, 6.2832); ctx.stroke(); }
          ctx.lineWidth = 1; var ip2 = hudProj(shw.bx, shw.by, F0 - (shw.bh + 2 * BALLR + 1.6)); icon(2, ip2[0], ip2[1], IR, true); ctx.globalAlpha = k;
        }
        if (sp >= 6.3 && sp < 13.3) {                                                  /* 연출 블록 셋 (글 없이 아이콘): 재생 헤드가 들어가면 라임으로 차오른다 */
          var tl0 = X0 + ins, tl1 = X1 - ins, ph0 = Math.min(1, Math.max(0, (sp - 6.5) / 6.5)), bw2 = (tl1 - tl0) / 3, ap = sstep(6.3, 6.6, sp) * (1 - sstep(13.0, 13.3, sp));
          ctx.globalAlpha = k * ap;
          for (var qj = 0; qj < 3; qj++) { var bx0 = tl0 + qj * bw2 + 2, bx1 = tl0 + (qj + 1) * bw2 - 2, a0 = SEG[2 + qj][0], a1 = SEG[2 + qj][1], hit = (sp - a0) / (a1 - a0), live = hit >= 0 && hit < 1; ctx.fillStyle = live ? 'rgba(214,240,40,0.5)' : hit >= 1 ? 'rgba(' + ink + ',0.12)' : 'rgba(' + ink + ',0.05)'; ctx.fillRect(bx0, BY - 4, bx1 - bx0, 8); if (live) { ctx.fillStyle = LIME; ctx.fillRect(bx0, BY - 4, (bx1 - bx0) * hit, 8); } icon(qj, bx0 + 12, BY - 16, mob ? 6 : 7, live); }
          ctx.fillStyle = 'rgba(' + ink + ',0.9)'; ctx.fillRect(tl0 + (tl1 - tl0) * ph0 - 0.5, BY - 9, 1.5, 18); ctx.globalAlpha = k;
        }
      } else if (s2 === 1) {                                                           /* CG: 작업 단계 탭 · 단계별 정보 · 렌더 땐 버킷 괄호 */
        var TB = ['MODEL', 'ANIMATE', 'RENDER'], tx3 = X0 + ins, up = (cg.ph % 3) / 3;
        for (var tj = 0; tj < 3; tj++) { var on1 = tj === cg.k, w3 = txt(TB[tj], tx3, TY, 'left', on1 ? 0.92 : 0.32); if (on1) { ctx.fillStyle = 'rgba(' + ink + ',0.8)'; ctx.fillRect(tx3, TY + 8, w3 * up, 1); } tx3 += w3 + (mob ? 10 : 16); }
        if (!mob) txt(tc, X1 - ins, TY, 'right');
        if (cg.k === 0) txt('VOXELS ' + Math.round(N * sstep(0.75, 2.6, cg.ph)) + ' / ' + N, X0 + ins, BY, 'left');
        else if (cg.k === 1) { var kw = txt('KEYS', X0 + ins, BY), kx0 = X0 + ins + kw + 12, kl = mob ? 60 : 120; ctx.fillStyle = 'rgba(' + ink + ',0.3)'; ctx.fillRect(kx0, BY, kl, 1); ctx.fillStyle = 'rgba(' + ink + ',0.8)'; [0.03, 0.2, 0.37, 0.53, 0.65, 0.85].forEach(function(f){ ctx.save(); ctx.translate(kx0 + f * kl, BY); ctx.rotate(0.785); ctx.fillRect(-2.5, -2.5, 5, 5); ctx.restore(); }); ctx.fillRect(kx0 + up * kl, BY - 6, 1, 12); }
        else {
          var ur2 = cg.ph - 6, nd = 0;
          for (var ti2 = 0; ti2 < TILE.n; ti2++) { var s0 = TILE.st[ti2]; if (ur2 >= s0 + 0.16) nd++; else if (ur2 >= s0) { var tx4 = TILE.tx[ti2] * 4 - 17, ty4 = TILE.ty[ti2] * 4 - 17, q0 = hudProj(tx4, ty4, 0), q1 = hudProj(tx4 + 4, ty4 + 4, 0), bl = Math.max(3, (q1[0] - q0[0]) * 0.28); ctx.strokeStyle = 'rgba(' + ink + ',0.9)'; ctx.beginPath(); [[q0[0], q0[1], 1, 1], [q1[0], q0[1], -1, 1], [q0[0], q1[1], 1, -1], [q1[0], q1[1], -1, -1]].forEach(function(c){ ctx.moveTo(c[0], c[1] + bl * c[3]); ctx.lineTo(c[0], c[1]); ctx.lineTo(c[0] + bl * c[2], c[1]); }); ctx.stroke(); } }
          ctx.strokeStyle = 'rgba(' + ink + ',0.5)'; txt((mob ? '' : 'BUCKET 32\u00D732 \u00B7 4 THREADS \u00B7 ') + (nd < TILE.n ? Math.round(nd / TILE.n * 100) + '%' : 'DONE'), X0 + ins, BY, 'left', nd < TILE.n ? 0.62 : 0.92);
        }
        txt((mob ? 'F ' : 'FRAME ') + ('000' + Math.floor(ct * 24)).slice(-4), X1 - ins, BY, 'right');
      } else if (s2 === 3) {                                                           /* 오디오비주얼: LIVE · BPM · 박에 맞춰 뛰는 스펙트럼 막대 */
        var lw2 = txt('LIVE', X0 + ins, TY); if (av.ph < 0.5) { ctx.fillStyle = acc; ctx.fillRect(X0 + ins + 8 + lw2, TY - 3, 6, 6); }
        txt('124 BPM \u00B7 ' + (av.bi % 4 + 1) + '/4', X1 - ins, TY, 'right');
        var nb = mob ? 12 : 20; ctx.fillStyle = 'rgba(' + ink + ',0.7)';
        for (var bj = 0; bj < nb; bj++) { var bh = 3 + 12 * Math.min(1, Math.exp(-bj / 4) * av.pump * 1.4 + 0.5 * Math.max(0, Math.sin(bj * 0.7 - t * 4)) * 0.6 + 0.25 * hs(bj + Math.floor(t * 12))); ctx.fillRect(X0 + ins + bj * 5, BY + 6 - bh, 3, bh); }
        txt(mob ? 'AUDIO \u2192 LIGHT' : 'AUDIO \u2192 LIGHT \u00B7 9 CH', X1 - ins, BY, 'right');
      } else {
        var HX = OX + hand.u * U, HY = OY + hand.v * U, live = performance.now() - ptr.t < 2500, wt = txt('TRACKING', X0 + ins, TY);
        ctx.fillStyle = live ? acc : 'rgba(' + ink + ',' + (0.3 + 0.3 * Math.sin(t * 4)) + ')'; ctx.fillRect(X0 + 32 + wt, TY - 3, 6, 6);
        txt(mob ? '60 Hz' : 'SENSOR \u00B7 60 Hz', X1 - ins, TY, 'right');
        ctx.strokeStyle = 'rgba(' + ink + ',0.75)'; ctx.beginPath(); ctx.arc(HX, HY, 20, 0, 6.2832); ctx.moveTo(HX - 30, HY); ctx.lineTo(HX - 12, HY); ctx.moveTo(HX + 12, HY); ctx.lineTo(HX + 30, HY); ctx.moveTo(HX, HY - 30); ctx.lineTo(HX, HY - 12); ctx.moveTo(HX, HY + 12); ctx.lineTo(HX, HY + 30); ctx.stroke();
        var co = 'x ' + (0.5 + hand.u / 40).toFixed(2) + '  y ' + (0.5 + hand.v / 40).toFixed(2) + '  z ' + (0.3 + 0.1 * Math.sin(t * 1.3)).toFixed(2), lx = HX + 50, lw = ctx.measureText(co).width;
        if (lx + lw > X1) { lx = HX - 50; ctx.beginPath(); ctx.moveTo(HX - 15, HY - 15); ctx.lineTo(HX - 34, HY - 34); ctx.lineTo(HX - 46, HY - 34); ctx.stroke(); txt('HAND.R', lx, HY - 40, 'right', 0.92); txt(co, lx, HY - 26, 'right', 0.55); }   /* 오른쪽이 모자라면 왼쪽에 */
        else { ctx.beginPath(); ctx.moveTo(HX + 15, HY - 15); ctx.lineTo(HX + 34, HY - 34); ctx.lineTo(HX + 46, HY - 34); ctx.stroke(); txt('HAND.R', lx, HY - 40, 'left', 0.92); txt(co, lx, HY - 26, 'left', 0.55); }
        var dw = txt('DEPTH', X0 + ins, BY); ctx.strokeStyle = 'rgba(' + ink + ',0.6)'; ctx.beginPath();
        for (var hi = 0; hi < trk.hist.length; hi++) { var sx2 = X0 + ins + 10 + dw + hi * (mob ? 0.6 : 1.3), sy2 = BY - Math.max(-1, Math.min(1, trk.hist[hi])) * 7; if (hi) ctx.lineTo(sx2, sy2); else ctx.moveTo(sx2, sy2); } ctx.stroke();
        txt(mob ? '8 ms' : 'LATENCY 8 ms', X1 - ins, BY, 'right');
      }
      ctx.restore();
    }
    /* 첫 입장 둘레 (사용자 10-26: 디지털 픽셀 모션처럼): 누른 자리에서 칸이 차오르는 동안 헤더(브랜드 → 메뉴 → 버튼) · 오른쪽 번호 줄 · 가운데 제목이
       글자마다 무작위 글자로 깨졌다가 왼쪽부터 제 글자로 맞춰지고(디코딩), 덩어리는 칸 단위로 끊어지며 드러난다(계단 이징 — 부드러운 미끄러짐 대신). 타이밍은 motion */
    var STEP = function(n){ return function(p){ return Math.min(1, Math.floor(p * n + 1e-6) / n); }; };
    function decode(el, delay, dur){                                                 /* 글자 디코딩: 한글은 한글로, 영문·숫자는 영문·숫자로 섞어 폭이 덜 흔들리게. 끝나면 원래 글자 그대로 */
      var tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [], n; while ((n = tw.nextNode())) if (n.nodeValue.trim()) nodes.push([n, n.nodeValue]);
      var LAT = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=', HAN = '가나다라마바사아자차카타파하', pick = function(c){ return /[가-힣]/.test(c) ? HAN[Math.floor(Math.random() * HAN.length)] : /[A-Za-z0-9]/.test(c) ? LAT[Math.floor(Math.random() * LAT.length)] : c; };
      var t0 = performance.now() + delay * 1000, last = 0;
      (function tick(now){
        var u = (now - t0) / (dur * 1000), done = u >= 1;
        if (now - last > 45 || done) { last = now; nodes.forEach(function(pr){ var src = pr[1], out = ''; for (var ci = 0; ci < src.length; ci++) out += u * 1.25 - ci / Math.max(1, src.length) > 0.25 ? src[ci] : pick(src[ci]); pr[0].nodeValue = u < 0 ? src.replace(/\S/g, ' ') : out; }); }
        if (!done) requestAnimationFrame(tick); else nodes.forEach(function(pr){ pr[0].nodeValue = pr[1]; });
      })(performance.now());
    }
    function introMotion(){
      var M = STATIC || reduce ? null : window.motion; if (!M) return;
      var q = function(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }, brand = q('.site-header .brand'), nav = q('.site-nav a'), act = q('.hdr-actions > *'), rail = q('.progress > *');
      brand.concat(nav, act, rail).forEach(function(el){ el.style.opacity = '0'; });
      document.documentElement.classList.add('mo-in');
      var pop = function(els, d){ M.animate(els, { opacity: [0, 1] }, { duration: 0.18, ease: STEP(3), delay: d }); };   /* 깜박이듯 세 계단으로 켜진다 */
      pop(brand, 0.08); decode(brand[0], 0.08, 0.5);
      pop(nav, M.stagger(0.05, { startDelay: 0.16 })); nav.forEach(function(el, k){ decode(el, 0.16 + k * 0.05, 0.38); });
      pop(act, M.stagger(0.07, { startDelay: 0.34 })); act.forEach(function(el, k){ decode(el, 0.34 + k * 0.07, 0.36); });
      var cta = act[act.length - 1]; if (cta) M.animate(cta, { clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'] }, { duration: 0.4, ease: STEP(8), delay: 0.4 }).then(function(){ cta.style.clipPath = ''; });   /* 버튼: 칸 단위로 왼쪽부터 칠해진다 */
      pop(rail, M.stagger(0.04, { startDelay: 0.26 })); rail.forEach(function(el, k){ decode(el, 0.26 + k * 0.04, 0.3); });
      revealWordmark();
    }
    function introFinish(){
      if (introDone) return;
      introDone = true; introAt = sceneT; revealWordmark(); document.documentElement.classList.remove('booting');
      window.removeEventListener('wheel', lockWheel); window.removeEventListener('keydown', lockKeys);   /* 이제부터 스크롤은 브라우저가 알아서 (JS 를 기다리지 않는다) */
      if (pendingHash !== null) { var ph = pendingHash; pendingHash = null; setTimeout(function(){ goTo(ph); }, 450); }   /* #c3 같은 주소로 들어와도 인트로를 본 뒤에 그 챕터로 */
    }
    /* 인트로가 끝나기 전에는 휠·키보드·터치로 넘어갈 수 없다 */
    var lockWheel = function(e){ if (!introDone && e.cancelable) e.preventDefault(); }, lockKeys = function(e){ if (!introDone && [' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'End', 'Home'].indexOf(e.key) >= 0) e.preventDefault(); };
    window.addEventListener('wheel', lockWheel, { passive: false });
    window.addEventListener('keydown', lockKeys);
    /* 시작: 로딩 로고가 다 차면 (index.html 의 __boot) 그때부터 입장 시계가 돈다 — 3D 씬은 이미 위에서 만들어 두었다 (셰이더 준비가 로딩 안에 들어간다) */
    function begin(){
      start = performance.now();
      setFormation(0, true);
      if (S3D && scLand) INTRO_T = scLand;                                    /* 3D: 모래가 대부분 내려앉을 때 제목·헤더가 올라온다 */   /* 1.3초: 제목·헤더가 올라오기 시작 (바깥 로고 픽셀이 닿는 1.6초와 겹쳐 1.9초에 모두 끝난다) */
      var B = window.__boot, fz = frameFor(0), u = fz.s * Math.min(W, H) * 1.45 / 72;
      if (B) B.to = { x: fz.cx - 1.0 * u, y: fz.cy + 0.52 * u, w: 33.1 * u };   /* 로딩 테두리(원본 AI 심볼)가 옮겨 갈 자리 = 첫 화면 로고 — 화면에서 픽셀 로고와 가장 많이 겹치는 위치·크기를 실측해 맞춤 */
      /* 첫 입장 (사용자 10-26): 로딩 화면이 원본 로고 테두리를 그려 놓고 기다리는 동안 픽셀은 숨겨 두고, 누르면 누른 자리에서 퍼지는 원을 따라
         칸이 톡톡 나타난 뒤(index.html 이 같은 빠르기로 테두리를 지운다) 가운데부터 입체로 솟는다. 테두리 입장이 아니면 바로 솟는다 (사용자 10-12) */
      var CASC = 0.016, edge = !!(B && B.edge && S3D && !B.shown);
      if (edge) { S3D.hide(); B.casc = u / CASC; }
      var shown = function(){
        var now = (performance.now() - start) / 1000, mx = 0;
        introMotion();
        if (edge) {
          var cx = B.click ? (B.click.x - fz.cx) / u : 0, cy = B.click ? (B.click.y - fz.cy) / u : 0, dl = new Float32Array(N), md = 1;
          for (var k = 0; k < N; k++) { dl[k] = Math.sqrt((boxes[k].gx - cx) * (boxes[k].gx - cx) + (boxes[k].gy - cy) * (boxes[k].gy - cy)); if (dl[k] > md) md = dl[k]; }
          CASC = 0.46 / md; B.casc = u / CASC;                                          /* 누른 자리에서 가장 먼 칸까지 0.5초 (사용자 10-26: 촤라락을 조금 더 길게) — 테두리를 지우는 원도 같은 빠르기 */
          for (k = 0; k < N && !reduce; k++) { dl[k] = dl[k] * CASC + Math.random() * 0.04; if (dl[k] > mx) mx = dl[k]; }
          S3D.cascade(now, dl);
        }
        extT = reduce ? -1e9 : now + (edge ? mx + 0.3 : 0.05);
        if (edge && !reduce) setTimeout(introFinish, (mx + 0.15) * 1000); else introFinish();
      };
      if (introReduce) { if (B && B.reveal) B.reveal(shown); else shown(); } else setTimeout(introFinish, 3000 * IK);   /* 탭이 가려져 프레임이 멈춰도 3초 뒤엔 풀린다 */
      requestAnimationFrame(render);
    }
    if (window.__boot) window.__boot.done(begin); else begin();

    function evOK(e){ var el = e.target && e.target.nodeType === 1 ? e.target : null; return !(el && el.closest && el.closest('a, button, input, textarea, select, .cards')); }
    document.addEventListener('mousedown', function(e){ if (e.button !== 0 || !evOK(e)) return; if (dragStart(e.clientX, e.clientY)) { e.preventDefault(); document.body.style.cursor = 'grabbing'; } });
    document.addEventListener('mousemove', function(e){ if (play.drag) { dragMove(e.clientX, e.clientY); return; } if (codeOn() && introDone && !TOUCH) document.body.style.cursor = codeAt(e.clientX, e.clientY) ? 'grab' : ''; });
    document.addEventListener('mouseup', function(){ if (play.drag) { dragEnd(); document.body.style.cursor = 'grab'; } });
    var playTouchMove = function(e){ if (!play.drag) return; var tt = e.touches[0]; dragMove(tt.clientX, tt.clientY); if (e.cancelable) e.preventDefault(); };
    var playTouchEnd = function(){ if (play.drag) dragEnd(); document.removeEventListener('touchmove', playTouchMove); document.removeEventListener('touchend', playTouchEnd); document.removeEventListener('touchcancel', playTouchEnd); };
    document.addEventListener('touchstart', function(e){ if (!evOK(e)) return; var tt = e.touches[0]; if (dragStart(tt.clientX, tt.clientY)) { document.addEventListener('touchmove', playTouchMove, { passive: false }); document.addEventListener('touchend', playTouchEnd, { passive: true }); document.addEventListener('touchcancel', playTouchEnd, { passive: true }); } }, { passive: true });   /* 끌 때만 non-passive 리스너 */

    /* ── 모션 (anime.js 4.5): 제목은 줄마다 마스크 안에서 밀려 올라오고, 목록의 선은 왼쪽에서 그어지고, 나머지 글은 조용히 자리를 잡는다.
       아래로 갈 땐 아래에서, 되돌아갈 땐 위에서 들어온다. 떠나는 챕터는 0.24초 만에 사라진다.
       anime.js 를 못 불러오면(차단·오프라인) 예전 CSS 전환이 그대로 쓰인다 ── */
    var AM = function(){ var A = STATIC ? null : window.anime; if (A) { document.documentElement.classList.add('am'); A.engine.speed = 1 / PACE; } return A; };   /* .am: CSS 전환을 끄고 anime.js 가 맡는다 */
    function all(root, sel){ return Array.prototype.slice.call(root.querySelectorAll(sel)); }
    function ordOf(el){ var r = el.closest('.reveal') || el; return parseFloat(r.style.getPropertyValue('--i')) || 0; }
    function motionExit(i){
      var A = AM(), sec = chapters[i]; if (!A || !sec) return;
      var r = all(sec, '.reveal'); if (!r.length) return;
      A.utils.remove(r); A.animate(r, { opacity: 0, duration: 160, ease: 'out(2)' });
      all(sec, '.kicker').forEach(function(el){ if (el.dataset.t) el.textContent = el.dataset.t; });   /* 뒤섞이던 도중에 떠나도 글자는 원래대로 */
    }
    function motionEnter(i, dir){
      var A = AM(), sec = chapters[i]; if (!A || !sec || i === 0) return;
      var R = all(sec, '.reveal'), lines = all(sec, '.reveal .ln > span'), rules = all(sec, '.set, .set li, .tools .col'), media = all(sec, '.card .media'), thumbs = all(sec, '.card .media canvas, .card .media img, .card .media video');
      var holders = R.filter(function(el){ return el.querySelector('.ln') || el.matches('.set, .tools, .set li, .card'); });
      var fades = R.filter(function(el){ return holders.indexOf(el) < 0; });
      holders.forEach(function(el){
        var kids = el.matches('.set') ? all(el, 'li > *') : el.matches('.tools') ? all(el, '.col > *') : el.matches('.set li') ? Array.prototype.slice.call(el.children) : el.matches('.card') ? all(el, ':scope > :not(.media)') : all(el, '.btn');
        fades = fades.concat(kids.filter(function(k){ return !k.querySelector('.ln'); }));   /* 줄로 쪼갠 제목은 줄 애니메이션이 맡는다 */
      });
      A.utils.remove(R.concat(lines, rules, media, thumbs, fades));
      if (reduce) {                                                                     /* 동작 줄이기: 움직임 없이 짧은 페이드만 */
        A.utils.set(lines.concat(fades), { y: 0 }); A.utils.set(rules, { '--rule': 1 }); A.utils.set(media, { clipPath: 'inset(0% 0% 0% 0%)' });
        A.utils.set(R, { opacity: 0 }); A.animate(R, { opacity: 1, duration: 280, delay: A.stagger(40) }); return;
      }
      var at = function(el, extra){ return ordOf(el) * 55 + (extra || 0); };   /* 스크롤에 붙어 오도록 (전 40+80·순서) */
      A.utils.set(holders, { opacity: 1, y: 0 });
      /* 제목 줄: 마스크 안에서 0.8초, 줄마다 0.07초 간격 */
      lines.forEach(function(el){
        var k = Array.prototype.indexOf.call(el.parentNode.parentNode.children, el.parentNode);
        A.utils.set(el, { y: dir > 0 ? '108%' : '-108%' });
        A.animate(el, { y: '0%', duration: 800, ease: 'out(4)', delay: at(el, 70 * k) });
      });
      /* 선: 왼쪽에서 오른쪽으로 그어진다 */
      rules.forEach(function(el){
        var k = (el.matches('.tools .col') || (el.matches('.set li') && !el.classList.contains('reveal'))) ? Array.prototype.indexOf.call(el.parentNode.children, el) + 1 : 0;
        A.utils.set(el, { '--rule': 0 });
        A.animate(el, { '--rule': 1, duration: 650, ease: 'out(3)', delay: at(el, 55 * k) });
      });
      /* 작품 이미지: 가려진 판이 걷히듯 열리고, 안쪽은 살짝 당겨졌다 풀린다 */
      media.forEach(function(el){
        A.utils.set(el, { clipPath: dir > 0 ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' });
        A.animate(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 800, ease: 'out(4)', delay: at(el) });
      });
      thumbs.forEach(function(el){ A.utils.set(el, { scale: 1.14 }); A.animate(el, { scale: 1, duration: 1100, ease: 'out(3)', delay: at(el) }); });
      /* 나머지 글: 제목보다 조금 늦게, 짧은 거리만 */
      fades.forEach(function(el){
        var li = el.closest('.set li'), k = li && !li.classList.contains('reveal') ? Array.prototype.indexOf.call(li.parentNode.children, li) : 0;
        A.utils.set(el, { opacity: 0, y: 10 * dir });
        A.animate(el, { opacity: 1, y: 0, duration: 600, ease: 'out(3)', delay: at(el, 80 + 45 * k) });
      });
      /* 라벨: 고정폭 글자가 잠깐 뒤섞였다가 제자리 (코드를 재료로 쓰는 전공이라는 표시) */
      all(sec, '.kicker').forEach(function(el){ el.dataset.t = el.dataset.t || el.textContent; A.animate(el, { innerHTML: A.scrambleText({ text: el.dataset.t, chars: 'uppercase' }), delay: at(el) }); });
    }
    var wmShown = false;
    function revealWordmark(){
      if (wmShown) return; wmShown = true;
      var A = AM(), M = STATIC || reduce ? null : window.motion; chapters[0].classList.add('is-ready');
      if (M) {                                                                        /* 제목: 줄마다 칸 단위로 왼쪽부터 드러나며(계단) 글자가 깨졌다 맞춰진다 */
        var ml = all(chapters[0], '.wordmark .ln > span');
        ml.forEach(function(el, k){ decode(el, 0.12 + k * 0.12, k ? 0.62 : 0.45); });
        M.animate(ml, { clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'] }, { duration: 0.5, ease: STEP(12), delay: M.stagger(0.12, { startDelay: 0.1 }) })
          .then(function(){ ml.forEach(function(el){ el.style.clipPath = ''; }); chapters[0].classList.add('wm-done'); });
        return;
      }
      if (!A || introReduce) return;
      var wl = all(chapters[0], '.wordmark .ln > span');
      A.utils.set(wl, { y: '140%' });                                               /* 가림 영역(.ln 아래 여백)보다 확실히 아래에서 출발 — Safari 에서 글자 윗부분이 제목 밑에 줄처럼 보였다 */
      A.animate(wl, { y: '0%', duration: Math.round(500 * IK / PACE), ease: 'out(4)', delay: A.stagger(Math.round(50 * IK / PACE)),
        onComplete: function(){ wl.forEach(function(el){ el.style.transform = ''; }); chapters[0].classList.add('wm-done'); } });   /* 다 올라오면 가림막을 풀어 그 자리를 다시 그린다 (남은 조각 지우기) */   /* 실제 0.5초·0.05초 간격 (엔진 속도가 1/PACE) — 인트로 1.9초 안에 */
    }
    /* 헤더 메뉴 밑줄: 현재 챕터 메뉴 밑으로 스프링처럼 옮겨 간다 (00 에서는 숨김) */
    var navInd = document.querySelector('.nav-ind');
    function moveInd(i, instant){
      if (!navInd || !navInd.parentNode.offsetParent) return;
      var a = Array.prototype.filter.call(document.querySelectorAll('.site-nav a[data-ch]'), linkOn)[0], A = AM(), hidden = parseFloat(getComputedStyle(navInd).opacity) < 0.05;
      if (!A) { navInd.style.opacity = a ? 1 : 0; if (a) { navInd.style.transform = 'translateX(' + a.offsetLeft + 'px)'; navInd.style.width = a.offsetWidth + 'px'; } return; }
      A.utils.remove(navInd);
      if (a && (instant || reduce || hidden)) A.utils.set(navInd, { x: a.offsetLeft, width: a.offsetWidth });   /* 숨어 있다가 나타날 땐 제자리에서 */
      if (instant || reduce) { A.utils.set(navInd, { opacity: a ? 1 : 0 }); return; }
      A.animate(navInd, a ? { x: a.offsetLeft, width: a.offsetWidth, opacity: { to: 1, duration: 260, ease: 'out(2)' }, ease: A.spring({ bounce: 0.18, duration: 560 }) } : { opacity: 0, duration: 200, ease: 'out(2)' });
    }

    /* ── 챕터 활성화: 뷰포트 중심선이 들어 있는 챕터 ── */
    var body = document.body, links = document.querySelectorAll('[data-ch]'), seenEnd = false;
    /* 메뉴 강조: 01 은 '전공소개'(첫 화면)와 '교육과정'(① 단계부터)을 나눠 켠다 — 번호 줄(00–04)은 챕터만 본다 */
    function linkOn(a){
      var ch = parseInt(a.getAttribute('data-ch'), 10);
      if (ch !== active) return false;
      return ch !== 1 || !a.parentNode.querySelector('[data-sub]') || a.hasAttribute('data-sub') === (c1step >= 1);
    }
    function syncLinks(){
      links.forEach(function(a){ var on = linkOn(a); a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); if (on && a.parentNode && a.parentNode.classList.contains('subnav')) { var pn = a.parentNode; pn.scrollTo({ left: a.offsetLeft - pn.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' }); } });
    }
    var rail = document.querySelector('.progress'), railSub = document.querySelectorAll('.rail-sub a');
    function railOn(){                                                               /* 01 세부 인덱스: 01 에 있을 때만 펼치고, 보고 있는 단계를 켠다 */
      if (!rail) return;
      rail.classList.toggle('sub-open', active === 1);
      railSub.forEach(function(a){ a.classList.toggle('on', active === 1 && +a.getAttribute('data-k') === c1step); });
    }
    function activate(i){
      if (i === active && chapters[i].classList.contains('is-active')) return;
      if (active === 1 && i !== 1) resetPlay();                                     /* 놀이터(01 의 코드 단계)를 떠나면 조각이 제자리로 */
      var prev = active;
      active = i; if (i === 2 && prev !== 2) c2T0 = sceneT;
      if (i === chapters.length - 1) seenEnd = true; else if (i > prev || i === 0) seenEnd = false;   /* 끝까지 봤는지 */
      chapters.forEach(function(s, k){ s.classList.toggle('is-active', k === i); if (PAGED) s.inert = k !== i; });
      syncLinks(); railOn();
      body.classList.toggle('cs-inverse', chapters[i].getAttribute('data-mode') === 'ink');
      setFormation(i, false);
      if (prev !== i) motionExit(prev);
      motionEnter(i, i >= prev ? 1 : -1);
      moveInd(i);
    }
    body.classList.add('cs-inverse'); document.documentElement.classList.remove('cs-inverse');
    chapters[0].classList.add('is-active');
    var TOUCH = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
    var PAGED = TOUCH && !ONLY;
    var ticking = false;
    function pick(){
      ticking = false;
      if (ONLY || PAGED) return;
      var mid = window.scrollY + VH() * 0.5, idx = 0;
      for (var k = 0; k < chapters.length; k++) { if (mid >= chapters[k].offsetTop) idx = k; }
      activate(idx);
    }
    window.addEventListener('scroll', function(){ if (!ticking) { ticking = true; requestAnimationFrame(pick); } }, { passive: true });

    /* ── 스크롤 단계: 01(소개 · 세 분야 · 창작 스튜디오) · 02(네 진로) — 한 화면 스크롤마다 글 패널 하나.
       01 은 로고 연출(CHAPTERS[1])도 그 단계 것으로 바꾼다. 새 패널의 글은 한 줄씩 짧게 들어온다 (anime.js) ── */
    /* 01 ② → ③ 를 폭발 도중에 넘어가면: 코드 조각이 붙은 칸을 지금 파편 자리에 두고 거기서 코드 배치로 날아가게 한다 (잿더미가 코드로 사라락).
       ponytail: 셰이더 BOOM 의 boomOff 를 칸 하나(대표 무작위값)로 옮긴 근사 — 셰이더 식을 바꾸면 여기도 같이 */
    var BFLOOR = -Math.max.apply(null, boxes.map(function(b){ return b.gy; })) - 1.5, BSPREAD = (mqMob.matches || window.matchMedia('(pointer: coarse)').matches) ? 0.7 : 1;
    function fr(x){ return x - Math.floor(x); }
    function bdrJ(x, k){ return x > 0 ? (1 - Math.exp(-k * x)) / k : 0; }
    function bClock(a){ var z = BOOMS.v[2], w = BOOMS.v[3]; if (a < z) return a; var u = Math.min(1, Math.max(0, (a - z) / w)); return z * (1 - u * u * (3 - 2 * u)); }
    function boomCellOff(px, py, s, ae){
      var B = BOOMB, tg = 1e9, R = 6, tmax = 0, dn = 1e9, cx = 0, cy = 0, nx = 0, ny = 0, i, d;
      for (i = 0; i < 10; i++) { d = Math.hypot(px - B[i * 4], py - B[i * 4 + 1]); tmax = Math.max(tmax, B[i * 4 + 2]); if (d < B[i * 4 + 3]) { var ti = B[i * 4 + 2] + d / 24; if (ti < tg) { tg = ti; cx = B[i * 4]; cy = B[i * 4 + 1]; R = B[i * 4 + 3]; } } if (d - B[i * 4 + 3] < dn) { dn = d - B[i * 4 + 3]; nx = B[i * 4]; ny = B[i * 4 + 1]; } }
      var rr = fr(s * 41.3), cr = tg > 1e8; if (cr) { tg = tmax + 0.3 + rr * 0.6; cx = nx; cy = ny; }
      tg += rr * 0.12;
      var tau = Math.max(ae - tg, 0), dx = px - cx, dy = py - cy, r = Math.hypot(dx, dy), k = cr ? 0.12 : Math.min(1, Math.max(0, 1 - r / R)), ox = 0, oy = 0, oz = 0;
      for (i = 0; i < 10; i++) { var bz = B[i * 4 + 2], bw = B[i * 4 + 3]; if (bz > ae) continue; var vx = px - B[i * 4], vy = py - B[i * 4 + 1], dd = Math.hypot(vx, vy), x = ae - bz - dd / 38; if (x <= 0 || dd < bw * 0.5 || bz + dd / 38 < tg) continue; var f = Math.exp(-dd * dd / (2.4 * bw * bw)) * bw / 6 * bdrJ(x, 2.5); ox += vx / dd * 5 * f; oy += vy / dd * 5 * f; oz += 1.6 * f; }
      if (tau > 0) {
        var ux = (r > 1e-3 ? dx / r : 1) + (fr(s * 13.3) - 0.5), uy = (r > 1e-3 ? dy / r : 0) + (fr(s * 29.1) - 0.5), ul = Math.hypot(ux, uy) || 1, E = cr ? 0.5 : R / 6, rv = fr(s * 57.3), zf = 2 + 7 * fr(s * 7.7), dr = bdrJ(tau, 2), v = (1.5 + 10 * rv * rv) * (0.6 + 0.4 * k) * E;
        ox += ux / ul * v * dr; oy += uy / ul * v * dr - 3.5 * tau * tau; oz += zf * (0.5 + 0.5 * k) * dr;
      }
      ox *= BSPREAD; oy *= BSPREAD; oz *= BSPREAD;
      var pen = BFLOOR + fr(s * 61.7) * 0.6 - (py + oy); if (tau > 0 && pen > 0) oy += pen + pen * 0.35 * Math.exp(-pen * 0.6);
      return [ox, oy, oz];
    }
    function boomToCode(){
      var a = sceneT - boom.t0, ae = bClock(a);
      if (!boom.amp || a >= BOOMS.v[2] + BOOMS.v[3] || ae <= 0) return;                 /* 로고가 멀쩡할 땐 보통 전환 */
      for (var i = 0; i < N; i++) { var b = boxes[i]; if (b.kind !== 'code') continue; var o = boomCellOff(b.cur.x, -b.cur.y, fr(Math.sin(i * 12.9898) * 43758.5453), ae); b.cur = { x: b.cur.x + o[0], y: b.cur.y - o[1], z: b.cur.z - o[2] }; }
      BOOMS.v[2] = 1e9; boom.code = sceneT || 1e-3; ashToCode = true;                 /* 되감지 않고 그대로 */
    }
    var C1 = CHAPTERS[1], c1El = chapters[1], c1step = -1;
    /* 01 은 ② 만 입체 (사용자 10-12): 나머지는 정면 2D 로고(C1) — ② 에서 처음으로 두께·그림자가 생기고 폭발한다 */
    var C1_STEPS = [C1,
      C1,                                                                            /* ① 2D 미디어 파사드 (mediaFx) */
      Object.assign({}, C1, { flat: 0, yaw: -0.12, pitch: -0.26, sway: 0.3 }),       /* ② 위에서 비스듬히 + 턴테이블처럼 좌우로 — 두께와 그림자 */
      Object.assign({}, C1, { form: 'code', morph: 1 }),                             /* ③ 로고가 코드로 쓰인 로고로 — 줄을 끌어서 던질 수 있다 */
      C1];                                                                           /* ④ 창작 스튜디오 — 다시 하나의 로고로 */
    /* 02 진로 (사용자 10-12: 방·화면·핀은 설명과 안 맞고 허접 → 로고가 직업마다 다른 일을 하고, 그 위에 그 일의 작업 화면 표시(HUD)를 얹는다. 오디오비주얼은 원래 필드) */
    var C2 = CHAPTERS[2], c2step = 0, L2 = { form: 'logo', yaw: -0.16, pitch: -0.1, sway: 0.05, spin: 0, morph: 0, flow: 0, live: 0, sMax: 1.0, sMin: 0.2, fit: 0.74, wall: -5.5 };
    var C2_STEPS = [
      Object.assign({}, L2, { wall: -2.4 }),                                         /* 기획·연출: 평면도 → 모형 → 큐 (그림자 받는 면을 가까이 — 멀면 도면 위로 그림자가 길게 번져 지저분했다) */
      Object.assign({}, L2, { yaw: 0, sway: 0 }),                                    /* 그래픽·영상: 모델링 → 애니메이션 → 렌더 (턴테이블·작업 단계 탭·버킷) */
      Object.assign({}, L2, { yaw: -0.08, sway: 0.03 }),                             /* 인터랙션·테크: 손(커서)을 추적해 픽셀이 반응 — 조준점·좌표·센서 그래프 */
      C2];                                                                           /* 미디어 아티스트(오디오비주얼): 원래 데이터 필드 */
    function stepper(i, looks, onStep){
      var el = chapters[i], ps = el.querySelectorAll('.panel'), ds = el.querySelectorAll('.dots li'), n = ps.length, cur = -1;
      function set(k){
        if (k === cur) return;
        var A = cur >= 0 && !reduce && !paging ? AM() : null, dir = k > cur ? 1 : -1; cur = k; el.setAttribute('data-step', k);
        Array.prototype.forEach.call(ps, function(p, j){ p.classList.toggle('on', j === k); p.inert = j !== k; });
        Array.prototype.forEach.call(ds, function(d, j){ d.classList.toggle('on', j === k); });
        if (A && active === i) { var kids = Array.prototype.slice.call(ps[k].children); A.utils.remove(kids); A.utils.set(kids, { opacity: 0, y: 14 * dir }); A.animate(kids, { opacity: 1, y: 0, duration: 520, ease: 'out(3)', delay: A.stagger(45, { start: 60 }) }); }
        if (onStep) onStep(k);
        if (looks) { CHAPTERS[i] = looks[k]; if (active === i && introDone) setFormation(i, false); }
      }
      function pickS(){
        var p = PAGED ? el.scrollTop / Math.max(1, el.clientHeight) : (window.scrollY - el.offsetTop) / VH();
        set(Math.max(0, Math.min(n - 1, Math.round(p))));
      }
      set(0);
      window.addEventListener('scroll', pickS, { passive: true });
      el.addEventListener('scroll', pickS, { passive: true });                       /* 터치: 단계 챕터는 안에서 스크롤 */
      el.querySelectorAll('[data-go]').forEach(function(btn){ btn.addEventListener('click', function(){
        var k = +btn.getAttribute('data-go'), how = reduce ? 'auto' : 'smooth';
        if (PAGED) el.scrollTo({ top: k * el.clientHeight, behavior: how }); else window.scrollTo({ top: el.offsetTop + k * VH(), behavior: how });
      }); });
    }
    stepper(1, C1_STEPS, function(k){ var was = c1step >= 1, pv = c1step; if (c1step === 2 && k === 3 && active === 1 && introDone) boomToCode(); c1step = k; railOn(); if (k === 1) mfT0 = sceneT; else if (pv === 1) mfX = sceneT; if (k !== 3) resetPlay(); if (active === 1 && was !== (k >= 1)) { syncLinks(); moveInd(1); } });
    stepper(2, C2_STEPS, function(k){ c2step = k; c2T0 = sceneT; });
    /* ── 터치 기기: 스와이프를 감지하는 순간 다음/이전 챕터로 부드럽게 이동 (한 번에 한 챕터) ── */
    var paging = false, mainEl = document.querySelector('main');
    function goTo(i){
      i = Math.max(0, Math.min(chapters.length - 1, i));
      if (!introDone || paging || i === active) return;
      paging = true;
      if (PAGED) {
        chapters[active].scrollTop = 0;
        if (i < active && !seenEnd && chapters[i].classList.contains('steps')) chapters[i].scrollTop = chapters[i].scrollHeight;   /* 거꾸로 들어가면 본 마지막 단계부터 */
        mainEl.style.transform = 'translateY(' + (-i * 100) + '%)';
        activate(i);
        setTimeout(function(){ paging = false; }, reduce ? 20 : 640);
        return;
      }
      glide(chapters[i].offsetTop, Math.min(950, 520 + 90 * Math.abs(i - active)));
    }
    /* 메뉴·번호 줄: 그 챕터의 처음으로 ('교육과정'[data-sub] 은 01 의 ① 단계로) — 이미 그 챕터 안이어도 처음(또는 그 단계)으로 */
    function goStep(i, k){
      if (!introDone) return;
      var sec = chapters[i];
      if (PAGED) {
        var go = function(){ sec.scrollTo({ top: k * sec.clientHeight, behavior: reduce ? 'auto' : 'smooth' }); };
        if (i !== active) { goTo(i); if (k) setTimeout(go, reduce ? 30 : 660); } else go();
        return;
      }
      if (!paging) glide(sec.offsetTop + k * VH(), Math.min(950, 520 + 90 * Math.abs(i - active)));
    }
    document.querySelectorAll('a[href^="#c"]').forEach(function(a){ a.addEventListener('click', function(e){
      var n = parseInt(a.getAttribute('href').slice(2), 10);
      if (!isNaN(n) && chapters[n]) { e.preventDefault(); goStep(n, a.hasAttribute('data-k') ? +a.getAttribute('data-k') : a.hasAttribute('data-sub') ? 1 : 0); }
    }); });
    function glide(to, ms){                                                            /* 데스크톱: 창 스크롤을 부드럽게 to 까지 */
      var from = window.scrollY, t0 = performance.now(), dur = reduce ? 1 : 620, AN = AM();
      var R = document.documentElement.style, end = function(){ window.scrollTo(0, to); R.scrollSnapType = ''; paging = false; pick(); };
      paging = true; R.scrollSnapType = 'none';                                     /* 가는 동안 브라우저 스냅이 끌어당기지 않게 */
      if (AN && !reduce) { var sp = { y: from }; AN.animate(sp, { y: to, duration: ms, ease: 'out(4)', onUpdate: function(){ window.scrollTo(0, sp.y); }, onComplete: end }); return; }   /* out: 굴리자마자 움직이고 천천히 멈춘다 */
      (function step(now){
        var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
        window.scrollTo(0, from + (to - from) * e);
        if (p < 1) requestAnimationFrame(step); else end();
      })(t0);
    }
    if (PAGED) {
      document.documentElement.classList.add('touch-paging');
      window.scrollTo(0, 0);
      window.addEventListener('resize', function(){ mainEl.style.transform = 'translateY(' + (-active * 100) + '%)'; });
      var ty = null, tx = null, tSkip = false, tFired = false, tAxis = '';
      document.addEventListener('touchstart', function(e){
        var t = e.touches[0]; ty = t.clientY; tx = t.clientX; tFired = false; tAxis = '';
        var el = e.target && e.target.nodeType === 1 ? e.target : (e.target ? e.target.parentElement : null);
        tSkip = !!(el && el.closest && el.closest('input, textarea, select'));   /* 카드 줄(.cards)도 세로로 밀면 넘어간다 (사용자 10-12: 폰 03 에서 안 내려갔다 — 화면 대부분이 카드였다) */
      }, { passive: true });
      document.addEventListener('touchmove', function(e){
        if (ty === null || tSkip || play.drag) return;
        if (!introDone) { if (e.cancelable) e.preventDefault(); return; }
        var t = e.touches[0], dy = t.clientY - ty, dx = t.clientX - tx;
        if (!tAxis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) tAxis = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y';
        if (tAxis === 'x') return;                                                 /* 가로 제스처(카드 넘기기)는 끝까지 그대로 둔다 */
        var sec = chapters[active], steps = sec.classList.contains('steps');
        if (steps && e.cancelable) e.preventDefault();                              /* 단계 챕터는 브라우저 스크롤 없이 (첫 움직임부터 막아야 스크롤이 시작되지 않는다) */
        if (!tAxis) return;
        if (dy < 0 && active !== chapters.length - 1) seenEnd = false;
        if (steps) {                                                                /* 단계 챕터: 스와이프 한 번에 한 단계 (사용자 10-12: 폰에서 안 내려간다 — 브라우저 스크롤+스냅은 짧게 밀면 제자리로 튕겼다) */
          if (tFired || Math.abs(dy) <= 24) return;
          tFired = true;
          var sh = sec.clientHeight, sk = Math.round(sec.scrollTop / sh), sn = sec.querySelectorAll('.panel').length;
          var to = dy < 0 ? sk + 1 : seenEnd ? (sk > 0 ? 0 : -1) : sk - 1;          /* 끝(04)까지 본 뒤 거꾸로는 그 챕터 처음으로 */
          if (to < 0 || to >= sn) goTo(active + (dy < 0 ? 1 : -1)); else sec.scrollTo({ top: to * sh, behavior: reduce ? 'auto' : 'smooth' });
          return;
        }
        if (!tFired && sec.scrollHeight > sec.clientHeight + 2) {                  /* 화면보다 긴 챕터: 안에서 먼저 스크롤, 끝에 닿으면 페이징 */
          var atTop = sec.scrollTop <= 0, atBottom = sec.scrollTop + sec.clientHeight >= sec.scrollHeight - 2;
          if ((dy < 0 && !atBottom) || (dy > 0 && !atTop)) return;
        }
        if (e.cancelable) e.preventDefault();
        if (!tFired && Math.abs(dy) > 24) { tFired = true; goTo(active + (dy < 0 ? 1 : -1)); }
      }, { passive: false });
      var tEnd = function(){ ty = null; tx = null; tFired = false; tSkip = false; tAxis = ''; };
      document.addEventListener('touchend', tEnd, { passive: true });
      document.addEventListener('touchcancel', tEnd, { passive: true });
      if (STATIC) window.__paging = { goTo: goTo };
    }
    /* ── 데스크톱 휠: 한 번 굴리면 한 화면 (사용자 10-26: 불친절 — 브라우저 스냅은 화면 반 넘게 굴리지 않으면 제자리로 튕겼다. 마우스 한 칸·트랙패드 살짝도 넘어가게).
       한 번 굴림(트랙패드 관성 포함)에 한 번만 — 0.2초 쉬었거나 방향을 바꿨거나, 관성 중에 다시 세게 밀면 다음 것.
       끝(04)까지 본 뒤 거꾸로는 단계를 되짚지 않고 챕터 단위로 (사용자 10-12): 챕터 중간이면 그 챕터 처음, 처음이면 앞 챕터 처음 ── */
    if (!PAGED && !ONLY) {
      var wq = { last: 0, fired: 0, dir: 0, acc: 0, prev: 0, armed: true };
      var stops = function(){                                                      /* 멈출 자리: 챕터마다 한 화면씩 (01·02 는 단계 수만큼) */
        var T = [], vh = VH();
        chapters.forEach(function(c){ var t = c.offsetTop, e = t + c.offsetHeight - vh; for (var y = t; y < e + vh - 4; y += vh) T.push(Math.min(y, e)); });
        return T;
      };
      window.addEventListener('wheel', function(e){
        if (!introDone || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        e.preventDefault();
        var now = performance.now(), d = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? VH() : 1), ad = Math.abs(d), dir = d > 0 ? 1 : -1;
        if (now - wq.last > 200 || dir !== wq.dir) { wq.acc = 0; wq.armed = true; wq.dir = dir; }
        else if (!wq.armed && ((now - wq.fired > 900 && ad >= 40) || (now - wq.fired > 450 && ad > 14 && ad > wq.prev * 1.6))) wq.armed = true;   /* 관성은 줄어들기만 한다 — 다시 커지면 손가락으로 또 민 것 */
        wq.last = now; wq.prev = ad; wq.acc += ad;
        if (!wq.armed || (wq.acc < 12 && Math.abs(e.wheelDeltaY || 0) < 120)) return;   /* 트랙패드 살짝 스친 건 무시, 마우스 한 칸(120)은 바로 */
        wq.armed = false;
        if (page(dir)) wq.fired = now;
      }, { passive: false });
      window.addEventListener('keydown', function(e){                               /* 화살표·PageUp/Down·스페이스도 휠과 똑같이 한 화면씩 */
        var k = e.key, dir = k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey) ? 1 : k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey) ? -1 : 0;
        if (!dir || !introDone || e.altKey || e.metaKey || e.ctrlKey || (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) || (k === ' ' && e.target.closest && e.target.closest('button, a'))) return;
        e.preventDefault(); page(dir);
      });
    }
    function page(dir){
      if (paging) return false;
      if (dir > 0 && active !== chapters.length - 1) seenEnd = false;
      var y = window.scrollY, to = null, T = stops(), k;
      if (dir > 0) { for (k = 0; k < T.length; k++) if (T[k] > y + 4) { to = T[k]; break; } }
      else if (seenEnd) { var top = chapters[active].offsetTop; to = y > top + 4 ? top : chapters[Math.max(0, active - 1)].offsetTop; }
      else { for (k = T.length - 1; k >= 0; k--) if (T[k] < y - 4) { to = T[k]; break; } }
      if (to === null || Math.abs(to - y) < 2) return false;
      glide(to, 700); return true;
    }
    window.addEventListener('resize', function(){ resize(); setFormation(active, false, true); pick(); moveInd(active, true); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ resize(); if (active !== 0) setFormation(active, false, true); });
    pick();
    if (/[?&]debug=1/.test(location.search)) window.__play = { play: play, boxes: boxes, codeAt: codeAt, isDone: function(){ return introDone; }, frameFor: frameFor, g: g, CH: CHAPTERS, bb: projectBBox, WH: function(){ return [W, H, HDR()]; } };   /* 검수용 */
    if (STATIC) { window.__scene = { g: g, boxes: boxes, frameFor: frameFor, state: function(){ return { active: active, W: W, H: H, SHELL: SHELL, g: g }; } }; setTimeout(function(){ resize(); if (ONLY) { activate(parseInt(ONLY, 10)); } else { pick(); } setFormation(active, false, true); render(performance.now()); }, 400); }
  }

  /* ── 작품 카드 미디어: 잉크 위 뉴트럴 픽셀 필드 (이미지 자리표시) ── */
  function drawThumb(cv){
    if (!cv || cv.__drawn) return;
    cv.__drawn = true;
    var seed = parseInt(cv.getAttribute('data-seed'), 10) || 1;
    var rnd = function(){ seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var Wc = 320, Hc = 180; cv.width = Wc * 2; cv.height = Hc * 2;
    var g2 = cv.getContext('2d'); if (!g2) return;
    g2.scale(2, 2);
    g2.fillStyle = '#000'; g2.fillRect(0, 0, Wc, Hc);
    var cols = 20, rows = 11, cw = Wc / cols, chh = Hc / rows;
    var ccx = 6 + rnd() * 8, ccy = 3 + rnd() * 5, rr = 3.5 + rnd() * 3, stripes = 2 + Math.floor(rnd() * 4), ang = rnd() * Math.PI;
    var pal = ['rgba(243,243,243,0.25)', 'rgba(243,243,243,0.45)', 'rgba(243,243,243,0.70)', 'rgba(243,243,243,1)'];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var dx = c + 0.5 - ccx, dy = r + 0.5 - ccy, d = Math.sqrt(dx*dx + dy*dy);
      var band = Math.sin((dx * Math.cos(ang) + dy * Math.sin(ang)) * stripes * 0.9 + d * 0.5);
      var on = d < rr ? band > -0.35 : (d < rr + 3 && band > 0.55 && rnd() > 0.35);
      if (!on) continue;
      var shade = Math.max(0, Math.min(3, Math.floor((1 - d / (rr + 3)) * 3 + rnd() * 1.2)));
      g2.fillStyle = pal[shade]; g2.fillRect(c * cw + 0.5, r * chh + 0.5, cw - 1, chh - 1);
    }
  }
  document.querySelectorAll('canvas.thumb').forEach(drawThumb);

  /* ── 04 챕터 학생 포트폴리오 대표작 실시간 연동 (Supabase 승인 작품 우선) ── */
  function loadFeaturedWorks(){
    var cardsContainer = document.querySelector('.chapter.works .cards');
    if (!cardsContainer) return;

    var C = window.SITE_CONFIG || {};
    var D = window.PORTFOLIO_DATA || {};
    var fallbackWorks = (D.works || []).slice(0, 3);

    function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    function applyWorks(list){
      if (!list || !list.length) return;
      var items = list.slice(0, 3);
      for (var k = items.length; k < 3 && k < fallbackWorks.length; k++){
        items.push(fallbackWorks[k]);
      }

      var html = items.map(function(w, idx){
        var category = (w.category || w.meta || 'Artwork').toUpperCase();
        var year = w.year || '';
        var catYear = category + (year ? ' · ' + year : '');
        var title = w.title || '(제목 없음)';
        var student = w.student || '';
        var slug = w.slug || ('work-' + (idx + 1));
        var href = 'portfolio.html#/work/' + encodeURIComponent(slug);

        var mediaHtml = '';
        if (w.image) {
          mediaHtml = '<img src="' + esc(w.image) + '" alt="' + esc(title) + '" loading="lazy">';
        } else if (w.video) {
          mediaHtml = '<video src="' + esc(w.video) + '" muted loop autoplay playsinline></video>';
        } else {
          var seed = w.seed || ((idx + 1) * 7 + 3);
          mediaHtml = '<canvas class="thumb" data-seed="' + seed + '" aria-hidden="true"></canvas>';
        }

        return '<a class="card reveal" style="--i:' + (idx + 2) + '" href="' + href + '">' +
          '<div class="media">' + mediaHtml + '</div>' +
          '<span class="cs-caption">' + esc(catYear) + '</span>' +
          '<span class="title">' + esc(title) + '</span>' +
          '<span class="cs-caption">' + esc(student) + '</span>' +
          '</a>';
      }).join('');

      cardsContainer.innerHTML = html;
      cardsContainer.querySelectorAll('canvas.thumb').forEach(drawThumb);

      if (active === 3) {
        motionEnter(3, 1);
      }
    }

    try {
      var localWorks = JSON.parse(localStorage.getItem('pf-works') || '[]').filter(function(r){ return r.published && r.status === 'approved'; });
      if (localWorks.length) applyWorks(localWorks);
    } catch(e){}

    if (C.SUPABASE_URL && C.SUPABASE_ANON_KEY && typeof fetch === 'function') {
      var base = C.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/';
      var h = { apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY };
      fetch(base + 'works?select=*&published=eq.true&status=eq.approved&order=sort.asc,created_at.desc&limit=3', { headers: h })
        .then(function(r){ return r.ok ? r.json() : []; })
        .then(function(data){
          if (data && data.length) {
            applyWorks(data);
          }
        })
        .catch(function(err){
          console.warn('Featured works fetch failed:', err);
        });
    }
  }

  loadFeaturedWorks();
})();
