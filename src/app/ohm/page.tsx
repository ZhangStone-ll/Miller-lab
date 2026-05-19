'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import AIAssistant from '@/components/physics/AIAssistant';
import KnowledgeStation from '@/components/physics/KnowledgeStation';
import ElectronRunner from '@/components/physics/ElectronRunner';
import VoltageTowerDefense from '@/components/physics/VoltageTowerDefense';
import { ohmChapters } from '@/lib/physics-data';

const tabs = [
  { id: 'knowledge', name: '知识加油站', icon: '📚' },
  { id: 'lab', name: '虚拟实验室', icon: '🔬' },
  { id: 'games', name: '闯关游戏', icon: '🎮' },
];

// Ohm's Law Virtual Lab - Two Experiments
function OhmLab() {
  const [activeExperiment, setActiveExperiment] = useState<number>(1);

  return (
    <div className="space-y-4">
      {activeExperiment === 1 && <OhmExperiment1 onSwitchExperiment={() => setActiveExperiment(2)} />}
      {activeExperiment === 2 && <OhmExperiment2 onSwitchExperiment={() => setActiveExperiment(1)} />}
    </div>
  );
}

// Experiment 1: Fixed Resistance, vary voltage
function OhmExperiment1({ onSwitchExperiment }: { onSwitchExperiment: () => void }) {
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

  // Canvas click handler - switch toggle & slider click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Layout constants (must match draw)
    const left = 90;
    const right = 610;
    const topC = 55;
    const bottom = 310;
    const midX = (left + right) / 2;

    // Check switch click (top line, between battery+ and right corner)
    const switchX = left + 80;
    if (Math.abs(x - switchX) < 40 && Math.abs(y - topC) < 30) {
      handleToggleSwitch();
      return;
    }

    // Check slider rheostat click (bottom horizontal, right side)
    const sliderLeft = midX + 20;
    const sliderRight = right - 20;
    const sliderW = sliderRight - sliderLeft;
    const sliderY = bottom;
    if (switchClosed && y >= sliderY - 30 && y <= sliderY + 25 && x >= sliderLeft - 10 && x <= sliderRight + 10) {
      const relX = x - sliderLeft;
      const newPos = Math.max(0, Math.min(100, (relX / sliderW) * 100));
      handleSliderChange(newPos);
    }
  };

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

      // Circuit layout matching the reference image:
      // Power source at TOP center, Switch S on top-left wire
      // Ammeter on LEFT side (series), Fixed resistor on BOTTOM-LEFT (horizontal)
      // Slider rheostat on BOTTOM-RIGHT (horizontal), Voltmeter parallel across fixed resistor (vertical, drawn standing)
      // Current: Battery+ → right → Switch S → down-right → Slider → left → Resistor → left → Ammeter → up → Battery-

      const left = 90;
      const right = 610;
      const topC = 55;
      const bottom = 310;
      const midX = (left + right) / 2;
      const midY = (topC + bottom) / 2;

      const wireColor = st.switchClosed ? '#475569' : '#94a3b8';
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // ======== TOP WIRE: Battery at top center ========
      const batX = midX;
      // Battery: long line (+) on left, short line (-) on right
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 3;
      // Positive (long line)
      ctx.beginPath();
      ctx.moveTo(batX - 6, topC - 14);
      ctx.lineTo(batX - 6, topC + 14);
      ctx.stroke();
      // Negative (short line)
      ctx.beginPath();
      ctx.moveTo(batX + 6, topC - 8);
      ctx.lineTo(batX + 6, topC + 8);
      ctx.stroke();
      // + / - labels
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', batX - 20, topC - 10);
      ctx.fillStyle = '#2563eb';
      ctx.fillText('−', batX + 20, topC - 10);
      // Wire: Battery- (right) → right corner
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(batX + 6, topC);
      ctx.lineTo(right, topC);
      ctx.stroke();
      // Wire: Battery+ (left) → left to switch
      ctx.beginPath();
      ctx.moveTo(batX - 6, topC);
      ctx.lineTo(left, topC);
      ctx.stroke();

      // ======== SWITCH S on top-left wire ========
      const switchX = left + 80;
      // Clickable highlight area
      ctx.fillStyle = st.switchClosed ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)';
      ctx.fillRect(switchX - 30, topC - 22, 60, 44);
      if (st.switchClosed) {
        // Closed: horizontal line connecting two dots
        ctx.strokeStyle = wireColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(switchX - 22, topC);
        ctx.lineTo(switchX + 22, topC);
        ctx.stroke();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(switchX - 22, topC, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(switchX + 22, topC, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Open: line tilting up from left dot
        ctx.strokeStyle = wireColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(switchX - 22, topC);
        ctx.lineTo(switchX + 14, topC - 22);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(switchX - 22, topC, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(switchX + 22, topC, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('S', switchX, topC - 26);
      ctx.font = '9px sans-serif';
      ctx.fillText('点击切换', switchX, topC + 36);

      // ======== RIGHT WIRE: top-right down to bottom-right ========
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(right, topC);
      ctx.lineTo(right, bottom);
      ctx.stroke();

      // ======== SLIDER RHEOSTAT on bottom-right (horizontal) ========
      const sliderLeft = midX + 20;
      const sliderRight = right - 20;
      const sliderW = sliderRight - sliderLeft;
      const sliderY = bottom;
      // Highlight area
      ctx.fillStyle = 'rgba(67,56,202,0.04)';
      ctx.fillRect(sliderLeft - 10, sliderY - 28, sliderW + 20, 50);
      // Rheostat body (zigzag horizontal)
      ctx.strokeStyle = '#4338ca';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sliderLeft, sliderY);
      for (let i = 0; i < 8; i++) {
        const xp = sliderLeft + (i + 0.5) * sliderW / 8;
        const yOff = (i % 2 === 0) ? -14 : 14;
        ctx.lineTo(xp, sliderY + yOff);
      }
      ctx.lineTo(sliderRight, sliderY);
      ctx.stroke();
      // Slider position triangle
      const arrowX = sliderLeft + (st.sliderPosition / 100) * sliderW;
      ctx.fillStyle = '#4338ca';
      ctx.beginPath();
      ctx.moveTo(arrowX, sliderY - 22);
      ctx.lineTo(arrowX - 7, sliderY - 32);
      ctx.lineTo(arrowX + 7, sliderY - 32);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(arrowX, sliderY - 22);
      ctx.lineTo(arrowX, sliderY - 16);
      ctx.stroke();
      // Slider label
      ctx.fillStyle = '#4338ca';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('滑动变阻器', (sliderLeft + sliderRight) / 2, sliderY + 30);
      ctx.font = '10px sans-serif';
      ctx.fillText('点击调节', (sliderLeft + sliderRight) / 2, sliderY + 43);

      // Wire: slider left end → to fixed resistor right end
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sliderLeft, sliderY);
      ctx.lineTo(sliderLeft - 10, sliderY);
      ctx.stroke();

      // ======== FIXED RESISTOR on bottom-left (horizontal) ========
      const resLeft = left + 30;
      const resRight = sliderLeft - 10;
      const resW = resRight - resLeft;
      const resX = (resLeft + resRight) / 2;
      // Resistor box
      ctx.fillStyle = '#fef2f2';
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.fillRect(resLeft, bottom - 12, resW, 24);
      ctx.strokeRect(resLeft, bottom - 12, resW, 24);
      // Resistor label
      ctx.fillStyle = '#991b1b';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`定值电阻 R=${fixedResistance}Ω`, resX, bottom - 20);

      // Wire: left bottom → to resistor left
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(left, bottom);
      ctx.lineTo(resLeft, bottom);
      ctx.stroke();

      // ======== LEFT WIRE: bottom-left up to top-left ========
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(left, bottom);
      ctx.lineTo(left, topC);
      ctx.stroke();

      // ======== AMMETER on left side (vertical, in series) ========
      const ammeterY = midY;
      ctx.fillStyle = '#dcfce7';
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(left, ammeterY, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('A', left, ammeterY + 6);
      // Ammeter label (to the right of the circle)
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#6b7280';
      ctx.fillText('电流表', left + 30, ammeterY - 8);
      // Ammeter reading (to the right of the circle, outside)
      if (st.switchClosed) {
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#dc2626';
        ctx.fillText(`${(st.current * 1000).toFixed(1)}A`, left + 30, ammeterY + 10);
      } else {
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText('0.0A', left + 30, ammeterY + 10);
      }

      // ======== VOLTMETER parallel across fixed resistor (vertical, standing) ========
      const vmCenterX = resX;
      const vmCenterY = bottom + 65;
      // Dashed wires from resistor endpoints down to voltmeter
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1.5;
      // Left branch: resistor left end → down → voltmeter left
      ctx.beginPath();
      ctx.moveTo(resLeft, bottom + 12);
      ctx.lineTo(resLeft, vmCenterY);
      ctx.lineTo(vmCenterX - 24, vmCenterY);
      ctx.stroke();
      // Right branch: resistor right end → down → voltmeter right
      ctx.beginPath();
      ctx.moveTo(resRight, bottom + 12);
      ctx.lineTo(resRight, vmCenterY);
      ctx.lineTo(vmCenterX + 24, vmCenterY);
      ctx.stroke();
      ctx.setLineDash([]);
      // Voltmeter circle (standing - vertical orientation means standard circle with V)
      ctx.fillStyle = '#dbeafe';
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(vmCenterX, vmCenterY, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('V', vmCenterX, vmCenterY + 5);
      // Voltmeter label
      ctx.font = '11px sans-serif';
      ctx.fillText('电压表', vmCenterX, vmCenterY + 38);

      // ======== READINGS ========


      // Voltmeter reading - to the right of "电压表" label
      const vReading = st.switchClosed ? st.voltageAcrossR.toFixed(2) : '0.00';
      const vText = `${vReading} V`;
      ctx.font = 'bold 13px monospace';
      const vTW = ctx.measureText(vText).width;
      ctx.fillStyle = 'rgba(37,99,235,0.12)';
      const vBoxX = vmCenterX + 30;
      const vBoxY = vmCenterY + 28;
      ctx.fillRect(vBoxX, vBoxY, vTW + 12, 20);
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(vBoxX, vBoxY, vTW + 12, 20);
      ctx.fillStyle = '#1e40af';
      ctx.textAlign = 'left';
      ctx.fillText(vText, vBoxX + 6, vmCenterY + 42);

      // ======== ELECTRON ANIMATION when switch is closed ========
      if (st.switchClosed && st.current > 0.001) {
        const electronSpeed = st.current * 80;
        const time = timeRef.current * electronSpeed;
        ctx.fillStyle = '#3b82f6';
        // Path following the circuit: Battery- → right → down → slider → left → resistor → left → ammeter → up → Battery+
        const points = [
          { x: batX + 6, y: topC },
          { x: right, y: topC },
          { x: right, y: bottom },
          { x: sliderRight, y: bottom },
          { x: sliderLeft, y: bottom },
          { x: resRight, y: bottom },
          { x: resLeft, y: bottom },
          { x: left, y: bottom },
          { x: left, y: topC },
          { x: batX - 6, y: topC },
        ];
        let perimeter = 0;
        for (let i = 0; i < points.length; i++) {
          const next = points[(i + 1) % points.length];
          perimeter += Math.sqrt((next.x - points[i].x) ** 2 + (next.y - points[i].y) ** 2);
        }
        for (let i = 0; i < 14; i++) {
          const t = ((time + i * perimeter / 14) % perimeter) / perimeter;
          let dist = t * perimeter;
          let ex = points[0].x, ey = points[0].y;
          for (let j = 0; j < points.length; j++) {
            const next = points[(j + 1) % points.length];
            const segLen = Math.sqrt((next.x - points[j].x) ** 2 + (next.y - points[j].y) ** 2);
            if (dist <= segLen) {
              const ratio = segLen > 0 ? dist / segLen : 0;
              ex = points[j].x + (next.x - points[j].x) * ratio;
              ey = points[j].y + (next.y - points[j].y) * ratio;
              break;
            }
            dist -= segLen;
          }
          ctx.beginPath();
          ctx.arc(ex, ey, 3, 0, Math.PI * 2);
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

  const handleToggleSwitch = () => {
    const newClosed = !switchClosed;
    setSwitchClosed(newClosed);
    if (newClosed && dataRecords.length === 0) {
      setTimeout(() => {
        setDataRecords(prev => {
          const v = parseFloat((emf * fixedResistance / (fixedResistance + 50 * (1 - sliderPosition / 100))).toFixed(2));
          const i = parseFloat((emf / (fixedResistance + 50 * (1 - sliderPosition / 100)) * 1000).toFixed(1));
          if (prev.length === 0) return [...prev, { voltage: v, current: i }];
          return prev;
        });
      }, 300);
    }
  };

  const handleSliderChange = (val: number) => {
    setSliderPosition(val);
    if (switchClosed) {
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
    <div className="space-y-3">
      {/* Conclusion Modal */}
      {showConclusion && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 bg-black/30" onClick={() => setShowConclusion(false)}>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-300 p-6 text-center shadow-2xl max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="text-3xl mb-2">🎉</div>
            <h4 className="font-bold text-green-800 text-lg mb-2">实验结论</h4>
            <p className="text-green-700 text-base">发现了吗？<strong>电阻恒定时，电流与电压成正比</strong></p>
            <p className="text-sm text-green-600 mt-2">I = U / R，当 R 不变时，I 与 U 成正比关系</p>
            <button onClick={() => setShowConclusion(false)} className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">我知道了</button>
          </div>
        </div>
      )}

      {/* Title bar with quick switch */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-amber-800 text-base">实验一：电阻大小固定</h3>
          <p className="text-xs text-amber-600 mt-0.5">🎯 电阻恒定，调节电压，发现电流与电压的关系 | 💡 点击电路图中开关和滑动变阻器操作</p>
        </div>
        <button onClick={onSwitchExperiment} className="shrink-0 px-4 py-2 rounded-xl text-xs font-medium bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 shadow-sm transition-all">
          实验二：电压大小固定 →
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-3">
        {/* Left: Circuit canvas only */}
        <div className="bg-white rounded-xl border border-amber-100 p-2">
          <canvas ref={canvasRef} width={700} height={440} className="w-full rounded-lg cursor-pointer" onClick={handleCanvasClick} />
        </div>

        {/* Right: Data table and controls */}
        <div className="space-y-3">
          {/* Data table */}
          <div className="bg-white rounded-xl border border-amber-100 p-3">
            <h4 className="font-bold text-gray-700 text-sm mb-2">📋 实验数据（R = {fixedResistance}Ω）</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-100">
                  <th className="text-left py-1.5 text-gray-500 font-medium">序号</th>
                  <th className="text-center py-1.5 text-amber-600 font-medium">电压 U(V)</th>
                  <th className="text-center py-1.5 text-blue-600 font-medium">电流 I(mA)</th>
                </tr>
              </thead>
              <tbody>
                {dataRecords.map((rec, idx) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="py-1.5 text-gray-400">{idx + 1}</td>
                    <td className="py-1.5 text-center font-mono font-bold text-amber-600">{rec.voltage}</td>
                    <td className="py-1.5 text-center font-mono font-bold text-blue-600">{rec.current}</td>
                  </tr>
                ))}
                {dataRecords.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-3 text-center text-gray-300 text-xs">闭合开关后开始记录数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Current readings */}
          {switchClosed && (
            <div className="bg-gradient-to-br from-blue-50 to-amber-50 rounded-xl border-2 border-blue-200 p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">电压表</span>
                <span className="font-mono font-black text-xl text-blue-600">{voltageAcrossR.toFixed(2)} <span className="text-sm">V</span></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">电流表</span>
                <span className="font-mono font-black text-xl text-green-600">{(current * 1000).toFixed(1)} <span className="text-sm">mA</span></span>
              </div>
            </div>
          )}

          {/* Complete button */}
          <div className="relative group">
            <button
              onClick={() => setShowConclusion(true)}
              disabled={!canComplete}
              className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                canComplete
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              完成实验
            </button>
            {!canComplete && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                至少3组实验数据才能完成
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
function OhmExperiment2({ onSwitchExperiment }: { onSwitchExperiment: () => void }) {
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

  // Canvas drawing - matches reference image layout
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

      // Layout matching reference image:
      // Power source at top, current flows right then down
      const left = 100;
      const right = w - 100;
      const top = 55;
      const bottom = h - 90;
      const midX = w / 2;

      const wireColor = st.switchClosed ? '#64748b' : '#94a3b8';
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // === Power source at top center ===
      const batX = midX;
      const batY = top;
      // Long line (positive)
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(batX - 15, batY - 8);
      ctx.lineTo(batX + 15, batY - 8);
      ctx.stroke();
      // Short line (negative)
      ctx.beginPath();
      ctx.moveTo(batX - 8, batY + 8);
      ctx.lineTo(batX + 8, batY + 8);
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', batX + 25, batY - 4);
      ctx.fillStyle = '#2563eb';
      ctx.fillText('−', batX + 25, batY + 12);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText('电源', batX, batY + 26);

      // === Top wire from battery right to switch ===
      const switchX = batX + 90;
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(batX + 15, batY);
      ctx.lineTo(switchX - 20, batY);
      ctx.stroke();

      // === Switch S ===
      if (st.switchClosed) {
        ctx.strokeStyle = wireColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(switchX - 20, batY);
        ctx.lineTo(switchX + 20, batY);
        ctx.stroke();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(switchX - 20, batY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(switchX + 20, batY, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = wireColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(switchX - 20, batY);
        ctx.lineTo(switchX + 12, batY - 22);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(switchX - 20, batY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(switchX + 20, batY, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('S', switchX, batY - 28);

      // === Top wire from switch to top-right corner ===
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(switchX + 20, batY);
      ctx.lineTo(right, batY);
      ctx.stroke();

      // === Right wire down to slider rheostat ===
      const sliderY = bottom - 40;
      ctx.beginPath();
      ctx.moveTo(right, batY);
      ctx.lineTo(right, sliderY - 20);
      ctx.stroke();

      // === Slider rheostat on bottom right ===
      const sliderLeft = midX + 30;
      const sliderRight = right;
      const sliderW = sliderRight - sliderLeft;
      ctx.fillStyle = '#e0e7ff';
      ctx.strokeStyle = '#4338ca';
      ctx.lineWidth = 2;
      ctx.fillRect(sliderLeft, sliderY - 10, sliderW, 20);
      ctx.strokeRect(sliderLeft, sliderY - 10, sliderW, 20);
      // Zigzag coils
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 10; i++) {
        const cx2 = sliderLeft + 8 + i * (sliderW - 16) / 9;
        ctx.beginPath();
        ctx.arc(cx2, sliderY, 6, Math.PI, 0);
        ctx.stroke();
      }
      // Slider arrow
      const arrowX = sliderLeft + (st.sliderPosition / 100) * sliderW;
      ctx.fillStyle = '#4338ca';
      ctx.beginPath();
      ctx.moveTo(arrowX, sliderY - 28);
      ctx.lineTo(arrowX - 7, sliderY - 18);
      ctx.lineTo(arrowX + 7, sliderY - 18);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(arrowX, sliderY - 18);
      ctx.lineTo(arrowX, sliderY - 10);
      ctx.stroke();
      ctx.fillStyle = '#4338ca';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('滑动变阻器', (sliderLeft + sliderRight) / 2, sliderY - 32);

      // === Wire from slider left to resistor right ===
      const resRightX = midX - 20;
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sliderLeft, sliderY);
      ctx.lineTo(resRightX + 40, sliderY);
      ctx.stroke();

      // === Fixed resistor on bottom center-left ===
      const resLeftX = left + 30;
      const resCenterX = (resLeftX + resRightX + 40) / 2;
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(resRightX + 40, sliderY);
      for (let i = 0; i < 8; i++) {
        const x0 = resRightX + 40 - i * (resRightX + 40 - resLeftX) / 8;
        const x1 = resRightX + 40 - (i + 0.5) * (resRightX + 40 - resLeftX) / 8;
        const yOff = (i % 2 === 0) ? 10 : -10;
        ctx.lineTo(x1, sliderY + yOff);
      }
      ctx.lineTo(resLeftX, sliderY);
      ctx.stroke();
      // Resistor label
      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(resCenterX - 32, sliderY + 14, 64, 18);
      ctx.strokeStyle = '#fca5a5';
      ctx.strokeRect(resCenterX - 32, sliderY + 14, 64, 18);
      ctx.fillStyle = '#991b1b';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`定值电阻 ${st.currentResistance}Ω`, resCenterX, sliderY + 28);

      // === Ammeter on left side (vertical, same as Experiment 1) ===
      const ammeterX = left + 10;
      const ammeterCY = (batY + sliderY) / 2;
      const ammR = 26;
      // Wire from resistor left down to ammeter top
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(resLeftX, sliderY);
      ctx.lineTo(left + 10, sliderY);
      ctx.lineTo(left + 10, ammeterCY + ammR);
      ctx.stroke();
      // Wire from ammeter bottom up to battery
      ctx.beginPath();
      ctx.moveTo(left + 10, ammeterCY - ammR);
      ctx.lineTo(left + 10, batY);
      ctx.stroke();

      // Ammeter circle
      ctx.fillStyle = '#dcfce7';
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ammeterX, ammeterCY, ammR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('A', ammeterX, ammeterCY + 6);
      // Label (above circle)
      ctx.fillStyle = '#4b5563';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('电流表', ammeterX - 16, ammeterCY - ammR - 6);
      // Reading (to the right of circle, outside)
      const e2AText = st.switchClosed ? `${(st.current * 1000).toFixed(1)}mA` : '0.0mA';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'left';
      const e2ATW = ctx.measureText(e2AText).width;
      ctx.fillStyle = '#dcfce7';
      ctx.fillRect(ammeterX + ammR + 4, ammeterCY - 10, e2ATW + 10, 20);
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ammeterX + ammR + 4, ammeterCY - 10, e2ATW + 10, 20);
      ctx.fillStyle = '#15803d';
      ctx.fillText(e2AText, ammeterX + ammR + 9, ammeterCY + 5);

      // === Top wire from left to battery positive ===
      ctx.beginPath();
      ctx.moveTo(ammeterX, batY);
      ctx.lineTo(batX - 15, batY);
      ctx.stroke();

      // === Voltmeter below resistor (parallel) ===
      const voltmeterX = resCenterX;
      const voltmeterY = sliderY + 75;
      ctx.fillStyle = '#dbeafe';
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(voltmeterX, voltmeterY, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('V', voltmeterX, voltmeterY + 6);
      // Label
      ctx.fillStyle = '#4b5563';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('电压表', voltmeterX - 22, voltmeterY + 38);
      // Highlighted reading - to the right of "电压表" label
      const vmLabelWidth = ctx.measureText('电压表').width;
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(voltmeterX - 22 + vmLabelWidth + 4, voltmeterY + 26, 70, 18);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(voltmeterX - 22 + vmLabelWidth + 4, voltmeterY + 26, 70, 18);
      ctx.fillStyle = '#92400e';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${st.voltageAcrossR.toFixed(2)}V`, voltmeterX - 22 + vmLabelWidth + 39, voltmeterY + 39);
      ctx.textAlign = 'left';
      // Dashed wires from voltmeter to resistor ends
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(voltmeterX - 22, voltmeterY);
      ctx.lineTo(resLeftX, sliderY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(voltmeterX + 22, voltmeterY);
      ctx.lineTo(resRightX + 40, sliderY);
      ctx.stroke();
      ctx.setLineDash([]);

      // === Electron animation ===
      if (st.switchClosed && st.current > 0.001) {
        const electronSpeed = st.current * 0.012;
        const time = timeRef.current * electronSpeed;
        ctx.fillStyle = '#3b82f6';
        // Main circuit path: battery+ → right → down → slider → resistor → ammeter → up → battery-
        const pts = [
          { x: batX + 15, y: batY },
          { x: right, y: batY },
          { x: right, y: sliderY },
          { x: sliderLeft, y: sliderY },
          { x: resRightX + 40, y: sliderY },
          { x: resLeftX, y: sliderY },
          { x: ammeterX, y: sliderY },
          { x: ammeterX, y: batY },
          { x: batX - 15, y: batY },
        ];
        let totalLen = 0;
        const segs: Array<{ len: number; x0: number; y0: number; x1: number; y1: number }> = [];
        for (let i = 0; i < pts.length - 1; i++) {
          const dx = pts[i + 1].x - pts[i].x;
          const dy = pts[i + 1].y - pts[i].y;
          const len = Math.sqrt(dx * dx + dy * dy);
          segs.push({ len, x0: pts[i].x, y0: pts[i].y, x1: pts[i + 1].x, y1: pts[i + 1].y });
          totalLen += len;
        }
        for (let i = 0; i < 10; i++) {
          const t = ((time + i * totalLen / 10) % totalLen) / totalLen;
          let dist = t * totalLen;
          for (const seg of segs) {
            if (dist <= seg.len) {
              const frac = dist / seg.len;
              const ex = seg.x0 + (seg.x1 - seg.x0) * frac;
              const ey = seg.y0 + (seg.y1 - seg.y0) * frac;
              ctx.beginPath();
              ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
              ctx.fill();
              break;
            }
            dist -= seg.len;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  const handleToggleSwitch = () => {
    const newClosed = !switchClosed;
    setSwitchClosed(newClosed);
    if (newClosed && dataRecords.length === 0) {
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

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const w = canvas.width;
    const midX = w / 2;
    const top = 55;

    // Check switch click
    const switchX = midX + 90;
    if (Math.abs(x - switchX) < 35 && Math.abs(y - top) < 35) {
      handleToggleSwitch();
      return;
    }

    // Check slider rheostat click
    if (!switchClosed) return;
    const sliderLeft = midX + 30;
    const sliderRight = w - 100;
    const sliderW = sliderRight - sliderLeft;
    const sliderY = canvas.height - 90 - 40;
    if (y >= sliderY - 35 && y <= sliderY + 20 && x >= sliderLeft - 10 && x <= sliderRight + 10) {
      const relX = x - sliderLeft;
      const newPos = Math.max(0, Math.min(100, (relX / sliderW) * 100));
      setSliderPosition(newPos);
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
    <div className="h-full flex flex-col">
      {/* Header with experiment switch */}
      <div className="flex items-center justify-between mb-2">
        <div className="bg-amber-50 rounded-lg border border-amber-200 px-3 py-1.5">
          <h3 className="font-bold text-amber-800 text-sm">实验二：电压大小固定</h3>
        </div>
        <button onClick={onSwitchExperiment} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all">
          实验一：电阻大小固定 →
        </button>
      </div>

      <div className="flex-1 grid lg:grid-cols-[1fr_280px] gap-3 min-h-0">
        {/* Left: Circuit canvas */}
        <div className="bg-white rounded-xl border border-blue-100 p-2 flex flex-col">
          <canvas ref={canvasRef} width={700} height={440} className="w-full flex-1 rounded-lg cursor-pointer" onClick={handleCanvasClick} />
        </div>

        {/* Right: Data table + controls */}
        <div className="space-y-2 flex flex-col">
          {/* Voltage match hint */}
          {needAdjustVoltage && switchClosed && (
            <div className={`p-2 rounded-lg text-xs font-medium ${
              voltageMatched
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            }`}>
              {voltageMatched
                ? `✅ 电压已相同（${targetVoltage?.toFixed(2)}V），数据已记录！`
                : `⚠️ 请调节变阻器，使电压 = ${targetVoltage?.toFixed(2)}V（当前：${voltageAcrossR.toFixed(2)}V）`
              }
            </div>
          )}

          {/* Data table */}
          <div className="bg-white rounded-xl border border-blue-100 p-3 flex-1">
            <h4 className="font-bold text-gray-700 text-xs mb-2">📋 实验数据（U = {targetVoltage?.toFixed(2) || '—'}V）</h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-blue-100">
                  <th className="text-left py-1 text-gray-500 font-medium">序号</th>
                  <th className="text-center py-1 text-red-600 font-medium">R(Ω)</th>
                  <th className="text-center py-1 text-blue-600 font-medium">I(mA)</th>
                </tr>
              </thead>
              <tbody>
                {dataRecords.map((rec, idx) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="py-1 text-gray-400">{idx + 1}</td>
                    <td className="py-1 text-center font-mono font-bold text-red-600">{rec.resistance}</td>
                    <td className="py-1 text-center font-mono font-bold text-blue-600">{rec.current}</td>
                  </tr>
                ))}
                {dataRecords.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-2 text-center text-gray-300 text-xs">闭合开关后开始记录</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Complete button */}
          <div className="relative group">
            <button
              onClick={() => setShowConclusion(true)}
              disabled={!canComplete}
              className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                canComplete
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              完成实验
            </button>
            {!canComplete && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                至少3组数据才能完成实验
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conclusion Modal */}
      {showConclusion && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowConclusion(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="text-4xl mb-3">🎉</div>
            <h4 className="font-bold text-green-800 text-xl mb-3">实验结论</h4>
            <p className="text-green-700 text-lg font-medium">发现了吗？<strong>电压恒定时，电流与电阻成反比</strong></p>
            <p className="text-sm text-gray-500 mt-3">I = U / R，当 U 不变时，I 与 R 成反比关系</p>
            <button onClick={() => setShowConclusion(false)} className="mt-5 px-6 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all">知道了</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Ohm's Law Games - 电子跑酷 + 电压塔防
function OhmGames() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const games = [
    { id: 'runner', name: '电子跑酷', icon: '⚡', desc: '电压攀登者：欧姆定律大冒险', color: 'from-amber-400 to-yellow-300' },
    { id: 'tower', name: '电压塔防', icon: '🏗️', desc: '放置电击塔，策略分配电压', color: 'from-cyan-500 to-blue-400' },
  ];

  if (!activeGame) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500 text-center">选择一个互动游戏</p>
        <div className="grid md:grid-cols-2 gap-4">
          {games.map((game) => (
            <button key={game.id} onClick={() => setActiveGame(game.id)}
              className="bg-white rounded-xl border-2 border-amber-100 p-5 text-center hover:border-amber-300 hover:shadow-md transition-all group">
              <div className={`text-4xl mb-3 w-16 h-16 mx-auto rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                {game.icon}
              </div>
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
      <button onClick={() => setActiveGame(null)} className="text-sm text-gray-500 hover:text-amber-600 transition-colors">
        ← 返回游戏选择
      </button>
      {activeGame === 'runner' && <ElectronRunner />}
      {activeGame === 'tower' && <VoltageTowerDefense />}
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
