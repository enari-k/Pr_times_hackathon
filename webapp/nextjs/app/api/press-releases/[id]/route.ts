import { NextRequest, NextResponse } from 'next/server';
import { getPool, formatTimestamp } from '@/lib/db';
import { PressReleaseInputSchema } from '@/lib/validation';
import type { PressRelease, ErrorResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;

  if (!/^\d+$/.test(idParam) || parseInt(idParam, 10) <= 0) {
    return NextResponse.json(
      { code: 'INVALID_ID', message: 'Invalid ID' } satisfies ErrorResponse,
      { status: 400 }
    );
  }

  const id = parseInt(idParam, 10);

  try {
    const pool = getPool();
    const result = await pool.query<{
      id: number;
      title: string;
      content: string;
      created_at: Date;
      updated_at: Date;
    }>(
      'SELECT id, title, content, created_at, updated_at FROM press_releases WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: 'Press release not found' } satisfies ErrorResponse,
        { status: 404 }
      );
    }

    const row = result.rows[0];
    const data: PressRelease = {
      id: row.id,
      title: row.title,
      content: row.content,
      created_at: formatTimestamp(new Date(row.created_at)),
      updated_at: formatTimestamp(new Date(row.updated_at)),
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;

  if (!/^\d+$/.test(idParam) || parseInt(idParam, 10) <= 0) {
    return NextResponse.json(
      { code: 'INVALID_ID', message: 'Invalid ID' } satisfies ErrorResponse,
      { status: 400 }
    );
  }

  const id = parseInt(idParam, 10);
  const contentType = request.headers.get('content-type') ?? '';

  try {
    const pool = getPool();
    const checkResult = await pool.query('SELECT id FROM press_releases WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: 'Press release not found' } satisfies ErrorResponse,
        { status: 404 }
      );
    }

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file');

      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: 'file is required' }, { status: 400 });
      }
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'invalid file type' }, { status: 400 });
      }

      const MAX = 10 * 1024 * 1024;
      if (file.size > MAX) {
        return NextResponse.json({ error: 'file too large' }, { status: 413 });
      }

      const bytes = Buffer.from(await file.arrayBuffer());

      const ins = await pool.query<{ id: number }>(
        `INSERT INTO images (filename, content_type, bytes)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [file.name, file.type, bytes]
      );

      const imageId = ins.rows[0].id;
      return NextResponse.json({ id: imageId, url: `/api/images/${imageId}` });
    }

    let bodyText: string;
    try {
      bodyText = await request.text();
    } catch {
      return NextResponse.json(
        { code: 'INVALID_JSON', message: 'Invalid JSON' } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    if (bodyText.trim() === '') {
      return NextResponse.json(
        { code: 'INVALID_JSON', message: 'Invalid JSON' } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(bodyText);
    } catch {
      return NextResponse.json(
        { code: 'INVALID_JSON', message: 'Invalid JSON' } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    const validationResult = PressReleaseInputSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        { code: 'MISSING_REQUIRED_FIELDS', message: 'Title and content are required' } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    const { title, content } = validationResult.data;

    await pool.query(
      'UPDATE press_releases SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [title, content, id]
    );

    const result = await pool.query<{
      id: number;
      title: string;
      content: string;
      created_at: Date;
      updated_at: Date;
    }>(
      'SELECT id, title, content, created_at, updated_at FROM press_releases WHERE id = $1',
      [id]
    );

    const row = result.rows[0];
    const responseData: PressRelease = {
      id: row.id,
      title: row.title,
      content: row.content,
      created_at: formatTimestamp(new Date(row.created_at)),
      updated_at: formatTimestamp(new Date(row.updated_at)),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}