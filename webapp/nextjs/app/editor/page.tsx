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
// リンク拡張機能
import Link from '@tiptap/extension-link';

import type { PressRelease } from '@/lib/types';
import styles from './page.module.css';

import CharacterCounter from '@/components/editor/counter/CharacterCounter';
import TitleCounter from '@/components/editor/counter/TitleCounter';

import ImageUploadButton from './media/ImageUploadButton';
import ImageUrlInsert from './media/ImageUrlInsert';

const PRESS_RELEASE_ID = 1;
const queryKey = ['press-release', PRESS_RELEASE_ID];

// --- データ取得 ---
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

// --- 保存処理 ---
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
    onError: (error: Error) => {
      alert(`エラー: ${error.message}`);
    },
  });
}

// --- ツールバー ---
const Toolbar = ({ editor }: { editor: TiptapEditor | null }) => {
  if (!editor) return null;

  const getButtonStyle = (name: string) => {
    const isActive = editor.isActive(name);
    return `px-3 py-2 border rounded font-bold transition-colors ${
      isActive 
        ? 'bg-blue-600 text-white border-blue-700' 
        : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
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

  return (
    <div className="flex gap-2 p-3 border-b bg-gray-50 text-black flex-wrap">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={getButtonStyle('bold')}>B</button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={getButtonStyle('italic')}>I</button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={getButtonStyle('underline')}>U</button>
      
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={getButtonStyle('bulletList')}>• 箇条書き</button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={getButtonStyle('orderedList')}>1. 番号</button>

      <button type="button" onClick={setLink} className={getButtonStyle('link')}>🔗 リンク</button>
      <button 
        type="button" 
        onClick={() => editor.chain().focus().unsetLink().run()} 
        disabled={!editor.isActive('link')}
        className="px-3 py-2 border rounded font-bold bg-white text-gray-700 disabled:opacity-50"
      >
        解除
      </button>
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
  const titleRef = useRef(title);

  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => setMounted(true), []);

  const editor = useEditor({
    extensions: [
      Document,
      Heading,
      Paragraph,
      Text,
      Bold,
      Italic,
      Underline,
      BulletList,
      OrderedList,
      ListItem,
      Image,
      Link.configure({
        openOnClick: true,     // クリックでリンクを開く設定を有効化
        autolink: true,        // URL入力時に自動でリンク化
        HTMLAttributes: {
          class: 'editor-link',
          target: '_blank',     // 新しいタブで開く
          rel: 'noopener noreferrer', // セキュリティ対策
        },
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
  });

  const { isPending: isSaving, mutate } = useSavePressReleaseMutation();

  const autosaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    if (!editor) return;
    lastSavedRef.current = JSON.stringify(editor.getJSON());
    if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);

    autosaveTimerRef.current = setInterval(async () => {
      const currentTitle = titleRef.current;
      const currentContent = JSON.stringify(editor.getJSON());
      if (currentContent === lastSavedRef.current) return;

      try {
        const res = await fetch(`/api/press-releases/${PRESS_RELEASE_ID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: currentTitle, content: currentContent }),
        });
        if (res.ok) { lastSavedRef.current = currentContent; }
      } catch (e) { console.error('[autosave] error', e); }
    }, 5000);

    return () => { if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current); };
  }, [editor]);

  const handleSave = async () => {
    if (!editor || !title.trim()) return alert("タイトルを入力してください");
    const content = JSON.stringify(editor.getJSON());
    mutate({ title, content });
    lastSavedRef.current = content;
  };

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>プレスリリースエディター</h1>
        <button onClick={handleSave} className={styles.saveButton} disabled={isSaving}>{isSaving ? '保存中...' : '保存'}</button>
      </header>

      <main className={styles.main}>
        <div className={styles.editorWrapper}>
          <div className={styles.titleInputWrapper}>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトルを入力" className={styles.titleInput} />
          </div>

          <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
            <Toolbar editor={editor} />
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ImageUploadButton editor={editor} />
              <ImageUrlInsert editor={editor} />
            </div>
            <div className="tiptap-container">
              <EditorContent editor={editor} className={styles.editorContent} />
            </div>
          </div>
          <TitleCounter title={title} />
          <CharacterCounter editor={editor} />
        </div>
      </main>

      <style jsx global>{`
        .tiptap-container .tiptap {
          padding: 1.5rem;
          min-height: 400px;
          outline: none;
          color: black;
          background-color: white;
        }
        /* リンクの見た目とホバー時のポインタ */
        .tiptap-container .tiptap a, .editor-link {
          color: #2563eb !important;
          text-decoration: underline !important;
          cursor: pointer !important;
        }
        .tiptap-container .tiptap a:hover {
          color: #1d4ed8 !important;
        }
        .tiptap-container .tiptap ul { list-style-type: disc !important; padding-left: 2rem !important; margin: 1rem 0 !important; }
        .tiptap-container .tiptap ol { list-style-type: decimal !important; padding-left: 2rem !important; margin: 1rem 0 !important; }
        .tiptap-container .tiptap li p { margin: 0 !important; }
        .tiptap-container .tiptap u { text-decoration: underline !important; }
        .tiptap-container .tiptap strong { font-weight: bold !important; }
        .tiptap-container .tiptap em { font-style: italic !important; }
        .tiptap-container .tiptap p { margin-bottom: 1rem; }
      `}</style>
    </div>
  );
}