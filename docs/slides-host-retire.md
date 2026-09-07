# 旧スライドホストの退役

デッキ本体は `https://ta93abe.com/slides/<slug>/`。旧ホストへの公開導線は切る。

## 旧 URL

| 旧 | 新 |
| -- | -- |
| `https://slides.ta93abe.com/` | `https://ta93abe.com/slides/` |
| `https://slides.ta93abe.com/<slug>` | `https://ta93abe.com/slides/<slug>/` |
| `https://slides.ta93abe.workers.dev/` | `https://ta93abe.com/slides/` |
| `https://slides.ta93abe.workers.dev/<slug>` | `https://ta93abe.com/slides/<slug>/` |

個別 PDF は `https://ta93abe.com/slides/<slug>.pdf`。

公開コンテンツが無いので **301 はしない**。DNS と旧 Worker を消す（[TA-823](https://linear.app/ta93abe/issue/TA-823)）。

## 手順

1. `ta93abe.com` で `/slides/showcase/` と `/slides/light/` が操作でき、PDF が 16:9 で出ることを確認する
2. Cloudflare DNS から `slides.ta93abe.com` を削除する
3. 旧 Worker `slides`（`slides.ta93abe.workers.dev`）を削除する
4. サイトのコードに `slides.ta93abe.com` / `slides.json` が残っていないことを確認する

DNS と旧 Worker の削除は本番操作なので、このリポジトリの PR だけでは完了しない。コード側の導線切断は本ブランチで済む。
