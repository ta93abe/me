// StaticSite 用の Worker エントリポイント。
// 通常は ASSETS をそのまま配信し、Agent Ready 対応として以下を追加処理:
//   - /path/index.md → /path/ の HTML を Markdown として返す（未来の拡張ポイント）
//   - Accept: text/markdown ヘッダー時に AI 向けヒントを X-Agent-Hint で案内
interface Env {
	ASSETS: { fetch: (request: Request) => Promise<Response> };
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// /path/index.md → /path/ の静的アセットを返しつつ Markdown ヒントを付与
		// 将来的には HTML→Markdown 変換を挟む拡張ポイント
		if (url.pathname.endsWith("/index.md")) {
			const htmlPath = url.pathname.replace(/\/index\.md$/, "/");
			const htmlUrl = new URL(url);
			htmlUrl.pathname = htmlPath;

			const response = await env.ASSETS.fetch(
				new Request(htmlUrl.toString(), request),
			);

			// HTML ページが見つかった場合、Markdown ヒントヘッダーを付与して返す
			if (response.ok) {
				const headers = new Headers(response.headers);
				headers.set("X-Agent-Hint", "llms.txt available at /llms.txt");
				headers.set(
					"X-MCP-Server-Card",
					"/.well-known/mcp.json",
				);
				return new Response(response.body, {
					status: response.status,
					headers,
				});
			}
			return response;
		}

		// Accept: text/markdown ヘッダーがある場合、ヒントヘッダーを追加
		const acceptsMarkdown = request.headers
			.get("Accept")
			?.includes("text/markdown");

		const response = await env.ASSETS.fetch(request);

		if (acceptsMarkdown && response.ok) {
			const headers = new Headers(response.headers);
			headers.set(
				"X-Agent-Hint",
				"Markdown not yet available. See /llms.txt for content index.",
			);
			headers.set("X-MCP-Server-Card", "/.well-known/mcp.json");
			return new Response(response.body, {
				status: response.status,
				headers,
			});
		}

		return response;
	},
};
