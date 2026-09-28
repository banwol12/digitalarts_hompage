(function(){
  'use strict';
  document.documentElement.classList.add('js');
  var STATIC = /[?&]static=1/.test(location.search);
  var reduce = STATIC || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PACE = 1.15;                                                /* 모든 연출 시간 배율 (2026-09-28 사용자: 너무 빠르다 → 15% 느리게). 로고 숨쉬기 주기는 따로 */
  var IK = 1.7;                                                    /* 첫 입장 시간 배율 (사용자 2026-09-28: 인트로가 너무 빠르다 → 1 에서 1.5, 다시 '정말 조금만 더' 1.7). 챕터 전환은 PACE */
  var introReduce = STATIC;                                       /* 첫 입장 애니메이션은 OS 의 '동작 줄이기' 와 무관하게 항상 재생 (사용자 요청) */
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
  var KINDS = ['code','none','none','none','none','none','none'];      /* 코드 글자(약 14%, 75개쯤)만 남기고 나머지는 흩어지며 사라짐 — 더 많으면 겹쳐서 읽히지 않는다 */
  GRID.forEach(function(row, r){
    for (var c = 0; c < row.length; c++) {
      if (row[c] !== '#') continue;
      var x = c + 0.5 - CX, y = r + 0.5 - CY, d = Math.sqrt(x*x + y*y);
      var bulge = Math.sqrt(Math.max(0, 1 - (d*d) / (R*R)));
      var ang = Math.random() * Math.PI * 2, mag = 24 + Math.random() * 30, seed = Math.random(), seed2 = Math.random();
      boxes.push({ gx: x, gy: y, h: 0.5 + 1.3 * bulge, r: r, c: c, seed: seed, seed2: seed2,
        kind: KINDS[Math.floor(seed * KINDS.length)], token: TOKENS[Math.floor(seed2 * TOKENS.length)], rot: seed * 6.283,
        cur: { x: Math.cos(ang) * mag, y: Math.sin(ang) * mag, z: (Math.random() - 0.5) * 40 },
        from: null, to: null, t0: 0, tw: 0, dur: 1, m: 0, mFrom: 0, mTo: 0, fc: 0, fr: 0,
        ox: 0, oy: 0, vx: 0, vy: 0, pox: 0, poy: 0, sx: 0, sy: 0, sw: 0, sh: 0, held: false, thrown: false, rest: false, launched: false, hitT: 0, drawK: 0,
        pp: 9.2 + Math.random() * 9.3, po: Math.random() * 18, bw: 0.36 + Math.random() * 0.52, pulse: 0,  /* 살아 있는 로고: 픽셀마다 제 주기로 숨쉬고 가끔 앞으로 튀어나온다 (2026-09-28 사용자: 자글자글하다 → 주기 35% 느리게) */
        tl: 0, sa: 0, ax: 0, ay: 0, az: 0, a0: 1, szf0: 1 });                                                            /* 착지 시각·착지 반동 크기·곡선 경로의 휘는 양 */
    }
  });
  N = boxes.length;
  /* 02 챕터 코드 조각: VS Code Dark+ 배색으로 토큰을 부분별 채색 */
  var VS = { ctrl:'#C586C0', type:'#569CD6', fn:'#DCDCAA', num:'#B5CEA8', str:'#CE9178', vari:'#9CDCFE', td:'#4EC9B0', punc:'#D4D4D4' };
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
  var FCOLS = 40, FROWS = Math.ceil(N / FCOLS);
  boxes.forEach(function(b, i){ b.fc = i % FCOLS; b.fr = Math.floor(i / FCOLS); });

  /* 포메이션: 각 픽셀의 목표 위치(로고 단위) */
  var FORM = {
    logo:  function(b){ return { x: b.gx, y: b.gy, z: 0 }; },
    burst: function(b){ return { x: b.gx * (MOBILE() ? 1.5 : 1.25) + (b.seed - 0.5) * 6, y: b.gy * (MOBILE() ? 1.8 : 1.15) + (b.seed2 - 0.5) * 5, z: (b.seed - 0.5) * 26 }; },   /* 폰: 세로로 더 퍼뜨려 좁고 긴 영역을 채운다 */
    field: function(b){ return { x: (b.fc - (FCOLS - 1) / 2) * 1.3, y: (b.fr - (FROWS - 1) / 2) * 1.3, z: 0 }; }
  };
  /* 챕터별 회전·동작 설정. 위치와 크기는 frameFor() 가 화면과 텍스트를 실측해 "빈 영역"에 맞춘다 */
  var CHAPTERS = [
    { form: 'logo',  yaw: 0,    pitch: -0.08, sway: 0,    spin: 0,    morph: 0, flow: 0, live: 1,   sMax: 1.0,  sMin: 0.2,  fit: 0.9  },   /* sway 0: 첫 챕터는 카메라가 전혀 돌지 않는다 (인트로 끝에 흔들림이 시작되는 게 회전처럼 보였다) */
    { form: 'logo',  yaw: -0.25, pitch: -0.06, sway: 0.10, spin: 0,   morph: 0, flow: 0, live: 0.5, sMax: 0.85, sMin: 0.2,  fit: 0.9  },
    { form: 'burst', yaw: 0.15, pitch: -0.1,  sway: 0.20, spin: 0,    morph: 1, flow: 0, live: 0,   sMax: 0.85, sMin: 0.2,  fit: 0.86 },
    { form: 'field', yaw: 0,    pitch: -1.1,  sway: 0.02, spin: 0,    morph: 0, flow: 1, live: 0,   sMax: 1.0,  sMin: 0.3,  fit: 0.9  },
    { form: 'logo',  yaw: 0.1,  pitch: -0.1,  sway: 0.15, spin: 0,    morph: 0, flow: 0, live: 0.4, sMax: 1.0,  sMin: 0.18, fit: 0.92, alpha: 0.14 },
    { form: 'logo',  yaw: 0,    pitch: -0.05, sway: 0.18, spin: 0,    morph: 0, flow: 0, live: 0.6, sMax: 0.6,  sMin: 0.18, fit: 0.9  }
  ];
  var VW = function(){ return document.documentElement.clientWidth || window.innerWidth; };
  var VH = function(){ return document.documentElement.clientHeight || window.innerHeight; };
  /* 그리는 도중엔 레이아웃을 읽지 않는다: 폰 배치 여부는 CSS 와 같은 기준(matchMedia 799px), 헤더 높이는 창 크기가 바뀔 때만 (resize 에서 비움) */
  var mqMob = window.matchMedia('(max-width: 799px)'), hdrC = 0;
  var MOBILE = function(){ return mqMob.matches; };
  var HDR = function(){ return hdrC || (hdrC = (document.querySelector('.site-header') || {}).offsetHeight || 64); };

  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d'), shownOp = '';
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
    function frameFor(i){
      var c = CHAPTERS[i] || CHAPTERS[0], sec = chapters[i], hd = HDR(), M = 24;
      var shellL = (W - SHELL) / 2, shellR = shellL + SHELL, box;
      var hOf = function(sel){ var e = sec.querySelector(sel); return e ? e.offsetHeight : 0; };
      if (MOBILE()) {
        if (i === 0) box = { x0: shellL, x1: shellR, y0: hd + 16, y1: H - 0.12 * H - hOf('.wordmark') - 20 };
        else {
          var stSel = i === 5 ? '.main .stack' : '.stack', padB = i === 5 ? hOf('.foot') + 12 : 24;
          var topM = H - padB - hOf(stSel);
          box = { x0: shellL, x1: shellR, y0: hd + 10, y1: Math.max(hd + 10 + 56, topM - 10) };
        }
      } else if (i === 0) {
        box = { x0: shellL, x1: shellR, y0: hd + M, y1: H - 0.12 * H - hOf('.wordmark') - M };
      } else if (i === 1) {
        box = { x0: W / 2 + 28, x1: shellR - 56, y0: hd + M, y1: H - M };
      } else if (i === 2) {
        box = { x0: shellL, x1: W / 2 - 28, y0: hd + M, y1: H - M };
      } else if (i === 3) {
        box = { x0: shellL, x1: shellR - 56, y0: hd + 0.07 * H + hOf('.stack') + 36, y1: H - 12 };
      } else if (i === 4) {
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
    var g = { cx: f0.cx, cy: f0.cy, s: f0.s, yaw: c0.yaw, pitch: c0.pitch, sway: c0.sway, spin: c0.spin, mode: 1, flow: 0, live: c0.live, alpha: 1 };
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
    function setFormation(i, initial, instant){
      var c = CHAPTERS[i] || CHAPTERS[0], fr = frameFor(i), now = (performance.now() - start) / 1000, fn = FORM[c.form];
      /* 첫 진입: 화면 전체 격자에 숨어 있던 픽셀들 — 가운데부터 바깥으로 켜진 뒤 로고 칸만 로고 자리로 모인다 (나머지 칸은 제자리에서 꺼짐) */
      /* 전환 순서: 로고가 화면에서 옮겨 가는 쪽의 앞 픽셀부터 떠난다 (제자리 변형이면 가운데부터). 한꺼번에가 아니라 물결처럼 */
      var shx = fr.cx - g.cx, shy = fr.cy - g.cy, shl = Math.sqrt(shx * shx + shy * shy), dvx = shl > 40 ? shx / shl : 0, dvy = shl > 40 ? shy / shl : 0;
      var keys = [], kMin = 1e9, kMax = -1e9;
      for (var k0 = 0; k0 < N; k0++) { var c0b = boxes[k0].cur, kv = (dvx || dvy) ? -(c0b.x * dvx + c0b.y * dvy) : Math.sqrt(c0b.x * c0b.x + c0b.y * c0b.y); keys.push(kv); if (kv < kMin) kMin = kv; if (kv > kMax) kMax = kv; }
      if (initial && !introReduce) buildGrid(fr, c, now);
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
          b.dur = (0.55 + Math.min(0.3, fd * 0.02)) * PACE;
          b.tl = b.t0 + b.dur;
          b.sa = fd > 1.5 ? 0.3 : 0;                                      /* 멀리서 온 픽셀만 착지 반동 */
        }
        /* 곡선 경로: 이동 방향에 수직으로 살짝 휘고(방향은 픽셀마다 무작위), 가운데쯤 화면 쪽으로 떠오른다 — 직선 이동보다 떼 지어 나는 느낌 */
        var side = (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.65), mvx = t.x - b.cur.x, mvy = t.y - b.cur.y, bend = initial ? 0.05 : 0.1;
        b.ax = -mvy * bend * side; b.ay = mvx * bend * side; b.az = initial ? 0 : -Math.min(4, fd * 0.08);   /* 인트로는 날아오며 앞으로 부풀지 않는다 */
        b.from = { x: b.cur.x, y: b.cur.y, z: b.cur.z }; b.to = t;
        b.mFrom = b.m; b.mTo = c.morph;
        b.back = !!initial;
        if ((initial ? introReduce : reduce) || instant) { b.cur = { x: t.x, y: t.y, z: t.z }; b.m = c.morph; b.t0 = now - 10; b.tw = now - 10; b.tl = now - 10; b.sa = 0; b.ax = b.ay = b.az = 0; }
        if (b.tl + 0.5 * PACE > flightEnd) flightEnd = b.tl + 0.5 * PACE;
      }
      gFrom = { cx: g.cx, cy: g.cy, s: g.s, yaw: g.yaw, pitch: g.pitch, sway: g.sway, spin: g.spin, mode: g.mode, flow: g.flow, live: g.live, alpha: g.alpha };
      gTo = { cx: fr.cx, cy: fr.cy, s: fr.s, yaw: c.yaw, pitch: c.pitch, sway: c.sway, spin: c.spin, mode: chapters[i].getAttribute('data-mode') === 'ink' ? 1 : 0, flow: c.flow, live: c.live || 0, alpha: (MOBILE() || c.alpha === undefined) ? 1 : c.alpha };
      gFrom.yaw = g.yaw + spinAcc; spinAcc = 0;
      var dyaw = gTo.yaw - gFrom.yaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw)); gFrom.yaw = gTo.yaw - dyaw;
      gT0 = now; gDur = (initial || reduce || instant) ? 0.01 : 0.8 * PACE;                     /* 카메라(위치·크기·각도): 스크롤과 함께 바로 출발 */
      if (initial && !introReduce) { gFrom.yaw = c.yaw; gFrom.pitch = c.pitch; gFrom.sway = 0; gFrom.s = fr.s; gT0 = now + 0.6 * IK; gDur = 1.2 * IK; }   /* 카메라 회전 없음 (사용자 요청): 처음부터 정면, 흔들림만 서서히 */
    }
    setFormation(0, true);
    var introDone = false, INTRO_T = 1.55 * IK, sceneT = 0, introAt = 0;   /* 1.3초: 제목·헤더가 올라오기 시작 (바깥 로고 픽셀이 닿는 1.6초와 겹쳐 1.9초에 모두 끝난다) */
    /* ── 이스터에그: 02 챕터의 코드 조각을 마우스·손가락으로 잡아 던지면 얼마쯤 날아갔다가 스프링처럼 제자리로 돌아온다.
       점수나 안내 없이 숨어 있다 (조각 위에서 커서가 손 모양으로 바뀌는 것만 힌트) ── */
    var play = { on: false, drag: null, last: 0, trail: [], gx: 0, gy: 0 };
    function codeAt(x, y){
      var hit = null;
      for (var i = 0; i < N; i++) { var b = boxes[i]; if (b.kind !== 'code' || !b.sw || b.seenT === undefined || sceneT - b.seenT > 0.2) continue;
        var hw = b.sw / 2 + 8, hh = b.sh / 2 + 8; if (x >= b.sx - hw && x <= b.sx + hw && y >= b.sy - hh && y <= b.sy + hh && (!hit || (b.drawK || 0) >= (hit.drawK || 0))) hit = b; }
      return hit;
    }
    function dragStart(x, y){
      if (active !== 2 || !introDone) return false; var b = codeAt(x, y); if (!b) return false;
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

    /* 03 챕터: 픽셀 필드 위를 오가는 데이터 패킷 (행·열을 따라 빛이 옮겨 다닌다) */
    var packets = [], boost = new Float32Array(N);
    for (var p = 0; p < 18; p++) packets.push({ col: p % 3 === 0, line: Math.floor(Math.random() * (p % 3 === 0 ? FCOLS : FROWS)), x: Math.random() * FCOLS, v: (4 + Math.random() * 7) * (Math.random() < 0.5 ? 1 : -1), len: 2 + Math.random() * 2 });
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
        if (MOBILE() && b.seed2 > 0.5) return;                                       /* 폰: 영역이 작아 조각을 절반만 (75 → 약 37개) — 겹쳐서 깨져 보이던 문제 */
        /* 글자 크기는 0.25px 단위로 — 크기가 매 프레임 조금씩 달라져 글리프를 새로 그리느라 데스크톱에서 프레임당 25ms 가 들던 것 (0.25px 차이는 눈에 안 보인다) */
        var fpx = Math.round(Math.max(MOBILE() ? 10 : 11, sz * 1.9) * (b.held ? 1.18 : 1) * 4) / 4;
        var font = '500 ' + fpx + 'px ui-monospace, Menlo, Consolas, monospace'; if (font !== lastFont) { ctx.font = font; lastFont = font; }
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        var parts = b.parts || [[b.token, VS.vari]], total = 0, widths = [];
        for (var pi = 0; pi < parts.length; pi++) { var wkey = parts[pi][0] + '|' + fpx, pw = textW.get(wkey); if (pw === undefined) { pw = ctx.measureText(parts[pi][0]).width; textW.set(wkey, pw); } widths.push(pw); total += pw; }
        b.sx = X; b.sy = Y; b.sw = total; b.sh = fpx * 1.15; b.pox = b.ox || 0; b.poy = b.oy || 0; if (alpha > 0.5) b.seenT = sceneT;
        var cx2 = X - total / 2;
        for (var pj = 0; pj < parts.length; pj++) { ctx.fillStyle = parts[pj][1]; ctx.fillText(parts[pj][0], cx2, Y); cx2 += widths[pj]; }
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

    var PERF = /[?&]perf=1/.test(location.search), perfLog = [], lastDraw = 0;
    if (PERF) window.__perf = perfLog;
    function render(now){
      var p0 = PERF ? performance.now() : 0;
      var t = (now - start) / 1000; sceneT = t;
      var busy = !!(gFrom && gTo) || !introDone || t < flightEnd;
      var liveK = introDone ? Math.min(1, (t - introAt) / 1.5) : 0;
      /* 그리는 간격: 조용할 때(첫 화면 밖에서 전환·인트로·놀이가 없고 숨쉬기만)는 초당 30장, 그 밖엔 60장 안팎 — 화면 박자(cad)의 정수배로 건너뛴다.
         반 박자 여유를 둬 60·90·100·120·144Hz 어디서나 고르고, 절전 모드 30Hz 에선 매 장 그린다 (전에는 한 장 건너 한 장이라 15장이 됐다) */
      var calm = !STATIC && !busy && !play.on && active !== 0 && g.flow < 0.01;
      watchFrames(now, !calm);
      var skipK = Math.max(1, Math.floor((calm ? 33.3 : 16.7) / cad + 0.1));
      if (now - lastDraw < (skipK - 0.5) * cad) { requestAnimationFrame(render); return; }
      lastDraw = now;
      if (play.on) updatePlay(t);
      if (gFrom && gTo) { var gp = Math.max(0, Math.min(1, (t - gT0) / gDur)), ge = easeOut4(gp); for (var key in gTo) g[key] = gFrom[key] + (gTo[key] - gFrom[key]) * ge; if (gp >= 1) gFrom = gTo = null; }
      spinAcc += g.spin * (t - lastSpin); lastSpin = t;
      if (g.flow > 0.01 && !reduce) updateFlow(t); else lastT = t;
      var yaw = g.yaw + Math.sin(t * 0.22) * g.sway + spinAcc;
      yaw = Math.max(-0.35, Math.min(0.35, yaw));                     /* 정면 기준 ±20° 를 넘지 않는다 */
      var pitch = g.pitch + Math.sin(t * 0.17) * g.sway * 0.35;
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var D = 72, F = Math.min(W, H) * 1.45, S = g.s, OX = g.cx, OY = g.cy;
      /* 광원이 아주 천천히 돌고, 부드러운 빛 띠가 표면을 스친다 */
      var lx0 = -0.42 + Math.sin(t * 0.21) * 0.28, ly0 = -0.62 + Math.cos(t * 0.17) * 0.12, lz0 = -0.66; var lnorm = Math.sqrt(lx0*lx0 + ly0*ly0 + lz0*lz0); L = [lx0 / lnorm, ly0 / lnorm, lz0 / lnorm];
      var sweepA = 0.8, sweepPos = Math.sin(t * 0.16) * 26, sweepC = Math.cos(sweepA), sweepS = Math.sin(sweepA);
      var pal = { dark: mix(PAL_PAPER.dark, PAL_INK.dark, g.mode), mid: mix(PAL_PAPER.mid, PAL_INK.mid, g.mode), light: mix(PAL_PAPER.light, PAL_INK.light, g.mode), sky: mix(PAL_PAPER.sky, PAL_INK.sky, g.mode), fog: mix(PAL_PAPER.fog, PAL_INK.fog, g.mode) };
      /* 반투명 워터마크 챕터: 로고는 불투명하게 그리고 투명도는 캔버스 자체(CSS opacity)에 준다 — 겹침 얼룩이 없고 합성은 브라우저가 공짜로 한다.
         (전에는 오프스크린 캔버스에 그린 뒤 화면 전체를 매 프레임 다시 합성해 데스크톱에서 프레임이 떨어졌다. 그 캔버스 한 장 몫의 메모리도 뺐다) */
      var op = g.alpha < 0.999 ? g.alpha.toFixed(3) : ''; if (op !== shownOp) { shownOp = op; canvas.style.opacity = op; }
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);

      /* 프레임 상수: 면 6개의 회전된 법선과 조명은 모든 상자에 같다 → 한 번만 계산 (전에는 상자마다 6번, 3,000번 넘게 반복) */
      for (var f0 = 0; f0 < 6; f0++) {
        var fnn = FACES[f0].n, fnx1 = fnn[0] * cy + fnn[2] * sy, fnz1 = -fnn[0] * sy + fnn[2] * cy, fny2 = fnn[1] * cp - fnz1 * sp, fnz2 = fnn[1] * sp + fnz1 * cp;
        FNX[f0] = fnx1; FNY[f0] = fny2; FNZ[f0] = fnz2;
        var flam = Math.max(0, fnx1 * L[0] + fny2 * L[1] + fnz2 * L[2]);
        var fc = mix(pal.dark, pal.mid, Math.min(1, 0.25 + flam * 0.9)); fc = mix(fc, pal.light, Math.pow(flam, 3) * 0.75); fc = mix(fc, pal.light, Math.max(0, -fny2) * 0.12);
        FR[f0] = fc[0]; FG[f0] = fc[1]; FB[f0] = fc[2];
      }
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
        if (b.from && b.to) { var e = b.back ? easeInOut(p) : easeOut4(p), arc = Math.sin(Math.PI * e); b.cur.x = b.from.x + (b.to.x - b.from.x) * e + b.ax * arc; b.cur.y = b.from.y + (b.to.y - b.from.y) * e + b.ay * arc; b.cur.z = b.from.z + (b.to.z - b.from.z) * e + b.az * arc; b.m = b.mFrom + (b.mTo - b.mFrom) * e; }
        var alpha = 1, dep = 1, szf = 1, lx = 0, ly = 0, lz = 0;
        if (b.back && t < b.t0 + b.dur) {
          if (t < b.t0) continue;                                                              /* 맡은 칸이 닿기 전엔 비어 있다 */
          var ep = easeOut(p);
          alpha = ep; szf = 0.85 + 0.15 * ep; dep = 0.03 + 0.97 * ep;                           /* 도착하는 칸만큼 차오르며 납작한 픽셀 → 로고 두께의 큐브 */
        }
        var sq = (t - b.tl) / (0.5 * PACE);                                                       /* 착지: 제자리에 닿는 순간 화면 쪽으로 살짝 밀려 나왔다가 자리 잡는다 */
        if (b.sa && sq > 0 && sq < 1) lz -= b.sa * Math.sin(Math.PI * sq) * (1 - sq);
        var bob = hasFlow ? Math.sin(t * 1.4 + b.fc * 0.35 + b.fr * 0.6) * 0.5 * g.flow : 0;
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
      if (ulN) { ctx.fillStyle = colStr(FR[0] + (fogA - FR[0]) * 0.135, FG[0] + (fogB - FG[0]) * 0.135, FB[0] + (fogC - FB[0]) * 0.135); ctx.globalAlpha = 1; ctx.fill(); }   /* 워터마크 챕터의 반투명은 캔버스 opacity 가 맡는다 */
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
          var fog = Math.max(0, Math.min(1, (cz1 + 18) / 40)) * 0.3;
          var sd = (bx.cur.x * sweepC + bx.cur.y * sweepS) - sweepPos; var band = Math.exp(-sd * sd / 26) * 0.09; if (band < 0.01) band = 0;   /* 빛 띠는 약하게 (한쪽만 밝아 보이지 않게) */
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
      ctx.globalAlpha = 1;
      if (PERF) { perfLog.push(+(performance.now() - p0).toFixed(2)); if (perfLog.length > 600) perfLog.shift(); }   /* 검수용: 최근 600 프레임의 그리기 비용(ms) */
      if (!introDone && t > INTRO_T) introFinish();
      requestAnimationFrame(render);
    }
    function introFinish(){
      if (introDone) return;
      introDone = true; introAt = sceneT; revealWordmark(); document.documentElement.classList.remove('booting');
      window.removeEventListener('wheel', lockWheel); window.removeEventListener('keydown', lockKeys);   /* 이제부터 스크롤은 브라우저가 알아서 (JS 를 기다리지 않는다) */
      if (pendingHash !== null) { var ph = pendingHash; pendingHash = null; setTimeout(function(){ goTo(ph); }, 450); }   /* #c3 같은 주소로 들어와도 인트로를 본 뒤에 그 챕터로 */
    }
    if (introReduce) introFinish(); else setTimeout(introFinish, 3000 * IK);   /* 탭이 가려져 프레임이 멈춰도 3초 뒤엔 풀린다 */
    /* 인트로가 끝나기 전에는 휠·키보드·터치로 넘어갈 수 없다 */
    var lockWheel = function(e){ if (!introDone && e.cancelable) e.preventDefault(); }, lockKeys = function(e){ if (!introDone && [' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'End', 'Home'].indexOf(e.key) >= 0) e.preventDefault(); };
    window.addEventListener('wheel', lockWheel, { passive: false });
    window.addEventListener('keydown', lockKeys);
    requestAnimationFrame(render);

    function evOK(e){ var el = e.target && e.target.nodeType === 1 ? e.target : null; return !(el && el.closest && el.closest('a, button, input, textarea, select, .cards')); }
    document.addEventListener('mousedown', function(e){ if (e.button !== 0 || !evOK(e)) return; if (dragStart(e.clientX, e.clientY)) { e.preventDefault(); document.body.style.cursor = 'grabbing'; } });
    document.addEventListener('mousemove', function(e){ if (play.drag) { dragMove(e.clientX, e.clientY); return; } if (active === 2 && introDone && !TOUCH) document.body.style.cursor = codeAt(e.clientX, e.clientY) ? 'grab' : ''; });
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
        fades = fades.concat(kids);
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
    function revealWordmark(){
      var A = AM(); chapters[0].classList.add('is-ready');
      if (!A || introReduce) return;
      var wl = all(chapters[0], '.wordmark .ln > span');
      A.utils.set(wl, { y: '112%' });
      A.animate(wl, { y: '0%', duration: Math.round(500 * IK / PACE), ease: 'out(4)', delay: A.stagger(Math.round(50 * IK / PACE)) });   /* 실제 0.5초·0.05초 간격 (엔진 속도가 1/PACE) — 인트로 1.9초 안에 */
    }
    /* 헤더 메뉴 밑줄: 현재 챕터 메뉴 밑으로 스프링처럼 옮겨 간다 (00 에서는 숨김) */
    var navInd = document.querySelector('.nav-ind');
    function moveInd(i, instant){
      if (!navInd || !navInd.parentNode.offsetParent) return;
      var a = document.querySelector('.site-nav a[data-ch="' + i + '"]'), A = AM(), hidden = parseFloat(getComputedStyle(navInd).opacity) < 0.05;
      if (!A) { navInd.style.opacity = a ? 1 : 0; if (a) { navInd.style.transform = 'translateX(' + a.offsetLeft + 'px)'; navInd.style.width = a.offsetWidth + 'px'; } return; }
      A.utils.remove(navInd);
      if (a && (instant || reduce || hidden)) A.utils.set(navInd, { x: a.offsetLeft, width: a.offsetWidth });   /* 숨어 있다가 나타날 땐 제자리에서 */
      if (instant || reduce) { A.utils.set(navInd, { opacity: a ? 1 : 0 }); return; }
      A.animate(navInd, a ? { x: a.offsetLeft, width: a.offsetWidth, opacity: { to: 1, duration: 260, ease: 'out(2)' }, ease: A.spring({ bounce: 0.18, duration: 560 }) } : { opacity: 0, duration: 200, ease: 'out(2)' });
    }

    /* ── 챕터 활성화: 뷰포트 중심선이 들어 있는 챕터 ── */
    var body = document.body, links = document.querySelectorAll('[data-ch]');
    function activate(i){
      if (i === active && chapters[i].classList.contains('is-active')) return;
      if (active === 2 && i !== 2) resetPlay();                                     /* 놀이터를 떠나면 조각이 제자리로 */
      var prev = active;
      active = i;
      chapters.forEach(function(s, k){ s.classList.toggle('is-active', k === i); if (PAGED) s.inert = k !== i; });
      links.forEach(function(a){ var on = parseInt(a.getAttribute('data-ch'), 10) === i; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); if (on && a.parentNode && a.parentNode.classList.contains('subnav')) { var pn = a.parentNode; pn.scrollTo({ left: a.offsetLeft - pn.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' }); } });
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

    /* ── 터치 기기: 스와이프를 감지하는 순간 다음/이전 챕터로 부드럽게 이동 (한 번에 한 챕터) ── */
    var paging = false, mainEl = document.querySelector('main');
    function goTo(i){
      i = Math.max(0, Math.min(chapters.length - 1, i));
      if (!introDone || paging || i === active) return;
      paging = true;
      if (PAGED) {
        chapters[active].scrollTop = 0;
        mainEl.style.transform = 'translateY(' + (-i * 100) + '%)';
        activate(i);
        setTimeout(function(){ paging = false; }, reduce ? 20 : 640);
        return;
      }
      var from = window.scrollY, to = chapters[i].offsetTop, t0 = performance.now(), dur = reduce ? 1 : 620, AN = AM();
      if (AN && !reduce) { var sp = { y: from }; AN.animate(sp, { y: to, duration: Math.min(950, 520 + 90 * Math.abs(i - active)), ease: 'inOut(3)', onUpdate: function(){ window.scrollTo(0, sp.y); }, onComplete: function(){ window.scrollTo(0, to); paging = false; pick(); } }); return; }
      (function step(now){
        var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        window.scrollTo(0, from + (to - from) * e);
        if (p < 1) requestAnimationFrame(step); else { window.scrollTo(0, to); paging = false; pick(); }
      })(t0);
    }
    if (PAGED) {
      document.documentElement.classList.add('touch-paging');
      window.scrollTo(0, 0);
      document.querySelectorAll('a[href^="#c"]').forEach(function(a){ a.addEventListener('click', function(e){ var n = parseInt(a.getAttribute('href').slice(2), 10); if (!isNaN(n)) { e.preventDefault(); goTo(n); } }); });
      window.addEventListener('resize', function(){ mainEl.style.transform = 'translateY(' + (-active * 100) + '%)'; });
      var ty = null, tx = null, tSkip = false, tFired = false;
      document.addEventListener('touchstart', function(e){
        var t = e.touches[0]; ty = t.clientY; tx = t.clientX; tFired = false;
        var el = e.target && e.target.nodeType === 1 ? e.target : (e.target ? e.target.parentElement : null);
        tSkip = !!(el && el.closest && el.closest('.cards, input, textarea, select'));
      }, { passive: true });
      document.addEventListener('touchmove', function(e){
        if (ty === null || tSkip || play.drag) return;
        if (!introDone) { if (e.cancelable) e.preventDefault(); return; }
        var t = e.touches[0], dy = t.clientY - ty, dx = t.clientX - tx;
        if (Math.abs(dx) > Math.abs(dy) * 1.2 && !tFired) return;                 /* 가로 제스처는 그대로 둔다 */
        var sec = chapters[active];
        if (!tFired && sec.scrollHeight > sec.clientHeight + 2) {                  /* 화면보다 긴 챕터: 안에서 먼저 스크롤, 끝에 닿으면 페이징 */
          var atTop = sec.scrollTop <= 0, atBottom = sec.scrollTop + sec.clientHeight >= sec.scrollHeight - 2;
          if ((dy < 0 && !atBottom) || (dy > 0 && !atTop)) return;
        }
        if (e.cancelable) e.preventDefault();
        if (!tFired && Math.abs(dy) > 24) { tFired = true; goTo(active + (dy < 0 ? 1 : -1)); }
      }, { passive: false });
      var tEnd = function(){ ty = null; tx = null; tFired = false; tSkip = false; };
      document.addEventListener('touchend', tEnd, { passive: true });
      document.addEventListener('touchcancel', tEnd, { passive: true });
      if (STATIC) window.__paging = { goTo: goTo };
    }
    window.addEventListener('resize', function(){ resize(); setFormation(active, false, true); pick(); moveInd(active, true); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ resize(); if (active !== 0) setFormation(active, false, true); });
    pick();
    if (/[?&]debug=1/.test(location.search)) window.__play = { play: play, boxes: boxes, codeAt: codeAt, isDone: function(){ return introDone; } };   /* 검수용 */
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

      if (active === 4) {
        motionEnter(4, 1);
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
