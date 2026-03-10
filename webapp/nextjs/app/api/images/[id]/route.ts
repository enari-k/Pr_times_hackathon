import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return new Response('Invalid id', { status: 400 });
  }

  const pool = getPool();
  const result = await pool.query<{ content_type: string; bytes: Buffer }>(
    'SELECT content_type, bytes FROM images WHERE id = $1',
    [Number(id)]
  );

  if (result.rows.length === 0) {
    return new Response('Not Found', { status: 404 });
  }

  const row = result.rows[0];
  const body = new Uint8Array(row.bytes);

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': row.content_type,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}