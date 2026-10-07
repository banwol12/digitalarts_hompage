import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const HomePage = lazy(() => import('./pages/HomePage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const SubmitPage = lazy(() => import('./pages/SubmitPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const CreditsPage = lazy(() => import('./pages/CreditsPage'));

/* 로고가 차오르는 로더 (스타일은 index.html — 스크립트 오기 전 첫 화면과 같은 모양) */
function LoadingFallback() {
  return (
    <div className="boot" role="status" aria-label="로딩 중">
      <div className="boot-logo" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
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
