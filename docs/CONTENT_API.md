# Content API（段階 1）

Obsidian プラグイン（`pubme`）と curl が使う Worker API。本文は非公開 R2 `me-content`、添付は公開 R2 `me-images`。Astro hybrid はこの段階では触らない。

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

`me-images`（公開）:

- `content/{collection}/{slug}/{filename}`
- URL: `https://images.ta93abe.com/content/...`

PUT / DELETE は同期で index を冪等に書き直す。R2 の `md/` 通知は Queue `content-events` でも同じ再構築を行う。

## curl（wrangler dev）

```bash
export CONTENT_HMAC_SECRET='replace-me'
export ORIGIN='http://127.0.0.1:8787'
PATHNAME='/api/content/blog/hello'
BODY='---
title: Hello Workers
excerpt: Stage 1 note
date: 2026-08-30
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
