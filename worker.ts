// StaticSite 用の Worker エントリポイント。
// ビルド済みの静的アセット (ASSETS バインディング) をそのまま配信する。
interface Env {
	ASSETS: { fetch: (request: Request) => Promise<Response> };
}

export default {
	fetch(request: Request, env: Env): Promise<Response> {
		return env.ASSETS.fetch(request);
	},
};
