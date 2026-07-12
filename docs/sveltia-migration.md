# Sveltia CMS 導入ガイド

このサイト（Astro + Content Collections + Cloudflare Workers）に [Sveltia CMS](https://sveltiacms.app/) を導入し、
**「ローカルエディタでも、ブラウザの管理画面でも書ける。画像は R2 にホストされる」** 体制を作るためのガイド。

## 全体像

```
┌─ ローカルエディタ ── .md 編集 → git push ─┐
│                                          ├─→ GitHub (ta93abe/me) ─→ GitHub Actions ─→ wrangler deploy
└─ Sveltia CMS (GUI) ─ テキスト → commit ──┘
                       └ 画像 → R2 バケットへ直接アップロード（公開 URL を Markdown に記録）
```

- **真のソースは Git**。GUI で書いてもローカルで書いても、同じ `src/content/**/*.md` に収束する
- 同期処理は存在しない（双方向同期の競合問題が原理的に発生しない）
- 画像だけは R2 に保存され、Markdown には公開 URL が書き込まれる

### 変わらないもの

- Content Collections のスキーマ（`src/content.config.ts`）はそのまま
- ローカルで Markdown を書いて `gt create` / push するフローはそのまま
- works / books の `coverImage: image()`（Astro ビルド時最適化）はそのまま

### 新しく増えるもの

| 追加物 | 場所 |
|---|---|
| 管理画面ページ | `public/admin/index.html` |
| CMS 設定 | `public/admin/config.yml` |
| OAuth プロキシ | 別 Worker（`sveltia-cms-auth`、公式実装をデプロイ） |
| 画像バケット | R2（例: `me-images`） |
| インフラ定義 | `infra/alchemy.run.ts`（Alchemy v2 で R2 / auth Worker をコード管理） |
| 自動デプロイ | `.github/workflows/deploy.yml` |

---

## Step 1: 管理画面ページの設置

`public/admin/index.html` を作成する。Sveltia は CDN から読み込む 1 スクリプトで動く
（ビルドプロセスへの統合は不要。`public/` 配下なのでそのまま `dist/` に配信される）。

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>Content Manager</title>
  </head>
  <body>
    <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
  </body>
</html>
```

設定ファイルはデフォルトで同階層の `/admin/config.yml` が読まれる（Decap CMS と同じ規約）。
別の場所に置く場合は `<link href="..." type="application/yaml" rel="cms-config-url" />` で指定できる。

> `meta name="robots" content="noindex"` を忘れない。管理画面が検索結果に出るのを防ぐ。

### CDN 読み込みのセキュリティ（SRI）

上記のバージョン未指定 URL は常に最新版を配信するため、CDN 側が侵害された場合のリスクがある。
管理画面は GitHub への書き込み権限を持つページなので、本番では次のいずれかを推奨する:

- **バージョン固定 + SRI**: `https://unpkg.com/@sveltia/cms@x.y.z/dist/sveltia-cms.js` のように
  バージョンを固定し、`integrity="sha384-..." crossorigin="anonymous"` を付与する
  （ハッシュは `curl -s <URL> | openssl dgst -sha384 -binary | openssl base64 -A` で生成）。
  アップデート時はバージョンとハッシュを揃えて更新する
- **セルフホスト**: `pnpm add @sveltia/cms` して `node_modules/@sveltia/cms/dist/sveltia-cms.js` を
  `public/admin/` にコピーする（CDN 依存がなくなり、更新は pnpm 管理になる）

## Step 2: GitHub 認証（sveltia-cms-auth）

Sveltia が GitHub にコミットするための OAuth プロキシを Cloudflare Workers にデプロイする。
クライアントシークレットをブラウザに晒さないためのサーバーサイド実装で、公式リポジトリが用意されている。

**リポジトリ**: https://github.com/sveltia/sveltia-cms-auth

1. **Worker のデプロイ**
   - リポジトリの「Deploy to Cloudflare Workers」ボタン、または clone して `wrangler deploy`
   - デプロイ後の URL を控える（例: `https://sveltia-cms-auth.<SUBDOMAIN>.workers.dev`）

2. **GitHub OAuth App の作成**
   - https://github.com/settings/applications/new
   - Authorization callback URL: `<WORKER_URL>/callback`
   - Client ID と Client Secret を控える

3. **Worker の環境変数を設定**（Cloudflare ダッシュボード → Worker → Settings → Variables）

   | 変数 | 値 |
   |---|---|
   | `GITHUB_CLIENT_ID` | OAuth App の Client ID |
   | `GITHUB_CLIENT_SECRET` | OAuth App の Client Secret（**Encrypt を押す**） |
   | `ALLOWED_DOMAINS` | `ta93abe.com`（このドメイン以外からの認証要求を拒否） |

## Step 3: R2 メディアライブラリ

画像を Git リポジトリではなく R2 に保存する設定。Sveltia は R2 をネイティブサポートしている。

1. **バケット作成**: 例 `me-images`

2. **公開アクセスの設定**
   - R2 の S3 API は常に認証必須のため、閲覧用に別途 `public_url` が必要
   - 本番はバケットにカスタムドメインを接続する（例: `images.ta93abe.com`）。
     開発中は R2 が発行する `https://pub-<hash>.r2.dev` でも可

3. **R2 API トークンの作成**
   - R2 は Cloudflare のグローバル API キーとは別の独自トークンシステムを使う
   - ダッシュボードから **Object Read & Write** 権限で、対象バケットにスコープを絞って作成
   - **Access Key ID** → `config.yml` に書く（公開されて良い値）
   - **Secret Access Key** → `config.yml` には書かない。**初回利用時に CMS の UI で入力**し、
     ブラウザの localStorage に保存される仕組み

4. **CORS の設定**（必須）
   - Sveltia は AWS Signature v4 のカスタムヘッダー付きでアップロードするため、
     プリフライトリクエストを許可する CORS 設定がバケットに必要
   - R2 ダッシュボード → バケット → Settings → CORS Policy:

   ```json
   [
     {
       "AllowedOrigins": ["https://ta93abe.com", "http://localhost:4321"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedHeaders": ["*"]
     }
   ]
   ```

## インフラのコード化（Alchemy v2）

Step 2 の Worker デプロイと Step 3 のバケット作成は、ダッシュボード操作の代わりに
[Alchemy v2](https://v2.alchemy.run/)（TypeScript ネイティブな IaC、Effect ベース）でコード管理する。

```
infra/
├── alchemy.run.ts          # スタック定義
└── sveltia-cms-auth/       # OAuth プロキシのソース（公式リポジトリから vendoring）
    └── index.js
```

```typescript
// infra/alchemy.run.ts
import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

export default Alchemy.Stack(
	"me-cms",
	{ providers: Cloudflare.providers(), state: Cloudflare.state() },
	Effect.gen(function* () {
		// Sveltia がアップロードする画像バケット
		const images = yield* Cloudflare.R2Bucket("Images");

		// GitHub OAuth プロキシ（sveltia-cms-auth）
		const auth = yield* Cloudflare.Worker("SveltiaAuth", {
			main: "./infra/sveltia-cms-auth/index.js",
			vars: {
				ALLOWED_DOMAINS: "ta93abe.com",
				// GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET はシークレットとして注入する
				// （Alchemy のシークレットストア連携の作法は実装時に v2 ドキュメントで確認）
			},
		});

		return {
			authUrl: auth.url,
			imagesBucket: images.bucketName,
		};
	}),
);
```

デプロイ・破棄は CLI から:

```bash
alchemy deploy infra/alchemy.run.ts --stage prod
alchemy destroy infra/alchemy.run.ts --stage prod
```

### 手作業として残るもの

| 作業 | 理由 |
|---|---|
| GitHub OAuth App の作成 | GitHub 側のリソースのため（Client ID/Secret を取得して Alchemy のシークレットに渡す） |
| R2 API トークンの発行 | Sveltia がブラウザから直接 R2 に書き込むための認証情報（Step 3-3） |
| R2 の CORS 設定・カスタムドメイン | Alchemy v2 の R2Bucket での対応状況を実装時に確認。未対応なら `wrangler r2 bucket cors put` とダッシュボードで補完 |
| Secret Access Key の入力 | 設計上、CMS の UI から入力する（localStorage 保存） |

### 将来の拡張

サイト本体（現在は `wrangler.jsonc` + `wrangler deploy`）も `Cloudflare.Vite("Site")` で
Alchemy に寄せられる（Astro は Vite 経由でビルドされ、静的 / SSR どちらも 1 宣言）。
まずは新規インフラ（R2 + auth Worker）だけ Alchemy 管理にし、本体の移行は別途判断する。

## Step 4: CMS 設定（config.yml）

`public/admin/config.yml`。まずは blog コレクションのみで開始する
（フィールドは `src/content.config.ts` の blog スキーマと 1:1 対応させる）。

```yaml
backend:
  name: github
  repo: ta93abe/me
  branch: main
  base_url: https://sveltia-cms-auth.<SUBDOMAIN>.workers.dev # Step 2 の Worker URL

# 内部メディア（R2 を使わない場合のフォールバック先）
media_folder: public/uploads
public_folder: /uploads

# 画像アップロード先を R2 に
media_libraries:
  cloudflare_r2:
    access_key_id: <R2_ACCESS_KEY_ID> # Step 3 のトークンの Access Key ID
    account_id: <CLOUDFLARE_ACCOUNT_ID>
    bucket: me-images
    public_url: https://images.ta93abe.com # カスタムドメイン（または r2.dev URL）
    prefix: blog/ # 任意。バケット内のキープレフィックス

collections:
  - name: blog
    label: Blog
    folder: src/content/blog
    create: true
    extension: md
    format: yaml-frontmatter
    slug: "{{slug}}"
    fields:
      - { name: title, label: タイトル }
      - { name: date, label: 公開日, widget: datetime }
      - { name: updatedDate, label: 更新日, widget: datetime, required: false }
      - { name: excerpt, label: 概要 }
      - { name: tags, label: タグ, widget: list, required: false }
      - { name: body, label: 本文, widget: markdown }
```

### 注意点

- **MDX**: `extension: md` のため、既存の `.mdx` 記事（`mdx-demo.mdx` など）は
  この管理画面には表示されない。MDX はコンポーネントを含むためローカル編集のままとする
- **コミット先**: GUI での保存は `main` に直接コミットされる（PR を経由しない）。
  Graphite のスタックフローとは独立した「コンテンツ専用の直コミット」と割り切る
- **拡張**: 運用が回り始めたら works / books / talks を順次コレクション追加する。
  works / books は `coverImage: image()`（ローカル画像必須）なので、
  R2 参照に変える場合はスキーマを `z.string().url()` に変更する判断が必要

## Step 5: 自動デプロイ

GUI からのコミットもローカルからの push も、main に入ったら自動でビルド・デプロイされるようにする。
これがないと「GUI で保存したのにサイトに反映されない」状態になる。

`.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

- GitHub リポジトリの Secrets に `CLOUDFLARE_API_TOKEN` を登録する
  （Workers Scripts: Edit 権限のトークンをダッシュボードで作成）
- PostHog 等の環境変数がビルドに必要な場合は `env:` で渡す（`.env.example` 参照）

## ローカル開発ワークフロー

Sveltia には OAuth 不要の **ローカルリポジトリモード** がある。
デプロイ前でも管理画面の使い勝手を試せる。

1. `pnpm dev` を起動
2. Chromium 系ブラウザ（Chrome / Edge / Brave）で `http://localhost:4321/admin/` を開く
   （File System Access API 依存のため Firefox / Safari 不可。Brave はフラグで有効化が必要）
3. 「Work with Local Repository」を選び、プロジェクトフォルダを指定
4. 保存するとローカルの `.md` ファイルが直接書き換わる → 確認して自分で commit / push

## 移行チェックリスト

- [ ] `public/admin/index.html` を作成
- [ ] GitHub OAuth App 作成（Client ID / Secret を取得）
- [ ] `infra/alchemy.run.ts` で R2 バケット + sveltia-cms-auth Worker を定義し `alchemy deploy`
- [ ] R2 API トークン作成、CORS 設定、カスタムドメイン接続（Alchemy 未対応分は wrangler / ダッシュボード）
- [ ] `public/admin/config.yml` を作成（blog コレクション）
- [ ] `.github/workflows/deploy.yml` を追加、`CLOUDFLARE_API_TOKEN` を Secrets に登録
- [ ] ローカルリポジトリモードで動作確認
- [ ] デプロイ後、`https://ta93abe.com/admin/` から GitHub ログイン → 記事作成 → 自動デプロイまで通し確認
- [ ] （任意）works / books / talks のコレクション追加を検討

## トラブルシューティング

| 症状 | 原因と対処 |
|---|---|
| 画像アップロードが失敗する | R2 バケットの CORS 未設定。Step 3-4 を確認 |
| 画像プレビューが表示されない | `public_url` 未設定または間違い。S3 エンドポイントは閲覧に使えない |
| ログインできない | OAuth App の callback URL が `<WORKER_URL>/callback` になっているか、`ALLOWED_DOMAINS` にドメインが含まれるか確認 |
| GUI で保存したのに反映されない | 自動デプロイ（Step 5）が動いているか GitHub Actions のログを確認 |
| 記事一覧に .mdx が出ない | 仕様（`extension: md`）。MDX はローカル編集で扱う |
| ローカルモードのボタンが出ない | Chromium 系ブラウザか確認。Brave は `brave://flags/#file-system-access-api` を有効化 |

## 参考リンク

- [Sveltia CMS ドキュメント](https://sveltiacms.app/en/docs/intro)
- [Astro との統合](https://sveltiacms.app/en/docs/frameworks/astro)
- [Cloudflare R2 メディアライブラリ](https://sveltiacms.app/en/docs/media/cloudflare-r2)
- [ローカル開発ワークフロー](https://sveltiacms.app/en/docs/workflows/local)
- [sveltia-cms-auth（OAuth プロキシ）](https://github.com/sveltia/sveltia-cms-auth)
- [Netlify/Decap CMS からの移行](https://sveltiacms.app/en/docs/migration/netlify-decap-cms)
