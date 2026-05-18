import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '趣味物理实验室 - 中学物理互动学习平台',
  description: '通过虚拟实验、动画讲解和互动游戏，让中学物理变得生动有趣！涵盖阿基米德定律、欧姆定律、胡克定律等核心知识。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
