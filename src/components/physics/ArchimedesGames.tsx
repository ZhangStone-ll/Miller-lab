'use client';

import { useState, useRef, useEffect } from 'react';

// ============ Game 1: Submarine Adventure ============
function SubmarineGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'won' | 'lost'>('ready');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [cargo, setCargo] = useState(50);
  const [subVolume, setSubVolume] = useState(60);
  const stateRef = useRef({ cargo: 50, volume: 60, subY: 200 });

  const liquids = [
    { name: '水', density: 1000, color: 'rgba(59, 130, 246, 0.3)' },
    { name: '油', density: 800, color: 'rgba(251, 191, 36, 0.3)' },
    { name: '盐水', density: 1200, color: 'rgba(139, 92, 246, 0.3)' },
  ];

  const levelConfigs = [
    { targetDepth: 0.5, liquidIdx: 0, hint: '让潜艇在水面以下悬浮' },
    { targetDepth: 0.4, liquidIdx: 1, hint: '在油中保持平衡' },
    { targetDepth: 0.6, liquidIdx: 2, hint: '在盐水中稳定航行' },
  ];

  const currentLevel = levelConfigs[Math.min(level - 1, levelConfigs.length - 1)];
  const currentLiquid = liquids[currentLevel.liquidIdx];

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const st = stateRef.current;

      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#bfdbfe';
      ctx.fillRect(0, 0, w, h * 0.2);

      ctx.fillStyle = currentLiquid.color;
      ctx.fillRect(0, h * 0.2, w, h * 0.8);

      const targetY = h * (0.2 + currentLevel.targetDepth * 0.6);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
      ctx.fillRect(0, targetY - 20, w, 40);
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, targetY - 20);
      ctx.lineTo(w, targetY - 20);
      ctx.moveTo(0, targetY + 20);
      ctx.lineTo(w, targetY + 20);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#22c55e';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('目标区域', w - 10, targetY - 25);

      const subDensity = 800 + st.cargo * 8;
      const floatRatio = Math.min(subDensity / currentLiquid.density, 1);
      const equilibriumY = h * (0.2 + floatRatio * 0.6);
      st.subY += (equilibriumY - st.subY) * 0.03;

      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.ellipse(w * 0.3, st.subY, 50, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#475569';
      ctx.fillRect(w * 0.3 - 3, st.subY - 28, 6, 12);

      ctx.fillStyle = '#94a3b8';
      ctx.save();
      ctx.translate(w * 0.3 + 50, st.subY);
      ctx.rotate(Date.now() * 0.01);
      ctx.fillRect(-2, -12, 4, 24);
      ctx.restore();

      ctx.fillStyle = '#93c5fd';
      ctx.beginPath();
      ctx.arc(w * 0.3 - 15, st.subY - 2, 7, 0, Math.PI * 2);
      ctx.fill();

      const buoyancy = (currentLiquid.density * 9.8 * st.volume * (floatRatio > 1 ? 1 : floatRatio) * 0.000001).toFixed(2);
      const gravity = (subDensity * 9.8 * st.volume * 0.000000001).toFixed(2);
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`F浮 = ${buoyancy} N`, 10, h - 40);
      ctx.fillText(`G   = ${gravity} N`, 10, h - 22);

      if (gameState === 'playing' && Math.abs(st.subY - targetY) < 20) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
        ctx.fillRect(0, 0, w, h);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [currentLiquid, currentLevel, gameState]);

  const startGame = () => {
    setGameState('playing');
    stateRef.current = { cargo: 50, volume: 60, subY: 50 };
  };

  const checkResult = () => {
    const st = stateRef.current;
    const targetY = canvasRef.current ? canvasRef.current.height * (0.2 + currentLevel.targetDepth * 0.6) : 200;
    if (Math.abs(st.subY - targetY) < 20) {
      setGameState('won');
      setScore(prev => prev + 100);
    } else {
      setGameState('lost');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-gray-700">关卡 {level}/3</span>
          <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">{currentLiquid.name}环境</span>
        </div>
        <span className="text-sm font-bold text-blue-600">得分: {score}</span>
      </div>

      <div className="bg-white rounded-xl border border-blue-100 overflow-hidden">
        <canvas ref={canvasRef} width={600} height={320} className="w-full" />
      </div>

      <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
        💡 {currentLevel.hint}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500">货物重量: {cargo}%</label>
          <input
            type="range" min={0} max={100}
            value={cargo}
            onChange={(e) => { const v = Number(e.target.value); setCargo(v); stateRef.current.cargo = v; }}
            className="w-full accent-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">潜艇体积: {subVolume}%</label>
          <input
            type="range" min={30} max={100}
            value={subVolume}
            onChange={(e) => { const v = Number(e.target.value); setSubVolume(v); stateRef.current.volume = v; }}
            className="w-full accent-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-3">
        {gameState === 'ready' && (
          <button onClick={startGame} className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors">
            🎮 开始游戏
          </button>
        )}
        {gameState === 'playing' && (
          <button onClick={checkResult} className="flex-1 py-2.5 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 transition-colors">
            ✅ 检查位置
          </button>
        )}
        {(gameState === 'won' || gameState === 'lost') && (
          <button
            onClick={() => {
              if (gameState === 'won' && level < 3) setLevel(prev => prev + 1);
              setGameState('ready');
              stateRef.current.subY = 50;
            }}
            className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
          >
            {gameState === 'won' ? (level < 3 ? '下一关 →' : '🎉 通关！') : '🔄 重试'}
          </button>
        )}
      </div>
    </div>
  );
}

// ============ Game 2: Ship Salvage ============
function SalvageGame() {
  const [shipWeight, setShipWeight] = useState(5000);
  const [buoyCount, setBuoyCount] = useState(0);
  const [buoyVolume, setBuoyVolume] = useState(1);
  const [gamePhase, setGamePhase] = useState<'calc' | 'result'>('calc');

  const waterDensity = 1025;
  const neededBuoyancy = shipWeight * 9.8;
  const singleBuoyancy = waterDensity * 9.8 * buoyVolume * 0.001;
  const totalBuoyancy = singleBuoyancy * buoyCount;
  const canSalvage = totalBuoyancy >= neededBuoyancy;
  const minBuoyNeeded = Math.ceil(neededBuoyancy / singleBuoyancy);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-b from-blue-100 to-blue-300 rounded-xl p-6 relative overflow-hidden min-h-[200px]">
        <div className="text-center">
          <div className="text-4xl mb-2">🚢</div>
          <div className="text-sm text-blue-800 font-medium">沉船重量: {shipWeight} kg</div>
          <div className="mt-2 flex justify-center gap-2">
            {Array.from({ length: Math.min(buoyCount, 10) }).map((_, i) => (
              <span key={i} className="text-2xl animate-float" style={{ animationDelay: `${i * 0.2}s` }}>🫧</span>
            ))}
          </div>
          {canSalvage && <div className="text-lg mt-2">⬆️ 沉船被打捞！</div>}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 space-y-3">
        <p className="text-sm text-blue-700 font-medium">📋 任务：计算需要的浮筒数量</p>
        <div className="text-xs text-blue-600 space-y-1">
          <p>沉船重力 G = {shipWeight} × 9.8 = {neededBuoyancy.toFixed(0)} N</p>
          <p>单个浮筒浮力 = ρ水gV = {waterDensity} × 9.8 × {buoyVolume} = {singleBuoyancy.toFixed(1)} N</p>
          <p>至少需要 {minBuoyNeeded} 个浮筒</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500">沉船重量 (kg)</label>
          <input type="range" min={1000} max={10000} step={500} value={shipWeight}
            onChange={(e) => setShipWeight(Number(e.target.value))} className="w-full accent-blue-500" />
          <span className="text-xs font-mono text-blue-600">{shipWeight} kg</span>
        </div>
        <div>
          <label className="text-xs text-gray-500">浮筒体积 (m³)</label>
          <input type="range" min={0.5} max={5} step={0.5} value={buoyVolume}
            onChange={(e) => setBuoyVolume(Number(e.target.value))} className="w-full accent-blue-500" />
          <span className="text-xs font-mono text-blue-600">{buoyVolume} m³</span>
        </div>
        <div>
          <label className="text-xs text-gray-500">浮筒数量: {buoyCount}</label>
          <input type="range" min={0} max={20} value={buoyCount}
            onChange={(e) => setBuoyCount(Number(e.target.value))} className="w-full accent-blue-500" />
        </div>
      </div>

      <button
        onClick={() => setGamePhase(gamePhase === 'calc' ? 'result' : 'calc')}
        className={`w-full py-2.5 rounded-xl font-medium transition-colors ${
          canSalvage ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'
        }`}
      >
        {gamePhase === 'calc' ? '🔧 部署浮筒' : canSalvage ? '✅ 打捞成功！' : '❌ 浮力不足，重试'}
      </button>
    </div>
  );
}

// ============ Game 3: Density Match ============
function DensityMatchGame() {
  const [currentRound, setCurrentRound] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const rounds = [
    { object: '木块', objDensity: 600, liquid: '水', liqDensity: 1000, emoji: '🪵' },
    { object: '铁块', objDensity: 7874, liquid: '水', liqDensity: 1000, emoji: '🔩' },
    { object: '鸡蛋', objDensity: 1050, liquid: '清水', liqDensity: 1000, emoji: '🥚' },
    { object: '鸡蛋', objDensity: 1050, liquid: '盐水', liqDensity: 1200, emoji: '🥚' },
    { object: '冰块', objDensity: 917, liquid: '水', liqDensity: 1000, emoji: '🧊' },
  ];

  const round = rounds[currentRound];
  if (!round) return <div className="text-center py-8"><p className="text-2xl mb-2">🎉</p><p className="font-bold text-gray-700">全部答对！总分: {totalScore}</p></div>;

  const correctAnswer = round.objDensity < round.liqDensity ? 'float' :
    round.objDensity === round.liqDensity ? 'suspend' : 'sink';

  const handleAnswer = (answer: 'float' | 'suspend' | 'sink') => {
    if (answer === correctAnswer) {
      setFeedback('✅ 正确！' + (correctAnswer === 'float' ? '物体密度小于液体密度，所以漂浮。' :
        correctAnswer === 'suspend' ? '密度相等，所以悬浮！' : '物体密度大于液体密度，所以沉底。'));
      setTotalScore(prev => prev + 20);
    } else {
      const explanation = round.objDensity < round.liqDensity
        ? `${round.object}密度(${round.objDensity}) < ${round.liquid}密度(${round.liqDensity})，应漂浮`
        : round.objDensity > round.liqDensity
        ? `${round.object}密度(${round.objDensity}) > ${round.liquid}密度(${round.liqDensity})，应沉底`
        : `密度相等，应悬浮`;
      setFeedback('❌ 不对哦~ ' + explanation);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-700">第 {currentRound + 1}/{rounds.length} 题</span>
        <span className="text-sm font-bold text-blue-600">得分: {totalScore}</span>
      </div>

      <div className="bg-blue-50 rounded-xl p-6 text-center">
        <div className="text-5xl mb-3">{round.emoji}</div>
        <p className="font-bold text-gray-800 text-lg">{round.object} 放入 {round.liquid}</p>
        <p className="text-sm text-gray-500 mt-1">
          {round.object}密度: {round.objDensity} kg/m³ | {round.liquid}密度: {round.liqDensity} kg/m³
        </p>
      </div>

      {!feedback ? (
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => handleAnswer('float')}
            className="py-3 rounded-xl bg-green-50 border-2 border-green-200 text-green-700 font-bold hover:bg-green-100 transition-colors">
            🏊 漂浮
          </button>
          <button onClick={() => handleAnswer('suspend')}
            className="py-3 rounded-xl bg-yellow-50 border-2 border-yellow-200 text-yellow-700 font-bold hover:bg-yellow-100 transition-colors">
            ⚖️ 悬浮
          </button>
          <button onClick={() => handleAnswer('sink')}
            className="py-3 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 font-bold hover:bg-red-100 transition-colors">
            🔻 沉底
          </button>
        </div>
      ) : (
        <div className={`p-4 rounded-xl text-sm ${feedback.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {feedback}
          <button
            onClick={() => { setFeedback(null); setCurrentRound(prev => prev + 1); }}
            className="mt-2 w-full py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            {currentRound < rounds.length - 1 ? '下一题 →' : '查看结果'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-blue-100 p-3 text-xs text-gray-500">
        💡 判断技巧：比较物体密度和液体密度<br/>
        ρ物 &lt; ρ液 → 漂浮 | ρ物 = ρ液 → 悬浮 | ρ物 &gt; ρ液 → 沉底
      </div>
    </div>
  );
}

// ============ Main Game Component ============
const games = [
  { id: 'submarine', name: '黄金潜艇大作战', icon: '🚢', desc: '操控潜艇在不同液体中浮沉' },
  { id: 'salvage', name: '沉船打捞计划', icon: '⚓', desc: '计算浮筒打捞沉船' },
  { id: 'density', name: '密度消消乐', icon: '🎯', desc: '判断物体浮沉状态' },
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

      {activeGame === 'submarine' && <SubmarineGame />}
      {activeGame === 'salvage' && <SalvageGame />}
      {activeGame === 'density' && <DensityMatchGame />}
    </div>
  );
}
