import { useLayoutEffect } from 'react';

/* 정적 판 페이지(홈·포트폴리오·작품 게시·관리자)를 React 안에서 그대로 돌린다 — 같은 폴더의 *.css · *.html · *.js 가 원본.
   그리기 전에(useLayoutEffect) 제목과 CSS 를 걸고, setup 이 전역값(데이터·API·anime.js)을 채운 뒤, 스크립트를 예전처럼 <script> 로 한 번 실행한다.
   setup 은 컴포넌트 밖에 두어 바뀌지 않게 한다. 되돌릴 것이 있으면 함수를 돌려준다 */
export function useVanillaPage({ title, css, script, setup }) {
  useLayoutEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    const undo = setup ? setup() : null;
    const scriptEl = document.createElement('script');
    scriptEl.textContent = script;
    document.body.appendChild(scriptEl);
    return () => {
      scriptEl.remove();
      if (typeof undo === 'function') undo();
      styleEl.remove();
      document.title = prevTitle;
    };
  }, [title, css, script, setup]);
}
