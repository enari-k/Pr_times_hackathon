// app/preview/page.tsx
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEditor, EditorContent } from '@tiptap/react';

// エディタ表示に必要な拡張機能
import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Link from '@tiptap/extension-link';

import NextLink from 'next/link';
import type { PressRelease } from '@/lib/types';

const PRESS_RELEASE_ID = 1;

export default function PreviewPage() {
  // 保存された最新のデータを取得
  const { data, isPending, isError } = useQuery({
    queryKey: ['press-release', PRESS_RELEASE_ID],
    queryFn: async (): Promise<PressRelease> => {
      const response = await fetch(`/api/press-releases/${PRESS_RELEASE_ID}`);
      if (!response.ok) throw new Error('取得失敗');
      return response.json();
    },
  });

  if (isPending) return <div style={{ padding: 40, textAlign: 'center' }}>読み込み中...</div>;
  if (isError || !data) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>データの読み込みに失敗しました</div>;

  let initialContent: any = '';
  if (data.content) {
    if (typeof data.content === 'string') {
      try { initialContent = JSON.parse(data.content); } catch { initialContent = data.content; }
    } else { initialContent = data.content; }
  }

  return <PreviewRenderer title={data.title} content={initialContent} />;
}

function PreviewRenderer({ title, content }: { title: string; content: any }) {
  // 🌟 編集不可（editable: false）のエディタとして初期化
  const editor = useEditor({
    extensions: [
      Document, Heading, Paragraph, Text, Bold, Italic, Underline, Image,
      BulletList, OrderedList, ListItem,
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
    content: content,
    editable: false, // 👈 これが超重要！
    immediatelyRender: false,
  });

  if (!editor) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      {/* 戻るボタンとヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <NextLink 
          href="/editor" 
          style={{
            padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', 
            backgroundColor: '#ffffff', color: '#374151', fontWeight: 'bold', 
            textDecoration: 'none', display: 'inline-block', fontSize: '14px',
          }}
        >
          編集に戻る
        </NextLink>
        <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: 'bold' }}>
          プレビューモード
        </span>
      </div>

      {/* 実際の記事のような表示枠 */}
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
        
        {/* 記事タイトル */}
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', borderBottom: '2px solid #f3f4f6', paddingBottom: '16px' }}>
          {title || '無題のプレスリリース'}
        </h1>

        {/* 記事本文（Tiptapのレンダラー） */}
        <div className="preview-container">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* CSSはエディタと同じものを当てて、見た目を完全に一致させる */}
      <style jsx global>{`
        .preview-container .tiptap {
          outline: none;
          color: #1f2937;
          line-height: 1.8;
          font-size: 16px;
        }
        .preview-container .tiptap img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 20px 0;
        }
        .preview-container .tiptap a, .editor-link {
          color: #2563eb !important;
          text-decoration: underline !important;
          cursor: pointer !important;
        }
        .preview-container .tiptap ul { list-style-type: disc !important; padding-left: 2rem !important; margin: 1rem 0 !important; }
        .preview-container .tiptap ol { list-style-type: decimal !important; padding-left: 2rem !important; margin: 1rem 0 !important; }
        .preview-container .tiptap li p { margin: 0 !important; }
        .preview-container .tiptap u { text-decoration: underline !important; }
        .preview-container .tiptap strong { font-weight: bold !important; }
        .preview-container .tiptap em { font-style: italic !important; }
        .preview-container .tiptap p { margin: 0 0 1rem 0 !important; }
      `}</style>
    </div>
  );
}