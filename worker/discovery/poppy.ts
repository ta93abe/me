const SITE_HOST = "ta93abe.com";
const SITE_TITLE = "Takumi Abe / ta93abe";

export const POPPY_PATH = "/.well-known/poppy.json";

/** Personal Agent Protocol（Poppy）draft 0.3 のマニフェスト。 */
export type PoppyManifest = {
	protocol_version: "0.3";
	organization: { name: string; domain: string };
	web: Record<string, never>;
};

/**
 * サインインのない公開サイトなので `auth` は書かない。
 * `web: {}` は「Personal Agent は未ログインの訪問者としてサイトを読む」の意味。
 * organization.domain は配信ホストと一致させる（spec §3）。
 */
export function poppyManifest(): PoppyManifest {
	return {
		protocol_version: "0.3",
		organization: { name: SITE_TITLE, domain: SITE_HOST },
		web: {},
	};
}
