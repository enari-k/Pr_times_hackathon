import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "あなたはPR TIMESの公認ライターです。初心者が入力した内容を元に、自社の強みが明確に伝わるプレスリリースを作成してください。出力はJSON形式で { \"title\": \"...\", \"content\": \"...\" } とし、contentはHTML形式（h2, p, strong, ul, liを使用）で出力してください。"
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'AI生成に失敗しました' }, { status: 500 });
  }
}