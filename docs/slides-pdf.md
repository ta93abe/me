# PDF（Browser Run）

Web と同じ DOM を Browser Run の `quickAction("pdf")` に渡し、Workflow が非公開 R2 `CONTENT`（`me-content`）へ置く。

クライアントの `window.print()` は正にしない。

## URL

| パス | 内容 |
| -- | -- |
| `/slides/<slug>/` | 発表プレイヤー |
| `/slides/<slug>/print/` | 全枚を並べた印刷用 HTML |
| `/slides/<slug>?print=1` | `/slides/<slug>/print/` へ 301 |
| `/slides/<slug>.pdf` | R2 の PDF。無ければ Queue → Workflow で生成し `202` |

プレイヤー左下の「PDF」が `/slides/<slug>.pdf` を開く。

印刷 HTML は全 `.slide` を出し、`html` に `data-print-ready` と `is-print` を付ける。`player.js` は読まない。

印刷 CSS は `.slide[hidden]` を `display: flex !important` で上書きする。プレイヤーは非表示スライドを `hidden` にしており、specificity を上げないと 1 枚目だけになる。

## 紙面

1 スライド = 1 ページ、16:9。CSS `@page` を優先し、名前付き用紙（A4 など）は使わない。`landscape` キーワードも `format` も付けない（幅×高さですでに横長。付けると二重に回転する）。

| 項目 | 値 |
| -- | -- |
| `@page size` | `13.333in 7.5in`（余白 0） |
| `viewport` | `1920 × 1080` |
| `emulateMediaType` | `print` |
| `pdfOptions.printBackground` | `true` |
| `pdfOptions.preferCSSPageSize` | `true` |
| `pdfOptions.width` / `height` | `13.333in` / `7.5in` |
| `pdfOptions.format` | 未指定 |
| `pdfOptions.landscape` | 未指定 |
| `gotoOptions.waitUntil` | `networkidle0` |
| `waitForSelector` | `[data-print-ready]` |
| `cacheTTL` | `0` |

## パイプライン

```
GET /slides/<slug>.pdf
  ├─ CONTENT `derived/slides/pdf/<slug>.pdf` の version がデッキ HTML の SHA-256 先頭 16 字と一致 → 返す
  └─ 不一致 / 未生成 → Queue `me-slides-pdf`（max_concurrency: 1）
       └─ PdfWorkflow
            1. render-pdf  Browser Run が `https://ta93abe.com/slides/<slug>/print/` を描画し、staging に置く
            2. put-r2      本番キーへ移す
            3. purge-cache Cache API から `/slides/<slug>.pdf` を消す
```

生成中は `202` `{ ok, status: "generating", slug }` + `Retry-After: 3`。

Browser Run の origin は常に本番 `https://ta93abe.com`。プレビューが Access の後ろだと HTML が取れない。

ローカルで実描画する場合は `wrangler dev --remote`（`quickAction` は local 未対応）。CI は Queue / Workflow / 紙面定数の単体テストで固める。

Hono の `/:slug.pdf` は使わない。パラメータ名が `slug.pdf` になる。Worker は pathname を `^/slides/([^/]+)\.pdf$` で見る。

既存の `content-events` キューは置き換えない。`queue()` は `batch.queue` で PDF とブログ経路を分岐する。

`IMAGES` は公開 R2 `me-images` のまま。Cloudflare Images バインディングを同名で足さない。
