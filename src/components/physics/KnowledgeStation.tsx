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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const drawIntro = (c: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
      c.fillStyle = '#e0f2fe';
      c.fillRect(0, 0, cw, ch);

      const tubY = ch * 0.55;
      c.fillStyle = '#f0f9ff';
      c.strokeStyle = '#93c5fd';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(cw * 0.15, tubY);
      c.quadraticCurveTo(cw * 0.15, ch * 0.85, cw * 0.25, ch * 0.85);
      c.lineTo(cw * 0.75, ch * 0.85);
      c.quadraticCurveTo(cw * 0.85, ch * 0.85, cw * 0.85, tubY);
      c.stroke();
      c.fill();

      const waterLevel = Math.min(0.3 + t * 0.01, 0.65);
      c.fillStyle = 'rgba(59, 130, 246, 0.3)';
      c.beginPath();
      c.moveTo(cw * 0.17, tubY + 10);
      c.quadraticCurveTo(cw * 0.17, ch * (0.55 + waterLevel * 0.3), cw * 0.25, ch * (0.55 + waterLevel * 0.3));
      c.lineTo(cw * 0.75, ch * (0.55 + waterLevel * 0.3));
      c.quadraticCurveTo(cw * 0.83, ch * (0.55 + waterLevel * 0.3), cw * 0.83, tubY + 10);
      c.fill();

      if (t > 30) {
        for (let i = 0; i < 3; i++) {
          const dropX = cw * (0.3 + i * 0.15);
          const dropY = tubY - ((t * 2 + i * 20) % 60);
          const alpha = Math.max(0, 1 - ((t * 2 + i * 20) % 60) / 60);
          c.fillStyle = `rgba(59, 130, 246, ${alpha * 0.6})`;
          c.beginPath();
          c.ellipse(dropX, dropY, 4, 6, 0, 0, Math.PI * 2);
          c.fill();
        }
      }

      const crownX = cw * 0.5 + Math.sin(t * 0.05) * 10;
      const crownY = ch * 0.25 + Math.sin(t * 0.03) * 5;
      c.fillStyle = '#fbbf24';
      c.strokeStyle = '#d97706';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(crownX - 25, crownY + 15);
      c.lineTo(crownX - 25, crownY - 5);
      c.lineTo(crownX - 15, crownY + 5);
      c.lineTo(crownX, crownY - 15);
      c.lineTo(crownX + 15, crownY + 5);
      c.lineTo(crownX + 25, crownY - 5);
      c.lineTo(crownX + 25, crownY + 15);
      c.closePath();
      c.fill();
      c.stroke();

      if (t > 50) {
        const textAlpha = Math.min(1, (t - 50) / 20);
        c.fillStyle = `rgba(37, 99, 235, ${textAlpha})`;
        c.font = `bold ${Math.min(24, cw * 0.05)}px sans-serif`;
        c.textAlign = 'center';
        c.fillText('Eureka!', cw * 0.5, ch * 0.15);
      }

      const personX = cw * 0.5;
      const personY = ch * 0.42;
      c.strokeStyle = '#1e40af';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(personX, personY - 20, 10, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.moveTo(personX, personY - 10);
      c.lineTo(personX, personY + 15);
      c.stroke();
      if (t > 40) {
        c.beginPath();
        c.moveTo(personX - 15, personY - 15);
        c.lineTo(personX, personY);
        c.lineTo(personX + 15, personY - 15);
        c.stroke();
      } else {
        c.beginPath();
        c.moveTo(personX - 12, personY + 5);
        c.lineTo(personX, personY);
        c.lineTo(personX + 12, personY + 5);
        c.stroke();
      }
    };

    const drawDerivation = (c: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
      c.fillStyle = '#fefce8';
      c.fillRect(0, 0, cw, ch);

      c.fillStyle = 'rgba(59, 130, 246, 0.2)';
      c.fillRect(cw * 0.3, ch * 0.3, cw * 0.4, ch * 0.5);
      c.strokeStyle = '#93c5fd';
      c.lineWidth = 2;
      c.strokeRect(cw * 0.3, ch * 0.3, cw * 0.4, ch * 0.5);

      const cylinderDepth = Math.min(t / 60, 1);
      const cylX = cw * 0.5;
      const cylTop = ch * (0.3 + (1 - cylinderDepth) * 0.4);
      const cylBot = ch * 0.75;
      const cylW = cw * 0.12;

      c.fillStyle = 'rgba(251, 191, 36, 0.4)';
      c.strokeStyle = '#d97706';
      c.lineWidth = 2;
      c.fillRect(cylX - cylW, cylTop, cylW * 2, cylBot - cylTop);
      c.strokeRect(cylX - cylW, cylTop, cylW * 2, cylBot - cylTop);

      if (t > 30) {
        const arrowAlpha = Math.min(1, (t - 30) / 20);
        c.strokeStyle = `rgba(34, 197, 94, ${arrowAlpha})`;
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(cylX, cylBot);
        c.lineTo(cylX, cylBot + 40);
        c.stroke();
        c.beginPath();
        c.moveTo(cylX - 8, cylBot + 32);
        c.lineTo(cylX, cylBot + 40);
        c.lineTo(cylX + 8, cylBot + 32);
        c.stroke();

        c.fillStyle = `rgba(34, 197, 94, ${arrowAlpha})`;
        c.font = '14px sans-serif';
        c.textAlign = 'center';
        c.fillText('F上', cylX, cylBot + 55);

        c.strokeStyle = `rgba(239, 68, 68, ${arrowAlpha})`;
        c.beginPath();
        c.moveTo(cylX, cylTop);
        c.lineTo(cylX, cylTop - 40);
        c.stroke();
        c.beginPath();
        c.moveTo(cylX - 8, cylTop - 32);
        c.lineTo(cylX, cylTop - 40);
        c.lineTo(cylX + 8, cylTop - 32);
        c.stroke();

        c.fillStyle = `rgba(239, 68, 68, ${arrowAlpha})`;
        c.fillText('F下', cylX, cylTop - 45);
      }

      if (t > 50) {
        const fAlpha = Math.min(1, (t - 50) / 20);
        c.fillStyle = `rgba(30, 64, 175, ${fAlpha})`;
        c.font = `bold ${Math.min(18, cw * 0.04)}px monospace`;
        c.textAlign = 'center';
        c.fillText('F浮 = F上 - F下 = ρ液gV排', cw * 0.5, ch * 0.18);
      }

      if (t > 15) {
        c.fillStyle = '#6b7280';
        c.font = '12px sans-serif';
        c.textAlign = 'left';
        c.fillText('S', cylX + cylW + 5, (cylTop + cylBot) / 2);
        c.fillText('h', cylX - cylW - 15, (cylTop + cylBot) / 2);
      }
    };

    const drawConclusion = (c: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
      c.fillStyle = '#f0fdf4';
      c.fillRect(0, 0, cw, ch);

      const scale = Math.min(1, t / 30);
      c.fillStyle = `rgba(30, 64, 175, ${scale})`;
      c.font = `bold ${Math.min(32, cw * 0.06) * scale}px monospace`;
      c.textAlign = 'center';
      c.fillText('F浮 = ρ液gV排', cw * 0.5, ch * 0.2);

      const objects = [
        { emoji: '🧊', label: '铁块', x: cw * 0.2 },
        { emoji: '🪵', label: '木块', x: cw * 0.5 },
        { emoji: '🎈', label: '气球', x: cw * 0.8 },
      ];

      if (t > 20) {
        c.fillStyle = 'rgba(59, 130, 246, 0.15)';
        c.fillRect(0, ch * 0.5, cw, ch * 0.5);

        objects.forEach((obj, i) => {
          const objTime = t - 20 - i * 10;
          if (objTime > 0) {
            const alpha = Math.min(1, objTime / 15);
            const y = ch * 0.35 + i * 15;

            c.font = `${Math.min(36, cw * 0.08)}px sans-serif`;
            c.globalAlpha = alpha;
            c.fillText(obj.emoji, obj.x, y);
            c.globalAlpha = 1;

            const arrowLen = i === 2 ? 50 : i === 1 ? 35 : 25;
            c.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(obj.x, y + 5);
            c.lineTo(obj.x, y + 5 + arrowLen);
            c.stroke();
            c.beginPath();
            c.moveTo(obj.x - 5, y + arrowLen);
            c.lineTo(obj.x, y + 5 + arrowLen);
            c.lineTo(obj.x + 5, y + arrowLen);
            c.stroke();

            c.fillStyle = `rgba(107, 114, 128, ${alpha})`;
            c.font = '12px sans-serif';
            c.fillText(obj.label, obj.x, ch * 0.9);
          }
        });
      }

      if (t > 60) {
        const keyAlpha = Math.min(1, (t - 60) / 20);
        c.fillStyle = `rgba(30, 64, 175, ${keyAlpha})`;
        c.font = '13px sans-serif';
        c.textAlign = 'left';
        c.fillText('① "浸在" = 完全浸没 + 部分浸入', cw * 0.05, ch * 0.95 - 20);
        c.fillText('② 浮力只与 ρ液 和 V排 有关', cw * 0.05, ch * 0.95);
      }
    };

    const drawApplication = (c: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
      const grad = c.createLinearGradient(0, 0, 0, ch);
      grad.addColorStop(0, '#bfdbfe');
      grad.addColorStop(0.4, '#93c5fd');
      grad.addColorStop(0.45, '#60a5fa');
      grad.addColorStop(1, '#1e40af');
      c.fillStyle = grad;
      c.fillRect(0, 0, cw, ch);

      c.fillStyle = 'rgba(96, 165, 250, 0.3)';
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(0, ch * (0.45 + i * 0.05));
        for (let x = 0; x <= cw; x += 10) {
          c.lineTo(x, ch * (0.45 + i * 0.05) + Math.sin(x * 0.02 + t * 0.05 + i) * 5);
        }
        c.lineTo(cw, ch);
        c.lineTo(0, ch);
        c.fill();
      }

      if (t > 10) {
        const shipAlpha = Math.min(1, (t - 10) / 20);
        c.globalAlpha = shipAlpha;
        const shipX = cw * 0.3 + Math.sin(t * 0.03) * 5;
        const shipY = ch * 0.42 + Math.sin(t * 0.04) * 3;

        c.fillStyle = '#dc2626';
        c.beginPath();
        c.moveTo(shipX - 40, shipY);
        c.quadraticCurveTo(shipX - 45, shipY + 20, shipX - 30, shipY + 25);
        c.lineTo(shipX + 30, shipY + 25);
        c.quadraticCurveTo(shipX + 45, shipY + 20, shipX + 40, shipY);
        c.closePath();
        c.fill();

        c.fillStyle = '#f5f5f4';
        c.fillRect(shipX - 15, shipY - 20, 30, 20);
        c.fillStyle = '#93c5fd';
        c.fillRect(shipX - 10, shipY - 16, 8, 8);
        c.fillRect(shipX + 2, shipY - 16, 8, 8);
        c.fillStyle = '#ef4444';
        c.fillRect(shipX - 4, shipY - 30, 8, 12);

        c.strokeStyle = 'rgba(34, 197, 94, 0.7)';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(shipX, shipY + 30);
        c.lineTo(shipX, shipY + 50);
        c.stroke();
        c.fillStyle = 'rgba(34, 197, 94, 0.7)';
        c.font = '11px sans-serif';
        c.textAlign = 'center';
        c.fillText('F浮↑', shipX, shipY + 62);
        c.globalAlpha = 1;
      }

      if (t > 40) {
        const subAlpha = Math.min(1, (t - 40) / 20);
        c.globalAlpha = subAlpha;
        const subY = ch * 0.6 + Math.sin(t * 0.04) * 3;
        const subX = cw * 0.65 + Math.sin(t * 0.03) * 5;

        c.fillStyle = '#64748b';
        c.beginPath();
        c.ellipse(subX, subY, 30, 12, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#475569';
        c.fillRect(subX - 5, subY - 18, 10, 8);

        c.fillStyle = 'rgba(59, 130, 246, 0.5)';
        const tankFill = Math.min(1, (t - 40) / 60);
        c.fillRect(subX - 20, subY - 4, 12, 8 * tankFill);
        c.fillRect(subX + 8, subY - 4, 12, 8 * tankFill);

        c.globalAlpha = 1;
      }

      if (t > 20) {
        c.fillStyle = 'white';
        c.font = '12px sans-serif';
        c.textAlign = 'center';
        c.fillText('🚢 轮船 - 空心增大V排', cw * 0.3, ch * 0.35);
      }
      if (t > 50) {
        c.fillStyle = 'rgba(255,255,255,0.9)';
        c.fillText('🤖 潜水艇 - 改变自重', cw * 0.65, ch * 0.52);
      }
    };

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
  }, [type, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={560}
      height={360}
      className="w-full rounded-xl bg-white border border-blue-100"
    />
  );
}

export default function KnowledgeStation({ chapters, lawName, lawColor }: KnowledgeStationProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const synthReadyRef = useRef(false);
  const pageAutoNextRef = useRef(false);

  const chapter = chapters[currentPage];

  // Ensure speechSynthesis is ready
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Chrome bug: voices may not be available until after onvoiceschanged
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        synthReadyRef.current = true;
      }
      window.speechSynthesis.onvoiceschanged = () => {
        synthReadyRef.current = true;
      };
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speakText = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onEnd?.();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    // Try to find a Chinese voice
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.startsWith('zh'));
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = () => {
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const startProgressTimer = useCallback((durationMs: number, onComplete?: () => void) => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setProgress(0);

    const stepMs = 50;
    const increment = (stepMs / durationMs) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          onComplete?.();
          return 100;
        }
        return next;
      });
    }, stepMs);
  }, []);

  // Estimate speech duration based on text length (Chinese ~4 chars/sec at rate 0.9)
  const estimateDuration = useCallback((text: string) => {
    const charCount = text.length;
    const rate = 0.9;
    const charsPerSecond = 4 * rate;
    return (charCount / charsPerSecond) * 1000;
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    const duration = estimateDuration(chapter.speech);

    speakText(chapter.speech, () => {
      // Speech ended, auto-advance to next page if available
      if (currentPage < chapters.length - 1) {
        pageAutoNextRef.current = true;
        setCurrentPage(prev => prev + 1);
      } else {
        setIsPlaying(false);
        setProgress(100);
      }
    });

    startProgressTimer(duration, () => {
      if (currentPage >= chapters.length - 1) {
        setIsPlaying(false);
      }
    });
  }, [chapter.speech, currentPage, chapters.length, speakText, startProgressTimer, estimateDuration]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    stopSpeaking();
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  }, [stopSpeaking]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  }, [isPlaying, handlePlay, handlePause]);

  const goToPage = useCallback((page: number) => {
    handlePause();
    setProgress(0);
    setCurrentPage(page);
  }, [handlePause]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < chapters.length - 1) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, chapters.length, goToPage]);

  // Auto-play next page after speech ends on current page
  useEffect(() => {
    if (pageAutoNextRef.current) {
      pageAutoNextRef.current = false;
      // Short delay before starting next page
      const timer = setTimeout(() => {
        handlePlay();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentPage, handlePlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [stopSpeaking]);

  const chapterLabels = ['第1节', '第2节', '第3节', '第4节'];

  return (
    <div className="space-y-4">
      {/* Page indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-800">{chapter.title}</h3>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${lawColor}`}>
            {chapterLabels[currentPage]}
          </span>
        </div>
        <span className="text-sm text-gray-400">
          {currentPage + 1} / {chapters.length}
        </span>
      </div>

      {/* Main content: Left video + Right text */}
      <div className="flex gap-5">
        {/* Left: Video animation */}
        <div className="flex-1 min-w-0">
          <div className="relative rounded-xl overflow-hidden bg-white border border-blue-100 shadow-sm">
            <AnimationScene type={chapter.videoType} isPlaying={isPlaying} progress={progress} />

            {/* Progress bar synced with speech */}
            <div className="px-4 pb-2 pt-1">
              <div
                className="w-full h-1.5 bg-gray-200 rounded-full cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const pct = (x / rect.width) * 100;
                  setProgress(pct);
                }}
              >
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="px-4 pb-3 flex items-center justify-between">
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
                <span className="text-xs text-gray-400">
                  {isPlaying ? '播报中...' : '点击播放'}
                </span>
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === chapters.length - 1}
                  className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Text content */}
        <div className="w-[280px] shrink-0">
          <div className="bg-white rounded-xl border border-blue-100 p-5 shadow-sm h-full">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-7 h-7 rounded-lg ${lawColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                {currentPage + 1}
              </div>
              <h4 className="font-bold text-gray-800 text-sm">{chapter.title}</h4>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{chapter.text}</p>

            {/* Page dots */}
            <div className="flex items-center justify-center gap-2 mt-5">
              {chapters.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === currentPage
                      ? 'bg-blue-500 scale-125'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
