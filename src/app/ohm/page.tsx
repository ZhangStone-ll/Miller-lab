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

// Ohm's Law Virtual Lab - Two Experiments
function OhmLab() {
  const [activeExperiment, setActiveExperiment] = useState<number | null>(null);

  if (!activeExperiment) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-gray-500 text-center">选择一个实验开始探索欧姆定律</p>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <button onClick={() => setActiveExperiment(1)}
            className="bg-white rounded-2xl border-2 border-amber-100 p-8 text-center hover:border-amber-400 hover:shadow-lg transition-all group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform">🔬</div>
            <h4 className="font-bold text-gray-800 text-lg mb-2">实验一：电阻大小固定</h4>
            <p className="text-sm text-gray-500">电阻恒定，调节电压，发现电流与电压的关系</p>
          </button>
          <button onClick={() => setActiveExperiment(2)}
            className="bg-white rounded-2xl border-2 border-amber-100 p-8 text-center hover:border-amber-400 hover:shadow-lg transition-all group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform">🔬</div>
            <h4 className="font-bold text-gray-800 text-lg mb-2">实验二：电压大小固定</h4>
            <p className="text-sm text-gray-500">电压恒定，改变电阻，发现电流与电阻的关系</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setActiveExperiment(null)} className="text-sm text-gray-500 hover:text-amber-600 transition-colors">← 返回实验选择</button>
      {activeExperiment === 1 && <OhmExperiment1 />}
      {activeExperiment === 2 && <OhmExperiment2 />}
    </div>
  );
}

// Experiment 1: Fixed Resistance, vary voltage
function OhmExperiment1() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);

  // Circuit state
  const fixedResistance = 10; // 10Ω fixed resistor
  const [switchClosed, setSwitchClosed] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0); // 0=max resistance, 100=min resistance
  const [dataRecords, setDataRecords] = useState<Array<{ voltage: number; current: number }>>([]);
  const [showConclusion, setShowConclusion] = useState(false);

  // Calculate circuit values
  // Slider resistance: 0-50Ω (when position=0, sliderR=50; position=100, sliderR=0)
  const sliderResistance = 50 * (1 - sliderPosition / 100);
  // Total resistance = fixed + slider (series circuit)
  const totalResistance = fixedResistance + sliderResistance;
  // EMF = 6V
  const emf = 6;
  const current = switchClosed ? emf / totalResistance : 0;
  // Voltage across fixed resistor
  const voltageAcrossR = switchClosed ? current * fixedResistance : 0;

  const canComplete = dataRecords.length >= 3;
  const hasRecordedCurrentData = dataRecords.length > 0 && Math.abs(dataRecords[dataRecords.length - 1].current - current) < 0.001;

  // Keep state in ref for canvas
  const stateRef = useRef({ switchClosed: false, current: 0, sliderPosition: 0, voltageAcrossR: 0 });
  useEffect(() => {
    stateRef.current = { switchClosed, current, sliderPosition, voltageAcrossR };
  });

  // Canvas drawing
  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const st = stateRef.current;
      timeRef.current += 0.016;

      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#fefce8';
      ctx.fillRect(0, 0, w, h);

      // Circuit layout coordinates
      const left = 80;
      const right = w - 80;
      const top = 80;
      const bottom = h - 80;
      const midX = w / 2;
      const midY = h / 2;

      // Wire color
      const wireColor = st.switchClosed ? '#64748b' : '#94a3b8';
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Top wire: left to switch, switch to midX, midX to right
      // Switch position
      const switchX = left + (right - left) * 0.3;
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(switchX - 25, top);
      ctx.stroke();

      // Switch
      if (st.switchClosed) {
        ctx.beginPath();
        ctx.moveTo(switchX - 25, top);
        ctx.lineTo(switchX + 25, top);
        ctx.stroke();
        // Switch dot
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(switchX - 25, top, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(switchX + 25, top, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(switchX - 25, top);
        ctx.lineTo(switchX + 15, top - 25);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(switchX - 25, top, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(switchX + 25, top, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Switch label
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('S', switchX, top - 30);

      // Top wire continues
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(switchX + 25, top);
      ctx.lineTo(right, top);
      ctx.stroke();

      // Right wire: top to bottom
      ctx.beginPath();
      ctx.moveTo(right, top);
      ctx.lineTo(right, bottom);
      ctx.stroke();

      // Bottom wire: right to left
      ctx.beginPath();
      ctx.moveTo(right, bottom);
      ctx.lineTo(left, bottom);
      ctx.stroke();

      // Left wire: bottom to top
      ctx.beginPath();
      ctx.moveTo(left, bottom);
      ctx.lineTo(left, top);
      ctx.stroke();

      // Battery on left side
      const batY = midY;
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 3;
      // Positive terminal (longer line)
      ctx.beginPath();
      ctx.moveTo(left - 15, batY - 12);
      ctx.lineTo(left + 15, batY - 12);
      ctx.stroke();
      // Negative terminal (shorter line)
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(left - 8, batY + 12);
      ctx.lineTo(left + 8, batY + 12);
      ctx.stroke();
      // Plus/minus
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', left - 25, batY - 8);
      ctx.fillStyle = '#2563eb';
      ctx.fillText('−', left - 25, batY + 16);
      // Battery label
      ctx.fillStyle = '#92400e';
      ctx.font = '12px sans-serif';
      ctx.fillText(`${emf}V`, left, batY + 35);

      // Fixed resistor on right side
      const resY = midY - 30;
      const resW = 20;
      const resH = 60;
      ctx.fillStyle = '#fef2f2';
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      const resX = right;
      // Zigzag resistor symbol
      ctx.beginPath();
      ctx.moveTo(resX, resY - resH / 2);
      for (let i = 0; i < 6; i++) {
        const y = resY - resH / 2 + (i + 0.5) * resH / 6;
        const xOff = (i % 2 === 0) ? 12 : -12;
        ctx.lineTo(resX + xOff, y);
      }
      ctx.lineTo(resX, resY + resH / 2);
      ctx.stroke();
      // Resistor label
      ctx.fillStyle = '#991b1b';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`R=${fixedResistance}Ω`, resX + 20, resY + 4);

      // Slider rheostat on top wire (between switch and right)
      const sliderX = midX + 40;
      const sliderW = 100;
      const sliderH = 16;
      // Draw rheostat body
      ctx.fillStyle = '#e0e7ff';
      ctx.strokeStyle = '#4338ca';
      ctx.lineWidth = 2;
      ctx.fillRect(sliderX - sliderW / 2, top - sliderH / 2 - 5, sliderW, sliderH);
      ctx.strokeRect(sliderX - sliderW / 2, top - sliderH / 2 - 5, sliderW, sliderH);
      // Coil pattern
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        const cx2 = sliderX - sliderW / 2 + 8 + i * (sliderW - 16) / 7;
        ctx.beginPath();
        ctx.arc(cx2, top - 5, 5, Math.PI, 0);
        ctx.stroke();
      }
      // Slider arrow
      const arrowX = sliderX - sliderW / 2 + (st.sliderPosition / 100) * sliderW;
      ctx.fillStyle = '#4338ca';
      ctx.beginPath();
      ctx.moveTo(arrowX, top - 25);
      ctx.lineTo(arrowX - 8, top - 15);
      ctx.lineTo(arrowX + 8, top - 15);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(arrowX, top - 15);
      ctx.lineTo(arrowX, top - 5);
      ctx.stroke();
      // Slider label
      ctx.fillStyle = '#4338ca';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('滑动变阻器', sliderX, top - 30);

      // Voltmeter - across fixed resistor (parallel, on the right)
      const voltmeterX = right + 40;
      const voltmeterY = midY - 30;
      ctx.fillStyle = '#dbeafe';
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(voltmeterX, voltmeterY, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('V', voltmeterX, voltmeterY + 5);
      // Voltmeter reading
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#1e40af';
      ctx.fillText(`${st.voltageAcrossR.toFixed(2)}V`, voltmeterX, voltmeterY + 38);
      // Voltmeter wires (dashed)
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(voltmeterX - 24, voltmeterY);
      ctx.lineTo(right + 5, top + 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(voltmeterX - 24, voltmeterY);
      ctx.lineTo(right + 5, bottom - 5);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ammeter - on left side, below battery
      const ammeterY = batY + 60;
      ctx.fillStyle = '#dcfce7';
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(left, ammeterY, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('A', left, ammeterY + 5);
      // Ammeter reading
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${(st.current * 1000).toFixed(1)}mA`, left, ammeterY + 38);

      // Electron animation when switch is closed
      if (st.switchClosed && st.current > 0.001) {
        const electronSpeed = st.current * 30;
        const time = timeRef.current * electronSpeed;
        ctx.fillStyle = '#3b82f6';
        const perimeter = 2 * (right - left + bottom - top);
        for (let i = 0; i < 12; i++) {
          const t = ((time + i * perimeter / 12) % perimeter) / perimeter;
          let ex: number, ey: number;
          const topLen = right - left;
          const rightLen = bottom - top;
          const bottomLen = right - left;
          const leftLen = bottom - top;
          const total = topLen + rightLen + bottomLen + leftLen;
          const pos = t * total;
          if (pos < topLen) {
            ex = left + pos;
            ey = top;
          } else if (pos < topLen + rightLen) {
            ex = right;
            ey = top + (pos - topLen);
          } else if (pos < topLen + rightLen + bottomLen) {
            ex = right - (pos - topLen - rightLen);
            ey = bottom;
          } else {
            ex = left;
            ey = bottom - (pos - topLen - rightLen - bottomLen);
          }
          ctx.beginPath();
          ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  const handleRecordData = () => {
    if (!switchClosed) return;
    if (hasRecordedCurrentData) return;
    setDataRecords(prev => [...prev, { voltage: parseFloat(voltageAcrossR.toFixed(2)), current: parseFloat((current * 1000).toFixed(1)) }]);
  };

  const handleCloseSwitch = () => {
    if (!switchClosed) {
      setSwitchClosed(true);
      // Auto record first data point after a short delay
      setTimeout(() => {
        setDataRecords(prev => {
          const v = parseFloat((emf * fixedResistance / (fixedResistance + 50 * (1 - sliderPosition / 100))).toFixed(2));
          const i = parseFloat((emf / (fixedResistance + 50 * (1 - sliderPosition / 100)) * 1000).toFixed(1));
          if (prev.length === 0) {
            return [...prev, { voltage: v, current: i }];
          }
          return prev;
        });
      }, 300);
    }
  };

  const handleSliderChange = (val: number) => {
    setSliderPosition(val);
    if (switchClosed) {
      // Auto record if different from last
      const newSliderR = 50 * (1 - val / 100);
      const newTotalR = fixedResistance + newSliderR;
      const newCurrent = emf / newTotalR;
      const newVoltage = newCurrent * fixedResistance;
      const newRecord = { voltage: parseFloat(newVoltage.toFixed(2)), current: parseFloat((newCurrent * 1000).toFixed(1)) };
      setDataRecords(prev => {
        if (prev.length === 0) return [newRecord];
        const last = prev[prev.length - 1];
        if (Math.abs(last.voltage - newRecord.voltage) > 0.05 || Math.abs(last.current - newRecord.current) > 0.5) {
          return [...prev, newRecord];
        }
        return prev;
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Experiment title and tips */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
        <h3 className="font-bold text-amber-800 text-lg mb-2">实验一：电阻大小固定</h3>
        <p className="text-sm text-amber-700 mb-1">🎯 实验目标：电阻恒定，通过调节电压，你能发现电流与电压有什么关系吗？</p>
        <p className="text-xs text-amber-600">💡 操作指引：闭合开关后，调节滑动变阻器，至少得到3组实验数据后可完成实验</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5">
        {/* Left: Circuit canvas and controls */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-amber-100 p-3">
            <canvas ref={canvasRef} width={700} height={400} className="w-full rounded-lg" />
          </div>
          <div className="bg-white rounded-xl border border-amber-100 p-4 space-y-4">
            <div className="flex items-center gap-4">
              {/* Switch button */}
              <button
                onClick={handleCloseSwitch}
                disabled={switchClosed}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  switchClosed
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'bg-amber-500 text-white hover:bg-amber-600 shadow-md'
                }`}
              >
                {switchClosed ? '开关已闭合 ✓' : '闭合开关 S'}
              </button>

              {/* Slider rheostat */}
              <div className="flex-1">
                <label className="text-xs text-gray-500 font-medium block mb-1">调节滑动变阻器（改变电压）</label>
                <input
                  type="range" min={0} max={100} step={1}
                  value={sliderPosition}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  disabled={!switchClosed}
                  className={`w-full accent-indigo-500 ${!switchClosed ? 'opacity-50' : ''}`}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>阻值最大</span>
                  <span>阻值最小</span>
                </div>
              </div>
            </div>

            {/* Record data button */}
            {switchClosed && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRecordData}
                  disabled={hasRecordedCurrentData}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    hasRecordedCurrentData
                      ? 'bg-gray-100 text-gray-400 cursor-default'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {hasRecordedCurrentData ? '已记录当前数据 ✓' : '手动记录数据'}
                </button>
                <span className="text-xs text-gray-400">调节变阻器后数据会自动记录</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Data table and controls */}
        <div className="space-y-4">
          {/* Data table */}
          <div className="bg-white rounded-xl border border-amber-100 p-4">
            <h4 className="font-bold text-gray-700 text-sm mb-3">📋 实验数据（R = {fixedResistance}Ω）</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-100">
                  <th className="text-left py-2 text-gray-500 font-medium">序号</th>
                  <th className="text-center py-2 text-amber-600 font-medium">电压 U(V)</th>
                  <th className="text-center py-2 text-blue-600 font-medium">电流 I(mA)</th>
                </tr>
              </thead>
              <tbody>
                {dataRecords.map((rec, idx) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="py-2 text-gray-400">{idx + 1}</td>
                    <td className="py-2 text-center font-mono font-bold text-amber-600">{rec.voltage}</td>
                    <td className="py-2 text-center font-mono font-bold text-blue-600">{rec.current}</td>
                  </tr>
                ))}
                {dataRecords.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-gray-300 text-xs">闭合开关后开始记录数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Current readings */}
          {switchClosed && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">电压表示数</span>
                <span className="font-mono font-bold text-amber-600">{voltageAcrossR.toFixed(2)} V</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">电流表示数</span>
                <span className="font-mono font-bold text-green-600">{(current * 1000).toFixed(1)} mA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">已记录数据</span>
                <span className={`font-bold ${dataRecords.length >= 3 ? 'text-green-600' : 'text-gray-600'}`}>{dataRecords.length} / 3</span>
              </div>
            </div>
          )}

          {/* Complete button */}
          <div className="relative group">
            <button
              onClick={() => setShowConclusion(true)}
              disabled={!canComplete}
              className={`w-full py-3 rounded-xl font-bold text-base transition-all ${
                canComplete
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              完成实验
            </button>
            {!canComplete && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                调节滑动变阻器，至少得到3组实验数据才能完成实验哦~
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conclusion */}
      {showConclusion && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 p-6 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <h4 className="font-bold text-green-800 text-lg mb-2">实验结论</h4>
          <p className="text-green-700 text-base">发现了吗？<strong>电阻恒定时，电流与电压成正比</strong></p>
          <p className="text-sm text-green-600 mt-2">I = U / R，当 R 不变时，I 与 U 成正比关系</p>
        </div>
      )}
    </div>
  );
}

// Experiment 2: Fixed Voltage, vary resistance
function OhmExperiment2() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);

  // Available resistors
  const resistors = [5, 10, 15, 20, 25];
  const [resistorIdx, setResistorIdx] = useState(0);
  const currentResistance = resistors[resistorIdx];

  const [switchClosed, setSwitchClosed] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);
  const [dataRecords, setDataRecords] = useState<Array<{ resistance: number; current: number }>>([]);
  const [showConclusion, setShowConclusion] = useState(false);
  const [needAdjustVoltage, setNeedAdjustVoltage] = useState(false);
  const [voltageMatched, setVoltageMatched] = useState(false);
  const [targetVoltage, setTargetVoltage] = useState<number | null>(null);

  // EMF = 6V
  const emf = 6;
  // Slider resistance: 0-50Ω
  const sliderResistance = 50 * (1 - sliderPosition / 100);
  const totalResistance = currentResistance + sliderResistance;
  const current = switchClosed ? emf / totalResistance : 0;
  const voltageAcrossR = switchClosed ? current * currentResistance : 0;

  const canComplete = dataRecords.length >= 3;

  // Check if voltage matches target
  useEffect(() => {
    if (!switchClosed || targetVoltage === null) {
      setVoltageMatched(false);
      return;
    }
    const diff = Math.abs(voltageAcrossR - targetVoltage);
    setVoltageMatched(diff < 0.08);
  }, [voltageAcrossR, targetVoltage, switchClosed]);

  // Keep state in ref for canvas
  const stateRef = useRef({ switchClosed: false, current: 0, sliderPosition: 0, voltageAcrossR: 0, currentResistance: 5 });
  useEffect(() => {
    stateRef.current = { switchClosed, current, sliderPosition, voltageAcrossR, currentResistance };
  });

  // Canvas drawing
  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const st = stateRef.current;
      timeRef.current += 0.016;

      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#eff6ff';
      ctx.fillRect(0, 0, w, h);

      const left = 80;
      const right = w - 80;
      const top = 80;
      const bottom = h - 80;
      const midX = w / 2;
      const midY = h / 2;

      const wireColor = st.switchClosed ? '#64748b' : '#94a3b8';
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Top wire
      const switchX = left + (right - left) * 0.3;
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(switchX - 25, top);
      ctx.stroke();

      // Switch
      if (st.switchClosed) {
        ctx.beginPath();
        ctx.moveTo(switchX - 25, top);
        ctx.lineTo(switchX + 25, top);
        ctx.stroke();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(switchX - 25, top, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(switchX + 25, top, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(switchX - 25, top);
        ctx.lineTo(switchX + 15, top - 25);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(switchX - 25, top, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(switchX + 25, top, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('S', switchX, top - 30);

      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(switchX + 25, top);
      ctx.lineTo(right, top);
      ctx.stroke();

      // Right wire
      ctx.beginPath();
      ctx.moveTo(right, top);
      ctx.lineTo(right, bottom);
      ctx.stroke();

      // Bottom wire
      ctx.beginPath();
      ctx.moveTo(right, bottom);
      ctx.lineTo(left, bottom);
      ctx.stroke();

      // Left wire
      ctx.beginPath();
      ctx.moveTo(left, bottom);
      ctx.lineTo(left, top);
      ctx.stroke();

      // Battery on left side
      const batY = midY;
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(left - 15, batY - 12);
      ctx.lineTo(left + 15, batY - 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(left - 8, batY + 12);
      ctx.lineTo(left + 8, batY + 12);
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', left - 25, batY - 8);
      ctx.fillStyle = '#2563eb';
      ctx.fillText('−', left - 25, batY + 16);
      ctx.fillStyle = '#92400e';
      ctx.font = '12px sans-serif';
      ctx.fillText(`${emf}V`, left, batY + 35);

      // Fixed resistor on right side (replaceable)
      const resY = midY - 30;
      const resX = right;
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(resX, resY - 30);
      for (let i = 0; i < 6; i++) {
        const y = resY - 30 + (i + 0.5) * 60 / 6;
        const xOff = (i % 2 === 0) ? 12 : -12;
        ctx.lineTo(resX + xOff, y);
      }
      ctx.lineTo(resX, resY + 30);
      ctx.stroke();
      // Resistor label with background
      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(resX + 16, resY - 10, 65, 20);
      ctx.strokeStyle = '#fca5a5';
      ctx.strokeRect(resX + 16, resY - 10, 65, 20);
      ctx.fillStyle = '#991b1b';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`R=${st.currentResistance}Ω`, resX + 22, resY + 4);

      // Slider rheostat on top wire
      const sliderX = midX + 40;
      const sliderW = 100;
      const sliderH = 16;
      ctx.fillStyle = '#e0e7ff';
      ctx.strokeStyle = '#4338ca';
      ctx.lineWidth = 2;
      ctx.fillRect(sliderX - sliderW / 2, top - sliderH / 2 - 5, sliderW, sliderH);
      ctx.strokeRect(sliderX - sliderW / 2, top - sliderH / 2 - 5, sliderW, sliderH);
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        const cx2 = sliderX - sliderW / 2 + 8 + i * (sliderW - 16) / 7;
        ctx.beginPath();
        ctx.arc(cx2, top - 5, 5, Math.PI, 0);
        ctx.stroke();
      }
      const arrowX = sliderX - sliderW / 2 + (st.sliderPosition / 100) * sliderW;
      ctx.fillStyle = '#4338ca';
      ctx.beginPath();
      ctx.moveTo(arrowX, top - 25);
      ctx.lineTo(arrowX - 8, top - 15);
      ctx.lineTo(arrowX + 8, top - 15);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(arrowX, top - 15);
      ctx.lineTo(arrowX, top - 5);
      ctx.stroke();
      ctx.fillStyle = '#4338ca';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('滑动变阻器', sliderX, top - 30);

      // Voltmeter
      const voltmeterX = right + 40;
      const voltmeterY = midY - 30;
      ctx.fillStyle = '#dbeafe';
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(voltmeterX, voltmeterY, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('V', voltmeterX, voltmeterY + 5);
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${st.voltageAcrossR.toFixed(2)}V`, voltmeterX, voltmeterY + 38);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(voltmeterX - 24, voltmeterY);
      ctx.lineTo(right + 5, top + 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(voltmeterX - 24, voltmeterY);
      ctx.lineTo(right + 5, bottom - 5);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ammeter
      const ammeterY = batY + 60;
      ctx.fillStyle = '#dcfce7';
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(left, ammeterY, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('A', left, ammeterY + 5);
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${(st.current * 1000).toFixed(1)}mA`, left, ammeterY + 38);

      // Electron animation
      if (st.switchClosed && st.current > 0.001) {
        const electronSpeed = st.current * 30;
        const time = timeRef.current * electronSpeed;
        ctx.fillStyle = '#3b82f6';
        const perimeter = 2 * (right - left + bottom - top);
        for (let i = 0; i < 12; i++) {
          const t = ((time + i * perimeter / 12) % perimeter) / perimeter;
          let ex: number, ey: number;
          const topLen = right - left;
          const rightLen = bottom - top;
          const bottomLen = right - left;
          const leftLen = bottom - top;
          const total = topLen + rightLen + bottomLen + leftLen;
          const pos = t * total;
          if (pos < topLen) {
            ex = left + pos;
            ey = top;
          } else if (pos < topLen + rightLen) {
            ex = right;
            ey = top + (pos - topLen);
          } else if (pos < topLen + rightLen + bottomLen) {
            ex = right - (pos - topLen - rightLen);
            ey = bottom;
          } else {
            ex = left;
            ey = bottom - (pos - topLen - rightLen - bottomLen);
          }
          ctx.beginPath();
          ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  const handleCloseSwitch = () => {
    if (!switchClosed) {
      setSwitchClosed(true);
      setTimeout(() => {
        const newSliderR = 50 * (1 - sliderPosition / 100);
        const newTotalR = currentResistance + newSliderR;
        const newCurrent = emf / newTotalR;
        const newVoltage = newCurrent * currentResistance;
        setTargetVoltage(parseFloat(newVoltage.toFixed(2)));
        setDataRecords([{ resistance: currentResistance, current: parseFloat((newCurrent * 1000).toFixed(1)) }]);
      }, 300);
    }
  };

  const handleChangeResistor = () => {
    if (!switchClosed) return;
    const nextIdx = (resistorIdx + 1) % resistors.length;
    setResistorIdx(nextIdx);
    setNeedAdjustVoltage(true);
    setVoltageMatched(false);
  };

  const handleSliderChange = (val: number) => {
    setSliderPosition(val);
  };

  // Auto record when voltage matches
  useEffect(() => {
    if (!switchClosed || !needAdjustVoltage || !voltageMatched || targetVoltage === null) return;
    const newRecord = { resistance: currentResistance, current: parseFloat((current * 1000).toFixed(1)) };
    setDataRecords(prev => {
      const alreadyExists = prev.some(r => r.resistance === newRecord.resistance);
      if (alreadyExists) return prev;
      return [...prev, newRecord];
    });
    setNeedAdjustVoltage(false);
  }, [voltageMatched, needAdjustVoltage, switchClosed, currentResistance, current, targetVoltage]);

  return (
    <div className="space-y-5">
      {/* Experiment title and tips */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
        <h3 className="font-bold text-blue-800 text-lg mb-2">实验二：电压大小固定</h3>
        <p className="text-sm text-blue-700 mb-1">🎯 实验目标：电压恒定，改变电阻阻值，你能发现电流与电阻有什么关系吗？</p>
        <p className="text-xs text-blue-600">💡 操作指引：闭合开关后，更换不同阻值的电阻，调节滑动变阻器使电压相同，至少得到3组实验数据后可完成实验</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5">
        {/* Left: Circuit canvas and controls */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-blue-100 p-3">
            <canvas ref={canvasRef} width={700} height={400} className="w-full rounded-lg" />
          </div>
          <div className="bg-white rounded-xl border border-blue-100 p-4 space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Switch button */}
              <button
                onClick={handleCloseSwitch}
                disabled={switchClosed}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  switchClosed
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md'
                }`}
              >
                {switchClosed ? '开关已闭合 ✓' : '闭合开关 S'}
              </button>

              {/* Change resistor button */}
              <button
                onClick={handleChangeResistor}
                disabled={!switchClosed}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  !switchClosed
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600 shadow-md'
                }`}
              >
                更换电阻（当前 {currentResistance}Ω）
              </button>
            </div>

            {/* Slider rheostat */}
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">
                调节滑动变阻器{needAdjustVoltage ? '（请使电压表示数与上次相同）' : ''}
              </label>
              <input
                type="range" min={0} max={100} step={1}
                value={sliderPosition}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                disabled={!switchClosed}
                className={`w-full accent-indigo-500 ${!switchClosed ? 'opacity-50' : ''}`}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>阻值最大</span>
                <span>阻值最小</span>
              </div>
            </div>

            {/* Voltage match hint */}
            {needAdjustVoltage && switchClosed && (
              <div className={`p-3 rounded-lg text-sm font-medium ${
                voltageMatched
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }`}>
                {voltageMatched
                  ? `✅ 电压已与上次相同（${targetVoltage?.toFixed(2)}V），数据已自动记录！`
                  : `⚠️ 请继续调节滑动变阻器，使电压表示数 = ${targetVoltage?.toFixed(2)}V（当前：${voltageAcrossR.toFixed(2)}V）`
                }
              </div>
            )}
          </div>
        </div>

        {/* Right: Data table and controls */}
        <div className="space-y-4">
          {/* Data table */}
          <div className="bg-white rounded-xl border border-blue-100 p-4">
            <h4 className="font-bold text-gray-700 text-sm mb-3">📋 实验数据（U = {targetVoltage?.toFixed(2) || '—'}V）</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-100">
                  <th className="text-left py-2 text-gray-500 font-medium">序号</th>
                  <th className="text-center py-2 text-red-600 font-medium">电阻 R(Ω)</th>
                  <th className="text-center py-2 text-blue-600 font-medium">电流 I(mA)</th>
                </tr>
              </thead>
              <tbody>
                {dataRecords.map((rec, idx) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="py-2 text-gray-400">{idx + 1}</td>
                    <td className="py-2 text-center font-mono font-bold text-red-600">{rec.resistance}</td>
                    <td className="py-2 text-center font-mono font-bold text-blue-600">{rec.current}</td>
                  </tr>
                ))}
                {dataRecords.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-gray-300 text-xs">闭合开关后开始记录数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Current readings */}
          {switchClosed && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">电压表示数</span>
                <span className="font-mono font-bold text-blue-600">{voltageAcrossR.toFixed(2)} V</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">电流表示数</span>
                <span className="font-mono font-bold text-green-600">{(current * 1000).toFixed(1)} mA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">当前电阻</span>
                <span className="font-mono font-bold text-red-600">{currentResistance} Ω</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">已记录数据</span>
                <span className={`font-bold ${dataRecords.length >= 3 ? 'text-green-600' : 'text-gray-600'}`}>{dataRecords.length} / 3</span>
              </div>
            </div>
          )}

          {/* Complete button */}
          <div className="relative group">
            <button
              onClick={() => setShowConclusion(true)}
              disabled={!canComplete}
              className={`w-full py-3 rounded-xl font-bold text-base transition-all ${
                canComplete
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              完成实验
            </button>
            {!canComplete && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                调节滑动变阻器，至少得到3组实验数据才能完成实验哦~
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conclusion */}
      {showConclusion && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 p-6 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <h4 className="font-bold text-green-800 text-lg mb-2">实验结论</h4>
          <p className="text-green-700 text-base">发现了吗？<strong>电压恒定时，电流与电阻成反比</strong></p>
          <p className="text-sm text-green-600 mt-2">I = U / R，当 U 不变时，I 与 R 成反比关系</p>
        </div>
      )}
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
        {activeTab === 'knowledge' && <KnowledgeStation chapters={ohmChapters} lawName="欧姆定律" lawColor="bg-amber-500" lawKey="ohm" />}
        {activeTab === 'lab' && <OhmLab />}
        {activeTab === 'games' && <OhmGames />}
      </main>
      <AIAssistant />
    </div>
  );
}
