/* 메인 홈 3D 씬 (three.js) — 로고 픽셀 530칸을 각각 작은 픽셀 큐브 여러 개로 채운다.
   · 첫 입장 (사용자 지정): 초점이 살짝 나간 화면에 크기·깊이가 제각각인 큐브가 떠 있고, 초점이 맞아 가는 동안(0.15초부터) 카메라가 z축으로 천천히 출발해 → 1.7초 동안 일정한 양이
     가속하며 카메라를 스치고(z축, 가까이 지나가는 큐브는 초점 밖이라 흐리고 잔상이 남는다) → 0.45초 동안 촥 빨려 들며 다 지나가 버린다.
     이어 로고 칸들이 소실점에서 튀어나와 가운데부터 바깥으로 촤라락 펼쳐지며 제자리에 급제동해 박힌다 (옆으로 모이지 않는다).
   · 첫 챕터의 빛은 카메라에 달린 조명 (렌즈 약간 위·왼쪽, 카메라를 따라간다, 가까울수록 밝다).
   · 큐브 모서리는 살짝 깎아(베벨) 빛이 모서리에 걸린다 — 입장 중엔 또렷하게, 다 모이면 옅게.
     챕터가 바뀌면 큐브가 GPU 에서 힘으로 새 자리로 날아간다 (날 때만 기운다). 나는 동안엔 속도만큼 짧은 꼬리 + 화면에 옅은 잔상이 남아
     픽셀이 코드·블럭으로 바뀌고 되돌아가는 움직임이 눈에 잘 들어온다.
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
  DataTexture, FramebufferTexture, RGBAFormat, FloatType, HalfFloatType, NearestFilter, LinearMipmapLinearFilter, NoBlending, Vector2, Vector3, Matrix4, Euler
} from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';

const INTRO_END = 3.3, INTRO_RATE = 1.2;   /* 입장 시계 배율: 모든 입장 시각(초)을 이만큼 빨리 — 1.2 = 전체가 같은 비율로 약 0.5초 짧게 (사용자 2026-10-07) */
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
  float dl = length(desired); if (dl > 70.0) desired *= 70.0 / dl;
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

/* 첫 입장 (위치는 시간으로 바로 계산 — 시뮬레이션 밖, 큐브는 이미 제자리에 있다):
   field — 큐브 5% 가 크기 제각각인 정육면체로 굴러가며 0.15초 떠 있다가 1.7초 가속(속도 ∝ 진행² — 초점이 맞아 가는 동안 이미 앞으로 나아간다). 카메라를 지나치면 저 멀리서
           새 자리·새 크기로 다시 나타나 양이 일정하다. 막판 0.45초는 촥 빨려 들며(∝ 진행²) 다시 나타나지 않고 다 지나가 버린다.
           꼬리 = 큐브가 직전 0.08초 동안 실제로 지나온 길 (그 시각 위치를 다시 계산해 뒷면을 그곳에 둔다) → 프레임 사이가 끊기지 않는 잔상.
   land  — 로고 칸(4×4 큐브 한 덩어리)이 통째로 제자리 바로 뒤 먼 곳(-300)에서 z 축을 따라 날아와 급제동(진행⁴)하며 박힌다.
           원근 때문에 소실점에서 튀어나와 바깥으로 펼쳐지는 것처럼 보이고, 순서도 가운데부터 바깥으로. 박히는 순간 살짝 번쩍이며 툭 */
const FIELD = /* glsl */`
const float F_FLOAT = 0.15, F_ACC = 1.7, F_SUCK = 0.45, F_RANGE = 240.0, F_VMAX = 480.0, F_VTOP = 1700.0;
const float L_START = 2.05, L_SPREAD = 0.38, L_DUR = 0.6, L_DEPTH = 300.0, TRAIL = 0.08, INTRO_END = ${INTRO_END.toFixed(2)};
float fh(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(fh(i), fh(i + vec2(1.0, 0.0)), f.x), mix(fh(i + vec2(0.0, 1.0)), fh(i + 1.0), f.x), f.y); }
float fdist(float T){                                                                     /* 카메라가 앞으로 나아간 거리 (떠 있다가 가속 → 빨려 듦) */
  float ta = clamp(T, 0.0, F_FLOAT + F_ACC), ua = clamp((ta - F_FLOAT) / F_ACC, 0.0, 1.0), us = clamp((T - F_FLOAT - F_ACC) / F_SUCK, 0.0, 1.0);
  return 3.0 * ta + (F_VMAX - 3.0) * F_ACC * ua * ua * ua / 3.0 + F_VMAX * F_SUCK * us + (F_VTOP - F_VMAX) * F_SUCK * us * us * us / 3.0;
}
vec3 field(vec2 id, float T, out vec3 size, out float bright, out vec4 rot, out float cyc){   /* T: 입장 시각 (꼬리는 조금 전 시각으로 다시 부른다) */
  float dist = fdist(T);
  float r0 = fh(id * 297.0 + 3.3), c = r0 * F_RANGE + dist, k = floor(c / F_RANGE), fr = fract(c / F_RANGE);
  float ks = floor((r0 * F_RANGE + 3.0 * (F_FLOAT + F_ACC) + (F_VMAX - 3.0) * F_ACC / 3.0) / F_RANGE);   /* 빨려 들기 시작할 때의 바퀴 */
  float z = uCamZ + 1.0 - F_RANGE + fr * F_RANGE;                                         /* 멀리서 카메라 뒤까지 한 바퀴 */
  vec2 kid = id + k * 0.137;
  float r1 = fh(kid * 711.0), r2 = fh(kid * 1373.0 + 7.1), r5 = fh(kid * 419.0 + 5.5), r4 = fh(id * 911.0 + 1.9), r6 = fh(kid * 157.0 + 2.7), r7 = fh(kid * 883.0 + 9.4);
  float spawn = k < 0.5 ? max(F_RANGE * (1.0 - r0), 3.0) : F_RANGE;                      /* 처음엔 제 깊이에(렌즈 바로 앞까지), 다음 바퀴부턴 맨 끝에서 화면 고르게 */
  vec2 xy = (vec2(r1, r2) * 2.0 - 1.0) * spawn * uTanH * vec2(uAsp, 1.0) * 1.1
          + (vec2(r6, r7) - 0.5) * (0.12 * fr * F_RANGE + 1.2 * sin(T * 0.7 + r6 * 6.28));   /* 큐브마다 조금씩 비스듬히 흘러 결이 다양하다 */
  size = vec3(0.25 * (0.7 + 2.6 * r5 * r5) * step(r4, 0.05) * step(k, ks));             /* 빨려 든 뒤엔 다시 나타나지 않는다 */
  if (k < 0.5 && r0 > 0.85) size *= step(r6, 0.15);                                          /* 렌즈 바로 앞 큰 큐브는 몇 개만 (초점 밖이라 흐린 덩어리) */
  size *= smoothstep(2.0, 16.0, uCamZ - z);                                                /* 렌즈에 가까울수록 작아져 화면을 덮지 않는다 (구멍 뚫는 점묘는 첫 화면에 치직거려 뺐다) */
  bright = smoothstep(0.0, 0.3, T); cyc = k;
  rot = vec4(normalize(vec3(r1, r2, r5) - 0.5 + 1e-3), (r5 - 0.5) * 6.0 + uTime * (0.6 + 1.6 * r1));   /* 굴러가는 축·각 */
  return vec3(xy, z);
}
/* 모니터 속으로 (?intro=pc): 어둠 속 작은 화면에 로고 픽셀 → 브라운관처럼 가로줄로 켜졌다 위아래로 열림 → 카메라가 다가가 화면을 뚫고 들어가면
   회로처럼 격자로 늘어선 큐브 벽의 데이터 복도(깊을수록 넓어진다, 라임 패킷이 흐르고 빛 고리가 깊은 쪽으로 퍼진다) → 복도를 빠져나오면 로고가 날아와 박힌다.
   복도는 화면을 뚫은 뒤에만 보인다 (앞에서 보이면 화면 둘레가 지저분한 덩어리였다) */
const float S_DIST = 80.0, S_H = 6.5, S_W = 8.7, S_K = 0.33, TUN_L = 274.0, TG = 1.1;
vec3 pcPose(vec2 id, float front, vec3 gp, float T, float inside, inout vec3 size, out float glow, out float dim){
  float zs = uCamZ - S_DIST + fdist(T);                                                    /* 화면 면 */
  glow = 0.0; dim = 1.0;
  if (front > 0.5) { size *= S_K; return vec3(gp.xy * S_K, zs); }                          /* 앞면 큐브 = 화면 속 로고 픽셀 */
  float r0 = fh(id * 131.0 + 0.7), r1 = fh(id * 517.0 + 2.3), r2 = fh(id * 271.0 + 9.1), r3 = fh(id * 733.0 + 4.4), on = step(fh(id * 977.0 + 3.3), 0.08);
  if (inside < 0.5) {                                                                      /* 화면을 뚫기 전: 로고 뒤 꺼진 화면 픽셀 격자 + 밝은 테두리 */
    vec2 g = floor(vec2((r2 * 2.0 - 1.0) * S_W, (r1 * 2.0 - 1.0) * S_H) / 0.55 + 0.5) * 0.55;
    float edge = step(S_W - 0.6, abs(g.x)) + step(S_H - 0.6, abs(g.y));
    size = vec3(0.16 + 0.12 * min(edge, 1.0)) * on; dim = mix(0.2, 0.9, min(edge, 1.0));
    return vec3(g, zs - 0.8);
  }
  float di = floor(r0 * TUN_L / TG) * TG, fl = 1.0 + 2.2 * smoothstep(0.0, 60.0, di);       /* 화면 바로 뒤는 화면 크기, 깊을수록 넓어진다 */
  float u = r2 * 2.0 - 1.0, o = r3 * 0.8;
  vec2 xy = r1 < 0.25 ? vec2(S_W * fl + o, u * S_H * fl) : r1 < 0.5 ? vec2(-S_W * fl - o, u * S_H * fl) : r1 < 0.75 ? vec2(u * S_W * fl, S_H * fl + o) : vec2(u * S_W * fl, -S_H * fl - o);
  xy = floor(xy / TG + 0.5) * TG;                                                          /* 회로판처럼 격자에 맞춘다 */
  float pk = step(fh(id * 389.0 + 1.1), 0.07);
  size = vec3(TG * (0.38 + 0.3 * r3)) * on;                                               /* 옆면 큐브 8% 가 (화면 격자 →) 복도 벽 */
  glow = pk * 0.85 + 0.6 * exp(-pow((mod(di - T * 150.0, 40.0) - 20.0) / 1.6, 2.0));      /* 라임 패킷 + 깊은 쪽으로 퍼지는 빛 고리 */
  return vec3(xy, zs - di + pk * max(T - 1.2, 0.0) * 60.0);                                /* 패킷은 복도에 들어선 뒤 벽보다 빨리 흘러온다 */
}
float cellT(vec2 p){ vec2 c = floor(p) + 0.5; return L_START + L_SPREAD * clamp(0.7 * length(c) / 23.0 + 0.3 * vn2(c * 0.21 + 3.1), 0.0, 1.0); }`;

/* 큐브 하나 = 픽셀 하나. 위치는 시뮬레이션, 칸 단위 움직임(숨쉬기·튀어나옴·물결·빛)은 칸 텍스처에서 */
const CUBE_VS = /* glsl */`
uniform sampler2D tPos, tVel, tCell;
uniform mat4 uModel;
uniform float uScale, uTime, uIT, uCamZ, uTanH, uAsp, uPC;
attribute vec4 aRef;   /* xy 시뮬레이션 uv · z 칸 u · w 깊이 AO */
attribute vec4 aSize;  /* xyz 큐브 크기 · w 무작위 */
attribute float aAppear;
varying vec3 vN, vW, vBox, vAx, vAy, vAz;
varying float vAo, vGlow, vSeed, vRise, vFlash, vBev, vTail, vStr;
${FIELD}
mat3 rotAxis(vec3 a, float t){ float c = cos(t), s = sin(t), o = 1.0 - c;
  return mat3(c + a.x * a.x * o, a.y * a.x * o + a.z * s, a.z * a.x * o - a.y * s, a.x * a.y * o - a.z * s, c + a.y * a.y * o, a.z * a.y * o + a.x * s, a.x * a.z * o + a.y * s, a.y * a.z * o - a.x * s, c + a.z * a.z * o); }
void main(){
  vec4 P = texture2D(tPos, aRef.xy), V = texture2D(tVel, aRef.xy);
  vec4 C0 = texture2D(tCell, vec2(aRef.z, 0.25)), C1 = texture2D(tCell, vec2(aRef.z, 0.75));
  float s = aSize.w, tilt = clamp(length(V.xyz) * 0.04, 0.0, 1.0);                    /* 나는 동안만 기울고, 멈추면 반듯하게 */
  float u = clamp((uTime - aAppear) / 0.6, 0.0, 1.0), e = 1.0 - (1.0 - u) * (1.0 - u) * (1.0 - u), lit = step(aAppear, uTime);
  vec3 base = vec3(P.xy, P.z * e) + C0.xyz, size = aSize.xyz * vec3(mix(0.8, 1.0, e), mix(0.8, 1.0, e), mix(0.04, 1.0, e)) * lit * (1.0 - C1.x);   /* C1.x: 02 챕터 코드 조각으로 바뀌며 사라짐 */
  float bright = smoothstep(0.0, 0.4, u) * lit, flash = 0.0, bev = 0.3, glowV = C0.w;
  vec3 tailB = base - V.xyz * 0.008;                                                      /* 꼬리 끝: 챕터 전환 땐 반 프레임 전 자리 (180° 셔터) (멈추면 꼬리 없음), 입장 땐 아래에서 */
  vec3 ax = normalize(vec3(fract(s * 7.13), fract(s * 3.37), fract(s * 5.71)) - 0.5 + 1e-3);
  mat3 R = rotAxis(ax, tilt * ((s - 0.5) * 5.0 + sin(uTime * (1.5 + s * 2.5) + s * 40.0) * 1.2));
  if (uIT >= 0.0 && uIT < INTRO_END) {
    float tl = cellT(P.xy);
    if (uIT < tl && uPC > 0.5) {                                                          /* 모니터 속으로 */
      float front = step(0.999, aRef.w), wO = smoothstep(0.1, 0.2, uIT), hO = smoothstep(0.2, 0.5, uIT), g2, dm, d2; vec3 st = size, gp = base;
      float inside = step(uCamZ - 0.4, uCamZ - S_DIST + fdist(uIT));                     /* 화면 면이 카메라를 지나쳤으면 1 = 화면을 뚫고 들어옴 (머리·꼬리 같은 역할로) */
      base = pcPose(aRef.xy, front, gp, uIT, inside, size, glowV, dm);
      tailB = mix(base, pcPose(aRef.xy, front, gp, uIT - TRAIL, inside, st, g2, d2), 0.4);   /* 꼬리는 짧게 (다가갈 때 로고가 깔때기처럼 번졌다) */
      float m = front > 0.5 || inside < 0.5 ? step(abs(base.x), wO * S_W + 0.01) * step(abs(base.y), max(hO * S_H, 0.25 * wO) + 0.01) : 1.0;   /* 브라운관 켜짐: 가운데 가로줄이 옆으로 → 위아래로 */
      bright = dm * (1.0 + 2.5 * (1.0 - hO) * wO * (1.0 - inside));                       /* 가로줄일 땐 밝게 번쩍 */
      size *= m * step(base.z, uCamZ - 0.6); bev = 1.0;                                    /* 가린 큐브·지나친 큐브는 크기 0 (밝기만 0 이면 반사광·라임이 샜다) */
      if (inside < 0.5) glowV = 0.0;
    } else if (uIT < tl) {                                                                /* 스쳐 가는 큐브 */
      vec4 rot, rt; vec3 st; float bt, k0, k1;
      base = field(aRef.xy, uIT, size, bright, rot, k0);
      tailB = field(aRef.xy, uIT - TRAIL, st, bt, rt, k1);
      if (k1 != k0) tailB = base;                                                         /* 막 다시 나타난 큐브는 꼬리 없이 */
      R = rotAxis(rot.xyz, rot.w * (1.0 - smoothstep(0.5, 3.0, distance(base, tailB) / max(size.x, 1e-3))));   /* 빨라질수록 굴림이 풀려 진행 방향으로 반듯하게 (꼬리가 비틀리지 않게) */
      bev = 1.0;
    } else {                                                                              /* 로고 칸: 뒤에서 날아와 급제동하며 박힌다 */
      float p = clamp((uIT - tl) / L_DUR, 0.0, 1.0), q = 1.0 - p, a = uIT - tl - L_DUR, zo = -L_DEPTH * q * q * q * q;
      float qt = 1.0 - clamp((uIT - tl - TRAIL) / L_DUR, 0.0, 1.0);
      tailB = base - vec3(0.0, 0.0, L_DEPTH * qt * qt * qt * qt);
      if (a > 0.0) { zo += 0.22 * sin(min(a / 0.3, 1.0) * 3.14159) * exp(-a * 6.0); flash = exp(-a * 11.0); }
      base.z += zo; bev = mix(1.0, 0.3, smoothstep(0.0, 0.25, a)); bright *= smoothstep(0.0, 0.12, p);
    }
  }
  vec3 lp = R * (position * size);
  float hd = step(0.0, position.z);                                                       /* 앞면 꼭짓점은 지금 자리, 뒷면은 꼬리 끝 → 지나온 길을 덮는 기둥. 회전 전 좌표로 나눠 굴러도 꼭짓점이 앞뒤를 오가지 않는다 (꼬리가 갑자기 뒤집히던 버그) */
  vTail = hd; vStr = clamp(distance(base, tailB) / (3.0 * max(size.x, 1e-3)), 0.0, 0.95);   /* 꼬리 끝일수록 어둡게 = 잔상 */
  vec4 w = uModel * vec4((mix(tailB, base, hd) + lp) * uScale, 1.0);
  mat3 MR = mat3(uModel) * R;
  vW = w.xyz; vN = MR * normal; vBox = position; vAx = MR[0]; vAy = MR[1]; vAz = MR[2];
  vAo = aRef.w; vGlow = glowV; vSeed = s; vRise = bright; vFlash = flash; vBev = bev;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const CUBE_FS = /* glsl */`
uniform vec3 uAlb, uKey;
uniform float uFlat, uNOff, uBias, uRef, uAmb, uHead, uCamD, uShK;
uniform vec3 uHeadOff;
varying vec3 vN, vW, vBox, vAx, vAy, vAz;
varying float vAo, vGlow, vSeed, vRise, vFlash, vBev, vTail, vStr;
${LIGHT}
void main(){
  vec3 q = vBox * 2.0, f = smoothstep(vec3(0.8), vec3(1.0), abs(q)) * sign(q);         /* 베벨: 모서리 쪽으로 법선을 기울여 모서리에 빛이 걸린다 */
  vec3 n = normalize(normalize(vN) + (f.x * vAx + f.y * vAy + f.z * vAz) * 0.55 * vBev);
  vec3 V = normalize(cameraPosition - vW), Lw = normalize(mix(uL, normalize(V + uHeadOff), uHead));   /* uHead: 카메라에 달린 조명 (첫 챕터) */
  float att = mix(1.0, clamp(pow(uCamD / max(distance(cameraPosition, vW), 1.0), 2.0), 0.0, 1.8), uHead);   /* 헤드라이트: 가까울수록 밝다 */
  float sh = mix(1.0, pcss(vW + normalize(vN) * uNOff, uBias), uShK), ndl = max(dot(n, Lw), 0.0);
  ndl = mix(ndl, max(ndl, 0.8), vStr);                                                    /* 꼬리 옆면도 앞면만큼 밝게 (움직임 흐림 = 물체 색이 고르게 번진 것) — 끊긴 구슬처럼 보이지 않게 */
  float hemi = uAmb * (0.6 + 0.4 * (n.y * 0.5 + 0.5)) * vAo;
  float shade = (uLI * ndl * sh * spot(vW) * att + hemi * mix(1.0, min(att, 1.0), uHead)) / uRef * vRise;   /* 빛을 정면으로 받는 앞면 = 1 → 로고 파일 색 그대로 */
  vec3 H = normalize(Lw + V);
  float spec = pow(max(dot(n, H), 0.0), 60.0) * (0.08 + 0.25 * vBev) * ndl * sh;
  vec3 col = (uAlb * uLCol * shade * (0.98 + 0.04 * fract(vSeed * 13.71)) + spec * uLCol) * (1.0 + vFlash * 0.4) * mix(1.0, smoothstep(0.0, 1.0, vTail), vStr);
  col = mix(col, uKey * (1.0 + 0.4 * ndl), clamp(vGlow, 0.0, 0.85));                    /* 03 챕터 데이터 패킷 */
  vec3 c = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2)) + (ign(gl_FragCoord.xy + 17.0) - 0.5) / 255.0;
  gl_FragColor = vec4(mix(c, vec3(0.627), uFlat), 1.0);                                  /* 01 챕터: 모든 면을 로고 색 하나로 */
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
uniform float uScale, uTime, uIT;
attribute vec4 aRef;
attribute vec4 aSize;
attribute float aAppear;
void main(){
  if (uIT >= 0.0 && uIT < ${INTRO_END.toFixed(2)}) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }      /* 입장 중엔 그림자 없음 (끝나면 서서히 드러난다) */
  vec4 P = texture2D(tPos, aRef.xy), C0 = texture2D(tCell, vec2(aRef.z, 0.25)), C1 = texture2D(tCell, vec2(aRef.z, 0.75));
  float u = clamp((uTime - aAppear) / 0.6, 0.0, 1.0), e = 1.0 - (1.0 - u) * (1.0 - u) * (1.0 - u);
  vec3 grow = vec3(mix(0.8, 1.0, e), mix(0.8, 1.0, e), mix(0.04, 1.0, e)) * step(aAppear, uTime);
  gl_Position = projectionMatrix * viewMatrix * uModel * vec4((vec3(P.xy, P.z * e) + C0.xyz + position * aSize.xyz * grow * (1.0 - C1.x)) * uScale, 1.0);
}`;

/* 입장 화면 효과 (입장 동안만): 초점 + 빨려 들 때 소실점으로 모이는 방사 블러 + 잔상.
   초점 — 화면 전체가 고르게 살짝 흐렸다가 1초 안에 맞는다 (밉맵에서 미리 흐린 이미지를 몇 번 읽어 섞는다 — 무작위 표본이 없어 치직거리지 않는다).
          지나가는 큐브의 흐림은 큐브 꼬리(지나온 길)가 맡는다.
   잔상 — 지난 화면을 조금씩 어둡게 해 지금 화면과 밝은 쪽을 남긴다 (사람 눈의 잔상처럼 지나간 자리에 빛이 남는다) */
const QUAD_VS = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const POST_FS = /* glsl */`
uniform sampler2D tC, tPrev;
uniform vec2 uPx, uVP;
uniform float uBlur, uZoom, uDamp, uFZ;
varying vec2 vUv;
vec2 vogel(int i, int n){ float r = sqrt((float(i) + 0.5) / float(n)), t = float(i) * 2.39996323; return r * vec2(cos(t), sin(t)); }
void main(){
  vec4 col = texture2D(tC, vUv);
  if (uBlur > 0.3 || uZoom > 1e-4) {
    float lod = log2(max(uBlur * 0.5, 1.0));
    col = textureLod(tC, vUv, lod);
    for (int i = 0; i < NT; i++) col += textureLod(tC, vUv + vogel(i, NT) * uBlur * uPx + (uVP - vUv) * uZoom * (float(i) + 0.5) / float(NT), lod);
    col /= float(NT + 1);
  }
  gl_FragColor = max(col, max(texture2D(tPrev, uVP + (vUv - uVP) * (1.0 - uFZ)) * uDamp - 0.002, 0.0));   /* 지난 화면을 소실점에서 바깥으로 살짝 키워 흘려보낸다 (피드백) */
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
  const simU = { uTime: { value: 0 }, uDt: { value: 1 / 60 }, uSnap: { value: 1 }, uRamp: { value: 0.15 }, tA: { value: tA }, tB: { value: tB } };
  Object.assign(velVar.material.uniforms, simU);
  Object.assign(posVar.material.uniforms, simU);
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
  const appear = new InstancedBufferAttribute(new Float32Array(n).fill(-10), 1);
  geo.setAttribute('aRef', new InstancedBufferAttribute(aRef, 4)); geo.setAttribute('aSize', new InstancedBufferAttribute(aSize, 4)); geo.setAttribute('aAppear', appear);
  geo.instanceCount = n;
  const cubeMat = new ShaderMaterial({
    vertexShader: CUBE_VS, fragmentShader: CUBE_FS, defines: { NB: 12, NP: 24 },
    uniforms: { ...common, tPos: posTex, tVel: velTex, tCell: { value: tCell }, uNOff: { value: 0.1 }, uBias: { value: 0.03 }, uHead: { value: 0 }, uCamD: { value: 72 }, uShK: { value: 1 }, uHeadOff: { value: new Vector3(-0.3, 0.42, 0) }, uIT: { value: -1 }, uPC: { value: /[?&]intro=pc\b/.test(location.search) ? 1 : 0 }, uCamZ: { value: 72 }, uTanH: { value: 0.35 }, uAsp: { value: 1.6 },
      uAlb: { value: new Vector3(0.3567, 0.3567, 0.3567) }, uRef: { value: 2 }, uAmb: { value: 0.35 },   /* uAlb = #A0A0A0 (선형) */
      uKey: { value: new Vector3(0.905, 1.0, 0.087) } }
  });
  const cubes = new Mesh(geo, cubeMat); cubes.frustumCulled = false;
  const wallMat = new ShaderMaterial({
    vertexShader: WALL_VS, fragmentShader: WALL_FS, defines: { NB: 12, NP: 20 }, transparent: true, premultipliedAlpha: true, depthWrite: false,
    uniforms: { ...common, uWallZ: { value: -5.5 }, uBiasW: { value: 0.05 } }
  });
  const wall = new Mesh(new PlaneGeometry(600, 400), wallMat); wall.frustumCulled = false; wall.renderOrder = -1;
  const NEUTRAL = new Vector3(1, 1, 1);
  let introS = null, post = null;
  const quadMat = { depthTest: false, depthWrite: false, blending: NoBlending };
  const postMat = new ShaderMaterial({ ...quadMat, vertexShader: QUAD_VS, fragmentShader: POST_FS, defines: { NT: small ? 8 : 12 },
    uniforms: { tC: { value: null }, tPrev: { value: null }, uPx: { value: new Vector2() }, uVP: { value: new Vector2() }, uBlur: { value: 0 }, uZoom: { value: 0 }, uDamp: { value: 0 }, uFZ: { value: 0 } } });
  const copyMat = new ShaderMaterial({ ...quadMat, vertexShader: QUAD_VS, fragmentShader: 'uniform sampler2D tC; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tC, vUv); }', uniforms: { tC: { value: null } } });
  const quad = new Mesh(new PlaneGeometry(2, 2), postMat); quad.frustumCulled = false;
  const quadScene = new Scene(); quadScene.add(quad);
  const dbs = new Vector2(), vp = new Vector3();
  /* 챕터 전환 잔상: 지난 화면을 반쯤 어둡게 먼저 깔고 그 위에 지금 장면 → 화면을 복사해 다음 프레임의 잔상으로 (지금 큐브 뒤로만 남는다) */
  let ghost = null;
  const ghostMat = new ShaderMaterial({ ...quadMat, vertexShader: QUAD_VS, fragmentShader: 'uniform sampler2D tC; uniform float uDamp; varying vec2 vUv; void main(){ gl_FragColor = max(texture2D(tC, vUv) * uDamp - 1.0 / 255.0, 0.0); }', uniforms: { tC: { value: null }, uDamp: { value: 0 } } });
  function freePost(){ if (post) { [post.scene, ...post.acc].forEach(r => r.dispose()); post = null; } }
  const scene = new Scene(); scene.add(wall, cubes);
  const depthMat = new ShaderMaterial({ vertexShader: DEPTH_VS, fragmentShader: 'void main(){ gl_FragColor = vec4(1.0); }', colorWrite: false,
    uniforms: { tPos: posTex, tVel: velTex, tCell: { value: tCell }, uModel: common.uModel, uScale: common.uScale, uTime: common.uTime, uIT: { value: -1 } } });
  const shadowCubes = new Mesh(geo, depthMat); shadowCubes.frustumCulled = false;
  const shadowScene = new Scene(); shadowScene.add(shadowCubes);

  const camera = new PerspectiveCamera(30, 1, 1, 600);
  /* 셰이더를 미리 준비 (첫 장면 다음 프레임이 0.2초 멈춰 입장이 튀었다) */
  renderer.compile(scene, camera); renderer.compile(shadowScene, lightCam);
  for (const m of [copyMat, ghostMat, postMat]) { quad.material = m; renderer.compile(quadScene, camera); }
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
    /* 첫 입장: 모두 셰이더가 시간으로 그린다 (큐브는 setTargets snap 으로 이미 제자리). 반환: land = 제목·헤더가 올라오는 시각 */
    intro(t){
      appear.array.fill(-10); appear.needsUpdate = true;
      introS = { t0: t, clock: 0, last: null };
      const v = renderer.getDrawingBufferSize(dbs), rt = (o) => new WebGLRenderTarget(v.x, v.y, o);
      freePost(); post = { scene: rt({ samples: 4, generateMipmaps: true, minFilter: LinearMipmapLinearFilter }), acc: [rt({ type: HalfFloatType }), rt({ type: HalfFloatType })], i: 0 };
      return { land: t + 2.65 / INTRO_RATE, end: t + INTRO_END / INTRO_RATE };
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
      common.uLI.value = 2.6; common.uLCol.value.copy(NEUTRAL);
      if (introS) { if (introS.last !== null) introS.clock += Math.min(Math.max(t - introS.last, 0), 1 / 30) * INTRO_RATE; introS.last = t; }   /* 입장 시계는 프레임마다 최대 1/30초씩 — 멈칫한 프레임이 있어도 장면을 건너뛰지 않는다 */
      const cu = cubeMat.uniforms, it = introS ? introS.clock : -1;
      cu.uIT.value = depthMat.uniforms.uIT.value = it; cu.uCamZ.value = D / st.s; cu.uTanH.value = H / 2 / F; cu.uAsp.value = W / H;
      if (introS && it > INTRO_END + 0.5) introS = null;
      if (post && !(it < INTRO_END)) freePost();
      cu.uHead.value = st.head || 0; cu.uCamD.value = D; cu.uShK.value = it < 0 ? 1 : Math.min(1, Math.max(0, (it - INTRO_END) / 0.5));   /* 입장 뒤 그림자가 서서히 */
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
      if (!post) {
        renderer.setRenderTarget(null);
        const gk = Math.min(1, Math.max(0, (simUntil - 0.8 - t) / 0.6));                   /* 큐브가 나는 동안만, 다 내려앉을 즈음 서서히 꺼진다 */
        if (gk <= 0 || it >= 0) { if (ghost) { ghost.dispose(); ghost = null; } renderer.render(scene, camera); return; }
        const v = renderer.getDrawingBufferSize(dbs);
        if (!ghost || ghost.image.width !== v.x || ghost.image.height !== v.y) { if (ghost) ghost.dispose(); ghost = new FramebufferTexture(v.x, v.y); ghostMat.uniforms.uDamp.value = 0; }
        else ghostMat.uniforms.uDamp.value = Math.pow(0.4, dt * 60) * gk;                     /* 아주 약하게: 한 프레임마다 60%씩 사라진다 */
        renderer.autoClear = false; renderer.clear();
        ghostMat.uniforms.tC.value = ghost; quad.material = ghostMat; renderer.render(quadScene, camera);
        renderer.render(scene, camera);
        renderer.copyFramebufferToTexture(ghost); renderer.autoClear = true;
        return;
      }
      /* 입장: 장면 → 초점·방사 블러·잔상 → 화면 */
      const v = renderer.getDrawingBufferSize(dbs), ss = (a, b, x) => { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
      if (post.scene.width !== v.x || post.scene.height !== v.y) [post.scene, ...post.acc].forEach(r => r.setSize(v.x, v.y));
      renderer.setRenderTarget(post.scene); renderer.render(scene, camera);
      const pu = postMat.uniforms, src = post.acc[post.i], dst = post.acc[1 - post.i];
      const sk = Math.max(0, Math.min(1, (it - 1.85) / 0.55));
      pu.tC.value = post.scene.texture; pu.tPrev.value = src.texture; pu.uPx.value.set(1 / v.x, 1 / v.y);
      pu.uBlur.value = v.y * 0.0065 * (1 - ss(0.1, 1.1, it));                                                       /* 초점: 화면 전체가 살짝 나갔다가(약 5px) 1초 안에 맞는다 */
      pu.uZoom.value = 0.09 * Math.pow(Math.sin(Math.PI * sk), 1.5);                                                  /* 빨려 들 때 소실점으로 */
      const dm = 0.55 + 0.33 * ss(0.4, 1.85, it) + 0.06 * Math.sin(Math.PI * sk), fade = 1 - ss(2.4, 3.0, it), f60 = dt * 60;
      pu.uDamp.value = Math.pow(Math.min(0.62, Math.max(0, 1 - (1 - dm) / 0.6)), f60) * fade;     /* 화면 잔상은 은은하게만 (길이는 큐브 꼬리가 맡는다 — 끊기지 않게), 로고가 서면 사라진다. 120Hz 화면에서도 같게 */
      pu.uFZ.value = (0.002 + 0.007 * ss(0.6, 1.85, it) + 0.012 * Math.sin(Math.PI * sk)) * f60 * fade;            /* 피드백이 흐르는 속도 = 날아가는 속도를 따라 */
      vp.set(0, 0, -1).transformDirection(model).multiplyScalar(1e4).add(camera.position).project(camera); pu.uVP.value.set(vp.x * 0.5 + 0.5, vp.y * 0.5 + 0.5);
      quad.material = postMat; renderer.setRenderTarget(dst); renderer.render(quadScene, camera);
      copyMat.uniforms.tC.value = dst.texture; quad.material = copyMat; renderer.setRenderTarget(null); renderer.render(quadScene, camera);
      post.i = 1 - post.i;
    },
    dispose(){
      gpu.dispose(); shadowRT.dispose(); tA.dispose(); tB.dispose(); tCell.dispose(); box.dispose(); geo.dispose();
      cubeMat.dispose(); wallMat.dispose(); depthMat.dispose(); wall.geometry.dispose(); freePost(); if (ghost) ghost.dispose(); ghostMat.dispose(); postMat.dispose(); copyMat.dispose(); quad.geometry.dispose(); renderer.dispose();
    }
  };
}
