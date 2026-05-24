'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { archimedesChapters, ohmChapters, hookeChapters, ChapterContent } from '@/lib/physics-data';

type LawKey = 'archimedes' | 'ohm' | 'hooke';

interface EditorChapter extends ChapterContent {
  videoUrl?: string;
  videoName?: string;
}

const lawMap: Record<LawKey, { name: string; chapters: EditorChapter[]; color: string }> = {
  archimedes: { name: '阿基米德定律', chapters: archimedesChapters.map(c => ({ ...c })), color: 'blue' },
  ohm: { name: '欧姆定律', chapters: ohmChapters.map(c => ({ ...c })), color: 'amber' },
  hooke: { name: '胡克定律', chapters: hookeChapters.map(c => ({ ...c })), color: 'emerald' },
};

const chapterLabels = ['问题引入', '定律推导过程', '定律结论与理解', '生活中的应用'];

export default function EditorPage() {
  const [selectedLaw, setSelectedLaw] = useState<LawKey>('archimedes');
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [editData, setEditData] = useState<Record<LawKey, EditorChapter[]>>({
    archimedes: archimedesChapters.map(c => ({ ...c })),
    ohm: ohmChapters.map(c => ({ ...c })),
    hooke: hookeChapters.map(c => ({ ...c })),
  });
  const [saved, setSaved] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMsg, setUploadMsg] = useState('');
  const [pushStatus, setPushStatus] = useState<'idle' | 'pushing' | 'success' | 'error'>('idle');
  const [hasUnsaved, setHasUnsaved] = useState(false);

  const law = lawMap[selectedLaw];
  const chapter = editData[selectedLaw][selectedChapter];

  // Load data from server API on mount
  useEffect(() => {
    async function loadData() {
      // Step 1: Start with defaults from physics-data.ts
      const baseData: Record<LawKey, EditorChapter[]> = {
        archimedes: archimedesChapters.map(c => ({ ...c })),
        ohm: ohmChapters.map(c => ({ ...c })),
        hooke: hookeChapters.map(c => ({ ...c })),
      };

      // Step 2: Load project config from server (editor-defaults.json)
      try {
        const res = await fetch('/api/editor');
        if (res.ok) {
          const defaults = await res.json();
          for (const [lk, chs] of Object.entries(defaults)) {
            if (lk in baseData && Array.isArray(chs)) {
              baseData[lk as LawKey] = chs.map((ch: EditorChapter, i: number) => ({
                ...baseData[lk as LawKey][i],
                ...ch,
              }));
            }
          }
        }
      } catch {
        // ignore fetch errors
      }

      setEditData(baseData);
    }
    loadData();
  }, []);

  // Save to server (writes editor-defaults.json + auto git commit)
  const handleSave = useCallback(async () => {
    try {
      // Clean data for saving — only save relevant fields
      const saveData: Record<string, unknown> = {};
      for (const [lk, chs] of Object.entries(editData)) {
        saveData[lk] = (chs as EditorChapter[]).map(ch => {
          const entry: Record<string, unknown> = {
            title: ch.title,
            text: ch.text,
            speech: ch.speech,
            videoType: ch.videoType,
          };
          if (ch.videoUrl) entry.videoUrl = ch.videoUrl;
          if (ch.videoName) entry.videoName = ch.videoName;
          return entry;
        });
      }

      const res = await fetch('/api/editor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData),
      });

      if (res.ok) {
        setSaved(true);
        setHasUnsaved(false);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const err = await res.json();
        setUploadStatus('error');
        setUploadMsg(`保存失败: ${err.error || '未知错误'}`);
        setTimeout(() => { setUploadStatus('idle'); setUploadMsg(''); }, 3000);
      }
    } catch {
      setUploadStatus('error');
      setUploadMsg('保存失败: 网络错误');
      setTimeout(() => { setUploadStatus('idle'); setUploadMsg(''); }, 3000);
    }
  }, [editData]);

  // Push to GitHub
  const handlePushToGitHub = useCallback(async () => {
    setPushStatus('pushing');
    try {
      // First save current changes
      await handleSave();

      // Call git push via API
      const res = await fetch('/api/git-push', { method: 'POST' });
      if (res.ok) {
        setPushStatus('success');
        setTimeout(() => setPushStatus('idle'), 3000);
      } else {
        setPushStatus('error');
        setTimeout(() => setPushStatus('idle'), 3000);
      }
    } catch {
      setPushStatus('error');
      setTimeout(() => setPushStatus('idle'), 3000);
    }
  }, [handleSave]);

  const handleTextChange = (value: string) => {
    setEditData(prev => ({
      ...prev,
      [selectedLaw]: prev[selectedLaw].map((ch, i) =>
        i === selectedChapter ? { ...ch, text: value } : ch
      ),
    }));
    setHasUnsaved(true);
  };

  const handleSpeechChange = (value: string) => {
    setEditData(prev => ({
      ...prev,
      [selectedLaw]: prev[selectedLaw].map((ch, i) =>
        i === selectedChapter ? { ...ch, speech: value } : ch
      ),
    }));
    setHasUnsaved(true);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setUploadStatus('error');
      setUploadMsg('不支持的文件格式，请上传 MP4/WebM 视频或 PNG/JPG 图片');
      setTimeout(() => { setUploadStatus('idle'); setUploadMsg(''); }, 3000);
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setUploadStatus('error');
      setUploadMsg('文件大小不能超过50MB');
      setTimeout(() => { setUploadStatus('idle'); setUploadMsg(''); }, 3000);
      return;
    }

    setUploadStatus('uploading');
    setUploadMsg('正在上传...');

    try {
      // Upload to server via API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('lawKey', selectedLaw);
      formData.append('chapterIndex', String(selectedChapter));

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        const videoUrl = result.url as string;

        setEditData(prev => ({
          ...prev,
          [selectedLaw]: prev[selectedLaw].map((ch, i) =>
            i === selectedChapter ? { ...ch, videoUrl, videoName: file.name } : ch
          ),
        }));
        setUploadStatus('success');
        setUploadMsg(`上传成功: ${file.name}`);
        setHasUnsaved(true);
        setTimeout(() => { setUploadStatus('idle'); setUploadMsg(''); }, 3000);
      } else {
        const err = await res.json();
        setUploadStatus('error');
        setUploadMsg(`上传失败: ${err.error || '未知错误'}`);
        setTimeout(() => { setUploadStatus('idle'); setUploadMsg(''); }, 3000);
      }
    } catch {
      setUploadStatus('error');
      setUploadMsg('上传失败，请重试');
      setTimeout(() => { setUploadStatus('idle'); setUploadMsg(''); }, 3000);
    }

    // Reset file input so same file can be re-uploaded
    e.target.value = '';
  };

  const handleRemoveVideo = async () => {
    // Delete file from server
    if (chapter.videoUrl && chapter.videoUrl.startsWith('/videos/')) {
      try {
        await fetch(`/api/upload?url=${encodeURIComponent(chapter.videoUrl)}`, { method: 'DELETE' });
      } catch {
        // ignore delete errors
      }
    }

    setEditData(prev => ({
      ...prev,
      [selectedLaw]: prev[selectedLaw].map((ch, i) =>
        i === selectedChapter ? { ...ch, videoUrl: undefined, videoName: undefined } : ch
      ),
    }));
    setHasUnsaved(true);
  };

  const colorClass = law.color === 'blue' ? 'blue' : law.color === 'amber' ? 'amber' : 'emerald';

  // Check if current chapter has an uploaded video/image
  const hasVideo = Boolean(chapter.videoUrl);
  const isVideoFile = chapter.videoUrl ? !chapter.videoUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) : false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-blue-600 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="text-lg font-bold text-gray-800">教学内容编辑器</h1>
            {hasUnsaved && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">未保存</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePushToGitHub}
              disabled={pushStatus === 'pushing'}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                pushStatus === 'pushing' ? 'bg-gray-400 text-white cursor-wait' :
                pushStatus === 'success' ? 'bg-green-500 text-white' :
                pushStatus === 'error' ? 'bg-red-500 text-white' :
                'bg-purple-500 text-white hover:bg-purple-600'
              }`}
            >
              {pushStatus === 'pushing' ? '推送中...' :
               pushStatus === 'success' ? '推送成功!' :
               pushStatus === 'error' ? '推送失败' :
               '🚀 推送到GitHub'}
            </button>
            <button
              onClick={handleSave}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                saved
                  ? 'bg-green-500 text-white'
                  : `bg-${colorClass}-500 text-white hover:bg-${colorClass}-600`
              }`}
            >
              {saved ? '✅ 已保存' : '💾 保存修改'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* Info banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          <strong>提示：</strong>编辑内容后点击"💾 保存修改"将配置写入项目文件，再点击"🚀 推送到GitHub"同步到代码仓库。任何环境部署后都会自动加载最新配置，无需手动导入。
        </div>

        {/* Law Selection */}
        <div className="flex gap-2 mb-6">
          {(Object.keys(lawMap) as LawKey[]).map((key) => (
            <button
              key={key}
              onClick={() => { setSelectedLaw(key); setSelectedChapter(0); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedLaw === key
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
              }`}
            >
              {lawMap[key].name}
            </button>
          ))}
        </div>

        {/* Chapter Selection */}
        <div className="flex gap-2 mb-6">
          {chapterLabels.map((label, i) => (
            <button
              key={i}
              onClick={() => setSelectedChapter(i)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                selectedChapter === i
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {i + 1}. {label}
            </button>
          ))}
        </div>

        {/* Editor Area */}
        <div className="space-y-6">
          {/* Text Content */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📝 显示的文字内容
            </label>
            <textarea
              value={chapter.text}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={5}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-blue-300 focus:border-transparent resize-y"
              placeholder="输入文字内容..."
            />
            <p className="text-xs text-gray-400 mt-1">建议简洁概括，便于学生快速理解</p>
          </div>

          {/* Speech Content */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              🔊 语音播报文案
            </label>
            <textarea
              value={chapter.speech}
              onChange={(e) => handleSpeechChange(e.target.value)}
              rows={8}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-blue-300 focus:border-transparent resize-y"
              placeholder="输入语音播报文案..."
            />
            <p className="text-xs text-gray-400 mt-1">此文案将用于视频讲解的语音播报，+/-等符号会自动转换为中文</p>
          </div>

          {/* Video Upload */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              🎬 视频动画上传
            </label>

            {hasVideo ? (
              /* Show uploaded video/image preview */
              <div className="space-y-3">
                {isVideoFile ? (
                  <div className="w-full max-h-80 bg-black rounded-lg overflow-hidden">
                    <video
                      key={chapter.videoUrl}
                      src={chapter.videoUrl}
                      className="w-full h-full object-contain"
                      controls
                      autoPlay
                      loop
                    />
                  </div>
                ) : (
                  <div className="w-full bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center p-4">
                    <img
                      src={chapter.videoUrl}
                      alt="教学图片"
                      className="max-w-full max-h-80 object-contain"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📎</span>
                    <span className="text-sm text-blue-700">{chapter.videoName}</span>
                    {chapter.videoUrl && chapter.videoUrl.startsWith('/videos/') && (
                      <span className="text-xs text-gray-400">({chapter.videoUrl})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="video-replace"
                      className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                    >
                      替换文件
                    </label>
                    <button
                      onClick={handleRemoveVideo}
                      className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                  <input
                    type="file"
                    accept="video/*,image/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    id="video-replace"
                  />
                </div>
              </div>
            ) : (
              /* Upload area */
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-blue-300 transition-colors">
                <input
                  type="file"
                  accept="video/*,image/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload" className="cursor-pointer">
                  <div className="text-4xl mb-2">📁</div>
                  <p className="text-sm text-gray-500">点击上传视频或图片文件</p>
                  <p className="text-xs text-gray-400 mt-1">支持 MP4, WebM, PNG, JPG 格式（最大50MB）</p>
                </label>
              </div>
            )}

            {/* Upload status toast */}
            {uploadStatus !== 'idle' && (
              <div className={`mt-3 px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                uploadStatus === 'uploading' ? 'bg-blue-50 text-blue-700' :
                uploadStatus === 'success' ? 'bg-green-50 text-green-700' :
                'bg-red-50 text-red-700'
              }`}>
                {uploadStatus === 'uploading' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="animate-spin">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.4" strokeDashoffset="10" />
                  </svg>
                )}
                {uploadStatus === 'success' && '✅'}
                {uploadStatus === 'error' && '❌'}
                {uploadMsg}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
