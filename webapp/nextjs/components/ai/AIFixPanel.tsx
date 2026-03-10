'use client';

import { useState } from 'react';
import type { Editor } from '@tiptap/react';

type Props = {
  editor: Editor | null;
  title: string;
  approverComment: string | null;
};

type State = 'idle' | 'generating' | 'review';

export default function AIFixPanel({ editor, title, approverComment }: Props) {
  const [state, setState] = useState<State>('idle');
  const [summary, setSummary] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');

  if (!approverComment) return null;

  const handleGenerate = async () => {
    if (!editor) return;

    const text = editor.getText();
    setState('generating');

    try {
      const res = await fetch('/api/ai-fix-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, text, comment: approverComment }),
      });

      if (!res.ok) throw new Error('AI修正失敗');

      const data = await res.json();

      setPreviewHtml(data.fixedContent || '');
      setSummary(data.summary || '');

      setState('review');
    } catch (e) {
      console.error(e);
      alert('AI修正に失敗しました');
      setState('idle');
    }
  };

  const handleAccept = () => {
    if (!editor) return;

    editor.commands.setContent(previewHtml);

    setPreviewHtml('');
    setSummary('');
    setState('idle');
  };

  const handleReject = () => {
    setPreviewHtml('');
    setSummary('');
    setState('idle');
  };

  return (
    <div style={{ marginBottom: '16px' }}>

      {/* 修正ボタン */}
      <button
        onClick={handleGenerate}
        disabled={state === 'generating'}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: 'none',
          fontWeight: 'bold',
          backgroundColor: '#10b981',
          color: 'white',
          cursor: state === 'generating' ? 'not-allowed' : 'pointer',
          opacity: state === 'generating' ? 0.5 : 1
        }}
      >
        {state === 'generating'
          ? '生成中...'
          : state === 'review'
          ? '再生成'
          : 'AIで修正'}
      </button>

      {/* 承認待ちパネル */}
      {state === 'review' && (
        <div
          style={{
            marginTop: '12px',
            padding: '16px',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5f5',
            borderRadius: '8px'
          }}
        >
          {summary && (
            <>
              <b>AI修正の概要</b>
              <p style={{ marginTop: '6px', whiteSpace: 'pre-wrap' }}>
                {summary}
              </p>
            </>
          )}

          <div
            style={{
              marginTop: '12px',
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              background: 'white',
              maxHeight: '300px',
              overflow: 'auto'
            }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />

          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAccept}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              採用
            </button>

            <button
              onClick={handleReject}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                fontWeight: 'bold'
              }}
            >
              不採用
            </button>
          </div>
        </div>
      )}
    </div>
  );
}