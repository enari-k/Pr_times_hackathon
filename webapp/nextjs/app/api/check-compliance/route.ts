// app/api/check-compliance/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'テキストがありません' }, { status: 400 });
    }

    // OpenAI APIを直接呼び出す（追加パッケージ不要）
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // 速度が速く、ハッカソンに最適な軽量モデル
        messages: [
          {
            role: 'system',
            content: `あなたは企業の厳格なコンプライアンス担当者です。
入力されるプレスリリースの内容に、以下の公開してはいけない情報が含まれていないかチェックしてください。
- 個人情報（特定の個人の電話番号、詳細な住所、マイナンバーなど）
- クレジットカード番号や口座情報
- 「社外秘」「極秘」「内部用」などの機密を匂わせるワード
- 開発中のダミーURL（localhostやテスト環境のURLなど）

【回答ルール】
・問題が全くない場合は「OK」という2文字だけを返してください。
・問題がある可能性がある場合は、その該当箇所と理由を簡潔に列挙してください。`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1, // 回答のブレを少なくする
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content.trim();

    return NextResponse.json({ result });
  } catch (error) {
    console.error('AI Check Error:', error);
    return NextResponse.json({ error: 'AIによる解析に失敗しました' }, { status: 500 });
  }
}