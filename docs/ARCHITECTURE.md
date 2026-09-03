# アーキテクチャ

このドキュメントでは、プロジェクトの技術的なアーキテクチャについて説明します。

## 技術スタック概要

| カテゴリ                | 技術                                             | 役割                                                                   |
| ----------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| フレームワーク          | Astro 7                                          | スタティックサイトジェネレーション                                     |
| スタイリング            | Tailwind CSS 4                                   | ユーティリティファースト CSS                                           |
| ビルドツール            | Vite 8                                           | 開発サーバー・バンドリング                                             |
| 言語                    | TypeScript                                       | 型安全な開発                                                           |
| パッケージマネージャー  | pnpm                                             | 高速・効率的な依存管理                                                 |
| リンター/フォーマッター | Oxlint / Oxfmt                                   | コード品質管理                                                         |
| テスティング            | Vitest + Playwright                              | ユニット・E2E テスト                                                   |
| CMS                     | Obsidian プラグイン（pubme）→ 非公開 R2 → Worker | 本文は Vault から HMAC Worker 経由で `me-content` へ。Git はコードだけ |
| デプロイ先              | Cloudflare Workers                               | エッジ配信 + Worker ロジック                                           |

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
├── blog/                    → /blog, /blog/:id
├── links.astro              → /links
├── tools.astro              → /tools
├── slides.astro             → /slides
├── og/                      → 動的 OG 画像
├── rss.xml.ts               → /rss.xml
└── 404.astro
```

`/gallery` `/atelier` `/bookshelf` `/works` は公開コンテンツができるまで `/` へリダイレクトする（`src/middleware.ts` と `astro.config.mjs`）。Content API のコレクション契約はそのまま。

## データフロー

### ビルドプロセス

```text
開発時:  src/pages → Astro Compiler → Vite Dev Server → localhost:4321
本番:    src/ → astro build → ./dist → Cloudflare Workers (worker + assets)
```

### コンテンツ

段階 3（blog の R2 読み）:

1. 公開本文は非公開 R2 `me-content`（`md/{collection}/{slug}.md`）
2. `PUT` / `DELETE /api/content/:collection/:slug` は HMAC-SHA256（本文 + パス + 時刻、時計ずれ 5 分）
3. 失敗は 400 で R2 に書かない。成功時と Queue `content-events`（`md/` の create/delete）で index を冪等再構築
4. 添付は公開 R2 `me-images` の `content/{collection}/{slug}/...`
5. `GET /api/content/schema` がプラグイン検証用 JSON Schema
6. `/blog` と `/blog/:slug` は `@astrojs/cloudflare` の on-demand で R2 を読む。Markdown は Prism。`Cache-Control` + Queue の HTML キャッシュ purge
7. Git に残る MDX（`dbt-jobs-composite-action.mdx`）は v1 で R2 に載せられないので、一覧・詳細の後退として残す

gallery / atelier / books のサイトページはいったん外している。Worker Content API のコレクション契約と `src/content` の原稿は残す。Sveltia は増強しない。契約は `docs/CONTENT_API.md`。

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

`worker/index.ts` が静的アセット配信に加え、Agent discovery（`/.well-known/*`、`/agent/auth` など）と Content API（`/api/content/*`）を担当する。`run_worker_first: true`。

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

1. Content API 段階 1（curl で PUT/GET と index）の本番投入
2. pubme から本番 Worker へ Publish / Unpublish
3. blog 一覧・詳細の R2 読み（Astro hybrid）
4. gallery / atelier / books を同じ経路に
5. RSS / sitemap / llms / OG を index に接続
6. 本番記事を移行し、`src/content` と Sveltia を外す
7. Agent Readiness 残タスク（DNS-AID など）

## 参考資料

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev)
