(function(start){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start(); })(function(){   /* anime.js(defer) 가 실행된 뒤에 시작 */
  'use strict';
  var D = window.PORTFOLIO_DATA || { works: [], taglines: [], contact: {} };
  var app = document.getElementById('app');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var Q = new URLSearchParams(location.search), STATIC = Q.get('static') === '1';   /* 검수용: ?static=1 → 진입 화면 생략·한 프레임만, &ang=라디안, &hot=타일번호 */
  var raf = 0;
  var AN = function(){ return STATIC ? null : window.anime; };                    /* anime.js 4.5 — 못 불러오면 null, 그땐 예전처럼 즉시 바뀐다 */
  var fresh = false; try { fresh = !sessionStorage.getItem('pf-entered'); } catch (e) {}   /* 이번 세션 첫 방문: 진입 화면이 걷힌 뒤에 궤도가 펼쳐진다 */
  function all(root, sel){ return Array.prototype.slice.call(root.querySelectorAll(sel)); }

  function getEmbedInfo(url){
    if (!url || typeof url !== 'string') return null;
    var u = url.trim(), m = u.match(/src=["']([^"']+)["']/i);
    if (m) u = m[1];
    var yt = u.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (yt) return { type: 'youtube', embedUrl: 'https://www.youtube-nocookie.com/embed/' + yt[1] + '?rel=0&modestbranding=1' };
    var vm = u.match(/vimeo\.com\/(?:video\/)?([0-9]+)(?:\/([a-zA-Z0-9]+))?/i);
    if (vm) return { type: 'vimeo', embedUrl: 'https://player.vimeo.com/video/' + vm[1] + (vm[2] ? '?h=' + vm[2] : '') };
    return null;
  }

  /* 자리표시 썸네일: 검정 위 본색 픽셀 필드 (work.video → mp4/webm, work.image → jpg/gif 가 있으면 그것을 우선) */
  function media(work, w, h){
    if (work.video && !getEmbedInfo(work.video)) { var v = document.createElement('video'); v.src = work.video; v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); if (work.image) v.poster = work.image; return v; }
    if (work.image) { var im = document.createElement('img'); im.src = work.image; im.alt = work.title; im.loading = 'lazy'; im.decoding = 'async'; return im; }
    var cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true'); cv.width = w * 2; cv.height = h * 2; var g = cv.getContext('2d'); g.scale(2, 2);
    var seed = work.seed || 1; var rnd = function(){ seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    var cols = Math.max(8, Math.round(w / 14)), rows = Math.max(6, Math.round(h / 14)), cw = w / cols, ch = h / rows;
    var ccx = cols * (0.3 + rnd() * 0.4), ccy = rows * (0.3 + rnd() * 0.4), rr = Math.min(cols, rows) * (0.4 + rnd() * 0.22), stripes = 2 + Math.floor(rnd() * 4), ang = rnd() * Math.PI;
    var pal = ['rgba(233,234,228,.22)', 'rgba(233,234,228,.42)', 'rgba(233,234,228,.68)', 'rgba(233,234,228,.95)'];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var dx = c + 0.5 - ccx, dy = r + 0.5 - ccy, d = Math.sqrt(dx*dx + dy*dy);
      var band = Math.sin((dx * Math.cos(ang) + dy * Math.sin(ang)) * stripes * 0.9 + d * 0.5);
      var on = d < rr ? band > -0.35 : (d < rr + 3 && band > 0.55 && rnd() > 0.35);
      if (!on) continue;
      var shade = Math.max(0, Math.min(3, Math.floor((1 - d / (rr + 3)) * 3 + rnd() * 1.2)));
      g.fillStyle = pal[shade]; g.fillRect(c * cw + 0.5, r * ch + 0.5, cw - 1, ch - 1);
    }
    return cv;
  }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function safeUrl(u){ return /^https?:\/\//i.test(u || '') ? esc(u) : '#'; }   /* 관리자 입력 링크: javascript: 같은 주소는 막는다 */
  function frame(work, cls, caption, index, protect){
    var f = document.createElement('figure'); f.className = 'frame' + (cls ? ' ' + cls : '');
    var well = document.createElement('div'); well.className = 'well' + (protect ? ' protect' : '');
    well.appendChild(media(work, cls === 'r219' ? 840 : cls === 'r45' ? 400 : 640, cls === 'r219' ? 360 : cls === 'r45' ? 500 : 360)); f.appendChild(well);
    if (caption || index) { var fc = document.createElement('figcaption'); fc.innerHTML = '<span>' + esc(caption || '') + '</span><span>' + esc(index || '') + '</span>'; f.appendChild(fc); }
    return f;
  }
  function rowItem(w){ return '<a class="row-item" href="#/work/' + esc(w.slug) + '"><span class="n">' + w.n + '</span><span class="t">' + esc(w.title) + '</span><span class="m">' + esc(w.student) + ' · ' + esc(w.meta) + '</span></a>'; }
  function marquee(items, big, rev){ var run = items.concat(items, items).map(function(t){ return '<span>' + esc(t) + '</span>'; }).join(''); return '<div class="marquee' + (big ? ' big' : '') + (rev ? ' rev' : '') + '"><div class="track">' + run + '</div></div>'; }
  function footer(){
    var C = D.contact || {};
    return '<footer class="ftr"><div class="big"><span class="ln"><span>DIGITAL</span> <span>ARTS</span></span></div><div class="cols">' +
      '<div class="caption">' + (C.address || []).map(esc).join('<br>') + '</div>' +
      '<div class="caption">for the screen<br>and beyond</div>' +
      '<div><div class="label">work with us</div><div style="margin-top:7px;display:grid;gap:7px;justify-items:start"><a class="btn" href="' + (C.email && C.email.indexOf('@') > 0 ? 'mailto:' + esc(C.email) : '#') + '">' + esc(C.email || '[전공 이메일]') + '</a><a class="btn" href="submit.html">submit a work ↗</a></div></div>' +
      '<div style="display:grid;gap:7px;justify-items:start"><a class="btn" href="' + safeUrl(C.instagram) + '">instagram</a><a class="btn" href="' + safeUrl(C.youtube) + '">youtube</a><a class="btn" href="credits.html">credits ↗</a></div>' +
      '</div><div class="bottom micro"><span>© seoul institute of the arts · digital arts ' + new Date().getFullYear() + '</span><div style="display:flex;gap:18px"><a class="micro" href="credits.html">credits</a><a class="micro" href="index.html">back to main site</a></div></div></footer>';
  }

  /* ── 홈: cipher.tv 첫 화면 — 대표 이미지·GIF·영상이 기울어진 타원 궤도(별자리)를 천천히 돌고, 휠·터치가 회전 속도와 방향을 바꾼다.
     궤도 형태는 화면 녹화본에서 잰 값: 가로:세로 = 1:0.7, 오른쪽이 살짝 올라간 −14° 기울기, 왼쪽 아래가 가장 가깝다(크고 앞에 온다). */
  var spin = { vel: 0, ang: 0, last: 0, dir: -1 };                                /* dir: 손대지 않을 때의 회전 방향 (−1 = 반시계, 녹화본과 같음) */
  var SCRAMBLE = '0123456789/·—ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function Home(){
    cancelAnimationFrame(raf);
    document.body.classList.add('is-home');
    app.innerHTML = '<section class="home" id="home"><div class="orbit" id="orbit"></div><div class="mark" aria-hidden="true"><svg><use href="#logo"/></svg></div>' +
      '<div class="foot micro"><span class="l" id="tagline"></span><span class="c">' + esc(D.strapline || '') + '</span><span class="r">seoul institute of the arts · digital arts</span></div></section>';
    var orbit = document.getElementById('orbit'), home = document.getElementById('home'), tagEl = document.getElementById('tagline');
    var works = D.works.slice(0, 15), real = works.length;
    while (real && works.length < 12) works = works.concat(D.works.slice(0, Math.min(real, 12 - works.length)));   /* 작품이 12개보다 적으면 있는 작품을 반복해 궤도를 채운다 (사용자 2026-09-28: DB 작품 3개뿐이라 궤도가 휑했다) */
    var N = works.length, tiles = [];
    var ratios = [[16, 10], [4, 5], [3, 2], [1, 1], [16, 9], [4, 5], [16, 10], [5, 4]];   /* 작품마다 다른 화면비 (data의 ratio:[w,h] 로 덮어쓸 수 있음) */
    works.forEach(function(w, i){
      var r = (w.ratio && w.ratio.length === 2) ? w.ratio : ratios[i % ratios.length], ar = r[0] / r[1];
      var t = document.createElement('a'); t.className = 'tile'; t.href = '#/work/' + w.slug; t.setAttribute('aria-label', w.title); if (i >= real) { t.setAttribute('aria-hidden', 'true'); t.tabIndex = -1; }   /* 반복 타일은 화면 읽기·탭 이동에서 뺀다 */
      t.appendChild(media(w, 480, Math.round(480 / ar)));
      if (AN() && !reduce) t.style.opacity = '0';                                   /* 궤도가 펼쳐지며 켜질 타일은 처음부터 꺼 둔다 (한 프레임 다 보였다가 꺼지던 깜빡임) */
      var tl = { el: t, ar: ar, kw: ar >= 1.4 ? 0.72 : ar >= 1 ? 0.55 : 0.46, a: (i / N) * Math.PI * 2, j: (((i * 7) % 5) - 2) * 0.035, hs: 1, hot: false };
      t.addEventListener('mouseenter', function(){ home.classList.add('is-hot'); t.classList.add('hot'); tl.hot = true; });
      t.addEventListener('mouseleave', function(){ home.classList.remove('is-hot'); t.classList.remove('hot'); tl.hot = false; });
      orbit.appendChild(t); tiles.push(tl);
    });
    var tags = (D.taglines || []).map(function(t){ return String(t).toLowerCase(); }), tagI = -1, tagT = -1e9;
    if (!tags.length) tags = [String(D.strapline || '').toLowerCase()];
    spin.last = performance.now();
    if (STATIC) { spin.ang = parseFloat(Q.get('ang') || '0') || 0; var hi = parseInt(Q.get('hot') || '-1', 10); if (tiles[hi]) { tiles[hi].hot = true; tiles[hi].hs = 1.25; tiles[hi].el.classList.add('hot'); home.classList.add('is-hot'); } }
    var ROT = -14 * Math.PI / 180, NEAR = 110 * Math.PI / 180, cr = Math.cos(ROT), sr = Math.sin(ROT);
    var ent = { k: 1 }, A0 = AN();
    if (A0 && !reduce) { ent.k = 0; A0.animate(ent, { k: 1, duration: 1900, ease: 'out(4)', delay: fresh ? 1500 : 120 }); }
    function frameFn(now){
      var W = window.innerWidth, H = window.innerHeight, small = W < 768;
      var dt = Math.min(0.05, (now - spin.last) / 1000); spin.last = now;
      var base = (reduce || STATIC) ? 0 : (Math.PI * 2 / 90) * spin.dir;                        /* 손대지 않으면 90초에 한 바퀴 */
      spin.ang += (base + spin.vel) * dt;
      spin.vel *= Math.pow(0.25, dt);                                                 /* 휠·터치로 얻은 속도는 2초쯤에 걸쳐 사라진다 */
      var A = small ? W * 0.40 : Math.min(W * 0.31, H * 0.40), B = A * (small ? 1.15 : 0.70);
      var cx = W / 2, cy = H * (small ? 0.47 : 0.5);
      B = Math.min(B, cy - 64 - A * 0.2);                                            /* 좁고 긴 창: 맨 위 타일이 헤더를 덮지 않게 */
      var ek = ent.k, spread = 0.5 + 0.5 * ek, Af = A; A *= spread; B *= spread;     /* 첫 등장: 안쪽에서 돌며 궤도가 펼쳐진다 */
      tiles.forEach(function(tl, idx){
        var ang = tl.a + spin.ang - (1 - ek) * 1.1;
        if (ek < 1) tl.el.style.opacity = Math.max(0, Math.min(1, ek * 2.4 - idx / N * 1.4)).toFixed(3); else if (tl.el.style.opacity) tl.el.style.opacity = '';
        var d = Math.cos(ang - NEAR);                                                 /* 1 = 가장 가까움(왼쪽 아래), −1 = 가장 멂(오른쪽 위) */
        var s = 0.85 + 0.15 * d, p = 0.92 + 0.08 * d;                                 /* 앞은 크고 바깥으로, 뒤는 작고 안쪽으로 */
        var x0 = Math.cos(ang) * A, y0 = Math.sin(ang) * B + tl.j * B;
        var x = cx + (x0 * cr - y0 * sr) * p, y = cy + (x0 * sr + y0 * cr) * p;
        tl.hs += ((tl.hot ? 1.25 : 1) - tl.hs) * Math.min(1, dt * 9);
        /* 크기는 transform 의 scale 로만 바꾼다 — 폭·높이를 매 프레임 바꾸면 타일 15개를 매번 다시 배치·다시 그려 폰·절전 모드에서 끊겼다.
           기준 크기는 가장 클 때(다 펼쳐짐·맨 앞·마우스 올림 1.25배)로 잡아 늘 줄여서만 그린다 (늘리면 흐려진다) */
        var bw = Af * tl.kw * (small ? 1.18 : 1) * 1.25, bh = bw / tl.ar;
        if (tl.bw !== bw) { tl.bw = bw; tl.el.style.width = bw.toFixed(1) + 'px'; tl.el.style.height = bh.toFixed(1) + 'px'; }
        tl.el.style.transform = 'translate3d(' + (x - bw / 2).toFixed(1) + 'px,' + (y - bh / 2).toFixed(1) + 'px,0) scale(' + (spread * s * tl.hs / 1.25).toFixed(4) + ')';
        var zi = tl.hot ? '55' : String(1 + Math.round((d + 1) * 25)); if (tl.zi !== zi) { tl.zi = zi; tl.el.style.zIndex = zi; }   /* 1–51: 헤더(100)·진입 화면(200)보다 항상 아래 */
      });
      /* 왼쪽 아래 태그라인: 6초마다 다음 문장으로, 글자가 흩어졌다가 자리 잡는다 */
      if (now - tagT > 6000) { tagI = (tagI + 1) % tags.length; tagT = now; }
      var txt = tags[tagI], pr = (reduce || STATIC) ? 1 : Math.min(1, (now - tagT) / 900), n = Math.floor(pr * txt.length), out = '';
      for (var i = 0; i < txt.length; i++) out += (i < n || txt[i] === ' ') ? txt[i] : SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)].toLowerCase();
      if (pr < 1 || tagEl.textContent !== txt) tagEl.textContent = out;
      if (!STATIC) raf = requestAnimationFrame(frameFn);
    }
    if (STATIC) frameFn(spin.last + 16); else raf = requestAnimationFrame(frameFn);
  }
  /* 휠: 아래로 굴리면 시계 방향으로 빨라지고, 위로 굴리면 반대로 돈다. 터치: 쓸어 넘긴 방향으로. 마지막으로 민 방향이 그 뒤의 느린 회전 방향이 된다 */
  function push(v){ spin.vel = Math.max(-2.6, Math.min(2.6, spin.vel + v)); if (Math.abs(v) > 0.003) spin.dir = v > 0 ? 1 : -1; }
  window.addEventListener('wheel', function(e){ if (!document.body.classList.contains('is-home')) return; e.preventDefault(); push((e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY) * 0.0028); }, { passive: false });
  var tY = null, tX = null;
  window.addEventListener('touchstart', function(e){ var t = e.touches[0]; tY = t.clientY; tX = t.clientX; }, { passive: true });
  window.addEventListener('touchmove', function(e){ if (!document.body.classList.contains('is-home') || tY === null) return; var t = e.touches[0]; var dy = tY - t.clientY, dx = tX - t.clientX; tY = t.clientY; tX = t.clientX; e.preventDefault(); push((dy + dx) * 0.014); }, { passive: false });
  window.addEventListener('touchend', function(){ tY = null; }, { passive: true });

  /* ── works: 큰 프레임 세로 스택 ── */
  function Works(filter){
    cancelAnimationFrame(raf); document.body.classList.remove('is-home');
    filter = filter || 'all';
    var metas = ['all'].concat(D.works.map(function(w){ return w.meta; }).filter(function(m, i, a){ return a.indexOf(m) === i; }));
    var list = D.works.filter(function(w){ return filter === 'all' || w.meta === filter; });
    app.innerHTML = '<section class="page"><h1 class="display" style="max-width:30ch">' + (D.statement || []).map(function(t){ return '<span class="ln"><span>' + esc(t) + '</span></span>'; }).join('') + '</h1>' +
      '<p class="micro" style="margin:12px 0 0"><a href="submit.html" style="border-bottom:1px solid var(--border-hairline)">학생 작품 게시하기 ↗</a></p>' +
      '<div class="filters">' + metas.map(function(m){ return '<a class="' + (m === filter ? 'is-active" aria-current="true' : '') + '" href="#/works/' + esc(m) + '">' + esc(m) + '</a>'; }).join('') + '</div>' +
      '<div class="works-grid"><div class="rows" id="rows">' + list.map(rowItem).join('') + (list.length ? '' : '<p class="body">이 분야의 작품이 아직 없습니다.</p>') + '</div><div class="preview" id="preview"></div></div></section>' + footer();
    var pv = document.getElementById('preview');
    /* 미리보기: 새 작품을 위에 겹쳐 흐림에서 또렷하게 (0.32초), 다 나타나면 아래 것을 치운다 */
    function peek(w){
      if (!w || pv.getAttribute('data-slug') === w.slug) return; pv.setAttribute('data-slug', w.slug);
      var f = frame(w, 'r45', w.title, w.n), old = all(pv, ':scope > .frame'), A = AN(); pv.appendChild(f); pv.classList.add('is-on');
      if (!old.length) return;
      var drop = function(){ old.forEach(function(o){ if (o.parentNode) o.parentNode.removeChild(o); }); };
      if (!A || reduce) return drop();
      A.animate(f, { opacity: [0, 1], filter: ['blur(8px)', 'blur(0px)'], scale: [1.015, 1], duration: 320, ease: 'out(3)', onComplete: function(){ drop(); f.removeAttribute('style'); } });
    }
    peek(list[0]);                                                                    /* 처음부터 첫 작품을 보여 준다 */
    Array.prototype.forEach.call(document.querySelectorAll('#rows .row-item'), function(a){
      var show = function(){ peek(D.works.filter(function(x){ return '#/work/' + x.slug === a.getAttribute('href'); })[0]); };
      a.addEventListener('mouseenter', show); a.addEventListener('focus', show);   /* 키보드로 옮겨 다녀도 미리보기 */
    });
  }

  /* ── 상세 ── */
  function Work(slug){
    cancelAnimationFrame(raf); document.body.classList.remove('is-home');
    var w = D.works.filter(function(x){ return x.slug === slug; })[0] || D.works[0]; if (!w) { Works(); return; }
    var more = D.works.filter(function(x){ return x.slug !== w.slug; }).slice(0, 3);
    var embed = getEmbedInfo(w.video_url || w.video);
    var hasVideo = Boolean(embed || (w.video && !getEmbedInfo(w.video)));
    app.innerHTML = '<section class="page tight"><a class="navlink back" href="#/works">← works</a>' +
      '<div class="work-head"><span class="label">' + esc(w.n) + '</span><h1 class="work-title"><span class="ln"><span>' + esc(w.title) + '</span></span></h1></div><div id="hero"></div>' +
      '<section class="section"><div class="label">about</div><div class="prose">' + (w.statement ? '<h2 class="display">' + esc(w.statement) + '</h2>' : '') + (w.paragraphs || []).map(function(p){ return '<p class="body">' + esc(p) + '</p>'; }).join('') + '</div></section>' +
      (hasVideo ? '<section style="margin-top:var(--space-8x)" id="second"></section>' : '') +
      '<section class="section"><div class="label">credits</div><div class="credits">' +
        '<div class="credit"><div class="label">student</div><ul><li>' + esc(w.student) + '</li></ul></div>' +
        '<div class="credit"><div class="label">discipline</div><ul><li>' + esc(w.meta) + '</li></ul></div>' +
        '<div class="credit"><div class="label">year</div><ul><li>' + esc(w.year) + '</li></ul></div>' +
        (w.dimensions ? '<div class="credit"><div class="label">dimensions</div><ul>' + String(w.dimensions).split('\n').map(function(s){ return s.trim(); }).filter(Boolean).map(function(s){ return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div>' : '') +
        '<div class="credit"><div class="label">tools</div><ul>' + (w.tools || []).map(function(t){ return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' +
        (w.exhibition ? '<div class="credit"><div class="label">exhibition</div><ul>' + String(w.exhibition).split('\n').map(function(s){ return s.trim(); }).filter(Boolean).map(function(s){ return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div>' : '') +
      '</div></section>' +
      '<section style="margin-top:var(--space-8x)"><div class="label">more to discover</div><div class="rows">' + more.map(rowItem).join('') + '</div></section></section>' + footer();
    var heroWork = w.image ? Object.assign({}, w, { video: null }) : w;
    document.getElementById('hero').appendChild(frame(heroWork, '', w.title, w.n));
    if (embed) {
      var secEl = document.getElementById('second');
      if (secEl) {
        var fig = document.createElement('figure'); fig.className = 'frame';
        fig.innerHTML = '<div class="well" style="aspect-ratio:16/9;position:relative;background:#000;overflow:hidden">' +
          '<iframe src="' + esc(embed.embedUrl) + '" title="' + esc(w.title) + '" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>' +
          '</div><figcaption><span>' + esc(embed.type.toUpperCase() + ' · ' + w.title) + '</span><span>VIDEO</span></figcaption>';
        secEl.appendChild(fig);
      }
    } else if (w.video) {
      var second = frame(Object.assign({}, w, { image: null }), 'r219', '', '', true);
      second.querySelector('.well').insertAdjacentHTML('beforeend', '<div class="player"><span class="pill">play</span><span class="grp"><span class="pill">sound : off</span><span class="pill">full screen</span></span></div>');
      var secEl = document.getElementById('second');
      if (secEl) secEl.appendChild(second);
    }
  }

  /* ── 화면 전환 (anime.js): 제목은 줄마다 마스크 안에서 올라오고, 목록은 선이 그어지며 한 줄씩, 큰 이미지는 가려진 판이 걷히듯 열린다 ── */
  function enterPage(){
    var A = AN(); if (!A || reduce) return;
    var lines = all(app, '.page .ln > span'), rows = all(app, '.row-item'), wells = all(app, '#hero .well, .preview .well'), fades = all(app, '.page > .micro, .filters, .back, .work-head .label');
    A.utils.set(lines, { y: '108%' });
    A.animate(lines, { y: '0%', duration: 1100, ease: 'out(4)', delay: A.stagger(90, { start: 60 }) });
    A.utils.set(fades, { opacity: 0, y: 8 });
    A.animate(fades, { opacity: 1, y: 0, duration: 700, ease: 'out(3)', delay: A.stagger(60, { start: 200 }) });
    rows.forEach(function(r, k){                                                        /* 끝나면 인라인 값을 모두 지워 CSS 의 .78·hover 가 다시 먹게 (cleanInlineStyles 는 시작 전 값으로 되돌려서 못 씀) */
      r.style.transition = 'none'; A.utils.set(r, { opacity: 0, y: 10, '--rule': 0 });
      A.animate(r, { opacity: 0.78, y: 0, '--rule': 1, duration: 800, ease: 'out(3)', delay: 260 + 35 * k, onComplete: function(){ r.removeAttribute('style'); } });
    });
    wells.forEach(function(w){
      var m = w.firstElementChild;
      A.utils.set(w, { clipPath: 'inset(100% 0% 0% 0%)' });
      A.animate(w, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1100, ease: 'inOut(3)', delay: 180 });
      if (m) { A.utils.set(m, { scale: 1.12 }); A.animate(m, { scale: 1, duration: 1600, ease: 'out(3)', delay: 180 }); }
    });
    var big = all(app, '.ftr .big .ln > span');
    if (big.length && 'IntersectionObserver' in window) {
      A.utils.set(big, { y: '108%' });
      var io = new IntersectionObserver(function(es){ if (!es[0].isIntersecting) return; io.disconnect(); A.animate(big, { y: '0%', duration: 1200, ease: 'out(4)', delay: A.stagger(110) }); }, { threshold: 0.4 });
      io.observe(big[0].parentNode);
    }
  }
  var routed = false;
  function route(){
    var h = location.hash.replace(/^#\/?/, ''), parts = h.split('/'), name = parts[0] || 'home', A = AN();
    var show = function(){
      if (name === 'works') Works(parts[1]); else if (name === 'work') Work(parts[1]); else Home();
      var c = document.querySelector('.hdr .center a'); if (c) c.classList.toggle('is-active', name === 'works' || name === 'work');
      window.scrollTo(0, 0); enterPage();
    };
    if (A && !reduce && routed) { A.utils.remove(app); A.animate(app, { opacity: 0, duration: 160, ease: 'out(2)', onComplete: function(){ show(); A.utils.set(app, { opacity: 1 }); } }); }
    else show();
    routed = true;
  }
  /* ── 데이터: config.js 에 Supabase 연결이 있으면 관리자 페이지(admin.html)에서 저장한 작품·사이트 정보를 쓰고,
     연결이 없거나 아직 작품이 없으면 portfolio-data.js 의 자리표시 데이터를 쓴다 ── */
  function pad3(n){ return ('00' + n).slice(-3); }
  function applyRemote(rows, site){
    if (rows && rows.length) D.works = rows.map(function(r, i){
      var rt = String(r.ratio || '16:10').split(':').map(Number);
      return { n: pad3(i + 1), slug: r.slug, title: r.title || '', student: r.student || '', meta: r.category || 'installation', year: r.year || '', tools: r.tools || [],
        statement: r.statement || '', dimensions: r.dimensions || '', exhibition: r.exhibition || '', video_url: r.video_url || '', paragraphs: r.paragraphs || [], seed: i * 7 + 3, ratio: (rt.length === 2 && rt[0] > 0 && rt[1] > 0) ? rt : null, image: r.image || '', video: r.video || '' };
    });
    (site || []).forEach(function(row){ if (row.value != null && row.value !== '' && !(Array.isArray(row.value) && !row.value.length)) D[row.key] = row.value; });
  }
  function loadRemote(done){
    var C = window.SITE_CONFIG || {};
    if (STATIC) return done();
    if (!C.SUPABASE_URL || !C.SUPABASE_ANON_KEY || typeof fetch !== 'function') {
      /* 백엔드 연결 전: 게시 페이지·관리자 미리보기 모드가 이 브라우저(localStorage)에 저장한 작품이 있으면 그것을 보여준다 */
      try { var lw = JSON.parse(localStorage.getItem('pf-works') || '[]').filter(function(r){ return r.published && r.status === 'approved'; }).sort(function(a, b){ return (a.sort || 0) - (b.sort || 0); });
        var ls = JSON.parse(localStorage.getItem('pf-site') || '{}'); applyRemote(lw, Object.keys(ls).map(function(k){ return { key: k, value: ls[k] }; })); } catch (e) {}
      return done();
    }
    var h = { apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY }, base = C.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/';
    var started = false, start = function(){ if (!started) { started = true; done(); } };
    /* 지난번 받은 작품을 이 브라우저에 두었다가 바로 그린다 — DB 응답을 기다리는 빈 화면 없이 곧장 궤도가 펼쳐진다. 새로 받은 게 다를 때만 다시 그린다 */
    var cached = null; try { cached = JSON.parse(localStorage.getItem('pf-cache') || 'null'); } catch (e) {}
    if (cached && cached.w && cached.w.length) { applyRemote(cached.w, cached.s); start(); }
    var late = setTimeout(start, 4000);                                             /* 4초 안에 안 오면 자리표시 데이터로 먼저 연다 */
    Promise.all([
      fetch(base + 'works?select=*&published=eq.true&status=eq.approved&order=sort.asc,created_at.asc', { headers: h }).then(function(r){ return r.ok ? r.json() : []; }),
      fetch(base + 'site?select=key,value', { headers: h }).then(function(r){ return r.ok ? r.json() : []; })
    ]).then(function(res){
      clearTimeout(late);
      var fresh2 = JSON.stringify({ w: res[0], s: res[1] }), same = cached && JSON.stringify({ w: cached.w, s: cached.s }) === fresh2;
      try { localStorage.setItem('pf-cache', fresh2); } catch (e) {}
      if (same) return start();
      applyRemote(res[0], res[1]); if (started) route(); else start();
    }, start);
  }
  loadRemote(function(){ window.addEventListener('hashchange', route); route(); });

  /* ── 진입: 퍼센트 카운터 → 페이드 (세션당 한 번) ── */
  var entry = document.getElementById('entry'), pct = document.getElementById('pct');
  if (D.strapline) document.getElementById('strap').textContent = D.strapline;
  var seen = !fresh, AE = AN();
  if (reduce || seen || STATIC) entry.classList.add('is-done');
  if (STATIC) entry.style.display = 'none';
  else if (AE && !seen && !reduce) {                                                   /* 숫자가 가속·감속하며 차오르고, 판이 위로 걷힌다 */
    var cnt = { v: 0 };
    AE.animate(cnt, { v: 100, duration: 1100, ease: 'inOut(2)', onUpdate: function(){ pct.textContent = Math.round(cnt.v) + '%'; },
      onComplete: function(){ entry.style.transition = 'none'; AE.animate(entry, { clipPath: ['inset(0% 0% 0% 0%)', 'inset(0% 0% 100% 0%)'], duration: 850, ease: 'inOut(4)', delay: 120, onComplete: function(){ entry.classList.add('is-done'); } }); } });
    try { sessionStorage.setItem('pf-entered', '1'); } catch (e) {}
  }
  else {
    var e0 = performance.now();
    (function tick(now){ var p = Math.min(1, (now - e0) / 900); pct.textContent = Math.round(p * 100) + '%'; if (p < 1) requestAnimationFrame(tick); else setTimeout(function(){ entry.classList.add('is-done'); }, 150); })(e0);
    try { sessionStorage.setItem('pf-entered', '1'); } catch (e) {}
  }
});
