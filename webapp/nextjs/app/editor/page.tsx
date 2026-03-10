// app/editor/page.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEditor, EditorContent, type Editor as TiptapEditor } from '@tiptap/react';

import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import NextLink from 'next/link';

import CharacterCounter from '@/components/editor/counter/CharacterCounter';
import TitleCounter from '@/components/editor/counter/TitleCounter';
import ImageUploadButton from './media/ImageUploadButton';
import ImageUrlInsert from './media/ImageUrlInsert';
import AIFixPanel from '@/components/ai/AIFixPanel';
import { validateContent, validateTitle } from '@/utils/validation';

import type { PressRelease } from '@/lib/types';
import styles from './page.module.css';

const PRESS_RELEASE_ID = 1;
const queryKey = ['press-release', PRESS_RELEASE_ID];

// --- API Hooks ---
function usePressReleaseQuery() {
  return useQuery({
    queryKey,
    queryFn: async (): Promise<PressRelease> => {
      const response = await fetch(`/api/press-releases/${PRESS_RELEASE_ID}`);
      if (!response.ok) throw new Error(`HTTPエラー: ${response.status}`);
      return response.json();
    },
  });
}

function useSavePressReleaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const response = await fetch(`/api/press-releases/${PRESS_RELEASE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('保存に失敗しました');
      
      await fetch('/api/mock-status', { method: 'PUT' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['mock-status'] });
      alert('保存しました！');
    },
  });
}

// --- ツールバーコンポーネント ---
const Toolbar = ({ 
  editor, 
  onAiToggle, 
  isGenerating, 
  showAiBalloon, 
  aiPrompt, 
  setAiPrompt, 
  handleAiGenerate,
  balloonRef 
}: { 
  editor: TiptapEditor | null;
  onAiToggle: () => void;
  isGenerating: boolean;
  showAiBalloon: boolean;
  aiPrompt: string;
  setAiPrompt: (val: string) => void;
  handleAiGenerate: () => void;
  balloonRef: React.RefObject<HTMLDivElement | null>;
}) => {
  if (!editor) return null;

  const getButtonStyle = (name: string) => {
    const isActive = editor.isActive(name);
    return `px-3 py-2 border rounded font-bold transition-colors ${
      isActive ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
    }`;
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('リンク先のURLを入力してください:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const unsetLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
  };

  return (
    <div className="flex gap-2 p-3 border-b bg-gray-50 text-black flex-wrap items-center">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={getButtonStyle('bold')}>B</button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={getButtonStyle('italic')}>I</button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={getButtonStyle('underline')}>U</button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={getButtonStyle('bulletList')}>• 箇条書き</button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={getButtonStyle('orderedList')}>1. 番号</button>
      
      <button type="button" onClick={setLink} className={getButtonStyle('link')}>🔗 リンク</button>
      
      <button 
        type="button" 
        onClick={unsetLink} 
        disabled={!editor.isActive('link')} 
        className="px-3 py-2 border rounded font-bold bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-100 border-gray-300"
      >
        解除
      </button>

      <div className="relative ml-2" ref={balloonRef}>
        <button 
          type="button"
          onClick={onAiToggle} 
          disabled={isGenerating}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-50 text-sm"
        >
          {isGenerating ? '生成中...' : 'AIで記事作成'}
        </button>

        {showAiBalloon && (
          <div className="absolute top-full left-0 mt-3 w-[500px] p-6 bg-white border border-indigo-100 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in duration-200 cursor-default">
            <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-t border-l border-indigo-100 rotate-45"></div>
            <div className="flex items-center gap-2 mb-3">
              <label className="block text-md font-bold text-gray-800">AIに執筆を依頼する</label>
            </div>
            <textarea
              autoFocus
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="商品の特徴や自社の強みを入力してください。"
              className="w-full p-4 border border-indigo-100 rounded-xl text-black text-base focus:ring-4 focus:ring-indigo-50 outline-none min-h-[220px] transition-all resize-y"
            />
            <button 
              type="button"
              onClick={handleAiGenerate}
              disabled={!aiPrompt.trim()}
              className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-xl font-bold text-md hover:bg-indigo-700 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              この記事の内容で下書きを生成する
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function EditorPage() {
  const { data, isPending, isError } = usePressReleaseQuery();

  if (isPending) return <div className={styles.container}><div className={styles.loading}>読み込み中...</div></div>;
  if (isError || !data) return <div className={styles.container}><div className={styles.error}>データの読み込みに失敗しました</div></div>;

  let initialContent: any = '';
  if (data.content != null) {
    if (typeof data.content === 'string') {
      try { initialContent = JSON.parse(data.content); } catch { initialContent = data.content; }
    } else { initialContent = data.content; }
  }

  return <PressReleaseEditor initialTitle={data.title ?? ''} initialContent={initialContent} />;
}

function PressReleaseEditor({ initialTitle, initialContent }: { initialTitle: string; initialContent: any }) {
  const [title, setTitle] = useState(initialTitle);
  const [mounted, setMounted] = useState(false);
  const [approvalEmail, setApprovalEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiBalloon, setShowAiBalloon] = useState(false);

  const titleRef = useRef(title);
  const balloonRef = useRef<HTMLDivElement>(null);
  const lastSavedRef = useRef<string>('');
  const autosaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { 
    setMounted(true); 
    return () => { if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current); };
  }, []);

  const { data: statusData } = useQuery({
    queryKey: ['mock-status'],
    queryFn: async () => {
      const res = await fetch('/api/mock-status');
      return res.json();
    },
    refetchInterval: 3000, 
  });
  
  const currentStatus = statusData?.status || 'draft';
  const approverComment = statusData?.comment || '';
  const isApproved = currentStatus === 'approved';

  let badgeText = '編集中 / 承認待ち';
  let badgeStyle = { backgroundColor: '#f3f4f6', color: '#4b5563' };

  if (currentStatus === 'approved') {
    badgeText = '承認済み';
    badgeStyle = { backgroundColor: '#d1fae5', color: '#065f46' };
  } else if (currentStatus === 'rejected') {
    badgeText = '差し戻し（修正が必要です）';
    badgeStyle = { backgroundColor: '#fee2e2', color: '#991b1b' };
  }

  const editor = useEditor({
    extensions: [
      Document, Heading, Paragraph, Text, Bold, Italic, Underline, BulletList, OrderedList, ListItem, Image,
      Link.configure({ openOnClick: true, autolink: true, HTMLAttributes: { class: 'editor-link', target: '_blank', rel: 'noopener noreferrer' } }),
    ],
    content: initialContent,
    immediatelyRender: false,
  });

  const { isPending: isSaving, mutate: savePressRelease } = useSavePressReleaseMutation();

  // 自動保存ロジック
  useEffect(() => {
    if (!editor) return;
    lastSavedRef.current = JSON.stringify(editor.getJSON());

    autosaveTimerRef.current = setInterval(async () => {
      if (!isApproved) return;

      const currentTitle = titleRef.current;
      const currentContent = JSON.stringify(editor.getJSON());
      if (currentContent === lastSavedRef.current) return;

      try {
        const response = await fetch(`/api/press-releases/${PRESS_RELEASE_ID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: currentTitle, content: currentContent }),
        });
        if (response.ok) {
          lastSavedRef.current = currentContent;
          console.log('[autosave] saved', new Date().toISOString());
        }
      } catch (e) { console.error('[autosave] network error', e); }
    }, 5000);

    return () => { if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current); };
  }, [editor, isApproved]);

  const handleSave = async () => {
    if (!editor) return;
    if (!title.trim()) return alert("タイトルを入力してください");

    // バリデーションチェック
    const validateResponse = await fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content: editor.getText() }),
    });
    if (!validateResponse.ok) return alert('バリデーションに失敗しました');

    // AIコンプライアンスチェック
    setIsCheckingAI(true);
    try {
      const aiRes = await fetch('/api/check-compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `【タイトル】\n${title}\n\n【本文】\n${editor.getText()}` }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const aiResult = aiData.result;
        if (aiResult !== 'OK') {
          const proceed = window.confirm(`【AIコンプライアンス警告】\n\n不適切な情報が含まれている可能性があります：\n\n${aiResult}\n\n本当に保存しますか？`);
          if (!proceed) return;
        }
      }
    } catch (e) {
      console.error('AIチェックエラー:', e);
    } finally {
      setIsCheckingAI(false);
    }

    const content = JSON.stringify(editor.getJSON());
    savePressRelease({ title, content });
    lastSavedRef.current = content;
  };

  const handleSendApproval = async () => {
    if (!approvalEmail) return alert('送信先のメールアドレスを入力してください');
    if (!title.trim()) return alert('タイトルを入力してください');
    
    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/send-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: approvalEmail, title }),
      });
      if (res.ok) alert('承認依頼メールを送信しました！');
    } catch (e) {
      alert('送信エラー');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setShowAiBalloon(false);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await response.json();
      if (data.title && data.content) {
        setTitle(data.title);
        editor?.commands.setContent(data.content);
        window.scrollTo({ top: 400, behavior: 'smooth' });
      }
    } catch (e) { alert("AI生成に失敗しました。"); }
    finally { setIsGenerating(false); }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (balloonRef.current && !balloonRef.current.contains(event.target as Node)) setShowAiBalloon(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 className={styles.title}>プレスリリースエディター</h1>
          
          <span style={{
            padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold',
            transition: 'all 0.3s', ...badgeStyle
          }}>
            {badgeText}

          </span>
        </div>
          
        <div>
          <NextLink 
            href="/starter" 
            style={{
              padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', 
              backgroundColor: '#ffffff', color: '#374151', fontWeight: 'bold', 
              textDecoration: 'none', display: 'inline-block', fontSize: '14px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            チュートリアル
          </NextLink>
          {/* 🌟 追加: プレビュー画面へのリンク */}
          <NextLink 
            href="/preview" 
            style={{
              padding: '8px 16px', borderRadius: '6px', border: '1px solid #3b82f6', 
              backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 'bold', 
              textDecoration: 'none', display: 'inline-block', fontSize: '14px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            👁️ プレビュー
          </NextLink>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="email"
              placeholder="承認者のアドレス"
              value={approvalEmail}
              onChange={(e) => setApprovalEmail(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }}
            />
            <button 
              onClick={handleSendApproval} 
              disabled={isSendingEmail || !approvalEmail}
              style={{
                padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold',
                backgroundColor: isSendingEmail || !approvalEmail ? '#9ca3af' : '#2563eb', color: 'white',
                cursor: isSendingEmail || !approvalEmail ? 'not-allowed' : 'pointer',
              }}
            >
              {isSendingEmail ? '送信中...' : '承認依頼'}
            </button>
          </div>

          <button 
            onClick={handleSave} 
            className={styles.saveButton} 
            disabled={isSaving || isCheckingAI}
            style={{
              opacity: isSaving || isCheckingAI ? 0.5 : 1,
              cursor: isSaving || isCheckingAI ? 'not-allowed' : 'pointer'
            }}
          >
            {isCheckingAI ? 'AIチェック中...' : isSaving ? '保存中...' : '保存'}
          </button>
          <button 
            onClick={handleSave} 
            className={styles.saveButton} 
            disabled={isSaving || isCheckingAI || !isApproved}
            style={{
            opacity: isSaving || isCheckingAI || !isApproved ? 0.5 : 1,
              cursor: isSaving || isCheckingAI || !isApproved ? 'not-allowed' : 'pointer'
            }}
          >
            {isCheckingAI ? 'AIチェック中...' : isSaving ? '公開中...' : '公開'}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.editorWrapper}>
          {approverComment && (
            <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#92400e', fontWeight: 'bold' }}>💬 承認者からのコメント</h3>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#92400e', fontSize: '14px' }}>{approverComment}</p>
            </div>
          )}
          
          {approverComment && (
            <AIFixPanel
              editor={editor}
              title={title}
              approverComment={approverComment}
            />
          )}

          <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
            <Toolbar 
              editor={editor} 
              onAiToggle={() => setShowAiBalloon(!showAiBalloon)}
              isGenerating={isGenerating}
              showAiBalloon={showAiBalloon}
              aiPrompt={aiPrompt}
              setAiPrompt={setAiPrompt}
              handleAiGenerate={handleAiGenerate}
              balloonRef={balloonRef}
            />

            <div className="flex p-2 gap-2 bg-gray-100 border-b overflow-x-auto">
              <ImageUploadButton editor={editor} />
              <ImageUrlInsert editor={editor} />
            </div>

            <div className={styles.titleInputWrapper} style={{ paddingTop: '20px' }}>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="タイトルを入力" 
                className={styles.titleInput} 
              />
            </div>

            <div className="tiptap-container">
              <EditorContent editor={editor} className={styles.editorContent} />
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .tiptap-container .tiptap { 
          padding: 0 2rem 2rem 2rem;
          min-height: 500px; 
          outline: none; 
          color: #1a1a1a; 
        }
        .tiptap-container .tiptap p:first-child { margin-top: 0 !important; }
        .tiptap-container .tiptap p { margin-top: 0; margin-bottom: 1.2rem; }
        .tiptap-container .tiptap ul { list-style-type: disc !important; padding-left: 2rem !important; margin: 1rem 0 !important; }
        .tiptap-container .tiptap ol { list-style-type: decimal !important; padding-left: 2rem !important; margin: 1rem 0 !important; }
        .tiptap-container .tiptap li p { margin: 0 !important; }
        .tiptap-container .tiptap strong { font-weight: bold !important; }
        .tiptap-container .tiptap img { max-width: 100%; height: auto; border-radius: 4px; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}