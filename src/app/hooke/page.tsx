'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import AIAssistant from '@/components/physics/AIAssistant';
import KnowledgeStation from '@/components/physics/KnowledgeStation';
import { hookeChapters } from '@/lib/physics-data';

const tabs = [
  { id: 'knowledge', name: '知识加油站', icon: '📚' },
  { id: 'lab', name: '虚拟实验室', icon: '🔬' },
  { id: 'games', name: '闯关游戏', icon: '🎮' },
];

// Hooke's Law Virtual Lab
function HookeLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const stateRef = useRef({ springK: 50, force: 5 });
  const [springK, setSpringK] = useState(50);
  const [force, setForce] = useState(5);
  const extension = force / springK;
  const extensionCm = extension * 100;

  // Keep ref in sync
  useEffect(() => {
    stateRef.current = { springK, force };
  });

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const st = stateRef.current;
      const k = st.springK;
      const f = st.force;
      const ext = f / k;
      const extCm = ext * 100;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#f0fdf4';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#64748b';
      ctx.fillRect(w * 0.1, 30, w * 0.8, 8);

      const springTop = 38;
      const springRestLength = 120;
      const stretchPx = extCm * 3;
      const springLength = springRestLength + stretchPx;
      const springBottom = springTop + springLength;
      const springX = w * 0.4;
      const coils = 12;
      const coilWidth = 25;

      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(springX, springTop);
      for (let i = 0; i <= coils; i++) {
        const y = springTop + (springLength * i) / coils;
        const x = springX + (i % 2 === 0 ? -1 : 1) * coilWidth;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(springX, springBottom);
      ctx.stroke();

      const weightY = springBottom + 5;
      const weightSize = 30 + f * 2;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(springX - weightSize / 2, weightY, weightSize, weightSize * 0.8, 4);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${f}N`, springX, weightY + weightSize * 0.45);

      const rulerX = w * 0.7;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rulerX, springTop);
      ctx.lineTo(rulerX, springBottom + 80);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      for (let cm = 0; cm <= 15; cm += 1) {
        const markY = springTop + springRestLength + cm * 3;
        const markLen = cm % 5 === 0 ? 10 : 5;
        ctx.beginPath();
        ctx.moveTo(rulerX, markY);
        ctx.lineTo(rulerX + markLen, markY);
        ctx.stroke();
        if (cm % 5 === 0) {
          ctx.fillText(`${cm}cm`, rulerX + 14, markY + 4);
        }
      }

      if (extCm > 0.1) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        const extStart = springTop + springRestLength;
        const extEnd = springBottom;
        ctx.beginPath();
        ctx.moveTo(rulerX - 30, extStart);
        ctx.lineTo(rulerX - 30, extEnd);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.moveTo(rulerX - 34, extStart + 5);
        ctx.lineTo(rulerX - 30, extStart);
        ctx.lineTo(rulerX - 26, extStart + 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rulerX - 34, extEnd - 5);
        ctx.lineTo(rulerX - 30, extEnd);
        ctx.lineTo(rulerX - 26, extEnd - 5);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`x=${extCm.toFixed(1)}cm`, rulerX - 35, (extStart + extEnd) / 2 + 4);
      }

      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`F = kx = ${k} × ${ext.toFixed(3)} = ${f.toFixed(1)} N`, w * 0.5, h - 20);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-6">
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-emerald-100 p-4">
          <canvas ref={canvasRef} width={560} height={360} className="w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 font-medium">弹力 F (N)</label>
            <input type="range" min={0.5} max={20} step={0.5} value={force}
              onChange={(e) => setForce(Number(e.target.value))} className="w-full accent-red-500" />
            <span className="text-sm font-mono text-red-600">{force} N</span>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">劲度系数 k (N/m)</label>
            <input type="range" min={10} max={200} step={5} value={springK}
              onChange={(e) => setSpringK(Number(e.target.value))} className="w-full accent-emerald-500" />
            <span className="text-sm font-mono text-emerald-600">{springK} N/m</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
          <h4 className="font-bold text-emerald-800 mb-3">📐 实验数据</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1.5 border-b border-emerald-100">
              <span className="text-gray-500">弹力 F</span>
              <span className="font-mono font-bold text-red-600">{force} N</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-emerald-100">
              <span className="text-gray-500">劲度系数 k</span>
              <span className="font-mono font-bold text-emerald-600">{springK} N/m</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-emerald-100">
              <span className="text-gray-500">伸长量 x</span>
              <span className="font-mono font-bold text-blue-600">{extensionCm.toFixed(2)} cm</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">弹性势能</span>
              <span className="font-mono font-bold text-purple-600">{(0.5 * springK * extension * extension).toFixed(3)} J</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-emerald-100 p-4">
          <p className="text-xs text-emerald-600 font-medium mb-1">胡克定律公式</p>
          <p className="font-mono text-lg text-emerald-800">F = kx</p>
          <p className="text-xs text-gray-500 mt-2">弹力 = 劲度系数 × 形变量</p>
        </div>
      </div>
    </div>
  );
}

// Hooke's Law Games
function HookeGames() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  // Game: Spring Balance
  function SpringBalanceGame() {
    const [k, setK] = useState(50);
    const [targetX, setTargetX] = useState(5);
    const [guessF, setGuessF] = useState('');
    const [result, setResult] = useState<string | null>(null);

    const correctF = k * targetX / 100;

    const check = () => {
      const userF = parseFloat(guessF);
      if (isNaN(userF)) { setResult('请输入数字'); return; }
      setResult(Math.abs(userF - correctF) < 0.5 ? '✅ 正确！' : `❌ 答案是 ${correctF.toFixed(1)} N`);
    };

    return (
      <div className="space-y-4">
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <p className="font-bold text-emerald-800">弹簧劲度系数 k = {k} N/m</p>
          <p className="text-sm text-emerald-600">弹簧伸长了 {targetX} cm，求弹力 F = ?</p>
        </div>
        <div className="flex gap-2">
          <input type="number" value={guessF} onChange={(e) => setGuessF(e.target.value)}
            placeholder="输入弹力(N)" className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <button onClick={check} className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm">确认</button>
        </div>
        {result && (
          <div className={`p-3 rounded-lg text-sm ${result.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {result}
            <button onClick={() => { setK(Math.floor(Math.random() * 150) + 20); setTargetX(Math.floor(Math.random() * 15) + 1); setGuessF(''); setResult(null); }}
              className="mt-2 w-full py-1.5 rounded bg-blue-500 text-white text-sm">下一题</button>
          </div>
        )}
      </div>
    );
  }

  // Game: Elastic Energy
  function ElasticEnergyGame() {
    const [k, setK] = useState(100);
    const [x, setX] = useState(10);
    const energy = 0.5 * k * (x / 100) * (x / 100);

    return (
      <div className="space-y-4">
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <p className="text-sm text-emerald-700">调整弹簧参数，观察弹性势能变化</p>
          <p className="text-2xl font-bold text-emerald-800 mt-2">E = ½kx² = {energy.toFixed(3)} J</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">劲度系数 k: {k} N/m</label>
            <input type="range" min={10} max={500} step={10} value={k}
              onChange={(e) => setK(Number(e.target.value))} className="w-full accent-emerald-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500">伸长量 x: {x} cm</label>
            <input type="range" min={1} max={30} value={x}
              onChange={(e) => setX(Number(e.target.value))} className="w-full accent-blue-500" />
          </div>
        </div>
      </div>
    );
  }

  const games = [
    { id: 'spring', name: '弹簧测力计', icon: '🔧', desc: '根据伸长量计算弹力' },
    { id: 'energy', name: '弹性势能探索', icon: '⚡', desc: '探索弹性势能的变化' },
  ];

  if (!activeGame) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500 text-center">选择一个互动游戏</p>
        <div className="grid md:grid-cols-2 gap-4">
          {games.map((game) => (
            <button key={game.id} onClick={() => setActiveGame(game.id)}
              className="bg-white rounded-xl border-2 border-emerald-100 p-5 text-center hover:border-emerald-300 hover:shadow-md transition-all">
              <div className="text-4xl mb-3">{game.icon}</div>
              <h4 className="font-bold text-gray-800">{game.name}</h4>
              <p className="text-xs text-gray-500">{game.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setActiveGame(null)} className="text-sm text-gray-500 hover:text-emerald-600">← 返回</button>
      {activeGame === 'spring' && <SpringBalanceGame />}
      {activeGame === 'energy' && <ElasticEnergyGame />}
    </div>
  );
}

export default function HookePage() {
  const [activeTab, setActiveTab] = useState('knowledge');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <header className="border-b border-emerald-100/50 bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-emerald-600 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-400 flex items-center justify-center text-white text-lg shadow-md">🔧</div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">胡克定律</h1>
              <p className="text-xs text-gray-500">F = kx</p>
            </div>
          </div>
          <div className="flex gap-1 bg-emerald-50 rounded-xl p-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-emerald-500'}`}>
                <span>{tab.icon}</span><span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'knowledge' && <KnowledgeStation chapters={hookeChapters} lawName="胡克定律" lawColor="bg-emerald-500" />}
        {activeTab === 'lab' && <HookeLab />}
        {activeTab === 'games' && <HookeGames />}
      </main>
      <AIAssistant />
    </div>
  );
}
