/* 모래 로고 — 화면에 흩어진 모래알 수만 개가 바람(curl noise)을 타고 모여 32×34 픽셀 로고가 된다.
   · 움직임: GPU 에서 알갱이마다 속도·위치를 계산 (GPUComputationRenderer). 처음엔 흐름을 타고 떠다니다가
     자기 자리로 끌리는 힘이 서서히 커져 감속하며 내려앉는다 — 정해진 경로를 따라가는 트윈이 아니라 힘으로 움직인다.
   · 빛: 키 라이트 하나(커서를 따라 움직임) + 하늘·바닥 반사광. 알갱이는 구(球)로 계산해 면마다 빛을 다르게 받고,
     몇 알은 운모처럼 특정 각도에서만 반짝인다.
   · 그림자: 빛 쪽에서 본 깊이 지도에 광선을 쏘아 가리는 알갱이를 찾고(blocker search), 가리는 것과의 거리만큼
     그림자 가장자리를 넓힌다(PCSS). 면광원 레이트레이싱처럼 가까운 그림자는 또렷하고 먼 그림자는 번진다.
   · 누른 채 끌면 손가락이 모래를 쓸듯 흩어졌다가 다시 모인다. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, OrthographicCamera, BufferGeometry, BufferAttribute, Points, Mesh,
  PlaneGeometry, ShaderMaterial, WebGLRenderTarget, DepthTexture, UnsignedIntType, DataTexture, RGBAFormat,
  FloatType, HalfFloatType, NearestFilter, Vector2, Vector3, Raycaster, Plane
} from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';

const FOV = 30, WALL_Z = -4.5;

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

/* 속도: 흐름(curl) → 제자리로 끌리는 힘으로 서서히 넘어간다. 누르고 끄는 곳은 바람에 쓸려 잠시 '풀린다' */
const VEL = /* glsl */`
uniform float uTime, uDt, uPtrOn, uPtrR, uWind;
uniform vec3 uPtr, uPtrVel;
uniform sampler2D tTarget;
${NOISE}
void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 P = texture2D(texturePosition, uv), V = texture2D(textureVelocity, uv), T = texture2D(tTarget, uv);
  vec3 p = P.xyz, v = V.xyz, dp = p - uPtr;
  float k = smoothstep(T.w, T.w + 1.6, uTime);
  float fall = exp(-dot(dp.xy, dp.xy) / (uPtrR * uPtrR)) * uPtrOn;
  float loose = max(V.w * exp(-uDt * 1.4), fall);
  float hold = k * (1.0 - 0.92 * loose);
  vec3 desired = (T.xyz - p) * 6.0 * hold;
  float dl = length(desired); if (dl > 38.0) desired *= 38.0 / dl;
  float gust = 0.7 + 0.6 * fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);                 /* 알갱이마다 바람을 다르게 탄다 */
  if (hold < 0.995) desired += (vec3(uWind * gust, -2.0, 0.0) + curl(p * 0.05 + vec3(0.0, 0.0, uTime * 0.1)) * (4.5 + uWind * 0.3)) * (1.0 - hold);   /* 바람 + 소용돌이 + 약한 중력 */
  vec3 acc = (desired - v) * (1.8 + 12.0 * hold);
  acc += fall * (uPtrVel * 5.0 + normalize(vec3(dp.xy, 0.9)) * (26.0 + length(uPtrVel) * 1.6));
  gl_FragColor = vec4(v + acc * uDt, loose);
}`;

const POS = /* glsl */`
uniform float uTime, uDt;
uniform sampler2D tTarget;
void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 P = texture2D(texturePosition, uv), V = texture2D(textureVelocity, uv);
  float d = texture2D(tTarget, uv).w;
  gl_FragColor = vec4(P.xyz + V.xyz * uDt, smoothstep(d, d + 1.6, uTime) * (1.0 - V.w));   /* w: 얼마나 자리 잡았나 (AO 에 씀) */
}`;

const HASH = /* glsl */`
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }`;

/* 그림자: 빛에서 본 깊이 지도. 가리는 알갱이 평균 거리 → 반그림자 폭 (PCSS) */
const LIGHT = /* glsl */`
uniform sampler2D tShadow;
uniform mat4 uLVP;
uniform float uLRange, uSoft, uShadowW, uTexel, uLI, uLight, uPoolR;
uniform vec3 uL, uLCol;
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
vec2 vogel(int i, int n, float phi){ float r = sqrt((float(i) + 0.5) / float(n)), t = float(i) * 2.39996323 + phi; return r * vec2(cos(t), sin(t)); }
float pcss(vec3 pW, float bias){
  vec3 sc = (uLVP * vec4(pW, 1.0)).xyz * 0.5 + 0.5;
  if (sc.x < 0.0 || sc.x > 1.0 || sc.y < 0.0 || sc.y > 1.0 || sc.z > 1.0) return 1.0;
  float dr = sc.z - bias / uLRange, phi = ign(gl_FragCoord.xy) * 6.2831853, sr = uSoft * 7.0 / uShadowW, sum = 0.0, cnt = 0.0;
  for (int i = 0; i < NB; i++) { float d = texture2D(tShadow, sc.xy + vogel(i, NB, phi) * sr).r; if (d < dr) { sum += d; cnt += 1.0; } }
  if (cnt < 0.5) return 1.0;
  float pen = clamp((dr - sum / cnt) * uLRange * uSoft / uShadowW, uTexel * 1.5, sr), lit = 0.0;
  for (int i = 0; i < NP; i++) lit += step(dr, texture2D(tShadow, sc.xy + vogel(i, NP, phi + 1.7) * pen).r);
  return lit / float(NP);
}
float spot(vec3 pW){ vec3 a = pW - uL * dot(pW, uL); return exp(-dot(a, a) / (uPoolR * uPoolR)); }
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 outColor(vec3 c){ return pow(aces(c * 1.1), vec3(1.0 / 2.2)) + (ign(gl_FragCoord.xy + 17.0) - 0.5) / 255.0; }`;

const GRAIN_VS = /* glsl */`
uniform sampler2D tPos;
uniform float uRad, uPx;
varying vec3 vC, vW;
varying float vR, vHold, vSeed, vAo, vSize;
${HASH}
void main(){
  vec4 P = texture2D(tPos, position.xy);
  vSeed = hash12(position.xy * 4096.0);
  vR = uRad * (0.65 + 0.7 * vSeed * vSeed);
  vW = P.xyz; vHold = P.w; vAo = position.z;
  vec4 mv = viewMatrix * vec4(P.xyz, 1.0);
  vC = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vSize = 2.0 * vR * uPx / -mv.z;
  gl_PointSize = max(vSize, 1.0);
}`;

/* 알갱이 = 작은 구. 점 하나를 구의 앞면으로 보고 법선·깊이를 계산해 서로 맞물리게 그린다 */
const GRAIN_FS = /* glsl */`
uniform vec2 uPZ;
uniform vec3 uSky, uGround;
varying vec3 vC, vW;
varying float vR, vHold, vSeed, vAo, vSize;
${LIGHT}
void main(){
  vec2 c = gl_PointCoord * 2.0 - 1.0; c.y = -c.y;
  float r2 = dot(c, c); if (r2 > 1.0) discard;
  vec3 nV = vec3(c, sqrt(1.0 - r2)), pV = vC + nV * vR;
  gl_FragDepth = ((uPZ.x * pV.z + uPZ.y) / -pV.z) * 0.5 + 0.5;
  vec3 n = normalize((vec4(nV, 0.0) * viewMatrix).xyz), pW = vW + n * vR;
  float h1 = fract(vSeed * 13.71), h2 = fract(vSeed * 7.31), h3 = fract(vSeed * 31.17);
  vec3 alb = vec3(0.33) * (0.72 + 0.56 * h1) * mix(vec3(1.03, 1.0, 0.95), vec3(0.95, 0.99, 1.05), h2);
  float sh = pcss(pW + n * vR * 0.6, 0.04), ndl = max(dot(n, uL), 0.0);
  vec3 V = normalize(cameraPosition - pW), H = normalize(uL + V);
  float nh = max(dot(n, H), 0.0), a2 = 0.178, dd = nh * nh * (a2 - 1.0) + 1.0;
  float spec = a2 / (3.14159 * dd * dd) * (0.04 + 0.96 * pow(1.0 - max(dot(H, V), 0.0), 5.0)) * 0.25 * ndl;
  if (h3 < 0.05) {                                                                  /* 운모 조각: 정해진 각도에서만 번쩍 */
    vec3 fn = normalize(vec3(fract(vSeed * 91.3) - 0.5, fract(vSeed * 45.7) - 0.5, 0.55));
    spec += pow(max(dot(fn, H), 0.0), 260.0) * 14.0 * smoothstep(0.5, 0.0, r2);
  }
  vec3 key = uLCol * uLI * spot(pW) * sh;
  vec3 hemi = mix(uGround, uSky, n.y * 0.5 + 0.5) * mix(1.0, vAo, vHold);
  vec3 col = (alb * (key * ndl + hemi) + key * spec) * uLight;
  gl_FragColor = vec4(outColor(col), clamp((1.0 - r2) * vSize * 0.25, 0.0, 1.0));
}`;

const WALL_VS = /* glsl */`
varying vec3 vW;
void main(){ vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`;

const WALL_FS = /* glsl */`
uniform vec3 uWall;
uniform float uWallAmb;
varying vec3 vW;
${LIGHT}
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + 1.0), f.x), f.y); }
void main(){
  float sp = spot(vW), sh = pcss(vW, 0.05);
  vec3 alb = uWall * (0.85 + 0.3 * (vnoise(vW.xy * 2.5) * 0.6 + vnoise(vW.xy * 9.0) * 0.4));   /* 스튜디오 벽의 미세한 결 */
  vec3 col = alb * (uLCol * uLI * sp * sh * max(uL.z, 0.0) + vec3(uWallAmb) * (0.3 + 0.7 * sp)) * uLight;
  gl_FragColor = vec4(outColor(col), 1.0);
}`;

const DEPTH_VS = /* glsl */`
uniform sampler2D tPos;
uniform float uRad, uPxS;
varying float vR;
${HASH}
void main(){
  vec4 P = texture2D(tPos, position.xy);
  float s = hash12(position.xy * 4096.0);
  vR = uRad * (0.65 + 0.7 * s * s);
  gl_Position = projectionMatrix * viewMatrix * vec4(P.xyz, 1.0);
  gl_PointSize = max(1.0, 2.0 * vR * uPxS);
}`;

const DEPTH_FS = /* glsl */`
uniform float uLRange;
varying float vR;
void main(){
  vec2 c = gl_PointCoord * 2.0 - 1.0; float r2 = dot(c, c); if (r2 > 1.0) discard;
  gl_FragDepth = gl_FragCoord.z - sqrt(1.0 - r2) * vR / uLRange;                   /* 빛 쪽으로 볼록한 구의 깊이 */
  gl_FragColor = vec4(1.0);
}`;

function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export function mountSandLogo(canvas, grid){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 800;
  const S = small ? 192 : 320, n = S * S, SM = small ? 1024 : 2048;
  const RAD = 0.11 * Math.cbrt(65536 / n);
  const rand = rng(7);

  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 1);
  const camera = new PerspectiveCamera(FOV, 1, 10, 500);
  const tanH = Math.tan(FOV / 2 * Math.PI / 180);
  let D = 100, halfW = 70;

  const fitD = () => Math.max(34 / (0.62 * 2 * tanH), 32 / (0.8 * 2 * tanH * camera.aspect));
  camera.aspect = (canvas.clientWidth || 1) / (canvas.clientHeight || 1); D = fitD();

  /* ── 로고 칸 → 알갱이 목표 자리. 가운데가 볼록한 부조: 칸마다 두께 h, 앞면 쪽에 알갱이를 더 많이 ── */
  const cells = [];
  grid.forEach((row, r) => { for (let c = 0; c < row.length; c++) if (row[c] === '#') cells.push({ x: c + 0.5, y: -(r + 0.5) }); });
  const xs = cells.map(c => c.x), ys = cells.map(c => c.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  let sumH = 0;
  cells.forEach(c => { c.x -= cx; c.y -= cy; const b = Math.sqrt(Math.max(0, 1 - (c.x * c.x + c.y * c.y) / (17.7 * 17.7))); c.h = 0.5 + 1.3 * b; sumH += c.h; });
  const xMin = Math.min(...cells.map(c => c.x)), xMax = Math.max(...cells.map(c => c.x));

  const tgt = new Float32Array(n * 4), ref = new Float32Array(n * 3);
  let gi = 0;
  cells.forEach((c, ci) => {
    const cnt = ci === cells.length - 1 ? n - gi : Math.round(c.h / sumH * n);
    for (let k = 0; k < cnt && gi < n; k++, gi++) {
      const zr = Math.pow(rand(), 1.7), x = c.x + (rand() - 0.5) * 1.08, y = c.y + (rand() - 0.5) * 1.08;
      tgt[gi * 4] = x; tgt[gi * 4 + 1] = y; tgt[gi * 4 + 2] = c.h / 2 - c.h * zr + (rand() - 0.5) * 0.1;
      ref[gi * 3] = (gi % S + 0.5) / S; ref[gi * 3 + 1] = (Math.floor(gi / S) + 0.5) / S;
      ref[gi * 3 + 2] = 0.3 + 0.7 * Math.pow(1 - zr, 1.5);                            /* 깊이 박힌 알갱이일수록 하늘빛을 덜 받는다 (AO) */
    }
  });
  /* ── 출발: 화면 왼쪽 밖에서 바람에 실려 들어오는 모래 줄기. 오른쪽 자리일수록 줄기 뒤쪽에서 출발해 늦게 닿는다 —
     로고가 왼쪽부터 쌓인다. 도착 무렵부터 제자리로 끌리는 힘이 커진다 (T.w = 붙잡히기 시작하는 시각) ── */
  const WIND = 34, hh = tanH * D, hw = hh * camera.aspect;
  const start = new Float32Array(n * 3), vel = new Float32Array(n * 3);
  let introEnd = 0;
  for (let i = 0; i < n; i++) {
    const tx = tgt[i * 4], ty = tgt[i * 4 + 1], u = (tx - xMin) / (xMax - xMin);
    const sx = -hw * 1.02 - u * hw * 0.5 - Math.pow(rand(), 0.6) * hw * 0.55;
    start[i * 3] = sx; start[i * 3 + 1] = ty * 0.75 + (rand() - 0.5) * 9 + Math.sin(sx * 0.08) * 3; start[i * 3 + 2] = tgt[i * 4 + 2] + (rand() - 0.5) * 8;
    vel[i * 3] = WIND * (0.7 + rand() * 0.6); vel[i * 3 + 1] = (rand() - 0.5) * 3;
    tgt[i * 4 + 3] = Math.max(0.3, (tx - sx) / WIND - 0.7 + (rand() - 0.5) * 0.3);
    introEnd = Math.max(introEnd, tgt[i * 4 + 3] + 1.6);
  }

  /* ── GPU 시뮬레이션 ── */
  const gpu = new GPUComputationRenderer(S, S, renderer);
  if (!renderer.extensions.has('EXT_color_buffer_float')) gpu.setDataType(HalfFloatType);
  const pos0 = gpu.createTexture(), vel0 = gpu.createTexture(), pd = pos0.image.data, vd = vel0.image.data;
  for (let a = 0; a < n; a++) {
    if (reduce) { pd[a * 4] = tgt[a * 4]; pd[a * 4 + 1] = tgt[a * 4 + 1]; pd[a * 4 + 2] = tgt[a * 4 + 2]; pd[a * 4 + 3] = 1; continue; }
    pd[a * 4] = start[a * 3]; pd[a * 4 + 1] = start[a * 3 + 1]; pd[a * 4 + 2] = start[a * 3 + 2];
    vd[a * 4] = vel[a * 3]; vd[a * 4 + 1] = vel[a * 3 + 1];
  }
  const tTarget = new DataTexture(tgt, S, S, RGBAFormat, FloatType);
  tTarget.minFilter = tTarget.magFilter = NearestFilter; tTarget.needsUpdate = true;
  const velVar = gpu.addVariable('textureVelocity', VEL, vel0);
  const posVar = gpu.addVariable('texturePosition', POS, pos0);
  gpu.setVariableDependencies(velVar, [velVar, posVar]);
  gpu.setVariableDependencies(posVar, [velVar, posVar]);
  const simU = { uTime: { value: reduce ? 1e3 : 0 }, uDt: { value: 1 / 60 }, tTarget: { value: tTarget }, uPtr: { value: new Vector3(0, 0, 999) }, uPtrVel: { value: new Vector3() }, uPtrOn: { value: 0 }, uPtrR: { value: 3.6 }, uWind: { value: WIND } };
  Object.assign(velVar.material.uniforms, simU);
  Object.assign(posVar.material.uniforms, { uTime: simU.uTime, uDt: simU.uDt, tTarget: simU.tTarget });
  const err = gpu.init();
  if (err) { renderer.dispose(); throw new Error(err); }

  /* ── 빛·그림자 공용 값 ── */
  const shadowRT = new WebGLRenderTarget(SM, SM, { depthTexture: new DepthTexture(SM, SM, UnsignedIntType) });
  const lightCam = new OrthographicCamera(-70, 70, 70, -70, 40, 200);
  const L = new Vector3(-0.45, 0.55, 0.7).normalize(), Lt = L.clone();
  const lightU = {
    tShadow: { value: shadowRT.depthTexture }, uLVP: { value: lightCam.projectionMatrix.clone() }, uLRange: { value: 160 },
    uSoft: { value: 0.09 }, uShadowW: { value: 140 }, uTexel: { value: 1 / SM }, uLI: { value: 2.6 }, uLight: { value: reduce ? 1 : 0.12 },
    uPoolR: { value: 30 }, uL: { value: L }, uLCol: { value: new Vector3(1.0, 0.96, 0.9) }
  };
  const posTex = { value: null };

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(ref, 3));
  const grainMat = new ShaderMaterial({
    vertexShader: GRAIN_VS, fragmentShader: GRAIN_FS, defines: { NB: 8, NP: 12 }, alphaToCoverage: true,
    uniforms: { ...lightU, tPos: posTex, uRad: { value: RAD }, uPx: { value: 1000 }, uPZ: { value: new Vector2() }, uSky: { value: new Vector3(0.07, 0.075, 0.085) }, uGround: { value: new Vector3(0.012, 0.012, 0.014) } }
  });
  const grains = new Points(geo, grainMat); grains.frustumCulled = false;
  const wall = new Mesh(new PlaneGeometry(460, 300), new ShaderMaterial({
    vertexShader: WALL_VS, fragmentShader: WALL_FS, defines: { NB: 12, NP: 20 },
    uniforms: { ...lightU, uWall: { value: new Vector3(0.034, 0.034, 0.036) }, uWallAmb: { value: 0.05 } }
  }));
  wall.position.z = WALL_Z;
  const scene = new Scene(); scene.add(wall, grains);

  const depthMat = new ShaderMaterial({ vertexShader: DEPTH_VS, fragmentShader: DEPTH_FS, colorWrite: false, uniforms: { tPos: posTex, uRad: { value: RAD }, uPxS: { value: SM / 140 }, uLRange: lightU.uLRange } });
  const shadowGrains = new Points(geo, depthMat); shadowGrains.frustumCulled = false;
  const shadowScene = new Scene(); shadowScene.add(shadowGrains);

  /* ── 크기: 로고가 화면 높이 62%·폭 80% 안에 들어오게 카메라 거리를 정한다 ── */
  const dbs = new Vector2();
  function resize(){
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4.2e6 / (w * h))));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; D = fitD(); camera.updateProjectionMatrix();
    grainMat.uniforms.uPx.value = renderer.getDrawingBufferSize(dbs).y / (2 * tanH);
    halfW = (Math.max(tanH * camera.aspect, tanH) * (D + 10) + 6) * 1.25;
    Object.assign(lightCam, { left: -halfW, right: halfW, top: halfW, bottom: -halfW }); lightCam.updateProjectionMatrix();
    lightU.uShadowW.value = 2 * halfW; depthMat.uniforms.uPxS.value = SM / (2 * halfW);
    dirty = true;
  }

  /* ── 입력: 커서 = 빛의 위치, 누른 채 끌기(터치는 그냥 끌기) = 모래를 쓰는 바람 ── */
  const ptr = { ndc: new Vector2(), down: false, world: new Vector3(), prev: new Vector3(), vel: new Vector3(), has: false };
  const ray = new Raycaster(), plane = new Plane(new Vector3(0, 0, 1), -0.3), hit = new Vector3();
  let lastInput = -1e9, dirty = true;
  function onMove(e){
    const r = canvas.getBoundingClientRect();
    ptr.ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height * 2 - 1));
    ptr.down = e.pointerType === 'touch' ? true : (e.buttons & 1) === 1;
    ptr.has = true; lastInput = performance.now();
    Lt.set(ptr.ndc.x, ptr.ndc.y * 0.9 + 0.15, 0.8).normalize();
  }
  const onUp = () => { ptr.down = false; lastInput = performance.now(); };
  if (!reduce) {
    canvas.addEventListener('pointerdown', onMove);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
  }
  window.addEventListener('resize', resize);
  resize();

  let t = reduce ? 1e3 : 0, last = performance.now(), raf = 0;
  function frame(now){
    const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
    const busy = !reduce && (t < introEnd + 1.5 || now - lastInput < 2500 || simU.uPtrOn.value > 0.01);
    if (busy || dirty) {
      if (!reduce) {
        t += dt; simU.uTime.value = t; simU.uDt.value = dt;
        simU.uWind.value = WIND * (1 - Math.min(1, Math.max(0, (t - introEnd + 1.6) / 1.6)));   /* 다 모이면 바람은 잦아든다 */
        L.lerp(Lt, 1 - Math.exp(-dt * 3)).normalize();
        lightU.uLight.value = 0.12 + 0.88 * Math.min(1, Math.max(0, (t - 0.1) / 1.5)) ** 2;
        ray.setFromCamera(ptr.ndc, camera);
        if (ptr.has && ray.ray.intersectPlane(plane, hit)) {
          ptr.prev.copy(ptr.world); ptr.world.copy(hit);
          ptr.vel.lerp(hit.clone().sub(ptr.prev).divideScalar(Math.max(dt, 1e-3)).clampLength(0, 80), 1 - Math.exp(-dt * 12));
        }
        simU.uPtr.value.copy(ptr.world); simU.uPtrVel.value.copy(ptr.vel);
        simU.uPtrOn.value += ((ptr.down ? 1 : 0) - simU.uPtrOn.value) * (1 - Math.exp(-dt * 10));
        gpu.compute();
      }
      /* 카메라: 처음엔 조금 멀리서 천천히 다가오고, 커서 쪽으로 아주 살짝 기운다 */
      const dolly = reduce ? 1 : 1 + 0.07 * (1 - Math.min(1, t / 4.5)) ** 3;
      const yaw = ptr.ndc.x * 0.035 * (reduce ? 0 : 1), pitch = 0.09 + ptr.ndc.y * 0.025 * (reduce ? 0 : 1);
      camera.position.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(D * dolly);
      camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
      grainMat.uniforms.uPZ.value.set(camera.projectionMatrix.elements[10], camera.projectionMatrix.elements[14]);

      lightCam.position.copy(L).multiplyScalar(120); lightCam.lookAt(0, 0, 0); lightCam.updateMatrixWorld();
      lightU.uLVP.value.multiplyMatrices(lightCam.projectionMatrix, lightCam.matrixWorldInverse);

      posTex.value = gpu.getCurrentRenderTarget(posVar).texture;
      renderer.setRenderTarget(shadowRT); renderer.render(shadowScene, lightCam);
      renderer.setRenderTarget(null); renderer.render(scene, camera);
      dirty = false;
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    replay(){
      if (reduce) return;
      gpu.renderTexture(pos0, posVar.renderTargets[0]); gpu.renderTexture(pos0, posVar.renderTargets[1]);
      gpu.renderTexture(vel0, velVar.renderTargets[0]); gpu.renderTexture(vel0, velVar.renderTargets[1]);
      t = 0;
    },
    dispose(){
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onMove);
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp); window.removeEventListener('resize', resize);
      gpu.dispose(); shadowRT.dispose(); tTarget.dispose(); geo.dispose(); grainMat.dispose(); depthMat.dispose();
      wall.geometry.dispose(); wall.material.dispose(); renderer.dispose();
    }
  };
}
