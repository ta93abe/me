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
| CMS                     | git 上の MDX（`src/content/blog/`）              | ADR-0003。Astro の content collection と `@astrojs/mdx` でビルド時に描画 |
| デプロイ先              | Cloudflare Workers                               | エッジ配信 + Worker ロジック                                           |

## ディレクトリ構造

```text
/
├── .github/workflows/       # perf / playwright / infra
├── docs/                    # プロジェクトドキュメント
├── infra/                   # Alchemy による Cloudflare リソース
├── perf/                    # Lighthouse / CWV budgets
├── public/                  # 静的ファイル・media
├── src/
│   ├── components/          # UI / landing / blog / creative
│   ├── config/              # site.ts / navigation.ts
│   ├── layouts/Layout.astro, SlideDeck.astro
│   ├── pages/               # ファイルベースルーティング
│   ├── slides/              # デッキ MDX / MDX プラグイン / プレイヤー
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
├── about.astro              → /about
├── works.astro              → /works
├── blog/                    → /blog, /blog/:id
├── contact.astro            → /contact
├── links.astro              → /links
├── tools.astro              → /tools
├── talks.astro              → /talks
├── slides/                  → /slides, /slides/:slug, /slides/:slug/print
├── og/                      → 動的 OG 画像
├── rss.xml.ts               → /rss.xml
└── 404.astro
```

`/gallery` `/atelier` `/bookshelf` は公開コンテンツができるまで `/` へリダイレクトする（`src/middleware.ts` と `astro.config.mjs`）。`/sitemap.xml`・`/sitemap-index.xml`・`/sitemap_index.xml` はいずれも 200 で同じ sitemap index を返す（Search Console が `/sitemap.xml` の 301 を読めないため。`src/middleware.ts` と Worker）。`/works` は代表作ページ。

## データフロー

### ビルドプロセス

```text
開発時:  src/pages → Astro Compiler → Vite Dev Server → localhost:4321
本番:    src/ → astro build → ./dist → Cloudflare Workers (worker + assets)
```

### コンテンツ

ブログ（ADR-0003）:

1. 公開本文の正は `src/content/blog/<slug>.mdx`。スキーマは `src/content.config.ts`（`title` / `excerpt` / `tags` / `date` / `updatedDate`、未知キーはビルド失敗）
2. `/blog/` と `/blog/:slug/` はビルド時に描画する（SSG）。コードは Prism（クラスベース）
3. URL だけの段落は `remark-blog-embeds` が `<BlogEmbed />` に置き換え、ビルド時に X / YouTube / Spotify / リンクカードを取得して静的 HTML にする。X のポストは `<Tweet id|url />` でも書ける（スライドと共通。`docs/slides-authoring.md`）。ブログだけ `<Tweet id="..." live />` で、閲覧時に X の widgets.js を読み公式の埋め込みに差し替える（opt-in。`dnt: true`。CSP の script-src はその記事にだけ `https://platform.twitter.com` を足し、frame-src は全体で許可）
4. `/og/blog/:slug.png` と `/sitemap-blog.xml` はビルド時に生成する。`/rss.xml` は on-demand（Worker のサーバービルドを必ず出すため）
5. Worker の llms.txt / llms-full.txt / MCP / sitemap index は、ビルド時に出す `/blog.json` を ASSETS から読む
6. 画像は公開 R2 `me-images`（`images.ta93abe.com`）

その他のコンテンツ（TA-2152、移行中）:

1. 1 項目 1 ファイルの MDX にする。今は Works（`src/content/works/`）、Links（`src/content/links/`）、Talks（`src/content/talks/`）、Gadgets（`src/content/gadgets/`）。Works・Links・Gadgets の並び順は frontmatter の `order`（重複はビルド失敗）。Talks は `date` の新しい順で、slug はファイル名
2. ページとコンポーネントは `src/lib/content/site-collections.ts`（`getWorks` / `getLinks` / `getProfileUrls` / `getTalks` / `getTalk` / `getGadgets` / `getGadget`）から読む。JSON-LD の `sameAs` は Links の URL。Talk の `slideSlug` とデッキの `talkSlug` の食い違いはユニットテストで落とす（`src/lib/talks/slide-crosslinks.ts`）
3. Worker は、ビルド時に出す `/site.json` を ASSETS から読む（`worker/content/site-manifest.ts`）。llms-full.txt の代表作と SNS、Gadget 詳細に Markdown alternate を出すかどうか（`indexableGadgetSlugs`）
4. sitemap（`src/utils/sitemap-lastmod.ts`）は `astro:content` を読めないので、Talk の `date` と Gadget の `indexable: true` を MDX から正規表現で読む

旧経路（pubme → Content API → 非公開 R2 → Queue `content-events`）は外した（TA-1899）。非公開 R2 `me-content` はスライド PDF の置き場としてだけ使う。

## 主要な設計パターン

### 1. ファイルベースルーティング

`src/pages/` の構造が URL に対応する。

### 2. レイアウトシステム

`src/layouts/Layout.astro` が HTML 骨格・SEO meta・Header/Footer を提供する。

### 3. スタイリング戦略

- Tailwind CSS ユーティリティ
- `src/styles/global.css` のデザイントークン（CSS 変数）
- コンポーネントスコープの `<style>`
- `/` の見た目とモーションは [ADR-0001](https://linear.app/ta93abe/document/adr-0001-トップは紫基調のスクロール物語にする-5f56f22268fc)（紫基調のスクロール物語。他ページの紙白は維持。正は Linear）

### 4. Worker 拡張

`worker/index.ts` が静的アセット配信に加え、Agent discovery（`/.well-known/*`、`/agent/auth` など）とスライド PDF（`/slides/<slug>.pdf`）を担当する。`run_worker_first: true`。

`/mcp` は MCP Streamable HTTP（2025-06-18）。server-card の `transport.type` は `streamable-http`。POST の JSON-RPC は `Accept: text/event-stream` なら SSE（`event: message`）、それ以外は `application/json`。通知とクライアント応答は 202。初期化応答に `Mcp-Session-Id` を付けるが Worker はステートレスで検証しない。GET はスタンドアロン SSE を提供せず 405 + `Allow: POST`（`text/plain`）。OPTIONS は 204 と CORS（`Access-Control-Allow-Origin: *`）。GET/POST 応答にも同じ CORS を付ける。

デッキ MDX は Git `src/slides/decks/`（ADR-0002）。書き方は `docs/slides-authoring.md`、PDF は `docs/slides-pdf.md`。

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
- HSTS: `public/_headers` と `worker/security-headers.ts`（手順は `docs/hsts-cloudflare.md`、TA-1133）
- Cloudflare HTTPS / DDoS 保護
- Worker サンドボックス

## 拡張ポイント

1. ブラウザから記事を編集する `/admin`（TA-1898）
2. ブログ・スライド以外のコンテンツも MDX にする（TA-2152）
3. Agent Readiness 残タスク（DNS-AID など）

## 参考資料

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev)
