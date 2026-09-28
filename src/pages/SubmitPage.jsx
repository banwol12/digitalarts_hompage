import React, { useEffect, useRef } from 'react';
import { installPortfolioAPI } from '../lib/portfolioApi';

const SUBMIT_CSS = "\n:root {\n  --black: #000000;\n  --bg-deep: #050508;\n  --surface: #0a0a0e;\n  --surface-raised: #121218;\n  --surface-card: rgba(233,234,228,0.03);\n  --surface-hover: rgba(233,234,228,0.06);\n  --bone: #e9eae4;\n  --mist: #e2e6e3;\n  --b70: rgba(233,234,228,0.7);\n  --b45: rgba(233,234,228,0.45);\n  --b24: rgba(233,234,228,0.24);\n  --b12: rgba(233,234,228,0.12);\n  --b06: rgba(233,234,228,0.06);\n  --key: #f4ff53;\n  --key-glow: rgba(244,255,83,0.18);\n  --cyan: #00f0ff;\n  --warn: #ff6b57;\n  --success: #34d399;\n  --font: \"Pretendard\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n  --pm: 40px;\n  --track-tight: -0.02em;\n  --track-caps: 0.08em;\n  --track-wide: 0.16em;\n}\n\n* { box-sizing: border-box; }\nhtml, body {\n  margin: 0;\n  background: var(--bg-deep);\n  color: var(--bone);\n  font: 400 14px/1.6 var(--font);\n  -webkit-font-smoothing: antialiased;\n  min-height: 100vh;\n}\na { color: inherit; text-decoration: none; }\nbutton, input, select, textarea { font: inherit; color: inherit; }\n\n/* \u2500\u2500 \ud5e4\ub354 \u2500\u2500 */\n.hdr {\n  position: sticky; top: 0; z-index: 100;\n  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 20px;\n  padding: 16px var(--pm);\n  background: rgba(5,5,8,0.85);\n  backdrop-filter: blur(20px);\n  -webkit-backdrop-filter: blur(20px);\n  border-bottom: 1px solid var(--b12);\n}\n.brand {\n  display: flex; align-items: center; gap: 12px;\n  font-weight: 600; font-size: 17px; line-height: 1;\n  letter-spacing: 0.01em; word-spacing: -0.03em;\n  color: var(--bone);\n}\n.brand .mark { width: 30px; height: 32px; flex: none; color: var(--bone); }\n.brand .mark svg { width: 100%; height: 100%; fill: currentColor; }\n.hdr .center {\n  display: flex; gap: 24px; justify-content: center; font-size: 14px; letter-spacing: var(--track-caps); text-transform: uppercase;\n}\n.hdr .center a {\n  color: var(--bone); opacity: 0.5; transition: opacity 0.2s ease, color 0.2s ease;\n}\n.hdr .center a:hover, .hdr .center a.is-active {\n  opacity: 1; color: #fff;\n}\n.hdr .right {\n  display: flex; justify-content: flex-end; align-items: center; gap: 12px;\n}\n\n/* \u2500\u2500 \uba54\uc778 \ub808\uc774\uc544\uc6c3 \u2500\u2500 */\n.wrap {\n  padding: 40px var(--pm) 100px;\n  max-width: 1280px; margin: 0 auto;\n}\n.hero-head {\n  margin-bottom: 36px;\n  display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap;\n  border-bottom: 1px solid var(--b12); padding-bottom: 24px;\n}\n.hero-kicker {\n  font-size: 11px; letter-spacing: var(--track-wide); text-transform: uppercase; color: var(--key); margin-bottom: 8px;\n}\n.hero-head h1 {\n  font-size: clamp(2rem, 3.8vw, 3rem); font-weight: 500; line-height: 1.15; margin: 0;\n  letter-spacing: var(--track-tight); color: #fff;\n}\n.hero-desc {\n  color: var(--b70); max-width: 58ch; margin-top: 10px; font-size: 14px;\n}\n\n/* 2\uceec\ub7fc \ub808\uc774\uc544\uc6c3: \uc88c\uce21 \ud3fc, \uc6b0\uce21 \uc2e4\uc2dc\uac04 \ud504\ub9ac\ubdf0 */\n.studio-grid {\n  display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(360px, 1fr);\n  gap: 48px; align-items: start;\n}\n\n/* \ud3fc \uc2a4\ud0c0\uc77c */\n.studio-form {\n  display: flex; flex-direction: column; gap: 36px;\n}\n.form-section {\n  display: flex; flex-direction: column; gap: 20px;\n  padding: 24px; background: var(--surface-card);\n  border: 1px solid var(--b12); position: relative;\n}\n.section-title {\n  display: flex; align-items: center; justify-content: space-between;\n  font-size: 11px; letter-spacing: var(--track-wide); text-transform: uppercase;\n  color: var(--b45); border-bottom: 1px solid var(--b06); padding-bottom: 10px;\n}\n.section-title b { color: var(--bone); font-weight: 600; }\n.field-grid-2 {\n  display: grid; grid-template-columns: 1fr 1fr; gap: 20px;\n}\n.field {\n  display: flex; flex-direction: column; gap: 7px; position: relative;\n}\n.field label {\n  font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--b70);\n  display: flex; justify-content: space-between;\n}\n.field label .req { color: var(--key); }\n.field input, .field select, .field textarea {\n  width: 100%; background: rgba(0,0,0,0.4);\n  border: 1px solid var(--b24); padding: 11px 14px;\n  color: #fff; font-size: 14px; outline: none; border-radius: 0;\n  transition: border-color 0.2s ease, box-shadow 0.2s ease;\n}\n.field input:focus, .field select:focus, .field textarea:focus {\n  border-color: var(--bone);\n  box-shadow: 0 0 0 1px var(--bone);\n}\n.field select option { background: #121218; color: #fff; }\n.field textarea { resize: vertical; min-height: 80px; }\n.field .hint {\n  font-size: 11px; color: var(--b45); line-height: 1.4;\n}\n.field.is-bad input, .field.is-bad textarea, .field.is-bad select {\n  border-color: var(--warn);\n}\n.field.is-bad .hint { color: var(--warn); }\n\n/* \uce74\ud14c\uace0\ub9ac \uce69 \uc120\ud0dd\uae30 */\n.cat-chips {\n  display: flex; flex-wrap: wrap; gap: 8px;\n}\n.cat-chip {\n  padding: 8px 14px; font-size: 12px; letter-spacing: 0.04em;\n  border: 1px solid var(--b24); background: rgba(0,0,0,0.3);\n  cursor: pointer; transition: all 0.15s ease; text-transform: uppercase;\n}\n.cat-chip:hover { border-color: var(--bone); }\n.cat-chip.is-active {\n  background: var(--bone); color: #000; border-color: var(--bone); font-weight: 600;\n}\n\n/* \ud234 \ud0dc\uadf8 \ud074\ub77c\uc6b0\ub4dc */\n.tool-chips {\n  display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;\n}\n.tool-chip {\n  padding: 4px 10px; font-size: 11px; border: 1px solid var(--b12);\n  background: rgba(255,255,255,0.02); color: var(--b70); cursor: pointer;\n  transition: all 0.15s ease;\n}\n.tool-chip:hover { border-color: var(--b45); color: #fff; }\n.tool-chip.is-active {\n  background: var(--key-glow); color: var(--key); border-color: var(--key);\n}\n\n/* \ub4dc\ub86d\uc874 \ubc0f \ubbf8\ub514\uc5b4 \uc5c5\ub85c\ub4dc */\n.dropzone {\n  border: 1px dashed var(--b24); background: rgba(0,0,0,0.35);\n  padding: 24px; text-align: center; cursor: pointer;\n  display: flex; flex-direction: column; align-items: center; justify-content: center;\n  gap: 10px; transition: border-color 0.2s ease, background-color 0.2s ease;\n  position: relative; min-height: 160px;\n}\n.dropzone.dragover, .dropzone:hover {\n  border-color: var(--bone); background: rgba(233,234,228,0.04);\n}\n.dropzone input[type=file] {\n  position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;\n}\n.dropzone .dz-icon { font-size: 28px; opacity: 0.7; }\n.dropzone .dz-text { font-size: 13px; color: var(--bone); }\n.dropzone .dz-hint { font-size: 11px; color: var(--b45); }\n.thumb-preview-box {\n  position: relative; width: 100%; aspect-ratio: 16/10;\n  overflow: hidden; background: #000; border: 1px solid var(--b24);\n  display: none;\n}\n.thumb-preview-box img, .thumb-preview-box video {\n  width: 100%; height: 100%; object-fit: cover;\n}\n.thumb-preview-box .remove-media {\n  position: absolute; top: 8px; right: 8px;\n  background: rgba(0,0,0,0.8); border: 1px solid var(--b45);\n  color: #fff; font-size: 10px; padding: 4px 8px; cursor: pointer;\n}\n.thumb-preview-box .remove-media:hover { background: var(--warn); border-color: var(--warn); }\n\n/* \uc601\uc0c1 \uc785\ub825 \ud0ed */\n.tab-row {\n  display: flex; gap: 8px; margin-bottom: 10px; border-bottom: 1px solid var(--b12);\n  padding-bottom: 8px;\n}\n.tab-btn {\n  font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;\n  padding: 4px 10px; border: none; background: transparent; color: var(--b45);\n  cursor: pointer;\n}\n.tab-btn.is-active { color: var(--bone); font-weight: 600; border-bottom: 2px solid var(--bone); }\n\n/* \ub3d9\uc758 \ubc0f \uc2a4\uc704\uce58 */\n.check-row {\n  display: flex; gap: 12px; align-items: flex-start; font-size: 13px; color: var(--b70); cursor: pointer;\n}\n.check-row input[type=checkbox] {\n  width: 16px; height: 16px; margin-top: 3px; accent-color: var(--key); cursor: pointer; flex: none;\n}\n\n/* \uc81c\ucd9c \ubc84\ud2bc */\n.submit-btn {\n  width: 100%; padding: 18px 24px;\n  background: var(--bone); color: #000;\n  border: 1px solid var(--bone); font-size: 14px; font-weight: 600;\n  letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer;\n  display: flex; align-items: center; justify-content: center; gap: 10px;\n  transition: all 0.2s ease;\n}\n.submit-btn:hover:not(:disabled) {\n  background: #fff; box-shadow: 0 0 24px rgba(255,255,255,0.25);\n}\n.submit-btn:disabled {\n  opacity: 0.4; cursor: not-allowed;\n}\n.status-msg {\n  min-height: 24px; font-size: 13px; text-align: center; color: var(--b70);\n}\n.status-msg.err { color: var(--warn); }\n.status-msg.ok { color: var(--success); }\n\n/* \u2500\u2500 \uc6b0\uce21 \ud504\ub9ac\ubdf0 \ud328\ub110 (Sticky) \u2500\u2500 */\n.preview-panel {\n  position: sticky; top: 88px;\n  display: flex; flex-direction: column; gap: 16px;\n}\n.preview-header {\n  display: flex; justify-content: space-between; align-items: center;\n  font-size: 11px; letter-spacing: var(--track-wide); text-transform: uppercase; color: var(--b45);\n}\n.preview-card {\n  border: 1px solid var(--b24); background: #08080c;\n  overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);\n  transition: all 0.3s ease;\n}\n.preview-card-media {\n  width: 100%; aspect-ratio: 16/10; background: #000;\n  position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;\n}\n.preview-card-media img, .preview-card-media video {\n  width: 100%; height: 100%; object-fit: cover;\n}\n.preview-card-media canvas {\n  width: 100%; height: 100%; object-fit: cover;\n}\n.preview-card-media .empty-badge {\n  position: absolute; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;\n  color: var(--b45); border: 1px dashed var(--b24); padding: 8px 16px; pointer-events: none;\n}\n.preview-card-body {\n  padding: 20px; display: flex; flex-direction: column; gap: 10px;\n}\n.preview-meta-row {\n  display: flex; justify-content: space-between; align-items: center;\n  font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--b45);\n}\n.preview-meta-row .pill {\n  padding: 2px 6px; border: 1px solid var(--b24); color: var(--bone);\n}\n.preview-title {\n  font-size: 20px; font-weight: 500; color: #fff; margin: 0; line-height: 1.3;\n}\n.preview-artist {\n  font-size: 13px; color: var(--b70);\n}\n.preview-statement {\n  font-size: 13px; color: var(--b70); font-style: italic; border-left: 2px solid var(--b24);\n  padding-left: 10px; margin-top: 4px; line-height: 1.5;\n}\n.preview-tools {\n  display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;\n}\n.preview-tool-tag {\n  font-size: 10px; padding: 2px 6px; background: var(--b06);\n  border: 1px solid var(--b12); color: var(--b70);\n}\n\n/* \u2500\u2500 \uc644\ub8cc \ud654\uba74 (Done Screen) \u2500\u2500 */\n.done-container {\n  display: none; max-width: 680px; margin: 40px auto;\n  border: 1px solid var(--b24); background: #08080c; padding: 40px;\n}\n.done-container.is-active { display: flex; flex-direction: column; gap: 28px; }\n.done-icon {\n  width: 52px; height: 52px; border-radius: 50%; background: rgba(52,211,153,0.12);\n  border: 1px solid var(--success); color: var(--success);\n  display: flex; align-items: center; justify-content: center; font-size: 24px;\n}\n.done-actions {\n  display: flex; gap: 12px; flex-wrap: wrap; margin-top: 10px;\n}\n.btn-outline {\n  display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px;\n  border: 1px solid var(--b24); color: var(--bone); font-size: 12px;\n  letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer;\n  background: transparent; transition: all 0.2s ease;\n}\n.btn-outline:hover { border-color: #fff; color: #fff; }\n.btn-primary {\n  display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px;\n  border: 1px solid var(--key); color: #000; font-size: 12px; font-weight: 600;\n  letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer;\n  background: var(--key); transition: all 0.2s ease;\n}\n.btn-primary:hover { background: #fff; border-color: #fff; }\n\n\n\n@media (max-width: 960px) {\n  :root { --pm: 20px; }\n  .studio-grid { grid-template-columns: 1fr; }\n  .preview-panel { position: static; margin-top: 30px; }\n  .field-grid-2 { grid-template-columns: 1fr; }\n}\n";
const SUBMIT_MARKUP = "<svg width=\"0\" height=\"0\" style=\"position:absolute\" aria-hidden=\"true\">\n  <symbol id=\"logo\" viewBox=\"0 0 32 34\">\n    <path id=\"logo-path\" d=\"M22 0h1v1h-1zM12 1h5v1h-5zM22 1h1v1h-1zM9 2h12v1h-12zM23 2h1v1h-1zM7 3h15v1h-15zM23 3h1v1h-1zM6 4h16v1h-16zM23 4h1v1h-1zM5 5h17v1h-17zM23 5h1v1h-1zM26 5h1v1h-1zM4 6h13v1h-13zM18 6h4v1h-4zM23 6h1v1h-1zM26 6h1v1h-1zM3 7h14v1h-14zM18 7h4v1h-4zM23 7h1v1h-1zM26 7h2v1h-2zM2 8h15v1h-15zM19 8h2v1h-2zM23 8h1v1h-1zM25 8h3v1h-3zM1 9h16v1h-16zM19 9h1v1h-1zM22 9h2v1h-2zM25 9h3v1h-3zM1 10h16v1h-16zM19 10h1v1h-1zM22 10h1v1h-1zM25 10h4v1h-4zM30 10h1v1h-1zM1 11h10v1h-10zM12 11h5v1h-5zM21 11h2v1h-2zM25 11h4v1h-4zM30 11h1v1h-1zM0 12h11v1h-11zM13 12h4v1h-4zM21 12h2v1h-2zM24 12h2v1h-2zM27 12h2v1h-2zM30 12h1v1h-1zM0 13h12v1h-12zM13 13h4v1h-4zM20 13h2v1h-2zM24 13h2v1h-2zM27 13h1v1h-1zM30 13h2v1h-2zM0 14h12v1h-12zM14 14h2v1h-2zM20 14h2v1h-2zM24 14h2v1h-2zM27 14h1v1h-1zM29 14h3v1h-3zM0 15h12v1h-12zM14 15h2v1h-2zM20 15h2v1h-2zM24 15h2v1h-2zM27 15h1v1h-1zM29 15h3v1h-3zM0 16h12v1h-12zM14 16h2v1h-2zM19 16h3v1h-3zM24 16h2v1h-2zM29 16h3v1h-3zM0 17h12v1h-12zM14 17h2v1h-2zM18 17h4v1h-4zM25 17h1v1h-1zM29 17h3v1h-3zM0 18h8v1h-8zM9 18h3v1h-3zM14 18h1v1h-1zM18 18h4v1h-4zM25 18h1v1h-1zM29 18h3v1h-3zM0 19h7v1h-7zM9 19h2v1h-2zM18 19h5v1h-5zM25 19h2v1h-2zM29 19h3v1h-3zM0 20h7v1h-7zM9 20h2v1h-2zM18 20h5v1h-5zM26 20h1v1h-1zM29 20h3v1h-3zM1 21h6v1h-6zM9 21h2v1h-2zM14 21h2v1h-2zM19 21h4v1h-4zM28 21h1v1h-1zM30 21h2v1h-2zM1 22h6v1h-6zM9 22h1v1h-1zM13 22h3v1h-3zM19 22h5v1h-5zM30 22h1v1h-1zM1 23h6v1h-6zM9 23h1v1h-1zM13 23h2v1h-2zM20 23h4v1h-4zM30 23h1v1h-1zM2 24h5v1h-5zM9 24h2v1h-2zM13 24h2v1h-2zM20 24h5v1h-5zM29 24h2v1h-2zM2 25h6v1h-6zM10 25h1v1h-1zM14 25h2v1h-2zM21 25h5v1h-5zM29 25h1v1h-1zM3 26h3v1h-3zM7 26h1v1h-1zM14 26h2v1h-2zM18 26h1v1h-1zM21 26h5v1h-5zM28 26h1v1h-1zM4 27h2v1h-2zM15 27h1v1h-1zM18 27h1v1h-1zM23 27h3v1h-3zM28 27h1v1h-1zM5 28h2v1h-2zM16 28h1v1h-1zM18 28h2v1h-2zM24 28h1v1h-1zM27 28h1v1h-1zM6 29h2v1h-2zM19 29h3v1h-3zM7 30h2v1h-2zM11 30h3v1h-3zM20 30h3v1h-3zM11 31h3v1h-3zM20 31h4v1h-4zM11 32h4v1h-4zM21 32h3v1h-3zM12 33h3v1h-3z\"/>\n  </symbol>\n</svg>\n<header class=\"hdr\">\n  <a class=\"brand\" href=\"index.html\" aria-label=\"\uba54\uc778 \ud398\uc774\uc9c0\ub85c\">\n    <span class=\"mark\"><svg><use href=\"#logo\"/></svg></span>\n    <span>Digital Arts Archive</span>\n  </a>\n  <nav class=\"center\">\n    <a href=\"portfolio.html#/\">/orbit</a>\n    <a href=\"portfolio.html#/works\">/works</a>\n    <a href=\"submit.html\" class=\"is-active\">/submit</a>\n  </nav>\n  <div class=\"right\">\n    <a href=\"portfolio.html#/works\" style=\"font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:var(--b70);transition:color .2s;\">\u2190 \uac24\ub7ec\ub9ac \ub458\ub7ec\ubcf4\uae30</a>\n  </div>\n</header>\n\n<main class=\"wrap\">\n  <!-- \ud788\uc5b4\ub85c \ud5e4\ub354 -->\n  <div class=\"hero-head\">\n    <div>\n      <div class=\"hero-kicker\">01 // PORTFOLIO REGISTRATION</div>\n      <h1>\uc2e0\uaddc \ud3ec\ud2b8\ud3f4\ub9ac\uc624 \ub4f1\ub85d</h1>\n      <p class=\"hero-desc\">\n        \uc11c\uc6b8\uc608\uc220\ub300\ud559\uad50 \ub514\uc9c0\ud138\uc544\ud2b8\uc804\uacf5 \ud559\uc0dd \uc791\uc5c5 \uc544\uce74\uc774\ube0c\uc5d0 \uc791\ud488\uc744 \ub4f1\ub85d\ud569\ub2c8\ub2e4.\n        \ub4f1\ub85d\ub41c \uc791\ud488\uc740 3D \uc778\ud130\ub799\ud2f0\ube0c \uada4\ub3c4\uc640 \uc544\uce74\uc774\ube0c \uac24\ub7ec\ub9ac\uc5d0 \uc2e4\uc2dc\uac04\uc73c\ub85c \uc804\uc2dc\ub429\ub2c8\ub2e4.\n      </p>\n    </div>\n  </div>\n\n  <!-- 2\uceec\ub7fc \uc2a4\ud29c\ub514\uc624 \uadf8\ub9ac\ub4dc -->\n  <div class=\"studio-grid\" id=\"studio-grid\">\n    <!-- \uc88c\uce21 \ub4f1\ub85d \ud3fc -->\n    <form class=\"studio-form\" id=\"submit-form\" novalidate>\n\n      <!-- 1. \uae30\ubcf8 \uc815\ubcf4 -->\n      <section class=\"form-section\">\n        <div class=\"section-title\">\n          <span><b>01</b> / METADATA</span>\n          <span>\uae30\ubcf8 \uc815\ubcf4</span>\n        </div>\n\n        <div class=\"field-grid-2\">\n          <div class=\"field\" data-f=\"title\">\n            <label>\uc791\ud488 \uc81c\ubaa9 <span class=\"req\">*</span></label>\n            <input type=\"text\" name=\"title\" placeholder=\"\uc608: Pixel Bloom, Synthetic Reverie\" required>\n            <span class=\"hint\">\ud3ec\ud2b8\ud3f4\ub9ac\uc624 \uce74\ub4dc\uc640 \uc0c1\uc138 \ud398\uc774\uc9c0\uc5d0 \ud45c\uc2dc\ub418\ub294 \uc81c\ubaa9</span>\n          </div>\n\n          <div class=\"field\" data-f=\"student\">\n            <label>\uc791\uac00 / \ud559\uc0dd \uc774\ub984 <span class=\"req\">*</span></label>\n            <input type=\"text\" name=\"student\" placeholder=\"\uc608: \uae40\uc608\uc220, \ud300 \uc570\ube44\uc5b8\ud2b8\" required>\n            <span class=\"hint\">\ubcf8\uc778 \uc774\ub984 \ub610\ub294 \ud300\uba85</span>\n          </div>\n        </div>\n\n        <div class=\"field-grid-2\">\n          <div class=\"field\" data-f=\"email\">\n            <label>\uc5f0\ub77d\uc6a9 \uc774\uba54\uc77c <span class=\"req\">*</span></label>\n            <input type=\"email\" name=\"email\" placeholder=\"student@seoularts.ac.kr\" required>\n            <span class=\"hint\">\ub4f1\ub85d \ubc0f \uc0c1\ud0dc \uc54c\ub9bc\uc6a9 (\uc678\ubd80 \ube44\uacf5\uac1c)</span>\n          </div>\n\n          <div class=\"field\" data-f=\"year\">\n            <label>\uc81c\uc791 \uc5f0\ub3c4</label>\n            <input type=\"text\" name=\"year\" id=\"field-year\" value=\"2025\" placeholder=\"2025\">\n            <span class=\"hint\">\uc81c\uc791 \ub610\ub294 \uc804\uc2dc \uc5f0\ub3c4</span>\n          </div>\n        </div>\n\n        <div class=\"field\" data-f=\"category\">\n          <label>\ubd84\uc57c \uce74\ud14c\uace0\ub9ac <span class=\"req\">*</span></label>\n          <div class=\"cat-chips\" id=\"cat-chips\">\n            <button type=\"button\" class=\"cat-chip is-active\" data-cat=\"installation\">Interactive Installation</button>\n            <button type=\"button\" class=\"cat-chip\" data-cat=\"mapping\">Projection Mapping</button>\n            <button type=\"button\" class=\"cat-chip\" data-cat=\"animation\">3D & Animation</button>\n            <button type=\"button\" class=\"cat-chip\" data-cat=\"vfx\">VFX & CGI</button>\n            <button type=\"button\" class=\"cat-chip\" data-cat=\"game\">Game Engine & XR</button>\n            <button type=\"button\" class=\"cat-chip\" data-cat=\"audio-visual\">Audio-Visual</button>\n          </div>\n          <input type=\"hidden\" name=\"category\" id=\"cat-input\" value=\"installation\">\n        </div>\n      </section>\n\n      <!-- 2. \uc791\ud488 \uc11c\uc0ac & \uae30\uc220 \uc2a4\ud0dd -->\n      <section class=\"form-section\">\n        <div class=\"section-title\">\n          <span><b>02</b> / NARRATIVE & TECH</span>\n          <span>\uc791\ud488 \uc11c\uc0ac & \ub3c4\uad6c</span>\n        </div>\n\n        <div class=\"field\" data-f=\"statement\">\n          <label>\ud55c \ubb38\uc7a5 \uc2a4\ud14c\uc774\ud2b8\uba3c\ud2b8 <span class=\"req\">*</span></label>\n          <textarea name=\"statement\" rows=\"2\" placeholder=\"\uc791\ud488\uc744 \uad00\ud1b5\ud558\ub294 \ucca0\ud559 \ub610\ub294 \ud575\uc2ec \ucf58\uc149\ud2b8\ub97c \ud55c \ubb38\uc7a5\uc73c\ub85c \uc801\uc5b4\uc8fc\uc138\uc694.\" required></textarea>\n          <span class=\"hint\">\ud3ec\ud2b8\ud3f4\ub9ac\uc624 \uccab \ud654\uba74\uacfc \uba54\uc778 \ud5e4\ub4dc\ub77c\uc778\uc5d0 \uac15\uc870\ub429\ub2c8\ub2e4.</span>\n        </div>\n\n        <div class=\"field\" data-f=\"paragraphs\">\n          <label>\uc791\ud488 \uc0c1\uc138 \uc124\uba85 & \uc81c\uc791 \uacfc\uc815</label>\n          <textarea name=\"paragraphs\" rows=\"5\" placeholder=\"\uc791\ud488 \uac1c\uc694, \uc81c\uc791 \uacc4\uae30, \uc0ac\uc6a9\ub41c \uc778\ud130\ub799\uc158 \uae30\ubc95, \uacb0\uacfc \ubc0f \uad00\uac1d \ubc18\uc751 \ub4f1\uc744 \uc790\uc720\ub86d\uac8c \uc801\uc5b4\uc8fc\uc138\uc694. (\ubb38\ub2e8\uc740 \ube48 \uc904\ub85c \uad6c\ubd84)\"></textarea>\n          <span class=\"hint\">\uc791\ud488 \uc0c1\uc138 \ud398\uc774\uc9c0 \ubcf8\ubb38\uc73c\ub85c \uad6c\uc131\ub429\ub2c8\ub2e4.</span>\n        </div>\n\n        <div class=\"field\" data-f=\"tools\">\n          <label>\uc0ac\uc6a9 \uae30\uc220 & \uc18c\ud504\ud2b8\uc6e8\uc5b4 \ub3c4\uad6c</label>\n          <input type=\"text\" name=\"tools\" id=\"tools-input\" placeholder=\"TouchDesigner, Unreal Engine 5, GLSL (\uc27c\ud45c\ub85c \uad6c\ubd84)\">\n          <div class=\"tool-chips\" id=\"tool-presets\">\n            <span class=\"tool-chip\" data-val=\"TouchDesigner\">+ TouchDesigner</span>\n            <span class=\"tool-chip\" data-val=\"Unreal Engine 5\">+ Unreal Engine 5</span>\n            <span class=\"tool-chip\" data-val=\"Unity\">+ Unity</span>\n            <span class=\"tool-chip\" data-val=\"Blender\">+ Blender</span>\n            <span class=\"tool-chip\" data-val=\"Processing\">+ Processing</span>\n            <span class=\"tool-chip\" data-val=\"GLSL / Shader\">+ GLSL</span>\n            <span class=\"tool-chip\" data-val=\"Arduino\">+ Arduino</span>\n            <span class=\"tool-chip\" data-val=\"Max/MSP\">+ Max/MSP</span>\n            <span class=\"tool-chip\" data-val=\"Three.js\">+ Three.js</span>\n            <span class=\"tool-chip\" data-val=\"Generative AI\">+ Generative AI</span>\n          </div>\n        </div>\n      </section>\n\n      <!-- 3. \uc2dc\uac01 \ubbf8\ub514\uc5b4 & \uc601\uc0c1 -->\n      <section class=\"form-section\">\n        <div class=\"section-title\">\n          <span><b>03</b> / VISUAL MEDIA</span>\n          <span>\ub300\ud45c \uc774\ubbf8\uc9c0 & \uc601\uc0c1</span>\n        </div>\n\n        <div class=\"field\" data-f=\"image\">\n          <label>\ub300\ud45c \uc774\ubbf8\uc9c0 (Key Visual) <span class=\"req\">*</span></label>\n          <div class=\"dropzone\" id=\"img-dropzone\">\n            <input type=\"file\" name=\"image\" id=\"file-image\" accept=\"image/*\">\n            <div class=\"dz-icon\">\ud83d\uddbc\ufe0f</div>\n            <div class=\"dz-text\">\ub300\ud45c \uc774\ubbf8\uc9c0 \ub4dc\ub798\uadf8 & \ub4dc\ub86d \ub610\ub294 \ud30c\uc77c \uc120\ud0dd</div>\n            <div class=\"dz-hint\">JPG, PNG, GIF, WebP (\ucd5c\ub300 15MB) \u00b7 \uc120\ud0dd \uc2dc \uac00\ub85c\uc138\ub85c \ube44\uc728\uc774 \uc790\ub3d9 \uacc4\uc0b0\ub429\ub2c8\ub2e4</div>\n          </div>\n          <div class=\"thumb-preview-box\" id=\"img-preview-box\">\n            <img src=\"\" id=\"img-preview-el\" alt=\"Uploaded Thumbnail\">\n            <button type=\"button\" class=\"remove-media\" id=\"remove-img-btn\">\uc0ad\uc81c / \ub2e4\uc2dc \uc120\ud0dd</button>\n          </div>\n        </div>\n\n        <div class=\"field\" data-f=\"ratio\">\n          <label>\uada4\ub3c4 \ud0c0\uc77c \ud654\uba74\ube44</label>\n          <select name=\"ratio\" id=\"ratio-select\">\n            <option value=\"16:10\">16:10 (\uae30\ubcf8 \uc640\uc774\ub4dc)</option>\n            <option value=\"16:9\">16:9 (HD \uc640\uc774\ub4dc)</option>\n            <option value=\"21:9\">21:9 (\uc2dc\ub124\ub9c8\ud2f1 \uc6b8\ud2b8\ub77c\uc640\uc774\ub4dc)</option>\n            <option value=\"3:2\">3:2 (\uc0ac\uc9c4 \ud45c\uc900)</option>\n            <option value=\"5:4\">5:4 (\ubc15\uc2a4 \ubdf0)</option>\n            <option value=\"1:1\">1:1 (\uc815\uc0ac\uac01\ud615)</option>\n            <option value=\"4:5\">4:5 (\ubc84\ud2f0\uceec \uce74\ub4dc)</option>\n            <option value=\"9:16\">9:16 (\ub9b4\uc2a4/\uc20f\ud3fc \uc138\ub85c)</option>\n          </select>\n          <span class=\"hint\">\uc774\ubbf8\uc9c0\ub97c \ub4f1\ub85d\ud558\uba74 \ucd5c\uc801\uc758 \ud654\uba74\ube44\uac00 \uc790\ub3d9 \uc124\uc815\ub429\ub2c8\ub2e4.</span>\n        </div>\n\n        <div class=\"field\" data-f=\"video\">\n          <label>\uc601\uc0c1 \ubbf8\ub514\uc5b4 (\uc120\ud0dd \uc0ac\ud56d)</label>\n          <div class=\"tab-row\">\n            <button type=\"button\" class=\"tab-btn is-active\" data-vtab=\"url\">\uc678\ubd80 \uc601\uc0c1 \ub9c1\ud06c (YouTube / Vimeo / MP4)</button>\n            <button type=\"button\" class=\"tab-btn\" data-vtab=\"file\">\ube44\ub514\uc624 \ud30c\uc77c \uc9c1\uc811 \uc5c5\ub85c\ub4dc (50MB \uc774\ud558)</button>\n          </div>\n\n          <div id=\"vtab-url-wrap\">\n            <input type=\"url\" name=\"video_url\" id=\"video-url-input\" placeholder=\"https://www.youtube.com/watch?v=... \ub610\ub294 \uc9c1\uc811 \uc2a4\ud2b8\ub9bc URL\">\n            <span class=\"hint\">\uc720\ud29c\ube0c, \ube44\uba54\uc624, \ub610\ub294 \uc9c1\uc811 \ud638\uc2a4\ud305\ub41c MP4/WebM \ub9c1\ud06c</span>\n          </div>\n\n          <div id=\"vtab-file-wrap\" style=\"display:none;\">\n            <div class=\"dropzone\" id=\"vid-dropzone\" style=\"min-height: 120px;\">\n              <input type=\"file\" name=\"video\" id=\"file-video\" accept=\"video/mp4,video/webm\">\n              <div class=\"dz-icon\">\ud83c\udfac</div>\n              <div class=\"dz-text\">\uc601\uc0c1 \ud30c\uc77c \ub4dc\ub798\uadf8 & \ub4dc\ub86d (MP4, WebM)</div>\n              <div class=\"dz-hint\">\ucd5c\ub300 50MB \u00b7 \ud3ec\ud2b8\ud3f4\ub9ac\uc624 \uada4\ub3c4 \ubc0f \uc0c1\uc138 \ud398\uc774\uc9c0\uc5d0\uc11c \ubc30\uacbd \uc7ac\uc0dd\ub429\ub2c8\ub2e4.</div>\n            </div>\n            <div class=\"thumb-preview-box\" id=\"vid-preview-box\" style=\"margin-top: 10px;\">\n              <video src=\"\" id=\"vid-preview-el\" muted loop autoplay playsinline></video>\n              <button type=\"button\" class=\"remove-media\" id=\"remove-vid-btn\">\uc601\uc0c1 \ucde8\uc18c</button>\n            </div>\n          </div>\n        </div>\n\n        <div class=\"field\" data-f=\"external_url\">\n          <label>\ub77c\uc774\ube0c \ud504\ub85c\uc81d\ud2b8 / \uc678\ubd80 \ub370\ubaa8 \ub9c1\ud06c (\uc120\ud0dd)</label>\n          <input type=\"url\" name=\"external_url\" placeholder=\"https://my-interactive-project.vercel.app \ub610\ub294 GitHub / Behance\">\n          <span class=\"hint\">\uad00\uac1d\uc774 \uc9c1\uc811 \uc870\uc791\ud574\ubcfc \uc218 \uc788\ub294 \uc6f9GL \ub370\ubaa8, \uae43\ud5c8\ube0c, \ube44\ud578\uc2a4 \ub4f1</span>\n        </div>\n      </section>\n\n      <!-- 4. \uacf5\uac1c \uc124\uc815 \ubc0f \uc81c\ucd9c -->\n      <section class=\"form-section\">\n        <div class=\"section-title\">\n          <span><b>04</b> / PUBLISH</span>\n          <span>\uac8c\uc2dc \ubc0f \ub3d9\uc758</span>\n        </div>\n\n        <div class=\"field\">\n          <label>\uacf5\uac1c \uc0c1\ud0dc \uc124\uc815</label>\n          <select name=\"published_mode\" id=\"published-mode\">\n            <option value=\"direct\">\uc989\uc2dc \ud3ec\ud2b8\ud3f4\ub9ac\uc624 \uac24\ub7ec\ub9ac\uc5d0 \uacf5\uac1c (Direct Live Publish)</option>\n            <option value=\"pending\">\ube44\uacf5\uac1c \uac80\ud1a0 \ub300\uae30 \uc0c1\ud0dc\ub85c \ub4f1\ub85d (Pending Review)</option>\n          </select>\n          <span class=\"hint\">\uc989\uc2dc \uacf5\uac1c \uc120\ud0dd \uc2dc \uc81c\ucd9c \uc989\uc2dc \ud3ec\ud2b8\ud3f4\ub9ac\uc624 \uccab \ud654\uba74\uacfc \uac24\ub7ec\ub9ac\uc5d0 \ub178\ucd9c\ub429\ub2c8\ub2e4.</span>\n        </div>\n\n        <div class=\"field\" data-f=\"submitter_note\">\n          <label>\uc804\uacf5\uc5d0 \ub0a8\uae38 \ub9d0 (\uc120\ud0dd)</label>\n          <textarea name=\"submitter_note\" rows=\"2\" placeholder=\"\uc804\uc2dc \uc774\ub825, \uacf5\ub3d9 \uc81c\uc791\uc790 \uba85\ub2e8, \ub610\ub294 \uad00\ub9ac\uc790\uc5d0\uac8c \uc804\ub2ec\ud560 \uba54\ubaa8\"></textarea>\n        </div>\n\n        <label class=\"check-row\">\n          <input type=\"checkbox\" name=\"agree\" id=\"agree-check\" checked required>\n          <span>\uc81c\ucd9c\ud55c \uc791\ud488\uacfc \uc774\ubbf8\uc9c0\u00b7\uc601\uc0c1 \ubbf8\ub514\uc5b4\uac00 \uc11c\uc6b8\uc608\uc220\ub300\ud559\uad50 \ub514\uc9c0\ud138\uc544\ud2b8\uc804\uacf5 \ud3ec\ud2b8\ud3f4\ub9ac\uc624 \uc544\uce74\uc774\ube0c\uc5d0 \uc804\uc2dc \ubc0f \uac8c\uc2dc\ub418\ub294 \uac83\uc5d0 \ub3d9\uc758\ud569\ub2c8\ub2e4. \uc800\uc791\uad8c\uc740 \ucc3d\uc791\uc790\uc5d0\uac8c \uc788\uc73c\uba70 \uc5b8\uc81c\ub4e0 \uc218\uc815\uc744 \uc694\uccad\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.</span>\n        </label>\n\n        <div>\n          <button type=\"submit\" class=\"submit-btn\" id=\"submit-btn\">\n            <span>\u2726 \ud3ec\ud2b8\ud3f4\ub9ac\uc624 \uc791\ud488 \ub4f1\ub85d\ud558\uae30</span>\n          </button>\n          <div class=\"status-msg\" id=\"status-msg\"></div>\n        </div>\n      </section>\n    </form>\n\n    <!-- \uc6b0\uce21 \uc2e4\uc2dc\uac04 \ud504\ub9ac\ubdf0 \ud328\ub110 -->\n    <aside class=\"preview-panel\">\n      <div class=\"preview-header\">\n        <span>LIVE EXHIBITION PREVIEW</span>\n        <span>\uc2e4\uc2dc\uac04 \uac24\ub7ec\ub9ac \uce74\ub4dc \ubbf8\ub9ac\ubcf4\uae30</span>\n      </div>\n\n      <div class=\"preview-card\" id=\"live-preview-card\">\n        <div class=\"preview-card-media\" id=\"preview-media-container\">\n          <canvas id=\"preview-canvas\" width=\"480\" height=\"300\"></canvas>\n          <div class=\"empty-badge\" id=\"preview-empty-badge\">KEY VISUAL PREVIEW</div>\n        </div>\n        <div class=\"preview-card-body\">\n          <div class=\"preview-meta-row\">\n            <span class=\"pill\" id=\"pv-category\">INSTALLATION</span>\n            <span id=\"pv-year\">2025</span>\n          </div>\n          <h3 class=\"preview-title\" id=\"pv-title\">\uc791\ud488 \uc81c\ubaa9\uc744 \uc785\ub825\ud558\uc138\uc694</h3>\n          <div class=\"preview-artist\" id=\"pv-student\">\uc791\uac00\uba85</div>\n          <div class=\"preview-statement\" id=\"pv-statement\">\"\uc791\ud488\uc744 \uad00\ud1b5\ud558\ub294 \ud55c \ubb38\uc7a5 \uc2a4\ud14c\uc774\ud2b8\uba3c\ud2b8\"</div>\n          <div class=\"preview-tools\" id=\"pv-tools\">\n            <span class=\"preview-tool-tag\">Interactive Media</span>\n          </div>\n        </div>\n      </div>\n\n      <div style=\"font-size:11px;color:var(--b45);line-height:1.5;\">\n        \ud83d\udca1 \uc88c\uce21\uc5d0\uc11c \uc815\ubcf4\ub97c \uc785\ub825\ud558\uac70\ub098 \uc774\ubbf8\uc9c0\ub97c \uc5c5\ub85c\ub4dc\ud558\uba74 \uc2e4\uc81c \ud3ec\ud2b8\ud3f4\ub9ac\uc624 \uc0ac\uc774\ud2b8(/works \ubc0f \uccab \ud654\uba74 \uada4\ub3c4)\uc5d0 \ub178\ucd9c\ub418\ub294 \ubaa8\uc2b5\uc774 \uc2e4\uc2dc\uac04\uc73c\ub85c \ub80c\ub354\ub9c1\ub429\ub2c8\ub2e4.\n      </div>\n    </aside>\n  </div>\n\n  <!-- \ub4f1\ub85d \uc644\ub8cc \ud654\uba74 (\uc131\uacf5 \uc2dc \ub178\ucd9c) -->\n  <div class=\"done-container\" id=\"done-container\">\n    <div class=\"done-icon\">\u2713</div>\n    <div>\n      <div style=\"font-size:11px;letter-spacing:var(--track-wide);color:var(--success);text-transform:uppercase;\">SUCCESSFULLY REGISTERED</div>\n      <h2 style=\"font-size:28px;margin:6px 0;font-weight:500;\">\ud3ec\ud2b8\ud3f4\ub9ac\uc624\uac00 \uc131\uacf5\uc801\uc73c\ub85c \ub4f1\ub85d\ub418\uc5c8\uc2b5\ub2c8\ub2e4!</h2>\n      <p style=\"color:var(--b70);margin:0;line-height:1.6;\" id=\"done-desc\">\n        \ub4f1\ub85d\ud558\uc2e0 \uc791\ud488\uc774 \ub514\uc9c0\ud138\uc544\ud2b8\uc804\uacf5 \uc544\uce74\uc774\ube0c\uc5d0 \uc548\uc804\ud558\uac8c \ubc18\uc601\ub418\uc5c8\uc2b5\ub2c8\ub2e4.\n      </p>\n    </div>\n\n    <div class=\"preview-card\" id=\"done-preview-card\" style=\"box-shadow:none;\"></div>\n\n    <div class=\"done-actions\">\n      <a href=\"portfolio.html#/\" class=\"btn-primary\" id=\"btn-view-orbit\">3D \ud3ec\ud2b8\ud3f4\ub9ac\uc624 \uada4\ub3c4\uc5d0\uc11c \ubcf4\uae30 \u2197</a>\n      <a href=\"portfolio.html#/works\" class=\"btn-outline\">\uc544\uce74\uc774\ube0c \ubaa9\ub85d\uc5d0\uc11c \ubcf4\uae30 \u2197</a>\n      <button type=\"button\" class=\"btn-outline\" id=\"btn-register-again\">+ \ub2e4\ub978 \uc791\ud488 \ub4f1\ub85d\ud558\uae30</button>\n    </div>\n  </div>\n</main>";

function runSubmitScript() {
(function(){
  'use strict';
  var API = window.PortfolioAPI;
  var form = document.getElementById('submit-form');
  var statusMsg = document.getElementById('status-msg');
  var submitBtn = document.getElementById('submit-btn');

  /* 로고 픽셀 주입 */
  fetch('logo-grid.json').then(function(r){ return r.ok ? r.json() : null; }).then(function(g){
    if (!g) return; var rows = g.rows || g, d = '';
    rows.forEach(function(row, y){ String(row).split('').forEach(function(ch, x){ if (ch !== '.' && ch !== ' ' && ch !== '0') d += 'M' + x + ' ' + y + 'h1v1h-1z'; }); });
    var p = document.getElementById('logo-path'); if (p) p.setAttribute('d', d);
  }).catch(function(){});

  /* 프리뷰 캔버스 제너레이터 (이미지 미선택 시 디지털아트 패턴 드로잉) */
  var previewCanvas = document.getElementById('preview-canvas');
  var ctx = previewCanvas.getContext('2d');
  function drawProceduralThumb(seedText){
    var w = previewCanvas.width, h = previewCanvas.height;
    ctx.fillStyle = '#0a0a10';
    ctx.fillRect(0, 0, w, h);
    var seed = 0;
    for (var i = 0; i < (seedText || '').length; i++) seed = (seed * 31 + seedText.charCodeAt(i)) & 0xffffff;
    if (!seed) seed = 12345;
    
    // 사이버네틱 그리드 & 라인
    ctx.strokeStyle = 'rgba(233,234,228,0.08)';
    ctx.lineWidth = 1;
    for (var x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (var y = 0; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // 파티클 & 오빗
    var count = 18;
    for (var j = 0; j < count; j++) {
      var px = ((seed * (j + 1) * 9301 + 49297) % 233280) / 233280 * w;
      var py = ((seed * (j + 2) * 49297 + 9301) % 233280) / 233280 * h;
      var pr = 3 + (j % 5) * 3;
      ctx.fillStyle = (j % 3 === 0) ? '#f4ff53' : 'rgba(233,234,228,0.6)';
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
    }
  }
  drawProceduralThumb('Digital Arts');

  /* 실시간 프리뷰 갱신 */
  var pvTitle = document.getElementById('pv-title');
  var pvStudent = document.getElementById('pv-student');
  var pvCategory = document.getElementById('pv-category');
  var pvYear = document.getElementById('pv-year');
  var pvStatement = document.getElementById('pv-statement');
  var pvTools = document.getElementById('pv-tools');
  var previewMediaContainer = document.getElementById('preview-media-container');

  var currentImageSrc = '';
  var currentVideoSrc = '';

  function updatePreview(){
    var title = form.elements.title.value.trim() || '작품 제목을 입력하세요';
    var student = form.elements.student.value.trim() || '작가명';
    var cat = form.elements.category.value || 'installation';
    var year = form.elements.year.value.trim() || '2025';
    var statement = form.elements.statement.value.trim() || '작품을 관통하는 한 문장 스테이트먼트';
    var tools = form.elements.tools.value.split(',').map(function(s){ return s.trim(); }).filter(Boolean);

    pvTitle.textContent = title;
    pvStudent.textContent = student;
    pvCategory.textContent = cat.toUpperCase();
    pvYear.textContent = year;
    pvStatement.textContent = '"' + statement + '"';

    if (tools.length) {
      pvTools.innerHTML = tools.map(function(t){ return '<span class="preview-tool-tag">' + escapeHtml(t) + '</span>'; }).join('');
    } else {
      pvTools.innerHTML = '<span class="preview-tool-tag">' + cat.toUpperCase() + '</span>';
    }

    if (!currentImageSrc && !currentVideoSrc) {
      previewCanvas.style.display = 'block';
      document.getElementById('preview-empty-badge').style.display = 'block';
      drawProceduralThumb(title + student);
    }
  }

  /* 카테고리 칩 바인딩 */
  var catChips = document.querySelectorAll('.cat-chip');
  var catInput = document.getElementById('cat-input');
  catChips.forEach(function(chip){
    chip.addEventListener('click', function(){
      catChips.forEach(function(c){ c.classList.remove('is-active'); });
      chip.classList.add('is-active');
      catInput.value = chip.getAttribute('data-cat');
      updatePreview();
    });
  });

  /* 도구 태그 칩 바인딩 */
  var toolsInput = document.getElementById('tools-input');
  document.querySelectorAll('#tool-presets .tool-chip').forEach(function(chip){
    chip.addEventListener('click', function(){
      var val = chip.getAttribute('data-val');
      var list = toolsInput.value.split(',').map(function(s){ return s.trim(); }).filter(Boolean);
      var idx = list.indexOf(val);
      if (idx >= 0) {
        list.splice(idx, 1);
        chip.classList.remove('is-active');
      } else {
        list.push(val);
        chip.classList.add('is-active');
      }
      toolsInput.value = list.join(', ');
      updatePreview();
    });
  });

  /* 폼 인풋 이벤트 */
  ['input', 'change', 'keyup'].forEach(function(ev){
    form.addEventListener(ev, updatePreview);
  });

  /* 미디어 파일 핸들링 */
  var uploadedFiles = { image: null, video: null };
  var imgDropzone = document.getElementById('img-dropzone');
  var fileImage = document.getElementById('file-image');
  var imgPreviewBox = document.getElementById('img-preview-box');
  var imgPreviewEl = document.getElementById('img-preview-el');
  var removeImgBtn = document.getElementById('remove-img-btn');
  var ratioSelect = document.getElementById('ratio-select');

  function handleImageFile(file){
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('이미지 파일은 15MB 이하만 가능합니다.');
      return;
    }
    uploadedFiles.image = file;
    var reader = new FileReader();
    reader.onload = function(e){
      currentImageSrc = e.target.result;
      imgPreviewEl.src = currentImageSrc;
      imgPreviewBox.style.display = 'block';
      imgDropzone.style.display = 'none';

      // 프리뷰 패널 미디어 교체
      previewCanvas.style.display = 'none';
      document.getElementById('preview-empty-badge').style.display = 'none';
      var existingImg = previewMediaContainer.querySelector('img.pv-live-img');
      if (!existingImg) {
        existingImg = document.createElement('img');
        existingImg.className = 'pv-live-img';
        previewMediaContainer.appendChild(existingImg);
      }
      existingImg.src = currentImageSrc;
      existingImg.style.display = 'block';

      // 비율 자동 감지
      var tempImg = new Image();
      tempImg.onload = function(){
        if (API && API.closestRatio) {
          var matchedRatio = API.closestRatio(tempImg.naturalWidth, tempImg.naturalHeight);
          ratioSelect.value = matchedRatio;
        }
      };
      tempImg.src = currentImageSrc;
    };
    reader.readAsDataURL(file);
  }

  fileImage.addEventListener('change', function(){
    if (fileImage.files && fileImage.files[0]) handleImageFile(fileImage.files[0]);
  });
  imgDropzone.addEventListener('dragover', function(e){ e.preventDefault(); imgDropzone.classList.add('dragover'); });
  imgDropzone.addEventListener('dragleave', function(){ imgDropzone.classList.remove('dragover'); });
  imgDropzone.addEventListener('drop', function(e){
    e.preventDefault(); imgDropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0]);
  });
  removeImgBtn.addEventListener('click', function(){
    uploadedFiles.image = null;
    fileImage.value = '';
    currentImageSrc = '';
    imgPreviewBox.style.display = 'none';
    imgDropzone.style.display = 'flex';
    var liveImg = previewMediaContainer.querySelector('img.pv-live-img');
    if (liveImg) liveImg.style.display = 'none';
    updatePreview();
  });

  /* 비디오 탭 전환 */
  var vtabBtns = document.querySelectorAll('.tab-btn');
  var vtabUrlWrap = document.getElementById('vtab-url-wrap');
  var vtabFileWrap = document.getElementById('vtab-file-wrap');
  vtabBtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      vtabBtns.forEach(function(b){ b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      var tab = btn.getAttribute('data-vtab');
      if (tab === 'url') {
        vtabUrlWrap.style.display = 'block';
        vtabFileWrap.style.display = 'none';
      } else {
        vtabUrlWrap.style.display = 'none';
        vtabFileWrap.style.display = 'block';
      }
    });
  });

  /* 비디오 파일 업로드 핸들링 */
  var fileVideo = document.getElementById('file-video');
  var vidPreviewBox = document.getElementById('vid-preview-box');
  var vidPreviewEl = document.getElementById('vid-preview-el');
  var removeVidBtn = document.getElementById('remove-vid-btn');

  function handleVideoFile(file){
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('영상 파일은 50MB 이하만 지원됩니다.');
      return;
    }
    uploadedFiles.video = file;
    var vidUrl = URL.createObjectURL(file);
    currentVideoSrc = vidUrl;
    vidPreviewEl.src = vidUrl;
    vidPreviewBox.style.display = 'block';
  }
  fileVideo.addEventListener('change', function(){
    if (fileVideo.files && fileVideo.files[0]) handleVideoFile(fileVideo.files[0]);
  });
  removeVidBtn.addEventListener('click', function(){
    uploadedFiles.video = null;
    fileVideo.value = '';
    currentVideoSrc = '';
    vidPreviewBox.style.display = 'none';
  });

  /* 유틸 */
  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(m){
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  /* 폼 제출 처리 */
  form.addEventListener('submit', function(e){
    e.preventDefault();
    statusMsg.className = 'status-msg';
    statusMsg.textContent = '';
    document.querySelectorAll('.field').forEach(function(f){ f.classList.remove('is-bad'); });

    var title = form.elements.title.value.trim();
    var student = form.elements.student.value.trim();
    var email = form.elements.email.value.trim();
    var statement = form.elements.statement.value.trim();
    var category = form.elements.category.value;
    var year = form.elements.year.value.trim() || '2025';
    var ratio = form.elements.ratio.value || '16:10';
    var paragraphs = form.elements.paragraphs.value.split(/\n\s*\n/).map(function(s){ return s.trim(); }).filter(Boolean);
    var tools = form.elements.tools.value.split(',').map(function(s){ return s.trim(); }).filter(Boolean);
    var externalUrl = form.elements.external_url.value.trim() || null;
    var videoUrlInput = form.elements.video_url.value.trim() || null;
    var publishMode = form.elements.published_mode.value;
    var submitterNote = form.elements.submitter_note.value.trim() || null;
    var agree = form.elements.agree.checked;

    // 검증
    var badField = null, badMsg = '';
    if (!title) { badField = 'title'; badMsg = '작품 제목을 입력해 주세요.'; }
    else if (!student) { badField = 'student'; badMsg = '작가 / 학생 이름을 입력해 주세요.'; }
    else if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { badField = 'email'; badMsg = '올바른 이메일 주소를 입력해 주세요.'; }
    else if (!statement) { badField = 'statement'; badMsg = '작품 스테이트먼트를 작성해 주세요.'; }
    else if (!uploadedFiles.image && !currentImageSrc) { badField = 'image'; badMsg = '대표 이미지를 업로드해 주세요.'; }
    else if (!agree) { badField = 'agree'; badMsg = '전시 및 게시 동의 항목에 체크해 주세요.'; }

    if (badField) {
      var el = form.querySelector('[data-f="' + badField + '"]');
      if (el) el.classList.add('is-bad');
      statusMsg.className = 'status-msg err';
      statusMsg.textContent = badMsg;
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 제출 시작
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳ 미디어 업로드 및 최적화 중...</span>';
    statusMsg.className = 'status-msg';
    statusMsg.textContent = '이미지를 클라우드 스토리지에 안전하게 업로드하는 중입니다...';

    var slug = 'work-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    var isDirectPublish = (publishMode === 'direct');

    var workPayload = {
      slug: slug,
      title: title,
      student: student,
      category: category,
      year: year,
      statement: statement,
      paragraphs: paragraphs,
      tools: tools,
      ratio: ratio,
      image: null,
      video: videoUrlInput || null,
      external_url: externalUrl,
      submitter_email: email,
      submitter_note: submitterNote,
      published: isDirectPublish,
      status: isDirectPublish ? 'approved' : 'pending'
    };

    // 이미지 업로드 실행
    var uploadPromise;
    if (uploadedFiles.image) {
      var imgPath = API.mediaPath('submissions', slug, 'image', uploadedFiles.image);
      uploadPromise = API.upload(uploadedFiles.image, imgPath);
    } else {
      uploadPromise = Promise.resolve(currentImageSrc);
    }

    uploadPromise.then(function(imgUrl){
      workPayload.image = imgUrl;

      // 비디오 파일이 있으면 비디오도 업로드
      if (uploadedFiles.video) {
        submitBtn.innerHTML = '<span>⏳ 영상 파일 업로드 중...</span>';
        statusMsg.textContent = '영상 파일을 스토리지에 전송 중입니다 (용량에 따라 수초 소요)...';
        var vidPath = API.mediaPath('submissions', slug, 'video', uploadedFiles.video);
        return API.upload(uploadedFiles.video, vidPath).then(function(vUrl){
          workPayload.video = vUrl;
          return null;
        }).catch(function(vidErr){
          console.warn('영상 업로드 실패:', vidErr);
          return null;
        });
      }
      return null;
    }).then(function(){
      submitBtn.innerHTML = '<span>💾 데이터베이스 영구 저장 중...</span>';
      statusMsg.textContent = 'Supabase 클라우드 데이터베이스에 작품 정보를 등록하는 중입니다...';
      return API.submitWork(workPayload);
    }).then(function(savedWork){
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>✦ 포트폴리오 작품 등록하기</span>';
      showSuccess(savedWork || workPayload);
    }).catch(function(err){
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>✦ 포트폴리오 작품 등록하기</span>';
      statusMsg.className = 'status-msg err';
      statusMsg.textContent = '등록 오류: ' + (err.message || String(err));
      console.error(err);
    });
  });

  /* 등록 완료 화면 렌더링 */
  var studioGrid = document.getElementById('studio-grid');
  var doneContainer = document.getElementById('done-container');
  var doneDesc = document.getElementById('done-desc');
  var donePreviewCard = document.getElementById('done-preview-card');
  var btnViewOrbit = document.getElementById('btn-view-orbit');
  var btnRegisterAgain = document.getElementById('btn-register-again');

  function showSuccess(w){
    studioGrid.style.display = 'none';
    doneContainer.classList.add('is-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    doneDesc.innerHTML = '등록자: <b>' + escapeHtml(w.student) + '</b> (' + escapeHtml(w.submitter_email) + ')<br>' +
      '<span style="color:var(--success)">등록하신 작품이 포트폴리오 아카이브에 성공적으로 반영되었습니다.</span>';

    donePreviewCard.innerHTML = '<div class="preview-card-media">' +
      (w.video && !w.video.startsWith('blob:') && !w.video.includes('youtube') && !w.video.includes('vimeo') ?
        '<video src="' + escapeHtml(w.video) + '" muted loop autoplay playsinline></video>' :
        '<img src="' + escapeHtml(w.image || '') + '" alt="' + escapeHtml(w.title) + '">') +
      '</div>' +
      '<div class="preview-card-body">' +
      '<div class="preview-meta-row"><span class="pill">' + escapeHtml((w.category || '').toUpperCase()) + '</span><span>' + escapeHtml(w.year || '2025') + '</span></div>' +
      '<h3 class="preview-title">' + escapeHtml(w.title) + '</h3>' +
      '<div class="preview-artist">' + escapeHtml(w.student) + '</div>' +
      '<div class="preview-statement">"' + escapeHtml(w.statement) + '"</div>' +
      '<div class="preview-tools">' + (w.tools || []).map(function(t){ return '<span class="preview-tool-tag">' + escapeHtml(t) + '</span>'; }).join('') + '</div>' +
      '</div>';

    btnViewOrbit.href = 'portfolio.html#/work/' + w.slug;
  }

  btnRegisterAgain.addEventListener('click', function(){
    doneContainer.classList.remove('is-active');
    studioGrid.style.display = 'grid';
    form.reset();
    uploadedFiles.image = null;
    uploadedFiles.video = null;
    currentImageSrc = '';
    currentVideoSrc = '';
    imgPreviewBox.style.display = 'none';
    imgDropzone.style.display = 'flex';
    vidPreviewBox.style.display = 'none';
    var liveImg = previewMediaContainer.querySelector('img.pv-live-img');
    if (liveImg) liveImg.style.display = 'none';
    updatePreview();
  });

})();
}

export default function SubmitPage() {
  const containerRef = useRef(null);

  useEffect(() => {
    // 1. Inject exact CSS
    const styleEl = document.createElement('style');
    styleEl.id = 'submit-page-style';
    styleEl.textContent = SUBMIT_CSS;
    document.head.appendChild(styleEl);

    // 2. Run script (window.PortfolioAPI 를 먼저 채운다)
    let cleanup;
    try {
      installPortfolioAPI();
      cleanup = runSubmitScript();
    } catch (e) {
      console.warn('Submit script execution:', e);
    }

    return () => {
      if (document.head.contains(styleEl)) {
        document.head.removeChild(styleEl);
      }
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="submit-vanilla-wrapper"
      dangerouslySetInnerHTML={{ __html: SUBMIT_MARKUP }}
    />
  );
}
