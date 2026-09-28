(function(){
  'use strict';
  fetch('logo-grid.json').then(function(r){ return r.ok ? r.json() : null; }).then(function(g){
    if (!g) return;
    var d = (g.rects || []).map(function(b){ return 'M' + b[0] + ' ' + b[1] + 'h' + b[2] + 'v' + b[3] + 'h-' + b[2] + 'Z'; }).join('');
    var p = document.getElementById('logo-path'); if (p) p.setAttribute('d', d);
  }).catch(function(){});

  // 애니메이션 효과 (카드 부드러운 등장)
  if (window.anime && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var cards = document.querySelectorAll('.crew-card');
    if (cards.length) {
      window.anime({
        targets: cards,
        opacity: [0, 1],
        translateY: [16, 0],
        duration: 700,
        delay: window.anime.stagger(120, { start: 100 }),
        easing: 'easeOutCubic'
      });
    }
  }
})();
