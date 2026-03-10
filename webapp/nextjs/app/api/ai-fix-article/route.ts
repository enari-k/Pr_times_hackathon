import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const { title, text, comment } = await req.json();

  const prompt = `
あなたは優秀な編集者です。

以下のプレスリリースを
承認者のコメントに基づいて修正してください。

【タイトル】
${title}

【本文】
${text}

【承認者コメント】
${comment}

出力形式：

{
 "summary": "修正の概要",
 "fixedContent": "修正済み本文"
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0].message.content;

  return NextResponse.json(JSON.parse(content || "{}"));
}