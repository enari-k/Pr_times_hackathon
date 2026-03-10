import { getPool } from '@/lib/db';
import { s3 } from '@/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';

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
  const result = await pool.query<{ content_type: string; s3_key: string }>(
    'SELECT content_type, s3_key FROM images WHERE id = $1',
    [Number(id)]
  );

  if (result.rows.length === 0) {
    return new Response('Not Found', { status: 404 });
  }

  const row = result.rows[0];

  const obj = await s3.send(
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: row.s3_key,
    })
  );

  return new Response(obj.Body as any, {
    status: 200,
    headers: {
      'Content-Type': row.content_type,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}