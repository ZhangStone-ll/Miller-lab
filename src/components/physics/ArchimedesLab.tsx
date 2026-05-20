'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

// ===== 阿基米德虚拟实验室 - 溢水杯实验 =====
// 实验流程：挂重物→下拉拉力计→观察溢水→验证浮力=排开液体重力

// 物理常量
const G_ACCEL = 9.8; // m/s²
const IRON_DENSITY = 7874; // kg/m³
const IRON_VOLUME = 0.0001; // m³ (100cm³)
const WATER_DENSITY = 1000; // kg/m³

// 物体重量 G = ρVg
const IRON_WEIGHT = IRON_DENSITY * IRON_VOLUME * G_ACCEL; // ≈7.72 N

// Canvas layout constants
const CW = 900;
const CH = 520;

interface DataRow {
  G: number;
  F: number;
  buoyancy: number;
  displacedWeight: number;
  showResult: boolean; // 是否已显示3/4列
  animPhase: number; // 0=waiting, 1=zooming, 2=done
}

interface LabInternalState {
  // 重物位置: 'table'=桌上, 'hanging'=挂在拉力计
  objectPos: 'table' | 'hanging';
  // 拉力计滑块位置 0=最高, 1=最低(完全浸没)
  sliderPos: number;
  // 动画中的实际浸入深度 (0~1)
  currentImmersion: number;
  // 溢出水量进度 (0~1)
  overflowProgress: number;
  // 水流粒子
  waterDrops: Array<{ x: number; y: number; vy: number; life: number }>;
  // 电子秤当前读数
  scaleReading: number;
  // 拉力计当前读数
  dynamometerReading: number;
  // 水是否已稳定
  waterStable: boolean;
  // 稳定计时
  stableTimer: number;
  // 当前实验数据行
  dataRows: DataRow[];
  // 实验结论是否显示
  showConclusion: boolean;
  // 结论动画计时
  conclusionTimer: number;
  // 时间
  time: number;
  // 拖拽状态
  dragging: 'none' | 'object' | 'slider';
  // 烧杯中水量 (0~1)
  beakerWaterLevel: number;
}

export default function ArchimedesLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stRef = useRef<LabInternalState>({
    objectPos: 'table',
    sliderPos: 0,
    currentImmersion: 0,
    overflowProgress: 0,
    waterDrops: [],
    scaleReading: 0,
    dynamometerReading: 0,
    waterStable: false,
    stableTimer: 0,
    dataRows: [],
    showConclusion: false,
    conclusionTimer: 0,
    time: 0,
    dragging: 'none',
    beakerWaterLevel: 0,
  });

  const [dataRows, setDataRows] = useState<DataRow[]>([]);
  const [showConclusion, setShowConclusion] = useState(false);
  const [objectPos, setObjectPos] = useState<'table' | 'hanging'>('table');
  const [sliderValue, setSliderValue] = useState(0);
  const [dynamometerReading, setDynamometerReading] = useState(0);
  const [scaleReading, setScaleReading] = useState(0);
  const [waterStable, setWaterStable] = useState(false);
  const [currentImmersion, setCurrentImmersion] = useState(0);
  const [animHighlight, setAnimHighlight] = useState<number | null>(null);

  // 计算浮力相关物理量
  const getPhysics = useCallback((immersion: number) => {
    const displacedVol = IRON_VOLUME * immersion; // m³
    const buoyancy = WATER_DENSITY * displacedVol * G_ACCEL; // N
    const dynamometer = IRON_WEIGHT - buoyancy; // N
    const displacedWeight = buoyancy; // 排开水重力 = 浮力
    return { buoyancy, dynamometer, displacedWeight, displacedVol };
  }, []);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const st = stRef.current;
      st.time += 0.016;

      // === UPDATE PHYSICS ===
      const targetImmersion = st.objectPos === 'hanging' ? st.sliderPos : 0;
      // 平滑过渡浸入深度
      st.currentImmersion += (targetImmersion - st.currentImmersion) * 0.06;

      const phys = getPhysics(st.currentImmersion);

      // 目标溢出量
      const targetOverflow = st.currentImmersion; // 0~1

      // 溢出水渐变
      st.overflowProgress += (targetOverflow - st.overflowProgress) * 0.04;

      // 烧杯水量
      st.beakerWaterLevel += (st.overflowProgress * 0.8 - st.beakerWaterLevel) * 0.03;

      // 拉力计读数
      st.dynamometerReading = st.objectPos === 'hanging' ? phys.dynamometer : 0;

      // 电子秤读数 = 排开水重力
      st.scaleReading = WATER_DENSITY * IRON_VOLUME * st.overflowProgress * G_ACCEL;

      // 水流粒子 - 当有溢出且还在流动时
      if (st.overflowProgress > 0.01 && Math.abs(st.overflowProgress - targetOverflow) > 0.005) {
        if (Math.random() < 0.3) {
          st.waterDrops.push({
            x: 0, y: 0, vy: 0, life: 60,
          });
        }
      }
      st.waterDrops = st.waterDrops.filter(d => {
        d.vy += 0.3;
        d.y += d.vy;
        d.life--;
        return d.life > 0;
      });

      // 水稳定检测
      const isStableNow = st.objectPos === 'hanging' && st.sliderPos > 0 &&
        Math.abs(st.overflowProgress - targetOverflow) < 0.005;
      if (isStableNow && !st.waterStable) {
        st.stableTimer++;
        if (st.stableTimer > 30) { // 0.5秒
          st.waterStable = true;
          setWaterStable(true);
          // 触发数据显示动画
          triggerDataAnimation();
        }
      } else if (!isStableNow) {
        st.waterStable = false;
        st.stableTimer = 0;
        setWaterStable(false);
      }

      // 数据行动画更新
      for (const row of st.dataRows) {
        if (row.showResult && row.animPhase === 1) {
          row.animPhase = 2;
        }
      }

      // 同步到React状态
      setDynamometerReading(st.dynamometerReading);
      setScaleReading(st.scaleReading);
      setCurrentImmersion(st.currentImmersion);

      // === DRAW ===
      ctx.clearRect(0, 0, CW, CH);

      // Background
      ctx.fillStyle = '#f0f9ff';
      ctx.fillRect(0, 0, CW, CH);

      // --- 布局参数 ---
      // 溢水杯
      const cupX = 300; const cupY = 100;
      const cupW = 160; const cupH = 260;
      const spoutY = cupY + 60; // 溢水口Y
      const spoutEndX = cupX + cupW + 40;

      // 烧杯
      const beakerX = spoutEndX + 10; const beakerY = 280;
      const beakerW = 80; const beakerH = 80;

      // 电子秤
      const scaleCX = beakerX + beakerW / 2;
      const scaleCY = beakerY + beakerH + 15;

      // 拉力计框架
      const frameX = cupX + cupW / 2; // 拉力计中心X
      const frameTopY = 20;
      const frameBottomY = cupY - 5;

      // 滑块Y位置
      const sliderMinY = frameTopY + 30;
      const sliderMaxY = cupY + cupH - 30; // 可以让重物完全浸没
      const sliderY = sliderMinY + (sliderMaxY - sliderMinY) * st.sliderPos;

      // 重物位置
      const ironW = 40; const ironH = 60;
      const ironX = frameX - ironW / 2;

      // 重物Y - 根据拉力计滑块位置
      let ironY: number;
      if (st.objectPos === 'hanging') {
        ironY = sliderY + 30; // 挂在拉力计下方
      } else {
        ironY = cupY + cupH - ironH - 10; // 桌上
      }

      // --- 绘制溢水杯 ---
      // 杯体
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      // 左壁
      ctx.moveTo(cupX, cupY);
      ctx.lineTo(cupX, cupY + cupH);
      // 底
      ctx.lineTo(cupX + cupW, cupY + cupH);
      // 右壁到溢水口
      ctx.lineTo(cupX + cupW, spoutY);
      ctx.stroke();

      // 溢水口 - 向右延伸
      ctx.beginPath();
      ctx.moveTo(cupX + cupW, spoutY);
      ctx.lineTo(spoutEndX, spoutY);
      // 溢水口下沿
      ctx.lineTo(spoutEndX, spoutY + 8);
      ctx.lineTo(cupX + cupW + 5, spoutY + 8);
      ctx.stroke();

      // 杯口
      ctx.beginPath();
      ctx.moveTo(cupX - 5, cupY);
      ctx.lineTo(cupX + 5, cupY);
      ctx.moveTo(cupX + cupW - 5, cupY);
      ctx.lineTo(cupX + cupW + 5, cupY);
      ctx.stroke();

      // 水
      const baseWaterY = spoutY + 2; // 刚好在溢水口
      const waterSurfaceY = baseWaterY - st.overflowProgress * 2; // 水面微小变化

      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.beginPath();
      ctx.moveTo(cupX + 3, baseWaterY);
      // 水面波浪
      for (let x = cupX + 3; x <= cupX + cupW - 3; x += 3) {
        const wave = Math.sin(x * 0.08 + st.time * 3) * 1.5 * (st.overflowProgress > 0.01 ? 1 : 0.3);
        ctx.lineTo(x, baseWaterY + wave);
      }
      ctx.lineTo(cupX + cupW - 3, cupY + cupH - 3);
      ctx.lineTo(cupX + 3, cupY + cupH - 3);
      ctx.closePath();
      ctx.fill();

      // 水面光泽
      ctx.fillStyle = 'rgba(147, 197, 253, 0.4)';
      ctx.beginPath();
      ctx.moveTo(cupX + 10, baseWaterY + 1);
      ctx.lineTo(cupX + cupW - 10, baseWaterY + 1);
      ctx.lineTo(cupX + cupW - 10, baseWaterY + 4);
      ctx.lineTo(cupX + 10, baseWaterY + 4);
      ctx.closePath();
      ctx.fill();

      // 液体标签
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('水 (ρ=1.0×10³ kg/m³)', cupX + 5, cupY + cupH + 20);

      // --- 绘制烧杯 ---
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(beakerX, beakerY);
      ctx.lineTo(beakerX, beakerY + beakerH);
      ctx.lineTo(beakerX + beakerW, beakerY + beakerH);
      ctx.lineTo(beakerX + beakerW, beakerY);
      ctx.stroke();

      // 烧杯中的水
      if (st.beakerWaterLevel > 0.005) {
        const bWaterH = Math.min(st.beakerWaterLevel * beakerH * 0.9, beakerH - 3);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
        ctx.fillRect(beakerX + 2, beakerY + beakerH - bWaterH, beakerW - 4, bWaterH - 2);
      }

      // --- 溢出的水流 ---
      if (st.overflowProgress > 0.01 && Math.abs(st.overflowProgress - targetOverflow) > 0.003) {
        // 溢水口到烧杯的水流
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(spoutEndX - 5, spoutY + 4);

        // 水流曲线
        const flowEndX = beakerX + beakerW / 2;
        const flowEndY = beakerY + 5;
        const cp1x = spoutEndX + 5;
        const cp1y = spoutY + 40;
        const cp2x = flowEndX - 10;
        const cp2y = flowEndY - 30;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, flowEndX, flowEndY);
        ctx.stroke();

        // 水滴粒子
        for (const drop of st.waterDrops) {
          const t = 1 - drop.life / 60;
          const dx = spoutEndX + (flowEndX - spoutEndX) * t;
          const dy = spoutY + 4 + (flowEndY - spoutY) * t + drop.vy;
          ctx.beginPath();
          ctx.arc(dx, dy, 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
          ctx.fill();
        }
      }

      // --- 绘制电子秤 ---
      // 秤台
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(scaleCX - 50, scaleCY, 100, 12);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.strokeRect(scaleCX - 50, scaleCY, 100, 12);

      // 秤底座
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(scaleCX - 40, scaleCY + 12, 80, 8);

      // 电子秤显示屏
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(scaleCX - 35, scaleCY + 2, 70, 9);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${st.scaleReading.toFixed(2)} N`, scaleCX, scaleCY + 10);

      // 电子秤标签
      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.fillText('电子秤', scaleCX, scaleCY + 28);

      // --- 绘制拉力计框架 ---
      // 竖直导轨
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(frameX, frameTopY);
      ctx.lineTo(frameX, sliderMaxY + 20);
      ctx.stroke();

      // 顶部横梁
      ctx.fillStyle = '#64748b';
      ctx.fillRect(frameX - 20, frameTopY - 5, 40, 10);

      // 滑块
      ctx.fillStyle = '#475569';
      ctx.fillRect(frameX - 18, sliderY - 8, 36, 16);
      // 滑块凹槽（方便拖拽视觉）
      ctx.fillStyle = '#64748b';
      ctx.fillRect(frameX - 5, sliderY - 3, 10, 6);

      // 拉力计表盘 - 在滑块上
      const meterX = frameX + 55;
      const meterY = sliderY;
      ctx.beginPath();
      ctx.arc(meterX, meterY, 22, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 拉力计刻度弧
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(meterX, meterY, 16, Math.PI * 0.8, Math.PI * 0.2);
      ctx.stroke();

      // 指针
      const reading = st.dynamometerReading;
      const maxReading = IRON_WEIGHT + 1;
      const needleAngle = Math.PI * 0.8 - (reading / maxReading) * Math.PI * 0.6;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(meterX, meterY);
      ctx.lineTo(meterX + Math.cos(needleAngle) * 14, meterY + Math.sin(needleAngle) * 14);
      ctx.stroke();

      // 拉力计读数
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${reading.toFixed(2)}N`, meterX, meterY + 32);

      // "拉力计"标签
      ctx.fillStyle = '#475569';
      ctx.font = '10px sans-serif';
      ctx.fillText('弹簧拉力计', meterX, meterY - 28);

      // --- 拉力计到重物的线（挂绳）---
      if (st.objectPos === 'hanging') {
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(frameX, sliderY + 8);
        ctx.lineTo(frameX, ironY);
        ctx.stroke();
        ctx.setLineDash([]);

        // 挂钩
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(frameX, ironY - 2, 4, Math.PI * 0.5, Math.PI * 1.5);
        ctx.stroke();
      }

      // --- 绘制铁块(圆柱体) ---
      // 根据位置决定X
      let objDrawX: number;
      if (st.objectPos === 'hanging') {
        objDrawX = frameX - ironW / 2;
      } else {
        objDrawX = cupX - ironW - 30; // 桌上，溢水杯左边
      }
      const objDrawY = ironY;

      // 圆柱体铁块 - 侧面
      const ironGrad = ctx.createLinearGradient(objDrawX, objDrawY, objDrawX + ironW, objDrawY);
      ironGrad.addColorStop(0, '#9ca3af');
      ironGrad.addColorStop(0.3, '#d1d5db');
      ironGrad.addColorStop(0.7, '#d1d5db');
      ironGrad.addColorStop(1, '#6b7280');
      ctx.fillStyle = ironGrad;
      ctx.fillRect(objDrawX, objDrawY, ironW, ironH);

      // 顶面（椭圆）
      ctx.fillStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.ellipse(objDrawX + ironW / 2, objDrawY, ironW / 2, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 底面
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath();
      ctx.ellipse(objDrawX + ironW / 2, objDrawY + ironH, ironW / 2, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 铁块标签
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('铁块', objDrawX + ironW / 2, objDrawY + ironH / 2 + 3);

      // --- 重物浸入水中时，水中的物体部分 ---
      if (st.objectPos === 'hanging' && st.currentImmersion > 0.01) {
        // 重物底部Y
        const objBottomY = ironY + ironH;
        // 水面Y
        const waterSurfY = baseWaterY;
        // 浸入部分
        const immersedTop = Math.max(ironY, waterSurfY);
        const immersedBottom = objBottomY;

        if (immersedBottom > waterSurfY) {
          // 水下部分带水色叠加
          ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
          ctx.fillRect(objDrawX, immersedTop, ironW, immersedBottom - immersedTop);

          // 气泡
          if (st.overflowProgress > 0.01) {
            for (let i = 0; i < 3; i++) {
              const bx = objDrawX + 5 + Math.random() * (ironW - 10);
              const by = ironY + 10 + Math.random() * (ironH - 20);
              if (by > waterSurfY) {
                ctx.beginPath();
                ctx.arc(bx, by, 2 + Math.random() * 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fill();
              }
            }
          }
        }
      }

      // --- 滑块拖拽提示 ---
      if (st.objectPos === 'hanging' && st.sliderPos === 0 && st.time < 8) {
        const alpha = 0.5 + Math.sin(st.time * 3) * 0.3;
        ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('↕ 向下拖拽滑块使铁块浸入水中', frameX, sliderMaxY + 38);
      }

      // --- 步骤提示 ---
      let stepText = '';
      if (st.objectPos === 'table') {
        stepText = '步骤1：拖拽铁块挂到拉力计上，测量铁块重量G';
      } else if (st.sliderPos === 0 && st.currentImmersion < 0.01) {
        stepText = '步骤2：向下拖拽拉力计滑块，使铁块浸入水中';
      } else if (!st.waterStable) {
        stepText = '观察：水溢出流入烧杯，等待示数稳定...';
      } else {
        stepText = '实验数据已记录！可重置滑块重复实验';
      }

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(stepText, 20, CH - 10);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [getPhysics]);

  // 触发数据显示动画
  const triggerDataAnimation = useCallback(() => {
    const st = stRef.current;
    if (st.objectPos !== 'hanging' || st.sliderPos <= 0) return;

    const immersion = st.currentImmersion;
    const phys = getPhysics(immersion);

    // 检查是否已有相同的实验行
    const G = IRON_WEIGHT;
    const F = phys.dynamometer;
    const buoyancy = phys.buoyancy;
    const displacedWeight = phys.displacedWeight;

    // 延迟显示第3/4列
    const newRow: DataRow = {
      G, F, buoyancy, displacedWeight,
      showResult: false,
      animPhase: 0,
    };

    st.dataRows = [...st.dataRows, newRow];
    setDataRows([...st.dataRows]);

    // 0.5秒后显示结果
    setTimeout(() => {
      st.dataRows[st.dataRows.length - 1].showResult = true;
      st.dataRows[st.dataRows.length - 1].animPhase = 1;
      setDataRows([...st.dataRows]);
      setAnimHighlight(st.dataRows.length - 1);

      // 动画完成后显示结论
      setTimeout(() => {
        st.showConclusion = true;
        st.conclusionTimer = 60;
        setShowConclusion(true);
      }, 1200);
    }, 500);
  }, [getPhysics]);

  // Mouse/Touch interaction handlers
  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CW / rect.width;
    const scaleY = CH / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    const st = stRef.current;

    const frameX = 300 + 160 / 2; // cupX + cupW/2
    const sliderMinY = 20 + 30;
    const sliderMaxY = 100 + 260 - 30;
    const sliderY = sliderMinY + (sliderMaxY - sliderMinY) * st.sliderPos;

    // Check if clicking on the iron block (when on table)
    if (st.objectPos === 'table') {
      const ironX = 300 - 40 - 30;
      const ironY = 100 + 260 - 60 - 10;
      if (x >= ironX && x <= ironX + 40 && y >= ironY && y <= ironY + 60) {
        st.dragging = 'object';
        return;
      }
    }

    // Check if clicking on the slider
    if (st.objectPos === 'hanging') {
      if (Math.abs(x - frameX) < 25 && Math.abs(y - sliderY) < 15) {
        st.dragging = 'slider';
        return;
      }
    }
  }, [getCanvasCoords]);

  const handlePointerMove = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { y } = getCanvasCoords(e);
    const st = stRef.current;

    if (st.dragging === 'slider') {
      const sliderMinY = 50;
      const sliderMaxY = 330;
      const newSlider = Math.max(0, Math.min(1, (y - sliderMinY) / (sliderMaxY - sliderMinY)));
      st.sliderPos = newSlider;
      setSliderValue(newSlider);
    }
  }, [getCanvasCoords]);

  const handlePointerUp = useCallback(() => {
    const st = stRef.current;
    if (st.dragging === 'object') {
      // Snap to hanging position
      st.objectPos = 'hanging';
      setObjectPos('hanging');
    }
    st.dragging = 'none';
  }, []);

  // Reset experiment
  const handleReset = useCallback(() => {
    const st = stRef.current;
    st.objectPos = 'table';
    st.sliderPos = 0;
    st.currentImmersion = 0;
    st.overflowProgress = 0;
    st.waterDrops = [];
    st.scaleReading = 0;
    st.dynamometerReading = 0;
    st.waterStable = false;
    st.stableTimer = 0;
    st.beakerWaterLevel = 0;
    st.dragging = 'none';
    st.showConclusion = false;

    setObjectPos('table');
    setSliderValue(0);
    setDynamometerReading(0);
    setScaleReading(0);
    setWaterStable(false);
    setCurrentImmersion(0);
    setShowConclusion(false);
    setAnimHighlight(null);
  }, []);

  // Full reset including data
  const handleFullReset = useCallback(() => {
    handleReset();
    const st = stRef.current;
    st.dataRows = [];
    setDataRows([]);
  }, [handleReset]);

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Canvas Area */}
      <div className="flex-1 min-w-0">
        <canvas
          ref={canvasRef}
          width={CW}
          height={CH}
          className="w-full rounded-xl border-2 border-blue-200 bg-sky-50 cursor-pointer select-none"
          style={{ touchAction: 'none' }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />

        {/* Slider control for fine adjustment */}
        <div className="mt-3 flex items-center gap-3 px-2">
          <span className="text-xs text-gray-500 whitespace-nowrap">拉力计滑块:</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={sliderValue}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              stRef.current.sliderPos = v;
              setSliderValue(v);
            }}
            className="flex-1 accent-blue-500"
            disabled={objectPos !== 'hanging'}
          />
          <span className="text-xs text-gray-500 w-12">
            {objectPos === 'hanging' ? `${Math.round(currentImmersion * 100)}%` : '--'}
          </span>
        </div>

        <div className="mt-2 flex gap-3 justify-center">
          <button onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-blue-100 text-blue-700 text-sm font-medium hover:bg-blue-200 transition">
            🔄 重置实验
          </button>
          <button onClick={handleFullReset}
            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition">
            🗑️ 清除所有数据
          </button>
        </div>
      </div>

      {/* Data Table & Conclusion */}
      <div className="lg:w-80 space-y-4">
        {/* Instrument readings */}
        <div className="bg-white rounded-xl border border-blue-100 p-4 space-y-3">
          <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            📊 实时示数
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">拉力计示数 F</p>
              <p className="text-lg font-bold text-gray-800">{dynamometerReading.toFixed(2)} <span className="text-xs font-normal">N</span></p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">电子秤示数 G水</p>
              <p className="text-lg font-bold text-gray-800">{scaleReading.toFixed(2)} <span className="text-xs font-normal">N</span></p>
            </div>
          </div>
          {objectPos === 'hanging' && (
            <div className="bg-blue-50 rounded-lg p-2 text-center text-xs text-blue-700">
              铁块重量 G = {IRON_WEIGHT.toFixed(2)} N
              {dynamometerReading > 0.01 && currentImmersion > 0.01 && (
                <span className="ml-2">
                  | 浮力 = G - F = {(IRON_WEIGHT - dynamometerReading).toFixed(2)} N
                </span>
              )}
            </div>
          )}
        </div>

        {/* Data table */}
        <div className="bg-white rounded-xl border border-blue-100 p-4">
          <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
            📋 实验数据记录
          </h4>

          {dataRows.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">完成实验后，数据将自动记录在此</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-200 px-2 py-1.5 text-slate-600 font-medium">组</th>
                    <th className="border border-slate-200 px-2 py-1.5 text-slate-600 font-medium">G (N)</th>
                    <th className="border border-slate-200 px-2 py-1.5 text-slate-600 font-medium">F (N)</th>
                    <th className="border border-slate-200 px-2 py-1.5 text-blue-600 font-medium">G-F (N)</th>
                    <th className="border border-slate-200 px-2 py-1.5 text-blue-600 font-medium">G水 (N)</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-500">{i + 1}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center">{row.G.toFixed(2)}</td>
                      <td className="border border-slate-200 px-2 py-1.5 text-center">{row.F.toFixed(2)}</td>
                      <td className={`border border-slate-200 px-2 py-1.5 text-center font-bold transition-all duration-500 ${
                        row.showResult
                          ? animHighlight === i ? 'text-blue-600 scale-110' : 'text-blue-600'
                          : 'text-gray-300'
                      }`}
                        style={animHighlight === i && row.showResult && row.animPhase === 1
                          ? { transform: 'scale(1.2)', fontSize: '14px' }
                          : {}}
                      >
                        {row.showResult ? row.buoyancy.toFixed(2) : '...'}
                      </td>
                      <td className={`border border-slate-200 px-2 py-1.5 text-center font-bold transition-all duration-500 ${
                        row.showResult
                          ? animHighlight === i ? 'text-blue-600 scale-110' : 'text-blue-600'
                          : 'text-gray-300'
                      }`}
                        style={animHighlight === i && row.showResult && row.animPhase === 1
                          ? { transform: 'scale(1.2)', fontSize: '14px' }
                          : {}}
                      >
                        {row.showResult ? row.displacedWeight.toFixed(2) : '...'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Conclusion */}
        {showConclusion && dataRows.length > 0 && (
          <div className="bg-blue-50 rounded-xl border-2 border-blue-300 p-4 animate-fadeIn">
            <h4 className="font-bold text-blue-800 text-sm mb-2">🎯 实验结论</h4>
            <p className="text-blue-700 text-sm leading-relaxed">
              浮力 = 排开液体的重力 (G水)
            </p>
            <p className="text-blue-600 text-xs mt-2 font-mono">
              F浮 = G排 = m水·g = ρ液·V排·g
            </p>
            <p className="text-xs text-blue-500 mt-2">
              即：F浮 = ρ液 × g × V排 = {WATER_DENSITY} × {G_ACCEL} × {(IRON_VOLUME * currentImmersion * 1e6).toFixed(1)}×10⁻⁶ m³
            </p>
            <p className="text-xs text-blue-500 mt-1">
              = {(WATER_DENSITY * G_ACCEL * IRON_VOLUME * currentImmersion).toFixed(2)} N
            </p>
          </div>
        )}

        {/* Experiment info */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-500 space-y-1">
          <p><strong>铁块密度:</strong> {IRON_DENSITY} kg/m³</p>
          <p><strong>铁块体积:</strong> {IRON_VOLUME * 1e6} cm³</p>
          <p><strong>铁块重量:</strong> {IRON_WEIGHT.toFixed(2)} N</p>
          <p><strong>液体(水)密度:</strong> {WATER_DENSITY} kg/m³</p>
        </div>
      </div>
    </div>
  );
}
