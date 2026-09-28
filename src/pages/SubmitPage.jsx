import React from 'react';
import SUBMIT_CSS from './vanilla/submit.css?raw';
import SUBMIT_MARKUP from './vanilla/submit.html?raw';
import SUBMIT_SCRIPT from './vanilla/submit.js?raw';
import { useVanillaPage } from './vanilla/useVanillaPage';
import { installPortfolioAPI } from '../lib/portfolioApi';

/* 작품 게시 — 정적 판 submit.html 의 CSS·마크업·스크립트 그대로 (./vanilla/submit.*, 사용자 디자인). window.PortfolioAPI 를 먼저 채운다 */
export default function SubmitPage() {
  useVanillaPage({ title: 'Digital Arts · Submit', css: SUBMIT_CSS, script: SUBMIT_SCRIPT, setup: installPortfolioAPI });
  return <div className="submit-vanilla-wrapper" dangerouslySetInnerHTML={{ __html: SUBMIT_MARKUP }} />;
}
