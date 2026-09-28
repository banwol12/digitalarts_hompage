(function(){
  'use strict';
  var API = window.PortfolioAPI, app = document.getElementById('app');
  var MAX_IMG = 15 * 1024 * 1024, MAX_VID = 50 * 1024 * 1024;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function errText(e){ return (e && (e.message || e.error_description || e.msg)) || String(e); }

  /* 로고 픽셀 (홈페이지와 같은 32×34 격자) */
  fetch('logo-grid.json').then(function(r){ return r.ok ? r.json() : null; }).then(function(g){
    if (!g) return; var rows = g.rows || g, d = '';
    rows.forEach(function(row, y){ String(row).split('').forEach(function(ch, x){ if (ch !== '.' && ch !== ' ' && ch !== '0') d += 'M' + x + ' ' + y + 'h1v1h-1z'; }); });
    var p = document.getElementById('logo-path'); if (p) p.setAttribute('d', d);
  }).catch(function(){});

  function field(label, name, value, opts){
    opts = opts || {};
    var inner;
    var rq = opts.req ? ' required aria-required="true"' : '';               /* 필수 항목을 스크린리더에도 알린다 (브라우저 기본 검사는 novalidate 로 계속 끔) */
    if (opts.select) inner = '<select name="' + name + '"' + rq + '>' + opts.select.map(function(o){ return '<option value="' + esc(o) + '"' + (o === value ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
    else if (opts.textarea) inner = '<textarea name="' + name + '"' + rq + ' rows="' + (opts.rows || 3) + '" placeholder="' + esc(opts.placeholder || '') + '">' + esc(value || '') + '</textarea>';
    else inner = '<input type="' + (opts.type || 'text') + '" name="' + name + '" value="' + esc(value || '') + '" placeholder="' + esc(opts.placeholder || '') + '"' + rq + (opts.attrs || '') + '>';
    return '<label class="field" data-f="' + name + '"><span class="label' + (opts.req ? ' req' : '') + '">' + esc(label) + '</span>' + inner + (opts.hint ? '<span class="hint">' + esc(opts.hint) + '</span>' : '') + '</label>';
  }
  function media(kind, req){
    var isVideo = kind === 'video';
    return '<div class="field" data-f="' + kind + '"><span class="label' + (req ? ' req' : '') + '">' + (isVideo ? 'video · 영상 (선택, mp4 · webm, 50MB 이하)' : 'image · 대표 이미지 (jpg · png · gif, 15MB 이하)') + '</span>' +
      '<div class="media"><div class="well" id="well-' + kind + '">' + (isVideo ? '' : 'no image') + '</div>' +
      '<div class="file"><input type="file" name="' + kind + '" accept="' + (isVideo ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/gif,image/webp,image/avif') + '">' +
      '<span class="hint">' + (isVideo ? '선택사항입니다. 등록 시 포트폴리오 상세 페이지에서 영상 플레이어로 재생되며, 없으면 비워둡니다.' : '첫 화면 궤도의 타일과 목록 미리보기에 쓰입니다. 움직이는 GIF 도 됩니다.') + '</span></div></div></div>';
  }

  function Form(){
    app.innerHTML = '<div class="intro"><span class="label">submit</span><h1>작품 게시</h1><p>서울예술대학교 디지털아트전공 학생이라면 누구나 작품을 올릴 수 있습니다. 제출한 작품은 전공에서 검토한 뒤 포트폴리오 사이트에 게시됩니다. 결과는 적어 주신 이메일로 알려 드립니다.</p></div>' +
      (API.mode === 'local' ? '<div class="mode">' + esc(API.label) + '</div>' : '') +
      '<form class="form" id="sf" novalidate>' +
      '<div class="grid2">' + field('title · 작품 제목', 'title', '', { req: true }) + field('student · 이름', 'student', '', { req: true }) + '</div>' +
      '<div class="grid2">' + field('email · 이메일', 'email', '', { req: true, type: 'email', placeholder: 'name@seoularts.ac.kr', hint: '검토 결과를 알려 드릴 주소. 사이트에는 표시되지 않습니다.' }) + field('category · 분야', 'category', API.CATS[0], { select: API.CATS, req: true }) + '</div>' +
      '<div class="grid2">' + field('year · 제작 연도', 'year', '', { placeholder: String(new Date().getFullYear()) }) + field('tools · 도구', 'tools', '', { placeholder: 'TouchDesigner, Kinect', hint: '쉼표로 구분' }) + '</div>' +
      field('statement · 한 줄 설명 (컨셉)', 'statement', '', { textarea: true, rows: 2, req: true, placeholder: '작품의 핵심 컨셉 또는 주제를 한 문장으로 적어 주세요.', hint: '상세 페이지 ABOUT 상단 대표 문구로 표시됩니다.' }) +
      field('dimensions · 규격 및 재료', 'dimensions', '', { textarea: true, rows: 2, placeholder: '예: 혼합 매체, 450 × 320 × 1160 mm 또는 단채널 비디오, 05:30', hint: '작품의 크기, 설치 규격, 사용 재료, 상영 시간 등 (선택, 없으면 비워둡니다)' }) +
      field('exhibition · 전시·상영 정보', 'exhibition', '', { placeholder: '2025 졸업전시, 아카이브 기획전 등', hint: '전시 또는 상영 이력이 있다면 적어 주세요. 없으면 비워둡니다.' }) +
      field('description · 작품 설명', 'paragraphs', '', { textarea: true, rows: 7, hint: '작품 개요 · 제작 과정 · 결과. 문단은 빈 줄로 구분합니다.' }) +
      media('image', true) + media('video', false) +
      field('ratio · 첫 화면 타일 화면비', 'ratio', '16:10', { select: API.RATIOS, hint: '이미지를 고르면 가장 가까운 비율이 자동으로 선택됩니다' }) +
      field('note · 전공에 전할 말', 'submitter_note', '', { textarea: true, rows: 2, placeholder: '전시 이력, 공동 제작자, 참고 링크 등' }) +
      '<label class="check"><input type="checkbox" name="agree"> 제출한 작품과 이미지·영상이 디지털아트전공 포트폴리오 사이트에 게시되는 데 동의합니다. 저작권은 제작자에게 있으며, 요청하면 내릴 수 있습니다.</label>' +
      '<div class="actions"><button class="btn primary" type="submit">제출</button><span class="msg" id="msg" role="alert"></span></div></form>';
    bind();
  }

  function bind(){
    var f = document.getElementById('sf'), msg = document.getElementById('msg');
    var files = { image: null, video: null };
    ['image', 'video'].forEach(function(kind){
      var isVideo = kind === 'video';
      var fi = f.elements[kind], well = document.getElementById('well-' + kind);
      fi.addEventListener('change', function(){
        var file = fi.files && fi.files[0]; files[kind] = null;
        if (!file) { well.textContent = isVideo ? '' : 'no image'; return; }
        if (file.size > (kind === 'video' ? MAX_VID : MAX_IMG)) { setBad(kind, '파일이 너무 큽니다.'); fi.value = ''; well.textContent = isVideo ? '' : 'no image'; return; }
        setBad(kind, '');
        files[kind] = file;
        var url = URL.createObjectURL(file);
        if (kind === 'video') well.innerHTML = '<video src="' + url + '" muted loop autoplay playsinline></video>';
        else {
          var im = new Image();
          im.onload = function(){ f.elements.ratio.value = API.closestRatio(im.naturalWidth, im.naturalHeight); };
          im.src = url; im.alt = ''; well.innerHTML = ''; well.appendChild(im);
        }
      });
    });
    function setBad(name, text){ var el = f.querySelector('[data-f="' + name + '"]'); if (!el) return; el.classList.toggle('is-bad', !!text); if (text) { msg.className = 'msg err'; msg.textContent = text; } }
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var g = function(n){ return f.elements[n].value.trim(); };
      var bad = null;
      Array.prototype.forEach.call(f.querySelectorAll('.field'), function(el){ el.classList.remove('is-bad'); });
      if (!g('title')) bad = ['title', '작품 제목을 적어 주세요.'];
      else if (!g('student')) bad = ['student', '이름을 적어 주세요.'];
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(g('email'))) bad = ['email', '이메일 주소를 확인해 주세요.'];
      else if (!g('statement')) bad = ['statement', '작품을 한 문장으로 적어 주세요.'];
      else if (!files.image) bad = ['image', '대표 이미지를 골라 주세요.'];
      else if (!f.elements.agree.checked) bad = ['agree', '게시 동의에 체크해 주세요.'];
      if (bad) { setBad(bad[0], bad[1]); if (bad[0] === 'agree') { msg.className = 'msg err'; msg.textContent = bad[1]; } return; }

      var slug = 'sub-' + Date.now().toString(36);
      var row = { slug: slug, title: g('title'), student: g('student'), submitter_email: g('email'), submitter_note: g('submitter_note') || null,
        category: g('category'), year: g('year'), tools: g('tools').split(',').map(function(s){ return s.trim(); }).filter(Boolean),
        dimensions: g('dimensions') || null,
        exhibition: g('exhibition') || null,
        statement: g('statement'), paragraphs: g('paragraphs').split(/\n\s*\n/).map(function(s){ return s.trim(); }).filter(Boolean),
        ratio: g('ratio'), image: null, video: null };
      var btn = f.querySelector('button[type=submit]'); btn.disabled = true; msg.className = 'msg'; msg.textContent = '이미지 올리는 중…';
      var skippedVideo = false;
      API.upload(files.image, API.mediaPath('submissions', slug, 'image', files.image)).then(function(url){
        row.image = url;
        if (!files.video) return null;
        msg.textContent = '영상 올리는 중…';
        return API.upload(files.video, API.mediaPath('submissions', slug, 'video', files.video)).then(function(v){ row.video = v; }, function(err){ if (API.mode === 'local') { skippedVideo = true; return null; } throw err; });
      }).then(function(){ msg.textContent = '제출하는 중…'; return API.submitWork(row); })
        .then(function(saved){ Done(saved || row, skippedVideo); window.scrollTo(0, 0); })
        .catch(function(err){ btn.disabled = false; msg.className = 'msg err'; msg.textContent = '제출하지 못했습니다: ' + errText(err); });
    });
  }

  function Done(w, skippedVideo){
    app.innerHTML = '<div class="done"><span class="label">submitted</span><h1>제출되었습니다</h1>' +
      '<p style="color:var(--b70);margin:0">전공에서 검토한 뒤 사이트에 게시됩니다. 결과는 <b style="font-weight:500;color:var(--bone)">' + esc(w.submitter_email) + '</b> 로 알려 드립니다.' + (skippedVideo ? '<br><span style="color:var(--key)">미리보기 모드라 영상은 저장되지 않았습니다.</span>' : '') + '</p>' +
      '<div class="card"><div class="well">' + (w.video ? '<video src="' + esc(w.video) + '" muted loop autoplay playsinline></video>' : w.image ? '<img src="' + esc(w.image) + '" alt="">' : '') + '</div>' +
      '<div class="t"><small>' + esc(w.category) + (w.year ? ' · ' + esc(w.year) : '') + '</small><b>' + esc(w.title) + '</b><span style="color:var(--b70)">' + esc(w.student) + '</span><span style="color:var(--b45);font-size:12px">' + esc(w.statement) + '</span></div></div>' +
      '<div class="actions" style="border:0;padding:0"><button class="btn" type="button" id="again">다른 작품 제출</button><a class="btn" href="portfolio.html">포트폴리오 보기 ↗</a></div></div>';
    document.getElementById('again').addEventListener('click', Form);
  }

  Form();
})();
