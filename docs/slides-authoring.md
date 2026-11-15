# デッキの書き方

1 デッキ = MDX 1 ファイル。見た目は書かない。

契約の決定: [ADR-0002 (me)](https://linear.app/ta93abe/document/adr-0002-スライドは-astro-mdx-で書き型と演出は許可リストのコンポーネントで指定する-d5c0caa45852) / [ADR-0012](https://linear.app/ta93abe/document/adr-0012-アクセントは紫theme-は-light-dark-だけ-0b32786e9ca9)（`accent` は [TA-882](https://linear.app/ta93abe/issue/TA-882) で部分追記）

ブログと同じ `@astrojs/mdx` で処理する（content collection `slides`）。コードはブログが Prism、スライドがビルド時 Shiki（クラス化）。プラグインは `src/slides/mdx/`。

## 置き場

```
src/slides/decks/<slug>.mdx
src/slides/decks/<slug>/図.png   # 任意。画像などの実体
```

`slug` は frontmatter とファイル名で一致させる。英小文字・数字・ハイフン。

相対画像 `./frame.svg` は `/slides/media/<slug>/frame.svg` になる。ビルドと `astro dev` が `src/slides/decks/<slug>/` を `public/slides/media/<slug>/` へコピーする。

## frontmatter

YAML。値に `: ` を含むときは `"..."` で囲む。見た目のキーは `theme`、任意の `accent`、任意の `effect`。`theme` は `dark` か `light`。省略時は `dark`。`accent` は `#rrggbb` または `#rgb` だけ（ビルド時に `--color-accent` / `--color-accent-deep` を確定する）。省略時は紫のまま。`effect` は発表面プレイヤーだけの演出。初回は `snow`（画面全体に雪）。省略時は演出なし。未知の値はビルド失敗。スライド本文や CSS には色コードを書かない。

```yaml
---
title: 発表タイトル
date: 2026-09-06
description: 一覧に出す一行
slug: event-name-2026-09-06
theme: dark
accent: "#f6821f"
effect: snow
event: イベント名
unlisted: true
---
```

`unlisted: true` は見本・検証用デッキ向け。URL は 200 のまま残すが、発表面は `noindex, follow`、PDF は `X-Robots-Tag: noindex`。sitemap-0、`/slides/` 一覧、一覧の JSON-LD からは外す。省略時は公開デッキ。

`effect` は `/slides/<slug>/` のプレイヤーだけ。印刷 HTML（`/print/`）と PDF には出さない（静止の雪も禁止）。`prefers-reduced-motion: reduce` では動かない。

`accent` を付けたデッキは発表面・印刷 HTML / PDF とも同じアクセントになる。OG 画像は初回は従来どおり（デッキ色には追従しない）。一覧・404 など著者が書かない面は紫のまま。

`event` は任意。先頭の `cover` 枚の上部メタ行に出る。`date` は同じメタ行に日本語日付で出る（著者名と X ハンドルはサイト設定から自動）。

### SNS プレビュー（OG 画像）

`/og/slides/<slug>.png` はビルド時に生成する。カバー枚と同系の暗色背景・左アクセント・大きなタイトル。メタ行は `event`（あれば）と `date`（日本語）＋サイト名。カスタム OG 用の frontmatter キーは不要。`title` / `date` / `event` をそのまま使う。一覧 `/og/slides.png` も同じテンプレで「Slides」タイトル。

## スライド

区切りは行頭の `---`。フェンスコードの中では区切らない。

型は各スライドの先頭に置くマーカーコンポーネント。無ければ `body`。

```mdx
<Cover />

# タイトル

サブタイトル
```

表紙は `#` がタイトル、直後の段落がサブタイトル。イベント名・日付・著者は frontmatter / サイト設定から自動で上段に並ぶ。`section` は全面アクセント + 大見出し（必要なら見出し下に短い一行）。`end` は中央寄せ + 左アクセントバー。

マーカー: `<Cover />` / `<Section />` / `<Split />` / `<Quote />` / `<Code />` / `<Figure />` / `<Center />` / `<End />`（無ければ `body`）。`code` も明示する（言語付きフェンスを含む `body` の枚があるため、自動では決めない）。

### split

左右は `<Column />` を 1 つ。

```mdx
<Split />

## 左

本文

<Column />

## 右

本文
```

### クリック

`<Click />` で、それ以降のブロックを次のキー操作まで隠す。スペース / → はクリックを先に消化し、終わったら次の枚へ進む。

```mdx
# 話の順番

最初に見える

<Click />

次に出る
```

リストを 1 項目ずつ出すときは `<Clicks>` で囲む（前後に空行）。

```mdx
# 要点

<Clicks>

- 一つ
- 二つ
- 三つ

</Clicks>
```

共有 URL は `#3` が 3 枚目、`#3.2` が 3 枚目の 2 クリック目。印刷 HTML と PDF ではすべて出した状態になる。

### コードの行ハイライト

フェンスの meta に行番号を書く。見た目の色はデッキに書かない。

````markdown
```ts {2-4}
const a = 1;
const b = 2;
const c = 3;
const d = 4;
```
````

`{2|4-5}` のように `|` で区切ると、クリックごとにハイライトが移る。

### 数式

KaTeX。インラインは `$...$`、別行は `$$...$$`。

```markdown
オイラーの等式は $e^{i\pi}+1=0$。
```

### ノート

```mdx
<Notes>

ここで話すこと。

</Notes>
```

ノートは書いたままのテキストで出す（Markdown として描画しない）。

発表中に `p` でノート・次枚・経過時間を出す。

### 画像

```markdown
![16:9 の枠](./frame.svg)
```

パスは `src/slides/decks/<slug>/` 配下からの相対。

## 禁止（ビルドが失敗する）

- MDX の `import` / `export`
- `{...}` の式（`{/* コメント */}` だけ可）
- 許可リスト外のコンポーネントと HTML タグ（`<div>`・`<style>`・`<script>` など）
- コンポーネントの属性（`style` を含む）、文中に置いたマーカー
- 型マーカーをスライド先頭以外に置くこと、`<Split />` 以外での `<Column />`
- 未知の frontmatter キー、色コード

使えるコンポーネントは型マーカーと `<Column />` / `<Notes>` / `<Click />` / `<Clicks>` だけ（`src/slides/mdx/allowlist.ts`）。どれもビルド時に構造へ変換し、クライアント JS は持たない。

MDX なので地の文の `<` と `{` は構文になる。文字として書くときは `` `<T>` `` のようにコードにするか、`\<` `\{` でエスケープする。旧記法の HTML コメント（`<!-- ... -->`）は MDX では書けない。

## 見る

```bash
pnpm test:run
pnpm dev
```

- `https://ta93abe.com/slides` が一覧（`unlisted` デッキは出さない）
- `https://ta93abe.com/slides/<slug>/` が発表面（`unlisted` は `noindex, follow`）
- `https://ta93abe.com/slides/<slug>/print/` が印刷 HTML（`noindex`。canonical は発表面）
- `https://ta93abe.com/slides/<slug>.pdf` が PDF
- `https://ta93abe.com/og/slides.png` が一覧の OG 画像
- `https://ta93abe.com/og/slides/<slug>.png` がデッキの OG 画像
- `#3` が 3 枚目、`#3.2` がクリック位置

紙面の決め方は [docs/slides-pdf.md](slides-pdf.md)。

## プレイヤー（枚切り替え・モーション）

枚 index の変更時だけ、約 320ms の fade + 短い slide トランジションをかける。`<Click />` の fragment は opacity + ごく小さな translate（過剰な動きは避ける）。`prefers-reduced-motion: reduce` では枚・ fragment とも瞬時切替。概要（`o`）・印刷 HTML（`/print/`）・PDF 生成 DOM では枚トランジションは走らない。

### 手動確認（TA-1358）

| 項目 | 期待 |
|------|------|
| → / ← で枚変更 | 短い fade/slide。URL ハッシュが `#n` に追従 |
| 深いリンク `#2` | 2 枚目が**アニメなし**で開く（hashchange は瞬時） |
| `<Click />` ありの枚 | → で fragment が先に出てから次枚（`#n.1`） |
| `o` 概要 → 枚クリック | グリッドから選んだ枚へ**アニメなし**で遷移 |
| OS「視差効果を減らす」ON | 枚・ fragment とも瞬時 |
| `/slides/<slug>/print/` | 全枚表示・`player.js` なし（Playwright も参照） |

操作: ← → / Home / End / スペース / スワイプ / `f` フルスクリーン / `o` 概要グリッド / `p` 発表者ノート / `?` 操作一覧

### 手動確認（TA-1362・狭い viewport）

DevTools で幅 320px（例: iPhone SE）にし、`/slides/showcase/` を開く。デッキ stage が横スクロールせず、split 枚（「コンテンツ / 見た目」）が縦 1 列で読めること。左右スワイプで枚が進み、短いタップだけでは枚が変わらないこと。左下 PDF・右下カウンタが画面端やホームインジケータと重ならないこと。

### 発表者ビュー（`p`）

画面下部にドックを出し、投影エリアはその分だけ縮む（二画面 API は使わない）。左に `<Notes>` のノート（無い枚は「ノートなし」）、右に次枚の見出しと本文から取った一行プレビュー。経過時間はドック上部に表示し、投影用のカウンタ・PDF リンクは `html.is-presenter` の間は非表示。`Escape` で閉じる。`?` の操作一覧は従来どおり（一覧表示中は `p` は効かない）。
