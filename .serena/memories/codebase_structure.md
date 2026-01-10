# コードベース構造

## ディレクトリ構成

```
/
├── .astro/               # Astro生成ファイル（自動生成）
├── .claude/              # Claude Code設定・ドキュメント
│   └── CLAUDE.md        # プロジェクト指示書
├── .github/
│   └── workflows/
│       └── pull-request.yml  # 自動PR作成ワークフロー
├── .serena/             # Serena MCPサーバーの設定・メモリファイル
├── .vscode/             # VSCode設定
├── dist/                # ビルド出力（自動生成）
├── node_modules/        # 依存関係
├── public/              # 静的ファイル（ルートで配信）
│   └── favicon.svg
├── src/                 # ソースコード
│   ├── __tests__/       # テストファイル
│   ├── assets/          # 画像・静的リソース
│   ├── components/      # 再利用可能なAstroコンポーネント
│   ├── content/         # コンテンツコレクション
│   │   ├── about/       # About情報
│   │   ├── blog/        # ブログ記事
│   │   ├── books/       # 読書記録
│   │   ├── talks/       # 登壇情報
│   │   └── works/       # プロジェクト作品
│   ├── layouts/         # ページレイアウトテンプレート
│   ├── pages/           # ファイルベースルーティング
│   │   ├── blog/        # ブログページ
│   │   ├── bookshelf/   # 読書ページ
│   │   └── works/       # 作品ページ
│   ├── styles/          # スタイルファイル
│   └── utils/           # ユーティリティ関数
├── tests/               # E2Eテスト
├── astro.config.mjs     # Astro設定
├── biome.json           # Biome設定
├── package.json         # 依存関係・スクリプト
├── playwright.config.ts # Playwright設定
├── tsconfig.json        # TypeScript設定
├── vitest.config.ts     # Vitest設定
└── wrangler.jsonc       # Cloudflare Workers設定
```

## 主要ディレクトリの詳細

### `/src/pages/` - ルーティング
ファイルベースルーティング。ファイル名がURLパスになる。

**主要ページ:**
- `index.astro` - ホームページ (/)
- `about.astro` - Aboutページ (/about)
- `blog/index.astro` - ブログ一覧 (/blog)
- `blog/[id].astro` - ブログ詳細 (/blog/[id])
- `bookshelf/index.astro` - 読書一覧 (/bookshelf)
- `bookshelf/[id].astro` - 読書詳細 (/bookshelf/[id])
- `works/index.astro` - 作品一覧 (/works)
- `works/[id].astro` - 作品詳細 (/works/[id])
- `tools.astro` - ツールページ (/tools)
- `talks.astro` - 登壇情報 (/talks)
- `links.astro` - リンク集 (/links)
- `qiita.astro` - Qiita統合 (/qiita)
- `404.astro` - 404エラーページ

### `/src/components/` - コンポーネント
再利用可能なUIコンポーネント。

**主要コンポーネント:**
- `Header.astro` - ヘッダー
- `Footer.astro` - フッター
- `Welcome.astro` - ウェルカムセクション
- `SnsLinks.astro` - SNSリンク
- `Breadcrumb.astro` - パンくずリスト
- `Skeleton.astro` - スケルトンローダー

### `/src/layouts/` - レイアウト
ページ共通のHTMLテンプレート。

**主要レイアウト:**
- `Layout.astro` - メインレイアウト（HTML head/body）

### `/src/content/` - コンテンツコレクション
Astroのコンテンツコレクション機能を使用。

**コレクション:**
- `about/` - About情報（Markdown）
- `blog/` - ブログ記事（Markdown）
- `books/` - 読書記録（Markdown）
- `works/` - プロジェクト作品（Markdown）
- `talks/` - 登壇情報（JSON）

**設定:**
- `content.config.ts` - コレクションスキーマ定義

### `/src/utils/` - ユーティリティ
汎用的な関数。

**ファイル:**
- `date.ts` - 日付フォーマット関数
- `books.ts` - 読書データ処理関数

### `/src/styles/` - スタイル
グローバルCSS。

**ファイル:**
- `global.css` - グローバルスタイル、Tailwind CSS import

### `/src/assets/` - 静的リソース
画像やSVGなどの静的ファイル。

### `/src/__tests__/` - テスト
ユニットテスト。

**ファイル:**
- `rss-loader.test.ts` - RSS読み込みテスト

### `/tests/` - E2Eテスト
Playwrightによるエンドツーエンドテスト。

### `/public/` - 公開ファイル
ビルド時にルートディレクトリにコピーされる静的ファイル。

**ファイル:**
- `favicon.svg` - ファビコン
- その他の静的アセット

## 設定ファイル

### `astro.config.mjs`
- Astro本体の設定
- サイトURL: https://ta93abe.com
- インテグレーション: sitemap, pagefind
- Vite設定: Tailwind CSSプラグイン
- ビルド最適化設定

### `biome.json`
- コード品質設定
- フォーマット: タブインデント、ダブルクォート
- リンター: 推奨ルール有効
- Git統合、インポート自動整理

### `tsconfig.json`
- TypeScript設定
- Astro strictモード継承
- `dist/` を除外

### `wrangler.jsonc`
- Cloudflare Workers設定
- ワーカー名: "me"
- アセットディレクトリ: "./dist"
- 互換性日付: 2026-01-01

### `vitest.config.ts`
- Vitestユニットテスト設定

### `playwright.config.ts`
- Playwright E2Eテスト設定

### `package.json`
- プロジェクトメタデータ
- 依存関係
- npm scripts

### `pnpm-workspace.yaml`
- pnpmワークスペース設定

## 開発フロー

1. **ページ追加**: `src/pages/` に `.astro` ファイルを作成
2. **コンポーネント作成**: `src/components/` に再利用可能なコンポーネントを作成
3. **コンテンツ追加**: `src/content/` に Markdown ファイルを追加
4. **ユーティリティ関数**: `src/utils/` に共通関数を作成
5. **スタイリング**: Tailwind CSSクラスを使用、必要に応じて `<style>` タグ
6. **テスト**: `src/__tests__/` または `tests/` にテストを追加
