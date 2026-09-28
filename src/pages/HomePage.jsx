import React from 'react';
import HOME_CSS from './vanilla/home.css?raw';
import HOME_MARKUP from './vanilla/home.html?raw';
import HOME_SCRIPT from './vanilla/home.js?raw';
import { useVanillaPage } from './vanilla/useVanillaPage';
import { installAnime } from '../lib/anime';

/* 홈 — 정적 판 index.html 의 CSS·마크업·스크립트 그대로 (./vanilla/home.*, 사용자 디자인).
   인트로 동안 헤더를 숨기는 booting 클래스는 스크립트가 인트로를 마치면 풀고, 스크립트가 못 돌면 7초 뒤에 푼다 */
function setup() {
  const root = document.documentElement;
  root.classList.add('cs-inverse', 'booting');
  const timer = setTimeout(() => root.classList.remove('booting'), 7000);
  installAnime();
  return () => {
    clearTimeout(timer);
    root.classList.remove('cs-inverse', 'booting', 'js', 'touch-paging');
  };
}

export default function HomePage() {
  useVanillaPage({ title: '서울예술대학교 디지털아트전공', css: HOME_CSS, script: HOME_SCRIPT, setup });
  return <div className="home-vanilla-wrapper" dangerouslySetInnerHTML={{ __html: HOME_MARKUP }} />;
}
