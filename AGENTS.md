# AGENTS.md

## 项目概览

中学物理实验室互动网页，包含3个物理定律（阿基米德定律、欧姆定律、胡克定律）的虚拟实验、知识讲解和互动游戏，集成AI助教智能体。

## 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **LLM SDK**: coze-coding-dev-sdk (doubao-seed-2-0-mini-260215)
- **TTS SDK**: coze-coding-dev-sdk (zh_male_dayi_saturn_bigtts - 大易男声)

## 目录结构

```
├── public/                          # 静态资源
├── src/
│   ├── app/
│   │   ├── page.tsx                 # 首页（3个定律入口 + slogan）
│   │   ├── layout.tsx               # 全局布局
│   │   ├── globals.css              # 全局样式
│   │   ├── api/chat/route.ts        # AI助教流式对话API (SSE)
│   │   ├── api/tts/route.ts         # TTS语音合成API (coze-coding-dev-sdk)
│   │   ├── archimedes/page.tsx      # 阿基米德定律页面
│   │   ├── ohm/page.tsx             # 欧姆定律页面
│   │   ├── hooke/page.tsx           # 胡克定律页面
│   │   └── editor/page.tsx          # 教学内容编辑器
│   ├── components/
│   │   ├── physics/
│   │   │   ├── AIAssistant.tsx       # AI助教悬浮组件（流式SSE对话）
│   │   │   ├── KnowledgeStation.tsx  # 知识加油站（4章节+动画+语音）
│   │   │   ├── ArchimedesLab.tsx     # 阿基米德虚拟实验室（Canvas动画）
│   │   │   └── ArchimedesGames.tsx   # 阿基米德互动游戏（3个小游戏）
│   │   └── ui/                       # shadcn/ui 组件
│   └── lib/
│       ├── physics-data.ts           # 物理定律章节数据
│       └── utils.ts                  # 工具函数
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 构建与测试命令

- 开发: `pnpm run dev` (端口 5000)
- 构建: `pnpm run build`
- 类型检查: `pnpm ts-check`
- Lint: `pnpm lint`
- 启动生产: `pnpm run start`

## 编码规范

- 仅使用 pnpm 管理依赖
- TypeScript strict 模式，禁止隐式 any
- Canvas 动画使用 ref 模式（`useEffect` 内部定义 `draw` + `stateRef` 同步状态），避免 `useCallback` + 大依赖数组导致 `react-hooks/immutability` 错误
- 所有 Canvas 动画组件遵循：state 驱动 UI 渲染，ref 驱动 Canvas 绘制
- 禁止在渲染时访问 ref.current（`react-hooks/refs` 规则）
- 流式 SSE 输出：后端 `ReadableStream`，前端 `fetch` + `getReader()`
- 严禁在 JSX 中直接使用 typeof window / Date.now() / Math.random()

## 关键组件说明

### AIAssistant.tsx
- 悬浮圆形图标 + 鼠标悬停显示介绍文字
- 点击打开对话框，支持流式对话
- 调用 `/api/chat` SSE 接口

### KnowledgeStation.tsx
- 4 个章节：问题引入、定律推导、定律结论、生活应用
- 每章节包含：Canvas 动画视频 + 文字内容 + 语音播报（Web Speech API）
- 章节数据从 `physics-data.ts` 读取

### ArchimedesLab.tsx
- 三栏布局：物体选择(左) → 液体杯(中 Canvas) → 浮力显示器(右)
- 支持选择不同物体/液体、调整体积
- 实时计算浮力、显示浮沉状态、水位变化动画

### ArchimedesGames.tsx
- 黄金潜艇大作战：操控潜艇浮沉（Canvas 动画）
- 沉船打捞计划：计算浮筒数量
- 密度消消乐：判断浮沉状态

### 教学内容编辑器 (editor/page.tsx)
- 支持3个定律 × 4章节的内容编辑
- 可编辑：文字内容、语音播报文案、上传视频/图片
- 本地存储（localStorage）保存编辑内容

## API 接口

### POST /api/chat
- 请求体: `{ messages: [{role: string, content: string}] }`
- 响应: SSE 流式 `data: {"content": "chunk"}\n\n`
- 系统提示词限定回答中学物理范围

### POST /api/tts
- 请求体: `{ text: string }`
- 响应: `{ audioUri: string, audioSize: number }`
- TTS语音合成，使用大易男声(zh_male_dayi_saturn_bigtts)，语速1.2倍
