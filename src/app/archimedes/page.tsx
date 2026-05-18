'use client';

import { useState } from 'react';
import Link from 'next/link';
import AIAssistant from '@/components/physics/AIAssistant';
import KnowledgeStation from '@/components/physics/KnowledgeStation';
import ArchimedesLab from '@/components/physics/ArchimedesLab';
import ArchimedesGames from '@/components/physics/ArchimedesGames';
import { archimedesChapters } from '@/lib/physics-data';

const tabs = [
  { id: 'knowledge', name: '知识加油站', icon: '📚' },
  { id: 'lab', name: '虚拟实验室', icon: '🔬' },
  { id: 'games', name: '闯关游戏', icon: '🎮' },
];

export default function ArchimedesPage() {
  const [activeTab, setActiveTab] = useState('knowledge');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="border-b border-blue-100/50 bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-blue-600 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-lg shadow-md">
              🚢
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">阿基米德定律</h1>
              <p className="text-xs text-gray-500">F浮 = ρ液gV排</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 bg-blue-50 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-blue-500'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'knowledge' && (
          <KnowledgeStation
            chapters={archimedesChapters}
            lawName="阿基米德定律"
            lawColor="bg-blue-500"
            lawKey="archimedes"
          />
        )}
        {activeTab === 'lab' && <ArchimedesLab />}
        {activeTab === 'games' && <ArchimedesGames />}
      </main>

      <AIAssistant />
    </div>
  );
}
