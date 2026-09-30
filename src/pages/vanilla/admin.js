(function(){
  'use strict';
  var API = window.PortfolioAPI, D = window.PORTFOLIO_DATA || {};
  var app = document.getElementById('app'), nav = document.getElementById('nav'), toastEl = document.getElementById('toast');
  var CATS = API.CATS, RATIOS = API.RATIOS;
  var MAX_IMG = 15 * 1024 * 1024, MAX_VID = 50 * 1024 * 1024;

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(n){ return ('00' + n).slice(-3); }
  function lines(v){ return String(v || '').split('\n').map(function(s){ return s.trim(); }).filter(Boolean); }
  function toast(m){ toastEl.textContent = m; toastEl.classList.add('is-on'); clearTimeout(toast.t); toast.t = setTimeout(function(){ toastEl.classList.remove('is-on'); }, 2400); }
  function errText(e){ return (e && (e.message || e.error_description || e.msg)) || String(e); }
  function statusOf(w){ return w.status || 'approved'; }

  var S = { user: null, works: [], site: {}, sel: null, draft: null, tab: 'works', admin: true, loaded: false };

  /* 로컬 세션 체크: admin/admin1234 로그인 시 localStorage에 저장 */
  var LOCAL_SESSION_KEY = 'da-admin-session';
  function getLocalSession(){ try { return JSON.parse(localStorage.getItem(LOCAL_SESSION_KEY)); } catch(e){ return null; } }
  function setLocalSession(u){ try { localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(u)); } catch(e){} }
  function clearLocalSession(){ try { localStorage.removeItem(LOCAL_SESSION_KEY); } catch(e){} }

  var localUser = getLocalSession();
  S.user = localUser;
  if (localUser) { S.admin = true; load(); } else { render(); }

  /* ── 데이터 ── */
  function load(){
    return Promise.all([API.listWorks({ all: true }), API.getSite()]).then(function(r){
      S.works = r[0] || []; S.site = r[1] || {}; S.admin = true; S.loaded = true;
      if (S.sel && S.sel !== 'new' && !S.works.some(function(w){ return w.id === S.sel; })) S.sel = null;
      render();
    }).catch(function(e){ S.loaded = true; render(); toast('불러오기 실패: ' + errText(e)); });
  }
  function current(){ if (S.sel === 'new') return S.draft; for (var i = 0; i < S.works.length; i++) if (S.works[i].id === S.sel) return S.works[i]; return null; }
  function siteVal(key){ return S.site[key] != null ? S.site[key] : D[key]; }
  function approved(){ return S.works.filter(function(w){ return statusOf(w) === 'approved'; }); }
  function autoSlug(){ var base = 'work-' + pad(approved().length + 1); var taken = S.works.some(function(w){ return w.slug === base; }); return taken ? base + '-' + Date.now().toString(36) : base; }

  /* ── 화면 ── */
  function render(){
    nav.innerHTML = (S.user
      ? '<a href="portfolio.html" target="_blank" rel="noopener">사이트 보기 ↗</a><a href="submit.html" target="_blank" rel="noopener">게시 페이지 ↗</a><span class="who">admin</span><button type="button" id="logout">로그아웃</button>'
      : '<a href="portfolio.html">사이트 보기 ↗</a>');
    var lo = document.getElementById('logout'); if (lo) lo.addEventListener('click', function(){ clearLocalSession(); S.user = null; S.loaded = false; S.works = []; S.sel = null; render(); });
    if (!S.user) return Login();
    if (!S.loaded) { app.innerHTML = '<div class="empty">불러오는 중…</div>'; return; }
    Dash();
  }

  function Login(){
    app.innerHTML =
      '<form class="login" id="login" autocomplete="on"><div><div class="label">admin</div><h1 style="margin-top:6px">포트폴리오 관리</h1></div>' +
      '<label class="field"><span class="label">ID</span><input type="text" name="adminId" required autocomplete="username" placeholder="admin"></label>' +
      '<label class="field"><span class="label">Password</span><input type="password" name="password" required autocomplete="current-password" placeholder="••••••••"></label>' +
      '<div class="msg" id="lmsg" role="alert"></div><div><button class="btn primary" type="submit">로그인</button></div></form>';
    var f = document.getElementById('login'), m = document.getElementById('lmsg');
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var id = f.elements.adminId.value.trim(), pw = f.elements.password.value;
      if (id !== 'admin' || pw !== 'admin1234') {
        m.className = 'msg err'; m.textContent = '아이디 또는 비밀번호가 틀렸습니다.'; return;
      }
      var u = { id: 'admin' };
      setLocalSession(u);
      S.user = u; S.admin = true;
      load();
    });
  }

  function rowHtml(w, n){
    var st = statusOf(w);
    return '<div class="row ' + st + (w.id === S.sel ? ' is-sel' : '') + (st === 'approved' && !w.published ? ' draft' : '') + '" data-id="' + esc(w.id) + '" title="' + esc(w.slug) + '" tabindex="0" role="button">' +
      '<span class="n">' + (st === 'approved' ? pad(n) : st === 'pending' ? '대기' : '반려') + '</span>' +
      '<span class="t"><span>' + esc(w.title || '(제목 없음)') + '</span><small>' + esc(w.student || '') + (w.student ? ' · ' : '') + esc(w.category || '') + (w.zone === 'alumni' ? ' · 졸업생' : '') + (st === 'approved' && !w.published ? ' · 비공개' : '') + '</small></span>' +
      (st === 'approved' ? '<span class="ops"><button type="button" data-move="-1" title="위로" aria-label="위로">▲</button><button type="button" data-move="1" title="아래로" aria-label="아래로">▼</button></span>' : '<span></span>') + '</div>';
  }
  function Dash(){
    var pending = S.works.filter(function(w){ return statusOf(w) === 'pending'; }), ok = approved(), rejected = S.works.filter(function(w){ return statusOf(w) === 'rejected'; });
    var list = '<div class="list"><div class="head"><span class="label">works</span><button class="btn" type="button" id="add">+ 새 작품</button></div>' +
      (pending.length ? '<div class="group"><div class="gh"><span class="label hot">검토 대기 · ' + pending.length + '</span><span class="label">게시 페이지에서 들어온 작품</span></div>' + pending.map(function(w){ return rowHtml(w, 0); }).join('') + '</div>' : '') +
      '<div class="group"><div class="gh"><span class="label">게시 목록 · ' + ok.length + '</span><span class="label">▲▼ 순서 = 번호</span></div>' +
      (ok.length ? ok.map(function(w, i){ return rowHtml(w, i + 1); }).join('') : '<div class="empty">아직 게시된 작품이 없습니다. 새 작품을 추가하거나 대기 작품을 승인하면 사이트의 자리표시 작품 대신 여기 목록이 보입니다.</div>') + '</div>' +
      (rejected.length ? '<div class="group"><div class="gh"><span class="label">반려 · ' + rejected.length + '</span></div>' + rejected.map(function(w){ return rowHtml(w, 0); }).join('') + '</div>' : '') +
      '</div>';
    var right = '<div><div class="tabs"><button type="button" class="' + (S.tab === 'works' ? 'is-on' : '') + '" data-tab="works">작품</button><button type="button" class="' + (S.tab === 'site' ? 'is-on' : '') + '" data-tab="site">사이트 정보</button></div>' +
      (S.tab === 'site' ? SiteForm() : WorkForm()) + '</div>';
    app.innerHTML = (API.mode === 'local' ? '<div class="mode">' + esc(API.label) + '</div>' : '') +
      '<div class="dash">' + list + right + '</div>';

    document.getElementById('add').addEventListener('click', function(){
      S.draft = { title: '', student: '', category: CATS[0], zone: 'current', year: '', tools: [], slug: '', statement: '', dimensions: '', exhibition: '', video_url: '', paragraphs: [], ratio: '16:10', image: '', video: '', published: true, status: 'approved' };
      S.sel = 'new'; S.tab = 'works'; render();
    });
    Array.prototype.forEach.call(app.querySelectorAll('.row'), function(row){
      row.addEventListener('click', function(e){
        var mv = e.target.getAttribute && e.target.getAttribute('data-move');
        if (mv) { move(row.getAttribute('data-id'), parseInt(mv, 10)); return; }
        S.sel = row.getAttribute('data-id'); S.tab = 'works'; render();
      });
      row.addEventListener('keydown', function(e){ if ((e.key === 'Enter' || e.key === ' ') && e.target === row) { e.preventDefault(); row.click(); } });
    });
    Array.prototype.forEach.call(app.querySelectorAll('.tabs button'), function(b){ b.addEventListener('click', function(){ S.tab = b.getAttribute('data-tab'); render(); }); });
    if (S.tab === 'site') bindSite(); else bindWork();
  }

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
  function field(label, name, value, opts){
    opts = opts || {};
    var inner;
    if (opts.select) inner = '<select name="' + name + '">' + opts.select.map(function(o){ var ov = Array.isArray(o) ? o[0] : o, ol = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(ov) + '"' + (ov === value ? ' selected' : '') + '>' + esc(ol) + '</option>'; }).join('') + '</select>';   /* 선택지: 문자열 또는 [값, 보이는 글] */
    else if (opts.textarea) inner = '<textarea name="' + name + '" rows="' + (opts.rows || 3) + '" placeholder="' + esc(opts.placeholder || '') + '">' + esc(value) + '</textarea>';
    else inner = '<input type="text" name="' + name + '" value="' + esc(value) + '" placeholder="' + esc(opts.placeholder || '') + '">';
    return '<label class="field"><span class="label">' + esc(label) + '</span>' + inner + (opts.hint ? '<span class="hint">' + esc(opts.hint) + '</span>' : '') + '</label>';
  }
  function preview(kind, url){
    if (!url) return kind === 'video' ? '' : 'no image';
    if (kind === 'video') {
      var embed = getEmbedInfo(url);
      if (embed) return '<iframe src="' + esc(embed.embedUrl) + '" style="width:100%;height:100%;border:0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      return '<video src="' + esc(url) + '" muted loop autoplay playsinline></video>';
    }
    return '<img src="' + esc(url) + '" alt="">';
  }
  function mediaBlock(kind, url){
    var isVideo = kind === 'video';
    return '<div class="field"><span class="label">' + (isVideo ? 'video · 영상 (선택, mp4 · webm, 50MB 이하)' : 'image · 대표 이미지 (jpg · png · gif, 15MB 이하)') + '</span><div class="media"><div class="well" id="well-' + kind + '">' + preview(kind, url) + '</div>' +
      '<div class="file"><input type="file" name="' + kind + 'File" accept="' + (isVideo ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/gif,image/webp,image/avif') + '">' +
      '<input type="text" name="' + kind + '" value="' + esc(url || '') + '" placeholder="또는 주소를 직접 입력" style="background:none;border:0;border-bottom:1px solid var(--b24);padding:6px 0;outline:0;border-radius:0;width:100%">' +
      (url ? '<button class="btn" type="button" data-clear="' + kind + '">지우기</button>' : '') + '</div></div>' +
      '<span class="hint">' + (isVideo ? '선택사항입니다. 등록 시 포트폴리오 상세 페이지에서 영상 플레이어로 재생되며, 없으면 비워둡니다.' : '첫 화면 궤도의 타일과 목록의 미리보기에 쓰입니다. GIF 도 됩니다.') + '</span></div>';
  }

  function WorkForm(){
    var w = current();
    if (!w) return '<div class="empty">왼쪽 목록에서 작품을 고르거나 "새 작품"을 누르세요. 게시 페이지로 들어온 작품은 "검토 대기"에 모입니다.</div>';
    var isNew = S.sel === 'new', st = statusOf(w);
    return '<form class="form" id="wf">' +
      '<div class="label">' + (isNew ? 'new work' : (st === 'pending' ? 'pending · ' : st === 'rejected' ? 'rejected · ' : 'work · ') + esc(w.slug)) + '</div>' +
      (st !== 'approved' || w.submitter_email ? '<div class="submitter"><span class="label">' + (st === 'pending' ? '검토 대기 · 게시 페이지에서 제출됨' : st === 'rejected' ? '반려됨' : '게시 페이지에서 제출됨') + '</span>' +
        (w.submitter_email ? '<span>제출자 이메일 · <a href="mailto:' + esc(w.submitter_email) + '">' + esc(w.submitter_email) + '</a></span>' : '') +
        (w.submitter_note ? '<span style="color:var(--b70)">' + esc(w.submitter_note) + '</span>' : '') +
        (w.created_at ? '<span class="label" style="color:var(--b45)">' + esc(String(w.created_at).slice(0, 10)) + '</span>' : '') + '</div>' : '') +
      '<div class="grid2">' + field('title · 작품 제목', 'title', w.title) + field('student · 학생 이름', 'student', w.student) + '</div>' +
      '<div class="grid2">' + field('category · 분야', 'category', w.category, { select: CATS }) + field('year · 연도', 'year', w.year, { placeholder: '2026' }) + '</div>' +
      field('zone · 구분', 'zone', w.zone || 'current', { select: [['current', '재학생'], ['alumni', '졸업생']], hint: 'works 페이지에서 재학생·졸업생 탭으로 나뉘어 보입니다' }) +
      '<div class="grid2">' + field('tools · 도구', 'tools', (w.tools || []).join(', '), { placeholder: 'TouchDesigner, Kinect', hint: '쉼표로 구분' }) + field('slug · 주소', 'slug', w.slug, { placeholder: autoSlug(), hint: '영문·숫자·하이픈. 비우면 자동' }) + '</div>' +
      field('statement · 한 줄 설명 (컨셉)', 'statement', w.statement, { textarea: true, rows: 2, hint: '상세 페이지 ABOUT 상단 대표 문구' }) +
      field('dimensions · 규격 및 재료', 'dimensions', w.dimensions || '', { textarea: true, rows: 2, placeholder: '혼합 매체, 450 × 320 × 1160 mm 등', hint: '크기, 규격, 재료, 상영 시간 (선택)' }) +
      field('exhibition · 전시·상영 정보', 'exhibition', w.exhibition || '', { placeholder: '2025 졸업전시, 아카이브 기획전 등', hint: '전시 또는 상영 이력 (선택)' }) +
      field('paragraphs · 본문', 'paragraphs', (w.paragraphs || []).join('\n\n'), { textarea: true, rows: 7, hint: '문단은 빈 줄로 구분 (작품 개요 · 제작 과정 · 결과)' }) +
      field('ratio · 첫 화면 타일 화면비', 'ratio', w.ratio || '16:10', { select: RATIOS }) +
      mediaBlock('image', w.image) +
      field('video_url · 영상 링크 (YouTube · Vimeo)', 'video_url', w.video_url || (getEmbedInfo(w.video) ? w.video : ''), { placeholder: 'https://www.youtube.com/watch?v=... 또는 https://vimeo.com/...', hint: '유튜브나 비메오 링크를 넣으면 상세 페이지에 플레이어로 임베드됩니다.' }) +
      mediaBlock('video', w.video) +
      (st === 'approved' ? '<label class="check"><input type="checkbox" name="published"' + (w.published ? ' checked' : '') + '> 공개 (끄면 사이트에서 숨김)</label>' : '') +
      '<div class="actions">' +
      (st === 'pending' ? '<button class="btn key" type="button" id="approve">승인 · 게시</button><button class="btn" type="submit">수정만 저장</button><button class="btn danger" type="button" id="reject">반려</button>'
        : st === 'rejected' ? '<button class="btn key" type="button" id="approve">다시 승인 · 게시</button><button class="btn" type="submit">저장</button>'
        : '<button class="btn primary" type="submit">저장</button>' + (isNew ? '' : '<a class="btn" href="portfolio.html#/work/' + encodeURIComponent(w.slug) + '" target="_blank" rel="noopener">미리보기 ↗</a>')) +
      '<span class="sp"></span>' + (isNew ? '<button class="btn" type="button" id="cancel">취소</button>' : '<button class="btn danger" type="button" id="del">삭제</button>') + '</div>' +
      '<div class="msg" id="wmsg" role="alert"></div></form>';
  }
  function readForm(f){
    var w = current() || {}, g = function(n){ return f.elements[n].value.trim(); };
    var slug = g('slug') || autoSlug();
    if (!/^[a-z0-9-]+$/i.test(slug)) throw new Error('slug 는 영문·숫자·하이픈만 됩니다.');
    var videoUrl = g('video_url') || null;
    var videoVal = g('video') || (videoUrl && !(f.elements.videoFile && f.elements.videoFile.files && f.elements.videoFile.files[0]) ? videoUrl : null);
    var row = { slug: slug.toLowerCase(), title: g('title'), student: g('student'), category: g('category'), zone: g('zone') || 'current', year: g('year'),
      tools: g('tools').split(',').map(function(s){ return s.trim(); }).filter(Boolean),
      dimensions: g('dimensions') || null,
      exhibition: g('exhibition') || null,
      statement: g('statement'),
      video_url: videoUrl,
      paragraphs: g('paragraphs').split(/\n\s*\n/).map(function(s){ return s.trim(); }).filter(Boolean),
      ratio: g('ratio'), image: g('image') || null, video: videoVal, status: statusOf(w),
      published: f.elements.published ? f.elements.published.checked : !!w.published };
    if (w.submitter_email) row.submitter_email = w.submitter_email;
    if (w.submitter_note) row.submitter_note = w.submitter_note;
    if (S.sel === 'new') row.sort = approved().length + 1; else { row.id = S.sel; row.sort = w.sort || 0; }
    return row;
  }
  function bindWork(){
    var f = document.getElementById('wf'); if (!f) return;
    var msg = document.getElementById('wmsg');
    var setBusy = function(b){ Array.prototype.forEach.call(f.querySelectorAll('button'), function(x){ x.disabled = b; }); };
    var fail = function(prefix){ return function(err){ msg.className = 'msg err'; msg.textContent = prefix + ': ' + errText(err); setBusy(false); }; };
    ['image', 'video'].forEach(function(kind){
      var fi = f.elements[kind + 'File'], url = f.elements[kind], well = document.getElementById('well-' + kind);
      fi.addEventListener('change', function(){
        var file = fi.files && fi.files[0]; if (!file) return;
        if (file.size > (kind === 'video' ? MAX_VID : MAX_IMG)) { msg.className = 'msg err'; msg.textContent = '파일이 너무 큽니다.'; fi.value = ''; return; }
        msg.className = 'msg'; msg.textContent = '업로드 중…'; setBusy(true);
        API.upload(file, API.mediaPath('works', f.elements.slug.value.trim() || autoSlug(), kind, file)).then(function(publicUrl){
          url.value = publicUrl; msg.textContent = '업로드했습니다. 저장을 눌러 반영하세요.'; well.innerHTML = preview(kind, publicUrl);
        }).catch(function(e){ msg.className = 'msg err'; msg.textContent = '업로드 실패: ' + errText(e); }).then(function(){ setBusy(false); fi.value = ''; });
      });
      url.addEventListener('change', function(){ well.innerHTML = preview(kind, url.value.trim()); });
      url.addEventListener('input', function(){ well.innerHTML = preview(kind, url.value.trim()); });
    });
    var vu = f.elements.video_url;
    if (vu) {
      vu.addEventListener('input', function(){
        if (!f.elements.video.value.trim() && vu.value.trim()) {
          document.getElementById('well-video').innerHTML = preview('video', vu.value.trim());
        }
      });
    }
    Array.prototype.forEach.call(f.querySelectorAll('[data-clear]'), function(b){ b.addEventListener('click', function(){ var k = b.getAttribute('data-clear'); f.elements[k].value = ''; document.getElementById('well-' + k).textContent = k === 'video' ? '' : 'no image'; b.remove(); }); });
    function save(mutate, done){
      var row; try { row = readForm(f); } catch (e) { msg.className = 'msg err'; msg.textContent = e.message; return; }
      if (mutate) mutate(row);
      msg.className = 'msg'; msg.textContent = '저장 중…'; setBusy(true);
      API.saveWork(row).then(function(saved){ S.sel = (saved && saved.id) || row.id || null; S.draft = null; toast(done || '저장했습니다'); return load(); }).catch(fail('저장 실패'));
    }
    f.addEventListener('submit', function(e){ e.preventDefault(); save(null); });
    var ap = document.getElementById('approve'), rj = document.getElementById('reject'), del = document.getElementById('del'), cancel = document.getElementById('cancel');
    if (ap) ap.addEventListener('click', function(){ save(function(row){ row.status = 'approved'; row.published = true; row.sort = approved().reduce(function(m, w){ return Math.max(m, w.sort || 0); }, 0) + 1; }, '승인해서 게시했습니다'); });
    if (rj) rj.addEventListener('click', function(){ if (!window.confirm('이 작품을 반려할까요? 목록의 "반려"에 남고 사이트에는 나오지 않습니다.')) return; save(function(row){ row.status = 'rejected'; row.published = false; }, '반려했습니다'); });
    if (cancel) cancel.addEventListener('click', function(){ S.sel = null; S.draft = null; render(); });
    if (del) del.addEventListener('click', function(){
      var w = current(); if (!w) return;
      if (!window.confirm('"' + (w.title || w.slug) + '" 을(를) 삭제할까요? 되돌릴 수 없습니다.')) return;
      setBusy(true);
      API.deleteWork(w.id).then(function(){ S.sel = null; toast('삭제했습니다'); return load(); }).catch(fail('삭제 실패'));
    });
  }
  function move(id, dir){
    var order = approved(), i = -1; order.forEach(function(w, k){ if (w.id === id) i = k; });
    var j = i + dir; if (i < 0 || j < 0 || j >= order.length) return;
    var t = order[i]; order[i] = order[j]; order[j] = t;
    API.reorder(order.map(function(w){ return { id: w.id, slug: w.slug }; })).then(load).catch(function(e){ toast('순서 변경 실패: ' + errText(e)); });
  }

  function SiteForm(){
    var c = siteVal('contact') || {};
    return '<form class="form" id="sf"><div class="label">site</div>' +
      field('statement · 목록 페이지 첫 문장', 'statement', (siteVal('statement') || []).join('\n'), { textarea: true, rows: 2, hint: '줄바꿈이 그대로 줄 나눔이 됩니다' }) +
      field('taglines · 첫 화면 왼쪽 아래에 번갈아 뜨는 문장', 'taglines', (siteVal('taglines') || []).join('\n'), { textarea: true, rows: 4, hint: '한 줄에 하나' }) +
      field('strapline · 첫 화면 가운데 아래 한 줄', 'strapline', siteVal('strapline') || '') +
      field('intro · 목록 페이지 소개', 'intro', siteVal('intro') || '', { textarea: true, rows: 3 }) +
      '<div class="grid2">' + field('contact email', 'email', c.email || '') + field('instagram (주소)', 'instagram', c.instagram || '') + '</div>' +
      '<div class="grid2">' + field('youtube (주소)', 'youtube', c.youtube || '') + field('address · 주소', 'address', (c.address || []).join('\n'), { textarea: true, rows: 2, hint: '한 줄에 하나' }) + '</div>' +
      '<div class="actions"><button class="btn primary" type="submit">저장</button></div><div class="msg" id="smsg" role="alert"></div></form>';
  }
  function bindSite(){
    var f = document.getElementById('sf'), msg = document.getElementById('smsg');
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var g = function(n){ return f.elements[n].value.trim(); };
      var map = { statement: lines(g('statement')), taglines: lines(g('taglines')), strapline: g('strapline'), intro: g('intro'),
        contact: { email: g('email'), instagram: g('instagram'), youtube: g('youtube'), address: lines(g('address')) } };
      msg.className = 'msg'; msg.textContent = '저장 중…';
      API.saveSite(map).then(function(){ toast('저장했습니다'); return load(); }).catch(function(err){ msg.className = 'msg err'; msg.textContent = '저장 실패: ' + errText(err); });
    });
  }
})();
