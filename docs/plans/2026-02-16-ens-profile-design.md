# ENS Profile Display Design

Linear Issue: TA-351

## Goal

`ta93abe.eth` のENSプロフィール情報をビルド時に取得し、トップページのAboutセクションに3Dインタラクティブカードとして表示する。

## Architecture

```
[Astro Build Time]
  └─ src/utils/ens.ts (viem)
       └─ Cloudflare Ethereum Gateway (cloudflare-eth.com)
            └─ ENS Registry → Resolver → Profile Data

[Output: Static HTML + Client JS for 3D interaction]
```

## Data Flow

1. ビルド時に `src/utils/ens.ts` が viem で `ta93abe.eth` のプロフィールを取得
2. `AboutSection.astro` が `ens.ts` をインポートしてデータ取得
3. `EnsProfileCard.astro` がカード形式でレンダリング
4. クライアントJSがマウス/ジャイロ追従の3D回転を処理
5. 出力は静的HTML — ランタイムでのEthereum呼び出しなし

## ENS Records to Fetch

| Record | Key | Usage |
|--------|-----|-------|
| Avatar | avatar | カードのアバター画像 |
| Description | description | プロフィール説明文 |
| Twitter | com.twitter | SNSリンク |
| GitHub | com.github | SNSリンク |
| URL | url | ウェブサイトリンク |
| Address | (resolved) | ウォレットアドレス表示 |

## New Files

| File | Purpose |
|------|---------|
| `src/utils/ens.ts` | viem でENSプロフィール取得 |
| `src/components/landing/EnsProfileCard.astro` | 3Dカードコンポーネント |
| `src/__tests__/utils/ens.test.ts` | ENSユーティリティのテスト |

## Modified Files

| File | Change |
|------|--------|
| `src/components/landing/AboutSection.astro` | EnsProfileCard を追加 |
| `src/config/site.ts` | `ensName` 設定を追加 |
| `package.json` | viem を依存に追加 |

## 3D Card Interaction

- CSS `perspective(1000px)` + `transform-style: preserve-3d`
- マウス位置に応じて `rotateX` / `rotateY` を計算
- ホログラフィック光沢グラデーション（マウス追従）
- モバイル: `DeviceOrientationEvent` でジャイロ追従
- `prefers-reduced-motion` 対応: アニメーション無効時はフラット表示

## Error Handling

- ENS解決失敗時 → カードを非表示（グレースフルデグレード）
- アバター未設定 → デフォルトアイコン表示
- 各テキストレコード未設定 → その項目をスキップ

## Dependencies

- `viem`: Ethereum interaction (ENS resolution at build time only)

## Approach Decision

viem を採用。理由:
- Tree-shakeable で軽量
- TypeScript-first
- ENS専用API (`getEnsAvatar`, `getEnsText`, `getEnsAddress`) あり
- Cloudflare Ethereum Gateway をトランスポートに直接使用可能
- ビルド時のみ実行のため、バンドルサイズに影響なし
