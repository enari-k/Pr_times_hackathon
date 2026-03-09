'use client';

import { useCallback, useState } from 'react';
import type { Editor } from '@tiptap/react';

type Props = {
  editor: Editor | null;
};

export default function ImageUrlInsert({ editor }: Props) {
  const [url, setUrl] = useState('');

  const insert = useCallback(() => {
    if (!editor) return;
    const trimmed = url.trim();
    if (!trimmed) return;
    try {
      const u = new URL(trimmed);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        alert('http/httpsのURLを入力してください');
        return;
      }
    } catch {
      alert('URLの形式が正しくありません');
      return;
    }

    editor.chain().focus().setImage({ src: trimmed }).run();
    setUrl('');
  }, [editor, url]);

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      insert();
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="画像URLを入力"
        style={{
          flex: 1,
          padding: '10px 12px',
          border: '1px solid #ddd',
          borderRadius: 8,
        }}
      />
      <button
        type="button"
        onClick={insert}
        disabled={!editor || url.trim().length === 0}
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #ddd',
          background: '#fff',
          cursor: 'pointer',
        }}
      >
        追加
      </button>
    </div>
  );
}