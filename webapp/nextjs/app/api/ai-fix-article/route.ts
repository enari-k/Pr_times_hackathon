import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const { title, text, comment } = await req.json();

  const prompt = `
# context
あなたはPR TIMESの公認ライターです。
ストーリーや企業の色が出るような記事を書くことをモットーにしています。

# 要件
修正前のプレスリリースの内容をもとに、承認者のコメントをヒントにして
企業のストーリーや色がより分かるような記事を書いてください。

# 出力形式
以下のようなJSON形式で出力してください：

{
 "summary": "修正の概要",
 "fixedContent": "修正済み本文"
}

fixedContentはHTML形式（h2, p, strong, ul, liを使用）で出力してください。
また、JSONは必ず有効な形式で出力してください。
文字列中のダブルクォートは \" のようにエスケープしてください。

# もとのプレスリリース
【タイトル】
${title}
【本文】
${text}
【承認者コメント】
${comment}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0].message.content;

  return NextResponse.json(JSON.parse(content || "{}"));
}