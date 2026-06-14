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

> 注意: DNS レコードはコードではなく Cloudflare ダッシュボード / API で管理する必要があります。

### 4.2 auth.md の agent_auth メタデータ

以下の形式を `auth.md` と `/.well-known/oauth-authorization-server` の両方に実装済みですが、isitagentready.com のスキャナーはまだ「agent_auth metadata was not found」と報告しています。

```json
{
  "agent_auth": {
    "register_uri": "https://ta93abe.com/auth.md",
    "supported_identity_types": ["anonymous"],
    "supported_credential_types": ["none"],
    "claim_uri": null,
    "revocation_uri": null
  }
}
```

スキャナーの実装が非公開のため、正確な形式は不明です。試行錯誤を続けるか、現状の Level 5 を維持するかの判断が必要です。

### 4.3 Web Bot Auth

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
- [ ] DNS-AID レコードを追加する（オプション、Cloudflare DNS 操作が必要）
- [ ] auth.md の agent_auth メタデータをスキャナーが認識する形式に調整する（実装非公開のため要判断）

---

*最終更新: 2026-06-14*
