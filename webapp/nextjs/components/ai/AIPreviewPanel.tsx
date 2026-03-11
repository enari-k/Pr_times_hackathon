'use client';

import { useState } from 'react';
import type { Editor } from '@tiptap/react';

type State = 'idle' | 'generating' | 'review';

type GenerateResult = {
  previewHtml: string;
  summary?: string;
  nextTitle?: string;
};

type Props = {
  editor: Editor | null;

  /** ボタン表示 */
  buttonIdleText: string;
  buttonGeneratingText?: string;
  buttonRegenText?: string;

  /** 生成を実行して、プレビュー用HTML等を返す */
  generate: () => Promise<GenerateResult>;

  /** 採用時：タイトルも更新したい場合に使う */
  onAcceptTitle?: (title: string) => void;

  /** 生成ボタン活性/非活性（例：promptが空なら無効） */
  canGenerate?: boolean;

  /** 任意：生成ボタンの上や下に置く補足UI */
  headerSlot?: React.ReactNode;
};

export default function AIPreviewPanel({
  editor,
  buttonIdleText,
  buttonGeneratingText = '生成中...',
  buttonRegenText = '再生成',
  generate,
  onAcceptTitle,
  canGenerate = true,
  headerSlot,
}: Props) {
  const [state, setState] = useState<State>('idle');
  const [summary, setSummary] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [nextTitle, setNextTitle] = useState<string>('');

  const handleGenerate = async () => {
    if (!editor) return;
    if (!canGenerate) return;

    setState('generating');
    try {
      const result = await generate();
      setPreviewHtml(result.previewHtml || '');
      setSummary(result.summary || '');
      setNextTitle(result.nextTitle || '');
      setState('review');
    } catch (e) {
      console.error(e);
      alert('AI生成に失敗しました');
      setState('idle');
    }
  };

  const handleAccept = () => {
    if (!editor) return;

    // HTMLをそのままセット（TipTapがパース）
    editor.commands.setContent(previewHtml);

    // タイトル更新が必要なら
    if (nextTitle && onAcceptTitle) onAcceptTitle(nextTitle);

    setPreviewHtml('');
    setSummary('');
    setNextTitle('');
    setState('idle');
  };

  const handleReject = () => {
    setPreviewHtml('');
    setSummary('');
    setNextTitle('');
    setState('idle');
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {headerSlot}

      <button
        onClick={handleGenerate}
        disabled={state === 'generating' || !canGenerate}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: 'none',
          fontWeight: 'bold',
          backgroundColor: '#4f46e5',
          color: 'white',
          cursor: state === 'generating' || !canGenerate ? 'not-allowed' : 'pointer',
          opacity: state === 'generating' || !canGenerate ? 0.5 : 1,
        }}
      >
        {state === 'generating'
          ? buttonGeneratingText
          : state === 'review'
          ? buttonRegenText
          : buttonIdleText}
      </button>

      {state === 'review' && (
        <div
          style={{
            marginTop: '12px',
            padding: '16px',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5f5',
            borderRadius: '8px',
          }}
        >
          {(nextTitle || summary) && (
            <div style={{ marginBottom: '12px' }}>
              {nextTitle && (
                <>
                  <b>AI生成結果</b>
                  <p style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{nextTitle}</p>
                </>
              )}
              {summary && (
                <>
                  <b>AI生成の概要</b>
                  <p style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{summary}</p>
                </>
              )}
            </div>
          )}

          <div
            style={{
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              background: 'white',
              maxHeight: '300px',
              overflow: 'auto',
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
                fontWeight: 'bold',
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
                fontWeight: 'bold',
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