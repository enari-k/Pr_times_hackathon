// app/approve/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ApprovePage() {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState(''); // 🌟 コメント用のState

  // 現在のステータスとコメントを取得（3秒ごとに自動更新）
  const { data, isPending } = useQuery({
    queryKey: ['mock-status'],
    queryFn: async () => {
      const res = await fetch('/api/mock-status');
      return res.json();
    },
    refetchInterval: 3000,
  });

  // 他の人が書いたコメントがあれば入力欄にセットする
  useEffect(() => {
    if (data?.comment !== undefined && comment === '') {
      setComment(data.comment);
    }
  }, [data?.comment]);

  // 🌟 ステータスとコメントを同時に送信する処理
  const { mutate: updateStatus, isPending: isUpdating } = useMutation({
    mutationFn: async ({ status, text }: { status: string, text: string }) => {
      const res = await fetch('/api/mock-status', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comment: text })
      });
      if (!res.ok) throw new Error('送信失敗');
      return res.json();
    },
    onSuccess: () => {
      alert('処理が完了しました！エディタ画面を確認してください。');
      queryClient.invalidateQueries({ queryKey: ['mock-status'] });
    },
  });

  if (isPending) return <div style={{ padding: 40, textAlign: 'center' }}>読み込み中...</div>;

  const isApproved = data?.status === 'approved';
  const isRejected = data?.status === 'rejected';

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>プレスリリース承認画面</h1>
      
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <p style={{ fontSize: '16px', marginBottom: '10px' }}>現在のステータス</p>
        <span style={{
          padding: '8px 16px', borderRadius: '999px', fontSize: '18px', fontWeight: 'bold',
          backgroundColor: isApproved ? '#d1fae5' : isRejected ? '#fee2e2' : '#fef3c7',
          color: isApproved ? '#065f46' : isRejected ? '#991b1b' : '#92400e'
        }}>
          {isApproved ? '✅ 承認済み' : isRejected ? '❌ 差し戻し' : '⏳ 承認待ち'}
        </span>
      </div>

      {/* 🌟 コメント入力欄 */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>💬 フィードバック・コメント</label>
        <textarea 
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="修正点や承認のコメントを入力してください..."
          style={{ width: '100%', height: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px', outline: 'none' }}
        />
      </div>

      {/* 🌟 ボタンを2つ（差し戻し・承認）に分ける */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <button
          onClick={() => updateStatus({ status: 'rejected', text: comment })}
          disabled={isUpdating}
          style={{
            padding: '16px 32px', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: isUpdating ? 'not-allowed' : 'pointer',
            backgroundColor: '#ef4444', color: 'white', opacity: isUpdating ? 0.6 : 1
          }}
        >
          ❌ 差し戻す
        </button>
        
        <button
          onClick={() => updateStatus({ status: 'approved', text: comment })}
          disabled={isUpdating}
          style={{
            padding: '16px 32px', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: isUpdating ? 'not-allowed' : 'pointer',
            backgroundColor: '#10b981', color: 'white', opacity: isUpdating ? 0.6 : 1
          }}
        >
          ✅ 承認する
        </button>
      </div>
    </div>
  );
}