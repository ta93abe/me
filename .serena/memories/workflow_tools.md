# ワークフローツール設定

## 基本方針

GitHub はデータベース（コードリポジトリ）としてのみ使用し、以下のツールでワークフローを管理する：

| 用途 | ツール | 詳細 |
|------|--------|------|
| Issue管理 | **Linear** | ta93abe team / me project |
| PR管理 | **Graphite (gt)** | スタック型PRワークフロー |
| コード管理 | GitHub | データベースとして使用 |

## Linear (Issue管理)

- チーム: ta93abe
- プロジェクト: me
- GitHub Issues は使用しない
- Claude Code から Linear MCP 経由で操作可能

## Graphite (PR管理)

`git commit` / `git push` の代わりに `gt` コマンドを使用：

```bash
# ブランチ作成+コミット
gt create -m "feat: 説明"

# PR提出
gt submit --no-interactive

# 状態確認
gt state

# 同期
gt sync
```

## 禁止事項

- `git commit` → 代わりに `gt create`
- `git push` → 代わりに `gt submit`
- GitHub Issues の作成 → 代わりに Linear で作成
