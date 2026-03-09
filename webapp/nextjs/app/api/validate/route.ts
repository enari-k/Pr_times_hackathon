import { NextRequest, NextResponse } from 'next/server';
import type { ErrorResponse } from '@/lib/types';

const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 500;

export async function POST(request: NextRequest) {
  let data: unknown;

  try {
    data = await request.json();
  } catch {
    return NextResponse.json(
      { code: 'INVALID_JSON', message: 'Invalid JSON' } satisfies ErrorResponse,
      { status: 400 }
    );
  }

  if (
    typeof data !== 'object' ||
    data === null ||
    !('title' in data) ||
    !('content' in data)
  ) {
    return NextResponse.json(
      { code: 'INVALID_REQUEST', message: 'Title and content are required' } satisfies ErrorResponse,
      { status: 400 }
    );
  }

  const { title, content } = data as { title: string; content: string };

  if (title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json(
      {
        code: 'TITLE_TOO_LONG',
        message: `Title must be <= ${MAX_TITLE_LENGTH} characters`,
      } satisfies ErrorResponse,
      { status: 400 }
    );
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      {
        code: 'CONTENT_TOO_LONG',
        message: `Content must be <= ${MAX_CONTENT_LENGTH} characters`,
      } satisfies ErrorResponse,
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}