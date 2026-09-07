/* ═══ 포트폴리오 데이터 계층 — 프론트엔드와 백엔드의 경계 ═══
   submit.html(작품 게시) 과 admin.html(관리자) 은 오직 window.PortfolioAPI 만 호출합니다.
   - config.js 에 Supabase 연결이 있으면 `remote` 구현(Supabase)을 쓰고,
     없으면 `local` 구현(이 브라우저의 localStorage, 미리보기용)을 씁니다.
   - 백엔드를 다른 것으로 바꾸려면 아래 `remote` 객체의 함수들만 같은 계약으로 다시 구현하면 됩니다.
     계약(데이터 모양·함수 목록)은 README 5절에 있습니다. */
window.PortfolioAPI = (function(){
  'use strict';
  var C = window.SITE_CONFIG || {};
  var CATS = ['installation', 'mapping', 'animation', 'vfx', 'game'];
  var RATIOS = ['16:10', '16:9', '3:2', '5:4', '1:1', '4:5', '9:16'];

  function uid(){ return 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function now(){ return new Date().toISOString(); }
  function bySort(a, b){ return (a.sort || 0) - (b.sort || 0) || String(a.created_at || '').localeCompare(String(b.created_at || '')); }
  function readAsDataURL(file){ return new Promise(function(res, rej){ var r = new FileReader(); r.onload = function(){ res(r.result); }; r.onerror = function(){ rej(new Error('파일을 읽지 못했습니다')); }; r.readAsDataURL(file); }); }

  /* ── local: 백엔드 연결 전 미리보기 (localStorage, 약 5MB) ── */
  var LS = { works: 'pf-works', site: 'pf-site', user: 'pf-user' };
  function get(k, d){ try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { throw new Error('이 브라우저의 저장 공간이 가득 찼습니다 (미리보기 모드는 약 5MB 까지). 이미지를 줄이거나 작품을 지워 주세요.'); } }
  function idx(rows, id){ for (var i = 0; i < rows.length; i++) if (rows[i].id === id) return i; return -1; }
  var listeners = [];
  var local = {
    mode: 'local',
    label: '미리보기 모드 · 백엔드 연결 전이라 이 브라우저에만 저장됩니다',
    auth: {
      getUser: function(){ return Promise.resolve(get(LS.user, null)); },
      signIn: function(email){ var u = { email: email || 'preview@local' }; set(LS.user, u); listeners.forEach(function(f){ f(u); }); return Promise.resolve(u); },
      signOut: function(){ try { localStorage.removeItem(LS.user); } catch (e) {} listeners.forEach(function(f){ f(null); }); return Promise.resolve(); },
      onChange: function(f){ listeners.push(f); }
    },
    isAdmin: function(){ return Promise.resolve(true); },
    listWorks: function(opts){
      var rows = get(LS.works, []);
      if (!(opts && opts.all)) rows = rows.filter(function(r){ return r.published && r.status === 'approved'; });
      return Promise.resolve(rows.slice().sort(bySort));
    },
    getSite: function(){ return Promise.resolve(get(LS.site, {})); },
    upload: function(file){
      if (/^video\//.test(file.type)) return Promise.reject(new Error('미리보기 모드에서는 영상을 저장할 수 없습니다 (백엔드 연결 후 가능)'));
      if (file.size > 1.5 * 1024 * 1024) return Promise.reject(new Error('미리보기 모드에서는 1.5MB 이하 이미지만 저장됩니다'));
      return readAsDataURL(file);
    },
    submitWork: function(row){
      var rows = get(LS.works, []);
      row = Object.assign({}, row, { id: uid(), status: 'pending', published: false, sort: 0, created_at: now(), updated_at: now() });
      rows.push(row); set(LS.works, rows); return Promise.resolve(row);
    },
    saveWork: function(row){
      var rows = get(LS.works, []), i = idx(rows, row.id); row = Object.assign({}, row, { updated_at: now() });
      if (i < 0) { row.id = row.id || uid(); row.created_at = row.created_at || now(); rows.push(row); } else rows[i] = Object.assign({}, rows[i], row);
      set(LS.works, rows); return Promise.resolve(i < 0 ? row : rows[i]);
    },
    deleteWork: function(id){ set(LS.works, get(LS.works, []).filter(function(r){ return r.id !== id; })); return Promise.resolve(); },
    reorder: function(rows){ var all = get(LS.works, []); rows.forEach(function(r, k){ var i = idx(all, r.id); if (i >= 0) all[i].sort = k + 1; }); set(LS.works, all); return Promise.resolve(); },
    saveSite: function(map){ set(LS.site, Object.assign(get(LS.site, {}), map)); return Promise.resolve(); }
  };

  /* ── remote: Supabase (supabase-js v2, config.js 의 URL · anon key) ── */
  var sb = null;
  function client(){ if (!sb) sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY); return sb; }
  function unwrap(r){ if (r.error) throw r.error; return r.data; }
  var remote = {
    mode: 'supabase',
    label: '',
    auth: {
      getUser: function(){ return client().auth.getSession().then(function(r){ return r.data && r.data.session ? r.data.session.user : null; }); },
      signIn: function(email, password){ return client().auth.signInWithPassword({ email: email, password: password }).then(function(r){ if (r.error) throw r.error; return r.data.user; }); },
      signOut: function(){ return client().auth.signOut(); },
      onChange: function(f){ client().auth.onAuthStateChange(function(ev, s){ f(s ? s.user : null); }); }
    },
    isAdmin: function(){ return client().from('admins').select('email').limit(1).then(function(r){ return !!(r.data && r.data.length); }); },
    listWorks: function(opts){
      var q = client().from('works').select('*');
      if (!(opts && opts.all)) q = q.eq('published', true).eq('status', 'approved');
      return q.order('sort', { ascending: true }).order('created_at', { ascending: true }).then(unwrap);
    },
    getSite: function(){ return client().from('site').select('key,value').then(unwrap).then(function(rows){ var m = {}; (rows || []).forEach(function(r){ m[r.key] = r.value; }); return m; }); },
    upload: function(file, path){
      return client().storage.from('portfolio').upload(path, file, { upsert: true, contentType: file.type || undefined, cacheControl: '31536000' })
        .then(unwrap).then(function(){ return client().storage.from('portfolio').getPublicUrl(path).data.publicUrl; });
    },
    submitWork: function(row){ row = Object.assign({}, row, { status: 'pending', published: false, sort: 0 }); return client().from('works').insert(row).select().single().then(unwrap); },
    saveWork: function(row){ row = Object.assign({}, row, { updated_at: now() }); return client().from('works').upsert(row).select().single().then(unwrap); },
    deleteWork: function(id){ return client().from('works').delete().eq('id', id).then(unwrap); },
    reorder: function(rows){ return client().from('works').upsert(rows.map(function(r, k){ return { id: r.id, slug: r.slug, sort: k + 1 }; })).then(unwrap); },
    saveSite: function(map){ return client().from('site').upsert(Object.keys(map).map(function(k){ return { key: k, value: map[k] }; })).then(unwrap); }
  };

  var api = (C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase) ? remote : local;
  api.CATS = CATS; api.RATIOS = RATIOS;
  /* 이미지 크기로 가장 가까운 타일 화면비 고르기 (게시 페이지에서 자동 선택) */
  api.closestRatio = function(w, h){ var best = RATIOS[0], bd = 1e9; RATIOS.forEach(function(r){ var p = r.split(':'); var d = Math.abs(Math.log((w / h) / (p[0] / p[1]))); if (d < bd) { bd = d; best = r; } }); return best; };
  api.mediaPath = function(prefix, slug, kind, file){ var ext = (String(file.name).split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'; return prefix + '/' + slug.toLowerCase() + '/' + kind + '-' + Date.now() + '.' + ext; };
  return api;
})();
