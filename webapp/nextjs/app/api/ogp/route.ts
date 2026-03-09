import { NextRequest, NextResponse } from "next/server";

import ogs from "open-graph-scraper";

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json(
      { message: "URL is required" },
      { status: 400 }
    );
  }

  try {
    const { result } = await ogs({ url });

    return NextResponse.json({
      title: result.ogTitle,
      description: result.ogDescription,
      image: result.ogImage?.[0]?.url,
      url,
    });
  } catch {
    return NextResponse.json(
      { message: "OGP取得失敗" },
      { status: 500 }
    );
  }
}