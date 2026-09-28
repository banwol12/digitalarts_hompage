import React, { useEffect } from 'react';
import { X, ExternalLink, ChevronLeft, ChevronRight, Play } from 'lucide-react';

export default function WorkDetailModal({ work, allWorks = [], onClose, onSelectWork }) {
  useEffect(() => {
    if (!work) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [work, allWorks]);

  if (!work) return null;

  const currentIndex = allWorks.findIndex((w) => w.id === work.id || w.slug === work.slug);
  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectWork(allWorks[currentIndex - 1]);
    } else if (allWorks.length > 0) {
      onSelectWork(allWorks[allWorks.length - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < allWorks.length - 1) {
      onSelectWork(allWorks[currentIndex + 1]);
    } else if (allWorks.length > 0) {
      onSelectWork(allWorks[0]);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Top bar with nav and close */}
        <div className="modal-header">
          <div className="modal-nav">
            <button
              type="button"
              onClick={handlePrev}
              className="modal-nav-btn"
              title="이전 작품 (←)"
            >
              <ChevronLeft size={18} />
              <span>PREV</span>
            </button>
            <span className="modal-index">
              {currentIndex >= 0 ? `${currentIndex + 1} / ${allWorks.length}` : ''}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="modal-nav-btn"
              title="다음 작품 (→)"
            >
              <span>NEXT</span>
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="닫기 (ESC)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="modal-body">
          {/* Media Player / Image Area */}
          <div className="modal-media-area">
            {work.video ? (
              <video
                src={work.video}
                controls
                autoPlay
                loop
                playsInline
                className="modal-media-elem"
              />
            ) : work.image ? (
              <img
                src={work.image}
                alt={work.title}
                className="modal-media-elem"
              />
            ) : (
              <div className="modal-media-placeholder">
                <span>미디어가 등록되지 않은 작품입니다.</span>
              </div>
            )}
          </div>

          {/* Details / Text Area */}
          <div className="modal-info">
            <div className="modal-tags">
              <span className="badge-cat">{(work.category || 'installation').toUpperCase()}</span>
              {work.year && <span className="badge-year">{work.year}</span>}
              {work.ratio && <span className="badge-ratio">{work.ratio}</span>}
            </div>

            <h1 className="modal-title">{work.title || '작품 제목'}</h1>
            <div className="modal-artist">
              <span className="artist-label">ARTIST</span>
              <span className="artist-name">{work.student || '학생 이름'}</span>
            </div>

            {/* Tools list */}
            {work.tools && work.tools.length > 0 && (
              <div className="modal-tools">
                <span className="tools-label">TOOLS & TECH</span>
                <div className="tools-pills">
                  {work.tools.map((tool, idx) => (
                    <span key={idx} className="tool-pill">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Statement */}
            {work.statement && (
              <blockquote className="modal-statement">
                "{work.statement}"
              </blockquote>
            )}

            {/* Paragraphs */}
            {work.paragraphs && work.paragraphs.length > 0 && (
              <div className="modal-paragraphs">
                {work.paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            )}

            {/* External URL Link */}
            {work.external_url && (
              <div className="modal-actions">
                <a
                  href={work.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-external"
                >
                  <ExternalLink size={16} />
                  <span>외부 프로젝트 / 전시 링크 방문 ↗</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
