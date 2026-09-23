# HSTS（Strict-Transport-Security）

Linear: [TA-1133](https://linear.app/ta93abe/issue/TA-1133)

## 正本

本番 `https://ta93abe.com` の HSTS は次の二箇所で揃える。

| レイヤ | 場所 | 対象 |
| --- | --- | --- |
| 静的アセット | `public/_headers` の `/*` | prerender HTML、画像、`robots.txt` など |
| Worker | `worker/security-headers.ts` → `setGeneratedHeaders` | `/llms.txt`、`/.well-known/*`、OG PNG、blog SSR など |

値（2026-09 時点）:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

`preload` は安定運用を確認するまで付けない（TA-1133）。

## 検証

```bash
curl -sI https://ta93abe.com/ | grep -i strict-transport-security
curl -sI https://ta93abe.com/blog/ | grep -i strict-transport-security
curl -sI https://ta93abe.com/llms.txt | grep -i strict-transport-security
```

Lighthouse の `has-hsts` は `max-age` が十分長いこと（目安 6 か月以上）を見る。Playwright の `tests/security-headers.spec.ts` もプレビューで同ヘッダを確認する。

## Cloudflare ダッシュボード（任意・人間作業）

コード側でヘッダを出す運用を正とする。ゾーンの **SSL/TLS → Edge Certificates → HTTP Strict Transport Security (HSTS)** を有効にする場合は、**二重送信や値の食い違い**を避ける。

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → ゾーン `ta93abe.com`
2. **SSL/TLS** → **Edge Certificates**
3. **HTTP Strict Transport Security (HSTS)** → **Enable HSTS**
4. 初回は TA-1133 のとおり **Max Age = 300（5 分）** で様子を見てもよい。本番反映後は **`max-age=31536000`（1 年）** に `_headers` / Worker と揃える
5. **Include subdomains**: 有効（コード側と一致）
6. **Preload**: **オフ**（TA-1133）
7. **No-Sniff**: サイトの `X-Content-Type-Options` 方針に合わせる（本 repo では `_headers` / Worker で既に付与）

ダッシュボードだけで完結させる場合も、上記 Max Age / preload 方針は同じ。可能なら `_headers` と Worker に同値を残し、設定のドリフトを防ぐ。

## max-age を上げるとき

1. ステージングまたは短い max-age で `curl` と Lighthouse を確認
2. `public/_headers` と `worker/security-headers.ts` の `STRICT_TRANSPORT_SECURITY` を同じ文字列に更新
3. デプロイ後、本番 URL で再検証
4. preload を検討する段階になったら別 Issue / ADR で（hstspreload.org 要件は 2 年・全サブドメイン・redirect など）
