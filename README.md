# hackathon2026-spring-press-release-editor

Hackathon 2026 Spring 向けに開発されたプレスリリースエディターアプリケーションです。
参加者向けの手順はこの README と `webapp/README.md` に集約しています。

## クイックスタート

### 1. バックエンド（Docker）を起動

```bash
cd webapp
docker compose up -d
```

### 2. フロントエンドを1つ選んで起動

Next.js 版:

```bash
cd webapp/nextjs
npm install
npm run dev
```

## プロジェクト構成

- **データベース**: PostgreSQL 16
- **バックエンド実装**（デフォルト: PHP）
  - ✅ Python 3.14（FastAPI）
- **フロントエンド**
  - ✅ Next.js

## 詳細情報

バックエンドAPI仕様・実装切り替え手順は以下を参照してください。

- [webapp/README.md](./webapp/README.md)

```
webapp/nextjs/
├── app/
│   ├── api/
│   │   ├── upload/        # [5-2] S3への画像アップロード用API
│   │   ├── save/          # [4系] 自動保存用のAPIエンドポイント
│   │   ├── import/        # [11, 12] Word/HTMLファイル解析・インポート用API
│   │   └── validate/      # [3-3] バックエンドのバリデーションAPI
│   └── editor/            # エディタ画面のメインページ
│       └── page.tsx
│
├── components/            # UIコンポーネント（ここで作業を分担するとスムーズです）
│   ├── editor/
│   │   ├── toolbar/       # [1-1〜1-3] 太字、リスト、リンク挿入などの装飾ボタン群
│   │   ├── media/         # [2-1〜2-6] 画像D&D、URL追加、複数画像アップロードUI
│   │   ├── counter/       # [3-1] 文字数表示コンポーネント
│   │   ├── import/        # [11, 12] Word/HTMLインポートのボタンやモーダル
│   │   └── plugins/       # [10] リンクカード追加UI
│   ├── comments/          # [9] コメント/レビュー機能のUI
│   ├── history/           # [7] 履歴復元機能のモーダルやリストUI
│   └── templates/         # [6] テンプレート選択UI
│
├── hooks/                 # Reactのカスタムフック（裏側のロジック担当）
│   ├── useAutoSave.ts     # [4-1〜4-3] 5秒ごと・差分検知・画像アップ後の自動保存ロジック
│   └── useCollab.ts       # [8] リアルタイム共同編集ロジック (WebSocketやYjsなど)
│
└── utils/                 # 便利関数（計算やチェック処理）
    ├── validation.ts      # [2-4, 3-2] 画像形式のチェックやフロントエンドの文字数バリデーション
    └── imageHelper.ts     # [2-5] 画像リサイズ処理などのヘルパー関数
```
