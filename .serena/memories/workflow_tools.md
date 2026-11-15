# ワークフローツール設定

## 基本方針

GitHub はデータベース（コードリポジトリ）としてのみ使用し、以下のツールでワークフローを管理する：

| 用途 | ツール | 詳細 |
|------|--------|------|
| Issue管理 | **Linear** | ta93abe team / me project |
| PR管理 | **GitHub** | `git` + `gh` CLI |
| コード管理 | GitHub | データベースとして使用 |

## Linear (Issue管理)

- チーム: ta93abe
- プロジェクト: me
- GitHub Issues は使用しない
- Claude Code から Linear MCP 経由で操作可能

## PR管理（git + gh）

Graphite（`gt`）は使わない。

```bash
# main から ブランチを切る
git switch main && git pull
git switch -c feature/xxx

# コミットして push
git commit -m "feat: 説明"
git push -u origin feature/xxx

# PR提出
gh pr create --base main
```

## 禁止事項

- `gt` コマンドの使用
- GitHub Issues の作成 → 代わりに Linear で作成
