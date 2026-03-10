'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ApprovePage() {
  const queryClient = useQueryClient();

  // 現在のステータスを取得
  const { data, isPending } = useQuery({
    queryKey: ['mock-status'],
    queryFn: async () => {
      const res = await fetch('/api/mock-status');
      return res.json();
    },
  });

  // 承認APIを叩く
  const { mutate: approve, isPending: isApproving } = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/mock-status', { method: 'POST' });
      if (!res.ok) throw new Error('承認失敗');
      return res.json();
    },
    onSuccess: () => {
      alert('記事を承認しました！');
      queryClient.invalidateQueries({ queryKey: ['mock-status'] });
    },
  });

  if (isPending) return <div style={{ padding: 40, textAlign: 'center' }}>読み込み中...</div>;

  const isApproved = data?.status === 'approved';

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>プレスリリース承認画面</h1>
      
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <p style={{ fontSize: '18px', marginBottom: '10px' }}>現在のステータス</p>
        <span style={{
          padding: '8px 16px', borderRadius: '999px', fontSize: '18px', fontWeight: 'bold',
          backgroundColor: isApproved ? '#d1fae5' : '#fef3c7',
          color: isApproved ? '#065f46' : '#92400e'
        }}>
          {isApproved ? '✅ 承認済み' : '⏳ 承認待ち'}
        </span>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => approve()}
          disabled={isApproved || isApproving}
          style={{
            padding: '16px 40px', fontSize: '18px', fontWeight: 'bold', border: 'none', borderRadius: '8px',
            cursor: (isApproved || isApproving) ? 'not-allowed' : 'pointer',
            backgroundColor: isApproved ? '#9ca3af' : '#10b981', color: 'white',
            transition: 'background-color 0.2s'
          }}
        >
          {isApproving ? '処理中...' : isApproved ? '承認完了' : 'この記事を承認する'}
        </button>
      </div>
    </div>
  );
}