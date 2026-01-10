# Cloudflare Workers へのデプロイ

このドキュメントでは、プロジェクトを Cloudflare Workers にデプロイする手順を説明します。

## 前提条件

### 1. Cloudflare アカウント

- [Cloudflare](https://www.cloudflare.com/) でアカウントを作成
- Workers プランを有効化（無料プランで可）

### 2. ローカル環境

- Node.js 18 以降
- pnpm がインストール済み
- プロジェクトの依存関係がインストール済み

```bash
pnpm install
```

## Wrangler のセットアップ

### 1. Wrangler のインストール

プロジェクトには既に `wrangler` が devDependencies に含まれています。

```bash
# インストール確認
npx wrangler --version
```

### 2. Cloudflare への認証

```bash
npx wrangler login
```

ブラウザが開き、Cloudflare へのログインを求められます。
ログイン後、ターミナルに戻り認証が完了します。

### 3. アカウント ID の確認

```bash
npx wrangler whoami
```

このコマンドでアカウント ID が表示されます。
`wrangler.jsonc` にアカウント ID を設定することも可能です（オプション）。

## プロジェクト設定

### wrangler.jsonc の確認

プロジェクトの `wrangler.jsonc` ファイルには以下の設定があります:

```jsonc
{
	"name": "me",
	"compatibility_date": "2026-01-01",
	"assets": {
		"directory": "./dist"
	}
}
```

#### 設定項目の説明

| 項目 | 説明 |
|------|------|
| `name` | Worker の名前（URL の一部になります） |
| `compatibility_date` | Cloudflare Workers の互換性日付 |
| `assets.directory` | デプロイする静的ファイルのディレクトリ |

### カスタムドメインの設定（オプション）

カスタムドメインを使用する場合は、`wrangler.jsonc` に追加:

```jsonc
{
	"name": "me",
	"compatibility_date": "2026-01-01",
	"assets": {
		"directory": "./dist"
	},
	"routes": [
		{
			"pattern": "example.com/*",
			"zone_name": "example.com"
		}
	]
}
```

## デプロイ手順

### 1. プロジェクトのビルド

```bash
pnpm build
```

このコマンドで `./dist/` ディレクトリに静的ファイルが生成されます。

### 2. ビルド結果の確認

```bash
ls -la dist/
```

以下のようなファイルが生成されているはずです:
- HTML ファイル
- CSS ファイル
- JavaScript ファイル（必要な場合）
- 画像ファイル
- その他の静的アセット

### 3. ローカルでのプレビュー（オプション）

デプロイ前にローカルで確認:

```bash
pnpm preview
```

または Wrangler でローカルプレビュー:

```bash
npx wrangler pages dev ./dist
```

### 4. デプロイの実行

```bash
npx wrangler deploy
```

または、package.json に定義されたスクリプトを使用:

```bash
pnpm deploy
```

このコマンドは `pnpm build && wrangler deploy` を実行します。

### 5. デプロイの確認

デプロイが成功すると、以下のような出力が表示されます:

```
✨ Success! Uploaded 15 files (2.34 sec)

✨ Deployment complete! Take a look over at https://me.workers.dev
```

ブラウザで表示された URL にアクセスして、デプロイを確認します。

## デプロイ先の URL

### デフォルト URL

```
https://<worker-name>.<account-subdomain>.workers.dev
```

例: `https://me.example.workers.dev`

### カスタムドメイン

Cloudflare Dashboard でカスタムドメインを設定できます:

1. Cloudflare Dashboard → Workers & Pages → あなたの Worker を選択
2. Settings → Domains & Routes
3. Add Custom Domain

## 環境変数の設定

### 1. 環境変数の追加

環境変数を使用する場合は、`wrangler.jsonc` に追加:

```jsonc
{
	"name": "me",
	"compatibility_date": "2026-01-01",
	"assets": {
		"directory": "./dist"
	},
	"vars": {
		"ENVIRONMENT": "production"
	}
}
```

### 2. シークレットの設定

機密情報は Wrangler CLI で設定:

```bash
npx wrangler secret put API_KEY
```

プロンプトが表示されるので、値を入力します。

## トラブルシューティング

### デプロイが失敗する

#### 認証エラー

```bash
npx wrangler login
```

再度ログインして認証を確認。

#### ビルドエラー

```bash
pnpm build
```

ビルドが成功することを確認。エラーがある場合は修正。

### デプロイ後にページが表示されない

#### キャッシュのクリア

ブラウザのキャッシュをクリアして再度アクセス。

#### ビルド出力の確認

```bash
ls -la dist/
```

`dist/index.html` が存在することを確認。

### パフォーマンスの問題

#### アセットの最適化

画像の最適化やコード分割を確認:

```bash
pnpm build
```

ビルドログで警告を確認。

## CI/CD による自動デプロイ

### GitHub Actions の設定

`.github/workflows/deploy.yml` を作成:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: latest

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### シークレットの設定

GitHub リポジトリの Settings → Secrets and variables → Actions で以下を追加:

- `CLOUDFLARE_API_TOKEN`: Cloudflare API トークン

#### API トークンの作成

1. Cloudflare Dashboard → Profile → API Tokens
2. Create Token → Edit Cloudflare Workers テンプレートを使用
3. トークンをコピーして GitHub Secrets に保存

## ロールバック

### 以前のデプロイに戻す

Cloudflare Dashboard から:

1. Workers & Pages → あなたの Worker
2. Deployments タブ
3. 戻したいデプロイの右側の "..." → Rollback to this deployment

または、Wrangler CLI から:

```bash
npx wrangler rollback
```

### 特定のバージョンにロールバック

```bash
npx wrangler deployments list
npx wrangler rollback --message "Rollback to v1.2.3"
```

## モニタリング

### ログの確認

```bash
npx wrangler tail
```

リアルタイムでログをストリーミング。

### Cloudflare Dashboard

Cloudflare Dashboard → Workers & Pages → あなたの Worker → Analytics

以下の情報を確認できます:
- リクエスト数
- エラー率
- レイテンシー
- 帯域幅使用量

## コスト

### Workers 無料プラン

- リクエスト数: 100,000 リクエスト/日
- CPU 時間: 10ms/リクエスト

### Workers 有料プラン

- $5/月
- リクエスト数: 10,000,000 リクエスト/月
- CPU 時間: 50ms/リクエスト

詳細は [Cloudflare Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/) を参照。

## 参考リンク

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/deploy/cloudflare/)
