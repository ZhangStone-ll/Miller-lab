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
const CH = 560;

interface DataRow {
  G: number;              // 物体重力
  F: number;              // 拉力计示数
  buoyancyGF: number;     // 浮力 = G - F
  displacedWeight: number; // 排出水重力
  displacedVol: number;   // 排出水体积 (m³)
  rhoGV: number;          // ρ液gV排 计算的浮力
  rhoLiquid: number;      // 液体密度
  showResult: boolean;
  animPhase: number; // 0=waiting, 1=zooming, 2=done
}

interface LabInternalState {
  objectPos: 'table' | 'hanging';
  sliderPos: number;
  currentImmersion: number;
  overflowProgress: number;
  waterDrops: Array<{ x: number; y: number; vy: number; life: number }>;
  scaleReading: number;
  dynamometerReading: number;
  waterStable: boolean;
  stableTimer: number;
  dataRows: DataRow[];
  showConclusion: boolean;
  conclusionTimer: number;
  time: number;
  dragging: 'none' | 'object' | 'slider';
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

  const getPhysics = useCallback((immersion: number) => {
    const displacedVol = IRON_VOLUME * immersion;
    const buoyancy = WATER_DENSITY * displacedVol * G_ACCEL;
    const dynamometer = IRON_WEIGHT - buoyancy;
    const displacedWeight = buoyancy;
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

      // === LAYOUT CALCULATIONS (needed for both physics and drawing) ===
      const cupX = 300; const cupY = 180;
      const cupW = 160; const cupH = 200;
      const spoutY = cupY + 50;
      const spoutEndX = cupX + cupW + 40;
      const mCupX = spoutEndX + 10; const mCupY = 260;
      const mCupW = 90; const mCupH = 120;
      const scaleCX = mCupX + mCupW / 2;
      const scaleCY = mCupY + mCupH + 20;
      const frameX = cupX + cupW / 2;
      const frameTopY = 10;
      const ironW = 40; const ironH = 60;
      const waterSurfaceY = spoutY + 2;

      // 铁块完全浸没时，铁块顶部在水面下3px
      const ironTopFullySub = waterSurfaceY + 3;
      // 初始位置：铁块底部在水面以上25px
      const ironTopStart = waterSurfaceY - ironH - 25;
      const sliderMinYCalc = ironTopStart - 30;
      const sliderYMaxCalc = ironTopFullySub - 30;
      const sliderY = sliderMinYCalc + (sliderYMaxCalc - sliderMinYCalc) * st.sliderPos;

      // 重物Y
      let ironY: number;
      if (st.objectPos === 'hanging') {
        ironY = sliderY + 30;
      } else {
        ironY = cupY + cupH - ironH - 10;
      }

      // 计算视觉浸入比例（基于铁块实际位置，确保与画面一致）
      let visualImmersion = 0;
      if (st.objectPos === 'hanging') {
        const ironBottomY = ironY + ironH;
        if (ironBottomY > waterSurfaceY) {
          visualImmersion = Math.min(1, (ironBottomY - waterSurfaceY) / ironH);
        }
      }

      // === UPDATE PHYSICS using visual immersion ===
      st.currentImmersion += (visualImmersion - st.currentImmersion) * 0.06;

      const phys = getPhysics(st.currentImmersion);
      const targetOverflow = st.currentImmersion;
      st.overflowProgress += (targetOverflow - st.overflowProgress) * 0.04;
      st.beakerWaterLevel += (st.overflowProgress * 0.8 - st.beakerWaterLevel) * 0.03;
      st.dynamometerReading = st.objectPos === 'hanging' ? phys.dynamometer : 0;
      st.scaleReading = WATER_DENSITY * IRON_VOLUME * st.overflowProgress * G_ACCEL;

      // Water drops
      if (st.overflowProgress > 0.01 && Math.abs(st.overflowProgress - targetOverflow) > 0.005) {
        if (Math.random() < 0.3) {
          st.waterDrops.push({ x: 0, y: 0, vy: 0, life: 60 });
        }
      }
      st.waterDrops = st.waterDrops.filter(d => { d.vy += 0.3; d.y += d.vy; d.life--; return d.life > 0; });

      // Water stability detection
      const isStableNow = st.objectPos === 'hanging' && visualImmersion > 0.01 &&
        Math.abs(st.overflowProgress - targetOverflow) < 0.005;
      if (isStableNow && !st.waterStable) {
        st.stableTimer++;
        if (st.stableTimer > 30) {
          st.waterStable = true;
          setWaterStable(true);
          triggerDataAnimation();
        }
      } else if (!isStableNow) {
        st.waterStable = false;
        st.stableTimer = 0;
        setWaterStable(false);
      }

      for (const row of st.dataRows) {
        if (row.showResult && row.animPhase === 1) {
          row.animPhase = 2;
        }
      }

      setDynamometerReading(st.dynamometerReading);
      setScaleReading(st.scaleReading);
      setCurrentImmersion(st.currentImmersion);

      // === DRAW ===
      ctx.clearRect(0, 0, CW, CH);
      ctx.fillStyle = '#f0f9ff';
      ctx.fillRect(0, 0, CW, CH);

      // --- 绘制溢水杯 ---
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cupX, cupY);
      ctx.lineTo(cupX, cupY + cupH);
      ctx.lineTo(cupX + cupW, cupY + cupH);
      ctx.lineTo(cupX + cupW, spoutY);
      ctx.stroke();

      // 溢水口
      ctx.beginPath();
      ctx.moveTo(cupX + cupW, spoutY);
      ctx.lineTo(spoutEndX, spoutY);
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
      const baseWaterY = spoutY + 2;
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.beginPath();
      ctx.moveTo(cupX + 3, baseWaterY);
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
      ctx.fillRect(cupX + 10, baseWaterY + 1, cupW - 20, 3);

      // 液体标签
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('水 (ρ=1.0×10³ kg/m³)', cupX + 5, cupY + cupH + 20);

      // --- 绘制量杯 (graduated cylinder) ---
      // 杯体 - 梯形（底宽上窄）
      const mCupBottomW = mCupW;
      const mCupTopW = mCupW - 10;
      const mCupBottomLeft = mCupX;
      const mCupTopLeft = mCupX + 5;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mCupTopLeft, mCupY);
      ctx.lineTo(mCupBottomLeft, mCupY + mCupH);
      ctx.lineTo(mCupBottomLeft + mCupBottomW, mCupY + mCupH);
      ctx.lineTo(mCupTopLeft + mCupTopW, mCupY);
      ctx.stroke();

      // 量杯底座
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(mCupBottomLeft - 5, mCupY + mCupH, mCupBottomW + 10, 6);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.strokeRect(mCupBottomLeft - 5, mCupY + mCupH, mCupBottomW + 10, 6);

      // 量杯刻度 - 以 m³ 为单位
      ctx.fillStyle = '#475569';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'left';
      const maxVolML = 100; // 量杯最大 100mL = 1×10⁻⁴ m³
      const scaleSteps = 5;
      for (let i = 0; i <= scaleSteps; i++) {
        const ratio = i / scaleSteps;
        const markY = mCupY + mCupH - 3 - ratio * (mCupH - 10);
        // 刻度线
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(mCupBottomLeft + 3, markY);
        ctx.lineTo(mCupBottomLeft + 12, markY);
        ctx.stroke();
        // 刻度文字
        const volML = Math.round(maxVolML * ratio);
        const volM3 = volML * 1e-6; // mL to m³
        ctx.fillText(`${volM3.toExponential(0)}`, mCupBottomLeft + 14, markY + 3);
      }
      // 单位标注
      ctx.fillStyle = '#64748b';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('(m³)', mCupX + mCupW + 25, mCupY + mCupH / 2);

      // 量杯中的水
      if (st.beakerWaterLevel > 0.005) {
        const bWaterH = Math.min(st.beakerWaterLevel * mCupH * 0.85, mCupH - 6);
        const bWaterBottom = mCupY + mCupH - 3;
        const bWaterTop = bWaterBottom - bWaterH;

        // 水面宽度插值（梯形）
        const topRatio = (bWaterTop - mCupY) / mCupH;
        const bottomRatio = (bWaterBottom - mCupY) / mCupH;
        const topW = mCupTopW * (1 - topRatio) + mCupBottomW * topRatio;
        const bottomW = mCupTopW * (1 - bottomRatio) + mCupBottomW * bottomRatio;
        const topLeft = mCupTopLeft * (1 - topRatio) + mCupBottomLeft * topRatio;
        const botLeft = mCupTopLeft * (1 - bottomRatio) + mCupBottomLeft * bottomRatio;

        ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
        ctx.beginPath();
        ctx.moveTo(topLeft + 3, bWaterTop);
        ctx.lineTo(botLeft + 3, bWaterBottom);
        ctx.lineTo(botLeft + bottomW - 3, bWaterBottom);
        ctx.lineTo(topLeft + topW - 3, bWaterTop);
        ctx.closePath();
        ctx.fill();

        // 当前水量标注（放在量杯右侧）
        const displacedVol = IRON_VOLUME * st.overflowProgress;
        const volM3 = displacedVol;
        ctx.fillStyle = '#2563eb';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        const volReadX = mCupX + mCupW + 8;
        const volReadY = mCupY + mCupH / 2;
        ctx.fillText(`${volM3.toExponential(2)}`, volReadX, volReadY);
        ctx.font = '10px sans-serif';
        ctx.fillText('m³', volReadX, volReadY + 14);
      }

      // --- 溢出的水流 ---
      if (st.overflowProgress > 0.01 && Math.abs(st.overflowProgress - targetOverflow) > 0.003) {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(spoutEndX - 5, spoutY + 4);
        const flowEndX = mCupX + mCupW / 2;
        const flowEndY = mCupY + 5;
        const cp1x = spoutEndX + 5;
        const cp1y = spoutY + 40;
        const cp2x = flowEndX - 10;
        const cp2y = flowEndY - 30;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, flowEndX, flowEndY);
        ctx.stroke();

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

      // --- 绘制电子秤 (bigger, font doubled) ---
      const scaleW = 130;
      const scaleH = 18;
      // 秤台
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(scaleCX - scaleW / 2, scaleCY, scaleW, scaleH);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.strokeRect(scaleCX - scaleW / 2, scaleCY, scaleW, scaleH);

      // 秤底座
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(scaleCX - scaleW / 2 + 10, scaleCY + scaleH, scaleW - 20, 10);

      // 电子秤显示屏 (bigger)
      const dispW = 110;
      const dispH = 20;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(scaleCX - dispW / 2, scaleCY + 3, dispW, dispH);
      // 绿色读数 (font doubled: 9px → 18px)
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${st.scaleReading.toFixed(2)} N`, scaleCX, scaleCY + 3 + dispH - 3);

      // 电子秤标签
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText('电子秤', scaleCX, scaleCY + scaleH + 22);

      // --- 绘制拉力计框架 ---
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(frameX, frameTopY);
      ctx.lineTo(frameX, sliderYMaxCalc + 30);
      ctx.stroke();

      // 顶部横梁
      ctx.fillStyle = '#64748b';
      ctx.fillRect(frameX - 20, frameTopY - 5, 40, 10);

      // 滑块
      ctx.fillStyle = '#475569';
      ctx.fillRect(frameX - 18, sliderY - 8, 36, 16);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(frameX - 5, sliderY - 3, 10, 6);

      // 拉力计表盘
      const meterX = frameX + 55;
      const meterY = sliderY;
      ctx.beginPath();
      ctx.arc(meterX, meterY, 22, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 刻度弧
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
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${reading.toFixed(2)}N`, meterX, meterY + 32);
      ctx.fillStyle = '#475569';
      ctx.font = '10px sans-serif';
      ctx.fillText('弹簧拉力计', meterX, meterY - 28);

      // --- 挂绳 ---
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
      let objDrawX: number;
      if (st.objectPos === 'hanging') {
        objDrawX = frameX - ironW / 2;
      } else {
        objDrawX = cupX - ironW - 30;
      }
      const objDrawY = ironY;

      const ironGrad = ctx.createLinearGradient(objDrawX, objDrawY, objDrawX + ironW, objDrawY);
      ironGrad.addColorStop(0, '#9ca3af');
      ironGrad.addColorStop(0.3, '#d1d5db');
      ironGrad.addColorStop(0.7, '#d1d5db');
      ironGrad.addColorStop(1, '#6b7280');
      ctx.fillStyle = ironGrad;
      ctx.fillRect(objDrawX, objDrawY, ironW, ironH);

      // 顶面椭圆
      ctx.fillStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.ellipse(objDrawX + ironW / 2, objDrawY, ironW / 2, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 底面椭圆
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath();
      ctx.ellipse(objDrawX + ironW / 2, objDrawY + ironH, ironW / 2, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#374151';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('铁块', objDrawX + ironW / 2, objDrawY + ironH / 2 + 3);

      // --- 水中铁块半透明覆盖 ---
      if (st.objectPos === 'hanging' && st.currentImmersion > 0.01) {
        const objBottomY = ironY + ironH;
        const waterSurfY = baseWaterY;
        const immersedTop = Math.max(ironY, waterSurfY);

        if (objBottomY > waterSurfY) {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
          ctx.fillRect(objDrawX, immersedTop, ironW, objBottomY - immersedTop);

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
        ctx.fillText('↕ 向下拖拽滑块使铁块浸入水中', frameX, sliderYMaxCalc + 50);
      }

      // --- 步骤提示 ---
      let stepText = '';
      if (st.objectPos === 'table') {
        stepText = '步骤1：拖拽铁块挂到拉力计上，测量铁块重量G';
      } else if (st.sliderPos === 0 && st.currentImmersion < 0.01) {
        stepText = '步骤2：向下拖拽拉力计滑块，使铁块浸入水中';
      } else if (!st.waterStable) {
        stepText = '观察：水溢出流入量杯，等待示数稳定...';
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

    const G = IRON_WEIGHT;
    const F = phys.dynamometer;
    const buoyancyGF = G - F; // 浮力 = G - F
    const displacedWeight = phys.displacedWeight; // 排出水重力
    const displacedVol = phys.displacedVol; // 排出水体积
    const rhoGV = WATER_DENSITY * G_ACCEL * displacedVol; // ρ液gV排

    const newRow: DataRow = {
      G, F, buoyancyGF, displacedWeight, displacedVol, rhoGV,
      rhoLiquid: WATER_DENSITY,
      showResult: false,
      animPhase: 0,
    };

    st.dataRows = [...st.dataRows, newRow];
    setDataRows([...st.dataRows]);

    setTimeout(() => {
      st.dataRows[st.dataRows.length - 1].showResult = true;
      st.dataRows[st.dataRows.length - 1].animPhase = 1;
      setDataRows([...st.dataRows]);
      setAnimHighlight(st.dataRows.length - 1);

      setTimeout(() => {
        st.showConclusion = true;
        st.conclusionTimer = 60;
        setShowConclusion(true);
      }, 1200);
    }, 500);
  }, [getPhysics]);

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CW / rect.width;
    const scaleY = CH / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    const st = stRef.current;

    const frameX = 300 + 160 / 2;
    const cupY = 180; const spoutY = cupY + 50;
    const ironH = 60; const ironW = 40;
    const waterSurfaceY = spoutY + 2;
    const ironTopFullySub = waterSurfaceY + 3;
    const ironTopStart = waterSurfaceY - ironH - 25;
    const sliderMinYCalc = ironTopStart - 30;
    const sliderYMaxCalc = ironTopFullySub - 30;
    const sliderY = sliderMinYCalc + (sliderYMaxCalc - sliderMinYCalc) * st.sliderPos;

    // Click on iron block (on table)
    if (st.objectPos === 'table') {
      const ironX = 300 - ironW - 30;
      const ironY = cupY + 200 - ironH - 10;
      if (x >= ironX && x <= ironX + ironW && y >= ironY && y <= ironY + ironH) {
        st.dragging = 'object';
        return;
      }
    }

    // Click on slider
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
      const spoutY = 180 + 50;
      const waterSurfaceY = spoutY + 2;
      const ironH = 60;
      const ironTopFullySub = waterSurfaceY + 3;
      const ironTopStart = waterSurfaceY - ironH - 25;
      const sliderMinYCalc = ironTopStart - 30;
      const sliderYMaxCalc = ironTopFullySub - 30;
      // 限定范围：0 (最高) 到 1 (铁块完全浸没)
      const newSlider = Math.max(0, Math.min(1, (y - sliderMinYCalc) / (sliderYMaxCalc - sliderMinYCalc)));
      st.sliderPos = newSlider;
      setSliderValue(newSlider);
    }
  }, [getCanvasCoords]);

  const handlePointerUp = useCallback(() => {
    const st = stRef.current;
    if (st.dragging === 'object') {
      st.objectPos = 'hanging';
      setObjectPos('hanging');
    }
    st.dragging = 'none';
  }, []);

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

  const handleFullReset = useCallback(() => {
    handleReset();
    const st = stRef.current;
    st.dataRows = [];
    setDataRows([]);
  }, [handleReset]);

  // 计算当前排开水体积 (用于实时显示)
  const displacedVol = IRON_VOLUME * currentImmersion;
  const rhoGV = WATER_DENSITY * G_ACCEL * displacedVol;

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

        {/* Slider control */}
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
          <span className="text-xs text-gray-500 w-20">
            {objectPos === 'hanging' ? `浸入${Math.round(currentImmersion * 100)}%` : '--'}
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
      <div className="lg:w-[420px] space-y-4">
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
          {objectPos === 'hanging' && currentImmersion > 0.01 && (
            <div className="bg-blue-50 rounded-lg p-2 text-center text-xs text-blue-700 space-y-0.5">
              <p>物体重力 G(N) = {IRON_WEIGHT.toFixed(2)}</p>
              <p>浮力 = G - F = {(IRON_WEIGHT - dynamometerReading).toFixed(2)} N</p>
              <p>排开水体积 V排(m³) = {displacedVol.toExponential(2)}</p>
              <p>ρ液gV排(N) = {rhoGV.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Data table - 7 columns */}
        <div className="bg-white rounded-xl border border-blue-100 p-4">
          <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
            📋 实验数据记录
          </h4>

          {dataRows.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">完成实验后，数据将自动记录在此</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse min-w-[400px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-200 px-1 py-1.5 text-slate-600 font-medium">组</th>
                    <th className="border border-slate-200 px-1 py-1.5 text-slate-600 font-medium whitespace-nowrap">物体重力<br/>G(N)</th>
                    <th className="border border-slate-200 px-1 py-1.5 text-slate-600 font-medium whitespace-nowrap">拉力<br/>F(N)</th>
                    <th className="border border-slate-200 px-1 py-1.5 text-blue-600 font-medium whitespace-nowrap">浮力<br/>G-F(N)</th>
                    <th className="border border-slate-200 px-1 py-1.5 text-blue-600 font-medium whitespace-nowrap">排水重力<br/>G水(N)</th>
                    <th className="border border-slate-200 px-1 py-1.5 text-blue-600 font-medium whitespace-nowrap">排水体积<br/>V排(m³)</th>
                    <th className="border border-slate-200 px-1 py-1.5 text-blue-600 font-medium whitespace-nowrap">ρ液gV排<br/>(N)</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="border border-slate-200 px-1 py-1.5 text-center text-slate-500">{i + 1}</td>
                      <td className="border border-slate-200 px-1 py-1.5 text-center">{row.G.toFixed(2)}</td>
                      <td className="border border-slate-200 px-1 py-1.5 text-center">{row.F.toFixed(2)}</td>
                      <td className={`border border-slate-200 px-1 py-1.5 text-center font-bold ${
                        row.showResult ? 'text-blue-600' : 'text-gray-300'
                      }`}>
                        {row.showResult ? row.buoyancyGF.toFixed(2) : '...'}
                      </td>
                      <td className={`border border-slate-200 px-1 py-1.5 text-center font-bold ${
                        row.showResult ? 'text-blue-600' : 'text-gray-300'
                      }`}>
                        {row.showResult ? row.displacedWeight.toFixed(2) : '...'}
                      </td>
                      <td className={`border border-slate-200 px-1 py-1.5 text-center font-bold ${
                        row.showResult ? 'text-blue-600' : 'text-gray-300'
                      }`}>
                        {row.showResult && row.displacedVol != null ? row.displacedVol.toExponential(2) : '...'}
                      </td>
                      <td className={`border border-slate-200 px-1 py-1.5 text-center font-bold ${
                        row.showResult ? 'text-blue-600' : 'text-gray-300'
                      }`}>
                        {row.showResult && row.rhoGV != null ? row.rhoGV.toFixed(2) : '...'}
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
          <div className="bg-blue-50 rounded-xl border-2 border-blue-300 p-4">
            <h4 className="font-bold text-blue-800 text-sm mb-2">🎯 实验结论</h4>
            <p className="text-blue-700 text-sm leading-relaxed">
              浮力 = 排开液体的重力 (G水)
            </p>
            <p className="text-blue-600 text-xs mt-2 font-mono">
              F浮 = G排 = m水·g = ρ液·V排·g
            </p>
            <p className="text-xs text-blue-500 mt-2">
              即：F浮 = ρ液 × g × V排 = {WATER_DENSITY} × {G_ACCEL} × {displacedVol.toExponential(2)} m³
            </p>
            <p className="text-xs text-blue-500 mt-1">
              = {rhoGV.toFixed(2)} N
            </p>
            <p className="text-xs text-blue-400 mt-2">
              ※ 浮力(G-F) = 排水重力(G水) = ρ液gV排，三者相等验证了阿基米德定律
            </p>
          </div>
        )}

        {/* 附.实验环境固定参数 */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-500 space-y-1">
          <p className="text-slate-700 font-semibold mb-1">附.实验环境固定参数：</p>
          <p><strong>铁块密度:</strong> {IRON_DENSITY} kg/m³</p>
          <p><strong>铁块体积:</strong> {IRON_VOLUME * 1e6} cm³ = {IRON_VOLUME.toExponential(0)} m³</p>
          <p><strong>铁块重量:</strong> {IRON_WEIGHT.toFixed(2)} N</p>
          <p><strong>液体密度ρ液:</strong> {WATER_DENSITY} kg/m³</p>
        </div>
      </div>
    </div>
  );
}
