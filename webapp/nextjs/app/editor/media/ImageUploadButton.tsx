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
      // 🚨 S3(API)を使わず、ブラウザ上で画像をBase64文字列に変換する緊急回避策
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          // 変換したBase64文字列をそのままTiptapのエディタに流し込む
          editor.chain().focus().setImage({ src: dataUrl }).run();
        }
        setIsUploading(false);
      };
      
      reader.onerror = () => {
        alert('画像の読み込みに失敗しました');
        setIsUploading(false);
      };

      // ファイルの読み込み開始
      reader.readAsDataURL(file);

    } catch (err: any) {
      alert(err?.message ?? '画像の挿入に失敗しました');
      console.error(err);
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
        {isUploading ? '読み込み中...' : 'クリックで選択 / ここに画像をドラッグ&ドロップ'}
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