import React, { useEffect, useRef } from 'react';
import { installSiteGlobals } from '../lib/siteGlobals';

const PORTFOLIO_CSS = "\n/* \u2550\u2550\u2550 Cipher Design System \u2014 \uc0c9\u00b7\uac04\uaca9\u00b7\uc120\u00b7\ubaa8\uc158 \ud1a0\ud070 (Claude Design 'digitalrarts_portpolio_site' \uc5d0\uc11c \ub3d9\uae30\ud654)\n   \uc11c\uccb4\ub9cc \uc0ac\uc774\ud2b8 \uc870\uc815: ABC Favorit/Arizona Mix \ub300\uccb4\ub85c \ud648\ud398\uc774\uc9c0\uc640 \uac19\uc740 Pretendard \uc0ac\uc6a9 \u2550\u2550\u2550 */\n:root{\n  --black:#000000; --bone:#e9eae4; --mist:#e2e6e3;\n  --bone-70:rgba(233,234,228,.7); --bone-45:rgba(233,234,228,.45); --bone-24:rgba(233,234,228,.24); --bone-12:rgba(233,234,228,.12); --bone-06:rgba(233,234,228,.06);\n  --surface-page:var(--black); --surface-raised:var(--bone-06); --surface-invert:var(--bone);\n  --text-body:var(--bone); --text-display:var(--mist); --text-muted:var(--bone-45); --text-meta:var(--bone-70); --text-invert:var(--black);\n  --border-hairline:var(--bone-24); --border-faint:var(--bone-12);\n  --link:var(--bone); --link-hover:var(--bone-45);\n  --overlay-protect:linear-gradient(to bottom,rgba(0,0,0,.65),rgba(0,0,0,0));\n  --font:\"Pretendard\",\"Noto Sans KR\",\"Helvetica Neue\",Arial,sans-serif;\n  --text-10:10px; --text-12:12px; --text-16:16px; --text-20:20px; --text-28:28px; --text-40:40px;\n  --track-tight:-.02em; --track-caps:.08em; --track-caps-wide:.16em;\n  --space-2:8px; --space-7:7px; --space-15:15px; --space-3:16px; --space-4:24px; --space-5:32px; --space-40:40px; --space-6:48px; --space-8x:96px;\n  --pm:40px; --hairline:1px; --z-nav:100; --z-overlay:200;\n  --dur-fast:.2s; --dur-mid:.3s; --dur-slow:.45s; --ease:ease-out;\n  --transition-link:opacity var(--dur-fast) var(--ease); --transition-media:opacity var(--dur-slow) var(--ease),transform var(--dur-slow) var(--ease);\n  --marquee-duration:28s;\n}\n*,*::before,*::after{box-sizing:border-box}\nhtml{background:var(--black)}\nbody{margin:0;background:var(--surface-page);color:var(--text-body);font:500 var(--text-16)/1.35 var(--font);-webkit-font-smoothing:antialiased;word-break:keep-all;overflow-x:hidden}\na{color:var(--link);text-decoration:none;transition:var(--transition-link)}\na:hover{color:var(--link-hover)}\n::selection{background:var(--bone);color:var(--black)}\nimg,video,canvas{display:block;max-width:100%}\nh1,h2,h3,p,ul,figure{margin:0}\nul{padding:0;list-style:none}\nbutton{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}\n@media (prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}\n@media (max-width:767px){:root{--pm:15px}}\n\n.micro{font:500 var(--text-10)/1.6 var(--font);text-transform:uppercase;letter-spacing:var(--track-caps-wide);color:var(--text-muted)}\n.caps{font:500 var(--text-12)/1.6 var(--font);text-transform:uppercase;letter-spacing:var(--track-caps);color:var(--text-body)}\n.label{font:500 var(--text-10)/1.6 var(--font);text-transform:uppercase;letter-spacing:var(--track-caps-wide);color:var(--text-muted)}\n.display{font:500 clamp(1.6rem,3.2vw,2.75rem)/1.2 var(--font);letter-spacing:-.01em;color:var(--text-display);max-width:26ch;text-wrap:pretty}\n.body{font:400 var(--text-16)/1.6 var(--font);color:var(--text-meta);max-width:46ch}\n.navlink{font:500 var(--text-12)/1.2 var(--font);text-transform:uppercase;letter-spacing:var(--track-caps);color:var(--text-body);opacity:.55;transition:var(--transition-link)}\n.navlink:hover,.navlink.is-active{opacity:1;color:var(--text-body)}\n\n\n\n/* \u2550\u2550\u2550 Multi-View Switcher & Exhibition Archive \u2550\u2550\u2550 */\n.works-toolbar {\n  display: flex; justify-content: space-between; align-items: baseline;\n  gap: 20px; flex-wrap: wrap; margin-top: var(--space-40); margin-bottom: var(--space-20);\n  border-bottom: var(--hairline) solid var(--border-hairline); padding-bottom: 14px;\n}\n.works-toolbar .filters { margin: 0; gap: 16px; }\n.view-switch { display: flex; gap: 8px; align-items: center; }\n.v-btn {\n  font: 500 var(--text-10)/1 var(--font); text-transform: uppercase; letter-spacing: var(--track-caps-wide);\n  padding: 6px 10px; border: var(--hairline) solid var(--border-hairline); color: var(--text-muted);\n  background: transparent; transition: var(--transition-link);\n}\n.v-btn.is-active, .v-btn:hover { color: var(--bone); border-color: var(--bone); }\n\n/* Table View */\n.archive-table-wrap { width: 100%; overflow-x: auto; margin-top: var(--space-20); position: relative; }\n.archive-table { width: 100%; border-collapse: collapse; text-align: left; }\n.archive-table th {\n  font: 500 var(--text-10)/1 var(--font); letter-spacing: var(--track-caps-wide);\n  text-transform: uppercase; color: var(--text-muted); padding: 12px 16px;\n  border-bottom: var(--hairline) solid var(--border-hairline);\n}\n.archive-row {\n  border-bottom: var(--hairline) solid var(--border-faint);\n  transition: background-color var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);\n}\n.archive-row:hover { background: rgba(233,234,228,0.06); }\n.archive-row td {\n  padding: 16px; font-size: var(--text-12); vertical-align: middle;\n}\n.archive-row .td-id { font-variant-numeric: tabular-nums; color: var(--text-muted); font-size: var(--text-10); letter-spacing: 0.1em; width: 60px; }\n.archive-row .td-title a {\n  font: 500 var(--text-16)/1.3 var(--font); letter-spacing: 0.02em; color: var(--text-body);\n  display: inline-flex; align-items: center; gap: 8px;\n}\n.archive-row:hover .td-title a { color: #fff; }\n.archive-row .td-artist { color: var(--text-meta); font-size: var(--text-12); white-space: nowrap; }\n.archive-row .td-disc { text-transform: uppercase; font-size: var(--text-10); letter-spacing: var(--track-caps); color: var(--text-muted); }\n.archive-row .td-disc span { display: inline-block; padding: 2px 6px; border: 1px solid var(--border-hairline); border-radius: 2px; }\n.archive-row .td-year { color: var(--text-muted); font-variant-numeric: tabular-nums; font-size: var(--text-10); width: 60px; }\n.archive-row .td-tools { color: var(--text-muted); font-size: var(--text-10); letter-spacing: 0.04em; max-width: 240px; }\n\n/* Floating Cursor Thumbnail */\n.float-thumb {\n  position: fixed; width: 260px; pointer-events: none; z-index: 900;\n  border: 1px solid var(--bone-24); background: #000; box-shadow: 0 16px 36px rgba(0,0,0,0.8);\n  opacity: 0; transform: scale(0.96) translate3d(0, 8px, 0);\n  transition: opacity 0.2s ease, transform 0.2s ease;\n}\n.float-thumb.is-on { opacity: 1; transform: scale(1) translate3d(0, 0, 0); }\n.float-thumb .ft-media { width: 100%; aspect-ratio: 16/10; overflow: hidden; background: #000; }\n.float-thumb .ft-media canvas, .float-thumb .ft-media img, .float-thumb .ft-media video { width: 100%; height: 100%; object-fit: cover; }\n.float-thumb .ft-cap { padding: 8px 10px; display: flex; justify-content: space-between; font: 500 9px/1.2 var(--font); text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-meta); border-top: 1px solid var(--border-faint); }\n\n/* Media Grid View */\n.media-grid {\n  display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: var(--space-40);\n}\n.grid-card {\n  display: flex; flex-direction: column; gap: 12px; border: var(--hairline) solid var(--border-hairline);\n  padding: 16px; background: rgba(233,234,228,0.02); text-decoration: none; color: var(--text-body);\n  transition: border-color var(--dur-fast) var(--ease), background-color var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);\n}\n.grid-card:hover {\n  border-color: var(--bone); background: rgba(233,234,228,0.08); transform: translateY(-2px);\n}\n.grid-card .gc-media { width: 100%; aspect-ratio: 16/10; overflow: hidden; background: #000; border: 1px solid var(--border-faint); }\n.grid-card .gc-media canvas, .grid-card .gc-media img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease; }\n.grid-card:hover .gc-media canvas, .grid-card:hover .gc-media img { transform: scale(1.03); }\n.grid-card .gc-info { display: flex; flex-direction: column; gap: 6px; }\n.grid-card .gc-meta { display: flex; justify-content: space-between; font: 500 var(--text-10)/1 var(--font); letter-spacing: var(--track-caps-wide); text-transform: uppercase; color: var(--text-muted); }\n.grid-card .gc-title { font: 500 var(--text-16)/1.3 var(--font); margin: 0; letter-spacing: 0.02em; }\n.grid-card .gc-student { font-size: var(--text-12); color: var(--text-meta); }\n\n@media (max-width: 900px) {\n  .media-grid { grid-template-columns: repeat(2, 1fr); }\n  .archive-table .th-tools, .archive-table .td-tools, .archive-table .th-year, .archive-table .td-year { display: none; }\n}\n@media (max-width: 600px) {\n  .media-grid { grid-template-columns: 1fr; }\n  .archive-table .th-disc, .archive-table .td-disc { display: none; }\n}\n\n/* \u2500\u2500 \uc9c4\uc785 \ub85c\ub354 \u2500\u2500 */\n.entry{position:fixed;inset:0;z-index:var(--z-overlay);background:var(--black);display:grid;align-content:space-between;padding:var(--pm);transition:opacity var(--dur-slow) var(--ease)}\n.entry.is-done{opacity:0;pointer-events:none}\n.entry .wm{font:500 var(--text-16)/1 var(--font);letter-spacing:.14em;text-transform:uppercase}\n.entry .strap{font:500 var(--text-12)/1.6 var(--font);text-transform:uppercase;letter-spacing:var(--track-caps-wide);color:var(--text-muted);text-align:center}\n.entry .row{display:flex;justify-content:space-between;align-items:baseline;border-top:var(--hairline) solid var(--border-hairline);padding-top:10px}\n.entry .pct{font:500 var(--text-12)/1 var(--font);font-variant-numeric:tabular-nums}\n\n/* \u2500\u2500 \ud5e4\ub354: \uc88c\uc0c1\ub2e8 \ub9c8\ud06c+\uc6cc\ub4dc\ub9c8\ud06c, \uc911\uc559 WORKS \ud558\ub098 \u2500\u2500 */\n.hdr{position:fixed;inset:0 0 auto 0;z-index:var(--z-nav);display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:15px var(--pm);background:linear-gradient(to bottom,rgba(0,0,0,.9),rgba(0,0,0,0))}\n.brand{display:flex;align-items:center;gap:12px;color:var(--text-body)}\n.brand:hover{color:var(--text-body)}\n.brand .mark{width:41px;height:43px;flex:none}\n.brand .mark svg{width:100%;height:100%;fill:currentColor}\n.brand .word{font:600 var(--text-16)/1 var(--font);letter-spacing:0.01em;word-spacing:-0.03em}\n.hdr .center{display:flex;gap:20px;align-items:center}\n.hdr .center a{font:500 var(--text-16)/1.2 var(--font);color:var(--text-body);opacity:.55;transition:var(--transition-link)}\n.hdr .center a:hover,.hdr .center a.is-active{opacity:1;color:var(--text-body)}\n\n/* \u2500\u2500 \ud648: \ubcc4\uc790\ub9ac \uada4\ub3c4 (cipher.tv \uccab \ud654\uba74) \u2500\u2500 */\n.home{position:relative;height:100vh;height:100svh;overflow:hidden}\nbody.is-home{overflow:hidden;height:100vh;height:100svh}\n.orbit{position:absolute;inset:0}\n.tile{position:absolute;left:0;top:0;will-change:transform;cursor:pointer;background:#000;overflow:hidden}\n.tile img,.tile canvas,.tile video{width:100%;height:100%;object-fit:cover;display:block;transition:filter var(--duration-normal) var(--ease-out),opacity var(--duration-normal) var(--ease-out)}\n.home.is-hot .tile:not(.hot) > *{filter:grayscale(1) brightness(.62)}\n.home .mark{position:absolute;left:50%;top:50%;width:44px;height:47px;transform:translate(-50%,-50%);color:var(--bone)}\n.home .mark svg{fill:currentColor;width:100%;height:100%}\n.home .foot{position:absolute;left:var(--pm);right:var(--pm);bottom:24px;display:grid;grid-template-columns:1fr auto 1fr;gap:15px;align-items:end;z-index:60;pointer-events:none}\n.home .foot .l{min-height:1.4em;font-variant-numeric:tabular-nums;white-space:nowrap}\n.home .foot .c{text-align:center}\n.home .foot .r{text-align:right}\n\n/* \u2500\u2500 \ud398\uc774\uc9c0 \uacf5\ud1b5 \u2500\u2500 */\nmain{min-height:60vh}\n.page{padding:120px var(--pm) 0}\n.page.tight{padding-top:96px}\n\n/* \u2500\u2500 works: \ud070 \ud504\ub808\uc784\uc744 \uc138\ub85c\ub85c \uc313\ub294 \uc778\ub371\uc2a4 \u2500\u2500 */\n.filters{display:flex;gap:18px;flex-wrap:wrap;margin:var(--space-40) 0 var(--space-6)}\n.stackable{display:grid;gap:var(--space-6)}\n.entry-work{display:grid;gap:10px;color:var(--text-body)}\n.entry-work:hover{color:var(--text-body)}\n.entry-work .well{position:relative;aspect-ratio:16/9;overflow:hidden;background:var(--surface-raised)}\n.entry-work .well canvas,.entry-work .well img{width:100%;height:100%;object-fit:cover;transition:var(--transition-media)}\n.entry-work:hover .well canvas,.entry-work:hover .well img{opacity:.72;transform:scale(1.02)}\n.entry-work .cap{display:flex;justify-content:space-between;align-items:baseline;gap:var(--space-4)}\n.entry-work .cap .n{font:500 var(--text-12)/1 var(--font);letter-spacing:.08em;color:var(--text-meta)}\n.entry-work .cap .n::before{content:\"\";display:inline-block;width:6px;height:6px;background:var(--bone);margin-right:8px;vertical-align:middle}\n.entry-work .cap .t{font:500 var(--text-20)/1.2 var(--font);text-transform:uppercase;letter-spacing:.02em;text-align:right}\n.entry-work .cap .t small{display:block;font:400 var(--text-12)/1.4 var(--font);text-transform:none;letter-spacing:0;color:var(--text-muted)}\n\n/* \u2500\u2500 \uc0c1\uc138 \u2500\u2500 */\n.work-head{display:flex;align-items:baseline;gap:15px;margin-bottom:var(--space-40);flex-wrap:wrap}\n.work-title{font:600 clamp(2rem,6vw,4rem)/.98 var(--font);letter-spacing:-.02em;text-transform:uppercase}\n.frame{display:grid;gap:var(--space-7)}\n.frame .well{position:relative;aspect-ratio:16/9;overflow:hidden;background:var(--surface-raised)}\n.frame.r219 .well{aspect-ratio:21/9}\n.frame .well canvas,.frame .well img{width:100%;height:100%;object-fit:cover}\n.frame .well.protect::after{content:\"\";position:absolute;inset:0;background:var(--overlay-protect);pointer-events:none}\n.frame figcaption{display:flex;justify-content:space-between;gap:var(--space-2);font:500 var(--text-10)/1.6 var(--font);text-transform:uppercase;letter-spacing:var(--track-caps-wide);color:var(--text-muted)}\n.section{margin-top:var(--space-8x);display:grid;grid-template-columns:200px 1fr;gap:var(--space-40);align-items:start}\n.prose{display:grid;gap:var(--space-4);max-width:62ch}\n.credits{display:grid;grid-template-columns:repeat(3,1fr);gap:32px 40px}\n.credit{display:grid;gap:var(--space-7)}\n.credit ul{display:grid;gap:2px}\n.credit li{font:400 var(--text-12)/1.6 var(--font);color:var(--text-body)}\n.rows{margin-top:var(--space-15)}\n.row-item{display:grid;grid-template-columns:48px 1fr auto;align-items:baseline;gap:var(--space-15);padding:var(--space-15) 0;border-top:var(--hairline) solid var(--border-faint);color:var(--text-body);opacity:.78;transition:var(--transition-link)}\n.row-item:hover{opacity:1;color:var(--text-body)}\n.row-item .n{font:500 var(--text-12)/1.6 var(--font);font-variant-numeric:tabular-nums;color:var(--text-muted)}\n.row-item .t{font:500 var(--text-16)/1.35 var(--font);text-transform:uppercase;letter-spacing:.04em}\n.row-item .m{font:500 var(--text-10)/1.6 var(--font);text-transform:uppercase;letter-spacing:var(--track-caps-wide);color:var(--text-muted)}\n.rows .row-item:last-child{border-bottom:var(--hairline) solid var(--border-faint)}\n.back{display:inline-block;margin-bottom:var(--space-40)}\n\n/* \u2500\u2500 \ub9c8\ud034\u00b7\ud478\ud130 \u2500\u2500 */\n.marquee{overflow:hidden;width:100%}\n.marquee .track{display:flex;width:max-content;gap:var(--space-4);font:500 var(--text-12)/1.6 var(--font);text-transform:uppercase;letter-spacing:var(--track-caps-wide);color:var(--text-body);white-space:nowrap;animation:mq var(--marquee-duration) linear infinite}\n.marquee.big .track{gap:.18em;font:500 clamp(3.5rem,13vw,13rem)/.94 var(--font);letter-spacing:var(--track-tight)}\n.marquee.rev .track{animation-direction:reverse}\n.loader{display:flex;justify-content:space-between;align-items:baseline;max-width:320px;border-top:var(--hairline) solid var(--border-hairline);padding-top:10px;margin-bottom:var(--space-15)}\n.loader .pct{font:500 var(--text-12)/1 var(--font);font-variant-numeric:tabular-nums}\n.home-intro{display:grid;grid-template-columns:1.2fr 1fr;gap:var(--space-40);align-items:start;padding:var(--space-8x) var(--pm) 0}\n.works-grid{display:grid;grid-template-columns:1.5fr 1fr;gap:var(--space-40);align-items:start;margin-top:var(--space-8x)}\n.preview{position:sticky;top:120px;opacity:0;transition:var(--transition-media)}\n.preview.is-on{opacity:1}\n.frame.r45 .well{aspect-ratio:4/5}\n.filters{display:flex;gap:24px;flex-wrap:wrap;margin-top:var(--space-40)}\n.filters a{font:500 var(--text-12)/1.6 var(--font);text-transform:uppercase;letter-spacing:var(--track-caps-wide);color:var(--text-body);opacity:.45;transition:var(--transition-link)}\n.filters a:hover,.filters a.is-active{opacity:1;color:var(--text-body)}\n.pill{display:inline-flex;align-items:center;font:500 var(--text-10)/1 var(--font);text-transform:uppercase;letter-spacing:var(--track-caps);padding:6px 12px;border:var(--hairline) solid var(--border-hairline);border-radius:999px;color:var(--text-body);background:rgba(0,0,0,.35)}\n.player{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:space-between;padding:var(--space-15)}\n.player .grp{display:flex;gap:var(--space-2)}\n@keyframes mq{from{transform:translate3d(0,0,0)}to{transform:translate3d(-33.333%,0,0)}}\n.ftr{border-top:var(--hairline) solid var(--border-faint);margin-top:var(--space-8x);padding:var(--space-40) var(--pm);display:grid;gap:32px}\n.ftr .big{font:600 clamp(2.5rem,9vw,7rem)/.94 var(--font);letter-spacing:-.03em}\n.ftr .cols{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;align-items:start}\n.ftr .cols .caption{font:400 var(--text-12)/1.6 var(--font);color:var(--text-meta)}\n.ftr .bottom{display:flex;justify-content:space-between;gap:var(--space-4);flex-wrap:wrap}\n.btn{display:inline-flex;align-items:center;font:500 var(--text-10)/1 var(--font);text-transform:uppercase;letter-spacing:var(--track-caps);padding:8px 12px;border:var(--hairline) solid var(--border-hairline);color:var(--text-body)}\n.btn:hover{color:var(--link-hover);border-color:var(--border-faint)}\n\n@media (max-width:767px){\n  :root{--text-10:9px;--text-12:10px;--text-16:13px;--text-20:17px}          /* \ubaa8\ubc14\uc77c: \uc804\uccb4 3px \uc791\uac8c (\uc791\uc740 \ub77c\ubca8\uc740 9\u00b710px \uae4c\uc9c0\ub9cc) */\n  .display{font-size:clamp(1.4rem,3.2vw,2.75rem)}\n  .work-title{font-size:clamp(1.8rem,6vw,4rem)}\n  .brand{gap:6px}\n  .brand .mark{width:29px;height:31px}\n  .brand .word{font-size:12px;letter-spacing:0.01em;word-spacing:-0.03em;white-space:nowrap}\n  .hdr .center a{font-size:11px}\n  .page{padding-top:100px}\n  .section{grid-template-columns:1fr;gap:var(--space-15)}\n  .credits{grid-template-columns:1fr 1fr}\n  .ftr .cols{grid-template-columns:1fr 1fr}\n  .entry-work .cap .t{font-size:var(--text-16)}\n  .row-item{grid-template-columns:40px 1fr auto}\n  .home-intro{grid-template-columns:1fr;padding-top:var(--space-6)}\n  .works-grid{grid-template-columns:1fr}\n  .preview{display:none}\n  .home .foot{grid-template-columns:1fr;gap:4px}\n  .home .foot .c,.home .foot .r{text-align:left}\n  .home .foot .c{display:none}\n}\n";
const PORTFOLIO_MARKUP = "<svg width=\"0\" height=\"0\" style=\"position:absolute\" aria-hidden=\"true\">\n  <symbol id=\"logo\" viewBox=\"0 0 32 34\"><path d=\"M22 0h1v1h-1zM12 1h5v1h-5zM22 1h1v1h-1zM9 2h12v1h-12zM23 2h1v1h-1zM7 3h15v1h-15zM23 3h1v1h-1zM6 4h16v1h-16zM23 4h1v1h-1zM5 5h17v1h-17zM23 5h1v1h-1zM26 5h1v1h-1zM4 6h13v1h-13zM18 6h4v1h-4zM23 6h1v1h-1zM26 6h1v1h-1zM3 7h14v1h-14zM18 7h4v1h-4zM23 7h1v1h-1zM26 7h2v1h-2zM2 8h15v1h-15zM19 8h2v1h-2zM23 8h1v1h-1zM25 8h3v1h-3zM1 9h16v1h-16zM19 9h1v1h-1zM22 9h2v1h-2zM25 9h3v1h-3zM1 10h16v1h-16zM19 10h1v1h-1zM22 10h1v1h-1zM25 10h4v1h-4zM30 10h1v1h-1zM1 11h10v1h-10zM12 11h5v1h-5zM21 11h2v1h-2zM25 11h4v1h-4zM30 11h1v1h-1zM0 12h11v1h-11zM13 12h4v1h-4zM21 12h2v1h-2zM24 12h2v1h-2zM27 12h2v1h-2zM30 12h1v1h-1zM0 13h12v1h-12zM13 13h4v1h-4zM20 13h2v1h-2zM24 13h2v1h-2zM27 13h1v1h-1zM30 13h2v1h-2zM0 14h12v1h-12zM14 14h2v1h-2zM20 14h2v1h-2zM24 14h2v1h-2zM27 14h1v1h-1zM29 14h3v1h-3zM0 15h12v1h-12zM14 15h2v1h-2zM20 15h2v1h-2zM24 15h2v1h-2zM27 15h1v1h-1zM29 15h3v1h-3zM0 16h12v1h-12zM14 16h2v1h-2zM19 16h3v1h-3zM24 16h2v1h-2zM29 16h3v1h-3zM0 17h12v1h-12zM14 17h2v1h-2zM18 17h4v1h-4zM25 17h1v1h-1zM29 17h3v1h-3zM0 18h8v1h-8zM9 18h3v1h-3zM14 18h1v1h-1zM18 18h4v1h-4zM25 18h1v1h-1zM29 18h3v1h-3zM0 19h7v1h-7zM9 19h2v1h-2zM18 19h5v1h-5zM25 19h2v1h-2zM29 19h3v1h-3zM0 20h7v1h-7zM9 20h2v1h-2zM18 20h5v1h-5zM26 20h1v1h-1zM29 20h3v1h-3zM1 21h6v1h-6zM9 21h2v1h-2zM14 21h2v1h-2zM19 21h4v1h-4zM28 21h1v1h-1zM30 21h2v1h-2zM1 22h6v1h-6zM9 22h1v1h-1zM13 22h3v1h-3zM19 22h5v1h-5zM30 22h1v1h-1zM1 23h6v1h-6zM9 23h1v1h-1zM13 23h2v1h-2zM20 23h4v1h-4zM30 23h1v1h-1zM2 24h5v1h-5zM9 24h2v1h-2zM13 24h2v1h-2zM20 24h5v1h-5zM29 24h2v1h-2zM2 25h6v1h-6zM10 25h1v1h-1zM14 25h2v1h-2zM21 25h5v1h-5zM29 25h1v1h-1zM3 26h3v1h-3zM7 26h1v1h-1zM14 26h2v1h-2zM18 26h1v1h-1zM21 26h5v1h-5zM28 26h1v1h-1zM4 27h2v1h-2zM15 27h1v1h-1zM18 27h1v1h-1zM23 27h3v1h-3zM28 27h1v1h-1zM5 28h2v1h-2zM16 28h1v1h-1zM18 28h2v1h-2zM24 28h1v1h-1zM27 28h1v1h-1zM6 29h2v1h-2zM19 29h3v1h-3zM7 30h2v1h-2zM11 30h3v1h-3zM20 30h3v1h-3zM11 31h3v1h-3zM20 31h4v1h-4zM11 32h4v1h-4zM21 32h3v1h-3zM12 33h3v1h-3z\"/></symbol>\n</svg>\n<div class=\"entry\" id=\"entry\" aria-hidden=\"true\">\n  <div class=\"wm\">DIGITAL ARTS ARCHIVE</div>\n  <div class=\"strap\" id=\"strap\">for the screen and beyond</div>\n  <div class=\"row\"><span class=\"micro\">loading data</span><span class=\"pct\" id=\"pct\">0%</span></div>\n</div>\n\n<header class=\"hdr\">\n  <a class=\"brand\" href=\"index.html\" aria-label=\"\uc804\uacf5 \ud648\ud398\uc774\uc9c0\ub85c\"><span class=\"mark\"><svg><use href=\"#logo\"/></svg></span><span class=\"word\">Digital Arts Archive</span></a>\n  <div class=\"center\">\n    <a href=\"#/\" data-route=\"home\">/orbit</a>\n    <a href=\"#/works\" data-route=\"works\">/works</a>\n    <a href=\"submit.html\" data-route=\"submit\">/submit</a>\n  </div>\n  <div style=\"display:flex;justify-content:flex-end;align-items:center;\">\n    <a href=\"submit.html\" class=\"v-btn\" style=\"color:var(--key);border-color:rgba(244,255,83,0.45);background:rgba(244,255,83,0.06);padding:6px 12px;font-size:11px;display:inline-flex;align-items:center;gap:6px;\">+ \uc791\ud488 \ub4f1\ub85d</a>\n  </div>\n</header>\n\n<main id=\"app\"></main>";

function runPortfolioScript() {
(function(){
  'use strict';
  var D = window.PORTFOLIO_DATA || { works: [], taglines: [], contact: {} };
  var app = document.getElementById('app');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var Q = new URLSearchParams(location.search), STATIC = Q.get('static') === '1';   /* 검수용: ?static=1 → 진입 화면 생략·한 프레임만, &ang=라디안, &hot=타일번호 */
  var raf = 0;

  /* 자리표시 썸네일: 검정 위 본색 픽셀 필드 (work.video → mp4/webm, work.image → jpg/gif 가 있으면 그것을 우선) */
  function media(work, w, h){
    if (work.video) { var v = document.createElement('video'); v.src = work.video; v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); if (work.image) v.poster = work.image; return v; }
    if (work.image) { var im = document.createElement('img'); im.src = work.image; im.alt = work.title; im.loading = 'lazy'; im.decoding = 'async'; return im; }
    var cv = document.createElement('canvas'); cv.width = w * 2; cv.height = h * 2; var g = cv.getContext('2d'); g.scale(2, 2);
    var seed = work.seed || 1; var rnd = function(){ seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    var cols = Math.max(8, Math.round(w / 14)), rows = Math.max(6, Math.round(h / 14)), cw = w / cols, ch = h / rows;
    var ccx = cols * (0.3 + rnd() * 0.4), ccy = rows * (0.3 + rnd() * 0.4), rr = Math.min(cols, rows) * (0.4 + rnd() * 0.22), stripes = 2 + Math.floor(rnd() * 4), ang = rnd() * Math.PI;
    var pal = ['rgba(233,234,228,.22)', 'rgba(233,234,228,.42)', 'rgba(233,234,228,.68)', 'rgba(233,234,228,.95)'];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var dx = c + 0.5 - ccx, dy = r + 0.5 - ccy, d = Math.sqrt(dx*dx + dy*dy);
      var band = Math.sin((dx * Math.cos(ang) + dy * Math.sin(ang)) * stripes * 0.9 + d * 0.5);
      var on = d < rr ? band > -0.35 : (d < rr + 3 && band > 0.55 && rnd() > 0.35);
      if (!on) continue;
      var shade = Math.max(0, Math.min(3, Math.floor((1 - d / (rr + 3)) * 3 + rnd() * 1.2)));
      g.fillStyle = pal[shade]; g.fillRect(c * cw + 0.5, r * ch + 0.5, cw - 1, ch - 1);
    }
    return cv;
  }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function frame(work, cls, caption, index, protect){
    var f = document.createElement('figure'); f.className = 'frame' + (cls ? ' ' + cls : '');
    var well = document.createElement('div'); well.className = 'well' + (protect ? ' protect' : '');
    well.appendChild(media(work, cls === 'r219' ? 840 : cls === 'r45' ? 400 : 640, cls === 'r219' ? 360 : cls === 'r45' ? 500 : 360)); f.appendChild(well);
    if (caption || index) { var fc = document.createElement('figcaption'); fc.innerHTML = '<span>' + esc(caption || '') + '</span><span>' + esc(index || '') + '</span>'; f.appendChild(fc); }
    return f;
  }
  function rowItem(w){ return '<a class="row-item" href="#/work/' + w.slug + '"><span class="n">' + w.n + '</span><span class="t">' + esc(w.title) + '</span><span class="m">' + esc(w.student) + ' · ' + w.meta + '</span></a>'; }
  function marquee(items, big, rev){ var run = items.concat(items, items).map(function(t){ return '<span>' + esc(t) + '</span>'; }).join(''); return '<div class="marquee' + (big ? ' big' : '') + (rev ? ' rev' : '') + '"><div class="track">' + run + '</div></div>'; }
  function footer(){
    var C = D.contact || {};
    return '<footer class="ftr"><div class="big">DIGITAL ARTS</div><div class="cols">' +
      '<div class="caption">' + (C.address || []).map(esc).join('<br>') + '</div>' +
      '<div class="caption">for the screen<br>and beyond</div>' +
      '<div><div class="label">work with us</div><div style="margin-top:7px;display:grid;gap:7px;justify-items:start"><a class="btn" href="' + (C.email && C.email.indexOf('@') > 0 ? 'mailto:' + C.email : '#') + '">' + esc(C.email || '[전공 이메일]') + '</a><a class="btn" href="submit.html">submit a work ↗</a></div></div>' +
      '<div style="display:grid;gap:7px;justify-items:start"><a class="btn" href="' + (C.instagram || '#') + '">instagram</a><a class="btn" href="' + (C.youtube || '#') + '">youtube</a></div>' +
      '</div><div class="bottom micro"><span>© seoul institute of the arts · digital arts ' + new Date().getFullYear() + '</span><a class="micro" href="index.html">back to main site</a></div></footer>';
  }

  /* ── 홈: cipher.tv 첫 화면 — 대표 이미지·GIF·영상이 기울어진 타원 궤도(별자리)를 천천히 돌고, 휠·터치가 회전 속도와 방향을 바꾼다.
     궤도 형태는 화면 녹화본에서 잰 값: 가로:세로 = 1:0.7, 오른쪽이 살짝 올라간 −14° 기울기, 왼쪽 아래가 가장 가깝다(크고 앞에 온다). */
  var spin = { vel: 0, ang: 0, last: 0, dir: -1 };                                /* dir: 손대지 않을 때의 회전 방향 (−1 = 반시계, 녹화본과 같음) */
  var SCRAMBLE = '0123456789/·—ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function Home(){
    cancelAnimationFrame(raf);
    document.body.classList.add('is-home');
    app.innerHTML = '<section class="home" id="home"><div class="orbit" id="orbit"></div><div class="mark" aria-hidden="true"><svg><use href="#logo"/></svg></div>' +
      '<div class="foot micro"><span class="l" id="tagline"></span><span class="c">' + esc(D.strapline || '') + '</span><span class="r">seoul institute of the arts · digital arts</span></div></section>';
    var orbit = document.getElementById('orbit'), home = document.getElementById('home'), tagEl = document.getElementById('tagline');
    var works = D.works.slice(0, 15), N = works.length, tiles = [];
    var ratios = [[16, 10], [4, 5], [3, 2], [1, 1], [16, 9], [4, 5], [16, 10], [5, 4]];   /* 작품마다 다른 화면비 (data의 ratio:[w,h] 로 덮어쓸 수 있음) */
    works.forEach(function(w, i){
      var r = (w.ratio && w.ratio.length === 2) ? w.ratio : ratios[i % ratios.length], ar = r[0] / r[1];
      var t = document.createElement('a'); t.className = 'tile'; t.href = '#/work/' + w.slug; t.setAttribute('aria-label', w.title);
      t.appendChild(media(w, 480, Math.round(480 / ar)));
      var tl = { el: t, ar: ar, kw: ar >= 1.4 ? 0.72 : ar >= 1 ? 0.55 : 0.46, a: (i / N) * Math.PI * 2, j: (((i * 7) % 5) - 2) * 0.035, hs: 1, hot: false };
      t.addEventListener('mouseenter', function(){ home.classList.add('is-hot'); t.classList.add('hot'); tl.hot = true; });
      t.addEventListener('mouseleave', function(){ home.classList.remove('is-hot'); t.classList.remove('hot'); tl.hot = false; });
      orbit.appendChild(t); tiles.push(tl);
    });
    var tags = (D.taglines || []).map(function(t){ return String(t).toLowerCase(); }), tagI = -1, tagT = -1e9;
    if (!tags.length) tags = [String(D.strapline || '').toLowerCase()];
    spin.last = performance.now();
    if (STATIC) { spin.ang = parseFloat(Q.get('ang') || '0') || 0; var hi = parseInt(Q.get('hot') || '-1', 10); if (tiles[hi]) { tiles[hi].hot = true; tiles[hi].hs = 1.25; tiles[hi].el.classList.add('hot'); home.classList.add('is-hot'); } }
    var ROT = -14 * Math.PI / 180, NEAR = 110 * Math.PI / 180, cr = Math.cos(ROT), sr = Math.sin(ROT);
    function frameFn(now){
      var W = window.innerWidth, H = window.innerHeight, small = W < 768;
      var dt = Math.min(0.05, (now - spin.last) / 1000); spin.last = now;
      var base = (reduce || STATIC) ? 0 : (Math.PI * 2 / 90) * spin.dir;                        /* 손대지 않으면 90초에 한 바퀴 */
      spin.ang += (base + spin.vel) * dt;
      spin.vel *= Math.pow(0.25, dt);                                                 /* 휠·터치로 얻은 속도는 2초쯤에 걸쳐 사라진다 */
      var A = small ? W * 0.40 : Math.min(W * 0.31, H * 0.40), B = A * (small ? 1.15 : 0.70);
      var cx = W / 2, cy = H * (small ? 0.47 : 0.5);
      B = Math.min(B, cy - 64 - A * 0.2);                                            /* 좁고 긴 창: 맨 위 타일이 헤더를 덮지 않게 */
      tiles.forEach(function(tl){
        var ang = tl.a + spin.ang;
        var d = Math.cos(ang - NEAR);                                                 /* 1 = 가장 가까움(왼쪽 아래), −1 = 가장 멂(오른쪽 위) */
        var s = 0.85 + 0.15 * d, p = 0.92 + 0.08 * d;                                 /* 앞은 크고 바깥으로, 뒤는 작고 안쪽으로 */
        var x0 = Math.cos(ang) * A, y0 = Math.sin(ang) * B + tl.j * B;
        var x = cx + (x0 * cr - y0 * sr) * p, y = cy + (x0 * sr + y0 * cr) * p;
        tl.hs += ((tl.hot ? 1.25 : 1) - tl.hs) * Math.min(1, dt * 9);
        /* 크기는 transform 의 scale 로만 바꾼다 — 폭·높이를 매 프레임 바꾸면 타일 15개를 매번 다시 배치·다시 그려 폰·절전 모드에서 끊겼다.
           기준 크기는 가장 클 때(맨 앞·마우스 올림 1.25배)로 잡아 늘 줄여서만 그린다 (늘리면 흐려진다) */
        var bw = A * tl.kw * (small ? 1.18 : 1) * 1.25, bh = bw / tl.ar;
        if (tl.bw !== bw) { tl.bw = bw; tl.el.style.width = bw.toFixed(1) + 'px'; tl.el.style.height = bh.toFixed(1) + 'px'; }
        tl.el.style.transform = 'translate3d(' + (x - bw / 2).toFixed(1) + 'px,' + (y - bh / 2).toFixed(1) + 'px,0) scale(' + (s * tl.hs / 1.25).toFixed(4) + ')';
        var zi = tl.hot ? '55' : String(1 + Math.round((d + 1) * 25)); if (tl.zi !== zi) { tl.zi = zi; tl.el.style.zIndex = zi; }   /* 1–51: 헤더(100)·진입 화면(200)보다 항상 아래 */
      });
      /* 왼쪽 아래 태그라인: 6초마다 다음 문장으로, 글자가 흩어졌다가 자리 잡는다 */
      if (now - tagT > 6000) { tagI = (tagI + 1) % tags.length; tagT = now; }
      var txt = tags[tagI], pr = (reduce || STATIC) ? 1 : Math.min(1, (now - tagT) / 900), n = Math.floor(pr * txt.length), out = '';
      for (var i = 0; i < txt.length; i++) out += (i < n || txt[i] === ' ') ? txt[i] : SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)].toLowerCase();
      if (pr < 1 || tagEl.textContent !== txt) tagEl.textContent = out;
      if (!STATIC) raf = requestAnimationFrame(frameFn);
    }
    if (STATIC) frameFn(spin.last + 16); else raf = requestAnimationFrame(frameFn);
  }
  /* 휠: 아래로 굴리면 시계 방향으로 빨라지고, 위로 굴리면 반대로 돈다. 터치: 쓸어 넘긴 방향으로. 마지막으로 민 방향이 그 뒤의 느린 회전 방향이 된다 */
  function push(v){ spin.vel = Math.max(-2.6, Math.min(2.6, spin.vel + v)); if (Math.abs(v) > 0.003) spin.dir = v > 0 ? 1 : -1; }
  window.addEventListener('wheel', function(e){ if (!document.body.classList.contains('is-home')) return; e.preventDefault(); push((e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY) * 0.0028); }, { passive: false });
  var tY = null, tX = null;
  window.addEventListener('touchstart', function(e){ var t = e.touches[0]; tY = t.clientY; tX = t.clientX; }, { passive: true });
  window.addEventListener('touchmove', function(e){ if (!document.body.classList.contains('is-home') || tY === null) return; var t = e.touches[0]; var dy = tY - t.clientY, dx = tX - t.clientX; tY = t.clientY; tX = t.clientX; e.preventDefault(); push((dy + dx) * 0.014); }, { passive: false });
  window.addEventListener('touchend', function(){ tY = null; }, { passive: true });

  /* ── works: 멀티뷰 아카이브 (테이블 인덱스 vs 미디어 그리드) ── */
  var currentView = localStorage.getItem('da-pf-view') || 'index';
  function Works(filter){
    cancelAnimationFrame(raf); document.body.classList.remove('is-home');
    filter = filter || 'all';
    var metas = ['all'].concat(D.works.map(function(w){ return w.meta; }).filter(function(m, i, a){ return a.indexOf(m) === i; }));
    var list = D.works.filter(function(w){ return filter === 'all' || w.meta === filter; });

    var viewControls = '<div class="view-switch">' +
      '<button type="button" class="v-btn ' + (currentView === 'index' ? 'is-active' : '') + '" data-view="index">/ TABLE INDEX</button>' +
      '<button type="button" class="v-btn ' + (currentView === 'grid' ? 'is-active' : '') + '" data-view="grid">/ MEDIA GRID</button>' +
      '<a href="submit.html" class="v-btn" style="color:var(--key);border-color:rgba(244,255,83,0.4);background:rgba(244,255,83,0.06);margin-left:6px;">+ 새 작품 등록하기</a>' +
      '</div>';

    var toolbar = '<div class="works-toolbar">' +
      '<div class="filters">' + metas.map(function(m){ return '<a class="' + (m === filter ? 'is-active' : '') + '" href="#/works/' + m + '">' + m + '</a>'; }).join('') + '</div>' +
      viewControls +
      '</div>';

    var bodyContent = '';
    if (currentView === 'index') {
      bodyContent = '<div class="archive-table-wrap">' +
        '<table class="archive-table">' +
        '<thead><tr><th class="th-id">NO.</th><th class="th-title">TITLE</th><th class="th-artist">ARTIST</th><th class="th-disc">DISCIPLINE</th><th class="th-year">YEAR</th><th class="th-tools">TOOLS / MEDIA</th></tr></thead>' +
        '<tbody>' + list.map(function(w){
          return '<tr class="archive-row" data-slug="' + w.slug + '" data-cursor="VIEW // ' + w.n + '">' +
            '<td class="td-id">' + w.n + '</td>' +
            '<td class="td-title"><a href="#/work/' + w.slug + '">' + esc(w.title) + ' ↗</a></td>' +
            '<td class="td-artist">' + esc(w.student) + '</td>' +
            '<td class="td-disc"><span>' + w.meta + '</span></td>' +
            '<td class="td-year">' + esc(w.year || '2024') + '</td>' +
            '<td class="td-tools">' + esc((w.tools || []).join(' · ') || 'Interactive Media') + '</td>' +
            '</tr>';
        }).join('') + '</tbody></table>' +
        '<div id="float-thumb" class="float-thumb"><div class="ft-media" id="ft-media"></div><div class="ft-cap" id="ft-cap"></div></div>' +
        '</div>';
    } else {
      bodyContent = '<div class="media-grid">' + list.map(function(w){
        return '<a class="grid-card" href="#/work/' + w.slug + '" data-cursor="VIEW // ' + w.n + '">' +
          '<div class="gc-media" data-slug="' + w.slug + '"></div>' +
          '<div class="gc-info">' +
          '<div class="gc-meta"><span>' + w.n + '</span><span>' + w.meta + '</span></div>' +
          '<h3 class="gc-title">' + esc(w.title) + '</h3>' +
          '<span class="gc-student">' + esc(w.student) + ' · ' + esc(w.year || '2024') + '</span>' +
          '</div></a>';
      }).join('') + '</div>';
    }

    app.innerHTML = '<section class="page"><h1 class="display" style="max-width:32ch">' + esc((D.statement || []).join(' ')) + '</h1>' +
      '<p class="micro" style="margin:12px 0 0"><a href="submit.html" style="border-bottom:1px solid var(--border-hairline)">학생 작품 게시하기 ↗</a></p>' +
      toolbar +
      bodyContent +
      '</section>' + footer();

    /* 뷰 전환 버튼 이벤트 */
    Array.prototype.forEach.call(document.querySelectorAll('.v-btn'), function(b){
      b.addEventListener('click', function(){
        currentView = b.getAttribute('data-view');
        localStorage.setItem('da-pf-view', currentView);
        Works(filter);
      });
    });

    /* 그리드 뷰 미디어 주입 */
    if (currentView === 'grid') {
      Array.prototype.forEach.call(document.querySelectorAll('.gc-media'), function(box){
        var sl = box.getAttribute('data-slug');
        var w = D.works.filter(function(x){ return x.slug === sl; })[0];
        if (w) box.appendChild(media(w, 480, 300));
      });
    }

    /* 테이블 뷰 플로팅 썸네일 추적 */
    if (currentView === 'index') {
      var ft = document.getElementById('float-thumb'), ftMedia = document.getElementById('ft-media'), ftCap = document.getElementById('ft-cap');
      var fmx = 0, fmy = 0, curRow = null;
      window.addEventListener('mousemove', function(e){
        fmx = e.clientX + 24;
        fmy = e.clientY - 90;
        if (ft && ft.classList.contains('is-on')) {
          ft.style.left = Math.min(window.innerWidth - 280, fmx) + 'px';
          ft.style.top = Math.max(80, Math.min(window.innerHeight - 200, fmy)) + 'px';
        }
      });
      Array.prototype.forEach.call(document.querySelectorAll('.archive-row'), function(r){
        r.addEventListener('mouseenter', function(e){
          var sl = r.getAttribute('data-slug');
          var w = D.works.filter(function(x){ return x.slug === sl; })[0];
          if (!w) return;
          ftMedia.innerHTML = '';
          ftMedia.appendChild(media(w, 260, 160));
          ftCap.innerHTML = '<span>' + esc(w.title) + '</span><span>' + esc(w.student) + '</span>';
          ft.classList.add('is-on');
          ft.style.left = Math.min(window.innerWidth - 280, e.clientX + 24) + 'px';
          ft.style.top = Math.max(80, Math.min(window.innerHeight - 200, e.clientY - 90)) + 'px';
        });
        r.addEventListener('mouseleave', function(){
          if (ft) ft.classList.remove('is-on');
        });
      });
    }
  }

  /* ── 상세 ── */
  function Work(slug){
    cancelAnimationFrame(raf); document.body.classList.remove('is-home');
    var w = D.works.filter(function(x){ return x.slug === slug; })[0] || D.works[0]; if (!w) { Works(); return; }
    var more = D.works.filter(function(x){ return x.slug !== w.slug; }).slice(0, 3);
    app.innerHTML = '<section class="page tight"><a class="navlink back" href="#/works">← works</a>' +
      '<div class="work-head"><span class="label">' + w.n + '</span><h1 class="work-title">' + esc(w.title) + '</h1></div><div id="hero"></div>' +
      '<section class="section"><div class="label">about</div><div class="prose"><h2 class="display">' + esc(w.statement) + '</h2>' + (w.paragraphs || []).map(function(p){ return '<p class="body">' + esc(p) + '</p>'; }).join('') + '</div></section>' +
      '<section style="margin-top:var(--space-8x)" id="second"></section>' +
      '<section class="section"><div class="label">credits</div><div class="credits">' +
        '<div class="credit"><div class="label">student</div><ul><li>' + esc(w.student) + '</li></ul></div>' +
        '<div class="credit"><div class="label">discipline</div><ul><li>' + w.meta + '</li></ul></div>' +
        '<div class="credit"><div class="label">year</div><ul><li>' + esc(w.year) + '</li></ul></div>' +
        '<div class="credit"><div class="label">tools</div><ul>' + (w.tools || []).map(function(t){ return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' +
        (w.external_url ? '<div class="credit"><div class="label">project link</div><ul><li><a href="' + esc(w.external_url) + '" target="_blank" rel="noopener" style="color:var(--key);text-decoration:underline">라이브 프로젝트 방문 ↗</a></li></ul></div>' : '<div class="credit"><div class="label">institution</div><ul><li>서울예술대학교 디지털아트전공</li></ul></div>') +
        '<div class="credit"><div class="label">submission</div><ul><li><a href="submit.html" style="color:var(--text-muted);text-decoration:underline">+ 새 작품 등록하기 ↗</a></li></ul></div>' +
      '</div></section>' +
      '<section style="margin-top:var(--space-8x)"><div class="label">more to discover</div><div class="rows">' + more.map(rowItem).join('') + '</div></section></section>' + footer();
    document.getElementById('hero').appendChild(frame(w, '', w.title, w.n));
    var second = frame(w, 'r219', '', '', true);
    second.querySelector('.well').insertAdjacentHTML('beforeend', '<div class="player"><span class="pill">play</span><span class="grp"><span class="pill">sound : off</span><span class="pill">full screen</span></span></div>');
    document.getElementById('second').appendChild(second);
  }

  function route(){
    var h = location.hash.replace(/^#\/?/, ''), parts = h.split('/'), name = parts[0] || 'home';
    if (name === 'works') Works(parts[1]); else if (name === 'work') Work(parts[1]); else Home();
    document.querySelectorAll('.hdr .center a').forEach(function(el){
      var r = el.getAttribute('data-route');
      el.classList.toggle('is-active', (name === 'home' && r === 'home') || ((name === 'works' || name === 'work') && r === 'works'));
    });
    window.scrollTo(0, 0);
  }
  /* ── 데이터: Supabase 연결 및 로컬 저장소 병합 ── */
  function pad3(n){ return ('00' + n).slice(-3); }
  function applyRemote(rows, site){
    if (rows && rows.length) D.works = rows.map(function(r, i){
      var rt = String(r.ratio || '16:10').split(':').map(Number);
      var tools = Array.isArray(r.tools) ? r.tools : (typeof r.tools === 'string' ? r.tools.split(',').map(function(s){ return s.trim(); }).filter(Boolean) : []);
      var paragraphs = Array.isArray(r.paragraphs) ? r.paragraphs : (typeof r.paragraphs === 'string' ? r.paragraphs.split(/\n\s*\n/).map(function(s){ return s.trim(); }).filter(Boolean) : []);
      return {
        n: pad3(i + 1),
        slug: r.slug,
        title: r.title || '',
        student: r.student || '',
        meta: r.category || 'installation',
        year: r.year || '',
        tools: tools,
        statement: r.statement || '',
        paragraphs: paragraphs,
        seed: i * 7 + 3,
        ratio: (rt.length === 2 && rt[0] > 0 && rt[1] > 0) ? rt : null,
        image: r.image || '',
        video: r.video || '',
        external_url: r.external_url || ''
      };
    });
    (site || []).forEach(function(row){ if (row.value != null && row.value !== '' && !(Array.isArray(row.value) && !row.value.length)) D[row.key] = row.value; });
  }

  function getLocalWorks(){
    try {
      return JSON.parse(localStorage.getItem('pf-works') || '[]')
        .filter(function(r){ return r.published !== false && r.status !== 'rejected'; });
    } catch (e) { return []; }
  }

  function loadRemote(done){
    var C = window.SITE_CONFIG || {};
    var localWorks = getLocalWorks();

    if (STATIC) {
      if (localWorks.length) applyRemote(localWorks, []);
      return done();
    }
    if (!C.SUPABASE_URL || !C.SUPABASE_ANON_KEY || typeof fetch !== 'function') {
      try {
        var ls = JSON.parse(localStorage.getItem('pf-site') || '{}');
        applyRemote(localWorks, Object.keys(ls).map(function(k){ return { key: k, value: ls[k] }; }));
      } catch (e) {}
      return done();
    }

    var h = { apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY }, base = C.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/';
    var started = false, start = function(){ if (!started) { started = true; done(); } };
    var late = setTimeout(start, 3500);

    Promise.all([
      fetch(base + 'works?select=*&published=eq.true&status=eq.approved&order=sort.asc,created_at.desc', { headers: h })
        .then(function(r){ return r.ok ? r.json() : []; }).catch(function(){ return []; }),
      fetch(base + 'site?select=key,value', { headers: h })
        .then(function(r){ return r.ok ? r.json() : []; }).catch(function(){ return []; })
    ]).then(function(res){
      clearTimeout(late);
      var remoteWorks = res[0] || [];
      var knownSlugs = {};
      remoteWorks.forEach(function(w){ knownSlugs[w.slug] = true; });
      var extraLocal = localWorks.filter(function(w){ return !knownSlugs[w.slug]; });
      var mergedWorks = remoteWorks.concat(extraLocal);

      if (mergedWorks.length) {
        applyRemote(mergedWorks, res[1]);
      } else if (localWorks.length) {
        applyRemote(localWorks, res[1]);
      }
      if (started) route(); else start();
    }, start);
  }

  loadRemote(function(){ window.addEventListener('hashchange', route); route(); });

  /* ── 진입: 퍼센트 카운터 → 페이드 (세션당 한 번) ── */
  var entry = document.getElementById('entry'), pct = document.getElementById('pct');
  if (D.strapline) document.getElementById('strap').textContent = D.strapline;
  var seen = false; try { seen = !!sessionStorage.getItem('pf-entered'); } catch (e) {}
  if (reduce || seen || STATIC) entry.classList.add('is-done');
  if (STATIC) entry.style.display = 'none';
  else {
    var e0 = performance.now();
    (function tick(now){ var p = Math.min(1, (now - e0) / 900); pct.textContent = Math.round(p * 100) + '%'; if (p < 1) requestAnimationFrame(tick); else setTimeout(function(){ entry.classList.add('is-done'); }, 150); })(e0);
    try { sessionStorage.setItem('pf-entered', '1'); } catch (e) {}
  }
})();
}

export default function PortfolioPage() {
  const containerRef = useRef(null);

  useEffect(() => {
    // 1. Inject exact CSS
    const styleEl = document.createElement('style');
    styleEl.id = 'portfolio-page-style';
    styleEl.textContent = PORTFOLIO_CSS;
    document.head.appendChild(styleEl);

    // 2. Run script (작품 데이터·Supabase 연결 전역값을 먼저 채운다)
    let cleanup;
    try {
      installSiteGlobals();
      cleanup = runPortfolioScript();
    } catch (e) {
      console.warn('Portfolio script execution:', e);
    }

    return () => {
      document.body.classList.remove('is-home');
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
      className="portfolio-vanilla-wrapper"
      dangerouslySetInnerHTML={{ __html: PORTFOLIO_MARKUP }}
    />
  );
}
