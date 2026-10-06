/* 메인 홈 3D 씬 (three.js) — 로고 픽셀 530칸을 각각 작은 픽셀 큐브 여러 개로 채운다.
   · 큐브는 GPU 에서 힘으로 움직인다: 첫 입장은 화면 왼쪽 밖에서 바람에 실려 들어와 왼쪽부터 쌓이고,
     챕터가 바뀌면 칸마다 정해진 순서로 새 자리로 날아간다. 날 때는 속도만큼 기울고 내려앉으면 반듯하게 격자에 맞는다.
   · 빛: 키 라이트(천천히 돌거나 커서를 따라감) + 하늘·바닥 반사광. 그림자는 빛에서 본 깊이 지도에서
     가리는 큐브를 찾아 거리만큼 번지게 하는 PCSS — 가까우면 또렷하고 멀면 퍼진다.
   · 로고 뒤 벽(잉크 챕터는 조명이 닿는 벽, 페이퍼 챕터는 그림자만 남는 투명 벽)에 그림자가 진다.
   · 좌표는 home.js 의 옛 투영(카메라 거리 D, 초점 F px, 화면 중심 cx·cy)과 똑같이 맞춰 frameFor 배치를 그대로 쓴다.
     옛 좌표는 y 아래·z 화면 안쪽, three 는 y 위·z 화면 바깥 → (x, -y, -z) */
import {
  WebGLRenderer, Scene, PerspectiveCamera, OrthographicCamera, BoxGeometry, InstancedBufferGeometry,
  InstancedBufferAttribute, Mesh, PlaneGeometry, ShaderMaterial, WebGLRenderTarget, DepthTexture, UnsignedIntType,
  DataTexture, RGBAFormat, FloatType, HalfFloatType, NearestFilter, Vector3, Matrix4, Euler, Raycaster, Plane
} from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';

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
uniform float uTime, uDt, uPtrOn, uPtrR, uWind, uSnap;
uniform vec3 uPtr, uPtrVel;
uniform sampler2D tA, tB;
${NOISE}
void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  if (uSnap > 0.5) { gl_FragColor = vec4(0.0); return; }
  vec4 P = texture2D(texturePosition, uv), V = texture2D(textureVelocity, uv), A = texture2D(tA, uv), B = texture2D(tB, uv);
  vec3 T = uTime < B.w ? A.xyz : B.xyz, p = P.xyz, v = V.xyz, dp = p - uPtr;
  float k = smoothstep(A.w, A.w + 1.6, uTime);
  float fall = exp(-dot(dp.xy, dp.xy) / (uPtrR * uPtrR)) * uPtrOn;
  float loose = max(V.w * exp(-uDt * 1.4), fall);
  float hold = k * (1.0 - 0.92 * loose);
  vec3 d = T - p;
  float swirl = min(1.0, length(d) * 0.1) * hold;                                     /* 챕터 전환 중 날아가는 큐브만 살짝 소용돌이 */
  vec3 desired = d * 6.0 * hold;
  float dl = length(desired); if (dl > 38.0) desired *= 38.0 / dl;
  float gust = 0.7 + 0.6 * fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
  if (hold < 0.995 || swirl > 0.01)
    desired += vec3(uWind * gust, -2.0, 0.0) * (1.0 - hold) + curl(p * 0.05 + vec3(0.0, 0.0, uTime * 0.1)) * ((4.5 + uWind * 0.3) * (1.0 - hold) + 2.5 * swirl);
  vec3 acc = (desired - v) * (1.8 + 12.0 * hold);
  acc += fall * (uPtrVel * 5.0 + normalize(vec3(dp.xy, 0.9)) * (26.0 + length(uPtrVel) * 1.6));
  gl_FragColor = vec4(v + acc * uDt, loose);
}`;

const POS = /* glsl */`
uniform float uTime, uDt, uSnap;
uniform sampler2D tA, tB;
void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 P = texture2D(texturePosition, uv), V = texture2D(textureVelocity, uv), A = texture2D(tA, uv), B = texture2D(tB, uv);
  if (uSnap > 0.5) { gl_FragColor = vec4(uTime < B.w ? A.xyz : B.xyz, 1.0); return; }
  gl_FragColor = vec4(P.xyz + V.xyz * uDt, smoothstep(A.w, A.w + 1.6, uTime) * (1.0 - V.w));   /* w: 자리 잡은 정도 */
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
uniform float uScale, uTime;
attribute vec4 aRef;   /* xy 시뮬레이션 uv · z 칸 u · w 깊이 AO */
attribute vec4 aSize;  /* xyz 큐브 크기 · w 무작위 */
varying vec3 vN, vW, vBox;
varying float vAo, vGlow, vFlk, vSeed;
mat3 rotAxis(vec3 a, float t){ float c = cos(t), s = sin(t), o = 1.0 - c;
  return mat3(c + a.x * a.x * o, a.y * a.x * o + a.z * s, a.z * a.x * o - a.y * s, a.x * a.y * o - a.z * s, c + a.y * a.y * o, a.z * a.y * o + a.x * s, a.x * a.z * o + a.y * s, a.y * a.z * o - a.x * s, c + a.z * a.z * o); }
void main(){
  vec4 P = texture2D(tPos, aRef.xy), V = texture2D(tVel, aRef.xy);
  vec4 C0 = texture2D(tCell, vec2(aRef.z, 0.25)), C1 = texture2D(tCell, vec2(aRef.z, 0.75));
  float s = aSize.w, tilt = clamp((1.0 - P.w) + length(V.xyz) * 0.05, 0.0, 1.0);     /* 나는 동안만 기울고, 멈추면 반듯하게 */
  vec3 ax = normalize(vec3(fract(s * 7.13), fract(s * 3.37), fract(s * 5.71)) - 0.5 + 1e-3);
  mat3 R = rotAxis(ax, tilt * ((s - 0.5) * 5.0 + sin(uTime * (1.5 + s * 2.5) + s * 40.0) * 1.2));
  vec3 local = R * (position * aSize.xyz * (1.0 - C1.x));                              /* C1.x: 02 챕터에서 코드 조각으로 바뀌며 사라짐 */
  vec4 w = uModel * vec4((P.xyz + C0.xyz + local) * uScale, 1.0);
  vW = w.xyz; vN = mat3(uModel) * (R * normal); vBox = position;
  vAo = aRef.w; vGlow = C0.w; vFlk = C1.y; vSeed = s;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const CUBE_FS = /* glsl */`
uniform vec3 uAlbInk, uAlbPaper, uSkyInk, uSkyPaper, uGroundInk, uGroundPaper, uKey;
uniform float uFlat, uNOff, uBias;
varying vec3 vN, vW, vBox;
varying float vAo, vGlow, vFlk, vSeed;
${LIGHT}
void main(){
  vec3 n = normalize(vN);
  vec3 q = abs(vBox) * 2.0;                                                             /* 면 안에서 모서리까지 — 픽셀마다 얇은 테두리 그늘 */
  float e2 = q.x + q.y + q.z - max(q.x, max(q.y, q.z)) - min(q.x, min(q.y, q.z));
  float edge = smoothstep(0.72, 1.0, e2);
  vec3 alb = mix(uAlbPaper, uAlbInk, uMode) * (0.84 + 0.32 * fract(vSeed * 13.71));     /* 픽셀마다 밝기가 조금씩 다르다 */
  float sh = pcss(vW + n * uNOff, uBias), ndl = max(dot(n, uL), 0.0);
  vec3 V = normalize(cameraPosition - vW), H = normalize(uL + V);
  float nh = max(dot(n, H), 0.0), spec = pow(nh, 60.0) * 0.35 * ndl;
  vec3 key = uLCol * uLI * spot(vW) * sh;
  vec3 hemi = mix(mix(uGroundPaper, uGroundInk, uMode), mix(uSkyPaper, uSkyInk, uMode), n.y * 0.5 + 0.5) * vAo;
  vec3 col = alb * (key * ndl + hemi) * (1.0 - 0.28 * edge) + key * spec * (1.0 - edge);
  col *= 1.0 + vFlk * 0.9;
  col = mix(col, uKey * (1.4 + 0.6 * ndl), clamp(vGlow, 0.0, 0.85));                   /* 03 챕터 데이터 패킷 */
  vec3 c = outColor(col);
  vec3 flatC = mix(vec3(0.235, 0.24, 0.255), vec3(0.62, 0.62, 0.63), uMode);             /* 01 챕터: 모든 면을 한 색으로 (사용자 2026-09-28) */
  gl_FragColor = vec4(mix(c, flatC, uFlat), 1.0);
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

/* 벽: 잉크면 조명이 닿는 어두운 벽, 페이퍼면 그림자만 남기는 투명한 벽 (premultiplied) */
const WALL_FS = /* glsl */`
uniform float uFlat, uWallA, uBiasW;
varying vec3 vW, vN;
${LIGHT}
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + 1.0), f.x), f.y); }
void main(){
  float sh = pcss(vW, uBiasW), sp = spot(vW), ndl = max(dot(normalize(vN), uL), 0.0);
  vec3 lit = vec3(0.034, 0.034, 0.036) * (0.85 + 0.3 * vnoise(vW.xy * 2.5 + vW.z)) * (uLCol * uLI * sp * sh * ndl + vec3(0.05) * (0.3 + 0.7 * sp));
  vec3 ink = outColor(lit);
  float dark = (1.0 - sh) * 0.3 * (1.0 - 0.5 * uFlat);
  float a = mix(dark, max(ink.r, max(ink.g, ink.b)), uMode) * uWallA;
  gl_FragColor = vec4(ink * uMode * uWallA, a);
}`;

const DEPTH_VS = /* glsl */`
uniform sampler2D tPos, tVel, tCell;
uniform mat4 uModel;
uniform float uScale;
attribute vec4 aRef;
attribute vec4 aSize;
void main(){
  vec4 P = texture2D(tPos, aRef.xy), C0 = texture2D(tCell, vec2(aRef.z, 0.25)), C1 = texture2D(tCell, vec2(aRef.z, 0.75));
  gl_Position = projectionMatrix * viewMatrix * uModel * vec4((P.xyz + C0.xyz + position * aSize.xyz * (1.0 - C1.x)) * uScale, 1.0);
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
  const simU = { uTime: { value: 0 }, uDt: { value: 1 / 60 }, uSnap: { value: 1 }, tA: { value: tA }, tB: { value: tB }, uPtr: { value: new Vector3(0, 0, 999) }, uPtrVel: { value: new Vector3() }, uPtrOn: { value: 0 }, uPtrR: { value: 3.6 }, uWind: { value: 0 } };
  Object.assign(velVar.material.uniforms, simU);
  Object.assign(posVar.material.uniforms, { uTime: simU.uTime, uDt: simU.uDt, uSnap: simU.uSnap, tA: simU.tA, tB: simU.tB });
  const err = gpu.init();
  if (err) { renderer.dispose(); throw new Error(err); }

  /* 칸 텍스처: 0행 = 움직임(xyz)·빛 패킷, 1행 = 사라짐·반짝임 */
  const cellData = new Float32Array(N * 2 * 4), tCell = new DataTexture(cellData, N, 2, RGBAFormat, FloatType);
  tCell.minFilter = tCell.magFilter = NearestFilter; tCell.needsUpdate = true;

  const shadowRT = new WebGLRenderTarget(SM, SM, { depthTexture: new DepthTexture(SM, SM, UnsignedIntType) });
  const lightCam = new OrthographicCamera(-40, 40, 40, -40, 1, 200);
  const L = new Vector3(-0.42, 0.62, 0.66).normalize(), Lt = new Vector3();
  const model = new Matrix4(), euler = new Euler(0, 0, 0, 'XYZ');
  const posTex = { value: null }, velTex = { value: null };
  const common = {
    tShadow: { value: shadowRT.depthTexture }, uLVP: { value: new Matrix4() }, uLRange: { value: 160 }, uSoft: { value: 0.09 }, uShadowW: { value: 80 },
    uTexel: { value: 1 / SM }, uLI: { value: 2.6 }, uPoolR: { value: 30 }, uMode: { value: 1 }, uL: { value: L }, uLCol: { value: new Vector3(1.0, 0.96, 0.9) },
    uModel: { value: model }, uScale: { value: 1 }, uTime: { value: 0 }, uFlat: { value: 0 }
  };

  const box = new BoxGeometry(1, 1, 1), geo = new InstancedBufferGeometry();
  geo.index = box.index; geo.setAttribute('position', box.getAttribute('position')); geo.setAttribute('normal', box.getAttribute('normal'));
  geo.setAttribute('aRef', new InstancedBufferAttribute(aRef, 4)); geo.setAttribute('aSize', new InstancedBufferAttribute(aSize, 4));
  geo.instanceCount = n;
  const cubeMat = new ShaderMaterial({
    vertexShader: CUBE_VS, fragmentShader: CUBE_FS, defines: { NB: 8, NP: 12 },
    uniforms: { ...common, tPos: posTex, tVel: velTex, tCell: { value: tCell }, uNOff: { value: 0.1 }, uBias: { value: 0.03 },
      uAlbInk: { value: new Vector3(0.36, 0.36, 0.37) }, uAlbPaper: { value: new Vector3(0.075, 0.077, 0.085) },
      uSkyInk: { value: new Vector3(0.07, 0.075, 0.085) }, uSkyPaper: { value: new Vector3(0.42, 0.42, 0.44) },
      uGroundInk: { value: new Vector3(0.012, 0.012, 0.014) }, uGroundPaper: { value: new Vector3(0.2, 0.2, 0.2) },
      uKey: { value: new Vector3(0.905, 1.0, 0.087) } }
  });
  const cubes = new Mesh(geo, cubeMat); cubes.frustumCulled = false;
  const wallMat = new ShaderMaterial({
    vertexShader: WALL_VS, fragmentShader: WALL_FS, defines: { NB: 12, NP: 20 }, transparent: true, premultipliedAlpha: true, depthWrite: false,
    uniforms: { ...common, uWallZ: { value: -5.5 }, uBiasW: { value: 0.05 }, uWallA: { value: 1 } }
  });
  const wall = new Mesh(new PlaneGeometry(600, 400), wallMat); wall.frustumCulled = false; wall.renderOrder = -1;
  const scene = new Scene(); scene.add(wall, cubes);
  const depthMat = new ShaderMaterial({ vertexShader: DEPTH_VS, fragmentShader: 'void main(){ gl_FragColor = vec4(1.0); }', colorWrite: false,
    uniforms: { tPos: posTex, tVel: velTex, tCell: { value: tCell }, uModel: common.uModel, uScale: common.uScale } });
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

  /* ── 입력: 커서 = 빛, 누른 채 끌기 = 바람 (home.js 가 언제 바람을 켤지 정한다) ── */
  const ptr = { has: false, down: false, ndcX: 0, ndcY: 0, world: new Vector3(), prev: new Vector3(), vel: new Vector3(), lastDown: -1e9 };
  const ray = new Raycaster(), inv = new Matrix4(), hit = new Vector3(), plane = new Plane(new Vector3(0, 0, 1), -0.5);

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
    /* 첫 입장: 화면 왼쪽 밖(로고 좌표)에서 모래 줄기로 출발. 오른쪽 자리일수록 줄기 뒤쪽 → 왼쪽부터 쌓인다. 반환: 대부분 내려앉는 시각 */
    intro(t, view){
      const WIND = 34, xMin = Math.min(...cells.map(c => c.gx)), xMax = Math.max(...cells.map(c => c.gx));
      const left = view.left, hw = Math.max(20, view.right - view.left) / 2;
      const pd = pos0.image.data, vd = vel0.image.data;
      let end = 0;
      for (let i = 0; i < n; i++) {
        const tx = bData[i * 4], ty = bData[i * 4 + 1], u = (cells[cellOf[i]].gx - xMin) / (xMax - xMin);
        const sx = left - 2 - u * hw * 0.5 - Math.pow(rand(), 0.6) * hw * 0.55;
        pd[i * 4] = sx; pd[i * 4 + 1] = ty * 0.75 + (rand() - 0.5) * 9 + Math.sin(sx * 0.08) * 3; pd[i * 4 + 2] = bData[i * 4 + 2] + (rand() - 0.5) * 8; pd[i * 4 + 3] = 0;
        vd[i * 4] = WIND * (0.7 + rand() * 0.6); vd[i * 4 + 1] = (rand() - 0.5) * 3; vd[i * 4 + 2] = vd[i * 4 + 3] = 0;
        const cap = t + Math.max(0.3, (tx - sx) / WIND - 0.7 + (rand() - 0.5) * 0.3);
        aData[i * 4] = tx; aData[i * 4 + 1] = ty; aData[i * 4 + 2] = bData[i * 4 + 2]; aData[i * 4 + 3] = cap; bData[i * 4 + 3] = -1e9;
        if (cap > end) end = cap;
      }
      tA.needsUpdate = tB.needsUpdate = true; pos0.needsUpdate = vel0.needsUpdate = true;
      gpu.renderTexture(pos0, posVar.renderTargets[0]); gpu.renderTexture(pos0, posVar.renderTargets[1]);
      gpu.renderTexture(vel0, velVar.renderTargets[0]); gpu.renderTexture(vel0, velVar.renderTargets[1]);
      snapNext = false; simU.uWind.value = WIND; this.windOff = end; simUntil = end + 3;
      return { land: t + (end - t) * 0.78, end: end + 1.6 };
    },
    pointer(x, y, down){
      ptr.has = true; ptr.ndcX = x / W * 2 - 1; ptr.ndcY = -(y / H * 2 - 1);
      if (down) { ptr.down = true; ptr.lastDown = performance.now(); } else ptr.down = false;
    },
    lightFromPointer(out){ if (!ptr.has) return false; out[0] = ptr.ndcX; out[1] = ptr.ndcY * 0.9 + 0.15; out[2] = 0.8; return true; },
    /* 매 프레임: s 가 g (cx·cy·s·yaw·pitch·mode·flat·wall), cellFx = 칸마다 [dx,dy,dz,glow] (옛 좌표), cellM = [사라짐, 반짝임] */
    render(st){
      const t = st.t, dt = Math.min(Math.max(st.dt, 0), 1 / 30);
      const F = st.F, D = st.D;
      camera.fov = 2 * Math.atan(H / 2 / F) * 180 / Math.PI; camera.aspect = W / H;
      camera.setViewOffset(W, H, -(st.cx - W / 2), -(st.cy - H / 2), W, H);
      camera.position.set(0, 0, D); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      model.makeRotationFromEuler(euler.set(st.pitch, -st.yaw, 0, 'XYZ'));
      common.uScale.value = st.s; common.uMode.value = st.mode; common.uFlat.value = st.flat; common.uTime.value = t;
      wallMat.uniforms.uWallZ.value = st.wall;
      common.uPoolR.value = 30 * st.s + 2000 * (1 - st.mode) * (1 - st.mode);
      L.lerp(Lt.set(st.light[0], st.light[1], st.light[2]).normalize(), st.snapLight ? 1 : 1 - Math.exp(-dt * 3)).normalize();

      for (let k = 0; k < N; k++) {
        const fx = st.cellFx, cm = st.cellM, o = k * 4, o2 = (N + k) * 4;
        cellData[o] = fx[o]; cellData[o + 1] = -fx[o + 1]; cellData[o + 2] = -fx[o + 2]; cellData[o + 3] = fx[o + 3];
        cellData[o2] = cm[k * 2]; cellData[o2 + 1] = cm[k * 2 + 1];
      }
      tCell.needsUpdate = true;

      /* 바람: 커서 광선을 로고 좌표로 옮겨 앞면 높이의 평면과 만나는 점 */
      if (ptr.has) {
        ray.setFromCamera({ x: ptr.ndcX, y: ptr.ndcY }, camera);
        inv.copy(model).invert(); ray.ray.applyMatrix4(inv); ray.ray.origin.divideScalar(st.s);
        if (ray.ray.intersectPlane(plane, hit)) { ptr.prev.copy(ptr.world); ptr.world.copy(hit); ptr.vel.lerp(hit.clone().sub(ptr.prev).divideScalar(Math.max(dt, 1e-3)).clampLength(0, 80), 1 - Math.exp(-dt * 12)); }
      }
      const windOn = ptr.down && st.wind;
      simU.uPtrOn.value += ((windOn ? 1 : 0) - simU.uPtrOn.value) * (1 - Math.exp(-dt * 10));
      if (windOn) simUntil = Math.max(simUntil, t + 3);
      simU.uPtr.value.copy(ptr.world); simU.uPtrVel.value.copy(ptr.vel);
      if (this.windOff) simU.uWind.value = 34 * (1 - Math.min(1, Math.max(0, (t - this.windOff) / 1.6)));
      if (snapNext || t < simUntil || simU.uPtrOn.value > 0.01) {
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
      cubeMat.dispose(); wallMat.dispose(); depthMat.dispose(); wall.geometry.dispose(); renderer.dispose();
    }
  };
}
