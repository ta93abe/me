# Style Guide

このドキュメントでは、プロジェクトのコーディング規約とスタイルガイドラインを定義します。

## 目次

- [TypeScript](#typescript)
- [CSS / Tailwind](#css--tailwind)
- [Astro コンポーネント](#astro-コンポーネント)
- [命名規則](#命名規則)
- [ファイル構成](#ファイル構成)
- [コメント](#コメント)

## TypeScript

### 基本ルール

- TypeScript strict mode を使用
- 型は可能な限り明示的に指定
- `any` の使用は最小限に（使用する場合はコメントで理由を説明）
- `unknown` を `any` の代わりに使用することを検討

### 型定義

#### Props の定義

```typescript
// Good
interface Props {
	title: string;
	description?: string;
	items: Array<string>;
}

// Bad - 型が不明確
interface Props {
	title: any;
	description: string | undefined;
	items: string[];
}
```

#### 型エイリアスとインターフェース

- オブジェクトの形状を定義する場合は `interface` を使用
- ユニオン型やプリミティブ型のエイリアスには `type` を使用

```typescript
// Good - オブジェクトの形状
interface User {
	id: string;
	name: string;
	email: string;
}

// Good - ユニオン型
type Status = "pending" | "active" | "inactive";

// Good - 関数型
type Handler = (event: Event) => void;
```

### 関数

#### 関数の型定義

```typescript
// Good - 引数と戻り値の型を明示
function formatDate(date: Date): string {
	return date.toISOString();
}

// Good - アロー関数
const calculateTotal = (items: number[]): number => {
	return items.reduce((sum, item) => sum + item, 0);
};
```

#### オプショナルパラメータ

```typescript
// Good
function greet(name: string, greeting?: string): string {
	return `${greeting ?? "Hello"}, ${name}!`;
}

// Bad - デフォルト値がある場合は省略可能にしない
function greet(name: string, greeting: string = "Hello"): string {
	return `${greeting}, ${name}!`;
}
```

## CSS / Tailwind

### Tailwind CSS の使用

- 可能な限り Tailwind のユーティリティクラスを使用
- カスタム CSS は最小限に
- グローバルスタイルは `src/styles/global.css` に配置

### クラス名の順序

Tailwind のクラスは以下の順序で記述:

1. レイアウト（display, position, flex, grid）
2. ボックスモデル（width, height, margin, padding）
3. タイポグラフィ（font, text）
4. 視覚効果（background, border, shadow）
5. その他（cursor, transition）

```astro
<!-- Good -->
<div class="flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
	<!-- content -->
</div>

<!-- Bad - 順序がバラバラ -->
<div class="bg-white px-4 flex border-gray-200 py-2 items-center rounded-lg shadow-sm border justify-between">
	<!-- content -->
</div>
```

### レスポンシブデザイン

モバイルファーストアプローチを採用:

```astro
<!-- Good - モバイルファーストで段階的に拡張 -->
<div class="text-sm md:text-base lg:text-lg">
	<!-- content -->
</div>

<!-- Bad - デスクトップファーストは非推奨 -->
<div class="text-lg md:text-base sm:text-sm">
	<!-- content -->
</div>
```

### カスタム CSS

カスタム CSS が必要な場合:

```astro
---
// component logic
---

<div class="custom-element">
	<!-- content -->
</div>

<style>
	.custom-element {
		/* Tailwind で表現できないスタイルのみ */
		background: linear-gradient(to right, #667eea 0%, #764ba2 100%);
	}
</style>
```

### 色の使用

- Tailwind のカラーパレットを使用
- カスタムカラーが必要な場合は `tailwind.config` で定義

```javascript
// tailwind.config.js
export default {
	theme: {
		extend: {
			colors: {
				brand: {
					50: '#f0f9ff',
					// ...
					900: '#0c4a6e',
				},
			},
		},
	},
};
```

## Astro コンポーネント

### コンポーネント構造

```astro
---
// 1. Import statements
import Layout from '../layouts/Layout.astro';
import Button from '../components/Button.astro';

// 2. Props interface
interface Props {
	title: string;
	description?: string;
}

// 3. Props destructuring
const { title, description } = Astro.props;

// 4. Component logic
const currentYear = new Date().getFullYear();
---

<!-- 5. Template -->
<Layout title={title}>
	<h1>{title}</h1>
	{description && <p>{description}</p>}
	<Button text="Click me" />
	<footer>© {currentYear}</footer>
</Layout>

<!-- 6. Styles (if needed) -->
<style>
	/* component-specific styles */
</style>
```

### Props の検証

```astro
---
interface Props {
	title: string;
	size?: "sm" | "md" | "lg";
	variant?: "primary" | "secondary";
}

const {
	title,
	size = "md",
	variant = "primary"
} = Astro.props;
---
```

### 条件付きレンダリング

```astro
<!-- Good - 短い条件 -->
{isVisible && <div>Content</div>}

<!-- Good - 複雑な条件 -->
{
	status === "loading" ? (
		<Spinner />
	) : status === "error" ? (
		<ErrorMessage />
	) : (
		<Content />
	)
}
```

### リストのレンダリング

```astro
---
const items = ["Item 1", "Item 2", "Item 3"];
---

<ul>
	{items.map((item) => (
		<li>{item}</li>
	))}
</ul>
```

## 命名規則

### ファイル名

| タイプ | 規則 | 例 |
|--------|------|-----|
| コンポーネント | PascalCase | `Button.astro`, `UserCard.astro` |
| ページ | kebab-case | `index.astro`, `about.astro` |
| レイアウト | PascalCase | `Layout.astro`, `BlogLayout.astro` |
| ユーティリティ | camelCase | `formatDate.ts`, `apiClient.ts` |
| 型定義 | PascalCase | `types.ts`, `User.ts` |

### 変数名

```typescript
// Good
const userName = "John Doe";
const isActive = true;
const maxCount = 100;

// Bad
const user_name = "John Doe";  // スネークケースは使用しない
const UserName = "John Doe";   // 変数は PascalCase にしない
const ISACTIVE = true;         // 定数以外は大文字にしない
```

### 定数名

```typescript
// Good
const API_BASE_URL = "https://api.example.com";
const MAX_RETRY_COUNT = 3;

// Bad
const apiBaseUrl = "https://api.example.com";  // 定数は大文字で
const maxRetryCount = 3;
```

### 関数名

```typescript
// Good - 動詞で始める
function getUserById(id: string) { }
function calculateTotal(items: number[]) { }
function isValid(value: string) { }

// Bad - 名詞のみ
function user(id: string) { }
function total(items: number[]) { }
```

### コンポーネント名

```astro
<!-- Good - 明確で説明的 -->
UserProfileCard.astro
BlogPostList.astro
NavigationMenu.astro

<!-- Bad - 短すぎる、不明確 -->
Card.astro
List.astro
Nav.astro
```

## ファイル構成

### インポートの順序

```typescript
// 1. 外部ライブラリ
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

// 2. 内部モジュール（絶対パス）
import Layout from "@/layouts/Layout.astro";
import { formatDate } from "@/utils/date";

// 3. 相対パス
import Button from "../components/Button.astro";
import type { Props } from "./types";

// 4. スタイル
import "../styles/global.css";
```

### ディレクトリ構成

```
src/
├── assets/          # 静的リソース
├── components/      # 再利用可能なコンポーネント
│   ├── ui/         # UI コンポーネント（Button, Input など）
│   ├── layout/     # レイアウトコンポーネント（Header, Footer など）
│   └── features/   # 機能固有のコンポーネント
├── layouts/         # ページレイアウト
├── pages/           # ルーティング
├── styles/          # グローバルスタイル
└── utils/           # ユーティリティ関数
```

## コメント

### コメントの原則

- コードが自己説明的である場合はコメント不要
- 複雑なロジックには説明を追加
- なぜそうなっているかを説明（何をしているかではなく）

### JSDoc コメント

```typescript
/**
 * ユーザー情報を取得します
 * @param id - ユーザーID
 * @returns ユーザーオブジェクト、または見つからない場合は null
 */
function getUserById(id: string): User | null {
	// implementation
}
```

### インラインコメント

```typescript
// Good - 理由を説明
// Safari では transform が正しく動作しないため、position を使用
element.style.position = "relative";

// Bad - 何をしているかだけを説明
// position を relative に設定
element.style.position = "relative";
```

### TODO コメント

```typescript
// TODO: エラーハンドリングを改善
// FIXME: パフォーマンスの問題を修正
// HACK: 一時的な回避策、後で修正が必要
```

## Biome 設定

プロジェクトは Biome を使用してコードスタイルを統一しています。

### 設定内容（biome.json）

- インデント: タブ
- クォート: ダブルクォート
- 行幅: 120 文字
- インポート自動整理

### 使用方法

```bash
# すべてのチェック + 自動修正
pnpm assist

# リンティングのみ
pnpm lint

# フォーマットのみ
pnpm format
```

### エディタ統合

VSCode を使用する場合、`.vscode/settings.json` に以下を追加:

```json
{
	"editor.defaultFormatter": "biomejs.biome",
	"editor.formatOnSave": true,
	"editor.codeActionsOnSave": {
		"quickfix.biome": "explicit",
		"source.organizeImports.biome": "explicit"
	}
}
```

## ベストプラクティス

### DRY（Don't Repeat Yourself）

重複コードは避け、再利用可能なコンポーネントや関数を作成:

```astro
<!-- Good - コンポーネントを再利用 -->
<Button variant="primary" text="Submit" />
<Button variant="secondary" text="Cancel" />

<!-- Bad - 同じコードを繰り返す -->
<button class="px-4 py-2 bg-blue-500 text-white">Submit</button>
<button class="px-4 py-2 bg-gray-500 text-white">Cancel</button>
```

### 単一責任の原則

コンポーネントや関数は 1 つの責任のみを持つ:

```astro
<!-- Good - 責任が分離されている -->
<UserProfile user={user} />
<UserActions user={user} />

<!-- Bad - 複数の責任を持つ -->
<UserSection user={user} includeActions={true} />
```

### アクセシビリティ

- セマンティックな HTML を使用
- 適切な ARIA 属性を追加
- キーボードナビゲーションをサポート

```astro
<!-- Good -->
<button type="button" aria-label="閉じる">
	<span aria-hidden="true">×</span>
</button>

<!-- Bad -->
<div onclick="close()">×</div>
```

## 参考リンク

- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Tailwind CSS Best Practices](https://tailwindcss.com/docs/reusing-styles)
- [Astro Style Guide](https://docs.astro.build/en/guides/styling/)
- [Biome Documentation](https://biomejs.dev/)
