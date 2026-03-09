'use client';

import { useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';

type Props = { editor: Editor | null };

export default function ImageUploadButton({ editor }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const pick = () => inputRef.current?.click();

  const onChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    if (!editor) return;

    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);

      // ✅ ここを /api/images にする
      const res = await fetch('/api/images', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) throw new Error(await res.text());

      const data: { url: string; id?: number } = await res.json();

      editor.chain().focus().setImage({ src: data.url }).run();
    } catch (err: any) {
      alert(err?.message ?? 'アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <button
        type="button"
        onClick={pick}
        disabled={!editor || isUploading}
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #ddd',
          background: '#fff',
          cursor: 'pointer',
        }}
      >
        {isUploading ? 'アップロード中...' : '画像アップロード'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} />
    </div>
  );
}