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
