'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import AIAssistant from '@/components/physics/AIAssistant';
import KnowledgeStation from '@/components/physics/KnowledgeStation';
import { ohmChapters } from '@/lib/physics-data';

const tabs = [
  { id: 'knowledge', name: '知识加油站', icon: '📚' },
  { id: 'lab', name: '虚拟实验室', icon: '🔬' },
  { id: 'games', name: '闯关游戏', icon: '🎮' },
];

// Ohm's Law Virtual Lab
function OhmLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const stateRef = useRef({ voltage: 6, resistance: 10 });
  const [voltage, setVoltage] = useState(6);
  const [resistance, setResistance] = useState(10);
  const current = voltage / resistance;
  const power = voltage * current;

  // Keep ref in sync
  useEffect(() => {
    stateRef.current = { voltage, resistance };
  });

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const st = stateRef.current;
      const v = st.voltage;
      const r = st.resistance;
      const cur = v / r;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const rw = w * 0.35;
      const rh = h * 0.3;

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - rw, cy - rh);
      ctx.lineTo(cx + rw, cy - rh);
      ctx.lineTo(cx + rw, cy + rh);
      ctx.lineTo(cx - rw, cy + rh);
      ctx.closePath();
      ctx.stroke();

      const electronSpeed = cur * 5;
      const time = Date.now() * 0.001 * electronSpeed;
      ctx.fillStyle = '#3b82f6';
      for (let i = 0; i < 8; i++) {
        const t = (time + i * 0.25) % 1;
        let ex: number, ey: number;
        if (t < 0.25) {
          ex = cx - rw + t * 4 * rw * 2;
          ey = cy - rh;
        } else if (t < 0.5) {
          ex = cx + rw;
          ey = cy - rh + (t - 0.25) * 4 * rh * 2;
        } else if (t < 0.75) {
          ex = cx + rw - (t - 0.5) * 4 * rw * 2;
          ey = cy + rh;
        } else {
          ex = cx - rw;
          ey = cy + rh - (t - 0.75) * 4 * rh * 2;
        }
        ctx.beginPath();
        ctx.arc(ex, ey, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.fillRect(cx - 25, cy - rh - 18, 50, 18);
      ctx.strokeRect(cx - 25, cy - rh - 18, 50, 18);
      ctx.fillStyle = '#92400e';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${v}V`, cx, cy - rh - 5);

      ctx.fillStyle = '#fef2f2';
      ctx.strokeStyle = '#dc2626';
      const resX = cx + rw + 5;
      ctx.fillRect(resX, cy - 20, 18, 40);
      ctx.strokeRect(resX, cy - 20, 18, 40);
      ctx.fillStyle = '#991b1b';
      ctx.save();
      ctx.translate(resX + 30, cy);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${r}Ω`, 0, 0);
      ctx.restore();

      const bulbX = cx;
      const bulbY = cy + rh + 20;
      const brightness = Math.min(cur / 2, 1);

      if (brightness > 0.1) {
        const glowGrad = ctx.createRadialGradient(bulbX, bulbY, 5, bulbX, bulbY, 40 * brightness);
        glowGrad.addColorStop(0, `rgba(251, 191, 36, ${brightness * 0.4})`);
        glowGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(bulbX, bulbY, 40 * brightness, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = `rgb(251, ${191 + (1 - brightness) * 64}, ${36 + (1 - brightness) * 219})`;
      ctx.beginPath();
      ctx.arc(bulbX, bulbY, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#dbeafe';
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx - rw - 5, cy, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('A', cx - rw - 5, cy + 1);
      ctx.font = '10px monospace';
      ctx.fillText(`${cur.toFixed(2)}A`, cx - rw - 5, cy + 14);

      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`I = U/R = ${v}/${r} = ${cur.toFixed(2)} A`, cx, cy);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-6">
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-amber-100 p-4">
          <canvas ref={canvasRef} width={560} height={360} className="w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 font-medium">电压 U (V)</label>
            <input type="range" min={1} max={24} step={0.5} value={voltage}
              onChange={(e) => setVoltage(Number(e.target.value))} className="w-full accent-amber-500" />
            <span className="text-sm font-mono text-amber-600">{voltage} V</span>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">电阻 R (Ω)</label>
            <input type="range" min={1} max={100} value={resistance}
              onChange={(e) => setResistance(Number(e.target.value))} className="w-full accent-red-500" />
            <span className="text-sm font-mono text-red-600">{resistance} Ω</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
          <h4 className="font-bold text-amber-800 mb-3">📐 测量数据</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1.5 border-b border-amber-100">
              <span className="text-gray-500">电压 U</span>
              <span className="font-mono font-bold text-amber-600">{voltage} V</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-amber-100">
              <span className="text-gray-500">电阻 R</span>
              <span className="font-mono font-bold text-red-600">{resistance} Ω</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-amber-100">
              <span className="text-gray-500">电流 I</span>
              <span className="font-mono font-bold text-blue-600">{current.toFixed(2)} A</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">功率 P</span>
              <span className="font-mono font-bold text-green-600">{power.toFixed(2)} W</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-amber-100 p-4">
          <p className="text-xs text-amber-600 font-medium mb-1">欧姆定律公式</p>
          <p className="font-mono text-lg text-amber-800">I = U / R</p>
          <p className="text-xs text-gray-500 mt-2">电流 = 电压 ÷ 电阻</p>
        </div>
      </div>
    </div>
  );
}

// Simple Ohm's Law Games
function OhmGames() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  // Game: Circuit Challenge
  function CircuitChallenge() {
    const [targetCurrent, setTargetCurrent] = useState(1.5);
    const [voltage, setVoltage] = useState(6);
    const [resistance, setResistance] = useState(10);
    const current = voltage / resistance;
    const isCorrect = Math.abs(current - targetCurrent) < 0.05;

    const newChallenge = () => {
      const targets = [0.5, 1, 1.5, 2, 2.5, 3];
      setTargetCurrent(targets[Math.floor(Math.random() * targets.length)]);
    };

    return (
      <div className="space-y-4">
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <p className="text-sm text-amber-700">🎯 目标电流: <span className="font-bold text-lg">{targetCurrent} A</span></p>
          <p className="text-xs text-amber-500 mt-1">调整电压和电阻，使电流等于目标值</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">电压: {voltage}V</label>
            <input type="range" min={1} max={24} step={0.5} value={voltage}
              onChange={(e) => setVoltage(Number(e.target.value))} className="w-full accent-amber-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500">电阻: {resistance}Ω</label>
            <input type="range" min={1} max={100} value={resistance}
              onChange={(e) => setResistance(Number(e.target.value))} className="w-full accent-red-500" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-mono">I = {voltage}/{resistance} = <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>{current.toFixed(2)} A</span></p>
        </div>
        <div className="flex gap-3">
          <button onClick={newChallenge} className="flex-1 py-2.5 rounded-xl bg-amber-100 text-amber-700 font-medium hover:bg-amber-200">
            🔄 新挑战
          </button>
          {isCorrect && <div className="flex-1 py-2.5 rounded-xl bg-green-500 text-white font-medium text-center">🎉 正确！</div>}
        </div>
      </div>
    );
  }

  // Game: Power Quiz
  function PowerQuiz() {
    const [question, setQuestion] = useState({ u: 12, r: 4 });
    const [answer, setAnswer] = useState('');
    const [result, setResult] = useState<string | null>(null);

    const correctCurrent = question.u / question.r;
    const correctPower = question.u * correctCurrent;

    const checkAnswer = () => {
      const userPower = parseFloat(answer);
      if (isNaN(userPower)) { setResult('请输入数字'); return; }
      setResult(Math.abs(userPower - correctPower) < 1 ? '✅ 正确！' : `❌ 答案是 ${correctPower.toFixed(1)} W`);
    };

    return (
      <div className="space-y-4">
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <p className="font-bold text-amber-800">一个电热器，电压 {question.u}V，电阻 {question.r}Ω</p>
          <p className="text-sm text-amber-600">求电功率 P = ?</p>
        </div>
        <div className="flex gap-2">
          <input type="number" value={answer} onChange={(e) => setAnswer(e.target.value)}
            placeholder="输入功率(W)" className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <button onClick={checkAnswer} className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm">确认</button>
        </div>
        {result && (
          <div className={`p-3 rounded-lg text-sm ${result.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {result}
            <button onClick={() => { setQuestion({ u: Math.floor(Math.random() * 20) + 5, r: Math.floor(Math.random() * 20) + 2 }); setAnswer(''); setResult(null); }}
              className="mt-2 w-full py-1.5 rounded bg-blue-500 text-white text-sm">下一题</button>
          </div>
        )}
      </div>
    );
  }

  const games = [
    { id: 'circuit', name: '电路挑战赛', icon: '⚡', desc: '调节参数达到目标电流' },
    { id: 'power', name: '功率计算王', icon: '💡', desc: '计算用电器的功率' },
  ];

  if (!activeGame) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500 text-center">选择一个互动游戏</p>
        <div className="grid md:grid-cols-2 gap-4">
          {games.map((game) => (
            <button key={game.id} onClick={() => setActiveGame(game.id)}
              className="bg-white rounded-xl border-2 border-amber-100 p-5 text-center hover:border-amber-300 hover:shadow-md transition-all">
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
      <button onClick={() => setActiveGame(null)} className="text-sm text-gray-500 hover:text-amber-600">← 返回</button>
      {activeGame === 'circuit' && <CircuitChallenge />}
      {activeGame === 'power' && <PowerQuiz />}
    </div>
  );
}

export default function OhmPage() {
  const [activeTab, setActiveTab] = useState('knowledge');

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      <header className="border-b border-amber-100/50 bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-amber-600 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-400 flex items-center justify-center text-white text-lg shadow-md">⚡</div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">欧姆定律</h1>
              <p className="text-xs text-gray-500">I = U/R</p>
            </div>
          </div>
          <div className="flex gap-1 bg-amber-50 rounded-xl p-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-amber-500'}`}>
                <span>{tab.icon}</span><span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'knowledge' && <KnowledgeStation chapters={ohmChapters} lawName="欧姆定律" lawColor="bg-amber-500" />}
        {activeTab === 'lab' && <OhmLab />}
        {activeTab === 'games' && <OhmGames />}
      </main>
      <AIAssistant />
    </div>
  );
}
