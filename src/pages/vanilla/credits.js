(function(){
  'use strict';
  fetch('logo-grid.json').then(function(r){ return r.ok ? r.json() : null; }).then(function(g){
    if (!g) return; var rows = g.rows || g, d = '';                     /* logo-grid.json = 32×34 줄 문자열 (예전 rects 형식이 아니라 로고가 비어 있었다) */
    rows.forEach(function(row, y){ String(row).split('').forEach(function(ch, x){ if (ch !== '.' && ch !== ' ' && ch !== '0') d += 'M' + x + ' ' + y + 'h1v1h-1z'; }); });
    var p = document.getElementById('logo-path'); if (p) p.setAttribute('d', d);
  }).catch(function(){});

  // 애니메이션 효과 (카드 부드러운 등장)
  var A = window.anime;                                                 /* anime.js 4 (src/lib/anime.js) — 예전 3 방식 anime({ targets }) 은 오류가 났다 */
  if (A && A.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var cards = document.querySelectorAll('.crew-card');
    if (cards.length) {
      A.animate(cards, {
        opacity: [0, 1],
        translateY: [16, 0],
        duration: 700,
        delay: A.stagger(120, { start: 100 }),
        ease: 'outCubic'
      });
    }
  }
})();
