// app/api/send-approval/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email, title, pressReleaseId } = await req.json();

    if (!email || !title) {
      return NextResponse.json({ error: 'メールアドレスとタイトルは必須です' }, { status: 400 });
    }

    // GmailなどのSMTPサーバーの設定
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true, // 465番ポートの場合はtrue
      auth: {
        user: process.env.SMTP_USER, // あなたのGmailアドレス等
        pass: process.env.SMTP_PASS, // Gmailのアプリパスワード等
      },
    });

    // 承認画面のURL (本番環境のドメインを環境変数から取得、なければlocalhost)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const approvalUrl = `${baseUrl}/approve`;

    // メールの内容
    const mailOptions = {
      from: `"PR エディター" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '【承認依頼】プレスリリースの確認をお願いします',
      text: `以下のプレスリリースの承認依頼が届きました。\n\nタイトル: ${title}\n\n以下のURLより確認・承認を行ってください。\n${approvalUrl}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>プレスリリースの承認依頼</h2>
          <p>以下のプレスリリースの承認依頼が届きました。</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>タイトル:</strong> ${title}</p>
          </div>
          <a href="${baseUrl}/readpreview" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">記事を確認する</a>
          <a href="${approvalUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">承認画面へ移動する</a>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'メールを送信しました' }, { status: 200 });
  } catch (error) {
    console.error('メール送信エラー:', error);
    return NextResponse.json({ error: 'メールの送信に失敗しました' }, { status: 500 });
  }
}