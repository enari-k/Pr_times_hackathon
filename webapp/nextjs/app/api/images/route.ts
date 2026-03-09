import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '@/lib/s3';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file');

  if (!(file instanceof File)) {
    return new Response('file is required', { status: 400 });
  }

  const contentType = file.type || 'application/octet-stream';
  const bytes = Buffer.from(await file.arrayBuffer());

  // 衝突しないキーを作る
  const safeName = file.name.replace(/[^\w.\-]+/g, '_');
  const key = `images/${Date.now()}-${safeName}`;

  // S3へPutObject
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: bytes,
      ContentType: contentType,
    })
  );

  // DBへINSERT（bytesは持たない）
  const pool = getPool();
  const result = await pool.query<{ id: number }>(
    `INSERT INTO images (content_type, s3_key)
     VALUES ($1, $2)
     RETURNING id`,
    [contentType, key]
  );

  const id = result.rows[0].id;

  // tiptapに挿すURLは、このGET APIを使うのが簡単
  return Response.json({
    id,
    url: `/api/images/${id}`,
  });
}