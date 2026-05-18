'use client';

import { useState, useRef, useEffect } from 'react';

interface PhysicsObject {
  id: string;
  name: string;
  density: number;
  volume: number;
  color: string;
  emoji: string;
}

interface Liquid {
  id: string;
  name: string;
  density: number;
  color: string;
  lightColor: string;
}

const objects: PhysicsObject[] = [
  { id: 'wood', name: '木块', density: 600, volume: 100, color: '#92400e', emoji: '🪵' },
  { id: 'iron', name: '铁块', density: 7874, volume: 50, color: '#6b7280', emoji: '🔩' },
  { id: 'rubber', name: '橡胶球', density: 1100, volume: 80, color: '#1f2937', emoji: '⚫' },
  { id: 'ice', name: '冰块', density: 917, volume: 120, color: '#bfdbfe', emoji: '🧊' },
  { id: 'aluminum', name: '铝块', density: 2700, volume: 60, color: '#d1d5db', emoji: '🪨' },
];

const liquids: Liquid[] = [
  { id: 'water', name: '水', density: 1000, color: 'rgba(59, 130, 246, 0.35)', lightColor: 'rgba(59, 130, 246, 0.1)' },
  { id: 'oil', name: '食用油', density: 800, color: 'rgba(251, 191, 36, 0.35)', lightColor: 'rgba(251, 191, 36, 0.1)' },
  { id: 'saltwater', name: '盐水', density: 1200, color: 'rgba(139, 92, 246, 0.35)', lightColor: 'rgba(139, 92, 246, 0.1)' },
];

interface LabState {
  selectedObject: PhysicsObject;
  selectedLiquid: Liquid;
  isInLiquid: boolean;
  immersionRatio: number;
  volume: number;
}

export default function ArchimedesLab() {
  const [selectedObject, setSelectedObject] = useState<PhysicsObject>(objects[0]);
  const [customVolume, setCustomVolume] = useState(100);
  const [selectedLiquid, setSelectedLiquid] = useState<Liquid>(liquids[0]);
  const [isInLiquid, setIsInLiquid] = useState(false);
  const [immersionRatio, setImmersionRatio] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const currentImmersionRef = useRef(0);
  const currentWaterLevelRef = useRef(0);
  const stateRef = useRef<LabState>({
    selectedObject: objects[0],
    selectedLiquid: liquids[0],
    isInLiquid: false,
    immersionRatio: 0,
    volume: 100,
  });

  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = { selectedObject, selectedLiquid, isInLiquid, immersionRatio, volume: customVolume };
  });

  const objectDensity = selectedObject.density;
  const liquidDensity = selectedLiquid.density;
  const willFloat = objectDensity < liquidDensity;
  const immersionAtRest = willFloat ? objectDensity / liquidDensity : 1;
  const buoyancy = isInLiquid
    ? (liquidDensity * 9.8 * customVolume * immersionRatio) / 1000
    : 0;
  const weight = (objectDensity * 9.8 * customVolume) / 1e6;

  const getFloatState = (): 'floating' | 'suspended' | 'sunk' => {
    if (!isInLiquid) return 'floating';
    if (objectDensity < liquidDensity) return 'floating';
    if (Math.abs(objectDensity - liquidDensity) < 1) return 'suspended';
    return 'sunk';
  };

  // Animation loop
  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const st = stateRef.current;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const selObj = st.selectedObject;
      const selLiq = st.selectedLiquid;
      const inLiq = st.isInLiquid;
      const immRatio = st.immersionRatio;
      const vol = st.volume;
      const objDensity = selObj.density;
      const liqDensity = selLiq.density;
      const floats = objDensity < liqDensity;
      const immAtRest = floats ? objDensity / liqDensity : 1;
      const buoy = inLiq ? (liqDensity * 9.8 * vol * immRatio) / 1000 : 0;
      const grav = (objDensity * 9.8 * vol) / 1e6;

      // Background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);

      // Cup dimensions
      const cupLeft = w * 0.15;
      const cupRight = w * 0.85;
      const cupTop = h * 0.15;
      const cupBottom = h * 0.85;

      // Base water level
      const baseWaterLevel = h * 0.4;
      const displacedVolume = inLiq ? vol * immRatio : 0;
      const waterRise = Math.min((displacedVolume / 500) * 30, cupBottom - baseWaterLevel - 20);
      const targetWaterLevel = baseWaterLevel - waterRise;

      currentWaterLevelRef.current += (targetWaterLevel - currentWaterLevelRef.current) * 0.1;
      const waterLevel = currentWaterLevelRef.current;

      // Draw liquid
      ctx.fillStyle = selLiq.color;
      ctx.beginPath();
      ctx.moveTo(cupLeft + 5, waterLevel);
      for (let x = cupLeft + 5; x <= cupRight - 5; x += 5) {
        ctx.lineTo(x, waterLevel + Math.sin(x * 0.05 + Date.now() * 0.003) * 2);
      }
      ctx.lineTo(cupRight - 5, cupBottom - 5);
      ctx.lineTo(cupLeft + 5, cupBottom - 5);
      ctx.closePath();
      ctx.fill();

      // Cup outline
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cupLeft, cupTop);
      ctx.lineTo(cupLeft, cupBottom);
      ctx.lineTo(cupRight, cupBottom);
      ctx.lineTo(cupRight, cupTop);
      ctx.stroke();

      // Cup rim
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cupLeft - 5, cupTop);
      ctx.lineTo(cupLeft, cupTop);
      ctx.moveTo(cupRight, cupTop);
      ctx.lineTo(cupRight + 5, cupTop);
      ctx.stroke();

      // Scale markings
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      for (let i = 1; i <= 5; i++) {
        const markY = cupBottom - (cupBottom - cupTop) * (i / 6);
        ctx.beginPath();
        ctx.moveTo(cupLeft + 2, markY);
        ctx.lineTo(cupLeft + 12, markY);
        ctx.stroke();
      }

      // Object
      const targetImm = inLiq ? immAtRest : 0;
      currentImmersionRef.current += (targetImm - currentImmersionRef.current) * 0.08;
      const currentImm = currentImmersionRef.current;
      const objSize = Math.min(40, Math.max(20, Math.sqrt(vol) * 2));
      let objY: number;

      if (inLiq) {
        if (floats) {
          objY = waterLevel - objSize * (1 - currentImm) + objSize / 2;
        } else {
          objY = cupBottom - objSize / 2 - 5;
        }
      } else {
        objY = h * 0.08;
      }

      const objX = (cupLeft + cupRight) / 2;
      const bobOffset = inLiq && floats ? Math.sin(Date.now() * 0.003) * 2 : 0;

      ctx.fillStyle = selObj.color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.roundRect(objX - objSize / 2, objY - objSize / 2 + bobOffset, objSize, objSize, 6);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.font = `${objSize * 0.5}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selObj.emoji, objX, objY + bobOffset);

      // Buoyancy arrow
      if (inLiq && buoy > 0) {
        const arrowLen = Math.min(buoy * 8, 80);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(objX + objSize / 2 + 10, objY + bobOffset);
        ctx.lineTo(objX + objSize / 2 + 10, objY - arrowLen + bobOffset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(objX + objSize / 2 + 5, objY - arrowLen + 10 + bobOffset);
        ctx.lineTo(objX + objSize / 2 + 10, objY - arrowLen + bobOffset);
        ctx.lineTo(objX + objSize / 2 + 15, objY - arrowLen + 10 + bobOffset);
        ctx.stroke();
        ctx.fillStyle = '#22c55e';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('F浮', objX + objSize / 2 + 18, objY - arrowLen / 2 + bobOffset);
      }

      // Weight arrow
      if (inLiq) {
        const gArrowLen = Math.min(grav * 40, 80);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(objX - objSize / 2 - 10, objY + bobOffset);
        ctx.lineTo(objX - objSize / 2 - 10, objY + gArrowLen + bobOffset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(objX - objSize / 2 - 15, objY + gArrowLen - 10 + bobOffset);
        ctx.lineTo(objX - objSize / 2 - 10, objY + gArrowLen + bobOffset);
        ctx.lineTo(objX - objSize / 2 - 5, objY + gArrowLen - 10 + bobOffset);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('G', objX - objSize / 2 - 18, objY + gArrowLen / 2 + bobOffset);
      }

      // Bubbles
      if (inLiq && currentImm > 0.1) {
        const bubbleCount = Math.floor(currentImm * 5);
        for (let i = 0; i < bubbleCount; i++) {
          const bx = objX + (Math.random() - 0.5) * objSize;
          const by = objY - (Date.now() * 0.05 + i * 40) % (waterLevel - cupTop);
          if (by > cupTop && by < waterLevel) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(bx, by, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Update immersion ratio
  useEffect(() => {
    if (isInLiquid) {
      const timer = setInterval(() => {
        setImmersionRatio(prev => {
          const target = immersionAtRest;
          if (Math.abs(prev - target) < 0.01) return target;
          return prev + (target - prev) * 0.1;
        });
      }, 50);
      return () => clearInterval(timer);
    }
  }, [isInLiquid, immersionAtRest]);

  const handleToggleLiquid = () => {
    if (isInLiquid) {
      setIsInLiquid(false);
      setImmersionRatio(0);
      currentImmersionRef.current = 0;
    } else {
      setIsInLiquid(true);
    }
  };

  const handleSelectObject = (obj: PhysicsObject) => {
    setSelectedObject(obj);
    setCustomVolume(obj.volume);
    setIsInLiquid(false);
    setImmersionRatio(0);
    currentImmersionRef.current = 0;
  };

  const handleReset = () => {
    setIsInLiquid(false);
    setImmersionRatio(0);
    currentImmersionRef.current = 0;
    currentWaterLevelRef.current = 0;
  };

  const floatState = getFloatState();
  const stateLabels: Record<string, { text: string; color: string }> = {
    floating: { text: '漂浮 🏊', color: 'text-green-600' },
    suspended: { text: '悬浮 ⚖️', color: 'text-yellow-600' },
    sunk: { text: '沉底 🔻', color: 'text-red-600' },
  };

  return (
    <div className="grid lg:grid-cols-[280px_1fr_280px] gap-6">
      {/* Left Panel - Object Selection */}
      <div className="bg-white rounded-xl border border-blue-100 p-5 space-y-4">
        <h4 className="font-bold text-gray-800 flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">📦</span>
          选择物体
        </h4>
        <div className="space-y-2">
          {objects.map((obj) => (
            <button
              key={obj.id}
              onClick={() => handleSelectObject(obj)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left text-sm transition-all ${
                selectedObject.id === obj.id
                  ? 'bg-blue-50 border border-blue-300 text-blue-700'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <span className="text-lg">{obj.emoji}</span>
              <div>
                <div className="font-medium">{obj.name}</div>
                <div className="text-xs text-gray-500">密度: {obj.density} kg/m³</div>
              </div>
            </button>
          ))}
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium">物体体积 (cm³)</label>
          <input
            type="range"
            min={20}
            max={200}
            value={customVolume}
            onChange={(e) => setCustomVolume(Number(e.target.value))}
            className="w-full mt-1 accent-blue-500"
          />
          <div className="text-sm text-center font-mono text-blue-600">{customVolume} cm³</div>
        </div>
      </div>

      {/* Center - Tank */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-blue-100 p-4">
          <canvas ref={canvasRef} width={480} height={360} className="w-full rounded-lg" />
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={handleToggleLiquid}
            className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md ${
              isInLiquid
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isInLiquid ? '📤 取出物体' : '📥 放入液体'}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            🔄 重置
          </button>
        </div>

        {/* Liquid Selection */}
        <div className="flex justify-center gap-3">
          {liquids.map((liq) => (
            <button
              key={liq.id}
              onClick={() => { setSelectedLiquid(liq); setIsInLiquid(false); setImmersionRatio(0); currentImmersionRef.current = 0; }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedLiquid.id === liq.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {liq.name} ({liq.density} kg/m³)
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel - Measurements */}
      <div className="space-y-4">
        {/* Force Meter */}
        <div className="bg-white rounded-xl border border-blue-100 p-5">
          <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded bg-green-100 text-green-600 flex items-center justify-center text-xs">📊</span>
            浮力显示器
          </h4>

          <div className="relative h-40 bg-gray-50 rounded-lg border border-gray-200 mb-3 overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-green-500 to-green-300 transition-all duration-500"
              style={{ height: `${Math.min(buoyancy * 15, 100)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{buoyancy.toFixed(2)}</div>
                <div className="text-xs text-gray-500">牛顿 (N)</div>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">物体名称</span>
              <span className="font-medium">{selectedObject.name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">物体密度</span>
              <span className="font-medium">{selectedObject.density} kg/m³</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">物体体积</span>
              <span className="font-medium">{customVolume} cm³</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">液体名称</span>
              <span className="font-medium">{selectedLiquid.name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">液体密度</span>
              <span className="font-medium">{selectedLiquid.density} kg/m³</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">浮沉状态</span>
              <span className={`font-bold ${stateLabels[floatState].color}`}>
                {stateLabels[floatState].text}
              </span>
            </div>
          </div>
        </div>

        {/* Formula */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <p className="text-xs text-blue-600 font-medium mb-1">浮力计算公式</p>
          <p className="font-mono text-sm text-blue-800">F浮 = ρ液 × g × V排</p>
          <p className="text-xs text-blue-500 mt-2">
            = {selectedLiquid.density} × 9.8 × {(customVolume * (isInLiquid ? immersionRatio : 0) / 1e6).toFixed(6)} m³
          </p>
          <p className="text-xs text-blue-500">
            = {buoyancy.toFixed(4)} N
          </p>
        </div>
      </div>
    </div>
  );
}
