import React from 'react';
import { Link } from 'react-router-dom';
import LogoMark from './LogoMark';
import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer-root">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand-lockup">
              <LogoMark width={24} height={26} />
              <span className="brand-name">Digital Arts Archive</span>
            </div>
            <p className="footer-tagline">
              서울예술대학교 디지털아트전공 아카이브<br />
              코드와 도구를 예술의 재료로, 아직 세상에 없는 예술을 만듭니다.
            </p>
          </div>

          <div className="footer-links-grid">
            <div className="footer-col">
              <span className="footer-col-title">NAVIGATION</span>
              <Link to="/">/HOME</Link>
              <Link to="/portfolio">/ARCHIVE</Link>
              <Link to="/submit">/SUBMIT</Link>
              <Link to="/credits">/CREDITS</Link>
              <Link to="/admin">/ADMIN</Link>
            </div>

            <div className="footer-col">
              <span className="footer-col-title">CONNECT</span>
              <a
                href="https://www.instagram.com/seoularts_digitalarts/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram <ArrowUpRight size={12} />
              </a>
              <a
                href="https://www.youtube.com/@sia_digitalarts"
                target="_blank"
                rel="noopener noreferrer"
              >
                YouTube <ArrowUpRight size={12} />
              </a>
              <a
                href="https://www.seoularts.ac.kr"
                target="_blank"
                rel="noopener noreferrer"
              >
                SeoulArts Official <ArrowUpRight size={12} />
              </a>
            </div>

            <div className="footer-col">
              <span className="footer-col-title">LOCATION</span>
              <p className="footer-address">
                경기도 안산시 단원구 예술대학로 171<br />
                서울예술대학교 마동 디지털아트전공
              </p>
              <p className="footer-contact">
                E: digitalarts@seoularts.ac.kr
              </p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} SEOUL INSTITUTE OF THE ARTS · DIGITAL ARTS. ALL RIGHTS RESERVED.</span>
          <div className="footer-bottom-links">
            <span>CIPHER DESIGN SYSTEM</span>
            <span className="dot">·</span>
            <span>POWERED BY SUPABASE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
