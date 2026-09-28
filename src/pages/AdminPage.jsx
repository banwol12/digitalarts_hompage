import React from 'react';
import ADMIN_CSS from './vanilla/admin.css?raw';
import ADMIN_MARKUP from './vanilla/admin.html?raw';
import ADMIN_SCRIPT from './vanilla/admin.js?raw';
import { useVanillaPage } from './vanilla/useVanillaPage';
import { installPortfolioAPI } from '../lib/portfolioApi';

/* 관리자 — 정적 판 admin.html 의 CSS·마크업·스크립트 그대로 (./vanilla/admin.*, 사용자 디자인).
   window.PortfolioAPI · PORTFOLIO_DATA 를 먼저 채우고, 예전처럼 검색 엔진에 잡히지 않게 한다 */
function setup() {
  installPortfolioAPI();
  const robots = document.createElement('meta');
  robots.name = 'robots';
  robots.content = 'noindex, nofollow';
  document.head.appendChild(robots);
  return () => robots.remove();
}

export default function AdminPage() {
  useVanillaPage({ title: 'Digital Arts · Admin', css: ADMIN_CSS, script: ADMIN_SCRIPT, setup });
  return <div className="admin-vanilla-wrapper" dangerouslySetInnerHTML={{ __html: ADMIN_MARKUP }} />;
}
