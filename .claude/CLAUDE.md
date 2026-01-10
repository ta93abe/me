# Personal Portfolio Website

個人ポートフォリオ/ランディングページプロジェクト。Astro + Tailwind CSS + TypeScriptで構築され、Cloudflare Workersにデプロイされます。

## プロジェクト概要

このプロジェクトは、モダンなスタティックサイトジェネレータ(Astro)を使用した個人ウェブサイトです。高速なページロード、優れた開発体験、そしてCloudflareエッジネットワークでのグローバル配信を実現しています。

### 技術スタック

| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| フレームワーク | Astro | ^5.16.6 |
| スタイリング | Tailwind CSS | ^4.1.18 |
| ビルドツール | Vite | (Astroに内包) |
| パッケージマネージャー | pnpm | Latest |
| リンター/フォーマッター | Biome | 2.3.11 |
| デプロイ | Cloudflare Workers | Wrangler |
| 言語 | TypeScript | (Astro strict設定) |

## プロジェクト構造

```
/
├── .claude/                    # Claude Code設定・ドキュメント
│   └── CLAUDE.md              # このファイル
├── .github/
│   └── workflows/
│       └── pull-request.yml   # 自動PR作成ワークフロー
├── docs/                       # プロジェクトドキュメント
│   ├── ARCHITECTURE.md        # 技術アーキテクチャ
│   ├── DEPLOYMENT.md          # デプロイ手順
│   ├── STYLE_GUIDE.md         # コーディング規約
│   └── TROUBLESHOOTING.md     # トラブルシューティング
├── public/
│   └── favicon.svg            # 静的ファイル(ルートで配信)
├── src/
│   ├── assets/                # 画像・静的リソース
│   │   ├── astro.svg
│   │   └── background.svg
│   ├── components/            # 再利用可能なAstroコンポーネント
│   │   └── Welcome.astro
│   ├── layouts/               # ページレイアウトテンプレート
│   │   └── Layout.astro       # メインHTMLレイアウト
│   ├── pages/                 # ファイルベースルーティング
│   │   └── index.astro        # ホームページ(/)
│   └── styles/
│       └── global.css         # グローバルスタイル(Tailwind import)
├── astro.config.mjs           # Astro設定
├── biome.json                 # Biome設定(linting/formatting)
├── package.json               # 依存関係・スクリプト
├── pnpm-workspace.yaml        # pnpmワークスペース設定
├── tsconfig.json              # TypeScript設定
└── wrangler.jsonc             # Cloudflare Workers設定
```

### 主要ファイルの説明

#### エントリーポイント

- **`src/pages/index.astro`** - ホームページ。Welcomeコンポーネントをレンダリング
- **`src/layouts/Layout.astro`** - HTML骨格。head/bodyを定義し、グローバルスタイルをインポート
- **`astro.config.mjs`** - Astro設定。Tailwind Viteプラグインを統合

#### 設定ファイル

- **`package.json`** - プロジェクトメタデータ、依存関係、npm scripts
- **`biome.json`** - コード品質設定
  - インデント: タブ
  - クォート: ダブルクォート
  - Git統合有効
  - インポート自動整理
- **`wrangler.jsonc`** - Cloudflare Workers設定
  - ワーカー名: "me"
  - アセットディレクトリ: "./dist"
  - 互換性日付: 2026-01-01
- **`tsconfig.json`** - Astroのstrictなデフォルト設定を継承
- **`pnpm-workspace.yaml`** - モノレポ設定(現在は単一パッケージ)

## セットアップ

### 前提条件

- Node.js 18以降
- pnpm

### インストール

```bash
pnpm install
```

## 開発

### 開発サーバーの起動

```bash
pnpm dev
```

ローカル開発サーバーが `http://localhost:4321` で起動します。

### 利用可能なコマンド

| コマンド | 説明 |
|---------|------|
| `pnpm dev` | 開発サーバーを起動 (localhost:4321) |
| `pnpm build` | 本番ビルドを ./dist/ に生成 |
| `pnpm preview` | ビルド済みサイトをローカルでプレビュー |
| `pnpm astro` | Astro CLIコマンドを直接実行 |
| `pnpm assist` | Biome自動修正 + リンティング (src/) |
| `pnpm lint` | Biomeリンターを自動修正付きで実行 (src/) |
| `pnpm format` | Biomeでコード整形 (src/) |

## ビルド

本番用ビルドを作成:

```bash
pnpm build
```

ビルド出力は `./dist/` ディレクトリに生成されます。

ビルドをローカルでプレビュー:

```bash
pnpm preview
```

## デプロイ

このプロジェクトはCloudflare Workersへのデプロイ用に設定されています。

### Cloudflare Workersへのデプロイ

Wranglerを使用してデプロイ:

```bash
# ビルドを作成
pnpm build

# Cloudflareにデプロイ
npx wrangler deploy
```

**設定詳細** (`wrangler.jsonc`):
- ワーカー名: `me`
- アセットディレクトリ: `./dist` (Astroのビルド出力)
- 互換性日付: `2026-01-01`

## コード品質

### Biome

プロジェクトはBiome (v2.3.11) を使用してコード品質を管理しています。

**設定内容**:
- タブインデント
- ダブルクォート
- 推奨ルールセット有効
- Git統合有効 (.gitignoreを尊重)
- インポート自動整理

**使用方法**:

```bash
# すべてのチェック + 自動修正
pnpm assist

# リンティングのみ
pnpm lint

# フォーマットのみ
pnpm format
```

## CI/CD

### 自動PR作成ワークフロー

`.github/workflows/pull-request.yml` がmain以外のブランチへのプッシュで自動的にPRを作成します。

**動作**:
1. main以外のブランチへのプッシュで起動
2. 既存のPRがあるか確認
3. なければ自動的にPRを作成
   - タイトル: "release {branch-name}"
   - ベース: main
   - アサイン先: ta93abe

## ブランチ戦略

### 重要: main ブランチでの直接作業禁止

**必ず feature ブランチを作成してから作業を開始してください。**

```bash
# 新機能開発の場合
git switch -c feature/機能名

# バグ修正の場合
git switch -c fix/修正内容

# ドキュメント更新の場合
git switch -c docs/更新内容
```

### ワークフロー

1. **ブランチ作成**: 作業開始前に必ず feature ブランチを作成
2. **開発**: feature ブランチで開発を進める
3. **コミット**: こまめにコミット（意味のある単位で）
4. **プッシュ**: リモートに push
5. **PR作成**: GitHub で Pull Request を作成
6. **レビュー**: 必要に応じてコードレビュー
7. **マージ**: PR をマージして main に反映
8. **ブランチ削除**: マージ後は feature ブランチを削除

### ブランチ命名規則

- `feature/*`: 新機能追加
- `fix/*`: バグ修正
- `docs/*`: ドキュメント更新
- `refactor/*`: リファクタリング
- `test/*`: テスト追加・修正

### コミットメッセージ

Conventional Commits に従う:
- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメント
- `style:` フォーマット
- `refactor:` リファクタリング
- `test:` テスト
- `chore:` その他

## 開発ガイドライン

### Astroの基本

- **ファイルベースルーティング**: `src/pages/` 内のファイルがルートになります
- **コンポーネント**: 再利用可能なUIは `src/components/` に配置
- **レイアウト**: ページ共通のHTMLテンプレートは `src/layouts/` に配置
- **スタイリング**: Tailwind CSSを使用。グローバルスタイルは `src/styles/global.css`

### コーディング規約

- タブでインデント
- ダブルクォート使用
- コミット前に `pnpm assist` を実行
- TypeScript strict mode有効

### ブランチ戦略

- メインブランチ: `main`
- フィーチャーブランチから自動PRが作成されます
- PRマージ後、Cloudflare Workersへのデプロイを実行

## 参考リンク

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Biome Documentation](https://biomejs.dev)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)

## プロジェクトステータス

現在、スターターテンプレートから開発を開始した段階です:
- Cloudflare Workers設定完了
- CI/CD自動化完了
- 設定ファイルの調整完了
- 実装中: ポートフォリオコンテンツの追加

## 次のステップ

1. スターターコンテンツ(Welcome.astro)をカスタムコンテンツに置き換え
2. 追加ページの作成 (About, Projects, Contactなど)
3. カスタムコンポーネントの実装
4. SEO最適化の追加
5. アナリティクスの統合
