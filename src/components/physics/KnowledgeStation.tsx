'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChapterContent } from '@/lib/physics-data';

interface KnowledgeStationProps {
  chapters: ChapterContent[];
  lawName: string;
  lawColor: string;
}

// Animated scene renderer for each chapter type
function AnimationScene({ type, isPlaying, progress }: { type: string; isPlaying: boolean; progress: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);

  const drawIntro = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    // Background - bathroom scene
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(0, 0, w, h);

    // Bathtub
    const tubY = h * 0.55;
    ctx.fillStyle = '#f0f9ff';
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, tubY);
    ctx.quadraticCurveTo(w * 0.15, h * 0.85, w * 0.25, h * 0.85);
    ctx.lineTo(w * 0.75, h * 0.85);
    ctx.quadraticCurveTo(w * 0.85, h * 0.85, w * 0.85, tubY);
    ctx.stroke();
    ctx.fill();

    // Water in tub
    const waterLevel = Math.min(0.3 + t * 0.01, 0.65);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.beginPath();
    ctx.moveTo(w * 0.17, tubY + 10);
    ctx.quadraticCurveTo(w * 0.17, h * (0.55 + waterLevel * 0.3), w * 0.25, h * (0.55 + waterLevel * 0.3));
    ctx.lineTo(w * 0.75, h * (0.55 + waterLevel * 0.3));
    ctx.quadraticCurveTo(w * 0.83, h * (0.55 + waterLevel * 0.3), w * 0.83, tubY + 10);
    ctx.fill();

    // Overflow water drops
    if (t > 30) {
      for (let i = 0; i < 3; i++) {
        const dropX = w * (0.3 + i * 0.15);
        const dropY = tubY - ((t * 2 + i * 20) % 60);
        const alpha = Math.max(0, 1 - ((t * 2 + i * 20) % 60) / 60);
        ctx.fillStyle = `rgba(59, 130, 246, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.ellipse(dropX, dropY, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Crown
    const crownX = w * 0.5 + Math.sin(t * 0.05) * 10;
    const crownY = h * 0.25 + Math.sin(t * 0.03) * 5;
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(crownX - 25, crownY + 15);
    ctx.lineTo(crownX - 25, crownY - 5);
    ctx.lineTo(crownX - 15, crownY + 5);
    ctx.lineTo(crownX, crownY - 15);
    ctx.lineTo(crownX + 15, crownY + 5);
    ctx.lineTo(crownX + 25, crownY - 5);
    ctx.lineTo(crownX + 25, crownY + 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // "Eureka!" text
    if (t > 50) {
      const textAlpha = Math.min(1, (t - 50) / 20);
      ctx.fillStyle = `rgba(37, 99, 235, ${textAlpha})`;
      ctx.font = `bold ${Math.min(24, w * 0.05)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Eureka!', w * 0.5, h * 0.15);
    }

    // Character - simple stick figure
    const personX = w * 0.5;
    const personY = h * 0.42;
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 3;
    // Head
    ctx.beginPath();
    ctx.arc(personX, personY - 20, 10, 0, Math.PI * 2);
    ctx.stroke();
    // Body
    ctx.beginPath();
    ctx.moveTo(personX, personY - 10);
    ctx.lineTo(personX, personY + 15);
    ctx.stroke();
    // Arms (raised when eureka)
    if (t > 40) {
      ctx.beginPath();
      ctx.moveTo(personX - 15, personY - 15);
      ctx.lineTo(personX, personY);
      ctx.lineTo(personX + 15, personY - 15);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(personX - 12, personY + 5);
      ctx.lineTo(personX, personY);
      ctx.lineTo(personX + 12, personY + 5);
      ctx.stroke();
    }
  }, []);

  const drawDerivation = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    ctx.fillStyle = '#fefce8';
    ctx.fillRect(0, 0, w, h);

    // Water container
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.fillRect(w * 0.3, h * 0.3, w * 0.4, h * 0.5);
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2;
    ctx.strokeRect(w * 0.3, h * 0.3, w * 0.4, h * 0.5);

    // Cylinder
    const cylinderDepth = Math.min(t / 60, 1);
    const cylX = w * 0.5;
    const cylTop = h * (0.3 + (1 - cylinderDepth) * 0.4);
    const cylBot = h * 0.75;
    const cylW = w * 0.12;

    ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.fillRect(cylX - cylW, cylTop, cylW * 2, cylBot - cylTop);
    ctx.strokeRect(cylX - cylW, cylTop, cylW * 2, cylBot - cylTop);

    // Force arrows
    if (t > 30) {
      const arrowAlpha = Math.min(1, (t - 30) / 20);
      // Upward force
      ctx.strokeStyle = `rgba(34, 197, 94, ${arrowAlpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cylX, cylBot);
      ctx.lineTo(cylX, cylBot + 40);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cylX - 8, cylBot + 32);
      ctx.lineTo(cylX, cylBot + 40);
      ctx.lineTo(cylX + 8, cylBot + 32);
      ctx.stroke();

      ctx.fillStyle = `rgba(34, 197, 94, ${arrowAlpha})`;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('F上', cylX, cylBot + 55);

      // Downward force
      ctx.strokeStyle = `rgba(239, 68, 68, ${arrowAlpha})`;
      ctx.beginPath();
      ctx.moveTo(cylX, cylTop);
      ctx.lineTo(cylX, cylTop - 40);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cylX - 8, cylTop - 32);
      ctx.lineTo(cylX, cylTop - 40);
      ctx.lineTo(cylX + 8, cylTop - 32);
      ctx.stroke();

      ctx.fillStyle = `rgba(239, 68, 68, ${arrowAlpha})`;
      ctx.fillText('F下', cylX, cylTop - 45);
    }

    // Formula display
    if (t > 50) {
      const fAlpha = Math.min(1, (t - 50) / 20);
      ctx.fillStyle = `rgba(30, 64, 175, ${fAlpha})`;
      ctx.font = `bold ${Math.min(18, w * 0.04)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('F浮 = F上 - F下 = ρ液gV排', w * 0.5, h * 0.18);
    }

    // Dimension labels
    if (t > 15) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('S', cylX + cylW + 5, (cylTop + cylBot) / 2);
      ctx.fillText('h', cylX - cylW - 15, (cylTop + cylBot) / 2);
    }
  }, []);

  const drawConclusion = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    ctx.fillStyle = '#f0fdf4';
    ctx.fillRect(0, 0, w, h);

    // Main formula - large and centered
    const scale = Math.min(1, t / 30);
    ctx.fillStyle = `rgba(30, 64, 175, ${scale})`;
    ctx.font = `bold ${Math.min(32, w * 0.06) * scale}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('F浮 = ρ液gV排', w * 0.5, h * 0.2);

    // Three example objects
    const objects = [
      { emoji: '🧊', label: '铁块', x: w * 0.2, color: '#6b7280' },
      { emoji: '🪵', label: '木块', x: w * 0.5, color: '#92400e' },
      { emoji: '🎈', label: '气球', x: w * 0.8, color: '#dc2626' },
    ];

    if (t > 20) {
      // Water surface
      ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.fillRect(0, h * 0.5, w, h * 0.5);

      objects.forEach((obj, i) => {
        const objTime = t - 20 - i * 10;
        if (objTime > 0) {
          const alpha = Math.min(1, objTime / 15);
          const y = h * 0.35 + i * 15;

          // Object
          ctx.font = `${Math.min(36, w * 0.08)}px sans-serif`;
          ctx.globalAlpha = alpha;
          ctx.fillText(obj.emoji, obj.x, y);
          ctx.globalAlpha = 1;

          // Buoyancy arrow
          const arrowLen = i === 2 ? 50 : i === 1 ? 35 : 25;
          ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(obj.x, y + 5);
          ctx.lineTo(obj.x, y + 5 + arrowLen);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(obj.x - 5, y + arrowLen);
          ctx.lineTo(obj.x, y + 5 + arrowLen);
          ctx.lineTo(obj.x + 5, y + arrowLen);
          ctx.stroke();

          // Label
          ctx.fillStyle = `rgba(107, 114, 128, ${alpha})`;
          ctx.font = '12px sans-serif';
          ctx.fillText(obj.label, obj.x, h * 0.9);
        }
      });
    }

    // Key points
    if (t > 60) {
      const keyAlpha = Math.min(1, (t - 60) / 20);
      ctx.fillStyle = `rgba(30, 64, 175, ${keyAlpha})`;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('① "浸在" = 完全浸没 + 部分浸入', w * 0.05, h * 0.95 - 20);
      ctx.fillText('② 浮力只与 ρ液 和 V排 有关', w * 0.05, h * 0.95);
    }
  }, []);

  const drawApplication = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    // Sky and sea
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#bfdbfe');
    grad.addColorStop(0.4, '#93c5fd');
    grad.addColorStop(0.45, '#60a5fa');
    grad.addColorStop(1, '#1e40af');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Waves
    ctx.fillStyle = 'rgba(96, 165, 250, 0.3)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, h * (0.45 + i * 0.05));
      for (let x = 0; x <= w; x += 10) {
        ctx.lineTo(x, h * (0.45 + i * 0.05) + Math.sin(x * 0.02 + t * 0.05 + i) * 5);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();
    }

    // Ship
    if (t > 10) {
      const shipAlpha = Math.min(1, (t - 10) / 20);
      ctx.globalAlpha = shipAlpha;
      const shipX = w * 0.3 + Math.sin(t * 0.03) * 5;
      const shipY = h * 0.42 + Math.sin(t * 0.04) * 3;

      // Hull
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(shipX - 40, shipY);
      ctx.quadraticCurveTo(shipX - 45, shipY + 20, shipX - 30, shipY + 25);
      ctx.lineTo(shipX + 30, shipY + 25);
      ctx.quadraticCurveTo(shipX + 45, shipY + 20, shipX + 40, shipY);
      ctx.closePath();
      ctx.fill();

      // Cabin
      ctx.fillStyle = '#f5f5f4';
      ctx.fillRect(shipX - 15, shipY - 20, 30, 20);
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(shipX - 10, shipY - 16, 8, 8);
      ctx.fillRect(shipX + 2, shipY - 16, 8, 8);

      // Funnel
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(shipX - 4, shipY - 30, 8, 12);

      // Displaced water arrows
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shipX, shipY + 30);
      ctx.lineTo(shipX, shipY + 50);
      ctx.stroke();
      ctx.fillStyle = 'rgba(34, 197, 94, 0.7)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('F浮↑', shipX, shipY + 62);
      ctx.globalAlpha = 1;
    }

    // Submarine
    if (t > 40) {
      const subAlpha = Math.min(1, (t - 40) / 20);
      ctx.globalAlpha = subAlpha;
      const subY = h * 0.6 + Math.sin(t * 0.04) * 3;
      const subX = w * 0.65 + Math.sin(t * 0.03) * 5;

      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.ellipse(subX, subY, 30, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.fillRect(subX - 5, subY - 18, 10, 8);

      // Ballast tanks
      ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
      const tankFill = Math.min(1, (t - 40) / 60);
      ctx.fillRect(subX - 20, subY - 4, 12, 8 * tankFill);
      ctx.fillRect(subX + 8, subY - 4, 12, 8 * tankFill);

      ctx.globalAlpha = 1;
    }

    // Labels
    if (t > 20) {
      ctx.fillStyle = 'white';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚢 轮船 - 空心增大V排', w * 0.3, h * 0.35);
    }
    if (t > 50) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText('🤖 潜水艇 - 改变自重', w * 0.65, h * 0.52);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const draw = () => {
      if (isPlaying) timeRef.current += 1;
      ctx.clearRect(0, 0, w, h);

      switch (type) {
        case 'intro': drawIntro(ctx, w, h, timeRef.current); break;
        case 'derivation': drawDerivation(ctx, w, h, timeRef.current); break;
        case 'conclusion': drawConclusion(ctx, w, h, timeRef.current); break;
        case 'application': drawApplication(ctx, w, h, timeRef.current); break;
        default: drawIntro(ctx, w, h, timeRef.current);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [type, isPlaying, drawIntro, drawDerivation, drawConclusion, drawApplication]);

  return (
    <canvas
      ref={canvasRef}
      width={560}
      height={320}
      className="w-full rounded-xl bg-white border border-blue-100"
    />
  );
}

export default function KnowledgeStation({ chapters, lawName, lawColor }: KnowledgeStationProps) {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const chapter = chapters[currentChapter];

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const startSpeaking = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }, [stopSpeaking]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      stopSpeaking();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    } else {
      setIsPlaying(true);
      startSpeaking(chapter.speech);
      setProgress(0);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            setIsPlaying(false);
            return 100;
          }
          return prev + 0.5;
        });
      }, 50);
    }
  }, [isPlaying, chapter.speech, startSpeaking, stopSpeaking]);

  const handleChapterChange = useCallback((index: number) => {
    setIsPlaying(false);
    stopSpeaking();
    setProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setCurrentChapter(index);
  }, [stopSpeaking]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [stopSpeaking]);

  const chapterIcons = ['🎬', '📐', '💡', '🌍'];

  return (
    <div className="space-y-6">
      {/* Chapter Navigation */}
      <div className="flex gap-2 flex-wrap">
        {chapters.map((ch, i) => (
          <button
            key={i}
            onClick={() => handleChapterChange(i)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              i === currentChapter
                ? `${lawColor} text-white shadow-md`
                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
            }`}
          >
            <span>{chapterIcons[i]}</span>
            <span>{ch.title}</span>
          </button>
        ))}
      </div>

      {/* Animation Player */}
      <div className="relative rounded-xl overflow-hidden bg-white border border-blue-100 shadow-sm">
        <AnimationScene type={chapter.videoType} isPlaying={isPlaying} progress={progress} />

        {/* Player Controls */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-t border-blue-50">
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-gray-200 rounded-full mb-3 cursor-pointer">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayPause}
                className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors shadow-md"
              >
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => startSpeaking(chapter.speech)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isSpeaking ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isSpeaking ? '🔊 播报中...' : '🔊 语音播报'}
              </button>
            </div>

            <span className="text-xs text-gray-400">
              第 {currentChapter + 1}/{chapters.length} 章
            </span>
          </div>
        </div>
      </div>

      {/* Text Content Card */}
      <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg ${lawColor} text-white flex items-center justify-center text-sm shrink-0`}>
            {chapterIcons[currentChapter]}
          </div>
          <div>
            <h4 className="font-bold text-gray-800 mb-2">{chapter.title}</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{chapter.text}</p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => handleChapterChange(Math.max(0, currentChapter - 1))}
          disabled={currentChapter === 0}
          className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← 上一章
        </button>
        <button
          onClick={() => handleChapterChange(Math.min(chapters.length - 1, currentChapter + 1))}
          disabled={currentChapter === chapters.length - 1}
          className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          下一章 →
        </button>
      </div>
    </div>
  );
}
