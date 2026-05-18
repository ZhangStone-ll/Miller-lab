'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import AIAssistant from '@/components/physics/AIAssistant';

const laws = [
  {
    id: 'archimedes',
    title: '阿基米德定律',
    subtitle: '浮力的秘密',
    icon: '🚢',
    description: '探索浮力的奥秘，理解物体为什么能漂浮在水面上！',
    formula: 'F浮 = ρ液gV排',
    color: 'from-blue-400 to-cyan-400',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverShadow: 'hover:shadow-blue-200/50',
  },
  {
    id: 'ohm',
    title: '欧姆定律',
    subtitle: '电流的规律',
    icon: '⚡',
    description: '揭开电压、电流和电阻之间的神秘关系！',
    formula: 'I = U/R',
    color: 'from-amber-400 to-yellow-400',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    hoverShadow: 'hover:shadow-amber-200/50',
  },
  {
    id: 'hooke',
    title: '胡克定律',
    subtitle: '弹力的世界',
    icon: '🔧',
    description: '发现弹簧的弹力与形变之间的线性关系！',
    formula: 'F = kx',
    color: 'from-emerald-400 to-green-400',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    hoverShadow: 'hover:shadow-emerald-200/50',
  },
];

const floatingBubbles = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  size: 10 + Math.random() * 30,
  left: Math.random() * 100,
  delay: Math.random() * 5,
  duration: 8 + Math.random() * 6,
}));

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {mounted && floatingBubbles.map((bubble) => (
          <div
            key={bubble.id}
            className="absolute rounded-full bg-blue-200/20"
            style={{
              width: bubble.size,
              height: bubble.size,
              left: `${bubble.left}%`,
              bottom: '-5%',
              animation: `bubble-up ${bubble.duration}s ease-in infinite`,
              animationDelay: `${bubble.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-blue-100/50 bg-white/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
              🔬
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">趣味物理实验室</h1>
              <p className="text-xs text-gray-500">让物理变得有趣</p>
            </div>
          </div>
          <Link
            href="/editor"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            教学内容编辑
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
        <div className="animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            互动学习 · 虚拟实验 · 趣味游戏
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-4 leading-tight">
            探索物理世界的
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500"> 奇妙法则</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            通过虚拟实验亲手操作，动画讲解深入理解，互动游戏快乐学习<br />
            让每一个物理定律都变得生动有趣！
          </p>
        </div>
      </section>

      {/* Law Cards */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {laws.map((law, index) => (
            <Link
              key={law.id}
              href={`/${law.id}`}
              className={`group relative rounded-2xl border ${law.borderColor} ${law.bgColor} p-6 transition-all duration-300 hover:scale-[1.02] ${law.hoverShadow} hover:shadow-lg animate-slide-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${law.color} flex items-center justify-center text-3xl mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                {law.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-800 mb-1">{law.title}</h3>
              <p className="text-sm text-gray-500 mb-3">{law.subtitle}</p>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{law.description}</p>

              {/* Formula */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 border border-gray-100 text-sm font-mono text-gray-700">
                {law.formula}
              </div>

              {/* Arrow */}
              <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Fun Facts */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">你知道这些有趣的物理冷知识吗？</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-2xl mb-2">🌊</p>
              <p className="text-sm leading-relaxed">一艘大轮船虽然重达几万吨，但只要排开的水够多，就能稳稳地浮在水面上——这就是阿基米德定律的威力！</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-2xl mb-2">💡</p>
              <p className="text-sm leading-relaxed">闪电的电压高达数亿伏特，但持续不到1秒。如果按照欧姆定律计算，瞬间电流可达数十万安培！</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-2xl mb-2">🎯</p>
              <p className="text-sm leading-relaxed">你每走一步路，鞋底的弹性形变就在默默遵循胡克定律。弹簧、橡皮筋、甚至你的头发都是胡克定律的实践者！</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-blue-100/50 bg-white/60 backdrop-blur-sm py-6 text-center text-sm text-gray-400">
        <p>趣味物理实验室 · 让每个学生都爱上物理</p>
      </footer>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
}
