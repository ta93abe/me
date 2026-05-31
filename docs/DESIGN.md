# DESIGN.md — サイト設計・デザイン仕様

このサイトのテイスト・デザイン方針・コンテンツ設計をまとめるドキュメント。
実装の判断基準として使う。

---

## 1. コンセプト

### サイトの目的
<!-- 例: 自分の仕事・活動を広く知ってもらいたい / 採用・仕事の依頼 / 自己表現 -->

### ターゲット
<!-- 例: 採用担当 / 一緒に仕事したい開発者 / 勉強会での名刺代わり / 特に絞らない -->

### 一言で表すと
<!-- このサイトの雰囲気・世界観を一文で。例: "静かで鋭い、エンジニアの自己表現" -->

---

## 2. テイスト・世界観

### ムード
<!-- 例: ミニマル / エレガント / 実験的 / 職人的 / クール / ウォーム -->

### 参考サイト・インスピレーション
<!-- URL や「〇〇みたいな感じ」を貼る -->
-
-
-

### 避けたいもの
<!-- 例: ポップすぎる / アニメーション過多 / 情報過密 / コーポレートっぽい -->
-

### キーワード（3〜5個）
<!-- このサイトを形容する言葉。例: 黒 / 余白 / タイポグラフィ / 静 / 鋭 -->
-

---

## 3. ビジュアル仕様（実装済み）

### カラー
- **背景**: `neutral-950` (`#0a0a0a`)
- **テキスト**: `neutral-100` (`#f5f5f5`)
- **サブテキスト**: `neutral-400` (`#a3a3a3`)
- **ボーダー**: `neutral-800` (`#262626`)
- **アクセント**: `indigo-400` (`#818cf8`)

### タイポグラフィ
- **本文フォント**: Shippori Mincho（日本語明朝体）
- **Hero タイトル**: `clamp(4rem, 18vw, 12rem)` / font-weight 700
- **コードフォント**: SF Mono / Menlo / Courier New

### レイアウト
- **最大幅**: `max-w-4xl`（記事）/ `max-w-6xl`（グリッド）/ `max-w-7xl`（全体）
- **余白**: 基本 `px-6 py-12`
- **グリッド**: Works / Bookshelf は 2〜3カラム

### Hero セクション
- **スタイル**: 大きなタイポグラフィ中心
- **背景**: Three.js パーティクル（黒背景に灰色）
- **CTA**: 「View Works」「Links」の2ボタン

### アニメーション
- **パーティクル**: 常時アニメーション（`prefers-reduced-motion` 対応済み）
- **スクロール**: GSAP fade-up
- **ページ遷移**: なし

---

## 4. ページ構成・実装状態

| ページ | パス | 状態 | メモ |
|---|---|---|---|
| Landing | `/` | 実装済み・コンテンツ未 | Hero のみ表示中。About/Works/Blog セクション未 |
| About | `/about` | 未作成 | Landing に統合 or 独立ページ |
| Works | `/works` | 実装済み・サンプルのみ | 実プロジェクト未入力 |
| Blog | `/blog` | 実装済み・サンプルのみ | 実記事未入力 |
| Slides | `/slides` | 実装済み | talks.json 未入力 |
| Bookshelf | `/bookshelf` | 実装済み・サンプルのみ | 実データ未入力 |
| Links | `/links` | 実装済み | 公開サービス選定中（→ セクション 7） |
| Tools | `/tools` | 実装済み・データ入力済み | |

### Landing ページのセクション構成（予定）
```
Hero → About → Works（ピックアップ） → Blog（最新記事） → Links
```

---

## 5. コンテンツ

### プロフィール
- **名前**: Takumi Abe
- **肩書き**:
  <!-- 例: Software Engineer / Full-stack Developer / Creative Developer -->
- **Hero キャッチコピー**（現状: "Software Engineer & Creative Developer"）:
  <!-- 変更案があれば -->
- **自己紹介文**（About セクション・Landing 用、3〜5文）:
  <!--
  例: ソフトウェアエンジニアとして〜。
  コードと好奇心で〜。
  -->
- **スキル・専門領域**:
  <!-- 例: TypeScript / Go / React / Astro / インフラ / など -->
- **得意・好きな領域**:
- **興味・学習中**:
- **所在地**:

### Works（載せたいプロジェクト）

| プロジェクト名 | 概要 | 技術スタック | URL / GitHub | 期間 |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |

### Blog
- **メインの執筆場所**:
- **書いてきたテーマ**:
- **外部 RSS を取り込む**:
  <!-- Zenn / Qiita など -->

### Slides（登壇・LT）

| イベント名 | タイトル | 日付 | URL |
|---|---|---|---|
|  |  |  |  |

### Bookshelf
- **公開するか**:
- **ジャンル**:
- **スタイル**: 書評 / 一言メモ

---

## 6. テキスト・コピーライティング

### 言語方針
- **基本**: 日本語
- **ページ名・UI**: 英語（Works / Blog / Links など）
- **混在方針**:
  <!-- 例: 見出しは英語・本文は日本語 / 全部日本語 -->

### トーン
<!-- 例: フォーマル / カジュアル / 技術的 / 詩的 -->

---

## 7. Links ページ（公開サービス選定）

✅ = 公開する

### 開発・技術
| サービス | URL | 公開 |
|---|---|---|
| GitHub | https://github.com/ta93abe |  |
| Zenn | https://zenn.dev/ta93abe |  |
| Qiita | https://qiita.com/ta93abe |  |
| Speaker Deck | https://speakerdeck.com/ta93abe |  |
| connpass | https://connpass.com/user/ta93abe |  |
| Stack Overflow | https://stackoverflow.com/users/ta93abe |  |
| GitLab | https://gitlab.com/ta93abe | ✅ |
| Bitbucket | https://bitbucket.org/ta93abe |  |
| npm | https://npmjs.com/~ta93abe |  |
| CodePen | https://codepen.io/ta93abe |  |
| Kaggle | https://kaggle.com/ta93abe |  |
| Hugging Face | https://huggingface.co/ta93abe |  |
| Hashnode | https://hashnode.com/@ta93abe |  |
| Dev.to | https://dev.to/ta93abe |  |
| Product Hunt | https://producthunt.com/@ta93abe |  |

### SNS・ソーシャル
| サービス | URL | 公開 |
|---|---|---|
| X (Twitter) | https://x.com/ta93abe |  |
| Bluesky | https://bsky.app/profile/ta93abe.bsky.social |  |
| Threads | https://threads.net/@ta93abe |  |
| Mastodon | https://mastodon.social/@ta93abe |  |
| Instagram | https://instagram.com/ta93abe |  |
| Facebook | https://facebook.com/ta93abe |  |
| LinkedIn | https://linkedin.com/in/ta93abe |  |
| Mixi2 | https://mixi.social/@ta93abe | ✅ |
| Reddit | https://reddit.com/user/ta93abe |  |
| Tumblr | https://tumblr.com/ta93abe |  |

### 執筆・ブログ
| サービス | URL | 公開 |
|---|---|---|
| note | https://note.com/ta93abe | ✅ |
| Medium | https://medium.com/@ta93abe |  |
| Substack | https://ta93abe.substack.com |  |
| sizu.me | https://sizu.me/ta93abe |  |
| Notion | https://notion.so/ta93abe |  |

### クリエイティブ・デザイン
| サービス | URL | 公開 |
|---|---|---|
| Figma | https://figma.com/@ta93abe |  |
| Dribbble | https://dribbble.com/ta93abe |  |
| Behance | https://behance.net/ta93abe |  |
| Pinterest | https://pinterest.com/ta93abe | ✅ |

### 動画・配信
| サービス | URL | 公開 |
|---|---|---|
| YouTube | https://youtube.com/@ta93abe |  |
| TikTok | https://tiktok.com/@ta93abe |  |
| Twitch | https://twitch.tv/ta93abe |  |

### 音楽・オーディオ
| サービス | URL | 公開 |
|---|---|---|
| Spotify | https://open.spotify.com/user/ta93abe |  |
| SoundCloud | https://soundcloud.com/ta93abe |  |
| Bandcamp | https://bandcamp.com/ta93abe |  |
| Apple Music | https://music.apple.com/profile/ta93abe |  |
| Apple Podcasts | https://podcasts.apple.com/profile/ta93abe |  |

### 仕事・キャリア
| サービス | URL | 公開 |
|---|---|---|
| Wantedly | https://wantedly.com/id/ta93abe |  |
| YouTrust | https://youtrust.jp/users/ta93abe |  |

### サポート・支援
| サービス | URL | 公開 |
|---|---|---|
| Ko-fi | https://ko-fi.com/ta93abe |  |
| Buy Me a Coffee | https://buymeacoffee.com/ta93abe |  |
| Patreon | https://patreon.com/ta93abe |  |

### メッセージ・チャット
| サービス | URL | 公開 |
|---|---|---|
| Discord | https://discord.com/users/ta93abe | ✅ |
| Telegram | https://t.me/ta93abe |  |
| LINE | https://line.me/ti/p/ta93abe |  |
| WhatsApp | https://wa.me/ta93abe |  |
| Signal | https://signal.me/#p/ta93abe |  |

---

## 8. 使用ツール（tools ページ用・抜粋）

`src/pages/tools.astro` に全データあり。
不要なものを削除・並び替えしてOK。

### CLI・ターミナル
Fish / Starship / Ghostty / Zellij / ripgrep / fd / fzf / zoxide / eza / bat

### 開発
Helix / VS Code / Cursor / Zed / GitHub CLI / lazygit / Bruno / OrbStack / Nix / pnpm / uv

### クラウド・インフラ
AWS CLI / gcloud / flyctl / Wrangler / Alchemy

### デザイン・クリエイティブ
Figma / Rive / Framer / Spline / Affinity Designer / Blender / TouchDesigner

### 音楽・映像
Ableton Live / Sonic Pi / SuperCollider / Cycling '74 Max / OBS

### 生産性
Raycast / Notion / Linear / Obsidian / CleanShot / 1Password

### AI
Claude / Claude Code / ChatGPT / Cursor / Kiro

---

## 9. 技術仕様（実装済み）

| カテゴリ | 技術 |
|---|---|
| フレームワーク | Astro 6.x |
| スタイリング | Tailwind CSS 4.x / neutral パレット / ダークのみ |
| 3D | Three.js（Hero パーティクル） |
| アニメーション | GSAP / Lenis |
| 検索 | Pagefind |
| デプロイ | Cloudflare Workers |
| IaC | Alchemy v2 beta（`alchemy.run.ts`） |
| Agent Ready | `/llms.txt` / `/.well-known/mcp.json` / `robots.txt` |
| 決済（予定） | x402（`base-sepolia` でテスト予定） |

---

## 10. TODO・優先度

### 高
- [ ] プロフィール情報を入力（セクション 5）
- [ ] Landing ページに About / Works / Blog セクションを追加
- [ ] Works の実コンテンツ入力
- [ ] Links の公開サービス選定（セクション 7）

### 中
- [ ] Blog 記事の投稿
- [ ] Slides データ入力（talks.json）
- [ ] Bookshelf 実データ入力
- [ ] About ページの作成

### 低・実験
- [ ] x402 ペイメント（`base-sepolia` テスト）
- [ ] `.eth` アドレスを About / Links に表示
- [ ] MCP ツールの有料化
