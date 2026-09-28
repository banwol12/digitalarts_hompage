import React, { useEffect, useRef } from 'react';

const GRID = [
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

const TOKENS = [
  'float', 'int', 'auto', 'nullptr', 'std::vector', 'std::sin(t)',
  'class Particle', 'update(dt)', 'const float dt', '#include <cmath>',
  'pos += vel * dt', 'template<T>', 'new Pixel[n]', 'return pos;',
  'def render():', 'import numpy', 'np.zeros(n)', 'self.vel += g',
  'lambda x: x * x', 'async def loop', 'yield frame', 'range(len(px))',
  'True', 'None', 'print(fps)', '__main__', 'for i in range', 'dt = 1 / 60'
];

const VS = {
  ctrl: '#C586C0',
  type: '#569CD6',
  fn: '#DCDCAA',
  num: '#B5CEA8',
  str: '#CE9178',
  vari: '#9CDCFE',
  td: '#4EC9B0',
  punc: '#D4D4D4'
};

const KW_CTRL = { for: 1, if: 1, else: 1, return: 1, while: 1, import: 1, yield: 1, async: 1, await: 1, include: 1, new: 1, in: 1 };
const KW_TYPE = { float: 1, int: 1, void: 1, const: 1, auto: 1, class: 1, def: 1, template: 1, typename: 1, nullptr: 1, True: 1, None: 1, lambda: 1, self: 1, vector: 1 };
const KW_NS = { std: 1, np: 1, numpy: 1, Particle: 1, Pixel: 1, T: 1 };

function lexParts(tok) {
  const re = /(#[0-9A-Fa-f]{3,6}\b)|("[^"]*"|'[^']*')|(0x[0-9A-Fa-f]+|\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|(.)/g;
  let m;
  const parts = [];
  while ((m = re.exec(tok))) {
    if (m[1]) parts.push([m[1], VS.str]);
    else if (m[2]) parts.push([m[2], VS.str]);
    else if (m[3]) parts.push([m[3], VS.num]);
    else if (m[4]) {
      const w = m[4];
      const nx = tok.charAt(re.lastIndex);
      parts.push([w, KW_CTRL[w] ? VS.ctrl : KW_TYPE[w] ? VS.type : KW_NS[w] ? VS.td : nx === '(' ? VS.fn : VS.vari]);
    } else if (m[5]) parts.push([m[5], VS.punc]);
    else parts.push([m[6], VS.punc]);
  }
  return parts;
}

export default function SceneCanvas({ chapter = 0 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const boxes = [];
    const CX = 17, CY = 17, R = 17.7;
    const KINDS = ['code', 'none', 'code', 'none', 'none', 'code', 'none', 'none'];

    GRID.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        if (row[c] !== '#') continue;
        const x = c + 0.5 - CX;
        const y = r + 0.5 - CY;
        const d = Math.sqrt(x * x + y * y);
        const bulge = Math.sqrt(Math.max(0, 1 - (d * d) / (R * R)));
        const ang = Math.random() * Math.PI * 2;
        const mag = 24 + Math.random() * 30;
        const seed = Math.random();
        const seed2 = Math.random();
        const tok = TOKENS[Math.floor(seed2 * TOKENS.length)];
        boxes.push({
          gx: x,
          gy: y,
          h: 0.5 + 1.3 * bulge,
          r,
          c,
          seed,
          seed2,
          kind: KINDS[Math.floor(seed * KINDS.length)],
          token: tok,
          parts: lexParts(tok),
          rot: seed * 6.283,
          cur: { x: Math.cos(ang) * mag, y: Math.sin(ang) * mag, z: (Math.random() - 0.5) * 40 },
          vx: 0,
          vy: 0,
          vz: 0
        });
      }
    });

    let mouseX = 0, mouseY = 0;
    let targetYaw = 0, targetPitch = -0.08;
    let curYaw = 0, curPitch = -0.08;

    const handleMouseMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX = nx;
      mouseY = ny;
      targetYaw = nx * 0.35;
      targetPitch = -0.08 + ny * 0.25;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    let t = 0;

    const render = () => {
      t += 0.016;
      ctx.clearRect(0, 0, width, height);

      curYaw += (targetYaw - curYaw) * 0.05;
      curPitch += (targetPitch - curPitch) * 0.05;

      const fov = Math.min(width, height) * 0.95;
      const hw = width / 2;
      const hh = height / 2;

      // Render boxes sorted by Z depth
      const cy = Math.cos(curYaw), sy = Math.sin(curYaw);
      const cp = Math.cos(curPitch), sp = Math.sin(curPitch);

      // Morph modifier based on current chapter
      // Chapter 0: tightly formed 3D logo
      // Chapter 1: slightly angled
      // Chapter 2: floating burst
      // Chapter 3: wide grid
      // Chapter 4: orbiting
      // Chapter 5: calm
      const burstFactor = chapter === 2 ? 1.8 : chapter === 4 ? 1.2 : 1.0;
      const scatterZ = chapter === 2 ? 12 : 2;

      const renderedBoxes = boxes.map((b) => {
        // Position interpolation
        const tx = b.gx * burstFactor;
        const ty = b.gy * burstFactor;
        const tz = Math.sin(t * 1.5 + b.seed * 6.28) * scatterZ;

        b.cur.x += (tx - b.cur.x) * 0.04;
        b.cur.y += (ty - b.cur.y) * 0.04;
        b.cur.z += (tz - b.cur.z) * 0.04;

        // 3D Rotation
        const x1 = b.cur.x * cy - b.cur.z * sy;
        const z1 = b.cur.x * sy + b.cur.z * cy;
        const y2 = b.cur.y * cp - z1 * sp;
        const z2 = b.cur.y * sp + z1 * cp + 45; // camera distance

        const scale = fov / Math.max(z2, 10);
        const px = hw + x1 * scale;
        const py = hh + y2 * scale;
        const sz = Math.max(1, 14 * (scale / 22));

        return { b, px, py, sz, z: z2 };
      });

      // Sort by Z for proper depth
      renderedBoxes.sort((a, b) => b.z - a.z);

      renderedBoxes.forEach(({ b, px, py, sz, z }) => {
        if (px < -sz || px > width + sz || py < -sz || py > height + sz) return;

        const alpha = Math.max(0.15, Math.min(0.9, (60 - z) / 40));

        if (b.kind === 'code' && sz > 8) {
          // Render code pill
          ctx.save();
          ctx.font = `500 ${Math.max(9, Math.floor(sz * 0.85))}px "Pretendard", monospace`;
          ctx.fillStyle = `rgba(18, 18, 22, ${alpha * 0.85})`;
          ctx.strokeStyle = `rgba(233, 234, 228, ${alpha * 0.25})`;
          ctx.lineWidth = 1;

          const tokWidth = ctx.measureText(b.token).width + 8;
          ctx.fillRect(px - tokWidth / 2, py - sz / 2, tokWidth, sz);
          ctx.strokeRect(px - tokWidth / 2, py - sz / 2, tokWidth, sz);

          // Draw colored token text
          let curX = px - tokWidth / 2 + 4;
          b.parts.forEach(([txt, col]) => {
            ctx.fillStyle = col;
            ctx.globalAlpha = alpha;
            ctx.fillText(txt, curX, py + sz * 0.28);
            curX += ctx.measureText(txt).width;
          });
          ctx.restore();
        } else {
          // Render pixel cube
          ctx.save();
          ctx.fillStyle = `rgba(233, 234, 228, ${alpha * 0.8})`;
          ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
          ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.4})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(px - sz / 2, py - sz / 2, sz, sz);
          ctx.restore();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, [chapter]);

  return (
    <canvas
      ref={canvasRef}
      className="scene-canvas"
      aria-label="디지털아트 3D 비주얼 캔버스"
    />
  );
}
