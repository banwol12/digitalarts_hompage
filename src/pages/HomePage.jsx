import React, { useLayoutEffect, useRef } from 'react';
import { animate, stagger, spring, scrambleText, utils, engine } from 'animejs';

// HOME_SCRIPT 가 전역 anime 로 쓰는 함수들 — CDN 대신 사이트에 같이 묶는다 (CDN 을 기다리지 않고, 못 받아도 인트로·챕터가 멈추지 않게).
// HOME_SCRIPT 에서 anime 의 다른 함수를 새로 쓰면 여기에도 더한다
const ANIME = { animate, stagger, spring, scrambleText, utils, engine };

const HOME_CSS = `
/* ═══ Cascades Design System — tokens (Claude Design 프로젝트 93225dbe 에서 동기화, 값 그대로) ═══ */
:root{
  /* colors — base neutrals (warm paper family) */
  --paper:#f7f7f5; --neutral-100:#f3f3f3; --neutral-200:#eeeef0; --beige:#f5f0eb; --white:#ffffff;
  /* base ink */
  --ink:#000000; --ink-70:rgba(0,0,0,0.70); --ink-45:rgba(0,0,0,0.45); --ink-15:rgba(0,0,0,0.15); --ink-08:rgba(0,0,0,0.08); --ink-04:rgba(0,0,0,0.04);
  /* base blue */
  /* 사이트 조정: 키 컬러를 Cascades 블루(#0E76FF)에서 형광초록 #F4FF53 으로 교체. 토큰 이름은 유지 */
  --blue-primary:#f4ff53; --blue-press:#dce73c; --blue-secondary:#f9ffa6; --blue-tint-40:rgba(244,255,83,0.40); --blue-tint-10:rgba(244,255,83,0.10);
  /* status */
  --green-success:oklch(0.58 0.13 155); --amber-warning:oklch(0.75 0.15 75); --red-danger:oklch(0.55 0.20 26);
  /* semantic surfaces */
  --surface-page:var(--paper); --surface-card:var(--white); --surface-sunken:var(--neutral-100); --surface-muted:var(--neutral-200); --surface-warm:var(--beige); --surface-inverse:var(--ink); --surface-accent:var(--blue-primary); --surface-accent-soft:var(--blue-tint-40);
  /* semantic text */
  --text-body:var(--ink); --text-muted:rgba(0,0,0,0.55); --text-secondary:var(--ink-70); --text-inverse:var(--neutral-100); --text-accent:var(--blue-primary); --text-link:var(--ink); --text-link-hover:var(--blue-primary);
  /* semantic lines */
  --border-hairline:var(--ink-15); --border-strong:var(--ink); --border-inverse:rgba(243,243,243,0.20); --focus-ring:var(--ink);
  /* semantic accents */
  --accent:var(--blue-primary); --accent-hover:var(--blue-press); --accent-on:var(--ink);

  /* fonts */
  /* 사이트 조정: 서체를 Pretendard 로 통일 (Cascades 원값은 Archivo / Archivo Narrow) */
  --font-core:"Pretendard","Noto Sans KR","Helvetica Neue",Arial,sans-serif;
  --font-narrow:"Pretendard","Noto Sans KR","Helvetica Neue",Arial,sans-serif;
  --font-mono:"Geist Mono","Pretendard","Noto Sans KR",ui-monospace,Menlo,monospace;   /* 2026-09-28 리뉴얼: 라벨·캡션·숫자는 고정폭 — 코드를 재료로 쓰는 전공의 결 */
  --font-display:var(--font-core); --font-body:var(--font-core); --font-label:var(--font-mono);

  /* typography */
  /* 사이트 조정: '글씨가 크다'는 피드백에 따라 Cascades 원값(88/68/44/32/24/19/16/13/12)에서 2px 씩 축소, 본문 16px 유지 */
  /* 2차 조정: 글자 +5px, 행간 +5px */
  /* 3차 조정: 글자 크기를 현재 값의 2/3 로 (행간의 +5px 는 유지) */
  --k:1;   /* 화면 배율: 넓고 높은 데스크톱에서만 1 보다 커진다 (아래 @media) */
  --text-display:calc(59px * var(--k)); --text-h1:calc(45px * var(--k)); --text-h2:calc(29px * var(--k)); --text-h3:calc(21px * var(--k)); --text-lead:calc(16px * var(--k)); --text-md:calc(13px * var(--k)); --text-base:calc(12px * var(--k)); --text-label:calc(10px * var(--k)); --text-caption:calc(10px * var(--k));   /* 2026-09-21: 글자 2px 씩 축소 (라벨·캡션은 1px) — 픽셀 연출이 주인공이 되게 */
  --weight-core:500; --weight-body:400;
  --leading-display:calc(0.95em + 6.5px * var(--k)); --leading-heading:calc(1.05em + 6.5px * var(--k)); --leading-lead:calc(1.25em + 6.5px * var(--k)); --leading-body:calc(1.5em + 6.5px * var(--k)); --leading-label:calc(1.2em + 6.5px * var(--k));   /* 행간 +1.5px (사용자 요청 2026-09-21) */
  /* 사이트 조정: 자간 확대 (원값 -0.03 / -0.02 / 0 / 0.08em) */
  --tracking-display:0.02em; --tracking-heading:0.03em; --tracking-body:0.04em; --tracking-label:0.18em;
  --type-display:var(--weight-core) var(--text-display)/var(--leading-display) var(--font-display);
  --type-h1:var(--weight-core) var(--text-h1)/var(--leading-heading) var(--font-display);
  --type-h2:var(--weight-core) var(--text-h2)/var(--leading-heading) var(--font-display);
  --type-h3:var(--weight-core) var(--text-h3)/var(--leading-heading) var(--font-display);
  --type-lead:var(--weight-core) var(--text-lead)/var(--leading-lead) var(--font-body);
  --type-body:var(--weight-body) var(--text-base)/var(--leading-body) var(--font-body);
  --type-label:var(--weight-core) var(--text-label)/var(--leading-label) var(--font-label);
  --type-caption:var(--weight-core) var(--text-caption)/var(--leading-label) var(--font-label);

  /* spacing */
  --space-2:calc(2px * var(--k)); --space-8:calc(8px * var(--k)); --space-12:calc(12px * var(--k)); --space-16:calc(16px * var(--k)); --space-20:calc(20px * var(--k)); --space-22:calc(22px * var(--k)); --space-24:calc(24px * var(--k)); --space-28:calc(28px * var(--k)); --space-32:calc(32px * var(--k)); --space-36:calc(36px * var(--k)); --space-37:calc(37px * var(--k)); --space-52:calc(52px * var(--k)); --space-56:calc(56px * var(--k)); --space-60:calc(60px * var(--k)); --space-64:calc(64px * var(--k));
  --gutter:var(--space-24); --pad-control-y:var(--space-12); --pad-control-x:var(--space-24); --pad-card:var(--space-32); --stack-tight:var(--space-8); --stack:var(--space-16); --stack-loose:var(--space-32); --section-y:var(--space-64);
  --container-max:calc(1440px * var(--k)); --measure:64ch;
  --hdr:calc(64px * var(--k));                                   /* 상단 바 높이 (폰에서는 두 줄, 88px) */

  /* borders */
  --radius-none:0px; --radius-sm:2px; --radius-pill:999px; --border-width:1px; --border-width-strong:2px;
  --hairline:1px solid var(--border-hairline); --rule:1px solid var(--border-strong);
  --shadow-none:none; --shadow-overlay:0 1px 0 var(--ink-15), 0 24px 64px rgba(0,0,0,0.18);

  /* effects */
  --wash-blue:radial-gradient(60% 70% at 50% 0%, rgba(244,255,83,0.28) 0%, rgba(247,247,245,0) 72%);
  --wash-dark:radial-gradient(50% 60% at 50% 100%, rgba(244,255,83,0.16) 0%, rgba(0,0,0,0) 70%);
  --protect-bottom:linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 100%);
  --blur-panel:blur(16px); --overlay-scrim:rgba(0,0,0,0.55);

  /* motion */
  --ease:ease; --ease-out:cubic-bezier(0.22,1,0.36,1); --ease-in-out:cubic-bezier(0.77,0,0.175,1);
  --duration-instant:1ms; --duration-fast:120ms; --duration-base:200ms; --duration-slow:400ms;
  --transition-color:color var(--duration-fast) var(--ease), background-color var(--duration-fast) var(--ease), border-color var(--duration-fast) var(--ease);
  --transition-transform:transform var(--duration-fast) var(--ease);
}
/* 넓은 데스크톱: 콘텐츠 폭·글자·여백을 함께 키워 빈 공간을 줄인다 (사용자 요청 2026-09-28, 윈도우 27인치에서 빈 공간이 많다) */
@media (min-width:1800px) and (min-height:880px){:root{--k:1.15}}
@media (min-width:2200px) and (min-height:1080px){:root{--k:1.32}}
@media (min-width:2480px) and (min-height:1220px){:root{--k:1.5}}
/* Inverse scope: black sections. Apply with class="cs-inverse". */
.cs-inverse{
  --surface-page:var(--ink); --surface-card:rgba(238,238,240,0.10); --surface-sunken:rgba(238,238,240,0.06); --surface-muted:rgba(238,238,240,0.10);
  --text-body:var(--neutral-100); --text-muted:rgba(243,243,243,0.55); --text-secondary:rgba(243,243,243,0.75); --focus-ring:var(--blue-primary);
  --text-link:var(--neutral-100); --text-link-hover:var(--blue-secondary);
  --border-hairline:rgba(243,243,243,0.20); --border-strong:var(--neutral-100); --text-accent:var(--blue-secondary);
}

/* ── base.css ── */
*,*::before,*::after{box-sizing:border-box}
html{scroll-snap-type:y mandatory}
html.booting{overflow:hidden}                                   /* 첫 입장 애니메이션 동안은 스크롤을 막는다 */
body{margin:0;background:var(--surface-page);color:var(--text-body);font:var(--type-body);letter-spacing:var(--tracking-body);-webkit-font-smoothing:antialiased;word-break:keep-all;overflow-x:hidden;transition:background-color var(--duration-slow) var(--ease),color var(--duration-slow) var(--ease)}
h1,h2,h3,h4,p{margin:0}
a{color:var(--text-link);text-decoration:none;transition:var(--transition-color)}
a:hover{color:var(--text-link-hover)}
::selection{background:var(--blue-secondary);color:var(--ink)}
:focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}
.cs-label{font:var(--type-label);letter-spacing:var(--tracking-label);text-transform:uppercase}
.cs-caption{font:var(--type-caption);letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-muted)}
img,canvas,svg{display:block;max-width:100%}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;padding:0}

/* ═══ site layer ═══ */
.shell{max-width:var(--container-max);margin:0 auto;padding:0 var(--space-36)}
.display{font:var(--type-display);letter-spacing:var(--tracking-display);font-size:clamp(23px,3.4vw,var(--text-display));text-wrap:balance}
.h2{font:var(--type-h2);letter-spacing:var(--tracking-heading);font-size:clamp(20px,2.15vw,var(--text-h2));text-wrap:balance}
.h3{font:var(--type-h3);letter-spacing:var(--tracking-heading);font-size:clamp(15px,1.3vw,var(--text-h3))}
.lead{font:var(--type-lead);color:var(--text-secondary);font-size:clamp(13px,1vw,var(--text-lead));max-width:38ch}
.body{font:var(--type-body);color:var(--text-secondary);max-width:var(--measure)}
p,.lead,.body,.set li p,.tools .h3,.card .title{text-wrap:pretty;overflow-wrap:break-word}   /* 마지막 줄에 온점이나 짧은 낱말만 남지 않게 (사용자 요청) */
.h3{text-wrap:balance}
.muted{color:var(--text-muted)}
.i{width:calc(16px * var(--k));height:calc(16px * var(--k));flex:none;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.i-20{width:calc(20px * var(--k));height:calc(20px * var(--k))}

/* Button (Cascades) */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:calc(8px * var(--k));min-height:calc(40px * var(--k));padding:calc(12px * var(--k)) calc(24px * var(--k));border-radius:var(--radius-sm);font:var(--weight-core) var(--text-label)/1 var(--font-narrow);letter-spacing:var(--tracking-label);text-transform:uppercase;text-decoration:none;cursor:pointer;transition:var(--transition-color);border:1px solid transparent;white-space:nowrap}
.btn{transition:var(--transition-color),scale 160ms var(--ease-out)}
.btn:active{scale:.97}
.btn .i{transition:transform .35s var(--ease-out)}
@media (hover:hover) and (pointer:fine){.btn:hover .i{transform:translate(2px,-2px)}}
.btn.sm{min-height:calc(32px * var(--k));padding:calc(8px * var(--k)) calc(16px * var(--k))}
.btn.lg{min-height:calc(56px * var(--k));padding:calc(16px * var(--k)) calc(32px * var(--k));gap:calc(12px * var(--k));font:var(--weight-core) var(--text-md)/1 var(--font-core);letter-spacing:var(--tracking-body);text-transform:none}
.btn.primary{background:var(--accent);color:var(--accent-on);border-color:var(--accent)}
.btn.primary:hover{background:var(--accent-hover);border-color:var(--accent-hover);color:var(--accent-on)}
.btn.secondary{background:transparent;color:var(--text-body);border-color:var(--border-strong)}
.btn.secondary:hover{background:var(--ink);color:var(--text-inverse)}
.cs-inverse .btn.secondary:hover{background:var(--neutral-100);color:var(--ink)}
.iconbtn{display:inline-flex;align-items:center;justify-content:center;width:calc(40px * var(--k));height:calc(40px * var(--k));border:1px solid var(--border-hairline);border-radius:var(--radius-sm);color:var(--text-body);background:transparent;transition:var(--transition-color);flex:none}
.iconbtn:hover{background:var(--ink-08);border-color:var(--border-strong);color:var(--text-body)}
.cs-inverse .iconbtn:hover{background:rgba(238,238,240,0.10)}
.tag{display:inline-flex;align-items:center;height:28px;padding:0 12px;border-radius:var(--radius-pill);font:var(--type-label);letter-spacing:var(--tracking-label);text-transform:uppercase;border:1px solid var(--border-hairline);color:var(--text-body);white-space:nowrap}

/* Card (Cascades): hairline, 2px, 32px, hover → beige / inverse tint. never lifts */
.card{display:flex;flex-direction:column;gap:var(--space-8);color:var(--text-body);text-decoration:none}
a.card:hover{color:var(--text-body)}
.card .media{position:relative;margin-bottom:var(--space-8);overflow:hidden;background:var(--ink);border-radius:var(--radius-sm)}
.card .media::after{content:"";position:absolute;inset:0;border:1px solid var(--border-hairline);border-radius:inherit;pointer-events:none}
.card .media canvas{width:100%;aspect-ratio:16/9;transition:scale .9s var(--ease-out)}
.card .title{transition:color var(--duration-base) var(--ease)}
@media (hover:hover) and (pointer:fine){a.card:hover .media canvas{scale:1.04}a.card:hover .title{color:var(--text-accent)}}
.card .title{font:var(--weight-core) var(--text-lead)/calc(1.15em + 5px) var(--font-core);letter-spacing:var(--tracking-heading);font-size:clamp(13px,0.95vw,var(--text-lead))}

/* ── Header: fixed, 64px, hairline. Colors follow the body scope. ── */
.site-header{position:fixed;inset:0 0 auto 0;z-index:30;height:var(--hdr);border-bottom:1px solid var(--border-hairline);background:var(--surface-page);transition:background-color var(--duration-slow) var(--ease),color var(--duration-slow) var(--ease),opacity .7s var(--ease) .35s,transform .7s var(--ease) .35s}
html.booting .site-header{opacity:0;transform:translateY(-10px);pointer-events:none}
.progress{transition:opacity .7s var(--ease) .6s}
.hdr-actions{display:flex;gap:var(--space-8);align-items:center;justify-self:end}
@property --a{syntax:'<percentage>';inherits:false;initial-value:0%}
html.booting .progress{opacity:0}
.site-header .row{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:var(--space-24);height:calc(64px * var(--k))}
.site-header .row>.brand{justify-self:start}
.site-header .row>.site-nav{justify-self:center}
.site-header .row>.btn{justify-self:end}
.subnav{display:none}
.brand{display:flex;align-items:center;gap:var(--space-12);font:var(--weight-core) calc(17px * var(--k))/1 var(--font-core);letter-spacing:0.04em;color:var(--text-body);white-space:nowrap}
.brand:hover{color:var(--text-body)}
.brand .mark{width:calc(24px * var(--k));height:calc(26px * var(--k));flex:none}
.brand .mark svg{width:100%;height:100%;fill:currentColor}
.brand-text{display:flex;flex-direction:column;gap:2px;line-height:1.1}
.brand-text small{font:600 calc(11px * var(--k))/1.1 var(--font-core);letter-spacing:0.3em;text-transform:uppercase;color:var(--text-muted)}
.brand-text strong{font:600 calc(19px * var(--k))/1.1 var(--font-core);letter-spacing:-0.03em;text-transform:uppercase}   /* 헤더 브랜드도 가운데 제목(.intro-sub·.intro-title)과 같은 대문자·자간 (사용자 요청 2026-09-28: 두 글씨 통일) */
.site-nav{display:flex;gap:var(--space-32);position:relative}
.nav-ind{position:absolute;left:0;bottom:calc(-9px * var(--k));width:0;height:1px;background:var(--text-body);opacity:0;pointer-events:none}
.site-nav a{font:var(--type-label);letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-muted)}
.site-nav a:hover,.site-nav a.is-active{color:var(--text-body)}
.progress{position:fixed;right:var(--space-36);top:50%;transform:translateY(-50%);z-index:20;display:flex;flex-direction:column;gap:var(--space-12);align-items:flex-end}
.progress a{display:flex;align-items:center;gap:var(--space-8);color:var(--text-muted)}
.progress a i{display:block;width:calc(16px * var(--k));height:1px;background:currentColor;transition:width var(--duration-base) var(--ease)}
.progress a.is-active{color:var(--text-body)}
.progress a.is-active i{width:32px}

/* ── Scene: one fixed canvas behind every chapter ── */
.scene{position:fixed;inset:0;z-index:0;pointer-events:none}
.scene canvas{width:100%;height:100%}

/* ── Chapters: each one viewport, snap, content reveals on activation ── */
.chapter{position:relative;z-index:1;min-height:100vh;min-height:100svh;scroll-snap-align:start;scroll-snap-stop:always;display:grid;grid-template-columns:minmax(0,1fr);align-content:center;padding-top:var(--hdr)}
.chapter .shell{min-width:0;max-width:min(100%,var(--container-max))}
.cards{max-width:100%}
/* 터치 기기: 문서를 스크롤하지 않고 main 을 챕터 단위로 밀어 넘긴다 (iOS 주소창 높이 변화에 흔들리지 않음) */
html.touch-paging,html.touch-paging body{height:100%;overflow:hidden;overscroll-behavior:none;scroll-snap-type:none}
html.touch-paging main{position:fixed;inset:0;z-index:1;transform:translateY(0);transition:transform 620ms cubic-bezier(.22,1,.36,1);will-change:transform}
html.touch-paging .chapter{height:100%;min-height:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
html.touch-paging .cards{touch-action:pan-x}
@media (prefers-reduced-motion:reduce){html.touch-paging main{transition:none}}
.chapter .shell{width:100%}
.js .reveal{opacity:0;transform:translateY(14px);transition:opacity var(--duration-slow) var(--ease),transform var(--duration-slow) var(--ease);transition-delay:calc(var(--i,0) * 70ms + 120ms)}
.js .chapter.is-active .reveal{opacity:1;transform:none}
.chapter .kicker{margin-bottom:var(--space-16)}
.stack{display:flex;flex-direction:column;gap:var(--space-24)}

/* Chapter 0 — intro: logo centred (canvas), wordmark below */
.intro{text-align:center;align-content:end;padding-bottom:12vh}
.intro .wordmark{display:flex;flex-direction:column;gap:var(--space-12);align-items:center}
.intro-sub{font:600 clamp(12px,1.2vw,calc(17px * var(--k)))/1.4 var(--font-core);letter-spacing:0.3em;text-transform:uppercase;color:var(--text-muted);text-align:center;padding-left:0.3em}
.intro-title{font:600 clamp(2.5rem,9vw,calc(7rem * var(--k)))/.94 var(--font-core);letter-spacing:-0.03em;text-transform:uppercase;color:var(--text-body);text-align:center;margin-top:2px}   /* 포트폴리오 푸터 워드마크와 같은 서체·자간 (사용자 요청) */
.js .intro .wordmark{opacity:0;transform:translateY(14px);transition:opacity var(--duration-slow) var(--ease),transform var(--duration-slow) var(--ease)}
.js .intro.is-ready .wordmark{opacity:1;transform:none}
.intro .hint{position:absolute;left:0;right:0;bottom:var(--space-24);display:flex;justify-content:center}
.intro .hint i{position:relative;display:block;width:1px;height:calc(44px * var(--k));background:var(--border-hairline);overflow:hidden}
.intro .hint i::after{content:"";position:absolute;left:0;top:0;width:1px;height:45%;background:var(--text-body);animation:drip 2.4s var(--ease-in-out) infinite}
.js .intro .hint{opacity:0;transition:opacity var(--duration-slow) var(--ease) 600ms}
.js .intro.is-ready .hint{opacity:1}
@keyframes drip{from{transform:translateY(-100%)}to{transform:translateY(230%)}}

/* Chapter layouts */
.left .shell{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--space-56)}
.right .shell{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--space-56)}
.right .shell>.stack{grid-column:2}
.top{align-content:start;padding-top:calc(var(--hdr) + 7vh)}
.top .shell{max-width:calc(1120px * var(--k))}
.top .stack{gap:var(--space-20)}
.center{text-align:center}
.center .stack{align-items:center}
.center .kicker{justify-content:center;margin-bottom:var(--space-8)}
.center .h2{max-width:22ch;margin-inline:auto}
.center .lead{margin-inline:auto;max-width:44ch}
.tools{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--gutter);text-align:left;width:100%;margin-top:var(--space-12)}
.tools .col{position:relative;padding-top:var(--space-16);display:flex;flex-direction:column;gap:var(--space-12)}
.tools .h3{font-size:clamp(12px,0.85vw,calc(15px * var(--k)));line-height:calc(1.3em + 6.5px)}

/* Lists inside chapters (numbered sets) */
.set{position:relative;list-style:none;margin:0;padding:0}
.set li{position:relative;display:grid;grid-template-columns:calc(56px * var(--k)) minmax(0,1fr);gap:var(--space-16);padding:var(--space-16) 0;align-items:baseline}
.set::before,.set li::after,.tools .col::before{content:"";position:absolute;left:0;right:0;height:1px;background:var(--border-hairline);transform:scaleX(var(--rule,1));transform-origin:0 50%}
.set::before,.tools .col::before{top:0}
.set li::after{bottom:0}
.tools .col::before{background:var(--border-strong)}
.tools .cs-caption{font-family:var(--font-core)}   /* 한글 캡션: 고정폭 쉼표·빈칸이 벌어져 보여 본문 서체로 */
@media (min-width:800px){.right .shell,.works .shell{padding-right:calc(var(--space-36) + var(--space-64))}}   /* 오른쪽 챕터 번호 줄과 겹치지 않게 */
.toolrow{display:flex;flex-wrap:wrap;gap:var(--space-8) var(--space-20);list-style:none;margin:0;padding:0}
.set li .h3{font-size:clamp(13px,1.1vw,calc(19px * var(--k)))}
.set li p{color:var(--text-secondary);max-width:44ch}
.set.two li{grid-template-columns:calc(56px * var(--k)) minmax(0,1fr) minmax(0,1.25fr)}
.set.two li p{font-size:clamp(11px,0.85vw,calc(12.5px * var(--k)));line-height:calc(1.5em + 1.5px)}
@media (min-width:800px) and (max-height:860px){.set li{padding:var(--space-12) 0}.set.two li p{font-size:11.5px}.right .stack{gap:var(--space-16)}}
.cols3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--gutter)}
.cols3 .col{border-top:1px solid var(--border-strong);padding-top:var(--space-16);display:flex;flex-direction:column;gap:var(--space-8)}
.rowhead{display:flex;justify-content:space-between;align-items:flex-end;gap:var(--space-24);flex-wrap:wrap;width:100%}
.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--gutter)}
.actions{display:flex;gap:var(--space-12);flex-wrap:wrap;justify-content:center}

/* Chapter 5 — admission + compact footer */
.works{align-content:center}
.last{grid-template-rows:1fr auto;align-content:stretch}
.last .main{display:grid;align-content:end;padding-bottom:4vh}
.foot{border-top:1px solid var(--border-hairline);padding-top:var(--space-24);padding-bottom:var(--space-32)}
.foot .row{display:flex;justify-content:space-between;align-items:center;gap:var(--space-24);flex-wrap:wrap}
.foot .links{display:flex;gap:var(--space-24);flex-wrap:wrap}
.foot a{display:inline-flex;align-items:center;gap:var(--space-8)}
.foot .links a{background:linear-gradient(currentColor,currentColor) 0 100%/0 1px no-repeat;transition:var(--transition-color),background-size .45s var(--ease-out)}
.foot .links a:hover{background-size:100% 1px}

@media (max-width:1199px){.cards{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:799px){
  html{scroll-snap-type:y proximity}
  .shell{padding:0 var(--space-20)}
  .site-nav,.progress{display:none}
  .site-header .row{display:flex;justify-content:space-between;height:52px;gap:var(--space-12)}
  .subnav a:first-child{margin-left:auto}
  .subnav a:last-child{margin-right:auto}
  .brand{font-size:12px;letter-spacing:0.03em}
  .brand-text small{font-size:9px;letter-spacing:0.18em}   /* 폰: 넓은 자간을 폭에 맞게 (0.3em 이면 입학처 버튼이 화면 밖으로 밀린다) */
  .brand-text strong{font-size:15px}
  .brand .mark{width:20px;height:22px}
  .brand>span:not(.mark){display:flex}
  .subnav{display:flex;gap:var(--space-20);height:36px;align-items:center;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;white-space:nowrap;border-top:1px solid var(--border-hairline)}
  .subnav::-webkit-scrollbar{display:none}
  .subnav a{font:var(--type-label);letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-muted);flex:none;padding:6px 0;border-bottom:1px solid transparent}
  .subnav a.is-active{color:var(--text-body);border-bottom-color:var(--text-body)}
  .site-header .btn.sm{min-height:36px}
  :root{--hdr:88px}
  .chapter{align-content:end;padding-bottom:var(--space-24);padding-top:calc(var(--hdr) + 18vh);text-align:center}
  .chapter .stack{gap:var(--space-16);align-items:center}
  .chapter .kicker{margin-bottom:var(--space-8);justify-content:center}
  .chapter .h2{max-width:none}
  .chapter .lead{margin-inline:auto}
  .set,.tools,.cards{width:100%;text-align:left}
  .rowhead{flex-direction:column;align-items:center;gap:var(--space-12)}
  .set li{grid-template-columns:44px minmax(0,1fr)}
  .toolrow{justify-content:center;gap:var(--space-8) var(--space-16)}
  .actions{justify-content:center}
  .foot .row{align-items:center;text-align:center}
  .foot .row{flex-direction:column;gap:var(--space-12)}
  .foot .links{justify-content:center}
  .intro{padding-bottom:12vh;padding-top:var(--hdr)}
  .intro .wordmark{gap:var(--space-12)}
  .display{font-size:clamp(19px,5vw,29px)}
  .h2{font-size:clamp(17px,4.1vw,23px)}
  .lead{font-size:12px;max-width:none}
  .left .shell,.right .shell{grid-template-columns:1fr}
  .right .shell>.stack{grid-column:1}
  .top{align-content:end;padding-top:calc(var(--hdr) + 18vh)}
  .top .stack{gap:var(--space-12)}
  .tools{grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--space-12) var(--space-16);margin-top:var(--space-4,4px)}
  .tools .col{padding-top:var(--space-12);gap:var(--space-8)}
  .tools .h3{font-size:12px;line-height:calc(1.3em + 6.5px)}
  .set li{grid-template-columns:48px minmax(0,1fr);padding:var(--space-12) 0}
  .set.two li{grid-template-columns:48px minmax(0,1fr);padding:var(--space-8) 0}
  .set.two li p{display:none}
  .set.two li .h3{font-size:13px}
  .set li .h3{font-size:14px}
  .works{align-content:end;padding-bottom:var(--space-32)}
  .cards{display:flex;gap:var(--space-16);overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;margin:0 calc(-1 * var(--space-20));padding:0 var(--space-20) var(--space-8);scrollbar-width:none}
  .cards::-webkit-scrollbar{display:none}
  .cards .card{flex:0 0 76vw;scroll-snap-align:start;gap:var(--space-8)}
  .actions{gap:var(--space-8)}
  .actions .btn.lg{min-height:48px;padding:12px 20px;font-size:12px}
  .last{padding-bottom:var(--space-8)}                                     /* 폰: 05 챕터 전체를 조금 아래로 (저작권·링크가 너무 높아 보였다) */
  .last .main{padding-bottom:var(--space-16)}
  .foot{padding-top:var(--space-20);padding-bottom:var(--space-12)}
  .foot .links{gap:var(--space-16)}
  .foot .row>.cs-caption{letter-spacing:.08em}
}
@media (max-width:409px){.site-header .cta-long{display:none}.site-header .btn.sm{padding:8px 12px}}   /* 좁은 폰: 헤더 버튼은 '입학처 ↗' 만 — 전에는 375px 이하에서 버튼이 화면 밖으로 잘렸다 */
@media (max-width:359px){.site-header .cta-label{display:none}.site-header .btn.sm{padding:8px 10px}}   /* 320px: 화살표만 (읽는 이름은 aria-label) */
.ln{display:block;overflow:hidden;padding:.1em 0;margin:-.1em 0}
.ln>span{display:inline-block}
.am .reveal,.am .intro .wordmark{transition:none;transform:none}
.static .reveal,.static .intro .wordmark,.static .intro .hint{opacity:1!important;transform:none!important;transition:none!important}
.only-mode .chapter:not(.only){display:none}
.static body,.static .site-header{transition:none!important}
@media (prefers-reduced-motion:reduce){
  .js .reveal,.js .intro .wordmark,.js .intro .hint{opacity:1;transform:none;transition:none}
  .intro .hint i::after{animation:none}
}
`;

const HOME_MARKUP = `<!doctype html>
<html lang="ko">
<meta charset="utf-8">
<script>document.documentElement.classList.add('cs-inverse','booting');setTimeout(function(){document.documentElement.classList.remove('booting');},7000);</script>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>서울예술대학교 디지털아트전공</title>
<meta name="description" content="서울예술대학교 영상학부 디지털아트전공. 코드와 3D, 센서와 빛을 재료로 새로운 형태의 예술을 만듭니다. 전공소개·교육과정·진로·학생 포트폴리오·입학안내.">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap">
<script defer src="https://cdn.jsdelivr.net/npm/animejs@4.5.0/dist/bundles/anime.umd.min.js" integrity="sha384-InMmvD3VoYcY7hGjSC80aLb2bNNE4CzpX+Eq6FVDlmB0IKgDvmfPw4UY8L/M++iG" crossorigin="anonymous"></script>
<style>
/* ═══ Cascades Design System — tokens (Claude Design 프로젝트 93225dbe 에서 동기화, 값 그대로) ═══ */
:root{
  /* colors — base neutrals (warm paper family) */
  --paper:#f7f7f5; --neutral-100:#f3f3f3; --neutral-200:#eeeef0; --beige:#f5f0eb; --white:#ffffff;
  /* base ink */
  --ink:#000000; --ink-70:rgba(0,0,0,0.70); --ink-45:rgba(0,0,0,0.45); --ink-15:rgba(0,0,0,0.15); --ink-08:rgba(0,0,0,0.08); --ink-04:rgba(0,0,0,0.04);
  /* base blue */
  /* 사이트 조정: 키 컬러를 Cascades 블루(#0E76FF)에서 형광초록 #F4FF53 으로 교체. 토큰 이름은 유지 */
  --blue-primary:#f4ff53; --blue-press:#dce73c; --blue-secondary:#f9ffa6; --blue-tint-40:rgba(244,255,83,0.40); --blue-tint-10:rgba(244,255,83,0.10);
  /* status */
  --green-success:oklch(0.58 0.13 155); --amber-warning:oklch(0.75 0.15 75); --red-danger:oklch(0.55 0.20 26);
  /* semantic surfaces */
  --surface-page:var(--paper); --surface-card:var(--white); --surface-sunken:var(--neutral-100); --surface-muted:var(--neutral-200); --surface-warm:var(--beige); --surface-inverse:var(--ink); --surface-accent:var(--blue-primary); --surface-accent-soft:var(--blue-tint-40);
  /* semantic text */
  --text-body:var(--ink); --text-muted:rgba(0,0,0,0.55); --text-secondary:var(--ink-70); --text-inverse:var(--neutral-100); --text-accent:var(--blue-primary); --text-link:var(--ink); --text-link-hover:var(--blue-primary);
  /* semantic lines */
  --border-hairline:var(--ink-15); --border-strong:var(--ink); --border-inverse:rgba(243,243,243,0.20); --focus-ring:var(--ink);
  /* semantic accents */
  --accent:var(--blue-primary); --accent-hover:var(--blue-press); --accent-on:var(--ink);

  /* fonts */
  /* 사이트 조정: 서체를 Pretendard 로 통일 (Cascades 원값은 Archivo / Archivo Narrow) */
  --font-core:"Pretendard","Noto Sans KR","Helvetica Neue",Arial,sans-serif;
  --font-narrow:"Pretendard","Noto Sans KR","Helvetica Neue",Arial,sans-serif;
  --font-mono:"Geist Mono","Pretendard","Noto Sans KR",ui-monospace,Menlo,monospace;   /* 2026-09-28 리뉴얼: 라벨·캡션·숫자는 고정폭 — 코드를 재료로 쓰는 전공의 결 */
  --font-display:var(--font-core); --font-body:var(--font-core); --font-label:var(--font-mono);

  /* typography */
  /* 사이트 조정: '글씨가 크다'는 피드백에 따라 Cascades 원값(88/68/44/32/24/19/16/13/12)에서 2px 씩 축소, 본문 16px 유지 */
  /* 2차 조정: 글자 +5px, 행간 +5px */
  /* 3차 조정: 글자 크기를 현재 값의 2/3 로 (행간의 +5px 는 유지) */
  --k:1;   /* 화면 배율: 넓고 높은 데스크톱에서만 1 보다 커진다 (아래 @media) */
  --text-display:calc(59px * var(--k)); --text-h1:calc(45px * var(--k)); --text-h2:calc(29px * var(--k)); --text-h3:calc(21px * var(--k)); --text-lead:calc(16px * var(--k)); --text-md:calc(13px * var(--k)); --text-base:calc(12px * var(--k)); --text-label:calc(10px * var(--k)); --text-caption:calc(10px * var(--k));   /* 2026-09-21: 글자 2px 씩 축소 (라벨·캡션은 1px) — 픽셀 연출이 주인공이 되게 */
  --weight-core:500; --weight-body:400;
  --leading-display:calc(0.95em + 6.5px * var(--k)); --leading-heading:calc(1.05em + 6.5px * var(--k)); --leading-lead:calc(1.25em + 6.5px * var(--k)); --leading-body:calc(1.5em + 6.5px * var(--k)); --leading-label:calc(1.2em + 6.5px * var(--k));   /* 행간 +1.5px (사용자 요청 2026-09-21) */
  /* 사이트 조정: 자간 확대 (원값 -0.03 / -0.02 / 0 / 0.08em) */
  --tracking-display:0.02em; --tracking-heading:0.03em; --tracking-body:0.04em; --tracking-label:0.18em;
  --type-display:var(--weight-core) var(--text-display)/var(--leading-display) var(--font-display);
  --type-h1:var(--weight-core) var(--text-h1)/var(--leading-heading) var(--font-display);
  --type-h2:var(--weight-core) var(--text-h2)/var(--leading-heading) var(--font-display);
  --type-h3:var(--weight-core) var(--text-h3)/var(--leading-heading) var(--font-display);
  --type-lead:var(--weight-core) var(--text-lead)/var(--leading-lead) var(--font-body);
  --type-body:var(--weight-body) var(--text-base)/var(--leading-body) var(--font-body);
  --type-label:var(--weight-core) var(--text-label)/var(--leading-label) var(--font-label);
  --type-caption:var(--weight-core) var(--text-caption)/var(--leading-label) var(--font-label);

  /* spacing */
  --space-2:calc(2px * var(--k)); --space-8:calc(8px * var(--k)); --space-12:calc(12px * var(--k)); --space-16:calc(16px * var(--k)); --space-20:calc(20px * var(--k)); --space-22:calc(22px * var(--k)); --space-24:calc(24px * var(--k)); --space-28:calc(28px * var(--k)); --space-32:calc(32px * var(--k)); --space-36:calc(36px * var(--k)); --space-37:calc(37px * var(--k)); --space-52:calc(52px * var(--k)); --space-56:calc(56px * var(--k)); --space-60:calc(60px * var(--k)); --space-64:calc(64px * var(--k));
  --gutter:var(--space-24); --pad-control-y:var(--space-12); --pad-control-x:var(--space-24); --pad-card:var(--space-32); --stack-tight:var(--space-8); --stack:var(--space-16); --stack-loose:var(--space-32); --section-y:var(--space-64);
  --container-max:calc(1440px * var(--k)); --measure:64ch;
  --hdr:calc(64px * var(--k));                                   /* 상단 바 높이 (폰에서는 두 줄, 88px) */

  /* borders */
  --radius-none:0px; --radius-sm:2px; --radius-pill:999px; --border-width:1px; --border-width-strong:2px;
  --hairline:1px solid var(--border-hairline); --rule:1px solid var(--border-strong);
  --shadow-none:none; --shadow-overlay:0 1px 0 var(--ink-15), 0 24px 64px rgba(0,0,0,0.18);

  /* effects */
  --wash-blue:radial-gradient(60% 70% at 50% 0%, rgba(244,255,83,0.28) 0%, rgba(247,247,245,0) 72%);
  --wash-dark:radial-gradient(50% 60% at 50% 100%, rgba(244,255,83,0.16) 0%, rgba(0,0,0,0) 70%);
  --protect-bottom:linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 100%);
  --blur-panel:blur(16px); --overlay-scrim:rgba(0,0,0,0.55);

  /* motion */
  --ease:ease; --ease-out:cubic-bezier(0.22,1,0.36,1); --ease-in-out:cubic-bezier(0.77,0,0.175,1);
  --duration-instant:1ms; --duration-fast:120ms; --duration-base:200ms; --duration-slow:400ms;
  --transition-color:color var(--duration-fast) var(--ease), background-color var(--duration-fast) var(--ease), border-color var(--duration-fast) var(--ease);
  --transition-transform:transform var(--duration-fast) var(--ease);
}
/* 넓은 데스크톱: 콘텐츠 폭·글자·여백을 함께 키워 빈 공간을 줄인다 (사용자 요청 2026-09-28, 윈도우 27인치에서 빈 공간이 많다) */
@media (min-width:1800px) and (min-height:880px){:root{--k:1.15}}
@media (min-width:2200px) and (min-height:1080px){:root{--k:1.32}}
@media (min-width:2480px) and (min-height:1220px){:root{--k:1.5}}
/* Inverse scope: black sections. Apply with class="cs-inverse". */
.cs-inverse{
  --surface-page:var(--ink); --surface-card:rgba(238,238,240,0.10); --surface-sunken:rgba(238,238,240,0.06); --surface-muted:rgba(238,238,240,0.10);
  --text-body:var(--neutral-100); --text-muted:rgba(243,243,243,0.55); --text-secondary:rgba(243,243,243,0.75); --focus-ring:var(--blue-primary);
  --text-link:var(--neutral-100); --text-link-hover:var(--blue-secondary);
  --border-hairline:rgba(243,243,243,0.20); --border-strong:var(--neutral-100); --text-accent:var(--blue-secondary);
}

/* ── base.css ── */
*,*::before,*::after{box-sizing:border-box}
html{scroll-snap-type:y mandatory}
html.booting{overflow:hidden}                                   /* 첫 입장 애니메이션 동안은 스크롤을 막는다 */
body{margin:0;background:var(--surface-page);color:var(--text-body);font:var(--type-body);letter-spacing:var(--tracking-body);-webkit-font-smoothing:antialiased;word-break:keep-all;overflow-x:hidden;transition:background-color var(--duration-slow) var(--ease),color var(--duration-slow) var(--ease)}
h1,h2,h3,h4,p{margin:0}
a{color:var(--text-link);text-decoration:none;transition:var(--transition-color)}
a:hover{color:var(--text-link-hover)}
::selection{background:var(--blue-secondary);color:var(--ink)}
:focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}
.cs-label{font:var(--type-label);letter-spacing:var(--tracking-label);text-transform:uppercase}
.cs-caption{font:var(--type-caption);letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-muted)}
img,canvas,svg{display:block;max-width:100%}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;padding:0}

/* ═══ site layer ═══ */
.shell{max-width:var(--container-max);margin:0 auto;padding:0 var(--space-36)}
.display{font:var(--type-display);letter-spacing:var(--tracking-display);font-size:clamp(23px,3.4vw,var(--text-display));text-wrap:balance}
.h2{font:var(--type-h2);letter-spacing:var(--tracking-heading);font-size:clamp(20px,2.15vw,var(--text-h2));text-wrap:balance}
.h3{font:var(--type-h3);letter-spacing:var(--tracking-heading);font-size:clamp(15px,1.3vw,var(--text-h3))}
.lead{font:var(--type-lead);color:var(--text-secondary);font-size:clamp(13px,1vw,var(--text-lead));max-width:38ch}
.body{font:var(--type-body);color:var(--text-secondary);max-width:var(--measure)}
p,.lead,.body,.set li p,.tools .h3,.card .title{text-wrap:pretty;overflow-wrap:break-word}   /* 마지막 줄에 온점이나 짧은 낱말만 남지 않게 (사용자 요청) */
.h3{text-wrap:balance}
.muted{color:var(--text-muted)}
.i{width:calc(16px * var(--k));height:calc(16px * var(--k));flex:none;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.i-20{width:calc(20px * var(--k));height:calc(20px * var(--k))}

/* Button (Cascades) */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:calc(8px * var(--k));min-height:calc(40px * var(--k));padding:calc(12px * var(--k)) calc(24px * var(--k));border-radius:var(--radius-sm);font:var(--weight-core) var(--text-label)/1 var(--font-narrow);letter-spacing:var(--tracking-label);text-transform:uppercase;text-decoration:none;cursor:pointer;transition:var(--transition-color);border:1px solid transparent;white-space:nowrap}
.btn{transition:var(--transition-color),scale 160ms var(--ease-out)}
.btn:active{scale:.97}
.btn .i{transition:transform .35s var(--ease-out)}
@media (hover:hover) and (pointer:fine){.btn:hover .i{transform:translate(2px,-2px)}}
.btn.sm{min-height:calc(32px * var(--k));padding:calc(8px * var(--k)) calc(16px * var(--k))}
.btn.lg{min-height:calc(56px * var(--k));padding:calc(16px * var(--k)) calc(32px * var(--k));gap:calc(12px * var(--k));font:var(--weight-core) var(--text-md)/1 var(--font-core);letter-spacing:var(--tracking-body);text-transform:none}
.btn.primary{background:var(--accent);color:var(--accent-on);border-color:var(--accent)}
.btn.primary:hover{background:var(--accent-hover);border-color:var(--accent-hover);color:var(--accent-on)}
.btn.secondary{background:transparent;color:var(--text-body);border-color:var(--border-strong)}
.btn.secondary:hover{background:var(--ink);color:var(--text-inverse)}
.cs-inverse .btn.secondary:hover{background:var(--neutral-100);color:var(--ink)}
.iconbtn{display:inline-flex;align-items:center;justify-content:center;width:calc(40px * var(--k));height:calc(40px * var(--k));border:1px solid var(--border-hairline);border-radius:var(--radius-sm);color:var(--text-body);background:transparent;transition:var(--transition-color);flex:none}
.iconbtn:hover{background:var(--ink-08);border-color:var(--border-strong);color:var(--text-body)}
.cs-inverse .iconbtn:hover{background:rgba(238,238,240,0.10)}
.tag{display:inline-flex;align-items:center;height:28px;padding:0 12px;border-radius:var(--radius-pill);font:var(--type-label);letter-spacing:var(--tracking-label);text-transform:uppercase;border:1px solid var(--border-hairline);color:var(--text-body);white-space:nowrap}

/* Card (Cascades): hairline, 2px, 32px, hover → beige / inverse tint. never lifts */
.card{display:flex;flex-direction:column;gap:var(--space-8);color:var(--text-body);text-decoration:none}
a.card:hover{color:var(--text-body)}
.card .media{position:relative;margin-bottom:var(--space-8);overflow:hidden;background:var(--ink);border-radius:var(--radius-sm)}
.card .media::after{content:"";position:absolute;inset:0;border:1px solid var(--border-hairline);border-radius:inherit;pointer-events:none}
.card .media canvas{width:100%;aspect-ratio:16/9;transition:scale .9s var(--ease-out)}
.card .title{transition:color var(--duration-base) var(--ease)}
@media (hover:hover) and (pointer:fine){a.card:hover .media canvas{scale:1.04}a.card:hover .title{color:var(--text-accent)}}
.card .title{font:var(--weight-core) var(--text-lead)/calc(1.15em + 5px) var(--font-core);letter-spacing:var(--tracking-heading);font-size:clamp(13px,0.95vw,var(--text-lead))}

/* ── Header: fixed, 64px, hairline. Colors follow the body scope. ── */
.site-header{position:fixed;inset:0 0 auto 0;z-index:30;height:var(--hdr);border-bottom:1px solid var(--border-hairline);background:var(--surface-page);transition:background-color var(--duration-slow) var(--ease),color var(--duration-slow) var(--ease),opacity .7s var(--ease) .35s,transform .7s var(--ease) .35s}
html.booting .site-header{opacity:0;transform:translateY(-10px);pointer-events:none}
.progress{transition:opacity .7s var(--ease) .6s}
.hdr-actions{display:flex;gap:var(--space-8);align-items:center;justify-self:end}
@property --a{syntax:'<percentage>';inherits:false;initial-value:0%}
html.booting .progress{opacity:0}
.site-header .row{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:var(--space-24);height:calc(64px * var(--k))}
.site-header .row>.brand{justify-self:start}
.site-header .row>.site-nav{justify-self:center}
.site-header .row>.btn{justify-self:end}
.subnav{display:none}
.brand{display:flex;align-items:center;gap:var(--space-12);font:var(--weight-core) calc(17px * var(--k))/1 var(--font-core);letter-spacing:0.04em;color:var(--text-body);white-space:nowrap}
.brand:hover{color:var(--text-body)}
.brand .mark{width:calc(24px * var(--k));height:calc(26px * var(--k));flex:none}
.brand .mark svg{width:100%;height:100%;fill:currentColor}
.brand-text{display:flex;flex-direction:column;gap:2px;line-height:1.1}
.brand-text small{font:600 calc(11px * var(--k))/1.1 var(--font-core);letter-spacing:0.3em;text-transform:uppercase;color:var(--text-muted)}
.brand-text strong{font:600 calc(19px * var(--k))/1.1 var(--font-core);letter-spacing:-0.03em;text-transform:uppercase}   /* 헤더 브랜드도 가운데 제목(.intro-sub·.intro-title)과 같은 대문자·자간 (사용자 요청 2026-09-28: 두 글씨 통일) */
.site-nav{display:flex;gap:var(--space-32);position:relative}
.nav-ind{position:absolute;left:0;bottom:calc(-9px * var(--k));width:0;height:1px;background:var(--text-body);opacity:0;pointer-events:none}
.site-nav a{font:var(--type-label);letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-muted)}
.site-nav a:hover,.site-nav a.is-active{color:var(--text-body)}
.progress{position:fixed;right:var(--space-36);top:50%;transform:translateY(-50%);z-index:20;display:flex;flex-direction:column;gap:var(--space-12);align-items:flex-end}
.progress a{display:flex;align-items:center;gap:var(--space-8);color:var(--text-muted)}
.progress a i{display:block;width:calc(16px * var(--k));height:1px;background:currentColor;transition:width var(--duration-base) var(--ease)}
.progress a.is-active{color:var(--text-body)}
.progress a.is-active i{width:32px}

/* ── Scene: one fixed canvas behind every chapter ── */
.scene{position:fixed;inset:0;z-index:0;pointer-events:none}
.scene canvas{width:100%;height:100%}

/* ── Chapters: each one viewport, snap, content reveals on activation ── */
.chapter{position:relative;z-index:1;min-height:100vh;min-height:100svh;scroll-snap-align:start;scroll-snap-stop:always;display:grid;grid-template-columns:minmax(0,1fr);align-content:center;padding-top:var(--hdr)}
.chapter .shell{min-width:0;max-width:min(100%,var(--container-max))}
.cards{max-width:100%}
/* 터치 기기: 문서를 스크롤하지 않고 main 을 챕터 단위로 밀어 넘긴다 (iOS 주소창 높이 변화에 흔들리지 않음) */
html.touch-paging,html.touch-paging body{height:100%;overflow:hidden;overscroll-behavior:none;scroll-snap-type:none}
html.touch-paging main{position:fixed;inset:0;z-index:1;transform:translateY(0);transition:transform 620ms cubic-bezier(.22,1,.36,1);will-change:transform}
html.touch-paging .chapter{height:100%;min-height:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
html.touch-paging .cards{touch-action:pan-x}
@media (prefers-reduced-motion:reduce){html.touch-paging main{transition:none}}
.chapter .shell{width:100%}
.js .reveal{opacity:0;transform:translateY(14px);transition:opacity var(--duration-slow) var(--ease),transform var(--duration-slow) var(--ease);transition-delay:calc(var(--i,0) * 70ms + 120ms)}
.js .chapter.is-active .reveal{opacity:1;transform:none}
.chapter .kicker{margin-bottom:var(--space-16)}
.stack{display:flex;flex-direction:column;gap:var(--space-24)}

/* Chapter 0 — intro: logo centred (canvas), wordmark below */
.intro{text-align:center;align-content:end;padding-bottom:12vh}
.intro .wordmark{display:flex;flex-direction:column;gap:var(--space-12);align-items:center}
.intro-sub{font:600 clamp(12px,1.2vw,calc(17px * var(--k)))/1.4 var(--font-core);letter-spacing:0.3em;text-transform:uppercase;color:var(--text-muted);text-align:center;padding-left:0.3em}
.intro-title{font:600 clamp(2.5rem,9vw,calc(7rem * var(--k)))/.94 var(--font-core);letter-spacing:-0.03em;text-transform:uppercase;color:var(--text-body);text-align:center;margin-top:2px}   /* 포트폴리오 푸터 워드마크와 같은 서체·자간 (사용자 요청) */
.js .intro .wordmark{opacity:0;transform:translateY(14px);transition:opacity var(--duration-slow) var(--ease),transform var(--duration-slow) var(--ease)}
.js .intro.is-ready .wordmark{opacity:1;transform:none}
.intro .hint{position:absolute;left:0;right:0;bottom:var(--space-24);display:flex;justify-content:center}
.intro .hint i{position:relative;display:block;width:1px;height:calc(44px * var(--k));background:var(--border-hairline);overflow:hidden}
.intro .hint i::after{content:"";position:absolute;left:0;top:0;width:1px;height:45%;background:var(--text-body);animation:drip 2.4s var(--ease-in-out) infinite}
.js .intro .hint{opacity:0;transition:opacity var(--duration-slow) var(--ease) 600ms}
.js .intro.is-ready .hint{opacity:1}
@keyframes drip{from{transform:translateY(-100%)}to{transform:translateY(230%)}}

/* Chapter layouts */
.left .shell{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--space-56)}
.right .shell{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--space-56)}
.right .shell>.stack{grid-column:2}
.top{align-content:start;padding-top:calc(var(--hdr) + 7vh)}
.top .shell{max-width:calc(1120px * var(--k))}
.top .stack{gap:var(--space-20)}
.center{text-align:center}
.center .stack{align-items:center}
.center .kicker{justify-content:center;margin-bottom:var(--space-8)}
.center .h2{max-width:22ch;margin-inline:auto}
.center .lead{margin-inline:auto;max-width:44ch}
.tools{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--gutter);text-align:left;width:100%;margin-top:var(--space-12)}
.tools .col{position:relative;padding-top:var(--space-16);display:flex;flex-direction:column;gap:var(--space-12)}
.tools .h3{font-size:clamp(12px,0.85vw,calc(15px * var(--k)));line-height:calc(1.3em + 6.5px)}

/* Lists inside chapters (numbered sets) */
.set{position:relative;list-style:none;margin:0;padding:0}
.set li{position:relative;display:grid;grid-template-columns:calc(56px * var(--k)) minmax(0,1fr);gap:var(--space-16);padding:var(--space-16) 0;align-items:baseline}
.set::before,.set li::after,.tools .col::before{content:"";position:absolute;left:0;right:0;height:1px;background:var(--border-hairline);transform:scaleX(var(--rule,1));transform-origin:0 50%}
.set::before,.tools .col::before{top:0}
.set li::after{bottom:0}
.tools .col::before{background:var(--border-strong)}
.tools .cs-caption{font-family:var(--font-core)}   /* 한글 캡션: 고정폭 쉼표·빈칸이 벌어져 보여 본문 서체로 */
@media (min-width:800px){.right .shell,.works .shell{padding-right:calc(var(--space-36) + var(--space-64))}}   /* 오른쪽 챕터 번호 줄과 겹치지 않게 */
.toolrow{display:flex;flex-wrap:wrap;gap:var(--space-8) var(--space-20);list-style:none;margin:0;padding:0}
.set li .h3{font-size:clamp(13px,1.1vw,calc(19px * var(--k)))}
.set li p{color:var(--text-secondary);max-width:44ch}
.set.two li{grid-template-columns:calc(56px * var(--k)) minmax(0,1fr) minmax(0,1.25fr)}
.set.two li p{font-size:clamp(11px,0.85vw,calc(12.5px * var(--k)));line-height:calc(1.5em + 1.5px)}
@media (min-width:800px) and (max-height:860px){.set li{padding:var(--space-12) 0}.set.two li p{font-size:11.5px}.right .stack{gap:var(--space-16)}}
.cols3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--gutter)}
.cols3 .col{border-top:1px solid var(--border-strong);padding-top:var(--space-16);display:flex;flex-direction:column;gap:var(--space-8)}
.rowhead{display:flex;justify-content:space-between;align-items:flex-end;gap:var(--space-24);flex-wrap:wrap;width:100%}
.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--gutter)}
.actions{display:flex;gap:var(--space-12);flex-wrap:wrap;justify-content:center}

/* Chapter 5 — admission + compact footer */
.works{align-content:center}
.last{grid-template-rows:1fr auto;align-content:stretch}
.last .main{display:grid;align-content:end;padding-bottom:4vh}
.foot{border-top:1px solid var(--border-hairline);padding-top:var(--space-24);padding-bottom:var(--space-32)}
.foot .row{display:flex;justify-content:space-between;align-items:center;gap:var(--space-24);flex-wrap:wrap}
.foot .links{display:flex;gap:var(--space-24);flex-wrap:wrap}
.foot a{display:inline-flex;align-items:center;gap:var(--space-8)}
.foot .links a{background:linear-gradient(currentColor,currentColor) 0 100%/0 1px no-repeat;transition:var(--transition-color),background-size .45s var(--ease-out)}
.foot .links a:hover{background-size:100% 1px}

@media (max-width:1199px){.cards{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:799px){
  html{scroll-snap-type:y proximity}
  .shell{padding:0 var(--space-20)}
  .site-nav,.progress{display:none}
  .site-header .row{display:flex;justify-content:space-between;height:52px;gap:var(--space-12)}
  .subnav a:first-child{margin-left:auto}
  .subnav a:last-child{margin-right:auto}
  .brand{font-size:12px;letter-spacing:0.03em}
  .brand-text small{font-size:9px;letter-spacing:0.18em}   /* 폰: 넓은 자간을 폭에 맞게 (0.3em 이면 입학처 버튼이 화면 밖으로 밀린다) */
  .brand-text strong{font-size:15px}
  .brand .mark{width:20px;height:22px}
  .brand>span:not(.mark){display:flex}
  .subnav{display:flex;gap:var(--space-20);height:36px;align-items:center;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;white-space:nowrap;border-top:1px solid var(--border-hairline)}
  .subnav::-webkit-scrollbar{display:none}
  .subnav a{font:var(--type-label);letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-muted);flex:none;padding:6px 0;border-bottom:1px solid transparent}
  .subnav a.is-active{color:var(--text-body);border-bottom-color:var(--text-body)}
  .site-header .btn.sm{min-height:36px}
  :root{--hdr:88px}
  .chapter{align-content:end;padding-bottom:var(--space-24);padding-top:calc(var(--hdr) + 18vh);text-align:center}
  .chapter .stack{gap:var(--space-16);align-items:center}
  .chapter .kicker{margin-bottom:var(--space-8);justify-content:center}
  .chapter .h2{max-width:none}
  .chapter .lead{margin-inline:auto}
  .set,.tools,.cards{width:100%;text-align:left}
  .rowhead{flex-direction:column;align-items:center;gap:var(--space-12)}
  .set li{grid-template-columns:44px minmax(0,1fr)}
  .toolrow{justify-content:center;gap:var(--space-8) var(--space-16)}
  .actions{justify-content:center}
  .foot .row{align-items:center;text-align:center}
  .foot .row{flex-direction:column;gap:var(--space-12)}
  .foot .links{justify-content:center}
  .intro{padding-bottom:12vh;padding-top:var(--hdr)}
  .intro .wordmark{gap:var(--space-12)}
  .display{font-size:clamp(19px,5vw,29px)}
  .h2{font-size:clamp(17px,4.1vw,23px)}
  .lead{font-size:12px;max-width:none}
  .left .shell,.right .shell{grid-template-columns:1fr}
  .right .shell>.stack{grid-column:1}
  .top{align-content:end;padding-top:calc(var(--hdr) + 18vh)}
  .top .stack{gap:var(--space-12)}
  .tools{grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--space-12) var(--space-16);margin-top:var(--space-4,4px)}
  .tools .col{padding-top:var(--space-12);gap:var(--space-8)}
  .tools .h3{font-size:12px;line-height:calc(1.3em + 6.5px)}
  .set li{grid-template-columns:48px minmax(0,1fr);padding:var(--space-12) 0}
  .set.two li{grid-template-columns:48px minmax(0,1fr);padding:var(--space-8) 0}
  .set.two li p{display:none}
  .set.two li .h3{font-size:13px}
  .set li .h3{font-size:14px}
  .works{align-content:end;padding-bottom:var(--space-32)}
  .cards{display:flex;gap:var(--space-16);overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;margin:0 calc(-1 * var(--space-20));padding:0 var(--space-20) var(--space-8);scrollbar-width:none}
  .cards::-webkit-scrollbar{display:none}
  .cards .card{flex:0 0 76vw;scroll-snap-align:start;gap:var(--space-8)}
  .actions{gap:var(--space-8)}
  .actions .btn.lg{min-height:48px;padding:12px 20px;font-size:12px}
  .last{padding-bottom:var(--space-8)}                                     /* 폰: 05 챕터 전체를 조금 아래로 (저작권·링크가 너무 높아 보였다) */
  .last .main{padding-bottom:var(--space-16)}
  .foot{padding-top:var(--space-20);padding-bottom:var(--space-12)}
  .foot .links{gap:var(--space-16)}
  .foot .row>.cs-caption{letter-spacing:.08em}
}
@media (max-width:409px){.site-header .cta-long{display:none}.site-header .btn.sm{padding:8px 12px}}   /* 좁은 폰: 헤더 버튼은 '입학처 ↗' 만 — 전에는 375px 이하에서 버튼이 화면 밖으로 잘렸다 */
@media (max-width:359px){.site-header .cta-label{display:none}.site-header .btn.sm{padding:8px 10px}}   /* 320px: 화살표만 (읽는 이름은 aria-label) */
.ln{display:block;overflow:hidden;padding:.1em 0;margin:-.1em 0}
.ln>span{display:inline-block}
.am .reveal,.am .intro .wordmark{transition:none;transform:none}
.static .reveal,.static .intro .wordmark,.static .intro .hint{opacity:1!important;transform:none!important;transition:none!important}
.only-mode .chapter:not(.only){display:none}
.static body,.static .site-header{transition:none!important}
@media (prefers-reduced-motion:reduce){
  .js .reveal,.js .intro .wordmark,.js .intro .hint{opacity:1;transform:none;transition:none}
  .intro .hint i::after{animation:none}
}
</style>

<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="logo" viewBox="0 0 32 34"><path d="M22 0h1v1h-1zM12 1h5v1h-5zM22 1h1v1h-1zM9 2h12v1h-12zM23 2h1v1h-1zM7 3h15v1h-15zM23 3h1v1h-1zM6 4h16v1h-16zM23 4h1v1h-1zM5 5h17v1h-17zM23 5h1v1h-1zM26 5h1v1h-1zM4 6h13v1h-13zM18 6h4v1h-4zM23 6h1v1h-1zM26 6h1v1h-1zM3 7h14v1h-14zM18 7h4v1h-4zM23 7h1v1h-1zM26 7h2v1h-2zM2 8h15v1h-15zM19 8h2v1h-2zM23 8h1v1h-1zM25 8h3v1h-3zM1 9h16v1h-16zM19 9h1v1h-1zM22 9h2v1h-2zM25 9h3v1h-3zM1 10h16v1h-16zM19 10h1v1h-1zM22 10h1v1h-1zM25 10h4v1h-4zM30 10h1v1h-1zM1 11h10v1h-10zM12 11h5v1h-5zM21 11h2v1h-2zM25 11h4v1h-4zM30 11h1v1h-1zM0 12h11v1h-11zM13 12h4v1h-4zM21 12h2v1h-2zM24 12h2v1h-2zM27 12h2v1h-2zM30 12h1v1h-1zM0 13h12v1h-12zM13 13h4v1h-4zM20 13h2v1h-2zM24 13h2v1h-2zM27 13h1v1h-1zM30 13h2v1h-2zM0 14h12v1h-12zM14 14h2v1h-2zM20 14h2v1h-2zM24 14h2v1h-2zM27 14h1v1h-1zM29 14h3v1h-3zM0 15h12v1h-12zM14 15h2v1h-2zM20 15h2v1h-2zM24 15h2v1h-2zM27 15h1v1h-1zM29 15h3v1h-3zM0 16h12v1h-12zM14 16h2v1h-2zM19 16h3v1h-3zM24 16h2v1h-2zM29 16h3v1h-3zM0 17h12v1h-12zM14 17h2v1h-2zM18 17h4v1h-4zM25 17h1v1h-1zM29 17h3v1h-3zM0 18h8v1h-8zM9 18h3v1h-3zM14 18h1v1h-1zM18 18h4v1h-4zM25 18h1v1h-1zM29 18h3v1h-3zM0 19h7v1h-7zM9 19h2v1h-2zM18 19h5v1h-5zM25 19h2v1h-2zM29 19h3v1h-3zM0 20h7v1h-7zM9 20h2v1h-2zM18 20h5v1h-5zM26 20h1v1h-1zM29 20h3v1h-3zM1 21h6v1h-6zM9 21h2v1h-2zM14 21h2v1h-2zM19 21h4v1h-4zM28 21h1v1h-1zM30 21h2v1h-2zM1 22h6v1h-6zM9 22h1v1h-1zM13 22h3v1h-3zM19 22h5v1h-5zM30 22h1v1h-1zM1 23h6v1h-6zM9 23h1v1h-1zM13 23h2v1h-2zM20 23h4v1h-4zM30 23h1v1h-1zM2 24h5v1h-5zM9 24h2v1h-2zM13 24h2v1h-2zM20 24h5v1h-5zM29 24h2v1h-2zM2 25h6v1h-6zM10 25h1v1h-1zM14 25h2v1h-2zM21 25h5v1h-5zM29 25h1v1h-1zM3 26h3v1h-3zM7 26h1v1h-1zM14 26h2v1h-2zM18 26h1v1h-1zM21 26h5v1h-5zM28 26h1v1h-1zM4 27h2v1h-2zM15 27h1v1h-1zM18 27h1v1h-1zM23 27h3v1h-3zM28 27h1v1h-1zM5 28h2v1h-2zM16 28h1v1h-1zM18 28h2v1h-2zM24 28h1v1h-1zM27 28h1v1h-1zM6 29h2v1h-2zM19 29h3v1h-3zM7 30h2v1h-2zM11 30h3v1h-3zM20 30h3v1h-3zM11 31h3v1h-3zM20 31h4v1h-4zM11 32h4v1h-4zM21 32h3v1h-3zM12 33h3v1h-3z"/></symbol>
  <symbol id="arrow-right" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></symbol>
  <symbol id="arrow-up-right" viewBox="0 0 24 24"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></symbol>
  <symbol id="arrow-up" viewBox="0 0 24 24"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></symbol>
  <symbol id="chevron-down" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol>
</svg>

<script src="config.js"></script>
<div class="scene" aria-hidden="true"><canvas id="scene"></canvas></div>

<header class="site-header" id="header">
  <div class="shell row">
    <a class="brand" href="#c0" aria-label="서울예술대학교 디지털아트전공 홈">
      <span class="mark"><svg><use href="#logo"/></svg></span>
      <span class="brand-text"><small>Seoul Institute of the Arts</small><strong>Digital Arts</strong></span>
    </a>
    <nav class="site-nav" aria-label="주요 메뉴">
      <a href="#c1" data-ch="1">전공소개</a><a href="#c2" data-ch="2">교육과정</a><a href="#c3" data-ch="3">진로</a><a href="#c4" data-ch="4">포트폴리오</a><a href="#c5" data-ch="5">입학안내</a><span class="nav-ind" aria-hidden="true"></span>
    </nav>
    <div class="hdr-actions"><a class="btn sm primary" href="https://www.seoularts.ac.kr/web/cop/bbsWeb/selectBoardList.do?bbsId=BBSMSTR_000000000924" target="_blank" rel="noopener" aria-label="입학처 바로가기"><span class="cta-label">입학처<span class="cta-long"> 바로가기</span></span> <svg class="i"><use href="#arrow-up-right"/></svg></a></div>
  </div>
  <nav class="shell subnav" aria-label="챕터 메뉴">
    <a href="#c1" data-ch="1">전공소개</a><a href="#c2" data-ch="2">교육과정</a><a href="#c3" data-ch="3">진로</a><a href="#c4" data-ch="4">포트폴리오</a><a href="#c5" data-ch="5">입학안내</a>
  </nav>
</header>

<nav class="progress" aria-label="챕터">
  <a href="#c0" data-ch="0" class="cs-caption"><i></i>00</a>
  <a href="#c1" data-ch="1" class="cs-caption"><i></i>01</a>
  <a href="#c2" data-ch="2" class="cs-caption"><i></i>02</a>
  <a href="#c3" data-ch="3" class="cs-caption"><i></i>03</a>
  <a href="#c4" data-ch="4" class="cs-caption"><i></i>04</a>
  <a href="#c5" data-ch="5" class="cs-caption"><i></i>05</a>
</nav>

<main>
  <!-- 00 · intro: 픽셀이 모여 로고가 되고, 아래에 전공명 -->
  <section class="chapter intro" id="c0" data-mode="ink">
    <div class="shell">
      <div class="wordmark">
        <span class="intro-sub">Seoul Institute of the Arts</span>
        <h1 class="intro-title">Digital Arts</h1>
      </div>
    </div>
    <div class="hint" aria-hidden="true"><i></i></div>
  </section>

  <!-- 01 · 전공소개 -->
  <section class="chapter left" id="c1" data-mode="paper">
    <div class="shell">
      <div class="stack">
        <p class="kicker cs-caption reveal" style="--i:0">About</p>
        <h2 class="h2 reveal" style="--i:1">아직 세상에 없는 예술을<br>여기서 처음 만든다</h2>
        <p class="lead reveal" style="--i:2">2003년에 문을 연 영상학부 디지털아트전공은 과학기술을 바탕으로 ‘새로운 형태의 예술(New Form Art)’을 만듭니다. 3D와 애니메이션, 비주얼 이펙트, 인스톨레이션에서 인터랙션 프로그래밍과 인공지능까지, 도구와 코드를 예술의 재료로 배웁니다.</p>
        <ol class="set reveal" style="--i:3">
          <li><span class="cs-caption">01</span><span class="h3">미디어아트와 실감미디어</span></li>
          <li><span class="cs-caption">02</span><span class="h3">3D, 애니메이션, VFX</span></li>
          <li><span class="cs-caption">03</span><span class="h3">인터랙션, 게임엔진, AI</span></li>
        </ol>
        <ul class="toolrow cs-caption reveal" style="--i:4" aria-label="주요 도구"><li>Maya</li><li>Blender</li><li>Unreal Engine</li><li>Unity</li><li>TouchDesigner</li><li>Arduino</li><li>Python</li></ul>
      </div>
    </div>
  </section>

  <!-- 02 · 교육과정 -->
  <section class="chapter right" id="c2" data-mode="ink">
    <div class="shell">
      <div class="stack">
        <p class="kicker cs-caption reveal" style="--i:0">Curriculum</p>
        <h2 class="h2 reveal" style="--i:1">첫 줄의 코드에서<br>공간을 채우는 작품까지</h2>
        <ol class="set two">
          <li class="reveal" style="--i:2"><span class="cs-caption">Code</span><span class="h3">코드를 매체로 배운다</span><p>크리에이티브 컴퓨팅, 디지털아트 프로그래밍, 뉴미디어 프로그래밍</p></li>
          <li class="reveal" style="--i:3"><span class="cs-caption">3D</span><span class="h3">모델링에서 렌더링, VFX까지</span><p>3D 테크닉 I·II, 캐릭터 애니메이션, 비주얼 이펙트, 디지털 머티리얼</p></li>
          <li class="reveal" style="--i:4"><span class="cs-caption">Touch</span><span class="h3">센서와 장치가 관객에 반응한다</span><p>피지컬 컴퓨팅, 디지털 기반의 인스톨레이션, 피지컬 시스템 디자인</p></li>
          <li class="reveal" style="--i:5"><span class="cs-caption">Space</span><span class="h3">공간과 무대를 미디어로 연출한다</span><p>미디어와 공간연출, 모션 기반 미디어아트, 미디어 퍼포먼스 &amp; 익스프레션</p></li>
          <li class="reveal" style="--i:6"><span class="cs-caption">Engine</span><span class="h3">실시간 엔진과 XR</span><p>게임엔진 테크놀로지 I·II, 가상현실 콘텐츠, 리얼타임 영상 제작, 유니티 프로그래밍</p></li>
          <li class="reveal" style="--i:7"><span class="cs-caption">AI</span><span class="h3">발상부터 데이터, 창업까지</span><p>인공지능과 크리에이티브 씽킹, 데이터 분석 및 AI 활용, 창업과 AI 비즈니스</p></li>
          <li class="reveal" style="--i:8"><span class="cs-caption">Studio</span><span class="h3">캡스톤 디자인 4과목</span><p>디지털아트 창작실습 I·II, 산학 프로젝트 스튜디오, 포트폴리오 워크숍</p></li>
        </ol>
      </div>
    </div>
  </section>

  <!-- 03 · 진로와 역량 (상단 중앙 텍스트, 아래에 데이터가 흐르는 픽셀 필드) -->
  <section class="chapter top center" id="c3" data-mode="paper">
    <div class="shell">
      <div class="stack">
        <p class="kicker cs-caption reveal" style="--i:0">Careers</p>
        <h2 class="h2 reveal" style="--i:1">당신이 만든 세계가<br>누군가의 현실이 된다</h2>
        <p class="lead reveal" style="--i:2">확장 미디어 크리에이션과 테크 크리에이션, 두 역량을 축으로 모든 과목을 설계했습니다. 전공이 목표로 삼는 인재상은 다섯 가지입니다.</p>
        <div class="tools reveal" style="--i:3">
          <div class="col"><span class="cs-caption">기획, 연출</span><span class="h3">융복합 콘텐츠 기획자<br>실감미디어 디렉터</span></div>
          <div class="col"><span class="cs-caption">그래픽, 영상</span><span class="h3">컴퓨터 그래픽 아티스트<br>모션그래픽, VFX</span></div>
          <div class="col"><span class="cs-caption">인터랙션, 테크</span><span class="h3">인터랙션 프로그래머<br>테크니컬 아티스트, XR</span></div>
          <div class="col"><span class="cs-caption">미디어아트</span><span class="h3">미디어 아티스트<br>오디오비주얼, 설치, 퍼포먼스</span></div>
        </div>
      </div>
    </div>
  </section>

  <!-- 04 · 포트폴리오 -->
  <section class="chapter works" id="c4" data-mode="ink">
    <div class="shell">
      <div class="stack">
        <div class="reveal rowhead" style="--i:0"><h2 class="h2">학생 포트폴리오</h2><a class="btn secondary sm" href="portfolio.html">포트폴리오 전체 보기 <svg class="i"><use href="#arrow-up-right"/></svg></a></div>
        <div class="cards">
          <a class="card reveal" style="--i:2" href="portfolio.html#/work/work-001"><div class="media"><canvas class="thumb" data-seed="3" aria-hidden="true"></canvas></div><span class="cs-caption">Installation · [연도]</span><span class="title">[작품 제목을 입력하세요]</span><span class="cs-caption">[학생 이름]</span></a>
          <a class="card reveal" style="--i:3" href="portfolio.html#/work/work-002"><div class="media"><canvas class="thumb" data-seed="11" aria-hidden="true"></canvas></div><span class="cs-caption">Mapping · [연도]</span><span class="title">[작품 제목을 입력하세요]</span><span class="cs-caption">[학생 이름]</span></a>
          <a class="card reveal" style="--i:4" href="portfolio.html#/work/work-003"><div class="media"><canvas class="thumb" data-seed="27" aria-hidden="true"></canvas></div><span class="cs-caption">Animation · [연도]</span><span class="title">[작품 제목을 입력하세요]</span><span class="cs-caption">[학생 이름]</span></a>
        </div>
      </div>
    </div>
  </section>

  <!-- 05 · 입학안내 + footer -->
  <section class="chapter center last" id="c5" data-mode="paper">
    <div class="shell main">
      <div class="stack">
        <p class="kicker cs-caption reveal" style="--i:0">Admission</p>
        <h2 class="h2 reveal" style="--i:1">만드는 사람이 곧 매체가 된다.</h2>
        <p class="lead reveal" style="--i:2">모집 시기와 전형 방법, 실기 안내는 서울예술대학교 입학처 공지에서 확인할 수 있습니다.</p>
        <div class="actions reveal" style="--i:3">
          <a class="btn lg primary" href="https://www.seoularts.ac.kr/web/cop/bbsWeb/selectBoardList.do?bbsId=BBSMSTR_000000000924" target="_blank" rel="noopener">입학처 바로가기 <svg class="i i-20"><use href="#arrow-up-right"/></svg></a>
        </div>
      </div>
    </div>
    <footer class="shell foot" role="contentinfo">
      <div class="row">
        <span class="cs-caption">© 2026 Seoul Institute of the Arts, Digital Arts</span>
        <span class="links"><a class="cs-caption" href="https://www.instagram.com/seoularts_digitalarts/" target="_blank" rel="noopener">Instagram</a><a class="cs-caption" href="https://www.youtube.com/@sia_digitalarts" target="_blank" rel="noopener">YouTube</a><a class="cs-caption" href="https://www.seoularts.ac.kr/web/main/mainPage.do" target="_blank" rel="noopener">대학 홈페이지</a><a class="cs-caption" href="#c0">Top <svg class="i"><use href="#arrow-up"/></svg></a></span>
      </div>
    </footer>
  </section>
</main>`;

const HOME_SCRIPT = `
(function(){
  'use strict';
  document.documentElement.classList.add('js');
  var STATIC = /[?&]static=1/.test(location.search);
  var reduce = STATIC || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PACE = 1.15;                                                /* 모든 연출 시간 배율 (2026-09-28 사용자: 너무 빠르다 → 15% 느리게). 로고 숨쉬기 주기는 따로 */
  var introReduce = STATIC;                                       /* 첫 입장 애니메이션은 OS 의 '동작 줄이기' 와 무관하게 항상 재생 (사용자 요청) */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';   /* 새로고침해도 항상 맨 위(00 챕터)에서 시작 */
  var pendingHash = /^#c\\d$/.test(location.hash) ? parseInt(location.hash.slice(2), 10) : null;
  if (location.hash && !STATIC) history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo(0, 0);
  var ONLY = STATIC ? (location.search.match(/[?&]only=(\\d)/) || [])[1] : null;
  if (STATIC) document.documentElement.classList.add('static');
  if (STATIC) document.documentElement.classList.remove('booting');
  /* 제목 줄 나누기: <br> 로 나뉜 줄마다 마스크(.ln)를 씌운다 — 챕터에 들어올 때 줄 단위로 밀려 올라온다. 00 의 전공명은 낱말 단위 */
  Array.prototype.forEach.call(document.querySelectorAll('.chapter .h2'), function(h){ h.innerHTML = h.innerHTML.split(/<br\\s*\\/?>/i).map(function(t){ return '<span class="ln"><span>' + t.trim() + '</span></span>'; }).join(''); });
  (function(){ var sub = document.querySelector('.intro-sub'), tt = document.querySelector('.intro-title'); if (sub) sub.innerHTML = '<span class="ln"><span>' + sub.innerHTML + '</span></span>'; if (tt) tt.innerHTML = '<span class="ln">' + tt.textContent.trim().split(/\\s+/).map(function(w){ return '<span>' + w + '</span>'; }).join(' ') + '</span>'; })();
  if (ONLY !== null && ONLY !== undefined) { var onlyEl = document.getElementById('c' + ONLY); if (onlyEl) onlyEl.classList.add('only'); document.documentElement.classList.add('only-mode'); }

  /* ── 로고 픽셀 그리드 (32×34) — 원본 로고에서 추출 ── */
  var GRID = [
    "......................#.........",
    "............#####.....#.........",
    ".........############..#........",
    ".......###############.#........",
    "......################.#........",
    ".....#################.#..#.....",
    "....#############.####.#..#.....",
    "...##############.####.#..##....",
    "..###############..##..#.###....",
    ".################..#..##.###....",
    ".################..#..#..####.#.",
    ".##########.#####....##..####.#.",
    "###########..####....##.##.##.#.",
    "############.####...##..##.#..##",
    "############..##....##..##.#.###",
    "############..##....##..##.#.###",
    "############..##...###..##...###",
    "############..##..####...#...###",
    "########.###..#...####...#...###",
    "#######..##.......#####..##..###",
    "#######..##.......#####...#..###",
    ".######..##...##...####.....#.##",
    ".######..#...###...#####......#.",
    ".######..#...##.....####......#.",
    "..#####..##..##.....#####....##.",
    "..######..#...##.....#####...#..",
    "...###.#......##..#..#####..#...",
    "....##.........#..#....###..#...",
    ".....##.........#.##....#..#....",
    "......##...........###..........",
    ".......##..###......###.........",
    "...........###......####........",
    "...........####......###........",
    "............###................."
  ];

  /* ── 씬: 고정 캔버스 하나. 챕터마다 픽셀 배열(포메이션)이 바뀐다 ── */
  var canvas = document.getElementById('scene');
  var chapters = Array.prototype.slice.call(document.querySelectorAll('.chapter'));
  var boxes = [], N = 0, CX = 17, CY = 17, R = 17.7;
  /* 02 챕터에서 픽셀이 풀리며 변하는 코드 조각 — C++ 과 Python 의 변수·함수 (사용자 요청: 터치디자이너 위주에서 변경) */
  var TOKENS = ['float', 'int', 'auto', 'nullptr', 'std::vector', 'std::sin(t)', 'class Particle', 'update(dt)', 'const float dt', '#include <cmath>', 'pos += vel * dt', 'template<T>', 'new Pixel[n]', 'return pos;',
                'def render():', 'import numpy', 'np.zeros(n)', 'self.vel += g', 'lambda x: x * x', 'async def loop', 'yield frame', 'range(len(px))', 'True', 'None', 'print(fps)', '__main__', 'for i in range', 'dt = 1 / 60'];
  var KINDS = ['code','none','none','none','none','none','none'];      /* 코드 글자(약 14%, 75개쯤)만 남기고 나머지는 흩어지며 사라짐 — 더 많으면 겹쳐서 읽히지 않는다 */
  GRID.forEach(function(row, r){
    for (var c = 0; c < row.length; c++) {
      if (row[c] !== '#') continue;
      var x = c + 0.5 - CX, y = r + 0.5 - CY, d = Math.sqrt(x*x + y*y);
      var bulge = Math.sqrt(Math.max(0, 1 - (d*d) / (R*R)));
      var ang = Math.random() * Math.PI * 2, mag = 24 + Math.random() * 30, seed = Math.random(), seed2 = Math.random();
      boxes.push({ gx: x, gy: y, h: 0.5 + 1.3 * bulge, r: r, c: c, seed: seed, seed2: seed2,
        kind: KINDS[Math.floor(seed * KINDS.length)], token: TOKENS[Math.floor(seed2 * TOKENS.length)], rot: seed * 6.283,
        cur: { x: Math.cos(ang) * mag, y: Math.sin(ang) * mag, z: (Math.random() - 0.5) * 40 },
        from: null, to: null, t0: 0, tw: 0, dur: 1, m: 0, mFrom: 0, mTo: 0, fc: 0, fr: 0,
        ox: 0, oy: 0, vx: 0, vy: 0, pox: 0, poy: 0, sx: 0, sy: 0, sw: 0, sh: 0, held: false, thrown: false, rest: false, launched: false, hitT: 0, drawK: 0,
        pp: 9.2 + Math.random() * 9.3, po: Math.random() * 18, bw: 0.36 + Math.random() * 0.52, pulse: 0,  /* 살아 있는 로고: 픽셀마다 제 주기로 숨쉬고 가끔 앞으로 튀어나온다 (2026-09-28 사용자: 자글자글하다 → 주기 35% 느리게) */
        tl: 0, sa: 0, ax: 0, ay: 0, az: 0, a0: 1, szf0: 1 });                                                            /* 착지 시각·착지 반동 크기·곡선 경로의 휘는 양 */
    }
  });
  N = boxes.length;
  /* 02 챕터 코드 조각: VS Code Dark+ 배색으로 토큰을 부분별 채색 */
  var VS = { ctrl:'#C586C0', type:'#569CD6', fn:'#DCDCAA', num:'#B5CEA8', str:'#CE9178', vari:'#9CDCFE', td:'#4EC9B0', punc:'#D4D4D4' };
  var KW_CTRL = { 'for':1, 'if':1, 'else':1, 'return':1, 'while':1, 'import':1, 'yield':1, 'async':1, 'await':1, 'include':1, 'new':1, 'in':1 };
  var KW_TYPE = { 'float':1, 'int':1, 'void':1, 'const':1, 'auto':1, 'class':1, 'def':1, 'template':1, 'typename':1, 'nullptr':1, 'True':1, 'None':1, 'lambda':1, 'self':1, 'vector':1 };
  var KW_NS = { 'std':1, 'np':1, 'numpy':1, 'Particle':1, 'Pixel':1, 'T':1 };
  function lexParts(tok){
    var re = /(#[0-9A-Fa-f]{3,6}\\b)|("[^"]*"|'[^']*')|(0x[0-9A-Fa-f]+|\\d+(?:\\.\\d+)?)|([A-Za-z_][A-Za-z0-9_]*)|(\\s+)|(.)/g, m, parts = [];
    while ((m = re.exec(tok))) {
      if (m[1]) parts.push([m[1], VS.str]);
      else if (m[2]) parts.push([m[2], VS.str]);
      else if (m[3]) parts.push([m[3], VS.num]);
      else if (m[4]) { var w = m[4], nx = tok.charAt(re.lastIndex); parts.push([w, KW_CTRL[w] ? VS.ctrl : KW_TYPE[w] ? VS.type : KW_NS[w] ? VS.td : nx === '(' ? VS.fn : VS.vari]); }
      else if (m[5]) parts.push([m[5], VS.punc]);
      else parts.push([m[6], VS.punc]);
    }
    return parts;
  }
  boxes.forEach(function(b){ b.parts = lexParts(b.token); });
  var FCOLS = 40, FROWS = Math.ceil(N / FCOLS);
  boxes.forEach(function(b, i){ b.fc = i % FCOLS; b.fr = Math.floor(i / FCOLS); });

  /* 포메이션: 각 픽셀의 목표 위치(로고 단위) */
  var FORM = {
    logo:  function(b){ return { x: b.gx, y: b.gy, z: 0 }; },
    burst: function(b){ return { x: b.gx * (MOBILE() ? 1.5 : 1.25) + (b.seed - 0.5) * 6, y: b.gy * (MOBILE() ? 1.8 : 1.15) + (b.seed2 - 0.5) * 5, z: (b.seed - 0.5) * 26 }; },   /* 폰: 세로로 더 퍼뜨려 좁고 긴 영역을 채운다 */
    field: function(b){ return { x: (b.fc - (FCOLS - 1) / 2) * 1.3, y: (b.fr - (FROWS - 1) / 2) * 1.3, z: 0 }; }
  };
  /* 챕터별 회전·동작 설정. 위치와 크기는 frameFor() 가 화면과 텍스트를 실측해 "빈 영역"에 맞춘다 */
  var CHAPTERS = [
    { form: 'logo',  yaw: 0,    pitch: -0.08, sway: 0,    spin: 0,    morph: 0, flow: 0, live: 1,   sMax: 1.0,  sMin: 0.2,  fit: 0.9  },   /* sway 0: 첫 챕터는 카메라가 전혀 돌지 않는다 (인트로 끝에 흔들림이 시작되는 게 회전처럼 보였다) */
    { form: 'logo',  yaw: -0.25, pitch: -0.06, sway: 0.10, spin: 0,   morph: 0, flow: 0, live: 0.5, sMax: 0.85, sMin: 0.2,  fit: 0.9  },
    { form: 'burst', yaw: 0.15, pitch: -0.1,  sway: 0.20, spin: 0,    morph: 1, flow: 0, live: 0,   sMax: 0.85, sMin: 0.2,  fit: 0.86 },
    { form: 'field', yaw: 0,    pitch: -1.1,  sway: 0.02, spin: 0,    morph: 0, flow: 1, live: 0,   sMax: 1.0,  sMin: 0.3,  fit: 0.9  },
    { form: 'logo',  yaw: 0.1,  pitch: -0.1,  sway: 0.15, spin: 0,    morph: 0, flow: 0, live: 0.4, sMax: 1.0,  sMin: 0.18, fit: 0.92, alpha: 0.14 },
    { form: 'logo',  yaw: 0,    pitch: -0.05, sway: 0.18, spin: 0,    morph: 0, flow: 0, live: 0.6, sMax: 0.6,  sMin: 0.18, fit: 0.9  }
  ];
  var VW = function(){ return document.documentElement.clientWidth || window.innerWidth; };
  var VH = function(){ return document.documentElement.clientHeight || window.innerHeight; };
  /* 그리는 도중엔 레이아웃을 읽지 않는다: 폰 배치 여부는 CSS 와 같은 기준(matchMedia 799px), 헤더 높이는 창 크기가 바뀔 때만 (resize 에서 비움) */
  var mqMob = window.matchMedia('(max-width: 799px)'), hdrC = 0;
  var MOBILE = function(){ return mqMob.matches; };
  var HDR = function(){ return hdrC || (hdrC = (document.querySelector('.site-header') || {}).offsetHeight || 64); };

  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d'), shownOp = '';
    var HS = 0.47;
    /* 프레임마다 다시 만들지 않는 버퍼: 꼭짓점·면 조명·정렬 순서·상자 기록 */
    var PX = new Float32Array(8), PY = new Float32Array(8), RX = new Float32Array(8), RY = new Float32Array(8), RZ = new Float32Array(8);
    var FNX = new Float32Array(6), FNY = new Float32Array(6), FNZ = new Float32Array(6), FR = new Float32Array(6), FG = new Float32Array(6), FB = new Float32Array(6);
    var RECS = [], ORDER; for (var ri0 = 0; ri0 < N; ri0++) RECS.push({ z: 0, a: 1, px: 0, py: 0, pz: 0, dep: 1, szf: 1 }); ORDER = new Uint16Array(N);
    var colCache = new Map();                                                     /* 색 문자열 캐시 (채널 64단계): 프레임마다 수천 개 문자열을 만들지 않는다 */
    function colStr(r, g2, b2){ var ri = (r + 2) >> 2, gi = (g2 + 2) >> 2, bi = (b2 + 2) >> 2; if (ri > 63) ri = 63; if (gi > 63) gi = 63; if (bi > 63) bi = 63; if (ri < 0) ri = 0; if (gi < 0) gi = 0; if (bi < 0) bi = 0; var key = (ri << 12) | (gi << 6) | bi; var st = colCache.get(key); if (!st) { st = 'rgb(' + (ri << 2) + ',' + (gi << 2) + ',' + (bi << 2) + ')'; colCache.set(key, st); } return st; }
    var textW = new Map(), lastFont = null;                                       /* 코드 조각 글자 폭 캐시, 지금 설정된 글꼴 (같으면 다시 설정하지 않는다) */
    /* 큐브 꼭짓점 8개: k 비트 → (x,y,z) 부호. 면과 모서리는 꼭짓점 인덱스로 정의 */
    var CORN = []; for (var k = 0; k < 8; k++) CORN.push([(k & 1) ? 1 : -1, (k & 2) ? 1 : -1, (k & 4) ? 1 : -1]);
    var FACES = [ { n:[0,0,-1], v:[0,1,3,2] }, { n:[0,0,1], v:[4,5,7,6] }, { n:[1,0,0], v:[1,5,7,3] }, { n:[-1,0,0], v:[0,4,6,2] }, { n:[0,-1,0], v:[0,1,5,4] }, { n:[0,1,0], v:[2,3,7,6] } ];
    var EDGES = [[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4],[0,4],[1,5],[3,7],[2,6]];
    var L = [-0.42, -0.62, -0.66]; var ll = Math.sqrt(L[0]*L[0]+L[1]*L[1]+L[2]*L[2]); L = [L[0]/ll, L[1]/ll, L[2]/ll];
    var PAL_INK   = { dark:[24,26,30],  mid:[140,142,146], light:[243,243,243], sky:[244,255,83], fog:[0,0,0] };
    var PAL_PAPER = { dark:[8,8,10],    mid:[52,54,60],    light:[122,126,134], sky:[176,192,20],  fog:[247,247,245] };
    function mix(a, b, t){ return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }
    function rgb(c){ return 'rgb(' + (c[0]|0) + ',' + (c[1]|0) + ',' + (c[2]|0) + ')'; }
    function easeOut(p){ return 1 - Math.pow(1 - p, 3); }
    function easeInOut(p){ return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
    function easeOut4(p){ return 1 - Math.pow(1 - p, 4); }                    /* 챕터 전환: 스크롤과 동시에 바로 움직이고 부드럽게 멈춘다 */

    var W = 0, H = 0, DPR = 1, SHELL = 0;
    /* 캔버스 해상도: 기기 배율 그대로(폰 3배까지) 하나로 고정 — 전에는 움직일 때마다 1.5배로 낮췄다가 멈추면 되돌려
       전환의 시작·끝마다 캔버스를 새로 만들며 끊기고, 폰에선 움직이는 동안 흐릿했다. 화면이 아주 크면 4K 한 장(830만 화소)까지만,
       정말 버거운 기기에서만 govCap 으로 한 단계씩 낮춘다. 기기 배율은 매번 다시 읽는다 (브라우저 확대·다른 모니터) */
    var govCap = 3, PX_BUDGET = 8.3e6, fIv = [], fI = 0, cad = 16.7, fLast = 0, epN = 0, epLate = 0, ups = 0;
    function naturalDPR(){ return Math.min(window.devicePixelRatio || 1, 3, Math.sqrt(PX_BUDGET / (W * H))); }
    function resize(){
      hdrC = 0; lastDraw = 0;                                                     /* 캔버스를 새로 만들면 비워지니 다음 프레임은 건너뛰지 않고 그린다 */
      var sc = canvas.parentNode.getBoundingClientRect();
      W = Math.max(1, Math.round(sc.width || VW())); H = Math.max(1, Math.round(sc.height || VH()));
      DPR = Math.min(govCap, naturalDPR());
      var cw = Math.round(W * DPR), ch = Math.round(H * DPR);
      if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; lastFont = null; }   /* 캔버스를 새로 만들면 글꼴 설정도 풀린다 */
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      var sh = document.querySelector('.chapter .shell');
      if (sh) { var cs = getComputedStyle(sh); SHELL = sh.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0); }
      if (!sh || SHELL < 200) SHELL = W;
    }
    /* 프레임 감시: 절전 모드·임베드 화면처럼 초당 30장으로 묶인 건 느린 게 아니다 (전에는 이걸 과부하로 읽어 해상도를 1.25배까지 영영 낮췄다).
       화면의 박자(cad) = 최근 15장 간격 중 셋째로 짧은 것 — 절전 모드가 도중에 켜져도 0.5초면 따라간다.
       늦은 프레임 = 박자(최소 60Hz 한 칸)의 1.6배, 또는 박자와 상관없이 40ms(25장) 를 넘는 것. 고르게 초당 30장이면 끊김이 아니니 두고, 그보다 느리면 낮춘다.
       매 장 그리는 구간(전환·인트로·흐름·놀이)이 끝날 때나 120장마다 한 번 판단한다: 1/4 넘게 늦었으면 한 단계(×0.75) 낮추고,
       거의 안 늦었으면 한 단계 되돌린다 (되돌리기는 세 번까지). 긴 인트로는 20장 중 절반 넘게 늦으면 바로 낮춘다 */
    function setCap(v){ govCap = Math.max(1, Math.min(3, v)); resize(); }
    function watchFrames(now, full){
      var dt = now - fLast; fLast = now;
      if (epN && (!full || epN >= 120)) {
        if (epN >= 20) { if (epLate * 4 > epN && DPR > 1.01) setCap(DPR * 0.75); else if (epLate * 20 < epN && ups < 3 && DPR < naturalDPR() - 0.01) { ups++; setCap(DPR / 0.75); } }
        epN = epLate = 0;
      }
      if (!(dt > 0 && dt < 250) || now - start < 800) return;
      if (fIv.length < 15) fIv.push(dt); else { fIv[fI] = dt; fI = (fI + 1) % 15; }
      var a1 = 1e9, a2 = 1e9, a3 = 1e9; for (var k = 0; k < fIv.length; k++) { var v = fIv[k]; if (v < a1) { a3 = a2; a2 = a1; a1 = v; } else if (v < a2) { a3 = a2; a2 = v; } else if (v < a3) a3 = v; }
      if (fIv.length >= 5) cad = a3;
      if (!full) return;
      epN++; if (dt > Math.min(40, Math.max(16.7, cad) * 1.6)) epLate++;
      if (!introDone && epN >= 20 && epLate * 2 > epN && DPR > 1.01) { setCap(DPR * 0.75); epN = epLate = 0; }
    }
    resize();                                                                   /* 창 크기 변경은 아래 한 곳에서 (resize + 배치 다시) */

    /* 포메이션을 주어진 회전·크기로 투영했을 때의 화면상 경계 상자 (중심 0,0 기준 px) */
    function projectBBox(form, sc, yaw, pitch){
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var F = Math.min(W, H) * 1.45, D = 72, fn = FORM[form];
      var minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
      for (var k = 0; k < N; k++) {
        var t = fn(boxes[k], k), px = t.x * sc, py = t.y * sc, pz = t.z * sc;
        var ax = px * cy + pz * sy, az = -px * sy + pz * cy, ay = py * cp - az * sp, az2 = py * sp + az * cp;
        var s2 = F / (az2 + D), X = ax * s2, Y = ay * s2, r = HS * sc * s2 * 1.8;
        if (X - r < minx) minx = X - r; if (X + r > maxx) maxx = X + r; if (Y - r < miny) miny = Y - r; if (Y + r > maxy) maxy = Y + r;
      }
      return { x0: minx, x1: maxx, y0: miny, y1: maxy };
    }
    /* 챕터별 빈 영역(헤더·텍스트·푸터를 실측)에 로고를 contain 방식으로 맞춘다 */
    function frameFor(i){
      var c = CHAPTERS[i] || CHAPTERS[0], sec = chapters[i], hd = HDR(), M = 24;
      var shellL = (W - SHELL) / 2, shellR = shellL + SHELL, box;
      var hOf = function(sel){ var e = sec.querySelector(sel); return e ? e.offsetHeight : 0; };
      if (MOBILE()) {
        if (i === 0) box = { x0: shellL, x1: shellR, y0: hd + 16, y1: H - 0.12 * H - hOf('.wordmark') - 20 };
        else {
          var stSel = i === 5 ? '.main .stack' : '.stack', padB = i === 5 ? hOf('.foot') + 12 : 24;
          var topM = H - padB - hOf(stSel);
          box = { x0: shellL, x1: shellR, y0: hd + 10, y1: Math.max(hd + 10 + 56, topM - 10) };
        }
      } else if (i === 0) {
        box = { x0: shellL, x1: shellR, y0: hd + M, y1: H - 0.12 * H - hOf('.wordmark') - M };
      } else if (i === 1) {
        box = { x0: W / 2 + 28, x1: shellR - 56, y0: hd + M, y1: H - M };
      } else if (i === 2) {
        box = { x0: shellL, x1: W / 2 - 28, y0: hd + M, y1: H - M };
      } else if (i === 3) {
        box = { x0: shellL, x1: shellR - 56, y0: hd + 0.07 * H + hOf('.stack') + 36, y1: H - 12 };
      } else if (i === 4) {
        box = { x0: shellL, x1: shellR, y0: hd + M, y1: H - M };                 /* 카드 뒤 워터마크 */
      } else {
        var top5 = H - hOf('.foot') - 0.04 * H - hOf('.main .stack');
        box = { x0: shellL, x1: shellR, y0: hd + M, y1: Math.max(hd + M + 80, top5 - 16) };
      }
      var sMax = MOBILE() ? Math.min(1.4, c.sMax * 1.6) : c.sMax, fit = MOBILE() ? Math.min(0.96, c.fit + 0.06) : c.fit;
      var bw = Math.max(40, box.x1 - box.x0), bh = Math.max(40, box.y1 - box.y0), sc = sMax;
      for (var it = 0; it < 2; it++) { var bb = projectBBox(c.form, sc, c.yaw, c.pitch); var k2 = Math.min(bw * fit / (bb.x1 - bb.x0), bh * fit / (bb.y1 - bb.y0)); sc = Math.max(c.sMin, Math.min(sMax, sc * k2)); }
      var bbF = projectBBox(c.form, sc, c.yaw, c.pitch);
      return { s: sc, cx: (box.x0 + box.x1) / 2 - (bbF.x0 + bbF.x1) / 2, cy: (box.y0 + box.y1) / 2 - (bbF.y0 + bbF.y1) / 2 };
    }

    var f0 = frameFor(0), c0 = CHAPTERS[0];
    var g = { cx: f0.cx, cy: f0.cy, s: f0.s, yaw: c0.yaw, pitch: c0.pitch, sway: c0.sway, spin: c0.spin, mode: 1, flow: 0, live: c0.live, alpha: 1 };
    var gFrom = null, gTo = null, gT0 = 0, gDur = 0.9;
    var active = 0, start = performance.now(), lastSpin = 0, spinAcc = 0;

    var grid = null, flightEnd = 0;                                                               /* 첫 입장 픽셀 격자 — setFormation(0, true) 보다 먼저 있어야 한다 */
    function buildGrid(fr, c, now){
      /* 첫 입장: 검은 화면 전체를 덮는 규칙적인 픽셀 격자 — 평소엔 느끼지 못하는 화면의 해상도 (사용자 요청 2026-09-28: 먼지 같은 입자가 아니라 화면을 이루는 픽셀).
         가운데부터 바깥으로 켜지며 살짝 앞으로 나오고, 잠깐 그대로 멈춰 보인 뒤 가운데로 빨려 들어가 로고가 된다.
         로고 픽셀 530개는 '로고를 화면 크기로 늘린 자리'의 칸에서 출발하고, 나머지 칸은 모이기 시작하는 순간 제자리에서 꺼진다
         (전에는 나머지 칸도 로고 쪽으로 끌려오며 흐려져, 모이는 로고 둘레에 잔상처럼 남았다 — 2026-09-28 사용자 요청으로 제거) */
      var P = Math.max(MOBILE() ? 6 : 8, Math.sqrt(W * H / 20000)), cols = Math.floor(W / P), rows = Math.floor(H / P), n = cols * rows;
      var x0 = (W - (cols - 1) * P) / 2, y0 = (H - (rows - 1) * P) / 2, F = Math.min(W, H) * 1.45, D = 72, cp = Math.cos(c.pitch), sp = Math.sin(c.pitch), unit = fr.s * F / D;
      var G = { n: n, SQ: P * 0.7, sx: new Float32Array(n), sy: new Float32Array(n), tw: new Float32Array(n), t0: new Float32Array(n), du: new Float32Array(n), al: new Float32Array(n), own: new Int16Array(n) };
      G.own.fill(-1);
      G.qb = []; for (var q = 0; q < 8; q++) G.qb.push(new Float32Array(3 * n)); G.qn = new Int32Array(8);   /* 불투명도 8단계 그리기 버퍼 — 한 번만 만든다 (전에는 매 프레임 배열 9개를 새로 만들어 GC 가 돌았다) */
      for (var j = 0; j < n; j++) {
        var X = x0 + (j % cols) * P, Y = y0 + Math.floor(j / cols) * P;
        var yr = Y - fr.cy, wy = yr * D / (cp * F - yr * sp), wx = (X - fr.cx) * (wy * sp + D) / F;      /* 화면 좌표 → 로고 좌표 (챕터 0 카메라의 역투영: 격자가 화면에 정확히 반듯하게) */
        var ux = (X - W / 2) / (W * 0.48), uy = (Y - H / 2) / (H * 0.48), rN = Math.min(1, Math.sqrt(ux * ux + uy * uy) / 1.42);
        G.sx[j] = wx / fr.s; G.sy[j] = wy / fr.s;
        G.tw[j] = now + (0.15 + 0.5 * rN + Math.random() * 0.06) * PACE; /* 켜짐: 가운데 → 바깥 */
        G.t0[j] = now + (1.6 + 0.25 * rN + Math.random() * 0.05) * PACE; /* 잠깐 멈춰 보인 뒤 로고 칸은 출발, 나머지 칸은 꺼짐 */
        G.du[j] = (1.0 + 0.65 * rN) * PACE;                                       /* 로고 칸의 비행 시간 — 착지 물결 0.9초 (전 0.6초 — 사용자: 조금 더 천천히) */
        G.al[j] = 0.4 + Math.random() * 0.08;                            /* 밝기 차이는 좁게 */
      }
      for (var k = 0; k < N; k++) {
        var b = boxes[k], ci = Math.max(0, Math.min(cols - 1, Math.round((W / 2 + b.gx / R * W * 0.48 - x0) / P))), ri = Math.max(0, Math.min(rows - 1, Math.round((H / 2 + b.gy / R * H * 0.48 - y0) / P))), jj = ri * cols + ci;
        G.own[jj] = k;
        b.cur = { x: G.sx[jj], y: G.sy[jj], z: 0 }; b.tw = G.tw[jj]; b.t0 = G.t0[jj]; b.dur = G.du[jj]; b.tl = b.t0 + b.dur; b.a0 = G.al[jj]; b.szf0 = G.SQ / (0.94 * unit);
      }
      grid = G;
    }
    function setFormation(i, initial, instant){
      var c = CHAPTERS[i] || CHAPTERS[0], fr = frameFor(i), now = (performance.now() - start) / 1000, fn = FORM[c.form];
      /* 첫 진입: 화면 전체 격자에 숨어 있던 픽셀들 — 가운데부터 바깥으로 켜진 뒤 로고 칸만 로고 자리로 모인다 (나머지 칸은 제자리에서 꺼짐) */
      /* 전환 순서: 로고가 화면에서 옮겨 가는 쪽의 앞 픽셀부터 떠난다 (제자리 변형이면 가운데부터). 한꺼번에가 아니라 물결처럼 */
      var shx = fr.cx - g.cx, shy = fr.cy - g.cy, shl = Math.sqrt(shx * shx + shy * shy), dvx = shl > 40 ? shx / shl : 0, dvy = shl > 40 ? shy / shl : 0;
      var keys = [], kMin = 1e9, kMax = -1e9;
      for (var k0 = 0; k0 < N; k0++) { var c0b = boxes[k0].cur, kv = (dvx || dvy) ? -(c0b.x * dvx + c0b.y * dvy) : Math.sqrt(c0b.x * c0b.x + c0b.y * c0b.y); keys.push(kv); if (kv < kMin) kMin = kv; if (kv > kMax) kMax = kv; }
      if (initial && !introReduce) buildGrid(fr, c, now);
      if (instant) grid = null;
      for (var k = 0; k < N; k++) {
        var b = boxes[k], t = fn(b, k), fd;
        if (initial) {
          fd = Math.sqrt((b.cur.x - t.x) * (b.cur.x - t.x) + (b.cur.y - t.y) * (b.cur.y - t.y));   /* 출발 칸·시각은 buildGrid 가 정해 두었다 */
          b.sa = 0;                                                         /* 착지 반동 없음 (사용자 2026-09-28: 모일 때 피드백 효과가 짜친다) */
        } else {
          /* 챕터 전환 (사용자 2026-09-28: 스크롤보다 반 박자 늦게 딸려온다 → 물결 간격 0.32→0.12초, 비행 0.8–1.25→0.55–0.85초, 느린 출발 없이 바로 움직이는 곡선) */
          fd = Math.sqrt((b.cur.x - t.x) * (b.cur.x - t.x) + (b.cur.y - t.y) * (b.cur.y - t.y));
          b.t0 = now + ((kMax > kMin ? (keys[k] - kMin) / (kMax - kMin) : 0) * 0.12 + Math.random() * 0.04) * PACE;
          b.dur = (0.55 + Math.min(0.3, fd * 0.02)) * PACE;
          b.tl = b.t0 + b.dur;
          b.sa = fd > 1.5 ? 0.3 : 0;                                      /* 멀리서 온 픽셀만 착지 반동 */
        }
        /* 곡선 경로: 이동 방향에 수직으로 살짝 휘고(방향은 픽셀마다 무작위), 가운데쯤 화면 쪽으로 떠오른다 — 직선 이동보다 떼 지어 나는 느낌 */
        var side = (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.65), mvx = t.x - b.cur.x, mvy = t.y - b.cur.y, bend = initial ? 0.05 : 0.1;
        b.ax = -mvy * bend * side; b.ay = mvx * bend * side; b.az = initial ? 0 : -Math.min(4, fd * 0.08);   /* 인트로는 날아오며 앞으로 부풀지 않는다 */
        b.from = { x: b.cur.x, y: b.cur.y, z: b.cur.z }; b.to = t;
        b.mFrom = b.m; b.mTo = c.morph;
        b.back = !!initial;
        if ((initial ? introReduce : reduce) || instant) { b.cur = { x: t.x, y: t.y, z: t.z }; b.m = c.morph; b.t0 = now - 10; b.tw = now - 10; b.tl = now - 10; b.sa = 0; b.ax = b.ay = b.az = 0; }
        if (b.tl + 0.5 * PACE > flightEnd) flightEnd = b.tl + 0.5 * PACE;
      }
      gFrom = { cx: g.cx, cy: g.cy, s: g.s, yaw: g.yaw, pitch: g.pitch, sway: g.sway, spin: g.spin, mode: g.mode, flow: g.flow, live: g.live, alpha: g.alpha };
      gTo = { cx: fr.cx, cy: fr.cy, s: fr.s, yaw: c.yaw, pitch: c.pitch, sway: c.sway, spin: c.spin, mode: chapters[i].getAttribute('data-mode') === 'ink' ? 1 : 0, flow: c.flow, live: c.live || 0, alpha: (MOBILE() || c.alpha === undefined) ? 1 : c.alpha };
      gFrom.yaw = g.yaw + spinAcc; spinAcc = 0;
      var dyaw = gTo.yaw - gFrom.yaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw)); gFrom.yaw = gTo.yaw - dyaw;
      gT0 = now; gDur = (initial || reduce || instant) ? 0.01 : 0.8 * PACE;                     /* 카메라(위치·크기·각도): 스크롤과 함께 바로 출발 */
      if (initial && !introReduce) { gFrom.yaw = c.yaw; gFrom.pitch = c.pitch; gFrom.sway = 0; gFrom.s = fr.s; gT0 = now + 1.3; gDur = 1.9; }   /* 카메라 회전 없음 (사용자 요청): 처음부터 정면, 흔들림만 서서히 */
    }
    setFormation(0, true);
    var introDone = false, INTRO_T = 4.15 * PACE, sceneT = 0, introAt = 0;
    /* ── 이스터에그: 02 챕터의 코드 조각을 마우스·손가락으로 잡아 던지면 얼마쯤 날아갔다가 스프링처럼 제자리로 돌아온다.
       점수나 안내 없이 숨어 있다 (조각 위에서 커서가 손 모양으로 바뀌는 것만 힌트) ── */
    var play = { on: false, drag: null, last: 0, trail: [], gx: 0, gy: 0 };
    function codeAt(x, y){
      var hit = null;
      for (var i = 0; i < N; i++) { var b = boxes[i]; if (b.kind !== 'code' || !b.sw || b.seenT === undefined || sceneT - b.seenT > 0.2) continue;
        var hw = b.sw / 2 + 8, hh = b.sh / 2 + 8; if (x >= b.sx - hw && x <= b.sx + hw && y >= b.sy - hh && y <= b.sy + hh && (!hit || (b.drawK || 0) >= (hit.drawK || 0))) hit = b; }
      return hit;
    }
    function dragStart(x, y){
      if (active !== 2 || !introDone) return false; var b = codeAt(x, y); if (!b) return false;
      play.on = true; play.drag = b; play.last = sceneT; b.vx = 0; b.vy = 0; b.held = true; b.thrown = false;
      play.gx = x - b.ox; play.gy = y - b.oy; play.trail = [{ x: x, y: y, t: performance.now() }]; return true;
    }
    function dragMove(x, y){ var b = play.drag; if (!b) return; b.ox = x - play.gx; b.oy = y - play.gy; play.trail.push({ x: x, y: y, t: performance.now() }); if (play.trail.length > 6) play.trail.shift(); }
    function dragEnd(){
      var b = play.drag; if (!b) return; var tr = play.trail, a = tr[0], z = tr[tr.length - 1], dt = Math.max(24, z.t - a.t) / 1000;
      b.vx = Math.max(-2600, Math.min(2600, (z.x - a.x) / dt)); b.vy = Math.max(-2600, Math.min(2600, (z.y - a.y) / dt));
      b.held = false; b.thrown = true; b.launched = true; play.drag = null;
    }
    var SPRING = 16, DAMP = 2.8;                                                   /* 되돌아오는 힘과 감쇠: 살짝 넘쳤다가 자리를 잡는다 */
    function updatePlay(t){
      var dt = Math.min(0.05, t - play.last); play.last = t; if (dt <= 0) return;
      var top = HDR() + 10, bottom = H - 10, left = 10, right = W - 10, busy = 0;
      for (var i = 0; i < N; i++) {
        var b = boxes[i]; if (b.kind !== 'code') continue;
        if (b.held) { busy++; continue; }
        if (!b.thrown) continue;
        b.vx += (-SPRING * b.ox - DAMP * b.vx) * dt; b.vy += (-SPRING * b.oy - DAMP * b.vy) * dt;
        b.ox += b.vx * dt; b.oy += b.vy * dt;
        var hw = b.sw / 2, hh = b.sh / 2, x = b.sx - b.pox + b.ox, y = b.sy - b.poy + b.oy;   /* 이번 프레임의 예상 위치 */
        if (x - hw < left) { b.ox += left - (x - hw); b.vx = Math.abs(b.vx) * 0.5; }
        if (x + hw > right) { b.ox -= (x + hw) - right; b.vx = -Math.abs(b.vx) * 0.5; }
        if (y - hh < top) { b.oy += top - (y - hh); b.vy = Math.abs(b.vy) * 0.5; }
        if (y + hh > bottom) { b.oy -= (y + hh) - bottom; b.vy = -Math.abs(b.vy) * 0.5; }
        if (Math.abs(b.ox) < 0.6 && Math.abs(b.oy) < 0.6 && Math.abs(b.vx) < 6 && Math.abs(b.vy) < 6) { b.ox = 0; b.oy = 0; b.vx = 0; b.vy = 0; b.thrown = false; b.launched = false; }
        else busy++;
      }
      if (!busy && !play.drag) play.on = false;
    }
    function resetPlay(){
      for (var i = 0; i < N; i++) { var b = boxes[i]; if (b.kind !== 'code') continue; b.ox = 0; b.oy = 0; b.vx = 0; b.vy = 0; b.held = false; b.thrown = false; b.launched = false; b.hitT = 0; b.drawK = 0; }
      play.on = false; play.drag = null; document.body.style.cursor = '';
    }

    /* 03 챕터: 픽셀 필드 위를 오가는 데이터 패킷 (행·열을 따라 빛이 옮겨 다닌다) */
    var packets = [], boost = new Float32Array(N);
    for (var p = 0; p < 18; p++) packets.push({ col: p % 3 === 0, line: Math.floor(Math.random() * (p % 3 === 0 ? FCOLS : FROWS)), x: Math.random() * FCOLS, v: (4 + Math.random() * 7) * (Math.random() < 0.5 ? 1 : -1), len: 2 + Math.random() * 2 });
    var lastT = 0;
    function updateFlow(t){
      var dt = Math.min(0.05, t - lastT); lastT = t;
      for (var i = 0; i < N; i++) boost[i] = 0;
      for (var p = 0; p < packets.length; p++) {
        var pk = packets[p], limit = pk.col ? FROWS : FCOLS;
        pk.x += pk.v * dt;
        if (pk.x > limit + 3) { pk.x = -3; pk.line = Math.floor(Math.random() * (pk.col ? FCOLS : FROWS)); }
        if (pk.x < -3) { pk.x = limit + 3; pk.line = Math.floor(Math.random() * (pk.col ? FCOLS : FROWS)); }
        for (var d = -3; d <= 3; d++) {
          var cell = Math.floor(pk.x) + d; if (cell < 0 || cell >= limit) continue;
          var idx = pk.col ? cell * FCOLS + pk.line : pk.line * FCOLS + cell; if (idx >= N) continue;
          var dist = (cell + 0.5 - pk.x) * (pk.v > 0 ? 1 : -1);      /* 진행 방향 뒤로 꼬리 */
          var val = dist > 0 ? Math.exp(-dist * dist * 1.6) : Math.exp(-dist * dist / pk.len);
          if (val > boost[idx]) boost[idx] = val;
        }
      }
    }

    function drawFragment(b, X, Y, sz, P, alpha, pal){
      if (b.kind === 'none') return;
      ctx.globalAlpha = alpha; ctx.lineWidth = 1; ctx.strokeStyle = rgb(pal.mid); ctx.fillStyle = rgb(pal.light);
      if (b.kind === 'code') {
        if (MOBILE() && b.seed2 > 0.5) return;                                       /* 폰: 영역이 작아 조각을 절반만 (75 → 약 37개) — 겹쳐서 깨져 보이던 문제 */
        /* 글자 크기는 0.25px 단위로 — 크기가 매 프레임 조금씩 달라져 글리프를 새로 그리느라 데스크톱에서 프레임당 25ms 가 들던 것 (0.25px 차이는 눈에 안 보인다) */
        var fpx = Math.round(Math.max(MOBILE() ? 10 : 11, sz * 1.9) * (b.held ? 1.18 : 1) * 4) / 4;
        var font = '500 ' + fpx + 'px ui-monospace, Menlo, Consolas, monospace'; if (font !== lastFont) { ctx.font = font; lastFont = font; }
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        var parts = b.parts || [[b.token, VS.vari]], total = 0, widths = [];
        for (var pi = 0; pi < parts.length; pi++) { var wkey = parts[pi][0] + '|' + fpx, pw = textW.get(wkey); if (pw === undefined) { pw = ctx.measureText(parts[pi][0]).width; textW.set(wkey, pw); } widths.push(pw); total += pw; }
        b.sx = X; b.sy = Y; b.sw = total; b.sh = fpx * 1.15; b.pox = b.ox || 0; b.poy = b.oy || 0; if (alpha > 0.5) b.seenT = sceneT;
        var cx2 = X - total / 2;
        for (var pj = 0; pj < parts.length; pj++) { ctx.fillStyle = parts[pj][1]; ctx.fillText(parts[pj][0], cx2, Y); cx2 += widths[pj]; }
      } else if (b.kind === 'tri') {
        ctx.strokeStyle = rgb(pal.light); ctx.beginPath();
        for (var q = 0; q < 3; q++) { var an = b.rot + q * 2.094, rr = sz * (1.1 + (q === 1 ? 0.5 : 0)); var px = X + Math.cos(an) * rr, py = Y + Math.sin(an) * rr; if (q) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.closePath(); ctx.stroke();
      } else if (b.kind === 'node') {
        var w = sz * 2.4, h = sz * 1.3; ctx.strokeStyle = rgb(pal.light);
        ctx.strokeRect(X - w / 2, Y - h / 2, w, h);
        ctx.strokeStyle = rgb(pal.mid); ctx.beginPath(); ctx.moveTo(X + w / 2 + 1, Y); ctx.lineTo(X + w / 2 + sz * 1.8, Y); ctx.stroke();
      } else if (b.kind === 'wave') {
        ctx.strokeStyle = rgb(pal.light); ctx.beginPath();
        for (var i2 = 0; i2 <= 10; i2++) { var wx = X - sz * 1.6 + i2 * sz * 0.32, wy = Y + Math.sin(i2 * 0.9 + b.rot) * sz * 0.5; if (i2) ctx.lineTo(wx, wy); else ctx.moveTo(wx, wy); }
        ctx.stroke();
      } else if (b.kind === 'dot') {
        ctx.globalAlpha = alpha * 0.55; ctx.fillStyle = rgb(pal.mid); var ds = Math.max(1.5, sz * 0.45); ctx.fillRect(X - ds / 2, Y - ds / 2, ds, ds);
      } else {
        ctx.globalAlpha = alpha * 0.7;
        ctx.strokeStyle = rgb(pal.mid); ctx.beginPath(); ctx.moveTo(X - sz * 0.9, Y); ctx.lineTo(X + sz * 0.9, Y); ctx.moveTo(X, Y - sz * 0.9); ctx.lineTo(X, Y + sz * 0.9); ctx.stroke();
        ctx.fillStyle = rgb(pal.light); ctx.beginPath(); ctx.arc(X, Y, Math.max(1.5, sz * 0.22), 0, 6.283); ctx.fill();
      }
    }

    var PERF = /[?&]perf=1/.test(location.search), perfLog = [], lastDraw = 0;
    if (PERF) window.__perf = perfLog;
    function render(now){
      var p0 = PERF ? performance.now() : 0;
      var t = (now - start) / 1000; sceneT = t;
      var busy = !!(gFrom && gTo) || !introDone || t < flightEnd;
      var liveK = introDone ? Math.min(1, (t - introAt) / 1.5) : 0;
      /* 그리는 간격: 조용할 때(첫 화면 밖에서 전환·인트로·놀이가 없고 숨쉬기만)는 초당 30장, 그 밖엔 60장 안팎 — 화면 박자(cad)의 정수배로 건너뛴다.
         반 박자 여유를 둬 60·90·100·120·144Hz 어디서나 고르고, 절전 모드 30Hz 에선 매 장 그린다 (전에는 한 장 건너 한 장이라 15장이 됐다) */
      var calm = !STATIC && !busy && !play.on && active !== 0 && g.flow < 0.01;
      watchFrames(now, !calm);
      var skipK = Math.max(1, Math.floor((calm ? 33.3 : 16.7) / cad + 0.1));
      if (now - lastDraw < (skipK - 0.5) * cad) { requestAnimationFrame(render); return; }
      lastDraw = now;
      if (play.on) updatePlay(t);
      if (gFrom && gTo) { var gp = Math.max(0, Math.min(1, (t - gT0) / gDur)), ge = easeOut4(gp); for (var key in gTo) g[key] = gFrom[key] + (gTo[key] - gFrom[key]) * ge; if (gp >= 1) gFrom = gTo = null; }
      spinAcc += g.spin * (t - lastSpin); lastSpin = t;
      if (g.flow > 0.01 && !reduce) updateFlow(t); else lastT = t;
      var yaw = g.yaw + Math.sin(t * 0.22) * g.sway + spinAcc;
      yaw = Math.max(-0.35, Math.min(0.35, yaw));                     /* 정면 기준 ±20° 를 넘지 않는다 */
      var pitch = g.pitch + Math.sin(t * 0.17) * g.sway * 0.35;
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var D = 72, F = Math.min(W, H) * 1.45, S = g.s, OX = g.cx, OY = g.cy;
      /* 광원이 아주 천천히 돌고, 부드러운 빛 띠가 표면을 스친다 */
      var lx0 = -0.42 + Math.sin(t * 0.21) * 0.28, ly0 = -0.62 + Math.cos(t * 0.17) * 0.12, lz0 = -0.66; var lnorm = Math.sqrt(lx0*lx0 + ly0*ly0 + lz0*lz0); L = [lx0 / lnorm, ly0 / lnorm, lz0 / lnorm];
      var sweepA = 0.8, sweepPos = Math.sin(t * 0.16) * 26, sweepC = Math.cos(sweepA), sweepS = Math.sin(sweepA);
      var pal = { dark: mix(PAL_PAPER.dark, PAL_INK.dark, g.mode), mid: mix(PAL_PAPER.mid, PAL_INK.mid, g.mode), light: mix(PAL_PAPER.light, PAL_INK.light, g.mode), sky: mix(PAL_PAPER.sky, PAL_INK.sky, g.mode), fog: mix(PAL_PAPER.fog, PAL_INK.fog, g.mode) };
      /* 반투명 워터마크 챕터: 로고는 불투명하게 그리고 투명도는 캔버스 자체(CSS opacity)에 준다 — 겹침 얼룩이 없고 합성은 브라우저가 공짜로 한다.
         (전에는 오프스크린 캔버스에 그린 뒤 화면 전체를 매 프레임 다시 합성해 데스크톱에서 프레임이 떨어졌다. 그 캔버스 한 장 몫의 메모리도 뺐다) */
      var op = g.alpha < 0.999 ? g.alpha.toFixed(3) : ''; if (op !== shownOp) { shownOp = op; canvas.style.opacity = op; }
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);

      /* 프레임 상수: 면 6개의 회전된 법선과 조명은 모든 상자에 같다 → 한 번만 계산 (전에는 상자마다 6번, 3,000번 넘게 반복) */
      for (var f0 = 0; f0 < 6; f0++) {
        var fnn = FACES[f0].n, fnx1 = fnn[0] * cy + fnn[2] * sy, fnz1 = -fnn[0] * sy + fnn[2] * cy, fny2 = fnn[1] * cp - fnz1 * sp, fnz2 = fnn[1] * sp + fnz1 * cp;
        FNX[f0] = fnx1; FNY[f0] = fny2; FNZ[f0] = fnz2;
        var flam = Math.max(0, fnx1 * L[0] + fny2 * L[1] + fnz2 * L[2]);
        var fc = mix(pal.dark, pal.mid, Math.min(1, 0.25 + flam * 0.9)); fc = mix(fc, pal.light, Math.pow(flam, 3) * 0.75); fc = mix(fc, pal.light, Math.max(0, -fny2) * 0.12);
        FR[f0] = fc[0]; FG[f0] = fc[1]; FB[f0] = fc[2];
      }
      if (grid && introDone) grid = null;
      if (grid) {
        /* 격자: 불투명도 8단계로 묶어 경로 8개로 한 번에 채운다 (2만 칸도 가볍게). 색은 로고 큐브 앞면과 같게 — 로고 픽셀이 떠날 때 이음새가 없도록 */
        var Gd = grid, gb = Gd.qb, gn = Gd.qn, gq; gn.fill(0);
        var gcol = colStr(FR[0] + (pal.fog[0] - FR[0]) * 0.135, FG[0] + (pal.fog[1] - FG[0]) * 0.135, FB[0] + (pal.fog[2] - FB[0]) * 0.135), gk = D / F;
        var gOffK = 1 / (0.15 * PACE), gInK = 1 / (0.35 * PACE), gPopK = 1 / (0.6 * PACE), gLeft = 0;   /* 칸마다 나누지 않게 한 번만 */
        for (var gj = 0; gj < Gd.n; gj++) {
          if (t < Gd.tw[gj]) { gLeft++; continue; }
          var goff = (t - Gd.t0[gj]) * gOffK;
          if (goff >= 1 || (Gd.own[gj] >= 0 && goff > 0)) continue;               /* 로고 픽셀은 떠나는 순간부터 큐브로 그린다 */
          gLeft++;
          var ga = Gd.al[gj] * Math.min(1, (t - Gd.tw[gj]) * gInK), gap = Math.min(1, (t - Gd.tw[gj]) * gPopK), gzz = 5 * (1 - gap) * (1 - gap);   /* 켜지며 화면 안쪽에서 살짝 앞으로 */
          if (goff > 0) ga *= 1 - goff;                                             /* 나머지 칸은 따라 모이지 않고 제자리에서 곧바로(0.15초×PACE) 꺼진다 (끌려오며 흐려지던 잔상 제거) */
          if (ga < 0.015) continue;
          var gwx = Gd.sx[gj] * S, gwy = Gd.sy[gj] * S, gwz = gzz * S, gax = gwx * cy + gwz * sy, gaz = -gwx * sy + gwz * cy, gay = gwy * cp - gaz * sp, gsc = F / (gwy * sp + gaz * cp + D), ghs = Gd.SQ * gsc * gk / 2;
          var gX = Math.round((OX + gax * gsc - ghs) * DPR) / DPR, gY = Math.round((OY + gay * gsc - ghs) * DPR) / DPR;   /* 격자는 제자리에 있으니 기기 픽셀에 맞춰 또렷하게 */
          var gi = Math.min(7, ga * 16 | 0), go = gn[gi], gbuf = gb[gi]; gbuf[go] = gX; gbuf[go + 1] = gY; gbuf[go + 2] = ghs * 2; gn[gi] = go + 3;
        }
        ctx.fillStyle = gcol;
        for (gq = 0; gq < 8; gq++) {
          var garr = gb[gq], glen = gn[gq]; if (!glen) continue;
          ctx.globalAlpha = (gq + 0.5) / 16; ctx.beginPath();
          for (var gr = 0; gr < glen; gr += 3) ctx.rect(garr[gr], garr[gr + 1], garr[gr + 2], garr[gr + 2]);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (!gLeft) grid = null;                                                  /* 다 꺼지면 바로 놓아준다 (인트로 끝까지 2만 칸을 헛돌지 않게) */
      }


      var nVis = 0, hasLive = g.live > 0.01, hasFlow = g.flow > 0.01;
      for (var i = 0; i < N; i++) {
        var b = boxes[i];
        var p = Math.max(0, Math.min(1, (t - b.t0) / b.dur));
        if (b.from && b.to) { var e = b.back ? easeInOut(p) : easeOut4(p), arc = Math.sin(Math.PI * e); b.cur.x = b.from.x + (b.to.x - b.from.x) * e + b.ax * arc; b.cur.y = b.from.y + (b.to.y - b.from.y) * e + b.ay * arc; b.cur.z = b.from.z + (b.to.z - b.from.z) * e + b.az * arc; b.m = b.mFrom + (b.mTo - b.mFrom) * e; }
        var alpha = 1, dep = 1, szf = 1, lx = 0, ly = 0, lz = 0;
        if (!introDone && b.back) {
          if (t < b.t0) continue;                                                              /* 떠나기 전엔 격자의 한 칸 (격자 층이 그린다) */
          var ep = easeInOut(p);
          alpha = b.a0 + (1 - b.a0) * ep;                                                       /* 격자 밝기 → 로고 밝기 (떠나자마자 튀지 않게 이동과 같은 곡선으로) */
          szf = b.szf0 + (1 - b.szf0) * ep;                                                     /* 격자 한 칸 크기 → 로고 픽셀 크기 */
          dep = 0.03 + 0.97 * ep;                                                               /* 납작한 화면 픽셀 → 로고 두께의 큐브 */
        }
        var sq = (t - b.tl) / (0.5 * PACE);                                                       /* 착지: 제자리에 닿는 순간 화면 쪽으로 살짝 밀려 나왔다가 자리 잡는다 */
        if (b.sa && sq > 0 && sq < 1) lz -= b.sa * Math.sin(Math.PI * sq) * (1 - sq);
        var bob = hasFlow ? Math.sin(t * 1.4 + b.fc * 0.35 + b.fr * 0.6) * 0.5 * g.flow : 0;
        b.pulse = 0;
        if (hasLive) {
          /* 살아 있는 로고: 전에는 위치에 따라 이어지는 물결(sin(gx·0.3+gy·0.18))이 로고 절반을 한 덩어리로 부풀렸다.
             이제는 픽셀마다 제 빠르기로 숨쉬고, 6–12초에 한 번 제 차례에 앞으로 톡 튀어나온다 — 로고 전체에 고르게 흩어진다 */
          var lv = g.live; lz += Math.sin(t * b.bw + b.seed * 6.283) * 0.07 * lv; lx += Math.sin(t * 0.455 + b.seed2 * 6.283) * 0.018 * lv; ly += Math.cos(t * 0.52 + b.seed * 6.283) * 0.018 * lv;
          var ph = ((t + b.po) % b.pp) / b.pp;
          if (ph < 0.1) { var bump = Math.sin(Math.PI * ph / 0.1); b.pulse = bump * bump * lv * liveK; lz -= b.pulse * 0.6; }
        }
        var px = (b.cur.x + lx) * S, py = (b.cur.y + ly) * S, pz = (b.cur.z + bob + lz) * S;
        var z1 = -px * sy + pz * cy; var z2 = py * sp + z1 * cp;
        var rc = RECS[i]; rc.z = (b.held || b.thrown) ? -1e9 : z2; rc.a = alpha; rc.px = px; rc.py = py; rc.pz = pz; rc.dep = dep; rc.szf = szf;   /* 잡은·던진 조각은 맨 위에 */
        ORDER[nVis++] = i;
      }
      var ordArr = ORDER.subarray(0, nVis); ordArr.sort(function(a, b2){ return RECS[b2].z - RECS[a].z; });
      var margin = 60, fogA = pal.fog[0], fogB = pal.fog[1], fogC = pal.fog[2], liA = pal.light[0], liB = pal.light[1], liC = pal.light[2], skA = pal.sky[0], skB = pal.sky[1], skC = pal.sky[2];
      var lastStyle = null;
      for (var k2 = 0; k2 < nVis; k2++) {
        var it = RECS[ordArr[k2]], bx = boxes[ordArr[k2]], hz = bx.h * S * it.dep, hs = HS * S * it.szf;
        var cx0 = it.px * cy + it.pz * sy, cz0 = -it.px * sy + it.pz * cy, cy0 = it.py * cp - cz0 * sp, cz1 = it.py * sp + cz0 * cp;
        var scC = F / (cz1 + D), X = OX + cx0 * scC, Y = OY + cy0 * scC, sz = hs * scC;
        if (X < -margin || X > W + margin || Y < -margin || Y > H + margin) continue;              /* 화면 밖은 그리지 않는다 */
        var m = bx.m, glow = boost[ordArr[k2]] * g.flow;
        if (m < 0.999) {
          /* 꼭짓점 8개 회전·투영 (재사용 버퍼) */
          for (var q = 0; q < 8; q++) {
            var v = CORN[q], vx = it.px + v[0] * hs, vy = it.py + v[1] * hs, vz = it.pz + v[2] * hz;
            var ax = vx * cy + vz * sy, az = -vx * sy + vz * cy, ay = vy * cp - az * sp, az2 = vy * sp + az * cp;
            var sc = F / (az2 + D); PX[q] = OX + ax * sc; PY[q] = OY + ay * sc; RX[q] = ax; RY[q] = ay; RZ[q] = az2;
          }
          /* 상자 단위 색 보정: 안개(깊이)·빛 띠·데이터 패킷·살아있는 반짝임 */
          var fog = Math.max(0, Math.min(1, (cz1 + 18) / 40)) * 0.3;
          var sd = (bx.cur.x * sweepC + bx.cur.y * sweepS) - sweepPos; var band = Math.exp(-sd * sd / 26) * 0.09; if (band < 0.01) band = 0;   /* 빛 띠는 약하게 (한쪽만 밝아 보이지 않게) */
          var flk = bx.pulse * 0.3; if (flk < 0.01) flk = 0;                                    /* 튀어나온 픽셀만 살짝 밝게 */
          ctx.globalAlpha = it.a * (1 - m);
          for (var f = 0; f < 6; f++) {
            var fv = FACES[f].v, i0 = fv[0], i1 = fv[1], i2 = fv[2], i3 = fv[3];
            var fcx = (RX[i0] + RX[i1] + RX[i2] + RX[i3]) * 0.25, fcy = (RY[i0] + RY[i1] + RY[i2] + RY[i3]) * 0.25, fcz = (RZ[i0] + RZ[i1] + RZ[i2] + RZ[i3]) * 0.25;
            if (FNX[f] * fcx + FNY[f] * fcy + FNZ[f] * (fcz + D) >= 0) continue;                    /* 뒷면 제거 */
            var r = FR[f], gg = FG[f], bb = FB[f];
            if (fog > 0) { r += (fogA - r) * fog; gg += (fogB - gg) * fog; bb += (fogC - bb) * fog; }
            if (band > 0) { r += (liA - r) * band; gg += (liB - gg) * band; bb += (liC - bb) * band; }
            if (glow > 0.02) { var gk = Math.min(0.85, glow * (f <= 1 ? 1 : 0.6)); r += (skA - r) * gk; gg += (skB - gg) * gk; bb += (skC - bb) * gk; }
            if (flk > 0) { r += (liA - r) * flk; gg += (liB - gg) * flk; bb += (liC - bb) * flk; }
            var st = colStr(r, gg, bb); if (st !== lastStyle) { ctx.fillStyle = st; lastStyle = st; }
            /* 면을 0.35px 만큼 바깥으로 넓혀 이음새를 지운다 (전에는 면마다 stroke 를 한 번 더 그렸다) */
            var mx = (PX[i0] + PX[i1] + PX[i2] + PX[i3]) * 0.25, my = (PY[i0] + PY[i1] + PY[i2] + PY[i3]) * 0.25;
            ctx.beginPath();
            for (var vq = 0; vq < 4; vq++) { var vi = fv[vq], ex = PX[vi] - mx, ey = PY[vi] - my, el = Math.max(2, Math.sqrt(ex * ex + ey * ey)), kk = 1 + 0.35 / el; if (vq) ctx.lineTo(mx + ex * kk, my + ey * kk); else ctx.moveTo(mx + ex * kk, my + ey * kk); }
            ctx.closePath(); ctx.fill();
          }
        }
        if (m > 0.001) { bx.drawK = k2; drawFragment(bx, X + (bx.ox || 0), Y + (bx.oy || 0), sz, null, it.a * m, pal); lastStyle = null; }
      }
      ctx.globalAlpha = 1;
      if (PERF) { perfLog.push(+(performance.now() - p0).toFixed(2)); if (perfLog.length > 600) perfLog.shift(); }   /* 검수용: 최근 600 프레임의 그리기 비용(ms) */
      if (!introDone && t > INTRO_T) introFinish();
      requestAnimationFrame(render);
    }
    function introFinish(){
      if (introDone) return;
      introDone = true; introAt = sceneT; revealWordmark(); document.documentElement.classList.remove('booting');
      window.removeEventListener('wheel', lockWheel); window.removeEventListener('keydown', lockKeys);   /* 이제부터 스크롤은 브라우저가 알아서 (JS 를 기다리지 않는다) */
      if (pendingHash !== null) { var ph = pendingHash; pendingHash = null; setTimeout(function(){ goTo(ph); }, 450); }   /* #c3 같은 주소로 들어와도 인트로를 본 뒤에 그 챕터로 */
    }
    if (introReduce) introFinish(); else setTimeout(introFinish, 8000);   /* 탭이 가려져 프레임이 멈춰도 8초 뒤엔 풀린다 */
    /* 인트로가 끝나기 전에는 휠·키보드·터치로 넘어갈 수 없다 */
    var lockWheel = function(e){ if (!introDone && e.cancelable) e.preventDefault(); }, lockKeys = function(e){ if (!introDone && [' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'End', 'Home'].indexOf(e.key) >= 0) e.preventDefault(); };
    window.addEventListener('wheel', lockWheel, { passive: false });
    window.addEventListener('keydown', lockKeys);
    requestAnimationFrame(render);

    function evOK(e){ var el = e.target && e.target.nodeType === 1 ? e.target : null; return !(el && el.closest && el.closest('a, button, input, textarea, select, .cards')); }
    document.addEventListener('mousedown', function(e){ if (e.button !== 0 || !evOK(e)) return; if (dragStart(e.clientX, e.clientY)) { e.preventDefault(); document.body.style.cursor = 'grabbing'; } });
    document.addEventListener('mousemove', function(e){ if (play.drag) { dragMove(e.clientX, e.clientY); return; } if (active === 2 && introDone && !TOUCH) document.body.style.cursor = codeAt(e.clientX, e.clientY) ? 'grab' : ''; });
    document.addEventListener('mouseup', function(){ if (play.drag) { dragEnd(); document.body.style.cursor = 'grab'; } });
    var playTouchMove = function(e){ if (!play.drag) return; var tt = e.touches[0]; dragMove(tt.clientX, tt.clientY); if (e.cancelable) e.preventDefault(); };
    var playTouchEnd = function(){ if (play.drag) dragEnd(); document.removeEventListener('touchmove', playTouchMove); document.removeEventListener('touchend', playTouchEnd); document.removeEventListener('touchcancel', playTouchEnd); };
    document.addEventListener('touchstart', function(e){ if (!evOK(e)) return; var tt = e.touches[0]; if (dragStart(tt.clientX, tt.clientY)) { document.addEventListener('touchmove', playTouchMove, { passive: false }); document.addEventListener('touchend', playTouchEnd, { passive: true }); document.addEventListener('touchcancel', playTouchEnd, { passive: true }); } }, { passive: true });   /* 끌 때만 non-passive 리스너 */

    /* ── 모션 (anime.js 4.5): 제목은 줄마다 마스크 안에서 밀려 올라오고, 목록의 선은 왼쪽에서 그어지고, 나머지 글은 조용히 자리를 잡는다.
       아래로 갈 땐 아래에서, 되돌아갈 땐 위에서 들어온다. 떠나는 챕터는 0.24초 만에 사라진다.
       anime.js 를 못 불러오면(차단·오프라인) 예전 CSS 전환이 그대로 쓰인다 ── */
    var AM = function(){ var A = STATIC ? null : window.anime; if (A) { document.documentElement.classList.add('am'); A.engine.speed = 1 / PACE; } return A; };   /* .am: CSS 전환을 끄고 anime.js 가 맡는다 */
    function all(root, sel){ return Array.prototype.slice.call(root.querySelectorAll(sel)); }
    function ordOf(el){ var r = el.closest('.reveal') || el; return parseFloat(r.style.getPropertyValue('--i')) || 0; }
    function motionExit(i){
      var A = AM(), sec = chapters[i]; if (!A || !sec) return;
      var r = all(sec, '.reveal'); if (!r.length) return;
      A.utils.remove(r); A.animate(r, { opacity: 0, duration: 160, ease: 'out(2)' });
      all(sec, '.kicker').forEach(function(el){ if (el.dataset.t) el.textContent = el.dataset.t; });   /* 뒤섞이던 도중에 떠나도 글자는 원래대로 */
    }
    function motionEnter(i, dir){
      var A = AM(), sec = chapters[i]; if (!A || !sec || i === 0) return;
      var R = all(sec, '.reveal'), lines = all(sec, '.reveal .ln > span'), rules = all(sec, '.set, .set li, .tools .col'), media = all(sec, '.card .media'), thumbs = all(sec, '.card .media canvas');
      var holders = R.filter(function(el){ return el.querySelector('.ln') || el.matches('.set, .tools, .set li, .card'); });
      var fades = R.filter(function(el){ return holders.indexOf(el) < 0; });
      holders.forEach(function(el){
        var kids = el.matches('.set') ? all(el, 'li > *') : el.matches('.tools') ? all(el, '.col > *') : el.matches('.set li') ? Array.prototype.slice.call(el.children) : el.matches('.card') ? all(el, ':scope > :not(.media)') : all(el, '.btn');
        fades = fades.concat(kids);
      });
      A.utils.remove(R.concat(lines, rules, media, thumbs, fades));
      if (reduce) {                                                                     /* 동작 줄이기: 움직임 없이 짧은 페이드만 */
        A.utils.set(lines.concat(fades), { y: 0 }); A.utils.set(rules, { '--rule': 1 }); A.utils.set(media, { clipPath: 'inset(0% 0% 0% 0%)' });
        A.utils.set(R, { opacity: 0 }); A.animate(R, { opacity: 1, duration: 280, delay: A.stagger(40) }); return;
      }
      var at = function(el, extra){ return ordOf(el) * 55 + (extra || 0); };   /* 스크롤에 붙어 오도록 (전 40+80·순서) */
      A.utils.set(holders, { opacity: 1, y: 0 });
      /* 제목 줄: 마스크 안에서 0.8초, 줄마다 0.07초 간격 */
      lines.forEach(function(el){
        var k = Array.prototype.indexOf.call(el.parentNode.parentNode.children, el.parentNode);
        A.utils.set(el, { y: dir > 0 ? '108%' : '-108%' });
        A.animate(el, { y: '0%', duration: 800, ease: 'out(4)', delay: at(el, 70 * k) });
      });
      /* 선: 왼쪽에서 오른쪽으로 그어진다 */
      rules.forEach(function(el){
        var k = (el.matches('.tools .col') || (el.matches('.set li') && !el.classList.contains('reveal'))) ? Array.prototype.indexOf.call(el.parentNode.children, el) + 1 : 0;
        A.utils.set(el, { '--rule': 0 });
        A.animate(el, { '--rule': 1, duration: 650, ease: 'out(3)', delay: at(el, 55 * k) });
      });
      /* 작품 이미지: 가려진 판이 걷히듯 열리고, 안쪽은 살짝 당겨졌다 풀린다 */
      media.forEach(function(el){
        A.utils.set(el, { clipPath: dir > 0 ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' });
        A.animate(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 800, ease: 'out(4)', delay: at(el) });
      });
      thumbs.forEach(function(el){ A.utils.set(el, { scale: 1.14 }); A.animate(el, { scale: 1, duration: 1100, ease: 'out(3)', delay: at(el) }); });
      /* 나머지 글: 제목보다 조금 늦게, 짧은 거리만 */
      fades.forEach(function(el){
        var li = el.closest('.set li'), k = li && !li.classList.contains('reveal') ? Array.prototype.indexOf.call(li.parentNode.children, li) : 0;
        A.utils.set(el, { opacity: 0, y: 10 * dir });
        A.animate(el, { opacity: 1, y: 0, duration: 600, ease: 'out(3)', delay: at(el, 80 + 45 * k) });
      });
      /* 라벨: 고정폭 글자가 잠깐 뒤섞였다가 제자리 (코드를 재료로 쓰는 전공이라는 표시) */
      all(sec, '.kicker').forEach(function(el){ el.dataset.t = el.dataset.t || el.textContent; A.animate(el, { innerHTML: A.scrambleText({ text: el.dataset.t, chars: 'uppercase' }), delay: at(el) }); });
    }
    function revealWordmark(){
      var A = AM(); chapters[0].classList.add('is-ready');
      if (!A || introReduce) return;
      var wl = all(chapters[0], '.wordmark .ln > span');
      A.utils.set(wl, { y: '112%' });
      A.animate(wl, { y: '0%', duration: 1200, ease: 'out(4)', delay: A.stagger(110) });
    }
    /* 헤더 메뉴 밑줄: 현재 챕터 메뉴 밑으로 스프링처럼 옮겨 간다 (00 에서는 숨김) */
    var navInd = document.querySelector('.nav-ind');
    function moveInd(i, instant){
      if (!navInd || !navInd.parentNode.offsetParent) return;
      var a = document.querySelector('.site-nav a[data-ch="' + i + '"]'), A = AM(), hidden = parseFloat(getComputedStyle(navInd).opacity) < 0.05;
      if (!A) { navInd.style.opacity = a ? 1 : 0; if (a) { navInd.style.transform = 'translateX(' + a.offsetLeft + 'px)'; navInd.style.width = a.offsetWidth + 'px'; } return; }
      A.utils.remove(navInd);
      if (a && (instant || reduce || hidden)) A.utils.set(navInd, { x: a.offsetLeft, width: a.offsetWidth });   /* 숨어 있다가 나타날 땐 제자리에서 */
      if (instant || reduce) { A.utils.set(navInd, { opacity: a ? 1 : 0 }); return; }
      A.animate(navInd, a ? { x: a.offsetLeft, width: a.offsetWidth, opacity: { to: 1, duration: 260, ease: 'out(2)' }, ease: A.spring({ bounce: 0.18, duration: 560 }) } : { opacity: 0, duration: 200, ease: 'out(2)' });
    }

    /* ── 챕터 활성화: 뷰포트 중심선이 들어 있는 챕터 ── */
    var body = document.body, links = document.querySelectorAll('[data-ch]');
    function activate(i){
      if (i === active && chapters[i].classList.contains('is-active')) return;
      if (active === 2 && i !== 2) resetPlay();                                     /* 놀이터를 떠나면 조각이 제자리로 */
      var prev = active;
      active = i;
      chapters.forEach(function(s, k){ s.classList.toggle('is-active', k === i); if (PAGED) s.inert = k !== i; });
      links.forEach(function(a){ var on = parseInt(a.getAttribute('data-ch'), 10) === i; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); if (on && a.parentNode && a.parentNode.classList.contains('subnav')) { var pn = a.parentNode; pn.scrollTo({ left: a.offsetLeft - pn.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' }); } });
      body.classList.toggle('cs-inverse', chapters[i].getAttribute('data-mode') === 'ink');
      setFormation(i, false);
      if (prev !== i) motionExit(prev);
      motionEnter(i, i >= prev ? 1 : -1);
      moveInd(i);
    }
    body.classList.add('cs-inverse'); document.documentElement.classList.remove('cs-inverse');
    chapters[0].classList.add('is-active');
    var TOUCH = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
    var PAGED = TOUCH && !ONLY;
    var ticking = false;
    function pick(){
      ticking = false;
      if (ONLY || PAGED) return;
      var mid = window.scrollY + VH() * 0.5, idx = 0;
      for (var k = 0; k < chapters.length; k++) { if (mid >= chapters[k].offsetTop) idx = k; }
      activate(idx);
    }
    window.addEventListener('scroll', function(){ if (!ticking) { ticking = true; requestAnimationFrame(pick); } }, { passive: true });

    /* ── 터치 기기: 스와이프를 감지하는 순간 다음/이전 챕터로 부드럽게 이동 (한 번에 한 챕터) ── */
    var paging = false, mainEl = document.querySelector('main');
    function goTo(i){
      i = Math.max(0, Math.min(chapters.length - 1, i));
      if (!introDone || paging || i === active) return;
      paging = true;
      if (PAGED) {
        chapters[active].scrollTop = 0;
        mainEl.style.transform = 'translateY(' + (-i * 100) + '%)';
        activate(i);
        setTimeout(function(){ paging = false; }, reduce ? 20 : 640);
        return;
      }
      var from = window.scrollY, to = chapters[i].offsetTop, t0 = performance.now(), dur = reduce ? 1 : 620, AN = AM();
      if (AN && !reduce) { var sp = { y: from }; AN.animate(sp, { y: to, duration: Math.min(950, 520 + 90 * Math.abs(i - active)), ease: 'inOut(3)', onUpdate: function(){ window.scrollTo(0, sp.y); }, onComplete: function(){ window.scrollTo(0, to); paging = false; pick(); } }); return; }
      (function step(now){
        var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        window.scrollTo(0, from + (to - from) * e);
        if (p < 1) requestAnimationFrame(step); else { window.scrollTo(0, to); paging = false; pick(); }
      })(t0);
    }
    if (PAGED) {
      document.documentElement.classList.add('touch-paging');
      window.scrollTo(0, 0);
      document.querySelectorAll('a[href^="#c"]').forEach(function(a){ a.addEventListener('click', function(e){ var n = parseInt(a.getAttribute('href').slice(2), 10); if (!isNaN(n)) { e.preventDefault(); goTo(n); } }); });
      window.addEventListener('resize', function(){ mainEl.style.transform = 'translateY(' + (-active * 100) + '%)'; });
      var ty = null, tx = null, tSkip = false, tFired = false;
      document.addEventListener('touchstart', function(e){
        var t = e.touches[0]; ty = t.clientY; tx = t.clientX; tFired = false;
        var el = e.target && e.target.nodeType === 1 ? e.target : (e.target ? e.target.parentElement : null);
        tSkip = !!(el && el.closest && el.closest('.cards, input, textarea, select'));
      }, { passive: true });
      document.addEventListener('touchmove', function(e){
        if (ty === null || tSkip || play.drag) return;
        if (!introDone) { if (e.cancelable) e.preventDefault(); return; }
        var t = e.touches[0], dy = t.clientY - ty, dx = t.clientX - tx;
        if (Math.abs(dx) > Math.abs(dy) * 1.2 && !tFired) return;                 /* 가로 제스처는 그대로 둔다 */
        var sec = chapters[active];
        if (!tFired && sec.scrollHeight > sec.clientHeight + 2) {                  /* 화면보다 긴 챕터: 안에서 먼저 스크롤, 끝에 닿으면 페이징 */
          var atTop = sec.scrollTop <= 0, atBottom = sec.scrollTop + sec.clientHeight >= sec.scrollHeight - 2;
          if ((dy < 0 && !atBottom) || (dy > 0 && !atTop)) return;
        }
        if (e.cancelable) e.preventDefault();
        if (!tFired && Math.abs(dy) > 24) { tFired = true; goTo(active + (dy < 0 ? 1 : -1)); }
      }, { passive: false });
      var tEnd = function(){ ty = null; tx = null; tFired = false; tSkip = false; };
      document.addEventListener('touchend', tEnd, { passive: true });
      document.addEventListener('touchcancel', tEnd, { passive: true });
      if (STATIC) window.__paging = { goTo: goTo };
    }
    window.addEventListener('resize', function(){ resize(); setFormation(active, false, true); pick(); moveInd(active, true); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ resize(); if (active !== 0) setFormation(active, false, true); });
    pick();
    if (/[?&]debug=1/.test(location.search)) window.__play = { play: play, boxes: boxes, codeAt: codeAt, isDone: function(){ return introDone; } };   /* 검수용 */
    if (STATIC) { window.__scene = { g: g, boxes: boxes, frameFor: frameFor, state: function(){ return { active: active, W: W, H: H, SHELL: SHELL, g: g }; } }; setTimeout(function(){ resize(); if (ONLY) { activate(parseInt(ONLY, 10)); } else { pick(); } setFormation(active, false, true); render(performance.now()); }, 400); }
  }

  /* ── 작품 카드 미디어: 잉크 위 뉴트럴 픽셀 필드 (이미지 자리표시) ── */
  document.querySelectorAll('canvas.thumb').forEach(function(cv){
    var seed = parseInt(cv.getAttribute('data-seed'), 10) || 1;
    var rnd = function(){ seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var Wc = 320, Hc = 180; cv.width = Wc * 2; cv.height = Hc * 2;
    var g2 = cv.getContext('2d'); g2.scale(2, 2);
    g2.fillStyle = '#000'; g2.fillRect(0, 0, Wc, Hc);
    var cols = 20, rows = 11, cw = Wc / cols, chh = Hc / rows;
    var ccx = 6 + rnd() * 8, ccy = 3 + rnd() * 5, rr = 3.5 + rnd() * 3, stripes = 2 + Math.floor(rnd() * 4), ang = rnd() * Math.PI;
    var pal = ['rgba(243,243,243,0.25)', 'rgba(243,243,243,0.45)', 'rgba(243,243,243,0.70)', 'rgba(243,243,243,1)'];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var dx = c + 0.5 - ccx, dy = r + 0.5 - ccy, d = Math.sqrt(dx*dx + dy*dy);
      var band = Math.sin((dx * Math.cos(ang) + dy * Math.sin(ang)) * stripes * 0.9 + d * 0.5);
      var on = d < rr ? band > -0.35 : (d < rr + 3 && band > 0.55 && rnd() > 0.35);
      if (!on) continue;
      var shade = Math.max(0, Math.min(3, Math.floor((1 - d / (rr + 3)) * 3 + rnd() * 1.2)));
      g2.fillStyle = pal[shade]; g2.fillRect(c * cw + 0.5, r * chh + 0.5, cw - 1, chh - 1);
    }
  });
})();
`;

export default function HomePage() {
  const containerRef = useRef(null);

  // 화면에 그리기 전에(useLayoutEffect) 클래스·CSS·스크립트를 건다 — 스크립트가 늦게 돌면 가운데 제목과 헤더가 한 번 보였다 사라진다
  useLayoutEffect(() => {
    // 1. Add html classes
    document.documentElement.classList.add('cs-inverse', 'booting');
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('booting');
    }, 7000);

    // 2. Inject CSS
    const styleEl = document.createElement('style');
    styleEl.id = 'home-page-style';
    styleEl.textContent = HOME_CSS;
    document.head.appendChild(styleEl);

    // 3. Run script (anime.js 는 위에서 같이 묶었다)
    window.anime = ANIME;
    const inlineEl = document.createElement('script');
    inlineEl.textContent = HOME_SCRIPT;
    document.body.appendChild(inlineEl);

    return () => {
      clearTimeout(timer);
      document.documentElement.classList.remove('cs-inverse', 'booting', 'js', 'touch-paging');
      styleEl.remove();
      inlineEl.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="home-vanilla-wrapper"
      dangerouslySetInnerHTML={{ __html: HOME_MARKUP }}
    />
  );
}
