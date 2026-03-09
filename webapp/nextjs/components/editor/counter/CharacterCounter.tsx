'use client';

import { Editor } from '@tiptap/react';
import { useEffect, useState } from 'react';

interface Props {
  editor: Editor | null;
}

export default function CharacterCounter({ editor }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!editor) return;

    const updateCount = () => {
      const text = editor.getText();
      setCount(text.length);
    };

    updateCount();

    editor.on('update', updateCount);

    return () => {
      editor.off('update', updateCount);
    };
  }, [editor]);

  return (
    <div>
      文字数: {count}
    </div>
  );
}