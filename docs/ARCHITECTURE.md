# アーキテクチャ

このドキュメントでは、プロジェクトの技術的なアーキテクチャについて説明します。

## 技術スタック概要

| カテゴリ | 技術 | 役割 |
|---------|------|------|
| フレームワーク | Astro 5.16.6 | スタティックサイトジェネレーション |
| スタイリング | Tailwind CSS 4.1.18 | ユーティリティファーストCSS |
| ビルドツール | Vite | 開発サーバー・バンドリング |
| 言語 | TypeScript | 型安全な開発 |
| パッケージマネージャー | pnpm | 高速・効率的な依存管理 |
| リンター/フォーマッター | Biome 2.3.11 | コード品質管理 |
| テスティング | Vitest + Playwright | ユニット・E2E テスト |
| デプロイ先 | Cloudflare Workers | エッジコンピューティング |

## ディレクトリ構造

```
/
├── .claude/                    # Claude Code 設定・ドキュメント
│   └── CLAUDE.md              # プロジェクト概要・開発ガイド
│
├── .github/
│   └── workflows/
│       └── pull-request.yml   # 自動 PR 作成ワークフロー
│
├── .serena/                   # Serena MCP サーバー設定
│
├── .vscode/                   # VSCode 設定
│
├── docs/                      # プロジェクトドキュメント
│   ├── ARCHITECTURE.md        # このファイル
│   ├── DEPLOYMENT.md          # デプロイ手順
│   ├── STYLE_GUIDE.md         # スタイルガイド
│   └── TROUBLESHOOTING.md     # トラブルシューティング
│
├── public/                    # 静的ファイル（ルートで配信）
│   └── favicon.svg
│
├── src/
│   ├── assets/                # 画像・静的リソース（最適化対象）
│   │   ├── astro.svg
│   │   └── background.svg
│   │
│   ├── components/            # 再利用可能な Astro コンポーネント
│   │   ├── Breadcrumb.astro
│   │   └── Welcome.astro
│   │
│   ├── layouts/               # ページレイアウトテンプレート
│   │   └── Layout.astro       # ベース HTML レイアウト
│   │
│   ├── pages/                 # ファイルベースルーティング
│   │   └── index.astro        # ホームページ (/)
│   │
│   └── styles/
│       └── global.css         # グローバルスタイル（Tailwind import）
│
├── tests/                     # E2E テスト
│   └── example.spec.ts
│
├── astro.config.mjs           # Astro 設定
├── biome.json                 # Biome 設定
├── package.json               # 依存関係・スクリプト
├── playwright.config.ts       # Playwright 設定
├── pnpm-workspace.yaml        # pnpm ワークスペース設定
├── tsconfig.json              # TypeScript 設定
├── vitest.config.ts           # Vitest 設定
└── wrangler.jsonc             # Cloudflare Workers 設定
```

## データフロー

### ビルドプロセス

```
開発時:
┌─────────────┐
│ src/pages/  │
│ *.astro     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Astro       │
│ Compiler    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Vite Dev    │
│ Server      │
└──────┬──────┘
       │
       ▼
  localhost:4321

本番ビルド:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ src/        │ --> │ Astro       │ --> │ ./dist/     │
│ (コンテンツ) │     │ Build       │     │ (静的HTML)   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ Cloudflare  │
                                        │ Workers     │
                                        └─────────────┘
```

### コンポーネントレンダリング

1. **ファイルベースルーティング**: `src/pages/` 内のファイルが URL パスにマッピング
   - `src/pages/index.astro` → `/`
   - `src/pages/about.astro` → `/about`

2. **レイアウト適用**: ページが `src/layouts/Layout.astro` を使用
   - HTML 骨格の提供
   - グローバルスタイルのインポート
   - メタデータの設定

3. **コンポーネント合成**: レイアウト内でページコンポーネントをレンダリング

4. **静的生成**: ビルド時に HTML に変換

## 主要な設計パターン

### 1. ファイルベースルーティング

Astro のファイルベースルーティングを使用し、`src/pages/` 内のファイル構造が URL 構造に対応します。

```
src/pages/
├── index.astro          → /
├── about.astro          → /about
└── blog/
    ├── index.astro      → /blog
    └── [slug].astro     → /blog/:slug
```

### 2. コンポーネント駆動開発

再利用可能なコンポーネントを `src/components/` に配置し、複数のページで使用します。

```astro
---
// src/components/Button.astro
interface Props {
	text: string;
	onClick?: () => void;
}

const { text, onClick } = Astro.props;
---

<button class="px-4 py-2 bg-blue-500 text-white rounded" onclick={onClick}>
	{text}
</button>
```

### 3. レイアウトシステム

共通の HTML 構造を `src/layouts/` に配置し、ページ間で再利用します。

```astro
---
// src/layouts/Layout.astro
interface Props {
	title: string;
	description?: string;
}

const { title, description } = Astro.props;
---

<!doctype html>
<html lang="ja">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width" />
		<title>{title}</title>
		{description && <meta name="description" content={description} />}
	</head>
	<body>
		<slot />
	</body>
</html>
```

### 4. スタイリング戦略

- **Tailwind CSS**: ユーティリティクラスによる高速なスタイリング
- **グローバルスタイル**: `src/styles/global.css` でベーススタイルを定義
- **コンポーネントスコープ**: Astro の `<style>` タグでコンポーネント固有のスタイル

## 依存関係グラフ

### コア依存関係

```
astro
├── @astrojs/sitemap        # サイトマップ生成
├── @tailwindcss/vite       # Tailwind CSS 統合
└── tailwindcss             # スタイリングフレームワーク

開発依存関係
├── @biomejs/biome          # リンター・フォーマッター
├── vitest                  # ユニットテスト
├── @playwright/test        # E2E テスト
└── wrangler                # Cloudflare Workers CLI
```

### ビルド依存関係の流れ

```
pnpm install
    │
    ▼
Astro + Tailwind + TypeScript
    │
    ▼
pnpm build (astro build)
    │
    ├─ TypeScript コンパイル
    ├─ Tailwind CSS 処理
    ├─ 画像最適化 (Sharp)
    └─ HTML 生成
    │
    ▼
./dist/ (静的ファイル)
    │
    ▼
wrangler deploy
    │
    ▼
Cloudflare Workers
```

## パフォーマンス最適化

### 1. ビルド時最適化

- **静的生成**: すべてのページをビルド時に HTML に変換
- **画像最適化**: Sharp による自動画像最適化
- **CSS Purging**: 未使用の Tailwind CSS クラスを削除
- **コード分割**: Vite による自動コード分割

### 2. ランタイム最適化

- **ゼロ JavaScript**: デフォルトで JavaScript を送信しない
- **部分的水和**: 必要なコンポーネントのみをインタラクティブに
- **エッジデリバリー**: Cloudflare Workers によるグローバル配信

### 3. 開発体験最適化

- **高速 HMR**: Vite による瞬時のホットリロード
- **TypeScript**: 型安全による開発時エラー検出
- **Biome**: 高速なリンティング・フォーマット

## セキュリティ

### 1. ビルド時セキュリティ

- **依存関係スキャン**: pnpm による脆弱性チェック
- **TypeScript strict mode**: 型安全性の強化
- **静的サイト**: サーバーサイド攻撃ベクトルの排除

### 2. デプロイ時セキュリティ

- **HTTPS**: Cloudflare による自動 HTTPS
- **DDoS 保護**: Cloudflare による自動保護
- **エッジセキュリティ**: Cloudflare Workers のサンドボックス環境

## スケーラビリティ

### 1. コンテンツスケーラビリティ

- **静的生成**: ページ数に関わらず高速配信
- **CDN キャッシング**: Cloudflare エッジネットワークによるキャッシング
- **効率的ビルド**: インクリメンタルビルドのサポート

### 2. 開発チームスケーラビリティ

- **コンポーネントベース**: 並行開発可能な構造
- **型安全**: TypeScript による大規模開発のサポート
- **自動化**: CI/CD による効率的なワークフロー

## 拡張性

### 今後の拡張ポイント

1. **Content Collections**: マークダウンコンテンツの管理
2. **API ルート**: サーバーサイドロジックの追加
3. **国際化 (i18n)**: 多言語対応
4. **検索機能**: Pagefind 統合
5. **RSS フィード**: ブログフィード生成
6. **アナリティクス**: トラッキング統合

## 参考資料

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev)
