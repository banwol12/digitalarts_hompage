import EN from './i18n-en.js';

/* 한국 IP → 한국어, 그 밖 → 영어 (사용자 2026-10-12). 나라는 index.html 머리의 window.__lang (/api/geo, 안 되면 브라우저 언어).
   한국어 문장 자체를 열쇠로 영어 사전(i18n-en.js)에서 찾아 글자 노드와 몇몇 속성을 바꾼다 — 나중에 그려지는 글(작품 카드·안내 문구)은 MutationObserver 로.
   사전에 없는 문장은 한국어 그대로 남는다. 헤더의 [data-lang-toggle] 로 직접 바꾸면 그 선택을 기억하고, 원문을 되돌려 놓는다 */
const HANGUL = /[가-힣]/, ATTRS = ['alt', 'title', 'placeholder', 'aria-label', 'content'];
const orig = new Map();                                                  /* 바꾼 노드 → 원문 (글자 노드는 문자열, 요소는 {속성: 원문}) */
let lang = 'ko', obs = null;

export function translate(s) {
  const t = s.trim();
  if (!t || !HANGUL.test(t)) return null;
  let en = EN.text[t];
  if (en === undefined) { let v = t; for (const [re, rep] of EN.patterns) v = v.replace(re, rep); if (v !== t) en = v; }
  return en === undefined ? null : s.replace(t, () => en);
}
function textNode(n) {
  const p = n.parentNode;
  if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE' || p.nodeName === 'TEXTAREA') return;
  const v = translate(n.nodeValue);
  if (v !== null) { orig.set(n, n.nodeValue); n.nodeValue = v; }
}
function attrs(el) {
  for (const a of ATTRS) {
    const v0 = el.getAttribute(a), v = v0 && translate(v0);
    if (v) { const o = orig.get(el) || {}; o[a] = v0; orig.set(el, o); el.setAttribute(a, v); }
  }
}
function walk(root) {
  if (root.nodeType === 3) return textNode(root);
  if (root.nodeType !== 1) return;
  attrs(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) n.nodeType === 3 ? textNode(n) : attrs(n);
}
function setLang(l, remember) {
  if (remember) try { localStorage.setItem('lang', l); } catch (e) { /* 저장이 막혀도 이번 화면은 바뀐다 */ }
  lang = l;
  document.documentElement.lang = l;
  if (l === 'en') {
    walk(document.documentElement);
    obs = obs || new MutationObserver((ms) => { for (const m of ms) m.type === 'characterData' ? textNode(m.target) : m.type === 'attributes' ? attrs(m.target) : m.addedNodes.forEach(walk); });
    obs.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  } else {
    if (obs) obs.disconnect();
    orig.forEach((o, n) => { if (n.nodeType === 3) n.nodeValue = o; else for (const a in o) n.setAttribute(a, o[a]); });
    orig.clear();
  }
}

export function initLang() {
  const st = document.createElement('style');
  st.textContent = '.lang-tg{all:unset;cursor:pointer;font:inherit;font-size:11px;font-weight:500;letter-spacing:.12em;padding:6px 8px;opacity:.75;transition:opacity .2s}.lang-tg:hover,.lang-tg:focus-visible{opacity:1}.lang-tg:focus-visible{outline:1px solid currentColor;outline-offset:2px}'
    + '.lang-tg::after{content:"EN"}html[lang="en"] .lang-tg::after{content:"KO"}';   /* 지금과 다른 언어 이름을 보여 준다 */
  document.head.appendChild(st);
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-lang-toggle]');
    if (!b) return;
    setLang(lang === 'en' ? 'ko' : 'en', true);
    window.dispatchEvent(new Event('resize'));                          /* 글 길이가 바뀌었으니 자리를 다시 잰다 (홈 로고 배치) */
  });
  (window.__lang || Promise.resolve('ko')).then((l) => { if (l === 'en') setLang('en'); });
}
