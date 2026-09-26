import {
	looksLikeMdx,
	parseMarkdownDocument,
} from "../../../worker/content/frontmatter.ts";
import { parseMarkdownKey } from "../../../worker/content/keys.ts";
import {
	EMBED_TTL_MS,
	embedObjectKey,
	isFreshEmbed,
	parseEmbedRecord,
	type EmbedCacheRecord,
} from "./embed-cache.ts";
import { fetchLinkCard } from "./link-card.ts";
import { collectBlogEmbeds } from "./markdown.ts";
import { fetchTweetEmbed } from "./tweet.ts";
import { fetchYoutubeEmbed } from "./youtube.ts";

export type ResolveEmbedsOptions = {
	fetch?: typeof fetch;
	now?: Date;
	force?: boolean;
};

const MAX_EMBED_RESOLVES = 16;

async function putRecord(
	bucket: R2Bucket,
	key: string,
	record: EmbedCacheRecord,
): Promise<void> {
	await bucket.put(key, JSON.stringify(record), {
		httpMetadata: { contentType: "application/json; charset=utf-8" },
	});
}

export async function resolveEmbedsForMarkdown(
	bucket: R2Bucket,
	markdown: string,
	options: ResolveEmbedsOptions = {},
): Promise<void> {
	const now = options.now ?? new Date();
	const fetchImpl = options.fetch ?? fetch;
	const fetchedAt = now.toISOString();
	const expiresAt = new Date(now.getTime() + EMBED_TTL_MS).toISOString();
	const embeds = collectBlogEmbeds(markdown).slice(0, MAX_EMBED_RESOLVES);

	await Promise.all(
		embeds.map(async (embed) => {
			const key = await embedObjectKey(embed.href);
			if (!options.force) {
				const existing = await bucket.get(key);
				if (existing) {
					try {
						const record = parseEmbedRecord(await existing.json());
						if (record && isFreshEmbed(record, now)) {
							return;
						}
					} catch {
						// 壊れたキャッシュは取り直す
					}
				}
			}

			if (embed.kind === "tweet") {
				let tweet = null;
				try {
					tweet = await fetchTweetEmbed(embed.id, { fetch: fetchImpl });
				} catch {
					tweet = null;
				}
				await putRecord(bucket, key, {
					url: embed.href,
					kind: "tweet",
					fetchedAt,
					expiresAt,
					tweet,
				});
				return;
			}

			if (embed.kind === "youtube") {
				let youtube = null;
				try {
					youtube = await fetchYoutubeEmbed(embed.id, { fetch: fetchImpl });
				} catch {
					youtube = null;
				}
				await putRecord(bucket, key, {
					url: embed.href,
					kind: "youtube",
					fetchedAt,
					expiresAt,
					youtube,
				});
				return;
			}

			if (embed.kind === "spotify") {
				await putRecord(bucket, key, {
					url: embed.href,
					kind: "spotify",
					fetchedAt,
					expiresAt,
				});
				return;
			}

			const link = await fetchLinkCard(embed.href, { fetch: fetchImpl });
			await putRecord(bucket, key, {
				url: embed.href,
				kind: "link",
				fetchedAt,
				expiresAt,
				link,
			});
		}),
	);
}

export async function resolveEmbedsForMarkdownKeys(
	bucket: R2Bucket,
	keys: string[],
	options: ResolveEmbedsOptions = {},
): Promise<void> {
	const unique = [...new Set(keys)];
	await Promise.all(
		unique.map(async (key) => {
			const parsedKey = parseMarkdownKey(key);
			if (parsedKey?.collection !== "blog") {
				return;
			}
			const object = await bucket.get(key);
			if (!object) {
				return;
			}
			const markdown = await object.text();
			if (looksLikeMdx(markdown)) {
				return;
			}
			try {
				const parsed = parseMarkdownDocument(markdown);
				await resolveEmbedsForMarkdown(bucket, parsed.body, options);
			} catch {
				// 壊れた原稿は index 再構築に任せる
			}
		}),
	);
}
