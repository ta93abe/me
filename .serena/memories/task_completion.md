# タスク完了時のチェックリスト

## コード変更後に必ず実行

### 1. コード品質チェック
```bash
pnpm assist
```
**必須:** コミット前に必ず実行してください。
- リンティング
- フォーマット
- インポート整理

### 2. テスト実行
```bash
# ユニットテスト
pnpm test:run

# E2Eテスト（必要に応じて）
pnpm test:e2e
```

### 3. ビルド確認
```bash
pnpm build
```
- ビルドエラーがないことを確認
- 警告も可能な限り解消

### 4. プレビュー確認
```bash
pnpm preview
```
- ローカルで本番環境に近い状態を確認
- 各ページが正しく動作するか確認

## Git操作

### 5. 変更をコミット
```bash
# ステータス確認
git status

# ステージング
git add .

# コミット（Conventional Commits形式）
git commit -m "feat: 新機能の説明"
```

### 6. リモートにプッシュ
```bash
git push -u origin ブランチ名
```

### 7. Pull Request作成
- GitHubで自動的にPRが作成される（.github/workflows/pull-request.yml）
- PRタイトル: "release {branch-name}"
- ベースブランチ: main
- アサイン先: ta93abe

## デプロイ前

### 8. 最終確認
- [ ] すべてのテストがパス
- [ ] ビルドが成功
- [ ] コード品質チェックがパス
- [ ] プレビューで動作確認済み
- [ ] 変更内容がPRに適切に記載されている

### 9. マージ後のデプロイ
```bash
# mainブランチに移動
git switch main

# 最新を取得
git pull

# ビルド
pnpm build

# デプロイ
npx wrangler deploy
```

## 注意事項

- **main ブランチで直接作業しない**
- **feature ブランチを必ず作成**
- **コミット前に `pnpm assist` を実行**
- **テストを書く習慣をつける**
- **意味のある単位でこまめにコミット**
