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
function AnimationScene({ type, isPlaying, lawKey }: { type: string; isPlaying: boolean; lawKey: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  const lawKeyRef = useRef(lawKey);
  useEffect(() => { isPlayingRef.current = isPlaying; });
  useEffect(() => { lawKeyRef.current = lawKey; });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const drawIntro = (c: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
      // === 阿基米德浴缸场景 ===
      // 温暖的古希腊浴室背景
      const bgGrad = c.createLinearGradient(0, 0, 0, ch);
      bgGrad.addColorStop(0, '#fef3c7');
      bgGrad.addColorStop(0.4, '#fde68a');
      bgGrad.addColorStop(1, '#d4a373');
      c.fillStyle = bgGrad;
      c.fillRect(0, 0, cw, ch);

      // 地板纹理
      c.fillStyle = '#c9a86c';
      c.fillRect(0, ch * 0.88, cw, ch * 0.12);
      for (let i = 0; i < 8; i++) {
        c.strokeStyle = 'rgba(160,120,60,0.3)';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(i * cw / 8, ch * 0.88);
        c.lineTo(i * cw / 8, ch);
        c.stroke();
      }

      // 墙壁装饰 - 古希腊柱子
      for (const px of [cw * 0.05, cw * 0.95]) {
        c.fillStyle = '#e8d5b7';
        c.fillRect(px - 8, ch * 0.05, 16, ch * 0.83);
        c.fillStyle = '#d4b896';
        c.fillRect(px - 12, ch * 0.03, 24, 12);
        c.fillRect(px - 12, ch * 0.85, 24, 12);
        // 柱子凹槽
        c.strokeStyle = 'rgba(180,150,100,0.3)';
        c.lineWidth = 1;
        for (let gy = ch * 0.08; gy < ch * 0.83; gy += 20) {
          c.beginPath();
          c.moveTo(px - 6, gy);
          c.lineTo(px + 6, gy);
          c.stroke();
        }
      }

      // 窗户 - 蓝天
      const winX = cw * 0.78, winY = ch * 0.08, winW = cw * 0.14, winH = ch * 0.18;
      c.fillStyle = '#7dd3fc';
      c.fillRect(winX, winY, winW, winH);
      c.strokeStyle = '#d4b896';
      c.lineWidth = 3;
      c.strokeRect(winX, winY, winW, winH);
      c.beginPath();
      c.moveTo(winX + winW / 2, winY);
      c.lineTo(winX + winW / 2, winY + winH);
      c.moveTo(winX, winY + winH / 2);
      c.lineTo(winX + winW, winY + winH / 2);
      c.stroke();

      // === 浴缸 (石制，古希腊风格) ===
      const tubL = cw * 0.18, tubR = cw * 0.82;
      const tubTop = ch * 0.42, tubBot = ch * 0.86;
      const tubMidY = (tubTop + tubBot) / 2;

      // 浴缸阴影
      c.fillStyle = 'rgba(0,0,0,0.1)';
      c.beginPath();
      c.ellipse(cw * 0.5, tubBot + 8, (tubR - tubL) / 2 + 5, 10, 0, 0, Math.PI * 2);
      c.fill();

      // 浴缸外壁 - 石头纹理
      const tubGrad = c.createLinearGradient(0, tubTop, 0, tubBot);
      tubGrad.addColorStop(0, '#e8ddd0');
      tubGrad.addColorStop(0.3, '#d4c8b8');
      tubGrad.addColorStop(1, '#bfb09a');
      c.fillStyle = tubGrad;
      c.beginPath();
      c.moveTo(tubL + 10, tubTop);
      c.quadraticCurveTo(tubL - 10, tubMidY, tubL + 5, tubBot);
      c.lineTo(tubR - 5, tubBot);
      c.quadraticCurveTo(tubR + 10, tubMidY, tubR - 10, tubTop);
      c.closePath();
      c.fill();
      c.strokeStyle = '#a89880';
      c.lineWidth = 3;
      c.stroke();

      // 浴缸顶部边缘
      c.fillStyle = '#d4c8b8';
      c.beginPath();
      c.moveTo(tubL, tubTop - 6);
      c.quadraticCurveTo(cw * 0.5, tubTop - 14, tubR, tubTop - 6);
      c.lineTo(tubR, tubTop + 4);
      c.quadraticCurveTo(cw * 0.5, tubTop - 4, tubL, tubTop + 4);
      c.closePath();
      c.fill();
      c.strokeStyle = '#a89880';
      c.lineWidth = 2;
      c.stroke();

      // 浴缸内壁
      c.fillStyle = '#f5efe6';
      c.beginPath();
      c.moveTo(tubL + 14, tubTop + 4);
      c.quadraticCurveTo(tubL + 4, tubMidY, tubL + 12, tubBot - 6);
      c.lineTo(tubR - 12, tubBot - 6);
      c.quadraticCurveTo(tubR - 4, tubMidY, tubR - 14, tubTop + 4);
      c.closePath();
      c.fill();

      // === 浴缸中的水 ===
      // 水面随时间上升，t=0时水位较低，逐渐上升
      const waterFillT = Math.min(t / 120, 1); // 0~1, 约2秒填满
      const waterTopBase = tubTop + 15;
      const waterTopMin = tubTop + 35; // 初始水位较低
      const waterTopFinal = tubTop + 8; // 最终水位接近缸口
      const waterTop = waterTopMin + (waterTopFinal - waterTopMin) * waterFillT;

      // 水波纹
      const waveAmp = 2 + Math.sin(t * 0.08) * 1;

      const waterGrad = c.createLinearGradient(0, waterTop, 0, tubBot - 8);
      waterGrad.addColorStop(0, 'rgba(96, 165, 250, 0.55)');
      waterGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.5)');
      waterGrad.addColorStop(1, 'rgba(37, 99, 235, 0.6)');
      c.fillStyle = waterGrad;
      c.beginPath();
      c.moveTo(tubL + 14, waterTop);
      for (let wx = tubL + 14; wx <= tubR - 14; wx += 4) {
        const wy = waterTop + Math.sin((wx - tubL) * 0.06 + t * 0.06) * waveAmp;
        c.lineTo(wx, wy);
      }
      c.lineTo(tubR - 12, tubBot - 6);
      c.lineTo(tubL + 12, tubBot - 6);
      c.closePath();
      c.fill();

      // 水面高光
      c.strokeStyle = 'rgba(147, 197, 253, 0.5)';
      c.lineWidth = 1;
      c.beginPath();
      for (let wx = tubL + 20; wx <= tubR - 20; wx += 4) {
        const wy = waterTop + Math.sin((wx - tubL) * 0.06 + t * 0.06) * waveAmp - 1;
        if (wx === tubL + 20) c.moveTo(wx, wy); else c.lineTo(wx, wy);
      }
      c.stroke();

      // === 水溢出效果 (水位足够高时) ===
      if (waterFillT > 0.6) {
        const overflowAlpha = Math.min((waterFillT - 0.6) / 0.3, 0.7);
        // 溢出的水流沿浴缸外壁流下
        for (let si = 0; si < 3; si++) {
          const streamX = tubR - 20 - si * 30;
          const streamPhase = (t * 0.1 + si * 2) % 4;
          // 水流
          c.strokeStyle = `rgba(96, 165, 250, ${overflowAlpha * 0.6})`;
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(streamX, tubTop + 2);
          c.quadraticCurveTo(streamX + 3, tubTop + 30 + streamPhase * 15, streamX + 1, tubBot);
          c.stroke();
          // 水滴
          const dropY = tubTop + 10 + ((t * 3 + si * 40) % 80);
          const dropAlpha = Math.max(0, 1 - ((t * 3 + si * 40) % 80) / 80);
          c.fillStyle = `rgba(96, 165, 250, ${dropAlpha * overflowAlpha})`;
          c.beginPath();
          c.ellipse(streamX + 2, dropY, 3, 5, 0, 0, Math.PI * 2);
          c.fill();
        }
        // 地面水洼
        c.fillStyle = `rgba(96, 165, 250, ${overflowAlpha * 0.2})`;
        c.beginPath();
        c.ellipse(cw * 0.6, tubBot + 10, 50, 5, 0, 0, Math.PI * 2);
        c.fill();
      }

      // === 躺在浴缸中的阿基米德 ===
      const archX = cw * 0.45;
      const archY = waterTop + 5;

      // 身体在水中 - 躺姿
      // 躯干
      c.fillStyle = '#deb887';
      c.beginPath();
      c.ellipse(archX, archY + 8, 55, 14, -0.08, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#c49a6c';
      c.lineWidth = 1.5;
      c.stroke();

      // 左臂 (搭在浴缸边)
      c.fillStyle = '#deb887';
      c.beginPath();
      c.moveTo(archX - 50, archY + 2);
      c.quadraticCurveTo(archX - 65, archY - 15, tubL + 18, tubTop - 2);
      c.lineWidth = 8;
      c.strokeStyle = '#deb887';
      c.stroke();
      // 手
      c.beginPath();
      c.arc(tubL + 16, tubTop - 2, 6, 0, Math.PI * 2);
      c.fill();

      // 右臂 (在水中或举起来)
      const rightArmPhase = t > 80 ? Math.min((t - 80) / 20, 1) : 0; // 灵光一现时举起
      c.strokeStyle = '#deb887';
      c.lineWidth = 8;
      c.beginPath();
      c.moveTo(archX + 45, archY + 2);
      if (rightArmPhase > 0) {
        // 举起手臂
        const armEndX = archX + 55;
        const armEndY = archY - 50 * rightArmPhase;
        c.quadraticCurveTo(archX + 60, archY - 20 * rightArmPhase, armEndX, armEndY);
        c.stroke();
        // 手
        c.fillStyle = '#deb887';
        c.beginPath();
        c.arc(armEndX, armEndY, 6, 0, Math.PI * 2);
        c.fill();
        // 手指张开
        for (let fi = 0; fi < 5; fi++) {
          const fAngle = -Math.PI / 2 + (fi - 2) * 0.25;
          c.strokeStyle = '#deb887';
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(armEndX + Math.cos(fAngle) * 5, armEndY + Math.sin(fAngle) * 5);
          c.lineTo(armEndX + Math.cos(fAngle) * 14, armEndY + Math.sin(fAngle) * 14);
          c.stroke();
        }
      } else {
        c.quadraticCurveTo(archX + 60, archY + 5, archX + 65, archY + 8);
        c.stroke();
      }

      // 腿 (在水中，微微弯曲)
      c.strokeStyle = '#deb887';
      c.lineWidth = 9;
      // 左腿
      c.beginPath();
      c.moveTo(archX + 42, archY + 10);
      c.quadraticCurveTo(archX + 60, archY + 14, archX + 70, archY + 8);
      c.stroke();
      // 右腿
      c.beginPath();
      c.moveTo(archX + 38, archY + 14);
      c.quadraticCurveTo(archX + 55, archY + 20, archX + 72, archY + 18);
      c.stroke();

      // === 头部 ===
      const headX = archX - 58;
      const headY = archY - 5;

      // 脖子
      c.fillStyle = '#deb887';
      c.beginPath();
      c.moveTo(archX - 48, archY);
      c.lineTo(archX - 42, archY + 5);
      c.lineTo(headX + 8, headY + 5);
      c.lineTo(headX + 5, headY);
      c.closePath();
      c.fill();

      // 头
      c.fillStyle = '#deb887';
      c.beginPath();
      c.arc(headX, headY, 16, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#c49a6c';
      c.lineWidth = 1;
      c.stroke();

      // 头发 - 卷曲古希腊发型
      c.fillStyle = '#8B6914';
      for (let hi = 0; hi < 8; hi++) {
        const hAngle = -Math.PI + hi * 0.35;
        const hx = headX + Math.cos(hAngle) * 15;
        const hy = headY + Math.sin(hAngle) * 15 - 3;
        c.beginPath();
        c.arc(hx, hy, 5, 0, Math.PI * 2);
        c.fill();
      }
      // 额前卷发
      c.beginPath();
      c.arc(headX - 5, headY - 15, 5, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(headX + 4, headY - 16, 4, 0, Math.PI * 2);
      c.fill();

      // 胡须 (古希腊哲学家)
      c.fillStyle = '#8B6914';
      c.beginPath();
      c.moveTo(headX - 6, headY + 10);
      c.quadraticCurveTo(headX - 8, headY + 25, headX - 3, headY + 28);
      c.quadraticCurveTo(headX, headY + 30, headX + 3, headY + 28);
      c.quadraticCurveTo(headX + 8, headY + 25, headX + 6, headY + 10);
      c.fill();

      // 表情变化
      if (t > 80) {
        // 灵光一现 - 眼睛睁大
        c.fillStyle = 'white';
        c.beginPath();
        c.ellipse(headX - 5, headY - 2, 4, 5, 0, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(headX + 5, headY - 2, 4, 5, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#2d1810';
        c.beginPath();
        c.arc(headX - 5, headY - 2, 2.5, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(headX + 5, headY - 2, 2.5, 0, Math.PI * 2);
        c.fill();
        // 眉毛上扬
        c.strokeStyle = '#8B6914';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(headX - 9, headY - 9);
        c.lineTo(headX - 2, headY - 11);
        c.stroke();
        c.beginPath();
        c.moveTo(headX + 2, headY - 11);
        c.lineTo(headX + 9, headY - 9);
        c.stroke();
        // 嘴巴张开 (惊喜)
        c.fillStyle = '#c49a6c';
        c.beginPath();
        c.ellipse(headX, headY + 7, 4, 3, 0, 0, Math.PI * 2);
        c.fill();
      } else if (t > 30) {
        // 沉思 - 皱眉
        c.fillStyle = 'white';
        c.beginPath();
        c.ellipse(headX - 5, headY - 1, 3, 3.5, 0, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(headX + 5, headY - 1, 3, 3.5, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#2d1810';
        c.beginPath();
        c.arc(headX - 5, headY - 1, 2, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(headX + 5, headY - 1, 2, 0, Math.PI * 2);
        c.fill();
        // 皱眉
        c.strokeStyle = '#8B6914';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(headX - 9, headY - 7);
        c.quadraticCurveTo(headX - 5, headY - 9, headX - 2, headY - 7);
        c.stroke();
        c.beginPath();
        c.moveTo(headX + 2, headY - 7);
        c.quadraticCurveTo(headX + 5, headY - 9, headX + 9, headY - 7);
        c.stroke();
        // 嘴巴抿紧
        c.strokeStyle = '#c49a6c';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(headX - 3, headY + 6);
        c.lineTo(headX + 3, headY + 6);
        c.stroke();
      } else {
        // 闭眼休息
        c.strokeStyle = '#2d1810';
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(headX - 5, headY - 1, 3, 0, Math.PI);
        c.stroke();
        c.beginPath();
        c.arc(headX + 5, headY - 1, 3, 0, Math.PI);
        c.stroke();
        // 微笑
        c.strokeStyle = '#c49a6c';
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(headX, headY + 4, 4, 0.2, Math.PI - 0.2);
        c.stroke();
      }

      // === 思考泡泡 (t=30~80) ===
      if (t > 30 && t < 80) {
        const bubbleAlpha = Math.min(1, (t - 30) / 15) * (t > 70 ? Math.max(0, 1 - (t - 70) / 10) : 1);
        c.globalAlpha = bubbleAlpha;
        // 小圆泡
        c.fillStyle = 'rgba(255,255,255,0.8)';
        c.beginPath();
        c.arc(headX - 15, headY - 25, 4, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(headX - 22, headY - 35, 6, 0, Math.PI * 2);
        c.fill();
        // 大思考泡
        const thbX = headX - 30, thbY = headY - 60;
        c.beginPath();
        c.ellipse(thbX, thbY, 40, 25, -0.15, 0, Math.PI * 2);
        c.fillStyle = 'rgba(255,255,255,0.85)';
        c.fill();
        c.strokeStyle = 'rgba(200,200,200,0.5)';
        c.lineWidth = 1;
        c.stroke();
        // 泡内文字
        c.fillStyle = '#7c3aed';
        c.font = 'bold 11px sans-serif';
        c.textAlign = 'center';
        c.fillText('F浮 = G排 ?', thbX, thbY + 4);
        c.globalAlpha = 1;
      }

      // === 灵光效果 (t>80) ===
      if (t > 80) {
        const eurekaPhase = Math.min((t - 80) / 20, 1);
        // 头顶灯泡
        const bulbX = headX - 5, bulbY = headY - 45 - 10 * eurekaPhase;
        // 光晕
        const glowR = 25 + Math.sin(t * 0.15) * 5;
        const glowGrad = c.createRadialGradient(bulbX, bulbY, 5, bulbX, bulbY, glowR);
        glowGrad.addColorStop(0, 'rgba(251, 191, 36, 0.6)');
        glowGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
        c.fillStyle = glowGrad;
        c.beginPath();
        c.arc(bulbX, bulbY, glowR, 0, Math.PI * 2);
        c.fill();
        // 灯泡
        c.fillStyle = '#fef08a';
        c.beginPath();
        c.arc(bulbX, bulbY, 10, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#eab308';
        c.lineWidth = 2;
        c.stroke();
        // 灯泡底座
        c.fillStyle = '#9ca3af';
        c.fillRect(bulbX - 5, bulbY + 8, 10, 6);
        // 光芒
        c.strokeStyle = '#fbbf24';
        c.lineWidth = 2;
        for (let ri = 0; ri < 8; ri++) {
          const rAngle = ri * Math.PI / 4 + t * 0.03;
          const rLen = 16 + Math.sin(t * 0.1 + ri) * 3;
          c.beginPath();
          c.moveTo(bulbX + Math.cos(rAngle) * 12, bulbY + Math.sin(rAngle) * 12);
          c.lineTo(bulbX + Math.cos(rAngle) * rLen, bulbY + Math.sin(rAngle) * rLen);
          c.stroke();
        }

        // Eureka 文字 (t>100)
        if (t > 100) {
          const textAlpha = Math.min(1, (t - 100) / 15);
          const textScale = 1 + Math.sin(t * 0.1) * 0.05;
          c.save();
          c.translate(cw * 0.5, ch * 0.12);
          c.scale(textScale, textScale);
          c.globalAlpha = textAlpha;

          // 文字背景
          c.fillStyle = 'rgba(239, 68, 68, 0.9)';
          const txtW = 180, txtH = 44;
          const txtR = 12;
          c.beginPath();
          c.moveTo(-txtW / 2 + txtR, -txtH / 2);
          c.lineTo(txtW / 2 - txtR, -txtH / 2);
          c.arcTo(txtW / 2, -txtH / 2, txtW / 2, -txtH / 2 + txtR, txtR);
          c.lineTo(txtW / 2, txtH / 2 - txtR);
          c.arcTo(txtW / 2, txtH / 2, txtW / 2 - txtR, txtH / 2, txtR);
          c.lineTo(-txtW / 2 + txtR, txtH / 2);
          c.arcTo(-txtW / 2, txtH / 2, -txtW / 2, txtH / 2 - txtR, txtR);
          c.lineTo(-txtW / 2, -txtH / 2 + txtR);
          c.arcTo(-txtW / 2, -txtH / 2, -txtW / 2 + txtR, -txtH / 2, txtR);
          c.fill();

          // 文字
          c.fillStyle = '#ffffff';
          c.font = 'bold 28px Georgia, serif';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText('Eureka!', 0, 0);

          c.globalAlpha = 1;
          c.restore();

          // 星星特效
          for (let si = 0; si < 6; si++) {
            const starAngle = si * Math.PI / 3 + t * 0.04;
            const starDist = 110 + Math.sin(t * 0.08 + si) * 15;
            const sx = cw * 0.5 + Math.cos(starAngle) * starDist;
            const sy = ch * 0.12 + Math.sin(starAngle) * 30;
            const starSize = 4 + Math.sin(t * 0.12 + si * 2) * 2;
            c.fillStyle = `rgba(251, 191, 36, ${0.5 + Math.sin(t * 0.1 + si) * 0.3})`;
            // 四角星
            c.beginPath();
            c.moveTo(sx, sy - starSize);
            c.lineTo(sx + starSize * 0.3, sy);
            c.lineTo(sx, sy + starSize);
            c.lineTo(sx - starSize * 0.3, sy);
            c.closePath();
            c.fill();
            c.beginPath();
            c.moveTo(sx - starSize, sy);
            c.lineTo(sx, sy + starSize * 0.3);
            c.lineTo(sx + starSize, sy);
            c.lineTo(sx, sy - starSize * 0.3);
            c.closePath();
            c.fill();
          }
        }
      }

      // === 浴缸旁边的毛巾和橄榄枝 ===
      // 毛巾
      c.fillStyle = '#f0f0f0';
      c.beginPath();
      c.moveTo(tubR + 15, tubTop + 20);
      c.quadraticCurveTo(tubR + 30, tubTop + 30, tubR + 20, tubTop + 60);
      c.quadraticCurveTo(tubR + 25, tubTop + 75, tubR + 15, tubTop + 70);
      c.lineTo(tubR + 10, tubTop + 30);
      c.closePath();
      c.fill();
      c.strokeStyle = '#d1d5db';
      c.lineWidth = 1;
      c.stroke();

      // 橄榄枝装饰 (古希腊象征)
      c.strokeStyle = '#6b8e23';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(tubL - 20, tubTop + 10);
      c.quadraticCurveTo(tubL - 35, tubTop, tubL - 30, tubTop - 20);
      c.stroke();
      // 橄榄叶
      for (let li = 0; li < 4; li++) {
        const leafT = li / 3;
        const lx = tubL - 20 - leafT * 12;
        const ly = tubTop + 10 - leafT * 25;
        c.fillStyle = '#7cfc00';
        c.beginPath();
        c.ellipse(lx + (li % 2 ? 5 : -5), ly, 6, 3, li % 2 ? 0.3 : -0.3, 0, Math.PI * 2);
        c.fill();
      }

      // === 水面上的肥皂泡 ===
      for (let bi = 0; bi < 5; bi++) {
        const bx = tubL + 30 + bi * (tubR - tubL - 60) / 4 + Math.sin(t * 0.03 + bi * 1.5) * 8;
        const by = waterTop + Math.sin((bx - tubL) * 0.06 + t * 0.06) * waveAmp - 3 - bi * 2;
        const br = 4 + bi % 3;
        c.strokeStyle = `rgba(200, 220, 255, ${0.3 + Math.sin(t * 0.05 + bi) * 0.15})`;
        c.lineWidth = 1;
        c.beginPath();
        c.arc(bx, by, br, 0, Math.PI * 2);
        c.stroke();
        // 泡泡高光
        c.fillStyle = `rgba(255, 255, 255, ${0.2 + Math.sin(t * 0.05 + bi) * 0.1})`;
        c.beginPath();
        c.arc(bx - br * 0.3, by - br * 0.3, br * 0.3, 0, Math.PI * 2);
        c.fill();
      }

      // === 王冠 (浮在水面上) ===
      const crownAlpha = t > 20 ? Math.min(1, (t - 20) / 15) : 0;
      if (crownAlpha > 0) {
        c.globalAlpha = crownAlpha;
        const crownX = archX + 50;
        const crownBaseY = waterTop + Math.sin((crownX - tubL) * 0.06 + t * 0.06) * waveAmp - 2;
        // 王冠主体
        c.fillStyle = '#fbbf24';
        c.beginPath();
        c.moveTo(crownX - 14, crownBaseY);
        c.lineTo(crownX - 14, crownBaseY - 12);
        c.lineTo(crownX - 8, crownBaseY - 5);
        c.lineTo(crownX, crownBaseY - 18);
        c.lineTo(crownX + 8, crownBaseY - 5);
        c.lineTo(crownX + 14, crownBaseY - 12);
        c.lineTo(crownX + 14, crownBaseY);
        c.closePath();
        c.fill();
        c.strokeStyle = '#d97706';
        c.lineWidth = 1.5;
        c.stroke();
        // 宝石
        c.fillStyle = '#ef4444';
        c.beginPath();
        c.arc(crownX, crownBaseY - 10, 2, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#3b82f6';
        c.beginPath();
        c.arc(crownX - 7, crownBaseY - 7, 1.5, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(crownX + 7, crownBaseY - 7, 1.5, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 1;
      }

      // === 蒸汽效果 ===
      for (let si = 0; si < 4; si++) {
        const steamX = tubL + 30 + si * (tubR - tubL - 60) / 3;
        const steamBaseY = tubTop - 5;
        const steamY = steamBaseY - ((t * 0.8 + si * 25) % 60);
        const steamAlpha = Math.max(0, 0.15 - ((t * 0.8 + si * 25) % 60) / 400);
        c.fillStyle = `rgba(255, 255, 255, ${steamAlpha})`;
        c.beginPath();
        c.ellipse(steamX + Math.sin(t * 0.02 + si) * 10, steamY, 15, 8, 0, 0, Math.PI * 2);
        c.fill();
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

    // ===================== OHM'S LAW ANIMATIONS =====================

    const drawOhmIntro = (c: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
      // Dark circuit-board background
      const bgGrad = c.createLinearGradient(0, 0, 0, ch);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(1, '#1e293b');
      c.fillStyle = bgGrad;
      c.fillRect(0, 0, cw, ch);

      // Circuit board traces
      c.strokeStyle = 'rgba(245, 158, 11, 0.15)';
      c.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const y = ch * 0.1 + i * ch * 0.12;
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(cw * 0.3, y);
        c.lineTo(cw * 0.35, y + 10);
        c.lineTo(cw * 0.6, y + 10);
        c.stroke();
      }

      // Light bulb in center (off at start, turns on later)
      const bulbCX = cw * 0.5;
      const bulbCY = ch * 0.4;
      const glowPhase = Math.min(1, Math.max(0, (t - 30) / 40));

      // Wires from bulb
      c.strokeStyle = '#94a3b8';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(bulbCX - 30, bulbCY + 40);
      c.lineTo(bulbCX - 30, bulbCY + 90);
      c.lineTo(bulbCX - 80, bulbCY + 90);
      c.stroke();
      c.beginPath();
      c.moveTo(bulbCX + 30, bulbCY + 40);
      c.lineTo(bulbCX + 30, bulbCY + 90);
      c.lineTo(bulbCX + 80, bulbCY + 90);
      c.stroke();

      // Battery symbol on left wire
      const batX = bulbCX - 80;
      const batY = bulbCY + 90;
      c.strokeStyle = '#f59e0b';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(batX, batY - 12);
      c.lineTo(batX, batY + 12);
      c.stroke();
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(batX - 8, batY - 6);
      c.lineTo(batX - 8, batY + 6);
      c.stroke();

      // Switch on right wire
      const swX = bulbCX + 80;
      const swY = bulbCY + 90;
      c.strokeStyle = '#94a3b8';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(swX - 8, swY, 4, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(swX + 8, swY, 4, 0, Math.PI * 2);
      c.fill();
      if (t > 20) {
        // Switch closed
        c.beginPath();
        c.moveTo(swX - 8, swY);
        c.lineTo(swX + 8, swY);
        c.stroke();
      } else {
        c.beginPath();
        c.moveTo(swX - 8, swY);
        c.lineTo(swX + 4, swY - 14);
        c.stroke();
      }

      // Resistor symbol on top
      c.strokeStyle = '#94a3b8';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(bulbCX - 80, bulbCY + 90);
      c.lineTo(bulbCX - 80, ch * 0.15);
      c.lineTo(bulbCX - 30, ch * 0.15);
      // zigzag
      const zigStart = bulbCX - 30;
      const zigEnd = bulbCX + 30;
      const zigW = 10;
      for (let x = zigStart; x < zigEnd; x += zigW) {
        const dir = ((x - zigStart) / zigW) % 2 === 0 ? -1 : 1;
        c.lineTo(x + zigW / 2, ch * 0.15 + dir * 8);
        c.lineTo(x + zigW, ch * 0.15);
      }
      c.lineTo(bulbCX + 80, ch * 0.15);
      c.lineTo(bulbCX + 80, bulbCY + 90);
      c.stroke();

      // Bulb glass
      c.fillStyle = `rgba(255, 255, 200, ${0.1 + glowPhase * 0.6})`;
      c.strokeStyle = '#e2e8f0';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(bulbCX, bulbCY, 30, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // Bulb filament
      c.strokeStyle = `rgba(255, ${180 + glowPhase * 75}, ${50 + glowPhase * 100}, ${0.5 + glowPhase * 0.5})`;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(bulbCX - 8, bulbCY + 15);
      for (let i = 0; i < 5; i++) {
        c.lineTo(bulbCX - 8 + i * 4, bulbCY + 15 - (i % 2 === 0 ? 0 : 10));
      }
      c.stroke();

      // Glow effect when on
      if (glowPhase > 0) {
        const glowGrad = c.createRadialGradient(bulbCX, bulbCY, 5, bulbCX, bulbCY, 60 + glowPhase * 30);
        glowGrad.addColorStop(0, `rgba(255, 220, 50, ${glowPhase * 0.4})`);
        glowGrad.addColorStop(1, 'rgba(255, 220, 50, 0)');
        c.fillStyle = glowGrad;
        c.beginPath();
        c.arc(bulbCX, bulbCY, 60 + glowPhase * 30, 0, Math.PI * 2);
        c.fill();
      }

      // Bulb base
      c.fillStyle = '#94a3b8';
      c.fillRect(bulbCX - 12, bulbCY + 28, 24, 14);

      // Electron particles flowing when circuit is on
      if (t > 25) {
        const electronCount = 6;
        for (let i = 0; i < electronCount; i++) {
          const phase = (t * 0.03 + i / electronCount) % 1;
          let ex: number, ey: number;
          // Simple rectangular path
          if (phase < 0.25) {
            ex = bulbCX + 80 - phase * 4 * 160;
            ey = bulbCY + 90;
          } else if (phase < 0.5) {
            ex = bulbCX - 80;
            ey = bulbCY + 90 - (phase - 0.25) * 4 * (bulbCY + 90 - ch * 0.15);
          } else if (phase < 0.75) {
            ex = bulbCX - 80 + (phase - 0.5) * 4 * 160;
            ey = ch * 0.15;
          } else {
            ex = bulbCX + 80;
            ey = ch * 0.15 + (phase - 0.75) * 4 * (bulbCY + 90 - ch * 0.15);
          }
          c.fillStyle = '#38bdf8';
          c.beginPath();
          c.arc(ex, ey, 3, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = 'rgba(56, 189, 248, 0.3)';
          c.beginPath();
          c.arc(ex, ey, 6, 0, Math.PI * 2);
          c.fill();
        }
      }

      // Title text
      c.fillStyle = '#f59e0b';
      c.font = 'bold 18px sans-serif';
      c.textAlign = 'center';
      c.fillText('欧姆定律', cw / 2, ch * 0.9);

      // Question marks
      if (t < 30) {
        c.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(t * 0.1) * 0.3})`;
        c.font = 'bold 22px sans-serif';
        c.fillText('I = ?  U = ?  R = ?', cw / 2, ch * 0.97);
      } else {
        c.fillStyle = `rgba(245, 158, 11, ${0.5 + Math.sin(t * 0.08) * 0.3})`;
        c.font = 'bold 16px sans-serif';
        c.fillText('I = U / R', cw / 2, ch * 0.97);
      }
    };

    const drawOhmDerivation = (c: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
      const bgGrad = c.createLinearGradient(0, 0, 0, ch);
      bgGrad.addColorStop(0, '#fffbeb');
      bgGrad.addColorStop(1, '#fef3c7');
      c.fillStyle = bgGrad;
      c.fillRect(0, 0, cw, ch);

      const step = Math.min(Math.floor(t / 80), 4);

      // === Experiment 1: R constant, I ∝ U ===
      const exp1X = cw * 0.25;
      const exp1Y = ch * 0.08;

      c.fillStyle = '#92400e';
      c.font = 'bold 14px sans-serif';
      c.textAlign = 'center';
      c.fillText('实验一：R 不变', exp1X, exp1Y + 12);

      // Simple circuit diagram for exp1
      c.strokeStyle = '#78716c';
      c.lineWidth = 2;

      // Battery
      const bx1 = exp1X - 60;
      const by1 = exp1Y + 30;
      c.beginPath(); c.moveTo(bx1, by1); c.lineTo(bx1, by1 + 40); c.stroke();
      c.strokeStyle = '#f59e0b'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(bx1 - 8, by1 + 40); c.lineTo(bx1 + 8, by1 + 40); c.stroke();
      c.strokeStyle = '#f59e0b'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(bx1 - 4, by1 + 46); c.lineTo(bx1 + 4, by1 + 46); c.stroke();
      c.strokeStyle = '#78716c'; c.lineWidth = 2;

      // Resistor (fixed)
      const rx1 = exp1X + 30;
      const ry1 = exp1Y + 30;
      c.beginPath();
      c.moveTo(bx1, by1);
      c.lineTo(rx1 - 20, by1);
      // zigzag
      for (let i = 0; i < 6; i++) {
        c.lineTo(rx1 - 20 + i * 7 + 3.5, by1 + (i % 2 === 0 ? -6 : 6));
        c.lineTo(rx1 - 20 + (i + 1) * 7, by1);
      }
      c.lineTo(rx1 + 30, by1);
      c.lineTo(rx1 + 30, by1 + 40);
      c.lineTo(bx1, by1 + 46);
      c.stroke();

      // R label
      c.fillStyle = '#dc2626';
      c.font = 'bold 11px sans-serif';
      c.textAlign = 'center';
      c.fillText('R=10Ω', rx1, by1 - 12);

      // Data table for exp1
      if (step >= 1) {
        const tableX = exp1X - 70;
        const tableY = exp1Y + 90;
        c.fillStyle = '#78350f';
        c.font = '11px sans-serif';
        c.textAlign = 'left';
        c.fillText('U(V)    I(A)', tableX, tableY);

        const data1 = [
          ['2V', '0.2A'],
          ['4V', '0.4A'],
          ['6V', '0.6A'],
        ];
        data1.forEach((row, i) => {
          if (step >= 1 + i * 0.3) {
            const alpha = Math.min(1, (t - 80 - i * 25) / 20);
            c.globalAlpha = Math.max(0, alpha);
            c.fillStyle = '#374151';
            c.fillText(`${row[0]}      ${row[1]}`, tableX, tableY + 18 + i * 16);
            c.globalAlpha = 1;
          }
        });

        // Arrow showing proportional
        if (step >= 2) {
          c.fillStyle = '#16a34a';
          c.font = 'bold 12px sans-serif';
          c.textAlign = 'center';
          c.fillText('I ∝ U ✓', exp1X, tableY + 72);
        }
      }

      // === Experiment 2: U constant, I ∝ 1/R ===
      const exp2X = cw * 0.72;
      const exp2Y = ch * 0.08;

      c.fillStyle = '#92400e';
      c.font = 'bold 14px sans-serif';
      c.textAlign = 'center';
      c.fillText('实验二：U 不变', exp2X, exp2Y + 12);

      // Simple circuit diagram for exp2
      c.strokeStyle = '#78716c';
      c.lineWidth = 2;

      const bx2 = exp2X - 60;
      const by2 = exp2Y + 30;
      c.beginPath(); c.moveTo(bx2, by2); c.lineTo(bx2, by2 + 40); c.stroke();
      c.strokeStyle = '#f59e0b'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(bx2 - 8, by2 + 40); c.lineTo(bx2 + 8, by2 + 40); c.stroke();
      c.strokeStyle = '#f59e0b'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(bx2 - 4, by2 + 46); c.lineTo(bx2 + 4, by2 + 46); c.stroke();
      c.strokeStyle = '#78716c'; c.lineWidth = 2;

      const rx2 = exp2X + 30;
      c.beginPath();
      c.moveTo(bx2, by2);
      c.lineTo(rx2 - 20, by2);
      for (let i = 0; i < 6; i++) {
        c.lineTo(rx2 - 20 + i * 7 + 3.5, by2 + (i % 2 === 0 ? -6 : 6));
        c.lineTo(rx2 - 20 + (i + 1) * 7, by2);
      }
      c.lineTo(rx2 + 30, by2);
      c.lineTo(rx2 + 30, by2 + 40);
      c.lineTo(bx2, by2 + 46);
      c.stroke();

      // R label (variable)
      c.fillStyle = '#2563eb';
      c.font = 'bold 11px sans-serif';
      c.textAlign = 'center';
      c.fillText('R可变', rx2, by2 - 12);

      // Voltage label
      c.fillStyle = '#dc2626';
      c.font = '11px sans-serif';
      c.fillText('U=6V恒定', exp2X, by2 + 56);

      // Data table for exp2
      if (step >= 2) {
        const tableX2 = exp2X - 70;
        const tableY2 = exp2Y + 90;
        c.fillStyle = '#78350f';
        c.font = '11px sans-serif';
        c.textAlign = 'left';
        c.fillText('R(Ω)    I(A)', tableX2, tableY2);

        const data2 = [
          ['5Ω', '1.2A'],
          ['10Ω', '0.6A'],
          ['15Ω', '0.4A'],
        ];
        data2.forEach((row, i) => {
          const alpha = Math.min(1, (t - 160 - i * 25) / 20);
          c.globalAlpha = Math.max(0, alpha);
          c.fillStyle = '#374151';
          c.fillText(`${row[0]}      ${row[1]}`, tableX2, tableY2 + 18 + i * 16);
          c.globalAlpha = 1;
        });

        if (step >= 3) {
          c.fillStyle = '#16a34a';
          c.font = 'bold 12px sans-serif';
          c.textAlign = 'center';
          c.fillText('I ∝ 1/R ✓', exp2X, tableY2 + 72);
        }
      }

      // === Final Conclusion at bottom ===
      if (step >= 4) {
        const alpha = Math.min(1, (t - 320) / 30);
        c.globalAlpha = Math.max(0, alpha);
        const pulse = 1 + Math.sin(t * 0.08) * 0.02;
        c.save();
        c.translate(cw / 2, ch * 0.92);
        c.scale(pulse, pulse);
        c.fillStyle = '#fef3c7';
        c.beginPath();
        c.roundRect(-120, -18, 240, 36, 8);
        c.fill();
        c.strokeStyle = '#f59e0b';
        c.lineWidth = 2;
        c.beginPath();
        c.roundRect(-120, -18, 240, 36, 8);
        c.stroke();
        c.fillStyle = '#92400e';
        c.font = 'bold 18px sans-serif';
        c.textAlign = 'center';
        c.fillText('I = U / R', 0, 7);
        c.restore();
        c.globalAlpha = 1;
      }
    };

    const drawOhmConclusion = (c: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
      const bgGrad = c.createLinearGradient(0, 0, 0, ch);
      bgGrad.addColorStop(0, '#fffbeb');
      bgGrad.addColorStop(1, '#fef3c7');
      c.fillStyle = bgGrad;
      c.fillRect(0, 0, cw, ch);

      c.fillStyle = '#92400e';
      c.font = 'bold 18px sans-serif';
      c.textAlign = 'center';
      c.fillText('欧姆定律', cw / 2, ch * 0.1);

      // Pulsing formula
      const pulse = 1 + Math.sin(t * 0.08) * 0.03;
      c.save();
      c.translate(cw / 2, ch * 0.28);
      c.scale(pulse, pulse);
      c.fillStyle = '#fef3c7';
      c.beginPath();
      c.roundRect(-140, -25, 280, 50, 12);
      c.fill();
      c.strokeStyle = '#f59e0b';
      c.lineWidth = 2;
      c.beginPath();
      c.roundRect(-140, -25, 280, 50, 12);
      c.stroke();
      c.fillStyle = '#78350f';
      c.font = 'bold 20px sans-serif';
      c.fillText('I = U / R', 0, 8);
      c.restore();

      // Triangle diagram: U on top, I bottom-left, R bottom-right
      const triCX = cw * 0.35;
      const triCY = ch * 0.6;
      const triSize = 50;

      c.strokeStyle = '#f59e0b';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(triCX, triCY - triSize);
      c.lineTo(triCX - triSize, triCY + triSize * 0.6);
      c.lineTo(triCX + triSize, triCY + triSize * 0.6);
      c.closePath();
      c.stroke();

      // Horizontal divider
      c.beginPath();
      c.moveTo(triCX - triSize, triCY + triSize * 0.6);
      c.lineTo(triCX + triSize, triCY + triSize * 0.6);
      c.stroke();

      // Labels
      c.fillStyle = '#dc2626';
      c.font = 'bold 16px sans-serif';
      c.textAlign = 'center';
      c.fillText('U', triCX, triCY - triSize - 8);
      c.fillStyle = '#2563eb';
      c.fillText('I', triCX - triSize - 12, triCY + triSize * 0.6 + 5);
      c.fillStyle = '#16a34a';
      c.fillText('R', triCX + triSize + 12, triCY + triSize * 0.6 + 5);

      // Key points
      const showIdx = Math.floor(t / 40);
      const points = [
        'I、U、R 必须对应同一段电路',
        '电阻 R 是导体本身的性质',
        'R 不随 U 或 I 的变化而变化！',
      ];
      points.forEach((pt, i) => {
        if (showIdx > i) {
          const alpha = Math.min(1, (t - (i + 1) * 40) / 20);
          c.globalAlpha = alpha;
          c.fillStyle = '#374151';
          c.font = '14px sans-serif';
          c.textAlign = 'left';
          c.fillText(`• ${pt}`, cw * 0.5, ch * (0.5 + i * 0.12));
          c.globalAlpha = 1;
        }
      });

      // Warning box
      if (showIdx >= 3) {
        const warnAlpha = Math.min(1, (t - 120) / 20);
        c.globalAlpha = warnAlpha;
        c.fillStyle = '#fef2f2';
        c.strokeStyle = '#ef4444';
        c.lineWidth = 2;
        c.beginPath();
        c.roundRect(cw * 0.15, ch * 0.82, cw * 0.7, ch * 0.12, 8);
        c.fill();
        c.stroke();
        c.fillStyle = '#dc2626';
        c.font = 'bold 13px sans-serif';
        c.textAlign = 'center';
        c.fillText('⚠ 错误说法："电阻与电压成正比" —— R 由材料、长度、截面积决定！', cw / 2, ch * 0.9);
        c.globalAlpha = 1;
      }
    };

    const drawOhmApplication = (c: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
      // Dark tech background
      const bgGrad = c.createLinearGradient(0, 0, 0, ch);
      bgGrad.addColorStop(0, '#1e293b');
      bgGrad.addColorStop(1, '#0f172a');
      c.fillStyle = bgGrad;
      c.fillRect(0, 0, cw, ch);

      // Grid lines
      c.strokeStyle = 'rgba(245, 158, 11, 0.08)';
      c.lineWidth = 1;
      for (let x = 0; x < cw; x += 40) {
        c.beginPath(); c.moveTo(x, 0); c.lineTo(x, ch); c.stroke();
      }
      for (let y = 0; y < ch; y += 40) {
        c.beginPath(); c.moveTo(0, y); c.lineTo(cw, y); c.stroke();
      }

      // Scene 1: Home circuit (left)
      const sceneProgress1 = Math.min(1, t / 60);
      c.globalAlpha = sceneProgress1;

      // House outline
      const hx = cw * 0.15;
      const hy = ch * 0.25;
      c.strokeStyle = '#94a3b8';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(hx, hy + 80);
      c.lineTo(hx, hy + 20);
      c.lineTo(hx + 60, hy);
      c.lineTo(hx + 120, hy + 20);
      c.lineTo(hx + 120, hy + 80);
      c.stroke();

      // Light bulb in house
      const bulbOn = t > 20;
      c.fillStyle = bulbOn ? 'rgba(255, 220, 50, 0.8)' : 'rgba(100, 100, 100, 0.3)';
      c.beginPath();
      c.arc(hx + 60, hy + 45, 12, 0, Math.PI * 2);
      c.fill();
      if (bulbOn) {
        const glow = c.createRadialGradient(hx + 60, hy + 45, 3, hx + 60, hy + 45, 30);
        glow.addColorStop(0, 'rgba(255, 220, 50, 0.3)');
        glow.addColorStop(1, 'rgba(255, 220, 50, 0)');
        c.fillStyle = glow;
        c.beginPath();
        c.arc(hx + 60, hy + 45, 30, 0, Math.PI * 2);
        c.fill();
      }

      c.fillStyle = '#e2e8f0';
      c.font = '11px sans-serif';
      c.textAlign = 'center';
      c.fillText('家用电路', hx + 60, hy + 100);
      c.fillStyle = '#f59e0b';
      c.font = '10px sans-serif';
      c.fillText('I = P/U 选导线', hx + 60, hy + 115);

      c.globalAlpha = 1;

      // Scene 2: Phone charger (center)
      const sceneProgress2 = Math.min(1, Math.max(0, (t - 30) / 40));
      c.globalAlpha = sceneProgress2;

      const px = cw * 0.45;
      const py = ch * 0.2;

      // Phone body
      c.fillStyle = '#374151';
      c.strokeStyle = '#64748b';
      c.lineWidth = 2;
      c.beginPath();
      c.roundRect(px, py, 50, 90, 6);
      c.fill();
      c.stroke();

      // Screen
      c.fillStyle = '#1e40af';
      c.fillRect(px + 5, py + 10, 40, 60);

      // Charging icon
      if (t > 40) {
        c.fillStyle = '#fbbf24';
        c.font = 'bold 20px sans-serif';
        c.textAlign = 'center';
        c.fillText('⚡', px + 25, py + 48);
      }

      // Charger box below phone
      c.fillStyle = '#f5f5f5';
      c.strokeStyle = '#94a3b8';
      c.lineWidth = 1;
      c.beginPath();
      c.roundRect(px + 10, py + 95, 30, 18, 3);
      c.fill();
      c.stroke();

      // USB cable
      c.strokeStyle = '#94a3b8';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(px + 25, py + 90);
      c.lineTo(px + 25, py + 95);
      c.stroke();

      c.fillStyle = '#e2e8f0';
      c.font = '11px sans-serif';
      c.textAlign = 'center';
      c.fillText('手机充电器', px + 25, py + 130);
      c.fillStyle = '#f59e0b';
      c.font = '10px sans-serif';
      c.fillText('5V / 2A 输出', px + 25, py + 145);

      c.globalAlpha = 1;

      // Scene 3: LED with resistor (right)
      const sceneProgress3 = Math.min(1, Math.max(0, (t - 60) / 40));
      c.globalAlpha = sceneProgress3;

      const lx = cw * 0.75;
      const ly = ch * 0.2;

      // LED
      c.fillStyle = '#ef4444';
      c.beginPath();
      c.arc(lx + 40, ly + 30, 15, 0, Math.PI * 2);
      c.fill();
      if (t > 80) {
        const ledGlow = c.createRadialGradient(lx + 40, ly + 30, 3, lx + 40, ly + 30, 30);
        ledGlow.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
        ledGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
        c.fillStyle = ledGlow;
        c.beginPath();
        c.arc(lx + 40, ly + 30, 30, 0, Math.PI * 2);
        c.fill();
      }

      // Resistor
      c.strokeStyle = '#94a3b8';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(lx, ly + 30);
      c.lineTo(lx + 10, ly + 30);
      for (let i = 0; i < 5; i++) {
        c.lineTo(lx + 10 + i * 4 + 2, ly + 30 + (i % 2 === 0 ? -5 : 5));
        c.lineTo(lx + 10 + (i + 1) * 4, ly + 30);
      }
      c.lineTo(lx + 35, ly + 30);
      c.stroke();

      // Connection
      c.strokeStyle = '#64748b';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(lx, ly + 30);
      c.lineTo(lx, ly + 70);
      c.lineTo(lx + 40, ly + 70);
      c.lineTo(lx + 40, ly + 45);
      c.stroke();

      c.fillStyle = '#e2e8f0';
      c.font = '11px sans-serif';
      c.textAlign = 'center';
      c.fillText('LED限流电阻', lx + 20, ly + 90);
      c.fillStyle = '#f59e0b';
      c.font = '10px sans-serif';
      c.fillText('R = U/I 防烧毁', lx + 20, ly + 105);

      c.globalAlpha = 1;

      // Bottom: flowing electrons
      if (t > 20) {
        for (let i = 0; i < 10; i++) {
          const phase = (t * 0.02 + i / 10) % 1;
          const ex = phase * cw;
          const ey = ch * 0.85 + Math.sin(phase * 6 + t * 0.05) * 8;
          c.fillStyle = '#38bdf8';
          c.beginPath();
          c.arc(ex, ey, 2.5, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = 'rgba(56, 189, 248, 0.2)';
          c.beginPath();
          c.arc(ex, ey, 6, 0, Math.PI * 2);
          c.fill();
        }
      }

      // Bottom text
      c.fillStyle = '#f59e0b';
      c.font = 'bold 14px sans-serif';
      c.textAlign = 'center';
      c.fillText('欧姆定律：理解用电安全的基石', cw / 2, ch * 0.96);
    };

    // ===================== HOOKE'S LAW ANIMATIONS =====================

    const drawHookeIntro = (c: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
      // Background - warm gradient
      const bg = c.createLinearGradient(0, 0, 0, ch);
      bg.addColorStop(0, '#1a1a2e');
      bg.addColorStop(1, '#16213e');
      c.fillStyle = bg;
      c.fillRect(0, 0, cw, ch);

      // Grid lines
      c.strokeStyle = 'rgba(16, 185, 129, 0.06)';
      c.lineWidth = 1;
      for (let x = 0; x < cw; x += 30) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, ch); c.stroke(); }
      for (let y = 0; y < ch; y += 30) { c.beginPath(); c.moveTo(0, y); c.lineTo(cw, y); c.stroke(); }

      // Title fade in
      const titleAlpha = Math.min(1, t / 40);
      c.globalAlpha = titleAlpha;
      c.fillStyle = '#10b981';
      c.font = 'bold 22px sans-serif';
      c.textAlign = 'center';
      c.fillText('弹力的秘密', cw / 2, ch * 0.08);

      // === Spring animation (left side) ===
      const springX = cw * 0.25;
      const springTopY = ch * 0.2;
      const springRestLen = ch * 0.3;
      const stretchAmt = Math.sin(t * 0.03) * 30;
      const springBotY = springTopY + springRestLen + stretchAmt;

      // Fixed support at top
      c.fillStyle = '#555';
      c.fillRect(springX - 25, springTopY - 8, 50, 8);
      c.fillStyle = '#888';
      for (let i = 0; i < 5; i++) {
        c.fillRect(springX - 20 + i * 10, springTopY - 14, 3, 8);
      }

      // Draw spring coils
      const coils = 8;
      const coilW = 18;
      c.strokeStyle = '#10b981';
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(springX, springTopY);
      const segH = (springBotY - springTopY) / (coils * 2);
      for (let i = 0; i < coils * 2; i++) {
        const nx = (i % 2 === 0) ? springX + coilW : springX - coilW;
        c.lineTo(nx, springTopY + (i + 1) * segH);
      }
      c.lineTo(springX, springBotY);
      c.stroke();

      // Weight block at bottom
      c.fillStyle = '#e74c3c';
      c.fillRect(springX - 15, springBotY, 30, 25);
      c.fillStyle = '#fff';
      c.font = '10px sans-serif';
      c.textAlign = 'center';
      c.fillText('F', springX, springBotY + 16);

      // Stretch indicator
      if (Math.abs(stretchAmt) > 5) {
        c.strokeStyle = '#f59e0b';
        c.lineWidth = 1.5;
        c.setLineDash([4, 3]);
        const restBot = springTopY + springRestLen;
        c.beginPath(); c.moveTo(springX + 25, restBot); c.lineTo(springX + 25, springBotY); c.stroke();
        c.setLineDash([]);
        c.fillStyle = '#f59e0b';
        c.font = '11px sans-serif';
        c.fillText('x', springX + 35, (restBot + springBotY) / 2 + 4);
      }

      // === Bouncing ball (right side) - trampoline ===
      const ballX = cw * 0.72;
      const bounceH = Math.abs(Math.sin(t * 0.05)) * ch * 0.25;
      const ballY = ch * 0.7 - bounceH;
      const ballR = 16;

      // Trampoline base
      c.fillStyle = '#555';
      c.fillRect(ballX - 40, ch * 0.72, 80, 6);
      // Trampoline legs
      c.strokeStyle = '#777';
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(ballX - 35, ch * 0.726); c.lineTo(ballX - 45, ch * 0.8); c.stroke();
      c.beginPath(); c.moveTo(ballX + 35, ch * 0.726); c.lineTo(ballX + 45, ch * 0.8); c.stroke();
      // Trampoline surface
      c.strokeStyle = '#10b981';
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(ballX - 38, ch * 0.72); c.quadraticCurveTo(ballX, ch * 0.72 + 4, ballX + 38, ch * 0.72); c.stroke();

      // Ball
      const ballGrad = c.createRadialGradient(ballX - 4, ballY - 4, 2, ballX, ballY, ballR);
      ballGrad.addColorStop(0, '#ff9f43');
      ballGrad.addColorStop(1, '#e74c3c');
      c.fillStyle = ballGrad;
      c.beginPath(); c.arc(ballX, ballY, ballR, 0, Math.PI * 2); c.fill();

      // Arrow showing direction
      if (bounceH > 10) {
        c.strokeStyle = 'rgba(16, 185, 129, 0.6)';
        c.lineWidth = 2;
        c.beginPath(); c.moveTo(ballX, ballY + ballR + 3); c.lineTo(ballX, ballY + ballR + 15); c.stroke();
        c.beginPath(); c.moveTo(ballX - 4, ballY + ballR + 11); c.lineTo(ballX, ballY + ballR + 15); c.lineTo(ballX + 4, ballY + ballR + 11); c.stroke();
      }

      // === Robert Hooke silhouette (center) ===
      const hookeX = cw * 0.5;
      const hookeY = ch * 0.5;
      const hookeAlpha = Math.min(1, Math.max(0, (t - 60) / 40));
      c.globalAlpha = hookeAlpha * 0.15;
      c.fillStyle = '#10b981';
      // Head
      c.beginPath(); c.arc(hookeX, hookeY - 30, 20, 0, Math.PI * 2); c.fill();
      // Body
      c.fillRect(hookeX - 12, hookeY - 10, 24, 40);
      c.globalAlpha = hookeAlpha;

      // Hooke name
      c.fillStyle = '#10b981';
      c.font = 'bold 13px sans-serif';
      c.fillText('罗伯特·胡克', hookeX, hookeY + 30);
      c.font = '11px sans-serif';
      c.fillStyle = '#a8d8c8';
      c.fillText('Robert Hooke', hookeX, hookeY + 45);
      c.fillText('1635-1703', hookeX, hookeY + 58);

      // === Bottom text ===
      c.globalAlpha = Math.min(1, Math.max(0, (t - 100) / 40));
      c.fillStyle = '#d1fae5';
      c.font = 'bold 16px sans-serif';
      c.textAlign = 'center';
      c.fillText('弹力与形变之间，隐藏着怎样的规律？', cw / 2, ch * 0.92);

      c.globalAlpha = 1;
    };

    const drawHookeDerivation = (c: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
      // Background
      const bg = c.createLinearGradient(0, 0, 0, ch);
      bg.addColorStop(0, '#0f172a');
      bg.addColorStop(1, '#1e293b');
      c.fillStyle = bg;
      c.fillRect(0, 0, cw, ch);

      c.textAlign = 'center';

      // Title
      c.fillStyle = '#10b981';
      c.font = 'bold 16px sans-serif';
      c.fillText('弹簧实验：弹力与形变的关系', cw / 2, ch * 0.06);

      // === Left: Spring experiment setup ===
      const expX = cw * 0.28;
      const supY = ch * 0.14;

      // Support bar
      c.fillStyle = '#64748b';
      c.fillRect(expX - 35, supY, 70, 6);
      c.fillStyle = '#475569';
      for (let i = 0; i < 6; i++) c.fillRect(expX - 30 + i * 12, supY - 6, 3, 8);

      // Ruler on the side
      c.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      c.lineWidth = 1;
      const rulerX = expX + 30;
      for (let y = supY + 10; y < ch * 0.82; y += 15) {
        c.beginPath(); c.moveTo(rulerX, y); c.lineTo(rulerX + 8, y); c.stroke();
      }
      c.fillStyle = '#94a3b8';
      c.font = '8px sans-serif';
      c.textAlign = 'left';
      c.fillText('cm', rulerX + 10, supY + 20);

      // Show 3 experiment stages progressively
      const stages = [
        { weight: 1, label: '1个钩码', F: 0.5, delay: 30 },
        { weight: 2, label: '2个钩码', F: 1.0, delay: 90 },
        { weight: 3, label: '3个钩码', F: 1.5, delay: 150 },
      ];

      const baseSpringLen = ch * 0.2;
      const extPerWeight = ch * 0.08;

      // Determine current stage based on time
      let currentStage = 0;
      for (let i = 0; i < stages.length; i++) {
        if (t > stages[i].delay) currentStage = i;
      }

      // Animate spring for current stage
      const st = stages[currentStage];
      const timeSinceStage = t - st.delay;
      const animProgress = Math.min(1, timeSinceStage / 30);
      const extension = st.F * extPerWeight / 0.5 * animProgress;
      const springBot = supY + 6 + baseSpringLen + extension;

      // Draw spring
      const coils = 8;
      const coilW = 14;
      c.strokeStyle = '#10b981';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(expX, supY + 6);
      const segH = (springBot - supY - 6) / (coils * 2);
      for (let i = 0; i < coils * 2; i++) {
        const nx = (i % 2 === 0) ? expX + coilW : expX - coilW;
        c.lineTo(nx, supY + 6 + (i + 1) * segH);
      }
      c.lineTo(expX, springBot);
      c.stroke();

      // Weight blocks
      c.textAlign = 'center';
      for (let w = 0; w < st.weight; w++) {
        c.fillStyle = '#ef4444';
        c.fillRect(expX - 12, springBot + w * 14, 24, 12);
        c.fillStyle = '#fff';
        c.font = '8px sans-serif';
        c.fillText('50g', expX, springBot + w * 14 + 9);
      }

      // Force label
      c.fillStyle = '#f59e0b';
      c.font = 'bold 12px sans-serif';
      c.fillText(`F = ${st.F.toFixed(1)} N`, expX, springBot + st.weight * 14 + 18);

      // Extension label
      const extCm = (extension / extPerWeight * 2).toFixed(1);
      c.fillStyle = '#38bdf8';
      c.font = '11px sans-serif';
      c.fillText(`x = ${extCm} cm`, expX + 50, supY + baseSpringLen + extension / 2 + 4);

      // === Right: F-x graph ===
      const graphL = cw * 0.52;
      const graphR = cw * 0.92;
      const graphT = ch * 0.15;
      const graphB = ch * 0.65;
      const graphW = graphR - graphL;
      const graphH = graphB - graphT;

      // Graph background
      c.fillStyle = 'rgba(15, 23, 42, 0.8)';
      c.fillRect(graphL, graphT, graphW, graphH);
      c.strokeStyle = '#475569';
      c.lineWidth = 1;
      c.strokeRect(graphL, graphT, graphW, graphH);

      // Axes
      c.strokeStyle = '#94a3b8';
      c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(graphL, graphB); c.lineTo(graphR, graphB); c.stroke();
      c.beginPath(); c.moveTo(graphL, graphB); c.lineTo(graphL, graphT); c.stroke();

      // Axis labels
      c.fillStyle = '#94a3b8';
      c.font = '10px sans-serif';
      c.textAlign = 'center';
      c.fillText('x (形变量)', graphL + graphW / 2, graphB + 18);
      c.save();
      c.translate(graphL - 15, graphT + graphH / 2);
      c.rotate(-Math.PI / 2);
      c.fillText('F (弹力/N)', 0, 0);
      c.restore();

      // Axis ticks
      c.font = '9px sans-serif';
      const xTicks = ['0', '2', '4', '6'];
      const yTicks = ['0', '0.5', '1.0', '1.5'];
      xTicks.forEach((label, i) => {
        const px = graphL + (i / (xTicks.length - 1)) * graphW;
        c.fillStyle = '#64748b';
        c.fillText(label, px, graphB + 10);
        c.strokeStyle = 'rgba(100, 116, 139, 0.3)';
        c.beginPath(); c.moveTo(px, graphT); c.lineTo(px, graphB); c.stroke();
      });
      yTicks.forEach((label, i) => {
        const py = graphB - (i / (yTicks.length - 1)) * graphH;
        c.fillStyle = '#64748b';
        c.textAlign = 'right';
        c.fillText(label, graphL - 5, py + 3);
        c.strokeStyle = 'rgba(100, 116, 139, 0.3)';
        c.beginPath(); c.moveTo(graphL, py); c.lineTo(graphR, py); c.stroke();
      });
      c.textAlign = 'center';

      // Data points and line - plot progressively
      const dataPoints = [
        { x: 0, y: 0 },
        { x: 2, y: 0.5 },
        { x: 4, y: 1.0 },
        { x: 6, y: 1.5 },
      ];

      // How many points to show
      const pointsToShow = Math.min(dataPoints.length, Math.floor(t / 50) + 1);

      // Draw line through shown points
      if (pointsToShow >= 2) {
        c.strokeStyle = '#10b981';
        c.lineWidth = 2;
        c.beginPath();
        for (let i = 0; i < pointsToShow; i++) {
          const px = graphL + (dataPoints[i].x / 6) * graphW;
          const py = graphB - (dataPoints[i].y / 1.5) * graphH;
          if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
        }
        c.stroke();
      }

      // Draw data points
      for (let i = 0; i < pointsToShow; i++) {
        const px = graphL + (dataPoints[i].x / 6) * graphW;
        const py = graphB - (dataPoints[i].y / 1.5) * graphH;
        c.fillStyle = '#10b981';
        c.beginPath(); c.arc(px, py, 5, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff';
        c.font = '9px sans-serif';
        c.fillText(`(${dataPoints[i].x}, ${dataPoints[i].y})`, px, py - 10);
      }

      // Slope label k
      if (pointsToShow >= 3) {
        const midX = graphL + (dataPoints[1].x / 6) * graphW + 15;
        const midY = graphB - (dataPoints[1].y / 1.5) * graphH - 15;
        c.fillStyle = '#f59e0b';
        c.font = 'bold 12px sans-serif';
        c.fillText('斜率 k = 25 N/m', midX + 30, midY);
      }

      // === Bottom conclusion ===
      if (t > 180) {
        const concAlpha = Math.min(1, (t - 180) / 30);
        c.globalAlpha = concAlpha;
        c.fillStyle = '#10b981';
        c.font = 'bold 14px sans-serif';
        c.textAlign = 'center';
        c.fillText('在弹性限度内，弹力 F 与形变量 x 成正比', cw / 2, ch * 0.78);

        // Formula box
        c.fillStyle = 'rgba(16, 185, 129, 0.15)';
        const fbx = cw / 2 - 60;
        const fby = ch * 0.82;
        c.fillRect(fbx, fby, 120, 28);
        c.strokeStyle = '#10b981';
        c.lineWidth = 1;
        c.strokeRect(fbx, fby, 120, 28);
        c.fillStyle = '#10b981';
        c.font = 'bold 16px sans-serif';
        c.fillText('F = kx', cw / 2, fby + 19);

        c.globalAlpha = 1;
      }

      c.globalAlpha = 1;
    };

    const drawHookeConclusion = (c: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
      // Background
      const bg = c.createLinearGradient(0, 0, 0, ch);
      bg.addColorStop(0, '#0f172a');
      bg.addColorStop(1, '#1e293b');
      c.fillStyle = bg;
      c.fillRect(0, 0, cw, ch);

      c.textAlign = 'center';

      // Title
      c.fillStyle = '#10b981';
      c.font = 'bold 18px sans-serif';
      c.fillText('胡克定律', cw / 2, ch * 0.07);

      // Main formula - pulsing glow
      const pulse = 0.8 + 0.2 * Math.sin(t * 0.05);
      c.globalAlpha = pulse;
      c.fillStyle = 'rgba(16, 185, 129, 0.1)';
      const fbx = cw / 2 - 70;
      const fby = ch * 0.12;
      c.fillRect(fbx, fby, 140, 36);
      c.strokeStyle = '#10b981';
      c.lineWidth = 2;
      c.strokeRect(fbx, fby, 140, 36);
      c.globalAlpha = 1;
      c.fillStyle = '#10b981';
      c.font = 'bold 22px sans-serif';
      c.fillText('F = kx', cw / 2, fby + 26);

      // === Compare two springs with different k ===
      const spring1X = cw * 0.28;
      const spring2X = cw * 0.72;
      const supY = ch * 0.3;

      // Support bars
      c.fillStyle = '#64748b';
      c.fillRect(spring1X - 25, supY, 50, 5);
      c.fillRect(spring2X - 25, supY, 50, 5);

      // Spring 1: soft spring (k=25)
      const s1Ext = Math.sin(t * 0.03) * 25 + 40;
      const s1Bot = supY + 5 + ch * 0.15 + s1Ext;
      const s1Coils = 10;
      const s1CoilW = 16;
      c.strokeStyle = '#10b981';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(spring1X, supY + 5);
      const s1SegH = (s1Bot - supY - 5) / (s1Coils * 2);
      for (let i = 0; i < s1Coils * 2; i++) {
        const nx = (i % 2 === 0) ? spring1X + s1CoilW : spring1X - s1CoilW;
        c.lineTo(nx, supY + 5 + (i + 1) * s1SegH);
      }
      c.lineTo(spring1X, s1Bot);
      c.stroke();

      // Weight on spring 1
      c.fillStyle = '#ef4444';
      c.fillRect(spring1X - 12, s1Bot, 24, 20);

      // Spring 1 label
      c.fillStyle = '#10b981';
      c.font = 'bold 11px sans-serif';
      c.fillText('软弹簧', spring1X, supY - 8);
      c.font = '10px sans-serif';
      c.fillText('k = 25 N/m', spring1X, s1Bot + 34);

      // Spring 2: stiff spring (k=100)
      const s2Ext = Math.sin(t * 0.03) * 8 + 12;
      const s2Bot = supY + 5 + ch * 0.15 + s2Ext;
      const s2Coils = 6;
      const s2CoilW = 12;
      c.strokeStyle = '#f59e0b';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(spring2X, supY + 5);
      const s2SegH = (s2Bot - supY - 5) / (s2Coils * 2);
      for (let i = 0; i < s2Coils * 2; i++) {
        const nx = (i % 2 === 0) ? spring2X + s2CoilW : spring2X - s2CoilW;
        c.lineTo(nx, supY + 5 + (i + 1) * s2SegH);
      }
      c.lineTo(spring2X, s2Bot);
      c.stroke();

      // Weight on spring 2
      c.fillStyle = '#ef4444';
      c.fillRect(spring2X - 12, s2Bot, 24, 20);

      // Spring 2 label
      c.fillStyle = '#f59e0b';
      c.font = 'bold 11px sans-serif';
      c.fillText('硬弹簧', spring2X, supY - 8);
      c.font = '10px sans-serif';
      c.fillText('k = 100 N/m', spring2X, s2Bot + 34);

      // Comparison arrow & text
      c.fillStyle = '#94a3b8';
      c.font = '10px sans-serif';
      c.fillText('同样拉力，软弹簧伸长多', spring1X, ch * 0.72);
      c.fillText('同样拉力，硬弹簧伸长少', spring2X, ch * 0.72);

      // === Key points ===
      const kp1Alpha = Math.min(1, Math.max(0, (t - 60) / 30));
      const kp2Alpha = Math.min(1, Math.max(0, (t - 100) / 30));

      c.globalAlpha = kp1Alpha;
      c.fillStyle = 'rgba(16, 185, 129, 0.12)';
      c.fillRect(cw * 0.08, ch * 0.76, cw * 0.84, ch * 0.07);
      c.strokeStyle = '#10b981';
      c.lineWidth = 1;
      c.strokeRect(cw * 0.08, ch * 0.76, cw * 0.84, ch * 0.07);
      c.fillStyle = '#d1fae5';
      c.font = '11px sans-serif';
      c.fillText('关键点①："弹性限度内"是前提 — 超过则永久形变，F=kx不再适用', cw / 2, ch * 0.76 + 17);

      c.globalAlpha = kp2Alpha;
      c.fillStyle = 'rgba(245, 158, 11, 0.12)';
      c.fillRect(cw * 0.08, ch * 0.85, cw * 0.84, ch * 0.07);
      c.strokeStyle = '#f59e0b';
      c.lineWidth = 1;
      c.strokeRect(cw * 0.08, ch * 0.85, cw * 0.84, ch * 0.07);
      c.fillStyle = '#fef3c7';
      c.font = '11px sans-serif';
      c.fillText('关键点②：k由弹簧本身决定（材料、粗细、长度），与F、x无关', cw / 2, ch * 0.85 + 17);

      // Bottom
      c.globalAlpha = Math.min(1, Math.max(0, (t - 140) / 30));
      c.fillStyle = '#64748b';
      c.font = '10px sans-serif';
      c.fillText('k越大 → 弹簧越硬 → 越难拉伸 | k越小 → 弹簧越软 → 越易拉伸', cw / 2, ch * 0.96);

      c.globalAlpha = 1;
    };

    const drawHookeApplication = (c: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
      // Background - dark tech style
      const bg = c.createLinearGradient(0, 0, 0, ch);
      bg.addColorStop(0, '#1a1a2e');
      bg.addColorStop(1, '#16213e');
      c.fillStyle = bg;
      c.fillRect(0, 0, cw, ch);

      // Subtle grid
      c.strokeStyle = 'rgba(16, 185, 129, 0.05)';
      c.lineWidth = 1;
      for (let x = 0; x < cw; x += 25) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, ch); c.stroke(); }
      for (let y = 0; y < ch; y += 25) { c.beginPath(); c.moveTo(0, y); c.lineTo(cw, y); c.stroke(); }

      c.textAlign = 'center';

      // Title
      c.fillStyle = '#10b981';
      c.font = 'bold 14px sans-serif';
      c.fillText('胡克定律在生活中的应用', cw / 2, ch * 0.05);

      // === App 1: Spring Scale (top-left) ===
      const scX = cw * 0.18;
      const scY = ch * 0.12;
      const scAlpha = Math.min(1, t / 40);
      c.globalAlpha = scAlpha;

      // Spring scale body
      c.strokeStyle = '#94a3b8';
      c.lineWidth = 2;
      c.strokeRect(scX - 18, scY, 36, ch * 0.35);

      // Spring inside
      const springPull = Math.sin(t * 0.04) * 10;
      const spTop = scY + 10;
      const spBot = scY + ch * 0.15 + springPull;
      c.strokeStyle = '#10b981';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(scX, spTop);
      for (let i = 0; i < 8; i++) {
        const ny = spTop + (i + 1) * ((spBot - spTop) / 16);
        c.lineTo(scX + (i % 2 === 0 ? 8 : -8), ny);
      }
      c.lineTo(scX, spBot);
      c.stroke();

      // Pointer
      c.fillStyle = '#ef4444';
      c.beginPath(); c.moveTo(scX + 10, spBot + 5); c.lineTo(scX + 18, spBot + 2); c.lineTo(scX + 18, spBot + 8); c.closePath(); c.fill();

      // Scale markings
      c.fillStyle = '#94a3b8';
      c.font = '8px sans-serif';
      for (let i = 0; i <= 5; i++) {
        const my = scY + ch * 0.15 + i * 8;
        c.fillRect(scX + 14, my, 4, 1);
      }

      // Hook
      c.strokeStyle = '#94a3b8';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(scX, scY + ch * 0.35 + 8, 6, 0, Math.PI);
      c.stroke();

      // Weight
      c.fillStyle = '#ef4444';
      c.fillRect(scX - 10, scY + ch * 0.35 + 16, 20, 14);

      c.fillStyle = '#10b981';
      c.font = 'bold 10px sans-serif';
      c.fillText('弹簧秤', scX, scY + ch * 0.35 + 42);
      c.font = '8px sans-serif';
      c.fillStyle = '#94a3b8';
      c.fillText('F=kx测力', scX, scY + ch * 0.35 + 53);

      // === App 2: Car Shock Absorber (top-right) ===
      const carX = cw * 0.5;
      const carY = ch * 0.1;
      const bounceOffset = Math.sin(t * 0.06) * 8;

      // Car body
      c.fillStyle = '#3b82f6';
      c.beginPath();
      c.moveTo(carX - 50, carY + 30 + bounceOffset);
      c.lineTo(carX - 45, carY + bounceOffset);
      c.lineTo(carX + 45, carY + bounceOffset);
      c.lineTo(carX + 50, carY + 30 + bounceOffset);
      c.closePath();
      c.fill();

      // Windows
      c.fillStyle = '#93c5fd';
      c.fillRect(carX - 35, carY + 3 + bounceOffset, 25, 18);
      c.fillRect(carX + 10, carY + 3 + bounceOffset, 25, 18);

      // Wheels
      c.fillStyle = '#1e293b';
      c.beginPath(); c.arc(carX - 30, carY + 35 + bounceOffset, 10, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(carX + 30, carY + 35 + bounceOffset, 10, 0, Math.PI * 2); c.fill();

      // Spring between wheel and body (visible)
      c.strokeStyle = '#10b981';
      c.lineWidth = 1.5;
      const sprLeft = carX - 30;
      const sprTop = carY + 30 + bounceOffset;
      const sprBot = carY + 38;
      c.beginPath();
      c.moveTo(sprLeft, sprTop);
      for (let i = 0; i < 4; i++) {
        c.lineTo(sprLeft + (i % 2 === 0 ? 5 : -5), sprTop + (i + 1) * (sprBot - sprTop) / 8);
      }
      c.lineTo(sprLeft, sprBot);
      c.stroke();

      // Road bump
      c.fillStyle = '#475569';
      c.fillRect(carX - 65, carY + 45, 130, 8);
      c.fillStyle = '#f59e0b';
      c.fillRect(carX + 10, carY + 40, 15, 5);

      c.fillStyle = '#10b981';
      c.font = 'bold 10px sans-serif';
      c.fillText('汽车减震器', carX, carY + 65);
      c.font = '8px sans-serif';
      c.fillStyle = '#94a3b8';
      c.fillText('弹簧缓冲颠簸', carX, carY + 76);

      // === App 3: Slingshot (bottom-left) ===
      const slX = cw * 0.18;
      const slY = ch * 0.65;

      // Y-shaped stick
      c.strokeStyle = '#8B4513';
      c.lineWidth = 4;
      c.beginPath(); c.moveTo(slX, slY + 50); c.lineTo(slX, slY + 15); c.stroke();
      c.beginPath(); c.moveTo(slX, slY + 15); c.lineTo(slX - 18, slY - 10); c.stroke();
      c.beginPath(); c.moveTo(slX, slY + 15); c.lineTo(slX + 18, slY - 10); c.stroke();

      // Elastic band
      const pullBack = Math.sin(t * 0.04) * 12 + 8;
      c.strokeStyle = '#ef4444';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(slX - 18, slY - 10);
      c.quadraticCurveTo(slX + pullBack, slY, slX + 18, slY - 10);
      c.stroke();

      // Projectile
      if (pullBack > 5) {
        c.fillStyle = '#f59e0b';
        c.beginPath(); c.arc(slX + pullBack, slY, 4, 0, Math.PI * 2); c.fill();
      }

      c.fillStyle = '#10b981';
      c.font = 'bold 10px sans-serif';
      c.fillText('弹弓/弓箭', slX, slY + 65);
      c.fillStyle = '#94a3b8';
      c.font = '8px sans-serif';
      c.fillText('弹性势能→动能', slX, slY + 76);

      // === App 4: Spring Mattress (bottom-right) ===
      const mtX = cw * 0.55;
      const mtY = ch * 0.6;
      const mtW = cw * 0.35;
      const mtH = ch * 0.12;

      // Mattress top
      c.fillStyle = '#e2e8f0';
      c.fillRect(mtX, mtY, mtW, mtH * 0.4);

      // Springs inside
      const numSprings = 5;
      const springPress = Math.sin(t * 0.03) * 3;
      c.strokeStyle = '#10b981';
      c.lineWidth = 1.5;
      for (let i = 0; i < numSprings; i++) {
        const sx = mtX + (i + 0.5) * (mtW / numSprings);
        const stopY = mtY + mtH * 0.4 + springPress;
        const sbotY = mtY + mtH;
        c.beginPath();
        c.moveTo(sx, stopY);
        for (let j = 0; j < 4; j++) {
          c.lineTo(sx + (j % 2 === 0 ? 5 : -5), stopY + (j + 1) * (sbotY - stopY) / 8);
        }
        c.lineTo(sx, sbotY);
        c.stroke();
      }

      // Base
      c.fillStyle = '#64748b';
      c.fillRect(mtX, mtY + mtH, mtW, 6);

      // Person lying on mattress (simple)
      c.fillStyle = '#3b82f6';
      c.beginPath();
      c.ellipse(mtX + mtW * 0.4, mtY - 3, mtW * 0.25, 6, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#fbbf24';
      c.beginPath(); c.arc(mtX + mtW * 0.15, mtY - 3, 7, 0, Math.PI * 2); c.fill();

      c.fillStyle = '#10b981';
      c.font = 'bold 10px sans-serif';
      c.textAlign = 'center';
      c.fillText('弹簧床垫', mtX + mtW / 2, mtY + mtH + 22);
      c.fillStyle = '#94a3b8';
      c.font = '8px sans-serif';
      c.fillText('弹性提供舒适支撑', mtX + mtW / 2, mtY + mtH + 33);

      // === Bottom formula ===
      c.fillStyle = '#10b981';
      c.font = 'bold 12px sans-serif';
      c.textAlign = 'center';
      c.fillText('胡克定律 F=kx — 弹性世界的基石', cw / 2, ch * 0.96);

      c.globalAlpha = 1;
    };

    // ===================== END HOOKE'S LAW ANIMATIONS =====================

    const draw = () => {
      // Always advance time so canvas is never blank
      timeRef.current += 1;
      ctx.clearRect(0, 0, w, h);

      // Dispatch animation based on lawKey and type
      const lk = lawKeyRef.current;
      if (lk === 'ohm') {
        switch (type) {
          case 'intro': drawOhmIntro(ctx, w, h, timeRef.current); break;
          case 'derivation': drawOhmDerivation(ctx, w, h, timeRef.current); break;
          case 'conclusion': drawOhmConclusion(ctx, w, h, timeRef.current); break;
          case 'application': drawOhmApplication(ctx, w, h, timeRef.current); break;
          default: drawOhmIntro(ctx, w, h, timeRef.current);
        }
      } else if (lk === 'hooke') {
        switch (type) {
          case 'intro': drawHookeIntro(ctx, w, h, timeRef.current); break;
          case 'derivation': drawHookeDerivation(ctx, w, h, timeRef.current); break;
          case 'conclusion': drawHookeConclusion(ctx, w, h, timeRef.current); break;
          case 'application': drawHookeApplication(ctx, w, h, timeRef.current); break;
          default: drawHookeIntro(ctx, w, h, timeRef.current);
        }
      } else {
        // Default: Archimedes animations
        switch (type) {
          case 'intro': drawIntro(ctx, w, h, timeRef.current); break;
          case 'derivation': drawDerivation(ctx, w, h, timeRef.current); break;
          case 'conclusion': drawConclusion(ctx, w, h, timeRef.current); break;
          case 'application': drawApplication(ctx, w, h, timeRef.current); break;
          default: drawIntro(ctx, w, h, timeRef.current);
        }
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

  // Load editor data from server config (editor-defaults.json via API)
  useEffect(() => {
    async function loadEditorData() {
      // Step 1: Start with chapters from physics-data.ts
      let merged = chapters.map(ch => ({ ...ch }));

      // Step 2: Load project config from server API
      try {
        const res = await fetch('/api/editor');
        if (res.ok) {
          const defaults = await res.json();
          const lawDefaults = defaults[lawKey];
          if (lawDefaults && Array.isArray(lawDefaults)) {
            merged = merged.map((ch, i) => {
              if (lawDefaults[i]) {
                return {
                  ...ch,
                  text: lawDefaults[i].text ?? ch.text,
                  speech: lawDefaults[i].speech ?? ch.speech,
                  videoUrl: lawDefaults[i].videoUrl ?? ch.videoUrl,
                  videoName: lawDefaults[i].videoName ?? ch.videoName,
                };
              }
              return ch;
            });
          }
        }
      } catch {
        // ignore fetch errors
      }

      setMergedChapters(merged);
    }
    loadEditorData();
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
            <AnimationScene key={`anim-${currentPage}`} type={chapter.videoType} isPlaying={isPlaying} lawKey={lawKey} />
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
