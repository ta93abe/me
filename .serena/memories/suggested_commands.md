# 推奨コマンド一覧

## 開発

### 開発サーバー起動
```bash
pnpm dev
```
- ローカル開発サーバーを `http://localhost:4321` で起動
- ホットリロード有効

### ビルド
```bash
pnpm build
```
- 本番用ビルドを `./dist/` ディレクトリに生成
- HTML圧縮、CSS最適化、画像最適化を実行

### プレビュー
```bash
pnpm preview
```
- ビルド済みサイトをローカルでプレビュー
- 本番環境に近い状態で確認可能

### Astro CLI
```bash
pnpm astro [command]
```
- Astro CLIコマンドを直接実行
- 例: `pnpm astro add [integration]`

## コード品質

### すべてのチェック + 自動修正
```bash
pnpm assist
```
- Biomeでリンティング + フォーマット + インポート整理を実行
- `src/` ディレクトリ内を対象
- **コミット前に必ず実行**

### リンティング
```bash
pnpm lint
```
- Biomeリンターを自動修正付きで実行
- `src/` ディレクトリ内を対象

### フォーマット
```bash
pnpm format
```
- Biomeでコード整形
- `src/` ディレクトリ内を対象

## テスト

### ユニットテスト（インタラクティブ）
```bash
pnpm test
```
- Vitestをwatchモードで起動

### ユニットテストUI
```bash
pnpm test:ui
```
- Vitest UIインターフェースを起動

### ユニットテスト実行（1回）
```bash
pnpm test:run
```
- テストを1回実行して終了

### カバレッジ
```bash
pnpm test:coverage
```
- カバレッジレポート付きでテストを実行

### E2Eテスト
```bash
pnpm test:e2e
```
- Playwrightでエンドツーエンドテストを実行

### E2EテストUI
```bash
pnpm test:e2e:ui
```
- Playwright UIモードで起動

### E2Eテストレポート
```bash
pnpm test:e2e:report
```
- テスト実行結果のレポートを表示

## デプロイ

### Cloudflare Workersへデプロイ
```bash
pnpm deploy
```
- ビルド + デプロイを一括実行
- `./dist/` の内容をCloudflare Workersにデプロイ
- ワーカー名: `me`
- デプロイ先: https://ta93abe.com

## Git操作

### ブランチ作成
```bash
git switch -c feature/機能名
```

### ステータス確認
```bash
git status
```

### 変更をステージング
```bash
git add .
```

### コミット
```bash
git commit -m "feat: 新機能の説明"
```

### プッシュ
```bash
git push -u origin feature/機能名
```

## macOS（Darwin）固有のコマンド

### ディレクトリ一覧
```bash
ls -la
```

### ファイル検索
```bash
find . -name "ファイル名"
```

### テキスト検索
```bash
grep -r "検索文字列" ./src
```

### ファイル内容表示
```bash
cat ファイル名
```

### ディレクトリ移動
```bash
cd ディレクトリ名
```

## パッケージ管理

### 依存関係インストール
```bash
pnpm install
```

### パッケージ追加
```bash
pnpm add パッケージ名
```

### 開発用パッケージ追加
```bash
pnpm add -D パッケージ名
```

### パッケージ更新
```bash
pnpm update
```
