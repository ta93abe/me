# Agent Readiness Improvement Plan

このドキュメントは、[isitagentready.com](https://isitagentready.com/) で高得点を取るための対策と、AI エージェントが ta93abe.com を発見・理解しやすくするための改善計画です。

## 1. 現状スコア

- **スキャン日**: 2026-06-14
- **現在のレベル**: Level 1 — Basic Web Presence
- **次のレベル**: Level 2 — Bot-Aware（Content-Signal の実装が必要）

現在のデプロイ済みバージョンでは、Worker 経由で提供すべき発見用エンドポイント（`/.well-known/api-catalog`、`/.well-known/mcp/server-card.json`、`/.well-known/agent-skills/index.json`、`/auth.md` など）が **500 Internal Server Error** を返しています。これは `wrangler.jsonc` に `run_worker_first: true` と `ASSETS` バインディングが未設定だったため、Worker がリクエストを横取りできなかったことが原因です。

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
- **追加**: `/.well-known/agent-card.json`（A2A Agent Card）
- **追加**: 未実装の OAuth / Web Bot Auth / Commerce エンドポイントに対して **500 ではなく 404** を返す

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

## 3. デプロイ後に期待されるスコア変化

上記変更をデプロイすると、以下のチェックが pass する見込みです。

| カテゴリ | チェック | デプロイ後の見通し |
|----------|----------|-------------------|
| Discoverability | robots.txt | pass |
| Discoverability | sitemap | pass |
| Discoverability | linkHeaders | pass |
| Discoverability | dnsAid | **fail**（DNS レコードが必要） |
| Content Accessibility | markdownNegotiation | pass |
| Bot Access Control | robotsTxtAiRules | pass |
| Bot Access Control | contentSignals | pass |
| Bot Access Control | webBotAuth | **neutral/404**（実装不要） |
| Discovery | apiCatalog | pass |
| Discovery | oauthDiscovery | **neutral/404**（コンテンツサイトのため不要） |
| Discovery | oauthProtectedResource | **neutral/404**（コンテンツサイトのため不要） |
| Discovery | authMd | pass |
| Discovery | mcpServerCard | pass |
| Discovery | a2aAgentCard | pass |
| Discovery | agentSkills | pass |
| Discovery | webMcp | **pass**（ブラウザ対応により） |
| Commerce | x402 / mpp / ucp / acp | **neutral**（コマースサイトではない） |

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

### 4.2 Web Bot Auth

このサイトは公開コンテンツのみ提供するため、Web Bot Auth は不要です。スキャナーは 404 を期待しない可能性がありますが、500 よりは安全で適切な応答です。

### 4.3 OAuth Discovery

保護されたリソースや認可サーバーを持たないコンテンツサイトのため、OAuth Discovery は不要です。404 を返すことで、エージェントに「認証は不要」という情報を明示できます。

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

- [ ] `pnpm build` と `wrangler deploy --dry-run` が成功する
- [ ] https://isitagentready.com/?url=https://ta93abe.com/ で Level 2 以上に到達する
- [ ] 主要な Discovery エンドポイント（`/.well-known/api-catalog`、`/.well-known/mcp/server-card.json`、`/.well-known/agent-skills/index.json`、`/llms.txt`、`/auth.md`）が 200 を返す
- [ ] 未実装の OAuth / Web Bot Auth エンドポイントが 500 ではなく 404 を返す

---

*最終更新: 2026-06-14*
