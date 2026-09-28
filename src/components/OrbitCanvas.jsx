import React, { useEffect, useRef, useState } from 'react';

export default function OrbitCanvas({ works = [], onSelectWork }) {
  const canvasRef = useRef(null);
  const [hoveredWork, setHoveredWork] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = canvas.parentElement.clientWidth || window.innerWidth);
    let height = (canvas.height = Math.max(500, window.innerHeight * 0.72));

    let rot = 0;
    let mouseX = 0, mouseY = 0;
    let targetTilt = 0.28;
    let curTilt = 0.28;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      mouseX = x;
      mouseY = y;
      targetTilt = 0.28 + y * 0.15;
    };

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = Math.max(500, window.innerHeight * 0.72);
    };

    let clickableNodes = [];

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Find hit node closest to click
      for (let i = clickableNodes.length - 1; i >= 0; i--) {
        const node = clickableNodes[i];
        const dist = Math.hypot(clickX - node.x, clickY - node.y);
        if (dist <= node.radius) {
          onSelectWork && onSelectWork(node.work);
          return;
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);

    const render = () => {
      rot += 0.004;
      curTilt += (targetTilt - curTilt) * 0.05;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const rx = Math.min(width * 0.42, 460);
      const ry = rx * Math.sin(curTilt);

      // Draw Orbit Trajectory Line
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(233, 234, 228, 0.14)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.restore();

      // Glowing Center Nucleus
      const nucleusGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
      nucleusGrad.addColorStop(0, 'rgba(244, 255, 83, 0.25)');
      nucleusGrad.addColorStop(0.5, 'rgba(244, 255, 83, 0.08)');
      nucleusGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nucleusGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f4ff53';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();

      // Position works along the orbit
      const count = Math.max(works.length, 1);
      const nodes = [];

      works.forEach((w, index) => {
        const theta = rot + (index / count) * Math.PI * 2;
        const x = cx + Math.cos(theta) * rx;
        const y = cy + Math.sin(theta) * ry;
        const z = Math.sin(theta); // -1 (back) to +1 (front)

        const depthScale = 0.75 + (z + 1) * 0.25; // 0.75 to 1.25
        const alpha = 0.35 + (z + 1) * 0.32; // 0.35 to 1.0

        nodes.push({
          work: w,
          x,
          y,
          z,
          depthScale,
          alpha,
          radius: 28 * depthScale
        });
      });

      // Sort by Z for proper perspective draw order
      nodes.sort((a, b) => a.z - b.z);
      clickableNodes = nodes;

      nodes.forEach((n) => {
        const isHovered = hoveredWork && hoveredWork.id === n.work.id;

        // Card node outline & background
        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.scale(n.depthScale, n.depthScale);

        // Halo when hovered or focused
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(0, 0, 36, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(244, 255, 83, 0.2)';
          ctx.fill();
        }

        // Card body
        const cardW = 100;
        const cardH = 64;
        ctx.fillStyle = `rgba(18, 18, 22, ${Math.min(0.95, n.alpha)})`;
        ctx.strokeStyle = isHovered ? '#f4ff53' : `rgba(233, 234, 228, ${n.alpha * 0.4})`;
        ctx.lineWidth = isHovered ? 1.5 : 1;

        ctx.fillRect(-cardW / 2, -cardH / 2, cardW, cardH);
        ctx.strokeRect(-cardW / 2, -cardH / 2, cardW, cardH);

        // Work category & index
        ctx.font = '500 8px "Pretendard", monospace';
        ctx.fillStyle = isHovered ? '#f4ff53' : `rgba(233, 234, 228, ${n.alpha * 0.6})`;
        ctx.textAlign = 'left';
        ctx.fillText((n.work.category || 'work').toUpperCase(), -cardW / 2 + 8, -cardH / 2 + 14);

        // Title
        ctx.font = '600 11px "Pretendard", sans-serif';
        ctx.fillStyle = isHovered ? '#ffffff' : `rgba(233, 234, 228, ${n.alpha})`;
        const titleText = (n.work.title || 'Untitled').slice(0, 10);
        ctx.fillText(titleText, -cardW / 2 + 8, -cardH / 2 + 32);

        // Student name
        ctx.font = '400 9px "Pretendard", sans-serif';
        ctx.fillStyle = `rgba(233, 234, 228, ${n.alpha * 0.7})`;
        ctx.fillText(n.work.student || '', -cardW / 2 + 8, -cardH / 2 + 48);

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
    };
  }, [works, hoveredWork, onSelectWork]);

  return (
    <div className="orbit-wrap">
      <canvas ref={canvasRef} className="orbit-canvas" />
      <div className="orbit-tip">
        <span>클릭하여 작품 상세 보기 · 마우스를 움직여 궤도 조작</span>
      </div>
    </div>
  );
}
