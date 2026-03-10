'use client';

import { useState } from 'react';
import type { Editor } from '@tiptap/react';

type Props = {
  editor: Editor | null;
  title: string;
  approverComment: string | null;
};

export default function AIFixPanel({ editor, title, approverComment }: Props) {
  const [isFixingAI, setIsFixingAI] = useState(false);
  const [summary, setSummary] = useState('');

  if (!approverComment) return null;

  const handleFix = async () => {
    if (!editor) return;

    const text = editor.getText();
    setIsFixingAI(true);

    try {
      const res = await fetch('/api/ai-fix-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, text, comment: approverComment }),
      });

      if (!res.ok) throw new Error('AI修正失敗');

      const data = await res.json();

      if (data.fixedContent) {
        editor.commands.setContent(data.fixedContent);
      }

      setSummary(data.summary || '');
    } catch (e) {
      console.error(e);
      alert('AI修正に失敗しました');
    } finally {
      setIsFixingAI(false);
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <button
        onClick={handleFix}
        disabled={isFixingAI}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: 'none',
          fontWeight: 'bold',
          backgroundColor: '#10b981',
          color: 'white',
          cursor: isFixingAI ? 'not-allowed' : 'pointer',
          opacity: isFixingAI ? 0.5 : 1
        }}
      >
        {isFixingAI ? 'AI修正中...' : 'AIで修正'}
      </button>

      {summary && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#ecfeff',
            border: '1px solid #06b6d4',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <b>AI修正の概要</b>
          <p style={{ marginTop: '6px', whiteSpace: 'pre-wrap' }}>
            {summary}
          </p>
        </div>
      )}
    </div>
  );
}