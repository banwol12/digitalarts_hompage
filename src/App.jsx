import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const HomePage = lazy(() => import('./pages/HomePage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const SubmitPage = lazy(() => import('./pages/SubmitPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const CreditsPage = lazy(() => import('./pages/CreditsPage'));

window.__boot?.stage(0.4);                                            /* 앱 스크립트 도착 */

/* 페이지를 옮길 때 잠깐 뜨는 로더 (스타일은 index.html). 첫 입장은 index.html 의 #boot 가 덮고 있어 보이지 않는다 */
function LoadingFallback() {
  return (
    <div className="boot" role="status" aria-label="로딩 중">
      <div className="boot-logo loop" />
    </div>
  );
}

/* 첫 페이지 조각이 그려지면 로딩 로고를 마저 채운다 (홈은 home.js 가 입장 시작을 함께 맡긴다 — 레이아웃 효과라 이보다 먼저 돈다) */
function BootDone() {
  useEffect(() => { window.__boot?.done(); }, []);
  return null;
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BootDone />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/index.html" element={<HomePage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/portfolio.html" element={<PortfolioPage />} />
        <Route path="/works" element={<PortfolioPage />} />
        <Route path="/works/*" element={<PortfolioPage />} />
        <Route path="/submit" element={<SubmitPage />} />
        <Route path="/submit.html" element={<SubmitPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin.html" element={<AdminPage />} />
        <Route path="/credits" element={<CreditsPage />} />
        <Route path="/credits.html" element={<CreditsPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Suspense>
  );
}
