# ADR-0001 トップは紫基調のスクロール物語にする

| 項目 | 値 |
| -- | -- |
| 状態 | 採択 |
| 日付 | 2026-09-18 |
| 決定者 | Takumi Abe |
| 関連 | [TA-800](https://linear.app/ta93abe/issue/TA-800/トップページを入口にし代表作は単独ページに置く) / [TA-886](https://linear.app/ta93abe/issue/TA-886/トップ-のフィールド-cls-が-poorposthog-p75054) / 実装 [TA-1109](https://linear.app/ta93abe/issue/TA-1109/トップを紫基調のスクロール物語にするadr-0001) / Linear [ADR-0001](https://linear.app/ta93abe/document/adr-0001-トップは紫基調のスクロール物語にする-5f56f22268fc) / 参照 [typesafe.ai](https://typesafe.ai/) |

## 文脈

今の `/` はビューポート固定のポスター（氏名 + Works / About / Blog / Contact）である。雰囲気は白地に薄い紫アクセントで、動きはほぼ無い。`framer-motion` はモバイルナビだけ、`three` のヒーローシェーダは未接続、GSAP は未導入。

TA-800 は「トップは入口。代表作の一覧は `/works`」を決めた。情報量はそのまま正しい。見た目の方向（A05 文字のポスター + `lockViewport`）は、参照サイトのようなスクロール物語とは両立しない。

[typesafe.ai](https://typesafe.ai/)（2026-09-18、Framer）から借りるのはプロダクトコピーではなく、次の骨格である。

1. 巨大見出しの後ろに、鮮やかな色のブルーム（雲・ハーフトーン）
2. 下線テキストの導線
3. ディザの「デスクトップ」を雰囲気として置く
4. 続く章は全幅の色面 + 短いマニフェスト行
5. スクロールで章を進める（ピン / パララックス / 行の出現）

基調色は参照のマゼンタではなく **紫** にする。既存トークン `--primary-color: #6b4c9a` と、スライド ADR-0012（アクセントは紫）と揃える。

## 決定

**`/` は紫を基調にしたスクロール物語にする。代表作一覧は置かない。モーションは GSAP（章のスクロール）と Framer Motion（既存の React 島）に分ける。**

### 1. 情報

TA-800 の置く / 置かないを維持する。見た目が長くなっても、目次ページにはしない。

**置く**

- 氏名（`h1` は `Takumi Abe` のまま。JSON-LD Person と Markdown negotiation がこれを読む）
- 立ち位置の一文（`SITE.tagline`。第一画面で JS なしで読める）
- 次の行動: `HOME_CTAS`（Works / About / Blog / Contact）。実体は通常の `<a>`
- 短いマニフェスト章（既存の tagline / About の言い換え。新しい営業文句は作らない）
- 紫のブルームとディザのステージ（装飾。フォーカス対象にしない）

**置かない**

- 代表作・ブログ・Tools の一覧や解説
- `/gallery` `/atelier` `/bookshelf`
- ウェイトリスト、指標チャート、偽の OS ウィンドウ操作
- 参照サイトの書体・ロゴ・コピーの複製

第一画面の制限時間は変えない。スクロールを待たずに「誰で、次にどこへ行くか」が分かる。

### 2. 色（`/` だけ）

グローバル `:root` の紙白は About / Blog などでは維持する。トップだけ `body[data-theme="home"]` で上書きする。

| トークン | 値 | 役割 |
| -- | -- | -- |
| `--home-paper` | `#f4eef8` | 紙。白ではなく薄い紫 |
| `--home-ink` | `#1c1228` | 本文。紫黒 |
| `--home-ink-soft` | `#4c3a63` | キッカー / 補助 |
| `--home-bloom` | `#7c3aed` | 雲の芯（紫。マゼンタに寄せすぎない） |
| `--home-bloom-hot` | `#a855f7` | ハイライト |
| `--home-field` | `#6b21a8` | 章の色面 |
| `--home-dither` | `#86198f` | ハーフトーン |
| `--home-primary` | `#6b4c9a` | リンク / フォーカス。既存 primary と同じ |

`theme-color` は `/` だけ `#6b21a8`。他ページは今どおり `#ffffff`。

黄土 (`--accent-color`) はトップのブルームに使わない。WebGL ヒーロー (`src/scripts/hero-webgl.ts`) もこの決定の範囲では載せず、接続もしない。

### 3. 画面構成

スクロール長はおおよそ 3〜4 ビューポート。参照サイトの 9 画面は追わない。

```text
[ヒーロー]
  紫のブルーム（CSS。キャンバスなし）
  kicker: ta93abe
  h1: Takumi Abe
  立ち位置（SITE.tagline）
  HOME_CTAS（下線テキスト）

[ステージ]  aria-hidden
  紫ディザのデスクトップ。ウィンドウは静止画/CSS。クリック不可

[マニフェスト]
  全幅の紫面。短い見出し + 本文 2〜4 行
  角のクロップマークは任意

[導線]
  HOME_CTAS を再掲。Footer はドックせず通常スクロール
```

`Layout` の `lockViewport` は `/` で使わない。フッタは画面下に固定しない。`flushTop` はフルブリードのため残す。

### 4. モーション

| 層 | ライブラリ | 担当 | 置き場 |
| -- | -- | -- | -- |
| 章のスクロール | GSAP 3 + ScrollTrigger（npm。CDN 禁止） | ブルームのパララックス、章のピン / スクラブ、行の出現 | `src/scripts/home/scroll.ts`。`/` だけ読み込む |
| UI 島 | 既存の `framer-motion` | モバイルナビなど React 島。ホームページ本体は島にしない | 現状どおり |
| ホバー / フォーカス | CSS | リンク色、下線 | コンポーネント `<style>` |
| 入場の保険 | 既存 `animations/observer.ts` | `[data-animate]`。GSAP が無効なときも本文は見える | Layout |

禁止 / 見送り:

- ホームページ全体を `client:load` の React ツリーにしない
- Lenis 等のスムーススクロールは入れない（INP / スクロール位置 / CLS）
- GSAP Club プラグイン（SplitText 等）に依存しない。行分割が要るなら Astro が `<span>` を出す
- `100dvh` / `100svh` での縦中央揃えをヒーローに使わない（TA-886）
- レイアウトを動かすアニメーション（`top` / `height` / フォントサイズの tween）。`transform` と `opacity` だけ
- `prefers-reduced-motion: reduce` のときは ScrollTrigger を作らず、ブルームは静止、本文は最初から不透明
- `noscript` でも氏名・tagline・CTA が見える（Layout の既存 `[data-animate]` 保険を流用）

計測: `home_cta_clicked` は残す。ピン中でもリンクは普通にクリックできる。

### 5. コンポーネント境界

```text
src/pages/index.astro
  Layout homeTheme flushTop（lockViewport なし）
  HomeHero
  HomeStage（装飾）
  HomeManifesto
  HomeCta（HOME_CTAS の再掲。Hero とマークアップを共有してよい）

src/scripts/home/scroll.ts   # GSAP。他ページから import しない
```

コピーの正は `SITE` と `HOME_CTAS`。トップ用に別の紹介文ファイルを増やさない。

CSP は今のハッシュ + bundled script のまま。GSAP は Vite 経由で `/_astro/` に出す。

### 6. 品質ゲート

- `perf/budgets.json` の `/`（LCP 2500 / FCP 1800 / CLS 0.1 / TBT 250）を緩めない
- Playwright: 氏名の `h1`、CTA 4 本、reduced-motion で読めること、About / Works / Blog / Contact へ通常遷移
- フィールド CLS を戻さない。ピンは `pinSpacing` で高さを先に確保し、画像/フォントで下の章を押さない
- エージェント向け Markdown は HTML から作る。装飾ステージは `aria-hidden` なので本文に混ざらない

### 7. 対象外

- About / Blog / Works の紙白テーマを紫へ寄せること（トップが定まってから別 ADR）
- `hero-webgl.ts` の削除または再接続
- 新フォントの追加（Shippori / Noto Serif JP / Inter で組む。巨大見出しは `font-display` または `font-sans` のウェイトで足りる）

## 結果

**良いこと**

- 入口が「余白の名刺」から、紫の物語になる
- TA-800 の情報設計（一覧は `/works`）を壊さない
- モーションの責務がライブラリごとに分かれる
- 他ページの紙白と CLS 対策を巻き込みにくい

**制約**

- `/` の JS と TBT が増える。予算を超えたらピンを捨て、CSS の出現だけにする
- 紫面はコントラストを満たす（見出しは `--home-paper` か白。`--home-field` の上に `--home-ink` を置かない）
- ディザのステージは装飾以上の意味を持たせない。操作できる UI に見せかけてフォーカスを奪わない

## 検討した代替

| 代替 | 見送り理由 |
| -- | -- |
| 今の `lockViewport` ポスターを微修正 | 参照の面白さ（ブルーム・章・スクロール）が出ない |
| 暗い紫キャンバス + 白文字 | 参照は紙の上の色面。既存の紙白とも断絶する。トップが定まってからなら別 ADR |
| サイト全体を紫基調にする | TA-800「先にトップだけ比べる」。Blog の本文コントラストを巻き込む |
| ホームページを Framer Motion の大きな島にする | 氏名がハイドレーション待ちになる。既存の Astro HTML + 島の方針に逆行 |
| GSAP だけ / Motion だけ | モバイルナビは既に Motion。章のピン/スクラブは GSAP ScrollTrigger の方が単体スクリプト向き。両方使うが役割を分け、ページ全体を二重に駆動しない |
| Three.js のインクシェーダをブルームにする | 参照に canvas は無い。FCP/TBT と CLS の過去（TA-886）に対して重い |
| Lenis + ScrollTrigger | スムーススクロールは予算と `prefers-reduced-motion` の例外処理が増える |
| 代表作カードをステージのウィンドウに入れる | TA-800 の「置かない」を破る |

## 実装の切り方（この ADR の外）

実装 PR は決定を変えない。順序だけ示す。

1. `lockViewport` を外し、紫トークンと静的なヒーロー / ステージ / マニフェストを出す（モーションなし）
2. `/` 限定で GSAP ScrollTrigger を足す。reduced-motion 分岐を先に書く
3. Playwright と Lighthouse 予算。超えたらピンを削る
