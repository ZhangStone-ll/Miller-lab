'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ============================================================
// Game 1: 浮力参数调节器
// ============================================================
function BuoyancyAdjuster() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [liquidDensity, setLiquidDensity] = useState(1.0); // g/cm³
  const [immersionDepth, setImmersionDepth] = useState(0); // 0-50 px
  const [level, setLevel] = useState(1);
  const [passed, setPassed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const stateRef = useRef({ density: 1.0, depth: 0, waterAnim: 0 });

  const objectDensity = 1.2; // g/cm³ — denser than water, will sink by default
  const objectWeight = 1.0; // N
  const objectSide = 50; // px — cube side length

  // V排 in cm³: immersionDepth/50 * objectSide³ (scale: 1px = 1mm, so 50px = 50mm = 5cm)
  const vDisplace = (immersionDepth / objectSide) * Math.pow(objectSide / 10, 3); // cm³
  const buoyancy = liquidDensity * 9.8 * vDisplace / 1000; // N (convert g·cm³ to kg·m³)
  const rhoLiquidKg = liquidDensity * 1000; // kg/m³
  const vDisplaceM3 = vDisplace * 1e-6; // m³
  const buoyancyCheck = rhoLiquidKg * 9.8 * vDisplaceM3;

  const levels = [
    { target: 1.2, desc: '调节参数使浮力 = 1.20N（物体悬浮）', tolerance: 0.05 },
    { target: null, desc: '调节液体密度，使沉底物体变为漂浮', check: () => liquidDensity > objectDensity, tolerance: 0 },
    { target: 1.3, desc: '调节浸入深度，使浮力比重力(1.0N)大0.3N', check: () => Math.abs(buoyancyCheck - 1.3) < 0.05, tolerance: 0.05 },
  ];

  const currentLevel = levels[Math.min(level - 1, levels.length - 1)];

  const checkPass = useCallback(() => {
    if (level === 1) {
      return Math.abs(buoyancyCheck - 1.2) < 0.05;
    } else if (level === 2) {
      return liquidDensity > objectDensity;
    } else {
      return Math.abs(buoyancyCheck - 1.3) < 0.05;
    }
  }, [buoyancyCheck, liquidDensity, level]);

  useEffect(() => {
    const st = stateRef.current;
    st.density = liquidDensity;
    st.depth = immersionDepth;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      st.waterAnim += 0.02;

      ctx.clearRect(0, 0, w, h);

      // Tank
      const tankX = 80;
      const tankY = 20;
      const tankW = 200;
      const tankH = 300;
      const waterLevel = 200; // water surface y position inside tank

      // Water color based on density
      const densityRatio = (st.density - 1.0) / 0.5; // 0 to 1
      const waterR = Math.round(59 + densityRatio * 30);
      const waterG = Math.round(130 - densityRatio * 40);
      const waterB = Math.round(246 - densityRatio * 50);
      const waterColor = `rgba(${waterR}, ${waterG}, ${waterB}, 0.45)`;

      // Draw water
      const waterY = tankY + waterLevel;
      // Rising water due to displacement
      const riseAmount = (st.depth / objectSide) * 8;
      ctx.fillStyle = waterColor;
      ctx.fillRect(tankX, waterY - riseAmount, tankW, tankH - waterLevel + riseAmount);

      // Water wave
      ctx.strokeStyle = `rgba(${waterR}, ${waterG}, ${waterB}, 0.6)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = tankX; x < tankX + tankW; x += 2) {
        const wave = Math.sin((x - tankX) * 0.05 + st.waterAnim) * 2;
        if (x === tankX) ctx.moveTo(x, waterY - riseAmount + wave);
        else ctx.lineTo(x, waterY - riseAmount + wave);
      }
      ctx.stroke();

      // Tank outline
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.strokeRect(tankX, tankY, tankW, tankH);

      // Scale marks
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      for (let i = 0; i <= 6; i++) {
        const sy = tankY + i * (tankH / 6);
        ctx.beginPath();
        ctx.moveTo(tankX - 4, sy);
        ctx.lineTo(tankX, sy);
        ctx.stroke();
      }

      // Cube
      const cubeX = tankX + tankW / 2 - objectSide / 2;
      const cubeTopY = waterY - riseAmount - (objectSide - st.depth);

      // Above water part - solid blue
      const aboveH = Math.max(0, objectSide - st.depth);
      if (aboveH > 0) {
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(cubeX, cubeTopY, objectSide, aboveH);
      }
      // Below water part - semi-transparent
      const belowH = Math.min(st.depth, objectSide);
      if (belowH > 0) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.fillRect(cubeX, cubeTopY + aboveH, objectSide, belowH);
      }

      // Cube outline
      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth = 2;
      ctx.strokeRect(cubeX, cubeTopY, objectSide, objectSide);

      // Immersion depth indicator line
      if (st.depth > 0 && st.depth < objectSide) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cubeX - 10, waterY - riseAmount);
        ctx.lineTo(cubeX + objectSide + 10, waterY - riseAmount);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Formula display on right side
      const fx = tankX + tankW + 30;
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('F浮 = ρ液gV排', fx, 40);

      ctx.font = '13px monospace';
      ctx.fillStyle = '#475569';
      ctx.fillText(`ρ液 = ${st.density.toFixed(1)} g/cm³`, fx, 70);
      ctx.fillText(`V排 = ${vDisplace.toFixed(1)} cm³`, fx, 92);
      ctx.fillText(`g   = 9.8 N/kg`, fx, 114);

      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`F浮 = ${buoyancyCheck.toFixed(2)} N`, fx, 145);

      // Status
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      const status = buoyancyCheck > objectWeight ? '漂浮 ↑' :
                     Math.abs(buoyancyCheck - objectWeight) < 0.02 ? '悬浮 ≡' : '沉底 ↓';
      ctx.fillText(`物体状态: ${status}`, fx, 175);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [liquidDensity, immersionDepth, vDisplace, buoyancyCheck]);

  // Auto-check pass
  useEffect(() => {
    if (levelComplete) return;
    const isPass = checkPass();
    if (isPass && !passed) {
      setPassed(true);
      setLevelComplete(true);
    }
  }, [checkPass, passed, levelComplete]);

  const handleDensityChange = (val: number) => {
    setLiquidDensity(val);
    if (!levelComplete) setShowHint(false);
  };

  const handleDepthChange = (val: number) => {
    setImmersionDepth(val);
    if (!levelComplete) setShowHint(false);
  };

  const nextLevel = () => {
    if (level < 3) {
      setLevel(level + 1);
      setPassed(false);
      setLevelComplete(false);
      setShowHint(false);
      setLiquidDensity(1.0);
      setImmersionDepth(0);
    }
  };

  const resetLevel = () => {
    setPassed(false);
    setLevelComplete(false);
    setShowHint(false);
    setLiquidDensity(1.0);
    setImmersionDepth(0);
  };

  return (
    <div className="space-y-4">
      {/* Task panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-bold text-blue-700">第 {level}/3 关</span>
          {passed && <span className="text-green-600 font-bold">✅ 通关啦！</span>}
        </div>
        <p className="text-sm text-gray-700">{currentLevel.desc}</p>
      </div>

      {/* Canvas */}
      <div className="bg-white rounded-xl border border-blue-100 overflow-hidden flex justify-center">
        <canvas ref={canvasRef} width={500} height={340} className="max-w-full" />
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <label className="text-sm text-gray-600 font-medium block mb-1">
            液体密度 ρ液: <span className="text-blue-600 font-bold">{liquidDensity.toFixed(1)} g/cm³</span>
          </label>
          <input
            type="range" min={1.0} max={1.5} step={0.1}
            value={liquidDensity}
            onChange={(e) => handleDensityChange(Number(e.target.value))}
            className="w-full accent-blue-500"
            disabled={levelComplete}
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>1.0 清水</span><span>1.5 糖水</span>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <label className="text-sm text-gray-600 font-medium block mb-1">
            物体浸入深度: <span className="text-blue-600 font-bold">{immersionDepth} px</span>
            <span className="text-xs text-gray-400 ml-1">V排={vDisplace.toFixed(1)}cm³</span>
          </label>
          <input
            type="range" min={0} max={50} step={1}
            value={immersionDepth}
            onChange={(e) => handleDepthChange(Number(e.target.value))}
            className="w-full accent-blue-500"
            disabled={levelComplete}
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>0</span><span>50 完全浸没</span>
          </div>
        </div>
      </div>

      {/* Hint & actions */}
      {showHint && !levelComplete && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
          💡 提示：浮力大小与液体密度、排开液体体积成正比，ρ液或V排越大，浮力越大
        </div>
      )}

      <div className="flex gap-3">
        {!levelComplete && (
          <button
            onClick={() => setShowHint(true)}
            className="flex-1 py-2 rounded-xl bg-yellow-100 text-yellow-700 font-medium hover:bg-yellow-200 transition-colors text-sm"
          >
            需要提示？
          </button>
        )}
        <button
          onClick={resetLevel}
          className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors text-sm"
        >
          重置当前关卡
        </button>
        {levelComplete && level < 3 && (
          <button
            onClick={nextLevel}
            className="flex-1 py-2 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors text-sm"
          >
            下一关 →
          </button>
        )}
        {levelComplete && level === 3 && (
          <div className="flex-1 py-2 rounded-xl bg-green-500 text-white font-medium text-center text-sm">
            🎉 全部通关！
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Game 2: 深海沉船救援大作战
// ============================================================
function ShipwreckRescue() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [shipGravity, setShipGravity] = useState(5.0); // N
  const [seaDensity, setSeaDensity] = useState(1.03); // g/cm³
  const [airbags, setAirbags] = useState<Array<{ size: number; side: 'left' | 'right' }>>([]);
  const [gamePhase, setGamePhase] = useState<'playing' | 'floating' | 'success'>('playing');
  const [shipY, setShipY] = useState(0); // 0 = bottom
  const stateRef = useRef({ shipYPos: 0, targetYPos: 0, waterAnim: 0, bubbles: [] as Array<{x:number;y:number;r:number;speed:number}> });

  const totalVDisplace = airbags.reduce((sum, b) => sum + b.size, 0); // mm³
  const vDisplaceM3 = totalVDisplace * 1e-9; // convert mm³ to m³
  const buoyancy = seaDensity * 1000 * 9.8 * vDisplaceM3; // N
  const netForce = buoyancy - shipGravity; // positive = upward

  const addAirbag = (size: number) => {
    if (gamePhase !== 'playing') return;
    const side: 'left' | 'right' = airbags.length % 2 === 0 ? 'left' : 'right';
    const newBags = [...airbags, { size, side }];
    setAirbags(newBags);

    const totalV = newBags.reduce((s, b) => s + b.size, 0);
    const vM3 = totalV * 1e-9;
    const fb = seaDensity * 1000 * 9.8 * vM3;
    if (fb > shipGravity) {
      setGamePhase('floating');
      stateRef.current.targetYPos = 220; // float up to surface
    }
  };

  useEffect(() => {
    const st = stateRef.current;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      st.waterAnim += 0.015;

      // Deep sea background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1e3a5f');
      grad.addColorStop(0.3, '#0f2847');
      grad.addColorStop(1, '#0a1628');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Sea floor
      ctx.fillStyle = '#3d2b1f';
      ctx.fillRect(0, h - 30, w, 30);
      // Sand texture
      ctx.fillStyle = '#5a3e2b';
      for (let i = 0; i < w; i += 15) {
        ctx.fillRect(i, h - 30 + Math.sin(i * 0.3) * 3, 8, 3);
      }

      // Water surface line
      const surfaceY = 30;
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < w; x += 2) {
        const wave = Math.sin(x * 0.03 + st.waterAnim) * 3;
        if (x === 0) ctx.moveTo(x, surfaceY + wave);
        else ctx.lineTo(x, surfaceY + wave);
      }
      ctx.stroke();

      // Light rays
      ctx.fillStyle = 'rgba(100, 200, 255, 0.03)';
      for (let i = 0; i < 5; i++) {
        const rx = 80 + i * 100 + Math.sin(st.waterAnim + i) * 20;
        ctx.beginPath();
        ctx.moveTo(rx - 10, 0);
        ctx.lineTo(rx + 10, 0);
        ctx.lineTo(rx + 40, h);
        ctx.lineTo(rx - 40, h);
        ctx.fill();
      }

      // Ship position animation
      if (gamePhase === 'floating') {
        st.shipYPos += (st.targetYPos - st.shipYPos) * 0.012;
        if (st.targetYPos - st.shipYPos < 1) {
          st.shipYPos = st.targetYPos;
          setGamePhase('success');
        }
        setShipY(st.shipYPos);
      }

      const shipBaseY = h - 100 - st.shipYPos;
      const shipW = 150;
      const shipH = 80;
      const shipX = w / 2 - shipW / 2;

      // Ship body
      ctx.fillStyle = '#4a4a4a';
      ctx.beginPath();
      ctx.moveTo(shipX, shipBaseY);
      ctx.lineTo(shipX + shipW, shipBaseY);
      ctx.lineTo(shipX + shipW - 15, shipBaseY + shipH);
      ctx.lineTo(shipX + 15, shipBaseY + shipH);
      ctx.closePath();
      ctx.fill();

      // Ship details
      ctx.fillStyle = '#5a5a5a';
      ctx.fillRect(shipX + 30, shipBaseY - 20, 40, 20);
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(shipX + 40, shipBaseY - 35, 15, 15);

      // Airbags
      airbags.forEach((bag, i) => {
        const bagX = bag.side === 'left' ? shipX - 25 : shipX + shipW + 5;
        const bagY = shipBaseY + 20 + (i > 1 ? 20 : 0);
        const bagR = 10 + bag.size / 8000;

        ctx.fillStyle = 'rgba(135, 206, 250, 0.5)';
        ctx.strokeStyle = 'rgba(135, 206, 250, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(bagX, bagY, bagR, bagR * 1.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Airbag rope to ship
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bag.side === 'left' ? shipX : shipX + shipW, bagY);
        ctx.lineTo(bagX, bagY);
        ctx.stroke();
      });

      // Bubbles
      st.bubbles = st.bubbles.filter(b => b.y > -10);
      if (gamePhase === 'floating' || gamePhase === 'success') {
        st.bubbles.push({
          x: shipX + Math.random() * shipW,
          y: shipBaseY + shipH,
          r: 2 + Math.random() * 4,
          speed: 0.5 + Math.random() * 1.5,
        });
      }
      st.bubbles.forEach(b => {
        b.y -= b.speed;
        b.x += Math.sin(b.y * 0.05) * 0.5;
        ctx.fillStyle = 'rgba(200, 230, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Data overlay
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(w - 180, 40, 170, 100);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`沉船重力 G = ${shipGravity.toFixed(1)} N`, w - 170, 62);
      ctx.fillStyle = '#7dd3fc';
      ctx.fillText(`浮力 F浮 = ${buoyancy.toFixed(2)} N`, w - 170, 82);
      ctx.fillText(`V排 = ${totalVDisplace} mm³`, w - 170, 102);
      ctx.fillStyle = buoyancy > shipGravity ? '#4ade80' : '#f87171';
      ctx.fillText(`合力 = ${netForce > 0 ? '+' : ''}${netForce.toFixed(2)} N`, w - 170, 122);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [airbags, buoyancy, gamePhase, netForce, seaDensity, shipGravity, totalVDisplace]);

  const resetGame = () => {
    setAirbags([]);
    setGamePhase('playing');
    stateRef.current.shipYPos = 0;
    stateRef.current.targetYPos = 0;
    stateRef.current.bubbles = [];
    setShipY(0);
  };

  return (
    <div className="space-y-4">
      {/* Goal */}
      <div className="bg-blue-900 text-blue-100 rounded-xl p-3 text-center">
        <p className="text-sm font-bold">🎯 游戏目标：将沉船打捞至海面</p>
        <p className="text-xs text-blue-300 mt-1">加装浮力气囊增大V排，使浮力超过沉船重力</p>
      </div>

      {/* Canvas */}
      <div className="bg-white rounded-xl border overflow-hidden flex justify-center">
        <canvas ref={canvasRef} width={550} height={380} className="max-w-full" />
      </div>

      {/* Airbag buttons */}
      {gamePhase === 'playing' && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600 text-center">点击加装浮力气囊：</p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => addAirbag(50000)}
              className="bg-sky-100 border-2 border-sky-300 rounded-xl p-3 hover:bg-sky-200 transition-colors"
            >
              <div className="text-2xl mb-1">🫧</div>
              <div className="text-xs font-bold text-sky-700">小气囊</div>
              <div className="text-xs text-sky-500">V排=50000mm³</div>
            </button>
            <button
              onClick={() => addAirbag(100000)}
              className="bg-sky-100 border-2 border-sky-400 rounded-xl p-3 hover:bg-sky-200 transition-colors"
            >
              <div className="text-3xl mb-1">🫧🫧</div>
              <div className="text-xs font-bold text-sky-700">中气囊</div>
              <div className="text-xs text-sky-500">V排=100000mm³</div>
            </button>
            <button
              onClick={() => addAirbag(150000)}
              className="bg-sky-100 border-2 border-sky-500 rounded-xl p-3 hover:bg-sky-200 transition-colors"
            >
              <div className="text-4xl mb-1">🫧🫧🫧</div>
              <div className="text-xs font-bold text-sky-700">大气囊</div>
              <div className="text-xs text-sky-500">V排=150000mm³</div>
            </button>
          </div>
        </div>
      )}

      {/* Data panel */}
      <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-gray-500">沉船总重力</div>
          <div className="text-sm font-bold text-gray-700">{shipGravity.toFixed(1)} N</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">当前浮力</div>
          <div className={`text-sm font-bold ${buoyancy > shipGravity ? 'text-green-600' : 'text-blue-600'}`}>
            {buoyancy.toFixed(2)} N
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">V排</div>
          <div className="text-sm font-bold text-blue-600">{totalVDisplace} mm³</div>
        </div>
      </div>

      {/* Success message */}
      {gamePhase === 'success' && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 text-center">
          <div className="text-2xl mb-2">🎉</div>
          <p className="font-bold text-green-700">救援成功！</p>
          <p className="text-sm text-green-600 mt-1">
            增大V排 → 浮力增大 → F浮 &gt; G → 沉船上浮
          </p>
          <p className="text-xs text-gray-500 mt-1">
            F浮 = ρ液gV排 = {seaDensity}×10³×9.8×{vDisplaceM3.toExponential(2)} = {buoyancy.toFixed(2)} N
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={() => setSeaDensity(seaDensity === 1.03 ? 1.1 : 1.03)}
          className="flex-1 py-2 rounded-xl bg-cyan-100 text-cyan-700 font-medium hover:bg-cyan-200 transition-colors text-sm"
          disabled={gamePhase !== 'playing'}
        >
          海水密度: {seaDensity} g/cm³ {seaDensity === 1.03 ? '(普通)' : '(高盐)'}
        </button>
        <button
          onClick={resetGame}
          className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors text-sm"
        >
          重新开始
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Game 3: 浮沉盲盒猜猜猜
// ============================================================
interface QuizRound {
  gravity: number;
  buoyancy: number;
  vDisplace: number;
  liquidDensity: number;
  correctAnswer: 'float' | 'suspend' | 'sink';
  objectName: string;
}

function BlindBoxQuiz() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const stateRef = useRef({ anim: 0, boxOpen: false });

  const rounds: QuizRound[] = [
    { gravity: 0.8, buoyancy: 0.8, vDisplace: 80, liquidDensity: 1.0, correctAnswer: 'suspend', objectName: '密度计' },
    { gravity: 1.5, buoyancy: 1.0, vDisplace: 100, liquidDensity: 1.0, correctAnswer: 'sink', objectName: '铁球' },
    { gravity: 0.6, buoyancy: 0.6, vDisplace: 60, liquidDensity: 1.0, correctAnswer: 'float', objectName: '木块' },
    { gravity: 1.2, buoyancy: 1.2, vDisplace: 100, liquidDensity: 1.2, correctAnswer: 'suspend', objectName: '鸡蛋(盐水中)' },
    { gravity: 0.9, buoyancy: 0.9, vDisplace: 90, liquidDensity: 1.0, correctAnswer: 'float', objectName: '冰块' },
  ];

  const round = rounds[currentRound];
  if (!round) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🏆</div>
        <p className="font-bold text-lg text-gray-700">全部完成！</p>
        <p className="text-blue-600 font-bold mt-2">得分: {score}/{rounds.length * 20}</p>
        <button
          onClick={() => { setCurrentRound(0); setScore(0); setSelected(null); setFeedback(null); setRevealed(false); }}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
        >
          再来一次
        </button>
      </div>
    );
  }

  useEffect(() => {
    const st = stateRef.current;
    st.boxOpen = revealed;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      st.anim += 0.02;

      ctx.clearRect(0, 0, w, h);

      // Tank
      const tankX = 40;
      const tankY = 15;
      const tankW = 200;
      const tankH = 250;
      const waterSurface = tankY + 50;

      // Water
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.fillRect(tankX, waterSurface, tankW, tankH - 50);

      // Wave
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = tankX; x < tankX + tankW; x += 2) {
        const wave = Math.sin(x * 0.06 + st.anim) * 2;
        if (x === tankX) ctx.moveTo(x, waterSurface + wave);
        else ctx.lineTo(x, waterSurface + wave);
      }
      ctx.stroke();

      // Tank outline
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.strokeRect(tankX, tankY, tankW, tankH);

      // Scale marks
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      for (let i = 1; i <= 4; i++) {
        const my = waterSurface + i * (tankH - 50) / 5;
        ctx.fillRect(tankX - 3, my, 3, 1);
      }

      // Blind box
      const boxSize = 60;
      const boxX = tankX + tankW / 2 - boxSize / 2;

      // Box position based on answer
      let boxY: number;
      if (revealed) {
        if (round.correctAnswer === 'float') {
          boxY = waterSurface - boxSize / 2 + 10;
        } else if (round.correctAnswer === 'suspend') {
          boxY = waterSurface + (tankH - 50) / 2 - boxSize / 2;
        } else {
          boxY = tankY + tankH - boxSize - 10;
        }
      } else {
        // Hidden position - partially submerged
        boxY = waterSurface - boxSize / 3;
      }

      // Draw box
      ctx.fillStyle = revealed
        ? (round.correctAnswer === 'float' ? '#4ade80' : round.correctAnswer === 'suspend' ? '#facc15' : '#f87171')
        : '#9ca3af';
      ctx.fillRect(boxX, boxY, boxSize, boxSize);
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxSize, boxSize);

      // Question mark or object name
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(revealed ? round.objectName : '?', boxX + boxSize / 2, boxY + boxSize / 2 + 7);

      // Data panel on right
      const dx = tankX + tankW + 25;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(dx - 5, 20, 210, 100);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`盲盒重力 G = ${round.gravity.toFixed(1)} N`, dx, 45);
      ctx.fillText(`浮力 F浮 = ${round.buoyancy.toFixed(1)} N`, dx, 68);
      ctx.fillText(`V排 = ${round.vDisplace} cm³`, dx, 91);
      ctx.fillText(`ρ液 = ${round.liquidDensity.toFixed(1)} g/cm³`, dx, 114);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [currentRound, revealed, round]);

  const handleAnswer = (answer: string) => {
    if (selected) return;
    setSelected(answer);
    setRevealed(true);

    if (answer === round.correctAnswer) {
      setScore(prev => prev + 20);
      const labels: Record<string, string> = { float: '漂浮', suspend: '悬浮', sink: '沉底' };
      setFeedback(`✅ 正确！${round.objectName}密度与液体密度的关系决定了它会${labels[round.correctAnswer]}。`);
    } else {
      const labels: Record<string, string> = { float: '漂浮', suspend: '悬浮', sink: '沉底' };
      setFeedback(`❌ 不对哦~ ${round.objectName}实际会${labels[round.correctAnswer]}。提示：比较G和F浮的大小！`);
    }
  };

  const nextRound = () => {
    setCurrentRound(prev => prev + 1);
    setSelected(null);
    setFeedback(null);
    setRevealed(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-700">第 {currentRound + 1}/{rounds.length} 题</span>
        <span className="text-sm font-bold text-blue-600">得分: {score}</span>
      </div>

      <div className="bg-white rounded-xl border border-blue-100 overflow-hidden flex justify-center">
        <canvas ref={canvasRef} width={480} height={280} className="max-w-full" />
      </div>

      {!selected ? (
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleAnswer('float')}
            className="py-3 rounded-xl bg-green-50 border-2 border-green-200 text-green-700 font-bold hover:bg-green-100 transition-colors"
          >
            🏊 漂浮
          </button>
          <button
            onClick={() => handleAnswer('suspend')}
            className="py-3 rounded-xl bg-yellow-50 border-2 border-yellow-200 text-yellow-700 font-bold hover:bg-yellow-100 transition-colors"
          >
            ⚖️ 悬浮
          </button>
          <button
            onClick={() => handleAnswer('sink')}
            className="py-3 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 font-bold hover:bg-red-100 transition-colors"
          >
            🔻 沉底
          </button>
        </div>
      ) : (
        <div className={`p-4 rounded-xl text-sm ${feedback?.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {feedback}
          <button
            onClick={nextRound}
            className="mt-2 w-full py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            {currentRound < rounds.length - 1 ? '下一题 →' : '查看结果'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-blue-100 p-3 text-xs text-gray-500">
        💡 判断技巧：比较物体重力G与浮力F浮<br/>
        G &lt; F浮 → 漂浮 | G = F浮 → 悬浮 | G &gt; F浮 → 沉底
      </div>
    </div>
  );
}

// ============================================================
// Main: ArchimedesGames
// ============================================================
const games = [
  { id: 'adjuster', name: '浮力参数调节器', icon: '🎛️', desc: '调节密度和深度，观察浮力变化' },
  { id: 'rescue', name: '深海沉船救援', icon: '⚓', desc: '加装气囊增大浮力打捞沉船' },
  { id: 'blindbox', name: '浮沉盲盒猜猜猜', icon: '📦', desc: '根据数据推理物体浮沉状态' },
];

export default function ArchimedesGames() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  if (!activeGame) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500 text-center">选择一个互动游戏，在玩中学！</p>
        <div className="grid md:grid-cols-3 gap-4">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => setActiveGame(game.id)}
              className="bg-white rounded-xl border-2 border-blue-100 p-5 text-center hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{game.icon}</div>
              <h4 className="font-bold text-gray-800 mb-1">{game.name}</h4>
              <p className="text-xs text-gray-500">{game.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setActiveGame(null)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        ← 返回游戏列表
      </button>

      {activeGame === 'adjuster' && <BuoyancyAdjuster />}
      {activeGame === 'rescue' && <ShipwreckRescue />}
      {activeGame === 'blindbox' && <BlindBoxQuiz />}
    </div>
  );
}
