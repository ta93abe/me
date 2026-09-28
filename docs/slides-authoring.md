# デッキの書き方

1 デッキ = Markdown 1 ファイル。見た目は書かない。

契約の決定: [ADR-0010](https://linear.app/ta93abe/document/adr-0010-スライド型は-html-コメントで指定する-e347dd843d49) / [ADR-0012](https://linear.app/ta93abe/document/adr-0012-アクセントは紫theme-は-light-dark-だけ-0b32786e9ca9)

ブログ本文（`marked` + Prism）とは別経路。スライドは remark + ビルド時 Shiki。

## 置き場

```
src/slides/decks/<slug>.md
src/slides/decks/<slug>/図.png   # 任意。画像などの実体
```

`slug` は frontmatter とファイル名で一致させる。英小文字・数字・ハイフン。

相対画像 `./frame.svg` は `/slides/media/<slug>/frame.svg` になる。ビルドと `astro dev` が `src/slides/decks/<slug>/` を `public/slides/media/<slug>/` へコピーする。

## frontmatter

ファイル先頭のみ。見た目のキーは `theme` だけ。値は `dark` か `light`。省略時は `dark`。色コードは置かない。

```yaml
---
title: 発表タイトル
date: 2026-09-06
description: 一覧に出す一行
slug: event-name-2026-09-06
theme: dark
event: イベント名
---
```

`event` は任意。先頭の `cover` 枚の上部メタ行に出る。`date` は同じメタ行に日本語日付で出る（著者名と X ハンドルはサイト設定から自動）。

### SNS プレビュー（OG 画像）

`/og/slides/<slug>.png` はビルド時に生成する。カバー枚と同系の暗色背景・左アクセント・大きなタイトル。メタ行は `event`（あれば）と `date`（日本語）＋サイト名。カスタム OG 用の frontmatter キーは不要。`title` / `date` / `event` をそのまま使う。一覧 `/og/slides.png` も同じテンプレで「Slides」タイトル。

## スライド

区切りは行頭の `---`。フェンスコードの中では区切らない。

型は各スライドの先頭コメント。無ければ `body`。

```markdown
<!-- type: cover -->

# タイトル

サブタイトル
```

表紙は `#` がタイトル、直後の段落がサブタイトル。イベント名・日付・著者は frontmatter / サイト設定から自動で上段に並ぶ。`section` は全面アクセント + 大見出し（必要なら見出し下に短い一行）。`end` は中央寄せ + 左アクセントバー。

使える型: `cover` / `section` / `body` / `split` / `quote` / `code` / `figure` / `center` / `end`

### split

左右は `<!-- column -->` を 1 つ。

```markdown
<!-- type: split -->

## 左

本文

<!-- column -->

## 右

本文
```

### クリック

`<!-- click -->` で、それ以降のブロックを次のキー操作まで隠す。スペース / → はクリックを先に消化し、終わったら次の枚へ進む。

```markdown
# 話の順番

最初に見える

<!-- click -->

次に出る
```

リストを 1 項目ずつ出すときは `<!-- clicks -->`。

```markdown
# 要点

<!-- clicks -->

- 一つ
- 二つ
- 三つ
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

```markdown
<!-- notes
ここで話すこと。
-->
```

発表中に `p` でノート・次枚・経過時間を出す。

### 画像

```markdown
![16:9 の枠](./frame.svg)
```

パスは `src/slides/decks/<slug>/` 配下からの相対。

## 禁止（ビルドが失敗する）

- デッキ内の CSS、`style` 属性、`script`
- JSX コンポーネント、MDX の `import` / `export`
- 未知の型、未知の frontmatter キー
- 型コメントをスライド先頭以外に置くこと

許可する HTML コメント指令は `type` / `column` / `notes` / `click` / `clicks`。

## 見る

```bash
pnpm test:run
pnpm dev
```

- `https://ta93abe.com/slides` が一覧
- `https://ta93abe.com/slides/<slug>/` が発表面
- `https://ta93abe.com/slides/<slug>/print/` が印刷 HTML（`noindex`。canonical は発表面）
- `https://ta93abe.com/slides/<slug>.pdf` が PDF
- `https://ta93abe.com/og/slides.png` が一覧の OG 画像
- `https://ta93abe.com/og/slides/<slug>.png` がデッキの OG 画像
- `#3` が 3 枚目、`#3.2` がクリック位置

紙面の決め方は [docs/slides-pdf.md](slides-pdf.md)。

## プレイヤー（枚切り替え・モーション）

枚 index の変更時だけ、約 320ms の fade + 短い slide トランジションをかける。`<!-- click -->` の fragment は opacity + ごく小さな translate（過剰な動きは避ける）。`prefers-reduced-motion: reduce` では枚・ fragment とも瞬時切替。概要（`o`）・印刷 HTML（`/print/`）・PDF 生成 DOM では枚トランジションは走らない。

### 手動確認（TA-1358）

| 項目 | 期待 |
|------|------|
| → / ← で枚変更 | 短い fade/slide。URL ハッシュが `#n` に追従 |
| 深いリンク `#2` | 2 枚目が**アニメなし**で開く（hashchange は瞬時） |
| `<!-- click -->` ありの枚 | → で fragment が先に出てから次枚（`#n.1`） |
| `o` 概要 → 枚クリック | グリッドから選んだ枚へ**アニメなし**で遷移 |
| OS「視差効果を減らす」ON | 枚・ fragment とも瞬時 |
| `/slides/<slug>/print/` | 全枚表示・`player.js` なし（Playwright も参照） |

操作: ← → / Home / End / スペース / スワイプ / `f` フルスクリーン / `o` 概要グリッド / `p` 発表者ノート / `?` 操作一覧

### 手動確認（TA-1362・狭い viewport）

DevTools で幅 320px（例: iPhone SE）にし、`/slides/showcase/` を開く。デッキ stage が横スクロールせず、split 枚（「コンテンツ / 見た目」）が縦 1 列で読めること。左右スワイプで枚が進み、短いタップだけでは枚が変わらないこと。左下 PDF・右下カウンタが画面端やホームインジケータと重ならないこと。

### 発表者ビュー（`p`）

画面下部にドックを出し、投影エリアはその分だけ縮む（二画面 API は使わない）。左に `<!-- notes -->` のノート（無い枚は「ノートなし」）、右に次枚の見出しと本文から取った一行プレビュー。経過時間はドック上部に表示し、投影用のカウンタ・PDF リンクは `html.is-presenter` の間は非表示。`Escape` で閉じる。`?` の操作一覧は従来どおり（一覧表示中は `p` は効かない）。
