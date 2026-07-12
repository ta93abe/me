# me — 個人ポートフォリオ / ランディングページ

Astro + Tailwind CSS + TypeScript で構築した個人サイト。Cloudflare Workers にデプロイされます。

## 技術スタック

| カテゴリ | 技術 |
| :--- | :--- |
| フレームワーク | Astro |
| スタイリング | Tailwind CSS |
| 言語 | TypeScript |
| Lint / Format | Oxlint / Oxfmt |
| アナリティクス | PostHog |
| デプロイ | Cloudflare Workers（Workers Builds） |
| パッケージマネージャ | pnpm |

## セットアップ

```sh
pnpm install
cp .env.example .env   # 値を実際の PostHog トークン等に書き換える
pnpm dev               # http://localhost:4321
```

## コマンド

| コマンド | 内容 |
| :--- | :--- |
| `pnpm dev` | 開発サーバー起動（localhost:4321） |
| `pnpm build` | 本番ビルドを `./dist/` に生成 |
| `pnpm preview` | ビルド結果をローカルでプレビュー |
| `pnpm lint` | Oxlint で lint + 自動修正（src/） |
| `pnpm format` | Oxfmt でフォーマット（src/） |

## 環境変数

PostHog 用の変数を使用します。`PUBLIC_` 接頭辞の変数は **Astro がビルド時に静的HTMLへインライン展開** します（実行時の値ではありません）。

| 変数 | 用途 |
| :--- | :--- |
| `PUBLIC_POSTHOG_PROJECT_TOKEN` | PostHog プロジェクトトークン（`phc_` で始まる publishable key） |
| `PUBLIC_POSTHOG_HOST` | PostHog ホスト（例: `https://us.i.posthog.com`） |

- ローカル: `.env` に設定（`.env.example` 参照）。
- 本番: 同じ変数を **Cloudflare Workers Builds の Build variables** に登録する必要があります。未登録だとビルド時に空値となり、計測スニペットは出力されません（`src/components/posthog.astro` は本番ビルドかつトークン存在時のみ出力するガード付き）。
- 開発時（`pnpm dev`）は `import.meta.env.PROD` が false のため計測しません。

## デプロイ

`main` への push で **Cloudflare Workers Builds が自動でビルド & デプロイ** します。ビルド変数を変更した場合は、再ビルド（ダッシュボードの Retry もしくは新規 push）で反映されます。

## ドキュメント

- プロジェクト詳細・ワークフロー: [`.claude/CLAUDE.md`](.claude/CLAUDE.md)
- アーキテクチャ / デプロイ / スタイルガイド: [`docs/`](docs/)
