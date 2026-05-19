'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ===== 电压攀登者：欧姆定律大冒险 =====
// 核心物理机制: I = U / R
// 电压(U) = 推力/速度, 电阻(R) = 障碍物

interface Platform {
  x: number;
  y: number;
  w: number;
}

interface ResistorGate {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number; // 电阻值
  color: string;
  label: string;
  type: 'red' | 'blue' | 'gray';
}

interface Level {
  platforms: Platform[];
  gates: ResistorGate[];
  goalX: number;
  goalY: number;
  startX: number;
  startY: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const GRAVITY = 0.35;
const MAX_CHARGE = 100;
const CHARGE_RATE = 1.2;
const VELOCITY_SCALE = 0.065; // 电压转速度系数

// 关卡定义
const LEVELS: Level[] = [
  {
    startX: 40, startY: 340,
    platforms: [
      { x: 0, y: 380, w: 200 }, { x: 250, y: 380, w: 150 },
      { x: 480, y: 350, w: 120 }, { x: 660, y: 320, w: 140 },
    ],
    gates: [
      { x: 200, y: 340, w: 20, h: 40, r: 5, color: '#60a5fa', label: '5Ω', type: 'blue' },
      { x: 630, y: 280, w: 20, h: 40, r: 8, color: '#f87171', label: '8Ω', type: 'red' },
    ],
    goalX: 760, goalY: 280,
  },
  {
    startX: 40, startY: 340,
    platforms: [
      { x: 0, y: 380, w: 180 }, { x: 220, y: 360, w: 120 },
      { x: 400, y: 330, w: 100 }, { x: 560, y: 300, w: 80 },
      { x: 700, y: 270, w: 100 },
    ],
    gates: [
      { x: 180, y: 340, w: 20, h: 40, r: 4, color: '#60a5fa', label: '4Ω', type: 'blue' },
      { x: 390, y: 290, w: 20, h: 40, r: 10, color: '#f87171', label: '10Ω', type: 'red' },
      { x: 550, y: 260, w: 20, h: 40, r: 6, color: '#60a5fa', label: '6Ω', type: 'blue' },
    ],
    goalX: 750, goalY: 230,
  },
  {
    startX: 40, startY: 300,
    platforms: [
      { x: 0, y: 340, w: 150 }, { x: 200, y: 310, w: 80 },
      { x: 330, y: 280, w: 80 }, { x: 460, y: 250, w: 80 },
      { x: 590, y: 280, w: 80 }, { x: 700, y: 220, w: 120 },
    ],
    gates: [
      { x: 150, y: 300, w: 20, h: 40, r: 8, color: '#f87171', label: '8Ω', type: 'red' },
      { x: 310, y: 240, w: 20, h: 40, r: 3, color: '#60a5fa', label: '3Ω', type: 'blue' },
      { x: 570, y: 240, w: 20, h: 40, r: 12, color: '#f87171', label: '12Ω', type: 'red' },
      { x: 440, y: 210, w: 20, h: 40, r: 999, color: '#9ca3af', label: '绝缘', type: 'gray' },
    ],
    goalX: 760, goalY: 180,
  },
];

export default function ElectronRunner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef({
    // Player
    px: 40, py: 340, pvx: 0, pvy: 0,
    onGround: false, canDoubleJump: true,
    // Charge
    charging: false, chargeValue: 0,
    // Level
    currentLevel: 0, gameState: 'ready' as 'ready' | 'playing' | 'won' | 'lost',
    // Particles
    particles: [] as Particle[],
    // Camera
    camX: 0,
    // Gate collision cooldown
    gateCooldown: 0,
    // Trail
    trail: [] as { x: number; y: number; a: number }[],
    // Time
    time: 0,
  });

  const [gameState, setGameState] = useState<'ready' | 'playing' | 'won' | 'lost'>('ready');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [chargeDisplay, setChargeDisplay] = useState(0);

  const startLevel = useCallback((lvl: number) => {
    const st = stateRef.current;
    const level = LEVELS[lvl];
    st.px = level.startX; st.py = level.startY;
    st.pvx = 0; st.pvy = 0;
    st.onGround = false; st.canDoubleJump = true;
    st.charging = false; st.chargeValue = 0;
    st.gameState = 'playing'; st.currentLevel = lvl;
    st.particles = []; st.camX = 0; st.gateCooldown = 0;
    st.trail = []; st.time = 0;
    setGameState('playing'); setCurrentLevel(lvl);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const st = stateRef.current;

    const draw = () => {
      const W = canvas!.width;
      const H = canvas!.height;
      const level = LEVELS[st.currentLevel];

      st.time += 0.016;

      // === UPDATE ===
      if (st.gameState === 'playing') {
        // Charge
        if (st.charging) {
          st.chargeValue = Math.min(st.chargeValue + CHARGE_RATE, MAX_CHARGE);
          setChargeDisplay(Math.round(st.chargeValue));
        }

        // Gravity
        st.pvy += GRAVITY;
        st.px += st.pvx;
        st.py += st.pvy;

        // Friction
        st.pvx *= 0.98;

        // Platform collision
        st.onGround = false;
        for (const p of level.platforms) {
          if (st.px + 12 > p.x && st.px - 12 < p.x + p.w &&
              st.py + 12 >= p.y && st.py + 12 <= p.y + 10 && st.pvy >= 0) {
            st.py = p.y - 12;
            st.pvy = 0;
            st.onGround = true;
            st.canDoubleJump = true;
          }
        }

        // Gate collision
        if (st.gateCooldown > 0) st.gateCooldown--;
        for (const g of level.gates) {
          if (st.gateCooldown > 0) break;
          if (st.px + 12 > g.x && st.px - 12 < g.x + g.w &&
              st.py + 12 > g.y && st.py - 12 < g.y + g.h) {
            const speed = Math.sqrt(st.pvx * st.pvx + st.pvy * st.pvy);
            const voltage = st.chargeValue > 0 ? st.chargeValue : speed / VELOCITY_SCALE;
            const current = voltage / g.r;

            if (g.type === 'gray') {
              // 绝缘墙 - 弹回
              st.pvx = -st.pvx * 0.8;
              st.px = st.pvx > 0 ? g.x - 14 : g.x + g.w + 14;
              st.gateCooldown = 30;
              // 火花
              for (let i = 0; i < 8; i++) {
                st.particles.push({
                  x: g.x, y: g.y + g.h / 2,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  life: 30, color: '#fbbf24',
                });
              }
            } else if (g.type === 'red') {
              // 高电阻 - 需要高电压
              if (current > 6) {
                // 冲碎通过
                for (let i = 0; i < 12; i++) {
                  st.particles.push({
                    x: g.x + g.w / 2, y: g.y + g.h / 2,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    life: 40, color: g.color,
                  });
                }
              } else {
                // 弹回
                st.pvx = -Math.abs(st.pvx) * 0.6 - 2;
                st.gateCooldown = 30;
                for (let i = 0; i < 8; i++) {
                  st.particles.push({
                    x: g.x, y: g.y + g.h / 2,
                    vx: -Math.random() * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 30, color: '#f97316',
                  });
                }
              }
            } else {
              // 蓝色低电阻 - 速度太快会冲出平台
              if (current > 12) {
                st.pvy = -8;
                st.pvx = st.pvx * 1.5;
                st.gateCooldown = 30;
              }
              // 否则正常通过
            }
          }
        }

        // Goal check
        const dx = st.px - level.goalX;
        const dy = st.py - level.goalY;
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
          if (st.currentLevel < LEVELS.length - 1) {
            st.gameState = 'won';
            setGameState('won');
          } else {
            st.gameState = 'won';
            setGameState('won');
          }
        }

        // Fall death
        if (st.py > H + 50) {
          st.gameState = 'lost';
          setGameState('lost');
        }

        // Trail
        if (Math.abs(st.pvx) > 0.5 || Math.abs(st.pvy) > 0.5) {
          st.trail.push({ x: st.px, y: st.py, a: 1 });
        }
        st.trail = st.trail.filter(t => { t.a -= 0.04; return t.a > 0; });

        // Particles update
        st.particles = st.particles.filter(p => {
          p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--;
          return p.life > 0;
        });
      }

      // Camera follow
      st.camX += (st.px - W * 0.3 - st.camX) * 0.05;
      if (st.camX < 0) st.camX = 0;

      // === DRAW ===
      // Background - circuit board style
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      for (let x = -st.camX % 40; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      ctx.save();
      ctx.translate(-st.camX, 0);

      // Platforms (copper wire style)
      for (const p of level.platforms) {
        const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + 8);
        grad.addColorStop(0, '#d97706');
        grad.addColorStop(1, '#92400e');
        ctx.fillStyle = grad;
        ctx.fillRect(p.x, p.y, p.w, 8);
        // Copper shine
        ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
        ctx.fillRect(p.x, p.y, p.w, 2);
      }

      // Resistor gates
      for (const g of level.gates) {
        ctx.fillStyle = g.color;
        ctx.fillRect(g.x, g.y, g.w, g.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(g.x, g.y, g.w, g.h);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(g.label, g.x + g.w / 2, g.y - 5);
      }

      // Goal - light bulb
      const gx = level.goalX;
      const gy = level.goalY;
      const glow = 0.5 + Math.sin(st.time * 3) * 0.3;
      ctx.beginPath();
      ctx.arc(gx, gy, 18 + glow * 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(250, 204, 21, ${glow * 0.2})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(gx, gy, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💡', gx, gy + 4);

      // Trail
      for (const t of st.trail) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, 4 * t.a, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${t.a * 0.5})`;
        ctx.fill();
      }

      // Particles
      for (const p of st.particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 40;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Player - electron sprite
      // Charge glow
      if (st.charging && st.chargeValue > 0) {
        const glowR = 15 + st.chargeValue * 0.25;
        ctx.beginPath();
        ctx.arc(st.px, st.py, glowR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(250, 204, 21, ${st.chargeValue / MAX_CHARGE * 0.3})`;
        ctx.fill();
      }

      // Body
      ctx.beginPath();
      ctx.arc(st.px, st.py, 10, 0, Math.PI * 2);
      const bodyGrad = ctx.createRadialGradient(st.px - 3, st.py - 3, 2, st.px, st.py, 10);
      bodyGrad.addColorStop(0, '#93c5fd');
      bodyGrad.addColorStop(1, '#3b82f6');
      ctx.fillStyle = bodyGrad;
      ctx.fill();
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(st.px - 3, st.py - 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(st.px + 3, st.py - 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1e3a5f';
      ctx.beginPath(); ctx.arc(st.px - 2.5, st.py - 2, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(st.px + 3.5, st.py - 2, 1.5, 0, Math.PI * 2); ctx.fill();

      ctx.restore();

      // === HUD ===
      // Voltage meter
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(10, 10, 120, 50);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, 120, 50);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('电压 U (V)', 18, 25);
      // Charge bar
      const barW = 100;
      const fillW = (st.chargeValue / MAX_CHARGE) * barW;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(18, 32, barW, 12);
      const barGrad = ctx.createLinearGradient(18, 0, 18 + fillW, 0);
      barGrad.addColorStop(0, '#22c55e');
      barGrad.addColorStop(0.7, '#eab308');
      barGrad.addColorStop(1, '#ef4444');
      ctx.fillStyle = barGrad;
      ctx.fillRect(18, 32, fillW, 12);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(st.chargeValue)}V`, 68, 42);

      // Formula display
      const nearGate = level.gates.find(g =>
        Math.abs(st.px - (g.x + g.w / 2)) < 80 && g.type !== 'gray'
      );
      if (nearGate) {
        const voltage = st.chargeValue || 10;
        const current = voltage / nearGate.r;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, 65, 180, 25);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`I = U/R = ${Math.round(voltage)}/${nearGate.r} = ${current.toFixed(1)}A`, 18, 82);
      }

      // Level indicator
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(W - 90, 10, 80, 25);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`第 ${st.currentLevel + 1} 关`, W - 50, 27);

      // Controls hint
      if (st.gameState === 'playing' && st.time < 3) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(W / 2 - 130, H - 35, 260, 25);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('按住蓄力 → 松开发射 | 空中点击跳跃', W / 2, H - 19);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [currentLevel]);

  // Mouse/Touch handlers
  const handlePointerDown = useCallback(() => {
    const st = stateRef.current;
    if (st.gameState !== 'playing') return;
    if (!st.onGround && st.canDoubleJump) {
      // Double jump
      st.pvy = -7;
      st.canDoubleJump = false;
      for (let i = 0; i < 6; i++) {
        st.particles.push({
          x: st.px, y: st.py + 10,
          vx: (Math.random() - 0.5) * 3,
          vy: Math.random() * 2,
          life: 20, color: '#60a5fa',
        });
      }
    } else if (st.onGround) {
      st.charging = true;
      st.chargeValue = 0;
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    const st = stateRef.current;
    if (st.gameState !== 'playing') return;
    if (st.charging) {
      // Launch! 电压转化为速度
      const voltage = st.chargeValue;
      const speed = voltage * VELOCITY_SCALE;
      st.pvx = Math.max(speed, 3);
      st.pvy = -4 - speed * 0.3;
      st.charging = false;
      // Launch particles
      for (let i = 0; i < 10; i++) {
        st.particles.push({
          x: st.px, y: st.py,
          vx: -Math.random() * 5,
          vy: (Math.random() - 0.5) * 3,
          life: 25, color: '#fbbf24',
        });
      }
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Game Canvas */}
      <div className="relative w-full max-w-[800px]">
        <canvas
          ref={canvasRef}
          width={800}
          height={420}
          className="w-full rounded-xl border-2 border-amber-200/30 cursor-pointer"
          style={{ imageRendering: 'auto' }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        />

        {/* Overlay for start/win/lose */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl">
            <div className="text-3xl font-bold text-amber-400 mb-2">⚡ 电压攀登者</div>
            <p className="text-amber-200 text-sm mb-1">欧姆定律大冒险</p>
            <p className="text-gray-400 text-xs mb-4">I = U / R · 电压越大速度越快</p>
            <button onClick={() => startLevel(0)}
              className="px-6 py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition">
              开始游戏
            </button>
            <div className="mt-4 text-gray-400 text-xs space-y-1 text-center">
              <p>🎮 按住蓄力 → 松开发射</p>
              <p>🏃 空中点击可二段跳</p>
              <p>🔴 红色高阻门需高电压冲碎</p>
              <p>🔵 蓝色低阻门不要速度太快</p>
            </div>
          </div>
        )}

        {gameState === 'won' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl">
            {currentLevel < LEVELS.length - 1 ? (
              <>
                <div className="text-2xl font-bold text-green-400 mb-2">🎉 过关！</div>
                <p className="text-gray-300 text-sm mb-4">第 {currentLevel + 1} 关完成</p>
                <button onClick={() => startLevel(currentLevel + 1)}
                  className="px-6 py-2.5 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600">
                  下一关
                </button>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-amber-400 mb-2">🏆 全部通关！</div>
                <p className="text-gray-300 text-sm mb-4">你已掌握欧姆定律的核心原理</p>
                <button onClick={() => startLevel(0)}
                  className="px-6 py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600">
                  重新挑战
                </button>
              </>
            )}
          </div>
        )}

        {gameState === 'lost' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl">
            <div className="text-2xl font-bold text-red-400 mb-2">💥 坠落！</div>
            <p className="text-gray-300 text-sm mb-4">注意蓄力大小和电阻门类型</p>
            <button onClick={() => startLevel(currentLevel)}
              className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600">
              重新挑战
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
