# Contributing

このプロジェクトへの貢献に興味を持っていただきありがとうございます！
このガイドでは、開発フローとコード規約について説明します。

## 開発フロー

### 1. ブランチ作成

**重要: main ブランチでの直接作業は禁止です。**

必ず feature ブランチを作成してから作業を開始してください。

```bash
# 新機能開発の場合
git switch -c feature/機能名

# バグ修正の場合
git switch -c fix/修正内容

# ドキュメント更新の場合
git switch -c docs/更新内容

# リファクタリングの場合
git switch -c refactor/対象内容

# テスト追加・修正の場合
git switch -c test/対象内容
```

### 2. 開発環境のセットアップ

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev
```

開発サーバーは `http://localhost:4321` で起動します。

### 3. 開発

- コードを書く前に、既存のコードを必ず読んでください
- 小さく、意味のある単位でコミットを作成してください
- コミット前に必ず `pnpm assist` を実行してください

### 4. テスト

変更内容に応じて適切なテストを実行してください。

```bash
# ユニットテスト
pnpm test

# ユニットテスト（UI モード）
pnpm test:ui

# カバレッジ付きテスト
pnpm test:coverage

# E2E テスト
pnpm test:e2e

# E2E テスト（UI モード）
pnpm test:e2e:ui
```

### 5. コミット

Conventional Commits に従ってコミットメッセージを作成してください。

```bash
git add .
git commit -m "feat: 新機能の説明"
```

#### コミットメッセージの形式

```
<type>: <subject>

<body>
```

**Type の種類:**

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響を与えない変更（フォーマット、セミコロンの追加など）
- `refactor`: バグ修正でも機能追加でもないコードの変更
- `perf`: パフォーマンス改善
- `test`: テストの追加や修正
- `chore`: ビルドプロセスやツールの変更

**例:**

```bash
git commit -m "feat: ダークモードトグルを追加"
git commit -m "fix: ヘッダーのレスポンシブ表示を修正"
git commit -m "docs: README にセットアップ手順を追加"
```

### 6. プッシュ

```bash
git push origin <your-branch-name>
```

### 7. Pull Request 作成

GitHub で Pull Request を作成します。

- タイトルはコミットメッセージと同様の形式で記載
- 変更内容の説明を詳しく記載
- 関連する Issue があれば参照を追加

### 8. レビュー

- レビュアーからのフィードバックに対応
- 必要に応じて追加のコミットをプッシュ

### 9. マージ

- PR が承認されたらマージ
- マージ後は feature ブランチを削除

## コード規約

### TypeScript

- TypeScript strict mode を使用
- 型は可能な限り明示的に指定
- `any` の使用は最小限に

### スタイリング

- Tailwind CSS を使用
- グローバルスタイルは `src/styles/global.css` に配置
- カスタムコンポーネントは `src/components/` に配置

### フォーマット

プロジェクトは Biome を使用してコード品質を管理しています。

**設定内容:**

- タブインデント
- ダブルクォート
- 推奨ルールセット有効
- Git統合有効 (.gitignoreを尊重)
- インポート自動整理

**コマンド:**

```bash
# すべてのチェック + 自動修正
pnpm assist

# リンティングのみ
pnpm lint

# フォーマットのみ
pnpm format
```

### ファイル構成

```
src/
├── assets/         # 画像・静的リソース
├── components/     # 再利用可能な Astro コンポーネント
├── layouts/        # ページレイアウトテンプレート
├── pages/          # ファイルベースルーティング
└── styles/         # グローバルスタイル
```

### コンポーネント

- 再利用可能なコンポーネントは `src/components/` に配置
- ファイル名は PascalCase（例: `Button.astro`）
- プロパティの型定義を明示

### 命名規則

- **ファイル名**: PascalCase（コンポーネント）、kebab-case（その他）
- **変数**: camelCase
- **定数**: UPPER_SNAKE_CASE
- **型/インターフェース**: PascalCase

## プルリクエストのガイドライン

### タイトル

Conventional Commits の形式に従ってください。

```
feat: 新機能の追加
fix: バグの修正
docs: ドキュメントの更新
```

### 説明

以下の情報を含めてください:

1. **変更の概要**: 何を変更したか
2. **変更の理由**: なぜこの変更が必要か
3. **影響範囲**: どの部分に影響があるか
4. **テスト方法**: どのようにテストしたか
5. **スクリーンショット**: UI変更の場合は必須

### チェックリスト

PR作成前に以下を確認してください:

- [ ] コードが正しくフォーマットされている（`pnpm assist`）
- [ ] テストが通る（`pnpm test`、`pnpm test:e2e`）
- [ ] ビルドが成功する（`pnpm build`）
- [ ] コミットメッセージが Conventional Commits に従っている
- [ ] 関連する Issue がリンクされている

## 質問・サポート

質問や提案がある場合は、GitHub Issues で新しい Issue を作成してください。

## ライセンス

このプロジェクトに貢献することで、あなたの貢献が MIT ライセンスの下でライセンスされることに同意したものとみなされます。
