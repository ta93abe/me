// Alchemy v2 (Effect ベース) によるデプロイ定義。
// 既存の wrangler.jsonc 構成（静的アセットを Worker で配信）を再現したもの。
// wrangler.jsonc は残したまま並行運用できる（デプロイ手段の検証用）。
//
// デプロイ:   npx alchemy deploy
// 破棄:       npx alchemy destroy
import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

export default Alchemy.Stack(
	"me",
	{ providers: Cloudflare.providers() },
	Effect.gen(function* () {
		const site = yield* Cloudflare.StaticSite("me", {
			// astro build で dist/ を生成し、その中身を Worker の静的アセットとして配信
			command: "pnpm build",
			outdir: "dist",
			main: "./worker.ts",
			assetsConfig: {
				// wrangler.jsonc の html_handling / not_found_handling と同じ
				htmlHandling: "auto-trailing-slash",
				notFoundHandling: "404-page",
			},
		});

		return { url: site.url };
	}),
);
