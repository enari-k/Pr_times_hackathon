'use client';

import React, { useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';

type Props = { editor: Editor | null };

export default function ImageUploadButton({ editor }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const pick = () => {
    if (isUploading) return;
    inputRef.current?.click();
  };

  const upload = async (file: File) => {
    if (!editor) return;
    if (isUploading) return;

    if (!file.type?.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file); // API側: formData.get('file')

      const res = await fetch('/api/images', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `アップロードに失敗しました (${res.status})`);
      }

      const data = (await res.json()) as { url?: string; id?: number };
      if (!data.url) throw new Error('アップロードAPIの戻り値に url がありません');

      editor.chain().focus().setImage({ src: data.url }).run();
    } catch (err: any) {
      alert(err?.message ?? 'アップロードに失敗しました');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const onChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];

    // 同じファイルを連続で選択しても change が出るようにクリア
    e.target.value = '';

    if (!file) return;
    await upload(file);
  };

  // D&D：onDragOverでpreventDefaultしないとdropできない
  const onDragOver: React.DragEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
  };

  const onDragEnter: React.DragEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave: React.DragEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const onDrop: React.DragEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    setIsDragOver(false);

    if (!editor) return;
    if (isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    await upload(file);
  };

  return (
    <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <button
        type="button"
        onClick={pick}
        disabled={!editor || isUploading}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #ddd',
          background: isDragOver ? '#f3f4f6' : '#fff',
          cursor: !editor || isUploading ? 'not-allowed' : 'pointer',
          outline: isDragOver ? '2px dashed #3b82f6' : 'none',
          outlineOffset: 2,
          opacity: !editor || isUploading ? 0.6 : 1,
        }}
        title="クリックで選択 / ここに画像をドラッグ&ドロップ"
      >
        {isUploading ? 'アップロード中...' : 'クリックで選択 / ここに画像をドラッグ&ドロップ'}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}