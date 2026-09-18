# Content API

Obsidian プラグイン（`pubme`）と curl が使う Worker API。本文は非公開 R2 `me-content`、添付は公開 R2 `me-images`。

段階 6: `/blog` と `/blog/:slug` はリクエスト時に R2 だけを読む。RSS / sitemap / llms / OG は blog index と `derived/` に接続する。Git の `src/content` と Sveltia `/admin` は外した。gallery / atelier / books のサイトページは公開コンテンツができるまで外し、旧 URL は `/` へリダイレクトする。API コレクション自体は残す。

Linear: [TA-790](https://linear.app/ta93abe/issue/TA-790)

## エンドポイント

| 方法   | パス                                   | 認証 | 役割                               |
| ------ | -------------------------------------- | ---- | ---------------------------------- |
| GET    | `/api/content/schema`                  | なし | プラグイン用 JSON Schema           |
| GET    | `/api/content/index`                   | なし | 全コレクション index               |
| GET    | `/api/content/index/:collection`       | なし | コレクション index                 |
| GET    | `/api/content/:collection/:slug`       | なし | Markdown 本文                      |
| PUT    | `/api/content/:collection/:slug`       | HMAC | 本文を書く。失敗時は R2 に書かない |
| DELETE | `/api/content/:collection/:slug`       | HMAC | `md/` だけ消す。メディアは残る     |
| POST   | `/api/content/:collection/:slug/media` | HMAC | 添付を `me-images` へ              |

コレクション: `blog` / `gallery` / `atelier` / `books`  
スラッグ: `^[a-z0-9][a-z0-9-]{0,80}$`  
v1 は `.md` のみ。MDX は 400。

日付の正は `publish_date`（必須）と `revise_date`（任意）。PUT は過渡中 `date` / `updatedDate` も受け付け、検証後は `publish_date` / `revise_date` に寄せる。`completedDate`（gallery）と `finishedDate`（books）はそのまま。

## HMAC

署名対象は **時刻 + パス + 本文**（UTF-8 連結）。時計ずれは 5 分。

```
message   = "{unixSeconds}{pathname}{body}"
signature = hex(HMAC-SHA256(CONTENT_HMAC_SECRET, message))
```

ヘッダー:

- `X-Content-Timestamp`: unix 秒
- `X-Content-Signature`: hex  
  または `Authorization: HMAC-SHA256 <hex>`

シークレットはソースに置かない。

```bash
wrangler secret put CONTENT_HMAC_SECRET
```

ローカルは `.dev.vars`（リポジトリに入れない）。雛形は `.dev.vars.example`。

## R2 キー

`me-content`（非公開）:

- `md/{collection}/{slug}.md`
- `index/{collection}.json`
- `index/all.json`
- `derived/rss-blog.xml`
- `derived/sitemap-urls.json`
- `derived/llms-blog.txt`
- `derived/embeds/{sha256(url)}.json`

`me-images`（公開）:

- `content/{collection}/{slug}/{filename}`
- URL: `https://images.ta93abe.com/content/...`

PUT / DELETE は同期で index と `derived/` を冪等に書き直す。ブログ PUT は本文の単独 URL / X ポスト / YouTube も `derived/embeds/` に解決する。R2 の `md/` 通知は Queue `content-events` でも同じ再構築と Cache purge（`/blog` HTML、`/rss.xml`、sitemap、llms、OG）を行う。TTL 内の embed は Queue 側では取り直さない。再公開（PUT）では取り直す。

`/sitemap-blog.xml` の `/blog/` 一覧 URL の `lastmod` は、公開記事の `revise_date`（なければ `publish_date`）の最大値（YYYY-MM-DD、UTC）にする。記事が 0 件のときは一覧エントリ自体を出さない。この sitemap はリクエスト時生成のため、ビルド時刻は使わない。

## curl（wrangler dev）

```bash
export CONTENT_HMAC_SECRET='replace-me'
export ORIGIN='http://127.0.0.1:8787'
PATHNAME='/api/content/blog/hello'
BODY='---
title: Hello Workers
excerpt: Stage 1 note
publish_date: 2026-08-30
---

Published from curl.
'
TS="$(date +%s)"
SIG="$(python3 - <<'PY'
import hashlib, hmac, os
secret = os.environ["CONTENT_HMAC_SECRET"].encode()
message = (os.environ["TS"] + os.environ["PATHNAME"] + os.environ["BODY"]).encode()
print(hmac.new(secret, message, hashlib.sha256).hexdigest())
PY
)"

curl -sS -X PUT "$ORIGIN$PATHNAME" \
  -H "X-Content-Timestamp: $TS" \
  -H "X-Content-Signature: $SIG" \
  --data-binary "$BODY"

curl -sS "$ORIGIN$PATHNAME"
curl -sS "$ORIGIN/api/content/index/blog"
```

`scripts/content-api-curl.sh` が同じ手順をまとめる。

## ブログ本文の X ポスト埋め込み

ポスト URL を単独行に貼ると、公開時に Worker が内容を取得して `derived/embeds/{sha256(url)}.json` に書き、静的カードにする（widgets.js は使わない）。表示時はキャッシュを読む。訪問者向けのプロキシは置かない。

```md
https://x.com/jack/status/20
```

Markdown リンクやプロトコルなしでも同じ。

```md
[https://x.com/jack/status/20](https://x.com/jack/status/20)
x.com/jack/status/20
```

Zenn 記法も使える。

```md
@[tweet](https://x.com/jack/status/20)
```

`twitter.com` / `x.com` / `mobile.` / `www.` / `/i/status/` に対応する。コードブロック内や文中の URL は埋め込まない。取得に失敗したときは「Xでポストを見る」リンクカードになる。

## ブログ本文の YouTube 埋め込み

動画 URL を単独行に貼ると、公開時に Worker が oEmbed で題名を取得して `derived/embeds/{sha256(url)}.json` に書き、静的カードにする（iframe は使わない）。表示時はキャッシュを読む。

```md
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

短縮 URL や Markdown リンク、プロトコルなしでも同じ。

```md
https://youtu.be/dQw4w9WgXcQ
[動画](https://youtu.be/dQw4w9WgXcQ)
youtu.be/dQw4w9WgXcQ
```

Zenn 記法も使える。

```md
@[youtube](dQw4w9WgXcQ)
@[youtube](https://www.youtube.com/watch?v=dQw4w9WgXcQ)
```

`youtube.com` / `youtu.be` / `m.` / `music.` / Shorts / Live / embed に対応する。コードブロック内や文中の URL は埋め込まない。取得に失敗したときはサムネイル付きの「YouTubeで動画を見る」カードになる。

## ブログ本文の URL カード

ポスト以外の http(s) URL を単独行に貼ると、公開時に Worker が OGP を取って `derived/embeds/{sha256(url)}.json` に書く。表示はキャッシュを読むだけ。文中のリンクはそのまま。新しい記法は使わない。

```md
https://coosenp.ai

[CooSenpAI](https://coosenp.ai)
```

タイトル・説明・サムネイル・ドメインを出す。`og:image` は最終 URL を基準に解決し、https だけ `<img>` にする。取得 HTML は本文に入れない。キャッシュ欠けるときはドメインだけの薄いカードになる。X のステータス URL と YouTube の動画 URL は上の専用埋め込みが優先する。訪問者向けのプロキシは置かない（Worker が公開時に取る）。Spotify の専用プレイヤーはまだ入れていない。
