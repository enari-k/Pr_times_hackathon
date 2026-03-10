// app/api/mock-status/route.ts
import { NextResponse } from 'next/server';

// 🌟 コメントも一緒に保存できるように拡張
const globalStore = globalThis as unknown as { currentStatus: string; currentComment: string };
if (!globalStore.currentStatus) {
  globalStore.currentStatus = 'draft';
  globalStore.currentComment = '';
}

export async function GET() {
  return NextResponse.json({ 
    status: globalStore.currentStatus, 
    comment: globalStore.currentComment 
  });
}

// 🌟 JSONでステータスとコメントを受け取るように変更
export async function POST(req: Request) {
  try {
    const body = await req.json();
    globalStore.currentStatus = body.status || 'approved';
    if (body.comment !== undefined) {
      globalStore.currentComment = body.comment;
    }
    return NextResponse.json({ status: globalStore.currentStatus, comment: globalStore.currentComment });
  } catch (e) {
    globalStore.currentStatus = 'approved';
    return NextResponse.json({ status: globalStore.currentStatus, comment: globalStore.currentComment });
  }
}

export async function PUT() {
  globalStore.currentStatus = 'draft';
  // 編集開始でdraftに戻っても、コメントは「修正指示」として残しておく
  return NextResponse.json({ status: globalStore.currentStatus, comment: globalStore.currentComment });
}