'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEditor, EditorContent, type Editor as TiptapEditor } from '@tiptap/react';

import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';

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
      if (!response.ok) throw new Error(`HTTPエラー: ${response.status}`);
      return response.json();
    },
  });
}

// --- 保存処理（手動保存） ---
function useSavePressReleaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const response = await fetch(`/api/press-releases/${PRESS_RELEASE_ID}`, {
        method: 'POST', // 上書きならPUT/PATCH推奨（API側に合わせてOK）
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
    return `px-4 py-2 border rounded font-bold transition-colors ${
      isActive
        ? 'bg-blue-600 text-white border-blue-700'
        : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
    }`;
  };

  return (
    <div className="flex gap-2 p-3 border-b bg-gray-50 text-black">
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

  // tiptapのcontentは「JSONオブジェクト」か「HTML文字列」
  let initialContent: any = '';
if (data.content != null) {
  if (typeof data.content === 'string') {
    try {
      initialContent = JSON.parse(data.content);
    } catch {
      initialContent = data.content;
    }
  } else {
    initialContent = data.content;
  }
}

  return (
    <PressReleaseEditor initialTitle={data.title ?? ''} initialContent={initialContent} />
  );
}

interface EditorProps {
  initialTitle: string;
  initialContent: any; // tiptapのJSON/HTML想定。厳密化したければJSONContent型などにできます
}

function PressReleaseEditor({ initialTitle, initialContent }: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [mounted, setMounted] = useState(false);

  // 最新タイトルをinterval内で参照するため
  const titleRef = useRef(title);
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => setMounted(true), []);

  const editor = useEditor({
    extensions: [Document, Heading, Paragraph, Text, Bold, Italic, Underline],
    content: initialContent,
    immediatelyRender: false,
  });

  const { isPending: isSaving, mutate } = useSavePressReleaseMutation();
const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  if (!editor) return;

  // 既に動いてたら止める（重複防止）
  if (autosaveTimerRef.current) {
    clearInterval(autosaveTimerRef.current);
  }

  autosaveTimerRef.current = setInterval(() => {
    // autosave
  }, 5000);

  return () => {
    if (autosaveTimerRef.current) {
      clearInterval(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  };
}, [editor]);

  const handleSave = () => {
    if (!editor) return;

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
        .tiptap-container .tiptap {
          padding: 1rem;
          min-height: 400px;
          outline: none;
          color: black;
        }
        .tiptap-container .tiptap u {
          text-decoration: underline !important;
        }
        .tiptap-container .tiptap strong {
          font-weight: bold !important;
        }
        .tiptap-container .tiptap em {
          font-style: italic !important;
        }
        .tiptap-container .tiptap p {
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}