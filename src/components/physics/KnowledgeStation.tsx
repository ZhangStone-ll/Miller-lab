'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChapterContent } from '@/lib/physics-data';

interface KnowledgeStationProps {
  chapters: ChapterContent[];
  lawName: string;
  lawColor: string;
  lawKey: string;
}

// Knowledge cards data for each law
const knowledgeCardsData: Record<string, { background: string; derivation: string; conclusion: string; application: string }> = {
  archimedes: {
    background: '古希腊国王怀疑工匠在纯金王冠中掺银，却无法测量不规则物体的体积。阿基米德在洗澡时观察到水溢出浴缸，灵光一闪发现了排水法测体积的原理，由此揭开了浮力与排开液体重力之间的关系。',
    derivation: '① 设柱体底面积S、高h，浸没在液体中：V排=Sh\n② 下表面受向上压力F上=ρ液gh下S，上表面受向下压力F下=ρ液gh上S\n③ F浮=F上-F下=ρ液gS(h下-h上)=ρ液gSh=ρ液gV排\n④ 此推导对任意形状物体均成立',
    conclusion: '核心公式：F浮=ρ液gV排\n\n关键理解：\n① "浸在"包括完全浸没和部分浸入\n② 浮力只与液体密度和排开体积有关，与物体质量、密度无关\n③ 一斤铁和一斤棉花完全浸没时浮力相同',
    application: '🚢 轮船：空心结构增大V排，使F浮=G船而漂浮\n🤖 潜水艇：调节水舱改变自重，控制浮沉\n🎈 氢气球：排开空气的重力>自重，受空气浮力升空\n🧊 密度计：利用漂浮时F浮=G，V排反比于ρ液',
  },
  ohm: {
    background: '电路中的灯泡为什么有的亮有的暗？电流大小由什么决定？德国物理学家欧姆通过大量实验，探索电流、电压、电阻三者之间的定量关系，最终发现了电学最基本的定律。',
    derivation: '① 控制变量法：保持电阻不变，改变电压→电流与电压成正比\n② 保持电压不变，改变电阻→电流与电阻成反比\n③ 综合两组实验：I∝U，I∝1/R\n④ 得出结论：I=U/R',
    conclusion: '核心公式：I=U/R\n\n关键理解：\n① I、U、R必须对应同一段电路、同一时刻\n② 电阻是导体本身的性质，不随U、I变化\n③ 不能说"R与U成正比"，R由材料、长度、截面积决定',
    application: '🔌 家用电路：根据I=P/U选导线和保险丝\n📱 手机充电器：5V/2A输出体现U与I关系\n💡 LED灯：串联限流电阻防止过流烧毁\n🏠 用电安全：根据欧姆定律设计漏电保护',
  },
  hooke: {
    background: '弹簧为什么能拉长又能恢复？蹦床为什么能弹飞人？17世纪英国科学家罗伯特·胡克通过大量弹簧实验，发现了弹力与形变量之间的正比关系，这就是胡克定律。',
    derivation: '① 在弹簧下挂不同数量钩码，记录弹力F和伸长量x\n② 绘制F-x图像，发现过原点的直线\n③ 直线斜率k为劲度系数，反映弹簧"软硬"\n④ 得出：F=kx（在弹性限度内）',
    conclusion: '核心公式：F=kx\n\n关键理解：\n① "弹性限度内"是前提，超限则永久形变\n② k为劲度系数，单位N/m，由弹簧本身决定\n③ k越大弹簧越硬，越难拉伸\n④ x是形变量（伸长量或压缩量），不是弹簧原长',
    application: '⚖️ 弹簧秤：直接利用F=kx测力\n🚗 汽车减震器：弹簧缓冲路面颠簸\n🎯 弹弓/弓箭：弹性势能转化为动能\n🛏️ 弹簧床垫：利用弹性提供舒适支撑',
  },
};

// Animated scene renderer for each chapter type
function AnimationScene({ type, isPlaying }: { type: string; isPlaying: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; });

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
      if (isPlayingRef.current) timeRef.current += 1;
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
  }, [type]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={420}
      className="w-full rounded-xl bg-white border border-blue-100"
    />
  );
}

export default function KnowledgeStation({ chapters, lawName, lawColor, lawKey }: KnowledgeStationProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mergedChapters, setMergedChapters] = useState<ChapterContent[]>(chapters);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUriRef = useRef<string | null>(null);
  const pageAutoNextRef = useRef(false);
  const isPlayingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load editor data from localStorage and merge
  useEffect(() => {
    const stored = localStorage.getItem('physics-editor-data');
    if (stored) {
      try {
        const editData = JSON.parse(stored);
        const edited = editData[lawKey];
        if (edited && Array.isArray(edited)) {
          const merged = chapters.map((ch, i) => {
            if (edited[i]) {
              return {
                ...ch,
                text: edited[i].text ?? ch.text,
                speech: edited[i].speech ?? ch.speech,
              };
            }
            return ch;
          });
          setMergedChapters(merged);
        }
      } catch {
        // ignore parse errors, use defaults
      }
    }
  }, [chapters, lawKey]);

  const chapter = mergedChapters[currentPage];

  // Stop and cleanup audio
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('timeupdate', () => {});
      audioRef.current.removeEventListener('ended', () => {});
      audioRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  // Fetch TTS audio from backend API and play
  const fetchAndPlayTTS = useCallback((text: string, onEnd?: () => void) => {
    stopAudio();
    setIsLoading(true);

    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error('TTS error:', data.error);
          setIsLoading(false);
          setIsPlaying(false);
          onEnd?.();
          return;
        }

        const audioUri = data.audioUri as string;
        audioUriRef.current = audioUri;

        const audio = new Audio(audioUri);
        audioRef.current = audio;
        isPlayingRef.current = true;

        audio.addEventListener('timeupdate', () => {
          if (audio.duration && isFinite(audio.duration)) {
            const pct = (audio.currentTime / audio.duration) * 100;
            setProgress(pct);
          }
        });

        audio.addEventListener('ended', () => {
          isPlayingRef.current = false;
          onEnd?.();
        });

        audio.addEventListener('error', () => {
          console.error('Audio playback error');
          isPlayingRef.current = false;
          setIsPlaying(false);
          setIsLoading(false);
          onEnd?.();
        });

        audio.play().catch(err => {
          console.error('Audio play failed:', err);
          isPlayingRef.current = false;
          setIsPlaying(false);
          setIsLoading(false);
          onEnd?.();
        });

        setIsLoading(false);
      })
      .catch(err => {
        console.error('TTS fetch failed:', err);
        setIsLoading(false);
        setIsPlaying(false);
        onEnd?.();
      });
  }, [stopAudio]);

  const handlePlay = useCallback(() => {
    if (audioRef.current && audioUriRef.current && !isPlayingRef.current) {
      // Resume existing audio
      isPlayingRef.current = true;
      audioRef.current.play().catch(() => {
        // If resume fails, re-fetch
        fetchAndPlayTTS(chapter.speech, () => {
          if (currentPage < mergedChapters.length - 1) {
            pageAutoNextRef.current = true;
            setCurrentPage(prev => prev + 1);
          } else {
            setIsPlaying(false);
            setProgress(100);
          }
        });
      });
      setIsPlaying(true);
      return;
    }

    setIsPlaying(true);
    fetchAndPlayTTS(chapter.speech, () => {
      if (currentPage < mergedChapters.length - 1) {
        pageAutoNextRef.current = true;
        setCurrentPage(prev => prev + 1);
      } else {
        setIsPlaying(false);
        setProgress(100);
      }
    });
  }, [chapter.speech, currentPage, mergedChapters.length, fetchAndPlayTTS]);

  const handlePause = useCallback(() => {
    if (audioRef.current && isPlayingRef.current) {
      audioRef.current.pause();
      isPlayingRef.current = false;
    }
    setIsPlaying(false);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (isLoading) return;
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  }, [isPlaying, isLoading, handlePlay, handlePause]);

  const goToPage = useCallback((page: number) => {
    stopAudio();
    audioUriRef.current = null;
    setIsPlaying(false);
    setProgress(0);
    setCurrentPage(page);
  }, [stopAudio]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < mergedChapters.length - 1) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, mergedChapters.length, goToPage]);

  // Auto-play next page after speech ends on current page
  useEffect(() => {
    if (pageAutoNextRef.current) {
      pageAutoNextRef.current = false;
      const timer = setTimeout(() => {
        handlePlay();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentPage, handlePlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  // Get knowledge cards for this law
  const cards = knowledgeCardsData[lawKey];

  return (
    <div className="space-y-6">
      {/* Main content: single page with video and text */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
        {/* Video animation */}
        <div className="relative">
          <AnimationScene type={chapter.videoType} isPlaying={isPlaying} />
        </div>

        {/* Progress bar - full width */}
        <div className="px-5 py-2">
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
              className={`h-full rounded-full transition-all duration-100 ${lawColor}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Text content - no chapter number/title, just the text */}
        <div className="px-6 pb-5">
          <p className="text-gray-700 text-base leading-relaxed">{chapter.text}</p>
        </div>

        {/* Page dots */}
        <div className="flex items-center justify-center gap-2 pb-4">
          {mergedChapters.map((_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentPage
                  ? `${lawColor} scale-125`
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Bottom controls: Prev | Play/Pause | Next */}
        <div className="flex items-center justify-between px-6 pb-5">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="px-5 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            上一页
          </button>

          <button
            onClick={handlePlayPause}
            disabled={isLoading}
            className={`w-12 h-12 rounded-full text-white flex items-center justify-center transition-colors shadow-lg ${lawColor} ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {isLoading ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="animate-spin">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4" strokeDashoffset="10" />
              </svg>
            ) : isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>

          <button
            onClick={handleNextPage}
            disabled={currentPage === mergedChapters.length - 1}
            className={`px-5 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 ${lawColor}`}
          >
            下一页
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Knowledge Cards */}
      {cards && (
        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">知识要点卡片</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Background */}
            <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${lawColor} text-white flex items-center justify-center text-xs`}>
                  📜
                </div>
                <h4 className="font-bold text-gray-800 text-sm">定律背景</h4>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">{cards.background}</p>
            </div>

            {/* Card 2: Derivation */}
            <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${lawColor} text-white flex items-center justify-center text-xs`}>
                  🔬
                </div>
                <h4 className="font-bold text-gray-800 text-sm">推导过程</h4>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-line">{cards.derivation}</p>
            </div>

            {/* Card 3: Conclusion */}
            <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${lawColor} text-white flex items-center justify-center text-xs`}>
                  💡
                </div>
                <h4 className="font-bold text-gray-800 text-sm">定律结论</h4>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-line">{cards.conclusion}</p>
            </div>

            {/* Card 4: Application */}
            <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${lawColor} text-white flex items-center justify-center text-xs`}>
                  🌍
                </div>
                <h4 className="font-bold text-gray-800 text-sm">生活应用</h4>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-line">{cards.application}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
