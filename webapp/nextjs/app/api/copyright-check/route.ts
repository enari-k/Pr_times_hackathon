import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const client = new OpenAI({
  apiKey: "", // ここにAPIkeyを設定
})

export async function POST(req: NextRequest) {
  const { content } = await req.json()

  if (!content) {
    return NextResponse.json(
      { status: "error", message: "content is required" },
      { status: 400 }
    )
  }

  try {
    const prompt = `
次の文章を著作権の観点からチェックしてください。

チェック内容
- 他サイト記事の転載の可能性
- 長すぎる引用
- 出典なし引用
- 歌詞、書籍、ニュース記事の転載

問題がある可能性がある箇所を抽出してください。

必ず次のJSON形式で返してください:

{
  "status": "success" | "warning",
  "message": "説明",
  "details": [
    {
      "text": "問題の文章",
      "reason": "理由"
    }
  ]
}

文章:
${content}
`

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    })

    const text = response.output_text

    const json = JSON.parse(text)

    return NextResponse.json(json)
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        status: "error",
        message: "著作権チェックに失敗しました",
      },
      { status: 500 }
    )
  }
}