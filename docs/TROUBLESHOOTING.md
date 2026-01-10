# トラブルシューティング

このドキュメントでは、開発中によく遭遇する問題とその解決方法を説明します。

## 目次

- [インストール・セットアップ](#インストールセットアップ)
- [開発サーバー](#開発サーバー)
- [ビルド](#ビルド)
- [デプロイ](#デプロイ)
- [スタイリング](#スタイリング)
- [TypeScript](#typescript)
- [テスト](#テスト)
- [その他](#その他)

## インストール・セットアップ

### pnpm install が失敗する

#### 問題
```bash
$ pnpm install
ERR_PNPM_OUTDATED_LOCKFILE
```

#### 解決方法
```bash
# lockfile を削除して再インストール
rm pnpm-lock.yaml
pnpm install
```

### Node.js のバージョンが古い

#### 問題
```text
Error: This package requires Node.js 18 or higher
```

#### 解決方法
```bash
# Node.js のバージョンを確認
node --version

# Node.js 18 以降にアップグレード
# nvm を使用している場合
nvm install 20
nvm use 20
```

### 依存関係のインストールに時間がかかる

#### 解決方法
```bash
# pnpm のキャッシュをクリア
pnpm store prune

# 再インストール
pnpm install
```

## 開発サーバー

### ポート 4321 が既に使用されている

#### 問題
```text
Error: Port 4321 is already in use
```

#### 解決方法1: ポートを変更
```bash
pnpm dev -- --port 3000
```

#### 解決方法2: プロセスを終了
```bash
# macOS/Linux
lsof -ti:4321 | xargs kill -9

# Windows
netstat -ano | findstr :4321
taskkill /PID <PID> /F
```

### ホットリロードが動作しない

#### 問題
ファイルを変更しても画面が更新されない

#### 解決方法
```bash
# 開発サーバーを再起動
# Ctrl+C で停止して再度実行
pnpm dev

# それでも解決しない場合は node_modules を削除
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

### CORS エラーが発生する

#### 問題
```text
Access to fetch at 'http://api.example.com' from origin 'http://localhost:4321' has been blocked by CORS policy
```

#### 解決方法
`astro.config.mjs` でプロキシを設定:

```javascript
export default defineConfig({
	vite: {
		server: {
			proxy: {
				'/api': {
					target: 'http://api.example.com',
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/api/, '')
				}
			}
		}
	}
});
```

## ビルド

### ビルドが失敗する

#### 問題1: TypeScript エラー
```text
error TS2322: Type 'string | undefined' is not assignable to type 'string'
```

#### 解決方法
型エラーを修正するか、オプショナルチェイニングを使用:

```typescript
// Before
const title: string = props.title;

// After
const title: string = props.title ?? "Default Title";
```

#### 問題2: メモリ不足
```text
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

#### 解決方法: メモリ上限を増やす
```bash
# Node.js のメモリ上限を増やす
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

### 画像の最適化でエラーが出る

#### 問題
```text
Error: Could not load image
```

#### 解決方法
Sharp が正しくインストールされているか確認:

```bash
# Sharp を再インストール
pnpm remove sharp
pnpm add -D sharp

# ビルドを再実行
pnpm build
```

### ビルド後のファイルサイズが大きい

#### 解決方法
```bash
# ビルド結果を確認
ls -lh dist/

# 未使用の依存関係を削除
pnpm prune

# ビルドの最適化設定を確認
```

`astro.config.mjs` で最適化設定:

```javascript
export default defineConfig({
	build: {
		inlineStylesheets: 'auto',
	},
	vite: {
		build: {
			minify: 'terser',
		},
	},
});
```

## デプロイ

### Wrangler 認証エラー

#### 問題
```text
Error: Not authenticated. Please run `wrangler login`
```

#### 解決方法
```bash
# ログイン
npx wrangler login

# アカウント情報を確認
npx wrangler whoami
```

### デプロイ後にページが表示されない

#### 問題
デプロイは成功するが、ページが表示されない

#### 解決方法1: dist ディレクトリを確認
```bash
# dist/index.html が存在することを確認
ls -la dist/

# なければビルドを実行
pnpm build
```

#### 解決方法2: wrangler.jsonc を確認
```jsonc
{
	"name": "me",
	"assets": {
		"directory": "./dist"  // ← パスが正しいか確認
	}
}
```

#### 解決方法3: キャッシュをクリア
ブラウザのキャッシュをクリアして再度アクセス

### 環境変数が読み込まれない

#### 問題
環境変数にアクセスできない

#### 解決方法
`wrangler.jsonc` で環境変数を定義:

```jsonc
{
	"name": "me",
	"vars": {
		"ENVIRONMENT": "production"
	}
}
```

シークレットは CLI で設定:
```bash
npx wrangler secret put API_KEY
```

## スタイリング

### Tailwind CSS のクラスが適用されない

#### 問題
Tailwind のクラスを使っているのにスタイルが反映されない

#### 解決方法1: global.css をインポート
```astro
---
// src/layouts/Layout.astro
import '../styles/global.css';
---
```

#### 解決方法2: クラス名が正しいか確認
```astro
<!-- Good -->
<div class="flex items-center">

<!-- Bad - 存在しないクラス -->
<div class="flexbox center-items">
```

#### 解決方法3: 動的クラス名を避ける
```astro
<!-- Bad - 動的クラス名は purge される可能性がある -->
<div class={`text-${color}-500`}>

<!-- Good -->
{color === 'blue' && <div class="text-blue-500">}
{color === 'red' && <div class="text-red-500">}
```

### カスタム CSS が効かない

#### 問題
`<style>` タグ内の CSS が適用されない

#### 解決方法
Astro のスタイルはスコープされるため、グローバルに適用する場合は `:global()` を使用:

```astro
<style>
	/* コンポーネントスコープ */
	.button {
		padding: 1rem;
	}

	/* グローバル */
	:global(body) {
		margin: 0;
	}
</style>
```

## TypeScript

### 型エラーが出る

#### 問題1: Props の型が合わない
```typescript
Type 'string | undefined' is not assignable to type 'string'
```

#### 解決方法
```typescript
// オプショナルな Props を許可
interface Props {
	title?: string;  // ? を追加
}

// またはデフォルト値を設定
const { title = "Default" } = Astro.props;
```

#### 問題2: モジュールが見つからない
```text
Cannot find module '@/components/Button'
```

#### 解決方法: パスエイリアスを設定
`tsconfig.json` でパスエイリアスを設定:

```json
{
	"extends": "astro/tsconfigs/strict",
	"compilerOptions": {
		"baseUrl": ".",
		"paths": {
			"@/*": ["src/*"]
		}
	}
}
```

### import が解決できない

#### 問題
```text
Cannot find module './components/Button.astro' or its corresponding type declarations
```

#### 解決方法
ファイル拡張子を含める:

```typescript
// Good
import Button from './components/Button.astro';

// Bad
import Button from './components/Button';
```

## テスト

### Vitest が起動しない

#### 問題
```text
Error: Cannot find module 'vitest'
```

#### 解決方法
```bash
# 依存関係を再インストール
pnpm install

# Vitest を実行
pnpm test
```

### Playwright テストが失敗する

#### 問題
```text
Error: browserType.launch: Executable doesn't exist
```

#### 解決方法
```bash
# ブラウザをインストール
npx playwright install

# 再度テストを実行
pnpm test:e2e
```

### テストカバレッジが取得できない

#### 解決方法
```bash
# coverage ツールをインストール
pnpm add -D @vitest/coverage-v8

# カバレッジ付きでテスト実行
pnpm test:coverage
```

## その他

### Git でコミットできない

#### 問題
pre-commit hook でエラーが発生

#### 解決方法
```bash
# Biome でコードをフォーマット
pnpm assist

# 再度コミット
git commit -m "feat: 新機能追加"
```

### エディタで型チェックが遅い

#### 解決方法
VSCode の場合、`.vscode/settings.json` に追加:

```json
{
	"typescript.tsserver.maxTsServerMemory": 4096,
	"typescript.disableAutomaticTypeAcquisition": false
}
```

### ファイル監視の上限に達した（Linux）

#### 問題
```text
Error: ENOSPC: System limit for number of file watchers reached
```

#### 解決方法
```bash
# ファイル監視の上限を増やす
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### pnpm のストレージが肥大化

#### 解決方法
```bash
# 未使用のパッケージを削除
pnpm store prune

# ストレージのサイズを確認
du -sh ~/.pnpm-store
```

## サポート

### ドキュメント

- [ARCHITECTURE.md](./ARCHITECTURE.md) - アーキテクチャの詳細
- [DEPLOYMENT.md](./DEPLOYMENT.md) - デプロイ手順
- [STYLE_GUIDE.md](./STYLE_GUIDE.md) - コーディング規約
- [CONTRIBUTING.md](../CONTRIBUTING.md) - 貢献ガイド

### 公式ドキュメント

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Biome Documentation](https://biomejs.dev)
- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev)

### コミュニティ

- [Astro Discord](https://astro.build/chat)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/astro)

### Issue 報告

問題が解決しない場合は、GitHub Issues で報告してください:
- バグの詳細な説明
- 再現手順
- 環境情報（Node.js バージョン、OS など）
- エラーメッセージ全文
