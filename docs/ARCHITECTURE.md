# アーキテクチャ

このドキュメントでは、プロジェクトの技術的なアーキテクチャについて説明します。

## 技術スタック概要

| カテゴリ | 技術 | 役割 |
|---------|------|------|
| フレームワーク | Astro 7 | スタティックサイトジェネレーション |
| スタイリング | Tailwind CSS 4 | ユーティリティファースト CSS |
| ビルドツール | Vite 8 | 開発サーバー・バンドリング |
| 言語 | TypeScript | 型安全な開発 |
| パッケージマネージャー | pnpm | 高速・効率的な依存管理 |
| リンター/フォーマッター | Oxlint / Oxfmt | コード品質管理 |
| テスティング | Vitest + Playwright | ユニット・E2E テスト |
| CMS | Sveltia CMS | Git ベースのコンテンツ編集 |
| デプロイ先 | Cloudflare Workers | エッジ配信 + Worker ロジック |

## ディレクトリ構造

```text
/
├── .github/workflows/       # perf / playwright / infra
├── docs/                    # プロジェクトドキュメント
├── infra/                   # Alchemy による Cloudflare リソース
├── perf/                    # Lighthouse / CWV budgets
├── public/                  # 静的ファイル・admin CMS・media
├── src/
│   ├── components/          # UI / landing / blog / creative
│   ├── config/              # site.ts / navigation.ts
│   ├── content/             # blog / gallery / atelier / books
│   ├── layouts/Layout.astro
│   ├── pages/               # ファイルベースルーティング
│   ├── styles/global.css
│   └── utils/               # schema / OG 生成など
├── worker/                  # Cloudflare Worker エントリ
├── astro.config.mjs
├── package.json
├── vitest.config.ts
├── playwright.config.ts
└── wrangler.jsonc
```

## ルーティング

```text
src/pages/
├── index.astro              → /
├── gallery/                 → /gallery, /gallery/:id
├── atelier/                 → /atelier, /atelier/:id
├── bookshelf/               → /bookshelf, /bookshelf/:id
├── blog/                    → /blog, /blog/:id
├── links.astro              → /links
├── tools.astro              → /tools
├── slides.astro             → /slides
├── og/                      → 動的 OG 画像
├── rss.xml.ts               → /rss.xml
└── 404.astro
```

互換のため `/works` と `/works/:id` は `/gallery` 系へリダイレクトする（`astro.config.mjs`）。

## データフロー

### ビルドプロセス

```text
開発時:  src/pages → Astro Compiler → Vite Dev Server → localhost:4321
本番:    src/ → astro build → ./dist → Cloudflare Workers (worker + assets)
```

### コンテンツ

1. **Content Collections** (`src/content/` + `src/content.config.ts`) で型付きコンテンツを管理
2. **Sveltia CMS** (`public/admin/`) から Git 経由で編集
3. ビルド時に静的 HTML / 画像最適化 / sitemap を生成

## 主要な設計パターン

### 1. ファイルベースルーティング

`src/pages/` の構造が URL に対応する。

### 2. レイアウトシステム

`src/layouts/Layout.astro` が HTML 骨格・SEO meta・Header/Footer を提供する。

### 3. スタイリング戦略

- Tailwind CSS ユーティリティ
- `src/styles/global.css` のデザイントークン（CSS 変数）
- コンポーネントスコープの `<style>`

### 4. Worker 拡張

`worker/index.ts` が静的アセット配信に加え、Agent discovery（`/.well-known/*`、`/agent/auth` など）を担当する。

## 依存関係の流れ

```text
pnpm install
    → Astro + Tailwind + TypeScript
    → pnpm build (astro build)
    → ./dist
    → wrangler deploy / Alchemy infra
    → Cloudflare Workers
```

## パフォーマンス

- ビルド時の静的生成・画像最適化・CSS tree-shaking
- 必要な島のみクライアント JS（React / Framer Motion）
- Cloudflare エッジ配信
- `perf/` + `.github/workflows/perf.yml` で Lighthouse / CWV を監視

## セキュリティ

- TypeScript strict
- Astro CSP 設定
- Cloudflare HTTPS / DDoS 保護
- Worker サンドボックス

## 拡張ポイント

1. 本番コンテンツの差し替え（gallery / atelier / books）
2. CMS の books コレクション対応
3. Agent Readiness 残タスク（DNS-AID など）
4. x402 / tip エンドポイント（インフラ・シークレット前提）

## 参考資料

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev)
