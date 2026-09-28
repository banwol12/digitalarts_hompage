import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import LogoMark from './LogoMark';
import { API } from '../lib/api';
import { PlusCircle, ShieldCheck, Menu, X, LogOut } from 'lucide-react';

export default function Navigation() {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    API.auth.getUser().then(setUser);
    const unsub = API.auth.onChange(setUser);
    return () => unsub && unsub();
  }, []);

  const handleLogout = async () => {
    await API.auth.signOut();
    setUser(null);
    navigate('/');
  };

  return (
    <header className="hdr-root">
      <div className="hdr-inner">
        <Link to="/" className="brand" aria-label="메인 페이지로 이동">
          <LogoMark width={28} height={30} />
          <span className="brand-text">Digital Arts Archive</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-desktop">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
          >
            /HOME
          </NavLink>
          <NavLink
            to="/portfolio"
            className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
          >
            /ARCHIVE
          </NavLink>
          <NavLink
            to="/submit"
            className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
          >
            /SUBMIT
          </NavLink>
          <NavLink
            to="/admin"
            className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
          >
            /ADMIN
          </NavLink>
        </nav>

        {/* Right Action Area */}
        <div className="hdr-actions">
          {user ? (
            <div className="admin-badge">
              <ShieldCheck size={14} className="text-key" />
              <span>{user.email || user.id || 'admin'}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="logout-btn"
                title="로그아웃"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : null}

          <Link to="/submit" className="btn-primary-sm">
            <PlusCircle size={14} />
            <span>작품 등록</span>
          </Link>

          <button
            type="button"
            className="mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="메뉴 열기"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="mobile-drawer">
          <NavLink
            to="/"
            end
            onClick={() => setMobileOpen(false)}
            className="mobile-item"
          >
            /HOME (소개 & 커리큘럼)
          </NavLink>
          <NavLink
            to="/portfolio"
            onClick={() => setMobileOpen(false)}
            className="mobile-item"
          >
            /ARCHIVE (작품 아카이브)
          </NavLink>
          <NavLink
            to="/submit"
            onClick={() => setMobileOpen(false)}
            className="mobile-item"
          >
            /SUBMIT (작품 등록 스튜디오)
          </NavLink>
          <NavLink
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className="mobile-item"
          >
            /ADMIN (관리자 대시보드)
          </NavLink>
        </div>
      )}
    </header>
  );
}
