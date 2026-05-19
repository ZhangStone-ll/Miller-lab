'use client';

import { useState, useEffect } from 'react';
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

  const law = lawMap[selectedLaw];
  const chapter = editData[selectedLaw][selectedChapter];

  useEffect(() => {
    const stored = localStorage.getItem('physics-editor-data');
    if (stored) {
      try {
        setEditData(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('physics-editor-data', JSON.stringify(editData));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTextChange = (value: string) => {
    setEditData(prev => ({
      ...prev,
      [selectedLaw]: prev[selectedLaw].map((ch, i) =>
        i === selectedChapter ? { ...ch, text: value } : ch
      ),
    }));
  };

  const handleSpeechChange = (value: string) => {
    setEditData(prev => ({
      ...prev,
      [selectedLaw]: prev[selectedLaw].map((ch, i) =>
        i === selectedChapter ? { ...ch, speech: value } : ch
      ),
    }));
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
      const url = URL.createObjectURL(file);
      setEditData(prev => ({
        ...prev,
        [selectedLaw]: prev[selectedLaw].map((ch, i) =>
          i === selectedChapter ? { ...ch, videoUrl: url, videoName: file.name } : ch
        ),
      }));
      setUploadStatus('success');
      setUploadMsg(`上传成功: ${file.name}`);
      setTimeout(() => { setUploadStatus('idle'); setUploadMsg(''); }, 3000);
    } catch {
      setUploadStatus('error');
      setUploadMsg('上传失败，请重试');
      setTimeout(() => { setUploadStatus('idle'); setUploadMsg(''); }, 3000);
    }

    // Reset file input so same file can be re-uploaded
    e.target.value = '';
  };

  const handleRemoveVideo = () => {
    setEditData(prev => ({
      ...prev,
      [selectedLaw]: prev[selectedLaw].map((ch, i) =>
        i === selectedChapter ? { ...ch, videoUrl: undefined, videoName: undefined } : ch
      ),
    }));
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
          </div>
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
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
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
