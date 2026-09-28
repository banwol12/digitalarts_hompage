import { animate, stagger, spring, scrambleText, utils, engine } from 'animejs';

// 정적 판 스크립트(홈·포트폴리오)가 전역 anime 로 쓰는 함수들 — CDN 대신 사이트에 같이 묶는다 (CDN 을 기다리지 않고, 못 받아도 인트로·챕터가 멈추지 않게).
// 스크립트에서 anime 의 다른 함수를 새로 쓰면 여기에도 더한다
const ANIME = { animate, stagger, spring, scrambleText, utils, engine };

export function installAnime() {
  window.anime = ANIME;
}
