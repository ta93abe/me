# コーディング規約とスタイル

## フォーマット設定（Biome）

### インデント
- **タブ** を使用（スペースではない）
- インデントスタイル: `tab`

### クォート
- **ダブルクォート** を使用
- JavaScript/TypeScript: `"string"` 形式

### TypeScript
- **Strictモード** 有効
- `tsconfig.json` は `astro/tsconfigs/strict` を継承
- 型注釈を積極的に使用

## コード規約

### インポート
- 自動整理が有効（Biome assist）
- インポート順序は自動的に最適化される

### 命名規則
- コンポーネントファイル: PascalCase（例: `Welcome.astro`, `Layout.astro`）
- ユーティリティ関数ファイル: kebab-case（例: `date.ts`, `books.ts`）
- 変数・関数: camelCase
- 定数: UPPER_SNAKE_CASE（必要に応じて）
- TypeScriptインターフェース: PascalCase（例: `Props`）

### ファイル構成
- Astroコンポーネント: frontmatter (`---`) でロジックとマークアップを分離
- TypeScript関数: JSDocコメントで説明を追加（例: `/** 日付を日本語形式でフォーマットする */`）

### スタイル
- コンポーネント固有のスタイルは `<style>` タグ内に記述
- グローバルスタイルは `src/styles/global.css`
- Tailwind CSSクラスを優先的に使用

## Git規約

### ブランチ戦略
- **main** ブランチでの直接作業は禁止
- 必ずfeatureブランチを作成してから作業

### ブランチ命名
- `feature/*`: 新機能追加
- `fix/*`: バグ修正
- `docs/*`: ドキュメント更新
- `refactor/*`: リファクタリング
- `test/*`: テスト追加・修正

### コミットメッセージ（Conventional Commits）
- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメント
- `style:` フォーマット
- `refactor:` リファクタリング
- `test:` テスト
- `chore:` その他

## Astro固有の規約

### Props定義
```typescript
interface Props {
  title?: string;
  description?: string;
  // ...
}

const { title = "デフォルト値" } = Astro.props;
```

### SEOメタデータ
- 各ページで適切な `title` と `description` を設定
- Open Graphタグを含める
- 構造化データ（JSON-LD）を含める

## 言語
- UI/コンテンツ: 日本語
- コード・コメント: 日本語/英語混在可
- `lang="ja"` 設定（HTML）
- `locale="ja_JP"` 設定（OG）
