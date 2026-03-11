'use client';

import type { Editor } from '@tiptap/react';
import AIPreviewPanel from './AIPreviewPanel';

type Props = {
  editor: Editor | null;
  title: string;
  approverComment: string | null;
};

export default function AIFixPanel({ editor, title, approverComment }: Props) {
  if (!approverComment) return null;

  return (
    <AIPreviewPanel
      editor={editor}
      buttonIdleText="AIで修正"
      buttonGeneratingText="生成中..."
      buttonRegenText="再生成"
      generate={async () => {
        const text = editor?.getText() ?? '';
        const res = await fetch('/api/ai-fix-article', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, text, comment: approverComment }),
        });
        if (!res.ok) throw new Error('AI修正失敗');
        const data = await res.json();

        return {
          previewHtml: data.fixedContent || '',
          summary: data.summary || '',
        };
      }}
      headerSlot={
        <div style={{ marginBottom: 8, color: '#92400e', fontSize: 13 }}>
          承認者コメントをもとにAIが修正案を作成します。
        </div>
      }
    />
  );
}