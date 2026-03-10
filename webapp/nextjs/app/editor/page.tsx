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
import Image from '@tiptap/extension-image';

// 🌟 ここを追加: mainブランチにあったリストとリンクの拡張機能を復活
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Link from '@tiptap/extension-link';

import CharacterCounter from '@/components/editor/counter/CharacterCounter';
import TitleCounter from '@/components/editor/counter/TitleCounter';
import ImageUploadButton from './media/ImageUploadButton';
import ImageUrlInsert from './media/ImageUrlInsert';
import { validateContent, validateTitle } from '@/utils/validation';

import type { PressRelease } from '@/lib/types';
import styles from './page.module.css';

const PRESS_RELEASE_ID = 1;
const queryKey = ['press-release', PRESS_RELEASE_ID];

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
      
      // 🌟 ここを追加: 保存時にステータスをdraftに戻す
      await fetch('/api/mock-status', { method: 'PUT' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['mock-status'] });
      // 🌟 ここを追加: 保存成功時のアラートを復活
      alert('保存しました！');
    },
  });
}

const Toolbar = ({ editor }: { editor: TiptapEditor | null }) => {
  if (!editor) return null;

  const getButtonStyle = (name: string) => {
    const isActive = editor.isActive(name);
    return `px-4 py-2 border rounded font-bold transition-colors ${
      isActive ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
    }`;
  };

  // 🌟 ここを追加: リンク設定用の関数を復活
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
    // 🌟 ここを変更: flex-wrapを追加してボタンが折り返されるように
    <div className="flex gap-2 p-3 border-b bg-gray-50 text-black flex-wrap">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={getButtonStyle('bold')}>B</button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={getButtonStyle('italic')}>I</button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={getButtonStyle('underline')}>U</button>

      {/* 🌟 ここを追加: リストとリンクのボタンを復活 */}
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

export default function EditorPage() {
  const { data, isPending, isError } = usePressReleaseQuery();

  if (isPending) return <div className={styles.container}><div className={styles.loading}>読み込み中...</div></div>;
  if (isError || !data) return <div className={styles.container}><div className={styles.error}>エラーが発生しました</div></div>;

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

  const titleRef = useRef(title);
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => setMounted(true), []);

  // 🌟 ステータスを3秒ごとに自動取得（別画面での承認を検知する）
  const { data: statusData } = useQuery({
    queryKey: ['mock-status'],
    queryFn: async () => {
      const res = await fetch('/api/mock-status');
      return res.json();
    },
    refetchInterval: 3000, 
  });
  const isApproved = statusData?.status === 'approved';

  const editor = useEditor({
    extensions: [
      Document, Heading, Paragraph, Text, Bold, Italic, Underline, Image,
      // 🌟 ここを追加: エディタ本体にもリストとリンクの拡張を登録
      BulletList,
      OrderedList,
      ListItem,
      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          class: 'editor-link',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
  });

  const { isPending: isSaving, mutate } = useSavePressReleaseMutation();

  // 🌟 ここを追加: 5秒ごとの自動保存ロジック（差分チェック付き）を復活
  const autosaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    if (!editor) return;
    
    lastSavedRef.current = JSON.stringify(editor.getJSON());
    if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);

autosaveTimerRef.current = setInterval(async () => {
      // 🌟 追加: 未承認の場合は、ここで処理を止めて自動保存を行わない
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
          console.log('📝 5秒ごとの自動保存が完了しました');
        }
      } catch (e) { 
        console.error('[autosave] error', e); 
      }
    }, 5000);

    return () => { if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current); };
  }, [editor]);


  const handleSave = async () => {
    if (!editor) return;
    const content = JSON.stringify(editor.getJSON());
    mutate({ title, content });
    lastSavedRef.current = content; // 🌟 ここを追加: 手動保存時にも前回保存分を更新
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

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 className={styles.title}>プレスリリースエディター</h1>
          
          {/* ステータスバッジ（リアルタイムで変わる！） */}
          <span style={{
            padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold',
            backgroundColor: isApproved ? '#d1fae5' : '#f3f4f6',
            color: isApproved ? '#065f46' : '#4b5563',
            transition: 'all 0.3s'
          }}>
            {isApproved ? '✅ 承認済み' : '✏️ 編集中 / 承認待ち'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* メール送信UI */}
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
              {isSendingEmail ? '送信中...' : '✉️ 承認依頼'}
            </button>
          </div>

          {/* 🌟 変更: 未承認の場合は保存ボタンを無効化し、マウスカーソルも禁止マークにする */}
          <button 
            onClick={handleSave} 
            className={styles.saveButton} 
            disabled={isSaving || !isApproved}
            style={{
              opacity: isSaving || !isApproved ? 0.5 : 1,
              cursor: isSaving || !isApproved ? 'not-allowed' : 'pointer'
            }}
            title={!isApproved ? '承認されるまで保存（公開）できません' : '保存する'}
          >
            {isSaving ? '保存中...' : '💾 保存'}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.editorWrapper}>
          <div className={styles.titleInputWrapper}>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトル" className={styles.titleInput} />
          </div>

          <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
            <Toolbar editor={editor} />
            <div style={{ margin: '12px 0', padding: '0 12px', display: 'flex', gap: 8 }}>
              <ImageUploadButton editor={editor} />
              <ImageUrlInsert editor={editor} />
            </div>
            <div className="tiptap-container"><EditorContent editor={editor} /></div>
          </div>
          <TitleCounter title={title} />
          <CharacterCounter editor={editor} />
        </div>
      </main>

      {/* 🌟 ここを追加: リストやリンクを正しく表示するためのCSSを復活 */}
      <style jsx global>{`
        .tiptap-container .tiptap {
          padding: 1rem;
          min-height: 400px;
          outline: none;
          color: black;
          background-color: white;
        }
        .tiptap-container .tiptap img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }
        .tiptap-container .tiptap a, .editor-link {
          color: #2563eb !important;
          text-decoration: underline !important;
          cursor: pointer !important;
        }
        .tiptap-container .tiptap a:hover { color: #1d4ed8 !important; }
        .tiptap-container .tiptap ul { list-style-type: disc !important; padding-left: 2rem !important; margin: 1rem 0 !important; }
        .tiptap-container .tiptap ol { list-style-type: decimal !important; padding-left: 2rem !important; margin: 1rem 0 !important; }
        .tiptap-container .tiptap li p { margin: 0 !important; }
        .tiptap-container .tiptap u { text-decoration: underline !important; }
        .tiptap-container .tiptap strong { font-weight: bold !important; }
        .tiptap-container .tiptap em { font-style: italic !important; }
        .tiptap-container .tiptap p { margin: 0 0 1rem 0 !important; }
      `}</style>
    </div>
  );
}