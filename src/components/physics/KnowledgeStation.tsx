'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChapterContent } from '@/lib/physics-data';

interface KnowledgeStationProps {
  chapters: ChapterContent[];
  lawName: string;
  lawColor: string;
  lawKey: string;
}

// Knowledge cards data for each law
const knowledgeCardsData: Record<string, { background: string; derivation: string; conclusion: string; application: string }> = {
  archimedes: {
    background: '古希腊国王怀疑工匠在纯金王冠中掺银，却无法测量不规则物体的体积。阿基米德在洗澡时观察到水溢出浴缸，灵光一闪发现了排水法测体积的原理，由此揭开了浮力与排开液体重力之间的关系。',
    derivation: '① 设柱体底面积S、高h，浸没在液体中：V排=Sh\n② 下表面受向上压力F下=ρ液gh下S，上表面受向下压力F上=ρ液gh上S\n③ F浮=F下-F上=ρ液gS(h下-h上)=ρ液gSh=ρ液gV排\n④ 此推导对任意形状物体均成立',
    conclusion: '核心公式：F浮=ρ液gV排\n\n关键理解：\n① "浸在"包括完全浸没和部分浸入\n② 浮力只与液体密度和排开体积有关，与物体自身质量、密度无关',
    application: '🚢 轮船：空心结构增大V排，使F浮=G船而漂浮\n🤖 潜水艇：调节水舱改变自重，控制浮沉\n🎈 氢气球：排开空气的重力>自重，受空气浮力升空\n🧊 密度计：利用漂浮时F浮=G，V排反比于ρ液',
  },
  ohm: {
    background: '电路中的灯泡为什么有的亮有的暗？电流大小由什么决定？德国物理学家欧姆通过大量实验，探索电流、电压、电阻三者之间的定量关系，最终发现了电学最基本的定律。',
    derivation: '① 控制变量法：保持电阻不变，改变电压→电流与电压成正比\n② 保持电压不变，改变电阻→电流与电阻成反比\n③ 综合两组实验：I∝U，I∝1/R\n④ 得出结论：I=U/R',
    conclusion: '核心公式：I=U/R\n\n关键理解：\n① I、U、R必须对应同一段电路、同一时刻\n② 电阻是导体本身的性质，不随U、I变化\n③ 不能说"R与U成正比"，R由材料、长度、截面积决定',
    application: '🔌 家用电路：根据I=P/U选导线和保险丝\n📱 手机充电器：5V/2A输出体现U与I关系\n💡 LED灯：串联限流电阻防止过流烧毁\n🏠 用电安全：根据欧姆定律设计漏电保护',
  },
  hooke: {
    background: '弹簧为什么能拉长又能恢复？蹦床为什么能弹飞人？17世纪英国科学家罗伯特·胡克通过大量弹簧实验，发现了弹力与形变量之间的正比关系，这就是胡克定律。',
    derivation: '① 在弹簧下挂不同数量钩码，记录弹力F和伸长量x\n② 绘制F-x图像，发现过原点的直线\n③ 直线斜率k为劲度系数，反映弹簧"软硬"\n④ 得出：F=kx（在弹性限度内）',
    conclusion: '核心公式：F=kx\n\n关键理解：\n① "弹性限度内"是前提，超限则永久形变\n② k为劲度系数，单位N/m，由弹簧本身决定\n③ k越大弹簧越硬，越难拉伸\n④ x是形变量（伸长量或压缩量），不是弹簧原长',
    application: '⚖️ 弹簧秤：直接利用F=kx测力\n🚗 汽车减震器：弹簧缓冲路面颠簸\n🎯 弹弓/弓箭：弹性势能转化为动能\n🛏️ 弹簧床垫：利用弹性提供舒适支撑',
  },
};

// Animated scene renderer for each chapter type
function AnimationScene({ type, isPlaying }: { type: string; isPlaying: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const drawIntro = (c: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
      c.fillStyle = '#e0f2fe';
      c.fillRect(0, 0, cw, ch);

      const tubY = ch * 0.55;
      c.fillStyle = '#f0f9ff';
      c.strokeStyle = '#93c5fd';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(cw * 0.15, tubY);
      c.quadraticCurveTo(cw * 0.15, ch * 0.85, cw * 0.25, ch * 0.85);
      c.lineTo(cw * 0.75, ch * 0.85);
      c.quadraticCurveTo(cw * 0.85, ch * 0.85, cw * 0.85, tubY);
      c.stroke();
      c.fill();

      const waterLevel = Math.min(0.3 + t * 0.01, 0.65);
      c.fillStyle = 'rgba(59, 130, 246, 0.3)';
      c.beginPath();
      c.moveTo(cw * 0.17, tubY + 10);
      c.quadraticCurveTo(cw * 0.17, ch * (0.55 + waterLevel * 0.3), cw * 0.25, ch * (0.55 + waterLevel * 0.3));
      c.lineTo(cw * 0.75, ch * (0.55 + waterLevel * 0.3));
      c.quadraticCurveTo(cw * 0.83, ch * (0.55 + waterLevel * 0.3), cw * 0.83, tubY + 10);
      c.fill();

      if (t > 30) {
        for (let i = 0; i < 3; i++) {
          const dropX = cw * (0.3 + i * 0.15);
          const dropY = tubY - ((t * 2 + i * 20) % 60);
          const alpha = Math.max(0, 1 - ((t * 2 + i * 20) % 60) / 60);
          c.fillStyle = `rgba(59, 130, 246, ${alpha * 0.6})`;
          c.beginPath();
          c.ellipse(dropX, dropY, 4, 6, 0, 0, Math.PI * 2);
          c.fill();
        }
      }

      const crownX = cw * 0.5 + Math.sin(t * 0.05) * 10;
      const crownY = ch * 0.25 + Math.sin(t * 0.03) * 5;
      c.fillStyle = '#fbbf24';
      c.strokeStyle = '#d97706';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(crownX - 25, crownY + 15);
      c.lineTo(crownX - 25, crownY - 5);
      c.lineTo(crownX - 15, crownY + 5);
      c.lineTo(crownX, crownY - 15);
      c.lineTo(crownX + 15, crownY + 5);
      c.lineTo(crownX + 25, crownY - 5);
      c.lineTo(crownX + 25, crownY + 15);
      c.closePath();
      c.fill();
      c.stroke();

      if (t > 15) {
        const personAlpha = Math.min(1, (t - 15) / 20);
        c.globalAlpha = personAlpha;
        const px = cw * 0.5;
        const py = ch * 0.3;

        c.fillStyle = '#fde68a';
        c.beginPath();
        c.arc(px, py - 30, 12, 0, Math.PI * 2);
        c.fill();

        c.strokeStyle = '#d97706';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(px, py - 18);
        c.lineTo(px, py + 5);
        c.stroke();
        c.beginPath();
        c.moveTo(px - 15, py - 8);
        c.lineTo(px + 15, py - 8);
        c.stroke();
        c.beginPath();
        c.moveTo(px, py + 5);
        c.lineTo(px - 10, py + 25);
        c.stroke();
        c.beginPath();
        c.moveTo(px, py + 5);
        c.lineTo(px + 10, py + 25);
        c.stroke();

        if (t > 25) {
          c.fillStyle = '#ef4444';
          c.font = 'bold 14px sans-serif';
          c.textAlign = 'center';
          c.fillText('Eureka!', px, py - 45);
        }
        c.globalAlpha = 1;
      }
    };

    const drawDerivation = (c: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
      // Background: light blue gradient
      const grad = c.createLinearGradient(0, 0, 0, ch);
      grad.addColorStop(0, '#eff6ff');
      grad.addColorStop(1, '#dbeafe');
      c.fillStyle = grad;
      c.fillRect(0, 0, cw, ch);

      // Step counter based on time
      const step = Math.min(Math.floor(t / 60), 4);

      // === Left side: Cylinder in liquid ===
      const cx = cw * 0.3;
      const waterTop = ch * 0.2;
      const waterBottom = ch * 0.85;

      // Draw water container
      c.fillStyle = 'rgba(59, 130, 246, 0.12)';
      c.fillRect(cw * 0.1, waterTop, cw * 0.4, waterBottom - waterTop);
      c.strokeStyle = '#93c5fd';
      c.lineWidth = 2;
      c.strokeRect(cw * 0.1, waterTop, cw * 0.4, waterBottom - waterTop);

      // Water surface waves
      c.strokeStyle = 'rgba(59, 130, 246, 0.4)';
      c.lineWidth = 1.5;
      c.beginPath();
      for (let x = cw * 0.1; x < cw * 0.5; x += 2) {
        const waveY = waterTop + Math.sin(t * 0.06 + x * 0.03) * 2;
        if (x === cw * 0.1) c.moveTo(x, waveY);
        else c.lineTo(x, waveY);
      }
      c.stroke();

      // Water label
      c.fillStyle = '#3b82f6';
      c.font = '12px sans-serif';
      c.textAlign = 'center';
      c.fillText('液体 (ρ液)', cx, waterTop - 8);

      // Draw cylinder
      const rW = 60;
      const rH = 90;
      const cylTop = ch * 0.35;
      const cylLeft = cx - rW / 2;

      // Cylinder body
      c.fillStyle = 'rgba(147, 197, 253, 0.5)';
      c.strokeStyle = '#3b82f6';
      c.lineWidth = 2;
      c.fillRect(cylLeft, cylTop, rW, rH);
      c.strokeRect(cylLeft, cylTop, rW, rH);

      // Dimension labels on cylinder
      c.fillStyle = '#64748b';
      c.font = '12px sans-serif';
      c.textAlign = 'left';
      c.fillText('S', cylLeft + rW + 5, cylTop + rH / 2 + 4);
      c.textAlign = 'right';
      c.fillText('h', cylLeft - 8, cylTop + rH / 2 + 4);

      // Bracket for h
      c.strokeStyle = '#64748b';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(cylLeft - 4, cylTop);
      c.lineTo(cylLeft - 12, cylTop);
      c.lineTo(cylLeft - 12, cylTop + rH);
      c.lineTo(cylLeft - 4, cylTop + rH);
      c.stroke();

      // Force arrows on cylinder (animated)
      const arrowPulse = Math.sin(t * 0.05) * 3;

      // F下 arrow (green, pointing up from bottom surface of cylinder)
      if (step >= 1) {
        c.strokeStyle = '#22c55e';
        c.fillStyle = '#22c55e';
        c.lineWidth = 3;
        const upLen = 35 + arrowPulse;
        c.beginPath();
        c.moveTo(cx, cylTop + rH);
        c.lineTo(cx, cylTop + rH + upLen);
        c.stroke();
        // Arrow head (pointing up)
        c.beginPath();
        c.moveTo(cx - 6, cylTop + rH + 8);
        c.lineTo(cx, cylTop + rH);
        c.lineTo(cx + 6, cylTop + rH + 8);
        c.fill();
        c.font = 'bold 12px sans-serif';
        c.textAlign = 'left';
        c.fillText('F下 = ρ液gh下S', cx + 10, cylTop + rH + upLen / 2 + 4);
      }

      // F上 arrow (red, pointing down onto top surface of cylinder)
      if (step >= 1) {
        c.strokeStyle = '#ef4444';
        c.fillStyle = '#ef4444';
        c.lineWidth = 3;
        const downLen = 25 - arrowPulse;
        // Arrow from above pointing DOWN onto the top surface
        c.beginPath();
        c.moveTo(cx, cylTop - downLen);
        c.lineTo(cx, cylTop);
        c.stroke();
        // Arrow head (pointing down, at top surface)
        c.beginPath();
        c.moveTo(cx - 6, cylTop - 8);
        c.lineTo(cx, cylTop);
        c.lineTo(cx + 6, cylTop - 8);
        c.fill();
        c.font = 'bold 12px sans-serif';
        c.textAlign = 'left';
        c.fillText('F上 = ρ液gh上S', cx + 10, cylTop - downLen / 2 + 4);
      }

      // h_down and h_up labels
      if (step >= 1) {
        c.fillStyle = '#64748b';
        c.font = '11px sans-serif';
        c.textAlign = 'left';
        c.fillText('h下', cx + rW / 2 + 8, waterBottom - 10);
        c.fillText('h上', cx + rW / 2 + 8, waterTop + 15);
      }

      // F_buoyancy result arrow (center, pointing up)
      if (step >= 2) {
        c.strokeStyle = '#f59e0b';
        c.fillStyle = '#f59e0b';
        c.lineWidth = 4;
        const buoyLen = 45 + arrowPulse * 1.5;
        const buoyX = cx;
        const buoyY = ch * 0.92;
        c.beginPath();
        c.moveTo(buoyX, buoyY);
        c.lineTo(buoyX, buoyY - buoyLen);
        c.stroke();
        c.beginPath();
        c.moveTo(buoyX - 8, buoyY - buoyLen + 10);
        c.lineTo(buoyX, buoyY - buoyLen);
        c.lineTo(buoyX + 8, buoyY - buoyLen + 10);
        c.fill();
        c.font = 'bold 13px sans-serif';
        c.textAlign = 'center';
        c.fillText('F浮', buoyX, buoyY + 14);
      }

      // === Right side: Step-by-step derivation ===
      const textX = cw * 0.58;
      const textStartY = ch * 0.15;
      const lineH = ch * 0.14;

      // Title
      c.fillStyle = '#1e40af';
      c.font = 'bold 15px sans-serif';
      c.textAlign = 'left';
      c.fillText('推导过程', textX, textStartY - 5);

      // Step 1
      if (step >= 0) {
        const alpha1 = Math.min(1, t / 30);
        c.globalAlpha = alpha1;
        c.fillStyle = '#374151';
        c.font = '13px sans-serif';
        c.fillText('① V排 = V物 = S × h', textX, textStartY + lineH);
        c.globalAlpha = 1;
      }

      // Step 2
      if (step >= 1) {
        const alpha2 = Math.min(1, (t - 60) / 30);
        c.globalAlpha = Math.max(0, alpha2);
        c.fillStyle = '#374151';
        c.font = '13px sans-serif';
        c.fillText('② F下 = ρ液gh下S', textX, textStartY + lineH * 2);
        c.fillText('   F上 = ρ液gh上S', textX, textStartY + lineH * 2.7);
        c.globalAlpha = 1;
      }

      // Step 3
      if (step >= 2) {
        const alpha3 = Math.min(1, (t - 120) / 30);
        c.globalAlpha = Math.max(0, alpha3);
        c.fillStyle = '#374151';
        c.font = '13px sans-serif';
        c.fillText('③ F浮 = F下 - F上', textX, textStartY + lineH * 3.7);
        c.fillText('     = ρ液gS(h下 - h上)', textX, textStartY + lineH * 4.3);
        c.globalAlpha = 1;
      }

      // Step 4: Final result (highlighted)
      if (step >= 3) {
        const alpha4 = Math.min(1, (t - 180) / 30);
        c.globalAlpha = Math.max(0, alpha4);

        // Highlight box
        const pulse = 1 + Math.sin(t * 0.08) * 0.02;
        c.save();
        c.translate(textX + 80, textStartY + lineH * 5.4);
        c.scale(pulse, pulse);
        c.fillStyle = '#fef3c7';
        c.beginPath();
        c.roundRect(-100, -16, 200, 32, 8);
        c.fill();
        c.strokeStyle = '#f59e0b';
        c.lineWidth = 2;
        c.beginPath();
        c.roundRect(-100, -16, 200, 32, 8);
        c.stroke();
        c.fillStyle = '#92400e';
        c.font = 'bold 16px sans-serif';
        c.textAlign = 'center';
        c.fillText('F浮 = ρ液gV排', 0, 6);
        c.restore();

        c.globalAlpha = 1;
      }
    };

    const drawConclusion = (c: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
      c.fillStyle = '#eff6ff';
      c.fillRect(0, 0, cw, ch);

      c.fillStyle = '#1e40af';
      c.font = 'bold 18px sans-serif';
      c.textAlign = 'center';
      c.fillText('阿基米德定律', cw / 2, ch * 0.12);

      const pulse = 1 + Math.sin(t * 0.08) * 0.03;
      c.save();
      c.translate(cw / 2, ch * 0.35);
      c.scale(pulse, pulse);
      c.fillStyle = '#dbeafe';
      c.beginPath();
      c.roundRect(-160, -25, 320, 50, 12);
      c.fill();
      c.fillStyle = '#1e3a8a';
      c.font = 'bold 20px sans-serif';
      c.fillText('F浮 = G排 = ρ液gV排', 0, 8);
      c.restore();

      const showIdx = Math.floor(t / 30);
      const points = [
        '"浸在" = 完全浸没 + 部分浸入',
        '浮力只看 ρ液 和 V排',
        '与物体自身质量、密度无关！',
      ];
      points.forEach((pt, i) => {
        if (showIdx > i) {
          const alpha = Math.min(1, (t - (i + 1) * 30) / 15);
          c.globalAlpha = alpha;
          c.fillStyle = '#374151';
          c.font = '14px sans-serif';
          c.textAlign = 'left';
          c.fillText(`• ${pt}`, cw * 0.15, ch * (0.52 + i * 0.1));
          c.globalAlpha = 1;
        }
      });
    };

    const drawApplication = (c: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
      const T = t * 0.02; // slow time
      const waterLine = ch * 0.48;

      // === SKY ===
      const skyGrad = c.createLinearGradient(0, 0, 0, waterLine);
      skyGrad.addColorStop(0, '#1a6fc4');
      skyGrad.addColorStop(0.3, '#3a8fd8');
      skyGrad.addColorStop(0.6, '#6cb4e8');
      skyGrad.addColorStop(1, '#b8ddf5');
      c.fillStyle = skyGrad;
      c.fillRect(0, 0, cw, waterLine);

      // Sun glow
      const sunX = cw * 0.85;
      const sunY = ch * 0.12;
      const sunGlow = c.createRadialGradient(sunX, sunY, 5, sunX, sunY, 60);
      sunGlow.addColorStop(0, 'rgba(255,250,200,0.9)');
      sunGlow.addColorStop(0.3, 'rgba(255,230,150,0.4)');
      sunGlow.addColorStop(1, 'rgba(255,200,100,0)');
      c.fillStyle = sunGlow;
      c.beginPath();
      c.arc(sunX, sunY, 60, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#fff8dc';
      c.beginPath();
      c.arc(sunX, sunY, 12, 0, Math.PI * 2);
      c.fill();

      // Clouds
      const drawCloud = (cx: number, cy: number, scale: number) => {
        c.save();
        c.translate(cx, cy);
        c.scale(scale, scale);
        c.fillStyle = 'rgba(255,255,255,0.85)';
        c.beginPath();
        c.arc(0, 0, 20, 0, Math.PI * 2);
        c.arc(18, -5, 16, 0, Math.PI * 2);
        c.arc(-18, -3, 14, 0, Math.PI * 2);
        c.arc(8, -12, 14, 0, Math.PI * 2);
        c.arc(-8, -10, 12, 0, Math.PI * 2);
        c.arc(25, 2, 10, 0, Math.PI * 2);
        c.arc(-25, 2, 10, 0, Math.PI * 2);
        c.fill();
        c.restore();
      };
      drawCloud((cw * 0.15 + T * 8) % (cw + 100) - 50, ch * 0.08, 1.2);
      drawCloud((cw * 0.55 + T * 5) % (cw + 100) - 50, ch * 0.14, 1.0);
      drawCloud((cw * 0.8 + T * 6) % (cw + 100) - 50, ch * 0.06, 0.8);

      // === OCEAN ===
      const oceanGrad = c.createLinearGradient(0, waterLine, 0, ch);
      oceanGrad.addColorStop(0, '#1a7ab5');
      oceanGrad.addColorStop(0.15, '#156a9e');
      oceanGrad.addColorStop(0.5, '#0d4a7a');
      oceanGrad.addColorStop(1, '#082d52');
      c.fillStyle = oceanGrad;
      c.fillRect(0, waterLine, cw, ch - waterLine);

      // Ocean waves - multiple layers for realism
      const drawWaveLayer = (yBase: number, amplitude: number, freq: number, speed: number, color: string, alpha: number) => {
        c.save();
        c.globalAlpha = alpha;
        c.fillStyle = color;
        c.beginPath();
        c.moveTo(0, ch);
        for (let x = 0; x <= cw; x += 3) {
          const y = yBase + Math.sin(x * freq + T * speed) * amplitude
            + Math.sin(x * freq * 1.7 + T * speed * 0.7) * amplitude * 0.4;
          c.lineTo(x, y);
        }
        c.lineTo(cw, ch);
        c.closePath();
        c.fill();
        c.restore();
      };
      drawWaveLayer(waterLine, 4, 0.025, 2.5, '#4db8e8', 0.4);
      drawWaveLayer(waterLine + 3, 3, 0.03, 2.0, '#2d9fd4', 0.3);
      drawWaveLayer(waterLine + 6, 2, 0.02, 1.5, '#1a8bc4', 0.2);

      // Foam line at water surface
      c.save();
      c.globalAlpha = 0.5;
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.5;
      c.beginPath();
      for (let x = 0; x <= cw; x += 2) {
        const y = waterLine + Math.sin(x * 0.025 + T * 2.5) * 3;
        if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.stroke();
      c.restore();

      // Underwater light rays
      c.save();
      for (let i = 0; i < 5; i++) {
        const rx = cw * (0.1 + i * 0.2) + Math.sin(T + i) * 10;
        c.globalAlpha = 0.04 + Math.sin(T * 0.5 + i) * 0.02;
        c.fillStyle = '#7ec8e3';
        c.beginPath();
        c.moveTo(rx - 5, waterLine);
        c.lineTo(rx - 30 - i * 5, ch);
        c.lineTo(rx + 30 + i * 5, ch);
        c.lineTo(rx + 5, waterLine);
        c.closePath();
        c.fill();
      }
      c.restore();

      // === SHIP ===
      const shipBob = Math.sin(T * 1.8) * 3;
      const shipTilt = Math.sin(T * 1.2) * 0.015;
      const shipX = cw * 0.3;
      const shipY = waterLine - 8 + shipBob;

      c.save();
      c.translate(shipX, shipY);
      c.rotate(shipTilt);

      // Hull below waterline
      c.fillStyle = '#8b1a1a';
      c.beginPath();
      c.moveTo(-55, 0);
      c.lineTo(-60, 18);
      c.quadraticCurveTo(-50, 35, 0, 38);
      c.quadraticCurveTo(50, 35, 60, 18);
      c.lineTo(55, 0);
      c.closePath();
      c.fill();

      // Red anti-fouling paint stripe
      c.fillStyle = '#b91c1c';
      c.beginPath();
      c.moveTo(-55, 0);
      c.lineTo(-58, 10);
      c.quadraticCurveTo(0, 14, 58, 10);
      c.lineTo(55, 0);
      c.closePath();
      c.fill();

      // Deck
      c.fillStyle = '#d4a574';
      c.fillRect(-52, -5, 104, 7);

      // Superstructure - bridge
      c.fillStyle = '#f5f0e8';
      c.fillRect(-20, -35, 40, 30);
      // Bridge windows
      c.fillStyle = '#60a5fa';
      for (let wi = 0; wi < 4; wi++) {
        c.fillRect(-16 + wi * 10, -28, 6, 6);
      }
      // Bridge roof
      c.fillStyle = '#e5ddd0';
      c.fillRect(-22, -38, 44, 5);

      // Funnel / smokestack
      c.fillStyle = '#ef4444';
      c.beginPath();
      c.moveTo(25, -38);
      c.lineTo(23, -55);
      c.lineTo(33, -55);
      c.lineTo(31, -38);
      c.closePath();
      c.fill();
      // Black band on funnel
      c.fillStyle = '#1a1a1a';
      c.fillRect(23, -48, 10, 5);

      // Smoke
      c.save();
      for (let si = 0; si < 4; si++) {
        const smokeX = 28 + Math.sin(T * 1.5 + si) * 6 + si * 8;
        const smokeY = -55 - si * 10 - Math.sin(T + si) * 3;
        const smokeR = 5 + si * 3;
        c.globalAlpha = 0.15 - si * 0.03;
        c.fillStyle = '#d1d5db';
        c.beginPath();
        c.arc(smokeX, smokeY, smokeR, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();

      // Mast
      c.fillStyle = '#6b7280';
      c.fillRect(-2, -70, 3, 35);

      // Cargo containers on deck
      const containerColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
      for (let ci = 0; ci < 4; ci++) {
        c.fillStyle = containerColors[ci];
        c.fillRect(-45 + ci * 18, -14, 15, 9);
        c.strokeStyle = 'rgba(0,0,0,0.15)';
        c.lineWidth = 0.5;
        c.strokeRect(-45 + ci * 18, -14, 15, 9);
      }

      c.restore();

      // === SUBMARINE ===
      const subBob = Math.sin(T * 1.2 + 1) * 4;
      const subX = cw * 0.68 + Math.sin(T * 0.8) * 8;
      const subY = waterLine + ch * 0.25 + subBob;

      c.save();
      c.translate(subX, subY);

      // Submarine body shadow
      c.fillStyle = 'rgba(0,0,0,0.15)';
      c.beginPath();
      c.ellipse(2, 3, 48, 14, 0, 0, Math.PI * 2);
      c.fill();

      // Main hull
      const subGrad = c.createLinearGradient(0, -15, 0, 15);
      subGrad.addColorStop(0, '#6b7280');
      subGrad.addColorStop(0.3, '#9ca3af');
      subGrad.addColorStop(0.7, '#6b7280');
      subGrad.addColorStop(1, '#4b5563');
      c.fillStyle = subGrad;
      c.beginPath();
      c.ellipse(0, 0, 48, 14, 0, 0, Math.PI * 2);
      c.fill();

      // Conning tower / sail
      const sailGrad = c.createLinearGradient(-8, -28, 8, -14);
      sailGrad.addColorStop(0, '#9ca3af');
      sailGrad.addColorStop(1, '#6b7280');
      c.fillStyle = sailGrad;
      c.beginPath();
      c.moveTo(-8, -14);
      c.lineTo(-6, -28);
      c.quadraticCurveTo(0, -32, 6, -28);
      c.lineTo(8, -14);
      c.closePath();
      c.fill();

      // Periscope
      c.fillStyle = '#4b5563';
      c.fillRect(-1.5, -38, 3, 12);
      c.fillRect(-1.5, -40, 10, 3);

      // Propeller
      c.save();
      c.translate(-48, 0);
      c.rotate(T * 6);
      c.fillStyle = '#9ca3af';
      for (let pi = 0; pi < 3; pi++) {
        c.save();
        c.rotate(pi * Math.PI * 2 / 3);
        c.beginPath();
        c.ellipse(0, -7, 2.5, 7, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
      c.restore();

      // Viewport windows
      c.fillStyle = '#93c5fd';
      for (let vi = 0; vi < 3; vi++) {
        c.beginPath();
        c.arc(-20 + vi * 14, 2, 3, 0, Math.PI * 2);
        c.fill();
      }

      // Ballast tanks indicator
      c.fillStyle = 'rgba(59,130,246,0.4)';
      const tankLevel = 0.4 + Math.sin(T * 0.5) * 0.15;
      c.fillRect(-30, -4, 10, 8 * tankLevel);
      c.fillRect(20, -4, 10, 8 * tankLevel);

      c.restore();

      // Underwater bubbles from submarine
      c.save();
      for (let bi = 0; bi < 6; bi++) {
        const bx = subX - 30 + Math.sin(T * 2 + bi * 1.5) * 10;
        const by = subY - 20 - ((T * 30 + bi * 25) % 80);
        const br = 2 + Math.sin(T + bi) * 1;
        c.globalAlpha = Math.max(0, 0.3 - by * 0.001);
        c.fillStyle = 'rgba(147,197,253,0.5)';
        c.beginPath();
        c.arc(bx, by, br, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();

      // === HYDROGEN BALLOON ===
      const balloonBob = Math.sin(T * 1.0) * 5;
      const balloonX = cw * 0.78 + Math.sin(T * 0.6) * 15;
      const balloonY = ch * 0.18 + balloonBob;

      c.save();
      c.translate(balloonX, balloonY);

      // Rope
      c.strokeStyle = '#92400e';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, 25);
      const ropeLen = 45;
      for (let ri = 0; ri < ropeLen; ri += 3) {
        c.lineTo(Math.sin(ri * 0.15 + T) * 2, 25 + ri);
      }
      c.stroke();

      // Basket
      c.fillStyle = '#92400e';
      c.fillRect(-8, 25 + ropeLen - 2, 16, 10);
      c.strokeStyle = '#78350f';
      c.lineWidth = 0.8;
      c.strokeRect(-8, 25 + ropeLen - 2, 16, 10);
      // Basket weave lines
      c.strokeStyle = '#a16207';
      for (let wi = 0; wi < 3; wi++) {
        c.beginPath();
        c.moveTo(-7, 25 + ropeLen + wi * 3);
        c.lineTo(7, 25 + ropeLen + wi * 3);
        c.stroke();
      }

      // Balloon envelope
      const balloonGrad = c.createRadialGradient(-3, -5, 3, 0, 0, 25);
      balloonGrad.addColorStop(0, '#fde68a');
      balloonGrad.addColorStop(0.3, '#fbbf24');
      balloonGrad.addColorStop(0.7, '#f59e0b');
      balloonGrad.addColorStop(1, '#d97706');
      c.fillStyle = balloonGrad;
      c.beginPath();
      c.ellipse(0, 0, 22, 28, 0, 0, Math.PI * 2);
      c.fill();

      // Balloon stripes
      c.save();
      c.clip();
      c.strokeStyle = 'rgba(180,83,9,0.25)';
      c.lineWidth = 1.5;
      for (let si = -2; si <= 2; si++) {
        c.beginPath();
        c.ellipse(si * 7, 0, 22, 28, 0, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();

      // Balloon highlight
      c.fillStyle = 'rgba(255,255,255,0.25)';
      c.beginPath();
      c.ellipse(-7, -10, 8, 12, -0.3, 0, Math.PI * 2);
      c.fill();

      // Balloon opening at bottom
      c.fillStyle = '#b45309';
      c.beginPath();
      c.moveTo(-6, 25);
      c.lineTo(-8, 28);
      c.lineTo(8, 28);
      c.lineTo(6, 25);
      c.closePath();
      c.fill();

      c.restore();

      // === SEABED ===
      c.fillStyle = '#0a2540';
      c.beginPath();
      c.moveTo(0, ch);
      for (let sx = 0; sx <= cw; sx += 5) {
        c.lineTo(sx, ch - 15 + Math.sin(sx * 0.03) * 5 + Math.sin(sx * 0.07) * 3);
      }
      c.lineTo(cw, ch);
      c.closePath();
      c.fill();
      // Sand texture
      c.fillStyle = '#1a3a5c';
      c.beginPath();
      c.moveTo(0, ch);
      for (let sx = 0; sx <= cw; sx += 5) {
        c.lineTo(sx, ch - 8 + Math.sin(sx * 0.04 + 1) * 3);
      }
      c.lineTo(cw, ch);
      c.closePath();
      c.fill();

      // Seaweed
      const drawSeaweed = (sx: number, height: number) => {
        c.strokeStyle = '#166534';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(sx, ch - 10);
        for (let si = 0; si < height; si += 3) {
          c.lineTo(sx + Math.sin(si * 0.1 + T * 2) * 6, ch - 10 - si);
        }
        c.stroke();
      };
      drawSeaweed(cw * 0.1, 30);
      drawSeaweed(cw * 0.15, 25);
      drawSeaweed(cw * 0.9, 35);
      drawSeaweed(cw * 0.95, 28);

      // Fish
      const drawFish = (fx: number, fy: number, size: number, color: string) => {
        c.fillStyle = color;
        c.beginPath();
        c.ellipse(fx, fy, size, size * 0.5, 0, 0, Math.PI * 2);
        c.fill();
        // Tail
        c.beginPath();
        c.moveTo(fx - size, fy);
        c.lineTo(fx - size * 1.5, fy - size * 0.4);
        c.lineTo(fx - size * 1.5, fy + size * 0.4);
        c.closePath();
        c.fill();
        // Eye
        c.fillStyle = '#fff';
        c.beginPath();
        c.arc(fx + size * 0.4, fy - size * 0.1, size * 0.15, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#000';
        c.beginPath();
        c.arc(fx + size * 0.45, fy - size * 0.1, size * 0.08, 0, Math.PI * 2);
        c.fill();
      };
      drawFish((cw * 0.5 + T * 20) % cw, waterLine + ch * 0.15, 8, '#fbbf24');
      drawFish((cw * 0.8 - T * 15 + cw) % cw, waterLine + ch * 0.1, 6, '#fb923c');
    };

    const draw = () => {
      // Always advance time so canvas is never blank
      timeRef.current += 1;
      ctx.clearRect(0, 0, w, h);

      switch (type) {
        case 'intro': drawIntro(ctx, w, h, timeRef.current); break;
        case 'derivation': drawDerivation(ctx, w, h, timeRef.current); break;
        case 'conclusion': drawConclusion(ctx, w, h, timeRef.current); break;
        case 'application': drawApplication(ctx, w, h, timeRef.current); break;
        default: drawIntro(ctx, w, h, timeRef.current);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [type]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={420}
      className="w-full rounded-xl bg-white border border-blue-100"
    />
  );
}

// Preprocess speech text for TTS: replace symbols with Chinese equivalents
function preprocessSpeechForTTS(text: string): string {
  return text
    .replace(/\+/g, '加')
    .replace(/−/g, '减')
    .replace(/-/g, '减')
    .replace(/×/g, '乘以')
    .replace(/÷/g, '除以')
    .replace(/=/g, '等于')
    .replace(/≈/g, '约等于')
    .replace(/≠/g, '不等于')
    .replace(/≥/g, '大于等于')
    .replace(/≤/g, '小于等于')
    .replace(/>/g, '大于')
    .replace(/</g, '小于')
    .replace(/ρ/g, '柔')
    .replace(/π/g, '派')
    .replace(/∑/g, '西格玛')
    .replace(/√/g, '根号')
    .replace(/∞/g, '无穷')
    .replace(/∝/g, '正比于')
    .replace(/\^/g, '的')
    .replace(/F浮/g, 'F浮')
    .replace(/V排/g, 'V排')
    .replace(/V物/g, 'V物')
    .replace(/G排/g, 'G排');
}

export default function KnowledgeStation({ chapters, lawName, lawColor, lawKey }: KnowledgeStationProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mergedChapters, setMergedChapters] = useState<ChapterContent[]>(chapters);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pageAutoNextRef = useRef(false);
  const autoPlayOnPageChangeRef = useRef(false);
  const isPlayingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);

  // TTS audio URI cache: persisted to localStorage for cross-page survival
  const CACHE_KEY = 'physics-tts-cache';
  const CACHE_VERSION_KEY = 'physics-tts-cache-version';
  const CACHE_VERSION = 'v3'; // Bump version when TTS params change to invalidate old cache
  const getTTSCache = (): Map<string, string> => {
    if (typeof window === 'undefined') return new Map();
    try {
      // Check cache version - clear if outdated
      const version = localStorage.getItem(CACHE_VERSION_KEY);
      if (version !== CACHE_VERSION) {
        localStorage.removeItem(CACHE_KEY);
        localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
        return new Map();
      }
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) return new Map(JSON.parse(stored));
    } catch { /* ignore */ }
    return new Map();
  };
  const saveTTSCache = (cache: Map<string, string>) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(cache.entries())));
    } catch { /* ignore */ }
  };
  const ttsCacheRef = useRef<Map<string, string>>(getTTSCache());

  // Load editor data from localStorage and merge
  useEffect(() => {
    const stored = localStorage.getItem('physics-editor-data');
    if (stored) {
      try {
        const editData = JSON.parse(stored);
        const edited = editData[lawKey];
        if (edited && Array.isArray(edited)) {
          const merged = chapters.map((ch, i) => {
            if (edited[i]) {
              return {
                ...ch,
                text: edited[i].text ?? ch.text,
                speech: edited[i].speech ?? ch.speech,
                videoUrl: edited[i].videoUrl ?? ch.videoUrl,
                videoName: edited[i].videoName ?? ch.videoName,
              };
            }
            return ch;
          });
          setMergedChapters(merged);
        }
      } catch {
        // ignore parse errors, use defaults
      }
    }
  }, [chapters, lawKey]);

  const chapter = mergedChapters[currentPage];

  // Stop and cleanup audio
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  // Fetch TTS audio from backend API and play (with cache)
  const fetchAndPlayTTS = useCallback((text: string, onEnd?: () => void) => {
    stopAudio();
    setIsLoading(true);

    const processedText = preprocessSpeechForTTS(text);

    // Check cache first
    const cachedUri = ttsCacheRef.current.get(processedText);
    if (cachedUri) {
      const audio = new Audio(cachedUri);
      audioRef.current = audio;
      isPlayingRef.current = true;

      audio.addEventListener('timeupdate', () => {
        if (audio.duration && isFinite(audio.duration)) {
          const pct = (audio.currentTime / audio.duration) * 100;
          setProgress(pct);
        }
      });

      audio.addEventListener('ended', () => {
        isPlayingRef.current = false;
        onEnd?.();
      });

      audio.addEventListener('error', () => {
        console.error('Audio playback error');
        isPlayingRef.current = false;
        setIsPlaying(false);
        setIsLoading(false);
        // Remove bad cache entry
        ttsCacheRef.current.delete(processedText);
        saveTTSCache(ttsCacheRef.current);
        onEnd?.();
      });

      audio.play().then(() => {
        setIsLoading(false);
        setIsPlaying(true);
      }).catch(err => {
        console.error('Audio play failed:', err);
        isPlayingRef.current = false;
        setIsPlaying(false);
        setIsLoading(false);
        // Remove bad cache entry
        ttsCacheRef.current.delete(processedText);
        saveTTSCache(ttsCacheRef.current);
        onEnd?.();
      });

      return;
    }

    // Not in cache, fetch from API
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: processedText }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error('TTS error:', data.error);
          setIsLoading(false);
          setIsPlaying(false);
          onEnd?.();
          return;
        }

        const audioUri = data.audioUri as string;

        // Cache the audio URI (persist to localStorage)
        ttsCacheRef.current.set(processedText, audioUri);
        saveTTSCache(ttsCacheRef.current);

        const audio = new Audio(audioUri);
        audioRef.current = audio;
        isPlayingRef.current = true;

        audio.addEventListener('timeupdate', () => {
          if (audio.duration && isFinite(audio.duration)) {
            const pct = (audio.currentTime / audio.duration) * 100;
            setProgress(pct);
          }
        });

        audio.addEventListener('ended', () => {
          isPlayingRef.current = false;
          onEnd?.();
        });

        audio.addEventListener('error', () => {
          console.error('Audio playback error');
          isPlayingRef.current = false;
          setIsPlaying(false);
          setIsLoading(false);
          ttsCacheRef.current.delete(processedText);
        saveTTSCache(ttsCacheRef.current);
          onEnd?.();
        });

        audio.play().then(() => {
          setIsLoading(false);
          setIsPlaying(true);
        }).catch(err => {
          console.error('Audio play failed:', err);
          isPlayingRef.current = false;
          setIsPlaying(false);
          setIsLoading(false);
          ttsCacheRef.current.delete(processedText);
        saveTTSCache(ttsCacheRef.current);
          onEnd?.();
        });
      })
      .catch(err => {
        console.error('TTS fetch failed:', err);
        setIsLoading(false);
        setIsPlaying(false);
        onEnd?.();
      });
  }, [stopAudio]);

  const handlePlay = useCallback(() => {
    // If we have an existing audio that was just paused (not ended), resume it
    if (audioRef.current && !audioRef.current.ended && isPlayingRef.current === false && audioRef.current.currentTime > 0) {
      isPlayingRef.current = true;
      audioRef.current.play().catch(() => {
        // If resume fails, re-fetch with current page's speech
        const ch = mergedChapters[currentPage];
        if (!ch) return;
        fetchAndPlayTTS(ch.speech, () => {
          if (currentPage < mergedChapters.length - 1) {
            pageAutoNextRef.current = true;
            setCurrentPage(prev => prev + 1);
          } else {
            setIsPlaying(false);
            setProgress(100);
          }
        });
      });
      setIsPlaying(true);
      return;
    }

    // No existing audio or audio ended - start fresh with current page's speech
    setIsPlaying(true);
    const ch = mergedChapters[currentPage];
    if (!ch) return;
    fetchAndPlayTTS(ch.speech, () => {
      if (currentPage < mergedChapters.length - 1) {
        pageAutoNextRef.current = true;
        setCurrentPage(prev => prev + 1);
      } else {
        setIsPlaying(false);
        setProgress(100);
      }
    });
  }, [currentPage, mergedChapters, fetchAndPlayTTS]);

  const handlePause = useCallback(() => {
    if (audioRef.current && isPlayingRef.current) {
      audioRef.current.pause();
      isPlayingRef.current = false;
    }
    setIsPlaying(false);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (isLoading) return;
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  }, [isPlaying, isLoading, handlePlay, handlePause]);

  const goToPage = useCallback((page: number) => {
    stopAudio();
    setIsPlaying(false);
    setProgress(0);
    pageAutoNextRef.current = false;
    autoPlayOnPageChangeRef.current = true;
    setCurrentPage(page);
  }, [stopAudio]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < mergedChapters.length - 1) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, mergedChapters.length, goToPage]);

  // Auto-play next page after speech ends on current page
  useEffect(() => {
    if (pageAutoNextRef.current) {
      pageAutoNextRef.current = false;
      const timer = setTimeout(() => {
        handlePlay();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentPage, handlePlay]);

  // Auto-play when navigating to a new page via prev/next buttons
  useEffect(() => {
    if (autoPlayOnPageChangeRef.current) {
      autoPlayOnPageChangeRef.current = false;
      const timer = setTimeout(() => {
        handlePlay();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPage, handlePlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  // Get knowledge cards for this law
  const cards = knowledgeCardsData[lawKey];

  // Check if current chapter has an uploaded video
  // blob: URLs are session-only and become invalid after page refresh, so treat them as missing
  const isValidVideoUrl = chapter.videoUrl && chapter.videoUrl.trim() && !chapter.videoUrl.startsWith('blob:');
  const hasUploadedVideo = Boolean(isValidVideoUrl);
  const videoUrl = isValidVideoUrl ? chapter.videoUrl! : '';
  const isVideoFile = videoUrl && !videoUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

  return (
    <div className="space-y-6">
      {/* Main content: single page with video and text */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
        {/* Video animation or uploaded video */}
        <div className="relative">
          {hasUploadedVideo ? (
            isVideoFile ? (
              <div className="w-full aspect-video bg-black rounded-t-xl overflow-hidden">
                <video
                  key={videoUrl}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  loop
                  autoPlay
                  muted={false}
                  controls={false}
                  playsInline
                />
              </div>
            ) : (
              <div className="w-full aspect-video bg-gray-100 rounded-t-xl overflow-hidden flex items-center justify-center">
                <img
                  key={videoUrl}
                  src={videoUrl}
                  alt="教学图片"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )
          ) : (
            <AnimationScene key={`anim-${currentPage}`} type={chapter.videoType} isPlaying={isPlaying} />
          )}
        </div>

        {/* Progress bar - full width */}
        <div className="px-5 py-2">
          <div
            className="w-full h-1.5 bg-gray-200 rounded-full cursor-pointer"
            onClick={(e) => {
              if (!audioRef.current || !audioRef.current.duration || !isFinite(audioRef.current.duration)) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const pct = (x / rect.width) * 100;
              setProgress(pct);
              audioRef.current.currentTime = (pct / 100) * audioRef.current.duration;
            }}
          >
            <div
              className={`h-full rounded-full transition-all duration-100 ${lawColor}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Text content - no chapter number/title, just the text */}
        <div className="px-6 pb-5">
          <p className="text-gray-700 text-base leading-relaxed">{chapter.text}</p>
        </div>

        {/* Page dots */}
        <div className="flex items-center justify-center gap-2 pb-4">
          {mergedChapters.map((_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentPage
                  ? `${lawColor} scale-125`
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Bottom controls: Prev | Play/Pause | Next */}
        <div className="flex items-center justify-between px-6 pb-5">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="px-5 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            上一页
          </button>

          <button
            onClick={handlePlayPause}
            disabled={isLoading}
            className={`w-12 h-12 rounded-full text-white flex items-center justify-center transition-colors shadow-lg ${lawColor} ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {isLoading ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="animate-spin">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4" strokeDashoffset="10" />
              </svg>
            ) : isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>

          <button
            onClick={handleNextPage}
            disabled={currentPage === mergedChapters.length - 1}
            className={`px-5 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 ${lawColor}`}
          >
            下一页
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Knowledge Cards */}
      {cards && (
        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">知识要点卡片</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Background */}
            <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${lawColor} text-white flex items-center justify-center text-xs`}>
                  📜
                </div>
                <h4 className="font-bold text-gray-800 text-sm">定律背景</h4>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">{cards.background}</p>
            </div>

            {/* Card 2: Derivation */}
            <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${lawColor} text-white flex items-center justify-center text-xs`}>
                  🔬
                </div>
                <h4 className="font-bold text-gray-800 text-sm">推导过程</h4>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-line">{cards.derivation}</p>
            </div>

            {/* Card 3: Conclusion */}
            <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${lawColor} text-white flex items-center justify-center text-xs`}>
                  💡
                </div>
                <h4 className="font-bold text-gray-800 text-sm">定律结论</h4>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-line">{cards.conclusion}</p>
            </div>

            {/* Card 4: Application */}
            <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${lawColor} text-white flex items-center justify-center text-xs`}>
                  🌍
                </div>
                <h4 className="font-bold text-gray-800 text-sm">生活应用</h4>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-line">{cards.application}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
