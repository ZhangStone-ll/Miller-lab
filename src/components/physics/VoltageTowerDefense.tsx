'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ===== 电压塔防 =====
// 核心机制: I = V / R, P = V * I, damage = I * 10

interface Tower {
  x: number;
  y: number;
  type: 'copper' | 'iron' | 'carbon';
  r: number; // 电阻值
  level: number; // 升级等级 0-2
  range: number;
  cooldown: number;
  cost: number;
}

interface Monster {
  x: number;
  y: number;
  type: 'rubber' | 'plastic' | 'ceramic' | 'boss';
  hp: number;
  maxHp: number;
  speed: number;
  pathIndex: number;
  pathProgress: number;
  reward: number;
}

interface Projectile {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  life: number;
}

// S形路径点
const PATH_POINTS = [
  { x: 0, y: 250 }, { x: 120, y: 250 }, { x: 120, y: 100 },
  { x: 360, y: 100 }, { x: 360, y: 350 }, { x: 560, y: 350 },
  { x: 560, y: 150 }, { x: 700, y: 150 }, { x: 700, y: 250 },
  { x: 800, y: 250 },
];

const TOWER_DEFS = {
  copper: { r: 2, range: 120, cost: 50, color: '#b87333', label: '铜线塔', upgradeR: 0.8 },
  iron: { r: 5, range: 100, cost: 30, color: '#a8a8a8', label: '铁丝塔', upgradeR: 0.8 },
  carbon: { r: 10, range: 80, cost: 20, color: '#4a4a4a', label: '碳棒塔', upgradeR: 0.8 },
};

const MONSTER_DEFS = {
  rubber: { hp: 30, speed: 1.2, reward: 15, color: '#60a5fa' },
  plastic: { hp: 60, speed: 0.8, reward: 25, color: '#4ade80' },
  ceramic: { hp: 120, speed: 0.6, reward: 50, color: '#fb923c' },
  boss: { hp: 500, speed: 0.4, reward: 200, color: '#a78bfa' },
};

interface WaveDef {
  monsters: Array<{ type: 'rubber' | 'plastic' | 'ceramic' | 'boss'; count: number }>;
}

const WAVES: WaveDef[] = [
  { monsters: [{ type: 'rubber', count: 5 }] },
  { monsters: [{ type: 'rubber', count: 8 }] },
  { monsters: [{ type: 'rubber', count: 5 }, { type: 'plastic', count: 3 }] },
  { monsters: [{ type: 'plastic', count: 6 }, { type: 'ceramic', count: 2 }] },
  { monsters: [{ type: 'rubber', count: 5 }, { type: 'plastic', count: 4 }, { type: 'boss', count: 1 }] },
  { monsters: [{ type: 'plastic', count: 8 }, { type: 'ceramic', count: 3 }] },
  { monsters: [{ type: 'ceramic', count: 6 }, { type: 'plastic', count: 4 }] },
  { monsters: [{ type: 'ceramic', count: 8 }, { type: 'rubber', count: 6 }] },
  { monsters: [{ type: 'ceramic', count: 6 }, { type: 'plastic', count: 6 }, { type: 'boss', count: 1 }] },
  { monsters: [{ type: 'ceramic', count: 10 }, { type: 'boss', count: 2 }] },
];

const CANVAS_W = 800;
const CANVAS_H = 500;
const MAX_POWER = 50;

export default function VoltageTowerDefense() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const stRef = useRef({
    towers: [] as Tower[],
    monsters: [] as Monster[],
    projectiles: [] as Projectile[],
    // Game state
    wave: 0, gold: 100, coreHp: 100, maxCoreHp: 100,
    voltage: 12, // V
    gameState: 'ready' as 'ready' | 'prep' | 'wave' | 'over' | 'victory',
    overloading: false, overloadTimer: 0,
    // Wave spawning
    spawnQueue: [] as Array<'rubber' | 'plastic' | 'ceramic' | 'boss'>,
    spawnTimer: 0, spawnInterval: 40,
    // Prep timer
    prepTimer: 0,
    // Selected
    selectedTower: null as Tower | null,
    placingTower: null as 'copper' | 'iron' | 'carbon' | null,
    placeX: 0, placeY: 0,
    // Time
    time: 0,
    // Spark effects
    sparks: [] as { x: number; y: number; life: number; color: string }[],
  });

  const [gameState, setGameState] = useState<'ready' | 'prep' | 'wave' | 'over' | 'victory'>('ready');
  const [voltage, setVoltage] = useState(12);
  const [gold, setGold] = useState(100);
  const [wave, setWave] = useState(0);
  const [coreHp, setCoreHp] = useState(100);
  const [totalPower, setTotalPower] = useState(0);
  const [overloading, setOverloading] = useState(false);

  const getTotalPower = useCallback(() => {
    const st = stRef.current;
    let p = 0;
    for (const t of st.towers) {
      const r = getTowerR(t);
      p += (st.voltage * st.voltage) / r;
    }
    return p;
  }, []);

  const getTowerR = (t: Tower) => {
    const def = TOWER_DEFS[t.type];
    return def.r * Math.pow(def.upgradeR, t.level);
  };

  const startGame = useCallback(() => {
    const st = stRef.current;
    st.towers = []; st.monsters = []; st.projectiles = [];
    st.wave = 0; st.gold = 100; st.coreHp = 100; st.maxCoreHp = 100;
    st.voltage = 12; st.gameState = 'prep'; st.overloading = false;
    st.spawnQueue = []; st.prepTimer = 600; // 10s at 60fps
    st.selectedTower = null; st.placingTower = null;
    st.sparks = [];
    setGameState('prep'); setVoltage(12); setGold(100); setWave(0); setCoreHp(100);
    setTotalPower(0); setOverloading(false);
    startNextWave();
  }, []);

  const startNextWave = useCallback(() => {
    const st = stRef.current;
    if (st.wave >= WAVES.length) {
      st.gameState = 'victory'; setGameState('victory'); return;
    }
    const waveDef = WAVES[st.wave];
    st.spawnQueue = [];
    for (const m of waveDef.monsters) {
      for (let i = 0; i < m.count; i++) st.spawnQueue.push(m.type);
    }
    // Shuffle a bit
    for (let i = st.spawnQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [st.spawnQueue[i], st.spawnQueue[j]] = [st.spawnQueue[j], st.spawnQueue[i]];
    }
    st.spawnTimer = 0; st.spawnInterval = 40;
    st.gameState = 'wave';
    setGameState('wave'); setWave(st.wave);
  }, []);

  const spawnMonster = useCallback((type: 'rubber' | 'plastic' | 'ceramic' | 'boss') => {
    const def = MONSTER_DEFS[type];
    stRef.current.monsters.push({
      x: PATH_POINTS[0].x, y: PATH_POINTS[0].y,
      type, hp: def.hp, maxHp: def.hp, speed: def.speed,
      pathIndex: 0, pathProgress: 0, reward: def.reward,
    });
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const st = stRef.current;

    // Check if clicking on existing tower
    const clickedTower = st.towers.find(t =>
      Math.abs(t.x - mx) < 20 && Math.abs(t.y - my) < 20
    );
    if (clickedTower) {
      st.selectedTower = clickedTower;
      return;
    }
    st.selectedTower = null;

    // Place tower
    if (st.placingTower && (st.gameState === 'prep' || st.gameState === 'wave')) {
      const def = TOWER_DEFS[st.placingTower];
      if (st.gold >= def.cost) {
        // Check not on path
        const onPath = PATH_POINTS.some((p, i) => {
          if (i === 0) return false;
          const prev = PATH_POINTS[i - 1];
          const dx = p.x - prev.x;
          const dy = p.y - prev.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const nx = -dy / len;
          const ny = dx / len;
          const px = mx - prev.x;
          const py = my - prev.y;
          const proj = (px * dx + py * dy) / (len * len);
          const perpDist = Math.abs(px * nx + py * ny);
          return proj >= 0 && proj <= 1 && perpDist < 25;
        });
        if (!onPath) {
          st.towers.push({
            x: mx, y: my, type: st.placingTower,
            r: def.r, level: 0, range: def.range, cooldown: 0, cost: def.cost,
          });
          st.gold -= def.cost;
          setGold(st.gold);
          st.placingTower = null;
        }
      }
    }
  }, []);

  const handleCanvasMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stRef.current.placeX = (e.clientX - rect.left) * (CANVAS_W / rect.width);
    stRef.current.placeY = (e.clientY - rect.top) * (CANVAS_H / rect.height);
  }, []);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const W = CANVAS_W;
      const H = CANVAS_H;
      const st = stRef.current;
      st.time += 0.016;

      // === UPDATE ===
      if (st.gameState === 'wave') {
        // Spawn
        if (st.spawnQueue.length > 0) {
          st.spawnTimer++;
          if (st.spawnTimer >= st.spawnInterval) {
            spawnMonster(st.spawnQueue.shift()!);
            st.spawnTimer = 0;
          }
        }

        // Overload check
        const totalP = getTotalPower();
        if (totalP > MAX_POWER && !st.overloading) {
          if (totalP > MAX_POWER) {
            st.overloading = true;
            st.overloadTimer = 180; // 3 seconds
            setOverloading(true);
          }
        }
        if (st.overloading) {
          st.overloadTimer--;
          if (st.overloadTimer <= 0) {
            st.overloading = false;
            setOverloading(false);
            // Reduce voltage to safe level
            const safeV = Math.sqrt(MAX_POWER * 0.8 * getTowerR(st.towers[0] || { type: 'copper', level: 0, r: 2 } as Tower));
            st.voltage = Math.min(st.voltage, Math.sqrt(MAX_POWER * 0.8 / Math.max(st.towers.length, 1) * 2));
            setVoltage(Math.round(st.voltage * 2) / 2);
          }
        }

        // Move monsters
        for (const m of st.monsters) {
          if (m.pathIndex >= PATH_POINTS.length - 1) {
            // Reached core
            st.coreHp -= m.maxHp * 0.5;
            setCoreHp(Math.max(0, Math.round(st.coreHp)));
            m.hp = 0;
            continue;
          }
          const target = PATH_POINTS[m.pathIndex + 1];
          const dx = target.x - m.x;
          const dy = target.y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < m.speed * 2) {
            m.pathIndex++;
            m.pathProgress = 0;
          } else {
            m.x += (dx / dist) * m.speed;
            m.y += (dy / dist) * m.speed;
            m.pathProgress += m.speed / dist;
          }
        }
        // Remove dead monsters
        st.monsters = st.monsters.filter(m => {
          if (m.hp <= 0) {
            if (m.hp > -900) { st.gold += m.reward; setGold(st.gold); }
            return false;
          }
          return true;
        });

        // Towers attack (not during overload)
        if (!st.overloading) {
          for (const t of st.towers) {
            t.cooldown--;
            if (t.cooldown <= 0) {
              // Find nearest monster in range
              let nearest: Monster | null = null;
              let nearDist = Infinity;
              for (const m of st.monsters) {
                const d = Math.sqrt((m.x - t.x) ** 2 + (m.y - t.y) ** 2);
                if (d < t.range && d < nearDist) {
                  nearDist = d; nearest = m;
                }
              }
              if (nearest) {
                const R = getTowerR(t);
                const I = st.voltage / R;
                const damage = I * 10;
                st.projectiles.push({
                  x: t.x, y: t.y,
                  targetX: nearest.x, targetY: nearest.y,
                  speed: 8, damage, life: 60,
                });
                t.cooldown = 90; // 1.5s at 60fps
                // Spark
                st.sparks.push({ x: t.x, y: t.y, life: 10, color: '#00d4ff' });
              }
            }
          }
        }

        // Move projectiles
        for (const p of st.projectiles) {
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < p.speed * 2) {
            // Hit
            const hitM = st.monsters.find(m =>
              Math.abs(m.x - p.targetX) < 15 && Math.abs(m.y - p.targetY) < 15
            );
            if (hitM) hitM.hp -= p.damage;
            p.life = 0;
          } else {
            p.x += (dx / dist) * p.speed;
            p.y += (dy / dist) * p.speed;
          }
          p.life--;
        }
        st.projectiles = st.projectiles.filter(p => p.life > 0);
        st.sparks = st.sparks.filter(s => { s.life--; return s.life > 0; });

        // Check wave end
        if (st.spawnQueue.length === 0 && st.monsters.length === 0) {
          st.wave++;
          if (st.wave >= WAVES.length) {
            st.gameState = 'victory'; setGameState('victory');
          } else {
            st.gameState = 'prep'; st.prepTimer = 600;
            setGameState('prep');
          }
        }

        // Core destroyed
        if (st.coreHp <= 0) {
          st.gameState = 'over'; setGameState('over');
        }

        setTotalPower(Math.round(getTotalPower() * 10) / 10);
      }

      if (st.gameState === 'prep') {
        st.prepTimer--;
        if (st.prepTimer <= 0) {
          startNextWave();
        }
        setTotalPower(Math.round(getTotalPower() * 10) / 10);
      }

      // === DRAW ===
      // Background
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = '#16213e';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Path
      ctx.beginPath();
      ctx.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y);
      for (let i = 1; i < PATH_POINTS.length; i++) {
        ctx.lineTo(PATH_POINTS[i].x, PATH_POINTS[i].y);
      }
      ctx.strokeStyle = '#0f3460';
      ctx.lineWidth = 28;
      ctx.stroke();
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 22;
      ctx.stroke();

      // Core (right side)
      const coreX = 780;
      const coreY = 250;
      const coreGlow = 0.5 + Math.sin(st.time * 4) * 0.3;
      ctx.beginPath();
      ctx.arc(coreX, coreY, 20, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245, 197, 66, ${coreGlow * 0.3})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(coreX, coreY, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#f5c542';
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Monsters
      for (const m of st.monsters) {
        ctx.save();
        ctx.translate(m.x, m.y);
        if (m.type === 'rubber') {
          ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fillStyle = MONSTER_DEFS.rubber.color; ctx.fill();
          ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 1.5; ctx.stroke();
        } else if (m.type === 'plastic') {
          ctx.fillStyle = MONSTER_DEFS.plastic.color;
          ctx.fillRect(-9, -9, 18, 18);
          ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 1.5;
          ctx.strokeRect(-9, -9, 18, 18);
        } else if (m.type === 'ceramic') {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i - Math.PI / 6;
            const px = Math.cos(a) * 12;
            const py = Math.sin(a) * 12;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = MONSTER_DEFS.ceramic.color; ctx.fill();
          ctx.strokeStyle = '#ea580c'; ctx.lineWidth = 1.5; ctx.stroke();
        } else {
          // Boss - octagon
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = (Math.PI / 4) * i - Math.PI / 8;
            const px = Math.cos(a) * 16;
            const py = Math.sin(a) * 16;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = MONSTER_DEFS.boss.color; ctx.fill();
          ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2; ctx.stroke();
        }
        // HP bar
        const barW = m.type === 'boss' ? 30 : 20;
        ctx.fillStyle = '#333';
        ctx.fillRect(-barW / 2, -20, barW, 4);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-barW / 2, -20, barW * (m.hp / m.maxHp), 4);
        ctx.restore();
      }

      // Towers
      for (const t of st.towers) {
        const def = TOWER_DEFS[t.type];
        ctx.save();
        ctx.translate(t.x, t.y);
        // Base
        ctx.fillStyle = def.color;
        ctx.fillRect(-12, -12, 24, 24);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-12, -12, 24, 24);
        // Level indicator
        for (let i = 0; i < t.level; i++) {
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(-8 + i * 6, -16, 4, 4);
        }
        // R label
        ctx.fillStyle = '#fff';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${getTowerR(t).toFixed(1)}Ω`, 0, 4);
        // Range circle (if selected)
        if (st.selectedTower === t) {
          ctx.beginPath();
          ctx.arc(0, 0, t.range, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Projectiles (electric arcs)
      for (const p of st.projectiles) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        // Jagged line
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.max(3, Math.floor(dist / 15));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const jx = p.x + dx * t + (Math.random() - 0.5) * 8;
          const jy = p.y + dy * t + (Math.random() - 0.5) * 8;
          ctx.lineTo(jx, jy);
        }
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Sparks
      for (const s of st.sparks) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 5 * (s.life / 10), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${s.life / 10 * 0.5})`;
        ctx.fill();
      }

      // Placement preview
      if (st.placingTower && (st.gameState === 'prep' || st.gameState === 'wave')) {
        const def = TOWER_DEFS[st.placingTower];
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = def.color;
        ctx.fillRect(st.placeX - 12, st.placeY - 12, 24, 24);
        ctx.beginPath();
        ctx.arc(st.placeX, st.placeY, def.range, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Overload warning
      if (st.overloading) {
        ctx.fillStyle = `rgba(255, 51, 51, ${0.1 + Math.sin(st.time * 10) * 0.1})`;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ 超载！塔停工中 ⚡', W / 2, H / 2);
      }

      // Prep timer
      if (st.gameState === 'prep' && st.prepTimer > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(W / 2 - 80, 10, 160, 30);
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`准备时间: ${Math.ceil(st.prepTimer / 60)}s`, W / 2, 30);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [gameState, getTotalPower, spawnMonster, startNextWave]);

  // Voltage slider handler
  const handleVoltageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    stRef.current.voltage = v;
    setVoltage(v);
  }, []);

  // Place tower buttons
  const handlePlaceTower = useCallback((type: 'copper' | 'iron' | 'carbon') => {
    const st = stRef.current;
    if (st.gold >= TOWER_DEFS[type].cost) {
      st.placingTower = type;
    }
  }, []);

  // Upgrade selected tower
  const handleUpgrade = useCallback(() => {
    const st = stRef.current;
    if (st.selectedTower && st.selectedTower.level < 2 && st.gold >= 40) {
      st.selectedTower.level++;
      const def = TOWER_DEFS[st.selectedTower.type];
      st.selectedTower.r = def.r * Math.pow(def.upgradeR, st.selectedTower.level);
      st.gold -= 40;
      setGold(st.gold);
    }
  }, []);

  // Start wave early
  const handleStartWave = useCallback(() => {
    const st = stRef.current;
    if (st.gameState === 'prep') {
      st.prepTimer = 0;
    }
  }, []);

  const totalP = totalPower;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Top info bar */}
      <div className="w-full max-w-[800px] flex items-center justify-between bg-slate-800/80 rounded-xl px-4 py-2 text-sm">
        <span className="text-amber-400 font-bold">波次 {wave + 1}/{WAVES.length}</span>
        <span className="text-yellow-300">💰 ${gold}</span>
        <span className="text-red-400">❤️ {Math.round(coreHp)}/100</span>
        <span className={totalP > MAX_POWER * 0.9 ? 'text-red-400' : 'text-cyan-400'}>
          ⚡ {totalP.toFixed(1)}/{MAX_POWER}W
        </span>
        {gameState === 'prep' && (
          <button onClick={handleStartWave}
            className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700">
            开始下一波
          </button>
        )}
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="w-full max-w-[800px] rounded-xl border-2 border-cyan-900/50 cursor-pointer"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMove}
      />

      {/* Bottom panel */}
      <div className="w-full max-w-[800px] bg-slate-800/80 rounded-xl p-3">
        {/* Tower placement */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-gray-400 text-xs">放置电击塔:</span>
          <button onClick={() => handlePlaceTower('copper')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${gold >= 50 ? 'bg-amber-700 text-white hover:bg-amber-600' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
            style={{ backgroundColor: gold >= 50 ? '#b87333' : undefined }}>
            铜线塔 $50 (R=2Ω)
          </button>
          <button onClick={() => handlePlaceTower('iron')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${gold >= 30 ? 'hover:opacity-80' : 'cursor-not-allowed opacity-50'}`}
            style={{ backgroundColor: gold >= 30 ? '#a8a8a8' : '#374151', color: gold >= 30 ? '#000' : '#666' }}>
            铁丝塔 $30 (R=5Ω)
          </button>
          <button onClick={() => handlePlaceTower('carbon')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${gold >= 20 ? 'hover:opacity-80' : 'cursor-not-allowed opacity-50'}`}
            style={{ backgroundColor: gold >= 20 ? '#4a4a4a' : '#1f2937', color: gold >= 20 ? '#fff' : '#666' }}>
            碳棒塔 $20 (R=10Ω)
          </button>
          {stRef.current.selectedTower && (
            <button onClick={handleUpgrade}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${gold >= 40 && stRef.current.selectedTower.level < 2 ? 'bg-yellow-600 text-white hover:bg-yellow-500' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
              升级 $40 (Lv.{(stRef.current.selectedTower?.level ?? 0) + 1}/3)
            </button>
          )}
        </div>

        {/* Voltage slider */}
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 text-xs font-bold">电源电压: {voltage}V</span>
          <input
            type="range"
            min="0"
            max="24"
            step="0.5"
            value={voltage}
            onChange={handleVoltageChange}
            className="flex-1 h-2 accent-cyan-400"
          />
          <span className="text-gray-500 text-xs">0V — 24V</span>
        </div>

        {/* Formula display */}
        <div className="mt-2 text-center text-xs text-cyan-300">
          I = V/R · 每塔伤害 = I × 10 · 总功率 P = V²/R · 功率上限 {MAX_POWER}W
        </div>
      </div>

      {/* Game Over / Victory / Start overlay */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl z-10"
          style={{ position: 'fixed' }}>
          <div className="text-3xl font-bold text-cyan-400 mb-2">⚡ 电压塔防</div>
          <p className="text-gray-300 text-sm mb-1">欧姆定律 × 塔防策略</p>
          <p className="text-gray-500 text-xs mb-4 max-w-sm text-center">
            放置电击塔消灭绝缘怪物，调节电压控制伤害与功耗，别让超载摧毁你的防线！
          </p>
          <button onClick={startGame}
            className="px-6 py-2.5 bg-cyan-500 text-white rounded-xl font-bold hover:bg-cyan-600 transition">
            开始游戏
          </button>
          <div className="mt-4 text-gray-400 text-xs space-y-1 text-center">
            <p>🏗️ 点击下方按钮选择塔类型，再点击画布放置</p>
            <p>🎚️ 拖动电压滑块调节全局电压</p>
            <p>⚠️ 电压越高伤害越大，但功耗也越高</p>
          </div>
        </div>
      )}

      {gameState === 'over' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl z-10"
          style={{ position: 'fixed' }}>
          <div className="text-2xl font-bold text-red-400 mb-2">💔 核心被摧毁！</div>
          <p className="text-gray-300 text-sm mb-4">坚持到了第 {wave + 1} 波</p>
          <button onClick={startGame}
            className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600">
            重新开始
          </button>
        </div>
      )}

      {gameState === 'victory' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl z-10"
          style={{ position: 'fixed' }}>
          <div className="text-2xl font-bold text-amber-400 mb-2">🏆 胜利！</div>
          <p className="text-gray-300 text-sm mb-4">成功守护了电路核心！</p>
          <button onClick={startGame}
            className="px-6 py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600">
            再来一局
          </button>
        </div>
      )}
    </div>
  );
}
