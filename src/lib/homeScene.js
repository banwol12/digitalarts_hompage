/* 메인 홈 3D 씬 (three.js) — 로고 픽셀 530칸을 각각 작은 픽셀 큐브 여러 개로 채운다.
   · 첫 입장: 어둠 속 로고(불꽃 모양) 안에서 불이 붙어 타오르고, 은빛 띠가 대각선으로 쓸고 지나가며 불이 꺼진 자리부터
     은빛으로 반짝이는 픽셀 큐브가 되었다가 로고 색으로 식는다. 불 색은 Spectral.js(물감 혼합 Kubelka-Munk) 그러데이션.
     챕터가 바뀌면 큐브가 GPU 에서 힘으로 새 자리로 날아간다 (날 때만 기운다).
   · 살아 있는 로고: 칸 단위로 아주 느리게 오르내리는 부드러운 물결 (home.js — 이웃 칸이 함께 움직여 툭 튀지 않는다).
   · 색: 빛을 정면으로 받는 앞면 = 로고 파일 색 #A0A0A0 그대로. 그늘·옆면만 밝기가 달라진다.
   · 빛: 천천히 도는 키 라이트 + 하늘·바닥 반사광. 그림자는 빛에서 본 깊이 지도에서
     가리는 큐브를 찾아 거리만큼 번지게 하는 PCSS — 가까우면 또렷하고 멀면 퍼진다.
   · 배경은 페이지 색 그대로(잉크 = 검정). 페이퍼 챕터에서만 로고 뒤 투명한 벽에 그림자가 남는다.
   · 좌표는 home.js 의 옛 투영(카메라 거리 D, 초점 F px, 화면 중심 cx·cy)과 똑같이 맞춰 frameFor 배치를 그대로 쓴다.
     옛 좌표는 y 아래·z 화면 안쪽, three 는 y 위·z 화면 바깥 → (x, -y, -z) */
import {
  WebGLRenderer, Scene, PerspectiveCamera, OrthographicCamera, BoxGeometry, InstancedBufferGeometry,
  InstancedBufferAttribute, Mesh, PlaneGeometry, ShaderMaterial, WebGLRenderTarget, DepthTexture, UnsignedIntType,
  DataTexture, RGBAFormat, FloatType, HalfFloatType, NearestFilter, LinearFilter, Vector2, Vector3, Matrix4, Euler
} from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import * as spectral from 'spectral.js/spectral.js';

const NOISE = /* glsl */`
vec4 permute(vec4 x){ return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy)), x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz), l = 1.0 - g, i1 = min(g.xyz, l.zxy), i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx, x2 = x0 - i2 + C.yyy, x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  vec3 ns = 0.142857142857 * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z), x_ = floor(j * ns.z), y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy, y = y_ * ns.x + ns.yyyy, h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy), b1 = vec4(x.zw, y.zw), s0 = floor(b0) * 2.0 + 1.0, s1 = floor(b1) * 2.0 + 1.0, sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy, a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x), p1 = vec3(a0.zw, h.y), p2 = vec3(a1.xy, h.z), p3 = vec3(a1.zw, h.w);
  vec4 nr = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= nr.x; p1 *= nr.y; p2 *= nr.z; p3 *= nr.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0); m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
vec3 snoise3(vec3 x){ return vec3(snoise(x), snoise(vec3(x.y - 19.1, x.z + 33.4, x.x + 47.2)), snoise(vec3(x.z + 74.2, x.x - 124.5, x.y + 99.4))); }
vec3 curl(vec3 p){
  const float e = 0.1; vec3 dx = vec3(e, 0.0, 0.0), dy = vec3(0.0, e, 0.0), dz = vec3(0.0, 0.0, e);
  vec3 x0 = snoise3(p - dx), x1 = snoise3(p + dx), y0 = snoise3(p - dy), y1 = snoise3(p + dy), z0 = snoise3(p - dz), z1 = snoise3(p + dz);
  vec3 c = vec3(y1.z - y0.z - z1.y + z0.y, z1.x - z0.x - x1.z + x0.z, x1.y - x0.y - y1.x + y0.x);
  return c * inversesqrt(dot(c, c) + 1e-4);
}`;

/* 목표: A(이전 자리, w = 첫 입장 때 붙잡히기 시작하는 시각) → B(새 자리, w = 바꾸는 시각). 큐브마다 바꾸는 시각이 달라 물결처럼 옮겨 간다 */
const VEL = /* glsl */`
uniform float uTime, uDt, uSnap, uRamp;
uniform sampler2D tA, tB;
${NOISE}
void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  if (uSnap > 0.5) { gl_FragColor = vec4(0.0); return; }
  vec4 P = texture2D(texturePosition, uv), V = texture2D(textureVelocity, uv), A = texture2D(tA, uv), B = texture2D(tB, uv);
  vec3 T = uTime < B.w ? A.xyz : B.xyz, p = P.xyz, v = V.xyz, d = T - p;
  float hold = smoothstep(A.w, A.w + uRamp, uTime);                                    /* 붙잡히기 전엔 제자리 (화면 격자) */
  float swirl = min(1.0, length(d) * 0.1) * hold;                                     /* 날아가는 동안만 살짝 소용돌이 */
  vec3 desired = d * 7.5 * hold;
  float dl = length(desired); if (dl > 55.0) desired *= 55.0 / dl;
  if (swirl > 0.01) desired += curl(p * 0.05 + vec3(0.0, 0.0, uTime * 0.1)) * 2.5 * swirl;
  gl_FragColor = vec4(v + (desired - v) * (1.8 + 12.0 * hold) * uDt, 0.0);
}`;

const POS = /* glsl */`
uniform float uTime, uDt, uSnap, uRamp;
uniform sampler2D tA, tB;
void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 P = texture2D(texturePosition, uv), V = texture2D(textureVelocity, uv), A = texture2D(tA, uv), B = texture2D(tB, uv);
  if (uSnap > 0.5) { gl_FragColor = vec4(uTime < B.w ? A.xyz : B.xyz, 1.0); return; }
  gl_FragColor = vec4(P.xyz + V.xyz * uDt, smoothstep(A.w, A.w + uRamp, uTime));      /* w: 붙잡힌 정도 */
}`;

/* 빛·그림자 공용 */
const LIGHT = /* glsl */`
uniform sampler2D tShadow;
uniform mat4 uLVP;
uniform float uLRange, uSoft, uShadowW, uTexel, uLI, uPoolR, uMode;
uniform vec3 uL, uLCol;
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
vec2 vogel(int i, int n, float phi){ float r = sqrt((float(i) + 0.5) / float(n)), t = float(i) * 2.39996323 + phi; return r * vec2(cos(t), sin(t)); }
float pcss(vec3 pW, float bias){
  vec3 sc = (uLVP * vec4(pW, 1.0)).xyz * 0.5 + 0.5;
  if (sc.x < 0.0 || sc.x > 1.0 || sc.y < 0.0 || sc.y > 1.0 || sc.z > 1.0) return 1.0;
  float dr = sc.z - bias / uLRange, phi = ign(gl_FragCoord.xy) * 6.2831853, sr = uSoft * 9.0 / uShadowW, sum = 0.0, cnt = 0.0;
  for (int i = 0; i < NB; i++) { float d = texture2D(tShadow, sc.xy + vogel(i, NB, phi) * sr).r; if (d < dr) { sum += d; cnt += 1.0; } }
  if (cnt < 0.5) return 1.0;
  float pen = clamp((dr - sum / cnt) * uLRange * uSoft / uShadowW, uTexel * 1.5, sr), lit = 0.0;
  for (int i = 0; i < NP; i++) lit += step(dr, texture2D(tShadow, sc.xy + vogel(i, NP, phi + 1.7) * pen).r);
  return lit / float(NP);
}
float spot(vec3 pW){ vec3 a = pW - uL * dot(pW, uL); return exp(-dot(a, a) / (uPoolR * uPoolR)); }
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 outColor(vec3 c){ return pow(aces(c * 1.1), vec3(1.0 / 2.2)) + (ign(gl_FragCoord.xy + 17.0) - 0.5) / 255.0; }`;

/* 큐브 하나 = 픽셀 하나. 위치는 시뮬레이션, 칸 단위 움직임(숨쉬기·튀어나옴·물결·빛)은 칸 텍스처에서 */
const CUBE_VS = /* glsl */`
uniform sampler2D tPos, tVel, tCell;
uniform mat4 uModel;
uniform float uScale, uTime, uFront, uBand;
uniform vec2 uDir;
attribute vec4 aRef;   /* xy 시뮬레이션 uv · z 칸 u · w 깊이 AO */
attribute vec4 aSize;  /* xyz 큐브 크기 · w 무작위 */
attribute float aAppear;  /* 첫 입장: 은빛 띠가 지나가며 픽셀로 솟는 시각 */
varying vec3 vN, vW, vBox;
varying float vAo, vGlow, vSeed, vBandL, vRise, vSilver;
mat3 rotAxis(vec3 a, float t){ float c = cos(t), s = sin(t), o = 1.0 - c;
  return mat3(c + a.x * a.x * o, a.y * a.x * o + a.z * s, a.z * a.x * o - a.y * s, a.x * a.y * o - a.z * s, c + a.y * a.y * o, a.z * a.y * o + a.x * s, a.x * a.z * o + a.y * s, a.y * a.z * o - a.x * s, c + a.z * a.z * o); }
void main(){
  vec4 P = texture2D(tPos, aRef.xy), V = texture2D(tVel, aRef.xy);
  vec4 C0 = texture2D(tCell, vec2(aRef.z, 0.25)), C1 = texture2D(tCell, vec2(aRef.z, 0.75));
  float s = aSize.w, tilt = clamp(length(V.xyz) * 0.04, 0.0, 1.0);                    /* 나는 동안만 기울고, 멈추면 반듯하게 */
  float u = clamp((uTime - aAppear) / 0.6, 0.0, 1.0), e = 1.0 - (1.0 - u) * (1.0 - u) * (1.0 - u), lit = step(aAppear, uTime);   /* 화면 면에서 납작하게 시작해 부드럽게 솟는다 */
  vec3 ax = normalize(vec3(fract(s * 7.13), fract(s * 3.37), fract(s * 5.71)) - 0.5 + 1e-3);
  mat3 R = rotAxis(ax, tilt * ((s - 0.5) * 5.0 + sin(uTime * (1.5 + s * 2.5) + s * 40.0) * 1.2));
  vec3 grow = vec3(mix(0.8, 1.0, e), mix(0.8, 1.0, e), mix(0.04, 1.0, e)) * lit;
  vec3 local = R * (position * aSize.xyz * grow * (1.0 - C1.x));                       /* C1.x: 02 챕터에서 코드 조각으로 바뀌며 사라짐 */
  vec4 w = uModel * vec4((vec3(P.xy, P.z * e) + C0.xyz + local) * uScale, 1.0);
  vW = w.xyz; vN = mat3(uModel) * (R * normal); vBox = position;
  vAo = aRef.w; vGlow = C0.w; vSeed = s; vRise = smoothstep(0.0, 0.4, u) * lit;
  vSilver = lit * (1.0 - smoothstep(aAppear + 0.15, aAppear + 0.9, uTime));            /* 막 픽셀이 된 순간은 은빛, 곧 로고 색으로 식는다 */
  float dd = (dot(P.xy, uDir) - uFront) / 1.6; vBandL = uBand * exp(-dd * dd);        /* 은빛 띠 바로 위 픽셀은 번쩍 */
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const CUBE_FS = /* glsl */`
uniform vec3 uAlb, uKey;
uniform float uFlat, uNOff, uBias, uRef, uAmb;
varying vec3 vN, vW, vBox;
varying float vAo, vGlow, vSeed, vBandL, vRise, vSilver;
${LIGHT}
void main(){
  vec3 n = normalize(vN);
  vec3 q = abs(vBox) * 2.0;                                                             /* 픽셀 테두리: 아주 옅게 */
  float e2 = q.x + q.y + q.z - max(q.x, max(q.y, q.z)) - min(q.x, min(q.y, q.z));
  float edge = smoothstep(0.8, 1.0, e2);
  float sh = pcss(vW + n * uNOff, uBias), ndl = max(dot(n, uL), 0.0);
  float hemi = uAmb * (0.6 + 0.4 * (n.y * 0.5 + 0.5)) * vAo;
  float shade = (uLI * ndl * sh * spot(vW) + hemi) / uRef * vRise;                       /* 빛을 정면으로 받는 앞면 = 1 → 로고 파일 색 그대로 */
  vec3 V = normalize(cameraPosition - vW), H = normalize(uL + V);
  float spec = pow(max(dot(n, H), 0.0), 80.0) * 0.08 * ndl * sh;
  vec3 col = uAlb * uLCol * shade * (0.98 + 0.04 * fract(vSeed * 13.71)) * (1.0 - 0.08 * edge) + spec * uLCol;
  col = mix(col, uKey * (1.0 + 0.4 * ndl), clamp(vGlow, 0.0, 0.85));                    /* 03 챕터 데이터 패킷 */
  float met = pow(max(dot(n, H), 0.0), 18.0);                                            /* 은빛: 차가운 금속 반사 + 띠의 번쩍임 */
  col = mix(col, vec3(0.62, 0.66, 0.72) * (0.5 + 1.8 * met * sh) * vRise + vec3(1.0) * vBandL * 1.4, clamp(vSilver * 0.9 + vBandL, 0.0, 1.0));
  vec3 c = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2)) + (ign(gl_FragCoord.xy + 17.0) - 0.5) / 255.0;
  gl_FragColor = vec4(mix(c, vec3(0.627), uFlat), 1.0);                                  /* 01 챕터: 모든 면을 로고 색 하나로 */
}`;

/* 첫 입장 불: 로고 면 바로 앞의 판 하나. 로고 모양(마스크)을 위로 번지게 늘려 불꽃 혀가 넘실대고,
   위로 흐르는 난류(도메인 워프 fbm)로 타오른다. 온도 → 색은 Spectral.js 로 만든 그러데이션 텍스처 */
const FIRE_VS = /* glsl */`
uniform mat4 uModel;
uniform float uScale;
varying vec2 vP;
void main(){
  vP = position.xy + vec2(0.0, 3.5);
  gl_Position = projectionMatrix * viewMatrix * uModel * vec4(vec3(vP, 2.4) * uScale, 1.0);
}`;

const FIRE_FS = /* glsl */`
uniform sampler2D tMask, tLut;
uniform float uTime, uIgnite, uFire, uBandD, uGlint;
uniform vec2 uDir;
varying vec2 vP;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + 1.0), f.x), f.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
float mask(vec2 p){ vec2 uv = vec2((p.x + 17.0) / 32.0, (17.0 - p.y) / 34.0); return any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0))) ? 0.0 : texture2D(tMask, uv).r; }   /* 밖은 0 (가장자리 값이 번지지 않게) */
void main(){
  vec2 p = vP; float t = uTime;
  vec2 q = vec2(p.x * 0.17, p.y * 0.11 - t * 1.7);
  float w = fbm(q * 1.6 + vec2(0.0, -t * 0.8));
  float n = fbm(q + vec2(w * 1.3, w * 0.7));                                             /* 위로 흐르며 휘감기는 불꽃 결 */
  vec2 pw = p + vec2((w - 0.5) * 2.4, 0.0);
  float body = mask(pw);
  float up = max(mask(pw - vec2(0.0, 1.7)) * 0.9, mask(pw - vec2((n - 0.5) * 2.4, 3.6)) * 0.65);
  up = max(up, mask(pw - vec2((w - 0.5) * 3.0, 6.0)) * 0.4);                              /* 로고 위로 넘실대는 불꽃 혀 */
  float shape = max(body, up * smoothstep(0.38, 0.78, n));
  float ign = smoothstep(uIgnite + 1.5, uIgnite - 3.0, p.y + (n - 0.5) * 7.0);          /* 아래에서 붙어 위로 번진다 (경계도 불길처럼 들쭉날쭉) */
  float d = dot(p, uDir), alive = smoothstep(uBandD - 0.3, uBandD + 1.4, d);              /* 은빛 띠가 지나간 자리는 꺼진다 */
  float T = clamp((shape * (0.3 + 0.8 * n) * 1.1 - 0.12) * ign * alive * uFire, 0.0, 1.0);   /* 하얀 백열은 가장 뜨거운 곳에만 */
  vec3 col = texture2D(tLut, vec2(T, 0.5)).rgb * smoothstep(0.03, 0.2, T);
  float glow = 0.0;                                                                       /* 불 둘레로 번지는 주황 빛 */
  for (int i = 0; i < 8; i++) { float a = float(i) * 0.785; glow += mask(p + vec2(cos(a), sin(a) * 1.3) * 2.6) + mask(p + vec2(cos(a + 0.4), sin(a + 0.4) * 1.3) * 5.0) * 0.6; }
  col += vec3(0.55, 0.13, 0.02) * glow / 12.8 * ign * alive * uFire * (0.7 + 0.3 * n);
  float gl = exp(-pow((d - uBandD) / 0.5, 2.0)) * clamp(body * 1.4 + up * 0.4, 0.0, 1.0) * uGlint;   /* 은빛 띠 */
  col += vec3(0.88, 0.92, 1.0) * gl * 1.5;
  float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
  gl_FragColor = vec4(min(col, vec3(1.0)), a);                                            /* premultiplied */
}`;

const WALL_VS = /* glsl */`
uniform mat4 uModel;
uniform float uScale, uWallZ;
varying vec3 vW, vN;
void main(){
  vec4 w = uModel * vec4(vec3(position.xy, uWallZ) * uScale, 1.0);
  vW = w.xyz; vN = mat3(uModel) * vec3(0.0, 0.0, 1.0);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

/* 벽: 페이퍼 챕터에서만 그림자를 남기는 투명한 벽 (잉크 챕터는 검정 그대로) — premultiplied */
const WALL_FS = /* glsl */`
uniform float uFlat, uBiasW;
varying vec3 vW, vN;
${LIGHT}
void main(){
  float a = (1.0 - pcss(vW, uBiasW)) * 0.3 * (1.0 - 0.5 * uFlat) * (1.0 - uMode);
  if (a < 0.002) discard;
  gl_FragColor = vec4(0.0, 0.0, 0.0, a);
}`;

const DEPTH_VS = /* glsl */`
uniform sampler2D tPos, tVel, tCell;
uniform mat4 uModel;
uniform float uScale, uTime;
attribute vec4 aRef;
attribute vec4 aSize;
attribute float aAppear;
void main(){
  vec4 P = texture2D(tPos, aRef.xy), C0 = texture2D(tCell, vec2(aRef.z, 0.25)), C1 = texture2D(tCell, vec2(aRef.z, 0.75));
  float u = clamp((uTime - aAppear) / 0.6, 0.0, 1.0), e = 1.0 - (1.0 - u) * (1.0 - u) * (1.0 - u);
  vec3 grow = vec3(mix(0.8, 1.0, e), mix(0.8, 1.0, e), mix(0.04, 1.0, e)) * step(aAppear, uTime);
  gl_Position = projectionMatrix * viewMatrix * uModel * vec4((vec3(P.xy, P.z * e) + C0.xyz + position * aSize.xyz * grow * (1.0 - C1.x)) * uScale, 1.0);
}`;

function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export function createHomeScene({ canvas, cells, small }){
  const rand = rng(11), N = cells.length, M = small ? 3 : 4;   /* 한 칸 = M×M 픽셀 (폰은 3×3) */

  /* ── 칸마다 껍데기 큐브(앞면 + 네 옆면). 뒤는 보이지 않아 뺀다 ── */
  const grains = [];
  cells.forEach((c, k) => {
    const nz = Math.max(2, Math.round(2 * c.h * M)), dz = 2 * c.h / nz;
    for (let iz = 0; iz < nz; iz++) for (let iy = 0; iy < M; iy++) for (let ix = 0; ix < M; ix++) {
      if (iz > 0 && ix > 0 && iy > 0 && ix < M - 1 && iy < M - 1) continue;
      grains.push([k, (ix + 0.5) / M - 0.5, -((iy + 0.5) / M - 0.5), c.h - (iz + 0.5) * dz, dz, 1 - 0.55 * iz / nz]);
    }
  });
  const n = grains.length, SX = 256, SY = Math.ceil(n / SX), SM = small ? 1024 : 2048;

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  const gpu = new GPUComputationRenderer(SX, SY, renderer);
  if (!renderer.extensions.has('EXT_color_buffer_float')) gpu.setDataType(HalfFloatType);

  const local = new Float32Array(n * 3), cellOf = new Uint16Array(n);
  const aRef = new Float32Array(n * 4), aSize = new Float32Array(n * 4);
  grains.forEach((g, i) => {
    cellOf[i] = g[0]; local[i * 3] = g[1]; local[i * 3 + 1] = g[2]; local[i * 3 + 2] = g[3];
    aRef[i * 4] = (i % SX + 0.5) / SX; aRef[i * 4 + 1] = (Math.floor(i / SX) + 0.5) / SY; aRef[i * 4 + 2] = (g[0] + 0.5) / N; aRef[i * 4 + 3] = g[5];
    aSize[i * 4] = aSize[i * 4 + 1] = 1 / M; aSize[i * 4 + 2] = g[4]; aSize[i * 4 + 3] = rand();
  });
  const tex = (data) => { const t = new DataTexture(data, SX, SY, RGBAFormat, FloatType); t.minFilter = t.magFilter = NearestFilter; t.needsUpdate = true; return t; };
  const aData = new Float32Array(SX * SY * 4), bData = new Float32Array(SX * SY * 4);
  const tA = tex(aData), tB = tex(bData);
  const pos0 = gpu.createTexture(), vel0 = gpu.createTexture();
  const velVar = gpu.addVariable('textureVelocity', VEL, vel0), posVar = gpu.addVariable('texturePosition', POS, pos0);
  gpu.setVariableDependencies(velVar, [velVar, posVar]); gpu.setVariableDependencies(posVar, [velVar, posVar]);
  const simU = { uTime: { value: 0 }, uDt: { value: 1 / 60 }, uSnap: { value: 1 }, uRamp: { value: 0.45 }, tA: { value: tA }, tB: { value: tB } };
  Object.assign(velVar.material.uniforms, simU);
  Object.assign(posVar.material.uniforms, simU);
  const err = gpu.init();
  if (err) { renderer.dispose(); throw new Error(err); }

  /* 칸 텍스처: 0행 = 움직임(xyz)·빛 패킷, 1행 = 사라짐·반짝임 */
  const cellData = new Float32Array(N * 2 * 4), tCell = new DataTexture(cellData, N, 2, RGBAFormat, FloatType);
  tCell.minFilter = tCell.magFilter = NearestFilter; tCell.needsUpdate = true;

  const shadowRT = new WebGLRenderTarget(SM, SM, { depthTexture: new DepthTexture(SM, SM, UnsignedIntType) });
  const lightCam = new OrthographicCamera(-40, 40, 40, -40, 1, 200);
  const L = new Vector3(-0.42, 0.62, 0.66).normalize(), Lt = new Vector3(), DIR = new Vector2(0.53, 0.85);   /* DIR: 은빛 띠가 쓸고 가는 방향 (왼쪽 아래 → 오른쪽 위) */
  const model = new Matrix4(), euler = new Euler(0, 0, 0, 'XYZ');
  const posTex = { value: null }, velTex = { value: null };
  const common = {
    tShadow: { value: shadowRT.depthTexture }, uLVP: { value: new Matrix4() }, uLRange: { value: 160 }, uSoft: { value: 0.09 }, uShadowW: { value: 80 },
    uTexel: { value: 1 / SM }, uLI: { value: 2.6 }, uPoolR: { value: 30 }, uMode: { value: 1 }, uL: { value: L }, uLCol: { value: new Vector3(1.0, 0.96, 0.9) },
    uModel: { value: model }, uScale: { value: 1 }, uTime: { value: 0 }, uFlat: { value: 0 }
  };

  const box = new BoxGeometry(1, 1, 1), geo = new InstancedBufferGeometry();
  geo.index = box.index; geo.setAttribute('position', box.getAttribute('position')); geo.setAttribute('normal', box.getAttribute('normal'));
  const appear = new InstancedBufferAttribute(new Float32Array(n).fill(-10), 1);
  geo.setAttribute('aRef', new InstancedBufferAttribute(aRef, 4)); geo.setAttribute('aSize', new InstancedBufferAttribute(aSize, 4)); geo.setAttribute('aAppear', appear);
  geo.instanceCount = n;
  const cubeMat = new ShaderMaterial({
    vertexShader: CUBE_VS, fragmentShader: CUBE_FS, defines: { NB: 8, NP: 12 },
    uniforms: { ...common, tPos: posTex, tVel: velTex, tCell: { value: tCell }, uNOff: { value: 0.1 }, uBias: { value: 0.03 }, uFront: { value: -1e3 }, uBand: { value: 0 }, uDir: { value: DIR },
      uAlb: { value: new Vector3(0.3567, 0.3567, 0.3567) }, uRef: { value: 2 }, uAmb: { value: 0.35 },   /* uAlb = #A0A0A0 (선형) */
      uKey: { value: new Vector3(0.905, 1.0, 0.087) } }
  });
  const cubes = new Mesh(geo, cubeMat); cubes.frustumCulled = false;
  const wallMat = new ShaderMaterial({
    vertexShader: WALL_VS, fragmentShader: WALL_FS, defines: { NB: 12, NP: 20 }, transparent: true, premultipliedAlpha: true, depthWrite: false,
    uniforms: { ...common, uWallZ: { value: -5.5 }, uBiasW: { value: 0.05 } }
  });
  const wall = new Mesh(new PlaneGeometry(600, 400), wallMat); wall.frustumCulled = false; wall.renderOrder = -1;
  /* 입장 불: 로고 마스크(32×34) + Spectral.js 불 그러데이션 (검붉음 → 주황 → 노랑 → 백열) */
  const mk = new Uint8Array(32 * 34 * 4);
  cells.forEach(c => { const o = ((c.gy + 16.5) * 32 + (c.gx + 16.5)) * 4; mk[o] = mk[o + 1] = mk[o + 2] = mk[o + 3] = 255; });
  const tMask = new DataTexture(mk, 32, 34, RGBAFormat); tMask.minFilter = tMask.magFilter = LinearFilter; tMask.needsUpdate = true;
  const SC = h => new spectral.Color(h), STOPS = [[SC('#050000'), 0], [SC('#7a0c02'), 0.22], [SC('#e3420a'), 0.45], [SC('#ff9a1c'), 0.62], [SC('#ffd84a'), 0.8], [SC('#fff6dc'), 1]];
  const lut = new Uint8Array(256 * 4);
  for (let i = 0; i < 256; i++) { const hx = spectral.gradient(i / 255, ...STOPS).toString(); lut[i * 4] = parseInt(hx.slice(1, 3), 16); lut[i * 4 + 1] = parseInt(hx.slice(3, 5), 16); lut[i * 4 + 2] = parseInt(hx.slice(5, 7), 16); lut[i * 4 + 3] = 255; }
  const tLut = new DataTexture(lut, 256, 1, RGBAFormat); tLut.minFilter = tLut.magFilter = LinearFilter; tLut.needsUpdate = true;
  const fireMat = new ShaderMaterial({ vertexShader: FIRE_VS, fragmentShader: FIRE_FS, transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false,
    uniforms: { uModel: common.uModel, uScale: common.uScale, uTime: common.uTime, tMask: { value: tMask }, tLut: { value: tLut }, uIgnite: { value: -99 }, uFire: { value: 0 }, uBandD: { value: -99 }, uGlint: { value: 0 }, uDir: { value: DIR } } });
  const fire = new Mesh(new PlaneGeometry(44, 50), fireMat); fire.frustumCulled = false; fire.renderOrder = 5; fire.visible = false;
  const IGN = 0.12, BURN = 0.85, FLASH = 1.25, PASS = 0.5, NEUTRAL = new Vector3(1, 1, 1);   /* 불 붙음 → 다 번짐 → 은빛 띠 출발 → 띠가 지나가는 시간 (초) */
  let introS = null;
  const scene = new Scene(); scene.add(wall, cubes, fire);
  const depthMat = new ShaderMaterial({ vertexShader: DEPTH_VS, fragmentShader: 'void main(){ gl_FragColor = vec4(1.0); }', colorWrite: false,
    uniforms: { tPos: posTex, tVel: velTex, tCell: { value: tCell }, uModel: common.uModel, uScale: common.uScale, uTime: common.uTime } });
  const shadowCubes = new Mesh(geo, depthMat); shadowCubes.frustumCulled = false;
  const shadowScene = new Scene(); shadowScene.add(shadowCubes);

  const camera = new PerspectiveCamera(30, 1, 1, 600);
  let W = 1, H = 1, radius = 24, simUntil = 0, snapNext = true;

  /* 칸 목표 → 큐브 목표 (옛 좌표 → three 좌표) */
  const cellPos = new Float32Array(N * 3), cellDelay = new Float32Array(N);
  function writeTargets(dst, wOf){
    let r = 0;
    for (let i = 0; i < n; i++) {
      const k = cellOf[i], x = cellPos[k * 3] + local[i * 3], y = -cellPos[k * 3 + 1] + local[i * 3 + 1], z = -cellPos[k * 3 + 2] + local[i * 3 + 2];
      dst[i * 4] = x; dst[i * 4 + 1] = y; dst[i * 4 + 2] = z; dst[i * 4 + 3] = wOf(i, k);
      const d = x * x + y * y; if (d > r) r = d;
    }
    radius = Math.sqrt(r) + 2;
  }


  return {
    grains: n,
    resize(w, h, dpr){ W = w; H = h; renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); },
    /* 챕터 전환: pos = 칸 목표(옛 좌표, N×3), delay = 칸마다 출발 지연(초). snap = 날지 않고 바로 */
    setTargets(pos, delay, t, snap){
      for (let i = 0; i < n; i++) { aData[i * 4] = bData[i * 4]; aData[i * 4 + 1] = bData[i * 4 + 1]; aData[i * 4 + 2] = bData[i * 4 + 2]; }   /* A.w(첫 입장에 붙잡힌 시각)는 그대로 */
      cellPos.set(pos); cellDelay.set(delay);
      writeTargets(bData, (i, k) => t + cellDelay[k] + (snap ? -1 : aSize[i * 4 + 3] * 0.06));
      if (snap) { for (let i = 0; i < n; i++) aData[i * 4 + 3] = bData[i * 4 + 3] = -1e9; snapNext = true; }
      tA.needsUpdate = tB.needsUpdate = true;
      simUntil = Math.max(simUntil, t + Math.max(...delay) + 2.5);
    },
    /* 첫 입장: 불이 아래에서 붙어 로고 전체로 타오른 뒤, 은빛 띠가 대각선으로 쓸고 가며 지나간 자리부터 픽셀 큐브로 솟는다.
       큐브는 이미 제자리 (setTargets snap) — 솟는 시각만 정한다. 반환: land = 제목·헤더가 올라오는 시각 */
    intro(t){
      let y0 = 1e9, y1 = -1e9, d0 = 1e9, d1 = -1e9;
      for (let i = 0; i < n; i++) { const x = bData[i * 4], y = bData[i * 4 + 1], d = x * DIR.x + y * DIR.y; if (y < y0) y0 = y; if (y > y1) y1 = y; if (d < d0) d0 = d; if (d > d1) d1 = d; }
      const ap = appear.array;
      for (let i = 0; i < n; i++) ap[i] = t + FLASH + PASS * ((bData[i * 4] * DIR.x + bData[i * 4 + 1] * DIR.y - d0) / (d1 - d0)) + rand() * 0.03;
      appear.needsUpdate = true;
      introS = { t0: t, y0: y0 - 2, y1: y1 + 8, d0: d0 - 1, d1: d1 + 1 };
      fire.visible = true;
      return { land: t + FLASH + PASS * 0.7, end: t + FLASH + PASS + 0.9 };
    },
    /* 매 프레임: st = g (cx·cy·s·yaw·pitch·mode·flat·wall) + 빛 방향, cellFx = 칸마다 [dx,dy,dz,glow] (옛 좌표), cellM = [사라짐, 반짝임] */
    render(st){
      const t = st.t, dt = Math.min(Math.max(st.dt, 0), 1 / 30);
      const F = st.F, D = st.D;
      camera.fov = 2 * Math.atan(H / 2 / F) * 180 / Math.PI; camera.aspect = W / H;
      camera.setViewOffset(W, H, -(st.cx - W / 2), -(st.cy - H / 2), W, H);
      camera.position.set(0, 0, D); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      model.makeRotationFromEuler(euler.set(st.pitch, -st.yaw, 0, 'XYZ'));
      common.uScale.value = st.s; common.uMode.value = st.mode; common.uFlat.value = st.flat; common.uTime.value = t;
      wallMat.uniforms.uWallZ.value = st.wall;
      common.uPoolR.value = 45 * st.s + 2000 * (1 - st.mode) * (1 - st.mode);
      Lt.set(st.light[0], st.light[1], st.light[2]).normalize();
      common.uLI.value = 2.6; common.uLCol.value.copy(NEUTRAL); cubeMat.uniforms.uBand.value = 0;
      if (introS) {
        const it = t - introS.t0, fu = fireMat.uniforms, ig = Math.min(1, Math.max(0, (it - IGN) / BURN)), fp = (it - FLASH) / PASS;
        fu.uIgnite.value = introS.y0 + (introS.y1 - introS.y0) * (1 - (1 - ig) * (1 - ig));   /* 불길이 아래에서 위로 */
        fu.uFire.value = Math.min(1, Math.max(0, (it - 0.05) / 0.25)) * (1 - Math.min(1, Math.max(0, (fp - 0.75) / 0.35)));   /* 띠가 끝나면 남은 불꽃 혀도 꺼진다 */
        fu.uBandD.value = fp <= 0 ? -99 : introS.d0 + (introS.d1 - introS.d0) * Math.min(1, fp);
        fu.uGlint.value = fp > 0 && fp < 1.15 ? 1 - Math.max(0, fp - 0.85) / 0.3 : 0;
        cubeMat.uniforms.uFront.value = fu.uBandD.value; cubeMat.uniforms.uBand.value = fu.uGlint.value;
        if (fp > 1.3) { fire.visible = false; }
        if (fp > 3) introS = null;
      }
      L.lerp(Lt.set(st.light[0], st.light[1], st.light[2]).normalize(), st.snapLight ? 1 : 1 - Math.exp(-dt * 3)).normalize();
      /* 기준 밝기: 이 각도의 앞면이 빛을 받을 때 = 1 (로고 색 그대로) */
      const Lr = Lt.set(st.light[0], st.light[1], st.light[2]).normalize().clone(), fN = Lt.set(0, 0, 1).applyMatrix4(model), am = cubeMat.uniforms.uAmb.value;
      cubeMat.uniforms.uRef.value = 2.6 * Math.max(fN.dot(Lr), 0.25) + am * (0.6 + 0.4 * (fN.y * 0.5 + 0.5));   /* 쉬는 빛 기준 — 입장 중엔 어둑했다가 로고 색으로 */


      for (let k = 0; k < N; k++) {
        const fx = st.cellFx, cm = st.cellM, o = k * 4, o2 = (N + k) * 4;
        cellData[o] = fx[o]; cellData[o + 1] = -fx[o + 1]; cellData[o + 2] = -fx[o + 2]; cellData[o + 3] = fx[o + 3];
        cellData[o2] = cm[k * 2]; cellData[o2 + 1] = cm[k * 2 + 1];
      }
      tCell.needsUpdate = true;

      if (snapNext || t < simUntil) {
        simU.uTime.value = t; simU.uDt.value = dt; simU.uSnap.value = snapNext ? 1 : 0;
        gpu.compute(); snapNext = false;
      }
      posTex.value = gpu.getCurrentRenderTarget(posVar).texture; velTex.value = gpu.getCurrentRenderTarget(velVar).texture;

      /* 그림자 카메라: 로고(세계 원점)를 감싸는 정사영 */
      const hw = (radius * st.s + 8) * 1.2, dist = hw * 2 + 40;
      Object.assign(lightCam, { left: -hw, right: hw, top: hw, bottom: -hw, near: dist - hw * 2, far: dist + hw * 2 }); lightCam.updateProjectionMatrix();
      lightCam.position.copy(L).multiplyScalar(dist); lightCam.lookAt(0, 0, 0); lightCam.updateMatrixWorld();
      common.uLVP.value.multiplyMatrices(lightCam.projectionMatrix, lightCam.matrixWorldInverse);
      common.uLRange.value = hw * 4; common.uShadowW.value = hw * 2;
      cubeMat.uniforms.uNOff.value = 0.08 * st.s; cubeMat.uniforms.uBias.value = 0.03 * st.s;

      renderer.setRenderTarget(shadowRT); renderer.render(shadowScene, lightCam);
      renderer.setRenderTarget(null); renderer.render(scene, camera);
    },
    dispose(){
      gpu.dispose(); shadowRT.dispose(); tA.dispose(); tB.dispose(); tCell.dispose(); box.dispose(); geo.dispose();
      cubeMat.dispose(); wallMat.dispose(); depthMat.dispose(); wall.geometry.dispose(); fireMat.dispose(); fire.geometry.dispose(); tMask.dispose(); tLut.dispose(); renderer.dispose();
    }
  };
}
