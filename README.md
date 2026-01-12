# ta93abe.com

個人ポートフォリオサイト。Astro + Tailwind CSS + TypeScript で構築し、Cloudflare Workers にデプロイしています。

## 技術スタック

- **フレームワーク**: [Astro](https://astro.build) v5
- **スタイリング**: [Tailwind CSS](https://tailwindcss.com) v4
- **言語**: TypeScript (strict mode)
- **Linter/Formatter**: [Biome](https://biomejs.dev)
- **デプロイ**: Cloudflare Workers

## 開発

```bash
# 依存関係のインストール
pnpm install

# 開発サーバー起動 (localhost:4321)
pnpm dev

# 本番ビルド
pnpm build

# ビルドのプレビュー
pnpm preview
```

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `pnpm dev` | 開発サーバー起動 |
| `pnpm build` | 本番ビルド (`./dist/`) |
| `pnpm preview` | ビルドプレビュー |
| `pnpm assist` | Biome 自動修正 + リンティング |
| `pnpm lint` | リンティング |
| `pnpm format` | コード整形 |
| `pnpm test` | Vitest でユニットテスト実行 |
| `pnpm test:e2e` | Playwright で E2E テスト実行 |
| `pnpm deploy` | Cloudflare Workers にデプロイ |

## プロジェクト構造

```
src/
├── assets/          # 画像・静的リソース
├── components/      # Astro コンポーネント
│   ├── landing/     # ランディングページ用
│   └── blog/        # ブログ用
├── content/         # コンテンツコレクション
│   ├── about/       # About ページ用
│   ├── blog/        # ブログ記事
│   ├── books/       # 読書記録
│   ├── talks/       # 登壇情報
│   └── works/       # 作品・プロジェクト
├── layouts/         # ページレイアウト
├── pages/           # ファイルベースルーティング
├── styles/          # グローバルスタイル
└── utils/           # ユーティリティ関数
```

## デプロイ

Cloudflare Workers へのデプロイ:

```bash
pnpm deploy
```

## ライセンス

MIT
