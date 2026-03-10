import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '@/lib/s3';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
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

    // 🔍 デバッグ: 環境変数が取れているか確認
    console.log("Bucket name:", process.env.S3_BUCKET);
    console.log("Attempting to upload to S3...");

    // S3へPutObject
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: bytes,
        ContentType: contentType,
      })
    );
    console.log("S3 upload successful!");

    // DBへINSERT
    const pool = getPool();
    const result = await pool.query<{ id: number }>(
      `INSERT INTO images (content_type, s3_key)
       VALUES ($1, $2)
       RETURNING id`,
      [contentType, key]
    );

    const id = result.rows[0].id;
    console.log("DB insert successful! ID:", id);

    return Response.json({
      id,
      url: `/api/images/${id}`,
    });
    
  } catch (error: any) {
    // 🚨 ここでエラーの正体をターミナルに吐き出させます
    console.error("❌ S3/DB アップロードエラー:", error);
    
    // フロントエンドにもエラーメッセージを返す
    return new Response(
      JSON.stringify({ 
        error: 'アップロードに失敗しました', 
        details: error.message || String(error) 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}