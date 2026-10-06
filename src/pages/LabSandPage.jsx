import React, { useEffect, useRef, useState } from 'react';

/* 실험실: 모래 로고 (three.js). 메인 홈페이지 첫 화면에 넣기 전에 따로 보는 곳 — /lab/sand */
const HINT = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  ? '손가락으로 끌면 빛이 따라오고, 모래가 흩어졌다가 다시 모입니다.'
  : '커서를 움직이면 빛이 따라가고, 누른 채 끌면 모래가 흩어졌다가 다시 모입니다.';
const label = { fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(233,234,228,.6)' };

export default function LabSandPage() {
  const canvasRef = useRef(null);
  const apiRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Lab · Sand logo';
    let alive = true;
    Promise.all([import('../lib/sandLogo'), fetch('/logo-grid.json').then(r => r.json())])
      .then(([{ mountSandLogo }, grid]) => { if (alive) apiRef.current = mountSandLogo(canvasRef.current, grid); })
      .catch(e => { console.error(e); if (alive) setFailed(true); });
    return () => { alive = false; apiRef.current?.dispose(); apiRef.current = null; document.title = prev; };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', fontFamily: '"Pretendard", sans-serif', color: '#e9eae4' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', display: 'block' }} />
      <p style={{ ...label, position: 'absolute', top: 24, left: 24, margin: 0 }}>Lab · Sand logo</p>
      {failed && <p style={{ position: 'absolute', top: '50%', width: '100%', textAlign: 'center', margin: 0, fontSize: 14 }}>이 브라우저는 WebGL2 를 지원하지 않아 효과를 보여줄 수 없습니다.</p>}
      <div style={{ position: 'absolute', left: 24, right: 24, bottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, pointerEvents: 'none' }}>
        <p style={{ ...label, margin: 0, textTransform: 'none', letterSpacing: 0, fontSize: 13, wordBreak: 'keep-all' }}>{HINT}</p>
        <button type="button" onClick={() => apiRef.current?.replay()}
          style={{ pointerEvents: 'auto', flexShrink: 0, font: 'inherit', fontSize: 13, color: '#e9eae4', background: 'transparent', border: '1px solid rgba(233,234,228,.4)', borderRadius: 999, padding: '8px 16px', cursor: 'pointer' }}>
          다시 보기
        </button>
      </div>
    </div>
  );
}
