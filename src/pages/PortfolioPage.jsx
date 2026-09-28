import React from 'react';
import PORTFOLIO_CSS from './vanilla/portfolio.css?raw';
import PORTFOLIO_MARKUP from './vanilla/portfolio.html?raw';
import PORTFOLIO_SCRIPT from './vanilla/portfolio.js?raw';
import { useVanillaPage } from './vanilla/useVanillaPage';
import { installSiteGlobals } from '../lib/siteGlobals';
import { installAnime } from '../lib/anime';

/* 포트폴리오 — 정적 판 portfolio.html 의 CSS·마크업·스크립트 그대로 (./vanilla/portfolio.*, 사용자 디자인).
   작품 데이터·Supabase 연결(window.PORTFOLIO_DATA · SITE_CONFIG)과 anime.js 를 먼저 채운다 */
function setup() {
  installSiteGlobals();
  installAnime();
}

export default function PortfolioPage() {
  useVanillaPage({ title: 'Digital Arts · Works', css: PORTFOLIO_CSS, script: PORTFOLIO_SCRIPT, setup });
  return <div className="portfolio-vanilla-wrapper" dangerouslySetInnerHTML={{ __html: PORTFOLIO_MARKUP }} />;
}
