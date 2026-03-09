'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
// リスト拡張機能
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';

import type { PressRelease } from '@/lib/types';
import styles from './page.module.css';

const PRESS_RELEASE_ID = 1;
const queryKey = ['press-release', PRESS_RELEASE_ID];

// --- データ取得 ---
function usePressReleaseQuery() {
  return useQuery({
    queryKey,
    queryFn: async (): Promise<PressRelease> => {
      const response = await fetch(`/api/press-releases/${PRESS_RELEASE_ID}`);
      if (!response.ok) {
        throw new Error(`HTTPエラー: ${response.status}`);
      }
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }
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
const Toolbar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const getButtonStyle = (name: string) => {
    const isActive = editor.isActive(name);
    return `px-3 py-2 border rounded font-bold transition-colors ${
      isActive 
        ? 'bg-blue-600 text-white border-blue-700' 
        : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
    }`;
  };

  return (
    <div className="flex gap-2 p-3 border-b bg-gray-50 text-black flex-wrap">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={getButtonStyle('bold')}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={getButtonStyle('italic')}
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={getButtonStyle('underline')}
      >
        U
      </button>
      
      {/* リストボタン */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={getButtonStyle('bulletList')}
      >
        • 箇条書き
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={getButtonStyle('orderedList')}
      >
        1. 番号付き
      </button>
    </div>
  );
};

// --- メインページ ---
export default function EditorPage() {
  const { data, isPending, isError } = usePressReleaseQuery();

  if (isPending) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>データの読み込みに失敗しました</div>
      </div>
    );
  }

  let initialContent = '';
  try {
    initialContent = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
  } catch (e) {
    initialContent = data.content;
  }

  return <Editor initialTitle={data.title} initialContent={initialContent} />;
}

interface EditorProps {
  initialTitle: string;
  initialContent: any;
}

function Editor({ initialTitle, initialContent }: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      Document,
      Heading,
      Paragraph,
      Text,
      Bold,
      Italic,
      Underline,
      // リスト拡張機能の登録
      BulletList,
      OrderedList,
      ListItem,
    ],
    content: initialContent,
    immediatelyRender: false,
  });

  const { isPending: isSaving, mutate } = useSavePressReleaseMutation();

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const handleSave = () => {
    if (!editor) return;

    if (!title.trim()) {
      alert("タイトルを入力してください");
      return;
    }

    mutate({
      title,
      content: JSON.stringify(editor.getJSON()),
    });
  };

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>プレスリリースエディター</h1>
        <button onClick={handleSave} className={styles.saveButton} disabled={isSaving}>
          {isSaving ? '保存中...' : '保存'}
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.editorWrapper}>
          <div className={styles.titleInputWrapper}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトルを入力してください"
              className={styles.titleInput}
            />
          </div>
          
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
            <Toolbar editor={editor} />
            <div className="tiptap-container">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        /* エディタ入力エリアの基本設定 */
        .tiptap-container .tiptap {
          padding: 1.5rem;
          min-height: 400px;
          outline: none;
          color: black;
          background-color: white;
        }

        /* 箇条書き (ul) のスタイル */
        .tiptap-container .tiptap ul {
          list-style-type: disc !important;
          padding-left: 2rem !important;
          margin: 1rem 0 !important;
        }

        /* 番号付きリスト (ol) のスタイル */
        .tiptap-container .tiptap ol {
          list-style-type: decimal !important;
          padding-left: 2rem !important;
          margin: 1rem 0 !important;
        }

        /* リスト項目 (li) 内の段落余白を調整 */
        .tiptap-container .tiptap li p {
          margin: 0 !important;
        }

        /* その他の基本装飾 */
        .tiptap-container .tiptap u { text-decoration: underline !important; }
        .tiptap-container .tiptap strong { font-weight: bold !important; }
        .tiptap-container .tiptap em { font-style: italic !important; }
        .tiptap-container .tiptap p { margin-bottom: 1rem; }
      `}</style>
    </div>
  );
}