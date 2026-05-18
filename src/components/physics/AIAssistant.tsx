'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  date: string;
  messages: Message[];
}

const STORAGE_KEY = 'xiao-wu-chat-history';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function loadHistory(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const sessions: ChatSession[] = JSON.parse(raw);
    const cutoff = Date.now() - SEVEN_DAYS_MS;
    const filtered = sessions.filter(s =>
      s.messages.some(m => m.timestamp > cutoff)
    );
    if (filtered.length !== sessions.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return [];
  }
}

function saveHistory(sessions: ChatSession[]) {
  if (typeof window === 'undefined') return;
  try {
    const cutoff = Date.now() - SEVEN_DAYS_MS;
    const filtered = sessions.filter(s =>
      s.messages.some(m => m.timestamp > cutoff)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // storage full or unavailable
  }
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load history on mount
  useEffect(() => {
    const history = loadHistory();
    setSessions(history);
    // Restore today's messages
    const todayKey = getTodayKey();
    const todaySession = history.find(s => s.id === todayKey);
    if (todaySession) {
      setMessages(todaySession.messages);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const saveMessagesToHistory = useCallback((msgs: Message[]) => {
    const todayKey = getTodayKey();
    setSessions(prev => {
      const existing = prev.findIndex(s => s.id === todayKey);
      let updated: ChatSession[];
      if (existing >= 0) {
        updated = [...prev];
        updated[existing] = { ...updated[existing], messages: msgs };
      } else {
        updated = [...prev, { id: todayKey, date: todayKey, messages: msgs }];
      }
      saveHistory(updated);
      return updated;
    });
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: 'user', content: trimmed, timestamp: Date.now() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const assistantMessage: Message = { role: 'assistant', content: '', timestamp: Date.now() };
    const messagesWithAssistant = [...newMessages, assistantMessage];
    setMessages(messagesWithAssistant);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Network error');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulated += parsed.content;
                const updated = [...newMessages, { role: 'assistant' as const, content: accumulated, timestamp: Date.now() }];
                setMessages(updated);
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }

      // Save final messages to history
      const finalMessages = [...newMessages, { role: 'assistant' as const, content: accumulated, timestamp: Date.now() }];
      saveMessagesToHistory(finalMessages);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      const errorMsg = '哎呀，小物暂时开小差了，请稍后再试试吧~';
      const errorMessages = [...newMessages, { role: 'assistant' as const, content: errorMsg, timestamp: Date.now() }];
      setMessages(errorMessages);
      saveMessagesToHistory(errorMessages);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setShowHistory(false);
  };

  const clearHistory = () => {
    setSessions([]);
    localStorage.removeItem(STORAGE_KEY);
    setShowHistory(false);
  };

  const formatDateLabel = (dateStr: string) => {
    const today = getTodayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dateStr === today) return '今天';
    if (dateStr === yesterday) return '昨天';
    return dateStr;
  };

  return (
    <>
      {/* Floating Icon */}
      <div
        className="fixed bottom-6 right-6 z-50"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {showTooltip && !isOpen && (
          <div className="absolute bottom-full right-0 mb-3 w-56 rounded-xl bg-white shadow-lg border border-blue-100 p-3 text-sm text-gray-700 animate-slide-up">
            <p className="font-medium text-blue-700 mb-1">我是你的智能助教&quot;小物&quot;</p>
            <p className="text-xs text-gray-500">有关中学物理的所有知识都可以来找我哦~</p>
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-r border-b border-blue-100 transform rotate-45" />
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95"
        >
          {isOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="16" fill="white" />
              <circle cx="14" cy="17" r="2.5" fill="#3b82f6" />
              <circle cx="26" cy="17" r="2.5" fill="#3b82f6" />
              <circle cx="15" cy="16.5" r="0.8" fill="white" />
              <circle cx="27" cy="16.5" r="0.8" fill="white" />
              <path d="M14 24 Q20 29 26 24" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <circle cx="10" cy="22" r="2" fill="#93c5fd" opacity="0.5" />
              <circle cx="30" cy="22" r="2" fill="#93c5fd" opacity="0.5" />
              <ellipse cx="20" cy="10" rx="5" ry="2" stroke="#60a5fa" strokeWidth="0.8" fill="none" transform="rotate(-20 20 10)" />
              <ellipse cx="20" cy="10" rx="5" ry="2" stroke="#60a5fa" strokeWidth="0.8" fill="none" transform="rotate(20 20 10)" />
              <circle cx="20" cy="10" r="1" fill="#60a5fa" />
            </svg>
          )}
        </button>
      </div>

      {/* Chat Dialog */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-blue-100 flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="14" fill="white" />
                <circle cx="14" cy="18" r="2" fill="#3b82f6" />
                <circle cx="26" cy="18" r="2" fill="#3b82f6" />
                <path d="M15 25 Q20 29 25 25" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">小物 · 物理助教</p>
              <p className="text-xs text-blue-100">随时为你解答物理问题</p>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              title="历史记录"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
            </button>
          </div>

          {/* History Panel */}
          {showHistory && (
            <div className="border-b border-blue-50 bg-blue-50/50 max-h-48 overflow-y-auto shrink-0">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-medium text-gray-600">历史记录（7天内）</span>
                {sessions.length > 0 && (
                  <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-600">清空</button>
                )}
              </div>
              {sessions.length === 0 ? (
                <p className="text-xs text-gray-400 px-4 pb-3">暂无历史记录</p>
              ) : (
                <div className="px-2 pb-2 space-y-1">
                  {[...sessions].reverse().map(session => (
                    <button
                      key={session.id}
                      onClick={() => loadSession(session)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white transition-colors"
                    >
                      <p className="text-xs font-medium text-blue-700">{formatDateLabel(session.date)}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {session.messages.filter(m => m.role === 'user').length} 个问题
                        {session.messages.length > 0 && ` · 最后: ${session.messages[session.messages.length - 1].content.slice(0, 20)}...`}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-blue-50/30">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-blue-100 mx-auto mb-3 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="16" fill="#dbeafe" />
                    <circle cx="14" cy="17" r="2.5" fill="#3b82f6" />
                    <circle cx="26" cy="17" r="2.5" fill="#3b82f6" />
                    <path d="M14 24 Q20 29 26 24" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">你好！我是小物</p>
                <p className="text-gray-400 text-xs mt-1">有任何中学物理问题都可以问我~</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-white text-gray-700 shadow-sm border border-blue-50 rounded-bl-md'
                  }`}
                >
                  {msg.content || (
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-blue-50 bg-white shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="输入你的物理问题..."
                className="flex-1 rounded-xl border border-blue-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent placeholder:text-gray-400"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="rounded-xl bg-blue-500 px-3 py-2 text-white text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
