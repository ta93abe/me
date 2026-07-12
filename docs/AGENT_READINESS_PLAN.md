# Agent Readiness Improvement Plan

このドキュメントは、[isitagentready.com](https://isitagentready.com/) で高得点を取るための対策と、AI エージェントが ta93abe.com を発見・理解しやすくするための改善計画です。

## 1. 現状スコア

- **スキャン日**: 2026-06-14
- **現在のレベル**: Level 5 — Agent-Native（isitagentready.com の最高レベル）
- **スキャン URL**: https://isitagentready.com/?url=https://ta93abe.com/

デプロイ後のスキャン結果:

| カテゴリ | pass | fail | neutral |
|----------|------|------|---------|
| Discoverability | 3 | 1 (dnsAid) | 0 |
| Content Accessibility | 1 | 0 | 0 |
| Bot Access Control | 2 | 0 | 1 (webBotAuth) |
| Discovery | 7 | 1 (authMd) | 0 |
| Commerce | 0 | 0 | 5 |

## 2. 今回実装した対策

### 2.1 Cloudflare Workers 設定の修正

`wrangler.jsonc`:

- `compatibility_date` を最新に更新
- `assets.binding` に `ASSETS` を明示
- `run_worker_first: true` を追加して Worker が発見エンドポイントを処理できるようにする

### 2.2 Worker エンドポイントの強化

`worker/index.ts`:

- `llms.txt` / `llms-full.txt`
- `/auth.md`
- `/.well-known/api-catalog`
- `/.well-known/mcp/server-card.json` / `/.well-known/mcp.json`
- `/.well-known/agent-skills/index.json`
- `/.well-known/agent-skills/site-overview/SKILL.md`
- `/mcp`（JSON-RPC 2.0 の最小実装）
- `/.well-known/agent-card.json`（A2A Agent Card）
- `/.well-known/oauth-authorization-server`（OAuth 認可サーバー metadata）
- `/.well-known/oauth-protected-resource`（OAuth 保護リソース metadata）
- 未実装の Web Bot Auth / Commerce エンドポイントに対して **500 ではなく 404** を返す

### 2.3 ホームページの発見ヘッダー

`worker/index.ts`:

- `Link` レスポンスヘッダーに発見用 URL を追加
- `Content-Signal` レスポンスヘッダーを設定

### 2.4 robots.txt / _headers の強化

`public/robots.txt`:

- 主要 AI クローラー（GPTBot、ClaudeBot、Google-Extended など）への明示的な `Allow`
- `Content-Signal: ai-train=no, search=yes, ai-input=yes` の宣言

`public/_headers`:

- 全レスポンスに `Content-Signal` ヘッダーを追加

### 2.5 WebMCP ツール登録

`src/layouts/Layout.astro`:

- `navigator.modelContext` が利用可能な場合、`get_site_overview` ツールを登録

### 2.6 開発環境の安定化

`pnpm-workspace.yaml`:

- pnpm v11 の新しい `allowBuilds` 形式に修正（`esbuild` / `sharp` / `workerd` を `true` に設定）

## 3. 実際のデプロイ後スコア

2026-06-14 にデプロイした結果、**Level 5 — Agent-Native** に到達しました。

| カテゴリ | チェック | 結果 |
|----------|----------|------|
| Discoverability | robots.txt | pass |
| Discoverability | sitemap | pass |
| Discoverability | linkHeaders | pass |
| Discoverability | dnsAid | **fail**（DNS レコードが必要） |
| Content Accessibility | markdownNegotiation | pass |
| Bot Access Control | robotsTxtAiRules | pass |
| Bot Access Control | contentSignals | pass |
| Bot Access Control | webBotAuth | neutral |
| Discovery | apiCatalog | pass |
| Discovery | oauthDiscovery | pass |
| Discovery | oauthProtectedResource | pass |
| Discovery | authMd | **fail**（スキャナーが期待する `agent_auth` メタデータの形式が不明） |
| Discovery | mcpServerCard | pass |
| Discovery | a2aAgentCard | pass |
| Discovery | agentSkills | pass |
| Discovery | webMcp | pass |
| Commerce | x402 / mpp / ucp / acp / ap2 | neutral |

## 4. 追加で検討すべき対策

### 4.1 DNS for AI Discovery（DNS-AID）

DNS-AID には以下の DNS レコードを Cloudflare DNS に追加する必要があります。

```text
; インデックスレコード（必須）
TXT _index._agents.ta93abe.com "path=/.well-known/agent-discovery"

; MCP エンドポイント
SVCB _mcp._agents.ta93abe.com 1 ta93abe.com. alpn=h2,h3 path=/mcp
HTTPS _mcp._agents.ta93abe.com 1 ta93abe.com. alpn=h2,h3 path=/mcp

; A2A エンドポイント
SVCB _a2a._agents.ta93abe.com 1 ta93abe.com. alpn=h2,h3 path=/.well-known/agent-card.json
HTTPS _a2a._agents.ta93abe.com 1 ta93abe.com. alpn=h2,h3 path=/.well-known/agent-card.json
```

> 更新（2026-07-12）: DNS レコードは [Alchemy v2](https://v2.alchemy.run/)（TypeScript IaC）で
> コード管理する方針にした（`docs/sveltia-migration.md` の Alchemy セクション参照）。
> Alchemy v2 の Cloudflare DNS レコードリソースの対応状況（特に SVCB / HTTPS レコード型）は
> 実装時に確認し、未対応なら Cloudflare API を直接呼ぶ薄いリソースで補完する。

### 4.2 auth.md の agent_auth メタデータ

**更新（2026-07-12）: 正式仕様が判明。** auth.md は WorkOS の公開プロトコル
（[workos/auth.md](https://github.com/workos/auth.md)）で、`agent_auth` ブロックは
`/.well-known/oauth-authorization-server` メタデータに置く。前回実装が fail だった原因は
フィールド名と構造の相違と推測される：

- `skill` フィールド（auth.md ドキュメントの URL）が**欠けていた** — これが発見の起点
- `supported_identity_types` → 正しくは **`identity_types_supported`**
- `supported_credential_types` → 正しくは **ID タイプごとにネスト**する
  （例: `anonymous.credential_types_supported`）

仕様に沿った修正版（公開読み取り専用サイトなので anonymous のみサポート）：

```json
{
  "agent_auth": {
    "skill": "https://ta93abe.com/auth.md",
    "register_uri": "https://ta93abe.com/agent/auth",
    "identity_types_supported": ["anonymous"],
    "anonymous": {
      "credential_types_supported": ["api_key"]
    }
  }
}
```

あわせて `auth.md` 本文も、プロトコルが定めるステップ構成
（Discover → Pick a method → Register → Claim ceremony → Use the credential → Errors → Revocation）
に沿って書き直す。`register_uri` が指す `/agent/auth` は Worker に最小実装
（anonymous 登録で API キー相当のトークンを返す、または明示的に 501 を返して
メタデータのみ提供）を用意するか、スキャナーがメタデータの存在だけを見るかを
デプロイ後のスキャンで検証する。

### 4.3 x402 投げ銭エンドポイント（Commerce 対応）

**追加（2026-07-12）**: Commerce カテゴリ（現状 neutral ×5）のうち x402 に対応する。
方針は **Base mainnet の USDC を受け取る投げ銭（tip）エンドポイント**。
既存コンテンツはすべて無料のままにし、Content Accessibility の pass を維持する。

**フロー**（[x402 プロトコル](https://github.com/coinbase/x402)）:

1. エージェントが `/tip` にリクエスト → Worker が **402 Payment Required** と
   `PAYMENT-REQUIRED` ヘッダー（Base64 エンコードした支払い条件 JSON）を返す
2. 支払い条件: `scheme: exact` / `network: base` / asset: USDC /
   `payTo: <受取アドレス>`。exact スキームは固定額のため、投げ銭は
   金額ティア（例: $0.10 / $1 / $5 の accepts 複数エントリ）で表現する
3. エージェントが署名済み支払いペイロード付きで再リクエスト →
   Worker が **facilitator（Coinbase CDP）** の verify / settle API を呼んで検証・決済 →
   200 でお礼のレスポンスを返す

**実装方針**: `worker/index.ts` は素の fetch ハンドラなので、Hono を導入せず
facilitator の REST API を直接叩く薄い実装とする（サーバーは秘密鍵もチェーンも扱わない）。
`/tip` は llms.txt / `/.well-known/api-catalog` / agent-card にも記載して発見可能にする。

**ユーザー側で必要な準備**（コードでは代行できない）:

1. Base ネットワークの受取ウォレットアドレス（公開情報）
2. Coinbase CDP アカウントの作成と API キーの発行（mainnet の facilitator 利用に必要）。
   キーは Worker のシークレット（`wrangler secret put` または Alchemy のシークレット）に設定

**検証**: isitagentready.com の Commerce チェックの検出方法は非公開のため、
デプロイ後に再スキャンして x402 が neutral → pass に変わるかを確認する。

### 4.4 Web Bot Auth

このサイトは公開コンテンツのみ提供するため、Web Bot Auth は不要です。スキャナーは neutral（情報提供のみ）として扱っています。

## 5. デプロイ手順

```bash
# 1. 依存関係のインストール
pnpm install

# 2. ビルド
pnpm build

# 3. Wrangler によるデプロイ
pnpm deploy
# または: wrangler deploy

# 4. スキャンし直す
# https://isitagentready.com/?url=https://ta93abe.com/
```

## 6. 完了の定義

- [x] `pnpm build` と `wrangler deploy` が成功する
- [x] https://isitagentready.com/?url=https://ta93abe.com/ で Level 5（Agent-Native）に到達する
- [x] 主要な Discovery エンドポイントが 200 を返す
- [x] 未実装の Web Bot Auth / Commerce エンドポイントが 500 ではなく 404 を返す
- [ ] DNS-AID レコードを追加する（Alchemy v2 でコード管理、4.1 参照）
- [ ] agent_auth メタデータを workos/auth.md 仕様に修正する（4.2 参照、正式仕様判明済み）
- [ ] デプロイ後に再スキャンし、dnsAid / authMd が pass になることを確認する
- [ ] x402 投げ銭エンドポイント `/tip` を実装する（4.3 参照。受取アドレスと CDP API キーが前提）

---

*最終更新: 2026-07-12*
