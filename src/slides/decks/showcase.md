---
title: デザインシステム ショーケース
date: 2026-09-06
description: 全スライド型・typography（display/body/mono）・クリック・数式・日本語本文の見本。TA-1356 以降の見た目確認に使う。
slug: showcase
theme: dark
event: デザインシステム検証
talkSlug: frosty-friday-live-challenge-vol56
---

<!-- type: cover -->

# スライドの見た目

デザインシステムで統一する登壇

---

<!-- type: section -->

# 本文

見出しだけで章を切る

---

# 書くことに集中する

色も余白も型も、デッキ側では指定しない。Markdown に本文だけ書く。

- 1 デッキは 1 ファイル
- 区切りは `---`
- 型は HTML コメント

| 項目       | 内容             |
| ---------- | ---------------- |
| 正のソース | Markdown         |
| 見た目     | デザインシステム |

---

<!-- type: split -->

## コンテンツ

著者が決めるのは、何をどの順番で言うかだけ。

<!-- column -->

## 見た目

トークンと型が、16:9 のキャンバスに乗せる。

---

<!-- type: quote -->

<!-- notes
引用は短く止めて、次のコードへ進む。
-->

> 見た目をデッキに持ち込むと、次の発表でまた崩す。

出典ではなく、このプロジェクトの原則。

---

<!-- type: code -->

# フェンスはそのまま

```ts {1}
type SlideType =
	| "cover"
	| "section"
	| "body"
	| "split"
	| "quote"
	| "code"
	| "figure"
	| "center"
	| "end";
```

---

<!-- type: figure -->

![16:9 のキャンバス](./frame.svg)

図はキャンバスの中央に置き、キャプションは短くする。

---

<!-- type: center -->

# 短い一文を中央に

余白で止める

---

# クリックで出す

最初に見えること。

<!-- click -->

矢印のあとに出ること。

---

# リストも順に

<!-- notes
1 項目ずつ進めて、契約を復唱する。
-->

<!-- clicks -->

- Markdown の本文だけ書く
- 見た目はデザインシステム
- クリックは HTML コメント

---

<!-- type: code -->

# 行を順に指す

```ts {2|4}
const visible = true;
const next = "click";
const then = "again";
const done = true;
```

---

# 数式

インラインは $e^{i\pi}+1=0$。

$$
\sum_{n=1}^{N} n = \frac{N(N+1)}{2}
$$

---

<!-- type: end -->

# ありがとうございました

@ta93abe_ · ta93abe.com/slides
