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

import type { PressRelease } from '@/lib/types';
import styles from './page.module.css';

import CharacterCounter from '@/components/editor/counter/CharacterCounter';
import TitleCounter from '@/components/editor/counter/TitleCounter';

import ImageUploadButton from './media/ImageUploadButton';
import ImageUrlInsert from './media/ImageUrlInsert';

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

function useTemplatesQuery() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await fetch('/api/templates');
      if (!response.ok) return [];
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
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      alert('保存しました！');
    },
  });
}

function useSaveTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; title: string; content: string }) => {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      alert('テンプレートを保存しました！');
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
  balloonRef: React.RefObject<HTMLDivElement>;
}) => {
  if (!editor) return null;

  const getButtonStyle = (name: string) => {
    const isActive = editor.isActive(name);
    return `px-3 py-2 border rounded font-bold transition-colors ${
      isActive ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
    }`;
  };

  // リンク挿入処理
  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URLを入力してください:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  // リンク解除処理（ここを修正）
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
      
      {/* リンクボタン */}
      <button type="button" onClick={setLink} className={getButtonStyle('link')}>🔗 リンク</button>
      
      {/* 修正した解除ボタン */}
      <button 
        type="button" 
        onClick={unsetLink} 
        disabled={!editor.isActive('link')} 
        className="px-3 py-2 border rounded font-bold bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-100 border-gray-300"
      >
        解除
      </button>

      {/* AIボタン */}
      <div className="relative ml-2" ref={balloonRef}>
        <button 
          type="button"
          onClick={onAiToggle} 
          disabled={isGenerating}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-50 text-sm"
        >
          {isGenerating ? '✨ 生成中...' : '✨ AIで記事作成'}
        </button>

        {showAiBalloon && (
          <div className="absolute top-full left-0 mt-3 w-[500px] p-6 bg-white border border-indigo-100 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in duration-200 cursor-default">
            <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-t border-l border-indigo-100 rotate-45"></div>
            
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✨</span>
              <label className="block text-md font-bold text-gray-800">AIに執筆を依頼する</label>
            </div>

            <textarea
              autoFocus
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="商品の特徴や自社の強みを入力してください。具体的な情報が多いほど、質の高い記事になります。"
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

// --- メインページ ---
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
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiBalloon, setShowAiBalloon] = useState(false);

  const titleRef = useRef(title);
  const balloonRef = useRef<HTMLDivElement>(null);

  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (balloonRef.current && !balloonRef.current.contains(event.target as Node)) {
        setShowAiBalloon(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const editor = useEditor({
    extensions: [
      Document, Heading, Paragraph, Text, Bold, Italic, Underline, BulletList, OrderedList, ListItem, Image,
      Link.configure({ openOnClick: true, autolink: true, HTMLAttributes: { class: 'editor-link', target: '_blank', rel: 'noopener noreferrer' } }),
    ],
    content: initialContent,
    immediatelyRender: false,
  });

  const { isPending: isSaving, mutate: savePressRelease } = useSavePressReleaseMutation();
  const { data: templates } = useTemplatesQuery();
  const { mutate: saveAsTemplate } = useSaveTemplateMutation();

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
    } catch (e) {
      alert("AI生成に失敗しました。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    if (!templateId || !editor) return;
    const selected = templates?.find((t: any) => String(t.id) === templateId);
    if (selected && confirm('現在の内容が上書きされます。よろしいですか？')) {
      setTitle(selected.title);
      try {
        const content = typeof selected.content === 'string' ? JSON.parse(selected.content) : selected.content;
        editor.commands.setContent(content);
      } catch (err) { console.error(err); }
    }
    e.target.value = "";
  };

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>プレスリリースエディター</h1>
        <div className="flex gap-2">
          <button onClick={() => {
            const name = window.prompt('テンプレート名を入力してください');
            if (name) saveAsTemplate({ name, title, content: JSON.stringify(editor?.getJSON()) });
          }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold transition-colors">
            テンプレート保存
          </button>
          <button onClick={() => savePressRelease({ title, content: JSON.stringify(editor?.getJSON()) })} className={styles.saveButton} disabled={isSaving}>
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.editorWrapper}>
          <div className="mb-4 flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-600">テンプレートを選択</label>
            <select onChange={handleApplyTemplate} className="w-full p-2 border border-gray-300 rounded-md text-black bg-white shadow-sm">
              <option value="">保存済みテンプレートを適用する...</option>
              {templates?.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.titleInputWrapper}>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトルを入力" className={styles.titleInput} />
          </div>

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
            <div className="tiptap-container">
              <EditorContent editor={editor} className={styles.editorContent} />
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <TitleCounter title={title} />
            <CharacterCounter editor={editor} />
          </div>
        </div>
      </main>

      <style jsx global>{`
        .tiptap-container .tiptap { padding: 2rem; min-height: 500px; outline: none; color: #1a1a1a; background-color: white; font-size: 1.1rem; line-height: 1.6; }
        .tiptap-container .tiptap a, .editor-link { color: #2563eb !important; text-decoration: underline !important; cursor: pointer !important; }
        .tiptap-container .tiptap h2 { font-size: 1.5rem; font-weight: bold; margin: 1.5rem 0 1rem; border-left: 4px solid #4f46e5; padding-left: 0.5rem; }
        .tiptap-container .tiptap ul { list-style-type: disc !important; padding-left: 2rem !important; margin: 1rem 0 !important; }
        .tiptap-container .tiptap ol { list-style-type: decimal !important; padding-left: 2rem !important; margin: 1rem 0 !important; }
        .tiptap-container .tiptap p { margin-bottom: 1.2rem; }
        .tiptap-container .tiptap strong { font-weight: bold !important; color: #000; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}