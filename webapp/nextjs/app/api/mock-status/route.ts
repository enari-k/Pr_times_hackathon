// app/api/mock-status/route.ts
import { NextResponse } from 'next/server';

// サーバーのメモリ上にステータスを保持する（PM2が動いている限り記憶されます）
const globalStore = globalThis as unknown as { currentStatus: string };
if (!globalStore.currentStatus) {
  globalStore.currentStatus = 'draft'; // 初期状態は下書き
}

// ステータスを取得する
export async function GET() {
  return NextResponse.json({ status: globalStore.currentStatus });
}

// 承認する（ステータスを approved にする）
export async function POST() {
  globalStore.currentStatus = 'approved';
  return NextResponse.json({ status: globalStore.currentStatus });
}

// 編集されたら下書きに戻す（必要に応じて）
export async function PUT() {
  globalStore.currentStatus = 'draft';
  return NextResponse.json({ status: globalStore.currentStatus });
}