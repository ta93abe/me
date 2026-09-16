import { isTweetId } from "./tweet-url.ts";

const SYNDICATION_URL = "https://cdn.syndication.twimg.com/tweet-result";
const FXTWITTER_URL = "https://api.fxtwitter.com/status/";
const FETCH_TIMEOUT_MS = 2500;
const SYNDICATION_FEATURES = [
	"tfw_timeline_list:",
	"tfw_follower_count_sunset:true",
	"tfw_tweet_edit_backend:on",
	"tfw_refsrc_session:on",
	"tfw_fosnr_soft_interventions_enabled:on",
	"tfw_show_birdwatch_pivots_enabled:on",
	"tfw_show_business_verified_badge:on",
	"tfw_duplicate_scribes_to_settings:on",
	"tfw_use_profile_image_shape_enabled:on",
	"tfw_show_blue_verified_badge:on",
	"tfw_legacy_timeline_sunset:true",
	"tfw_show_gov_verified_badge:on",
	"tfw_show_business_affiliate_badge:on",
	"tfw_tweet_edit_frontend:on",
].join(";");

const X_PATH =
	"M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z";

export type TweetPhoto = {
	url: string;
	width?: number;
	height?: number;
};

export type TweetAuthor = {
	name: string;
	screenName: string;
	avatarUrl?: string;
	verified: boolean;
};

export type TweetTextEntity = {
	indices: [number, number];
	href: string;
	label: string;
};

export type TweetEmbedData = {
	id: string;
	url: string;
	text: string;
	createdAt: string;
	displayTextRange?: [number, number];
	author: TweetAuthor;
	photos: TweetPhoto[];
	videoPoster?: string;
	entities: TweetTextEntity[];
	quoted?: TweetEmbedData;
};

export type TweetFetcher = (id: string) => Promise<TweetEmbedData | null>;

export type TweetFetchOptions = {
	fetch?: typeof fetch;
};

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string | undefined {
	return typeof value === "string" ? value : undefined;
}

function nonEmpty(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value)
		? value
		: undefined;
}

function httpsUrl(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}
	try {
		const url = new URL(value);
		if (url.protocol !== "https:") {
			return undefined;
		}
		return url.href;
	} catch {
		return undefined;
	}
}

function asRange(value: unknown): [number, number] | undefined {
	if (!Array.isArray(value) || value.length < 2) {
		return undefined;
	}
	const start = value[0];
	const end = value[1];
	if (
		typeof start !== "number" ||
		typeof end !== "number" ||
		end < start ||
		start < 0
	) {
		return undefined;
	}
	return [start, end];
}

function largerAvatar(url: string): string {
	return url.replace("_normal.", "_x96.");
}

function profileUrl(screenName: string): string {
	return `https://x.com/${encodeURIComponent(screenName)}`;
}

function xLogoSvg(): string {
	return `<svg class="tweet-embed-x" viewBox="0 0 24 24" aria-hidden="true" width="18" height="18"><path fill="currentColor" d="${X_PATH}"/></svg>`;
}

function verifiedSvg(): string {
	return `<svg class="tweet-embed-verified" viewBox="0 0 24 24" aria-label="認証済み" width="16" height="16"><circle cx="12" cy="12" r="12" fill="#1d9bf0"/><path fill="#fff" d="M10.1 15.7 6.5 12.1l1.4-1.4 2.2 2.2 5.6-5.7 1.4 1.4z"/></svg>`;
}

function playSvg(): string {
	return `<svg class="tweet-embed-play-icon" viewBox="0 0 24 24" aria-hidden="true" width="40" height="40"><circle cx="12" cy="12" r="12" fill="#000" fill-opacity="0.55"/><path fill="#fff" d="M10 8.2v7.6L17 12z"/></svg>`;
}

function formatTweetTime(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return "";
	}
	return new Intl.DateTimeFormat("ja-JP", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		timeZone: "Asia/Tokyo",
	}).format(date);
}

function escapeWithBreaks(value: string): string {
	return escapeHtml(value).replaceAll("\n", "<br>");
}

function renderTweetText(tweet: TweetEmbedData): string {
	const start = tweet.displayTextRange?.[0] ?? 0;
	const end = tweet.displayTextRange?.[1] ?? tweet.text.length;
	const slice = tweet.text.slice(start, end);
	const entities = tweet.entities
		.filter(
			(entity) =>
				entity.indices[0] >= start &&
				entity.indices[1] <= end &&
				entity.indices[1] > entity.indices[0],
		)
		.map((entity) => ({
			...entity,
			indices: [entity.indices[0] - start, entity.indices[1] - start] as [
				number,
				number,
			],
		}))
		.toSorted((left, right) => left.indices[0] - right.indices[0]);

	let html = "";
	let cursor = 0;
	for (const entity of entities) {
		if (entity.indices[0] < cursor) {
			continue;
		}
		html += escapeWithBreaks(slice.slice(cursor, entity.indices[0]));
		html += `<a href="${escapeHtml(entity.href)}" rel="noopener noreferrer" target="_blank">${escapeHtml(entity.label)}</a>`;
		cursor = entity.indices[1];
	}
	html += escapeWithBreaks(slice.slice(cursor));
	return html;
}

function renderPhotos(photos: TweetPhoto[], href: string): string {
	const shown = photos.slice(0, 4);
	if (shown.length === 0) {
		return "";
	}
	const items = shown
		.map((photo) => {
			const width = photo.width ? ` width="${photo.width}"` : "";
			const height = photo.height ? ` height="${photo.height}"` : "";
			return `<a class="tweet-embed-photo" href="${escapeHtml(href)}" rel="noopener noreferrer" target="_blank" aria-label="ポストの画像"><img src="${escapeHtml(photo.url)}" alt=""${width}${height} loading="lazy" decoding="async" referrerpolicy="no-referrer" /></a>`;
		})
		.join("");
	return `<div class="tweet-embed-photos tweet-embed-photos-${shown.length}">${items}</div>`;
}

function renderVideoPoster(poster: string | undefined, href: string): string {
	if (!poster) {
		return "";
	}
	return `<a class="tweet-embed-video" href="${escapeHtml(href)}" rel="noopener noreferrer" target="_blank" aria-label="動画をXで見る"><img src="${escapeHtml(poster)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" /><span class="tweet-embed-watch">Watch on X</span>${playSvg()}</a>`;
}

function renderAuthor(author: TweetAuthor): string {
	const profile = escapeHtml(profileUrl(author.screenName));
	const avatar = author.avatarUrl
		? `<img class="tweet-embed-avatar" src="${escapeHtml(author.avatarUrl)}" alt="" width="48" height="48" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
		: `<span class="tweet-embed-avatar tweet-embed-avatar-fallback" aria-hidden="true"></span>`;
	const verified = author.verified ? verifiedSvg() : "";
	const follow = `https://x.com/intent/follow?screen_name=${encodeURIComponent(author.screenName)}`;
	return `<div class="tweet-embed-author"><a class="tweet-embed-identity" href="${profile}" rel="noopener noreferrer" target="_blank"><span class="tweet-embed-avatar-wrap">${avatar}</span></a><span class="tweet-embed-names"><a class="tweet-embed-name" href="${profile}" rel="noopener noreferrer" target="_blank">${escapeHtml(author.name)}${verified}</a><span class="tweet-embed-handle-line"><a class="tweet-embed-handle" href="${profile}" rel="noopener noreferrer" target="_blank">@${escapeHtml(author.screenName)}</a><a class="tweet-embed-follow" href="${escapeHtml(follow)}" rel="noopener noreferrer" target="_blank">Follow</a></span></span></div>`;
}

function renderQuoted(quoted: TweetEmbedData): string {
	return `<blockquote class="tweet-embed-quoted"><a class="tweet-embed-quoted-author" href="${escapeHtml(quoted.url)}" rel="noopener noreferrer" target="_blank"><span class="tweet-embed-quoted-name">${escapeHtml(quoted.author.name)}</span><span class="tweet-embed-quoted-handle">@${escapeHtml(quoted.author.screenName)}</span></a><p class="tweet-embed-text">${renderTweetText(quoted)}</p>${renderPhotos(quoted.photos, quoted.url)}</blockquote>`;
}

export function tweetFallbackHtml(href: string): string {
	const display = href.replace(/^https:\/\//, "");
	return `<blockquote class="tweet-embed tweet-embed-fallback"><a class="tweet-embed-fallback-link" href="${escapeHtml(href)}" rel="noopener noreferrer" target="_blank">${xLogoSvg()}<span class="tweet-embed-fallback-copy"><span class="tweet-embed-fallback-title">Xでポストを見る</span><span class="tweet-embed-fallback-url">${escapeHtml(display)}</span></span></a></blockquote>\n`;
}

export function tweetEmbedHtml(
	href: string,
	tweet: TweetEmbedData | null,
): string {
	if (!tweet) {
		return tweetFallbackHtml(href);
	}

	const timeLabel = formatTweetTime(tweet.createdAt);
	const time = timeLabel
		? `<a class="tweet-embed-time" href="${escapeHtml(tweet.url)}" rel="noopener noreferrer" target="_blank"><time datetime="${escapeHtml(tweet.createdAt)}">${escapeHtml(timeLabel)}</time></a>`
		: "";

	return `<blockquote class="tweet-embed"><div class="tweet-embed-header">${renderAuthor(tweet.author)}<a class="tweet-embed-brand" href="${escapeHtml(tweet.url)}" rel="noopener noreferrer" target="_blank" aria-label="Xでポストを見る">${xLogoSvg()}</a></div><p class="tweet-embed-text">${renderTweetText(tweet)}</p>${renderPhotos(tweet.photos, tweet.url)}${renderVideoPoster(tweet.videoPoster, tweet.url)}${tweet.quoted ? renderQuoted(tweet.quoted) : ""}${time}</blockquote>\n`;
}

function syndicationToken(id: string): string {
	return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, "");
}

function syndicationRequestUrl(id: string): string {
	const url = new URL(SYNDICATION_URL);
	url.searchParams.set("id", id);
	url.searchParams.set("lang", "ja");
	url.searchParams.set("token", syndicationToken(id));
	url.searchParams.set("features", SYNDICATION_FEATURES);
	return url.toString();
}

async function readJson(
	fetchImpl: typeof fetch,
	url: string,
): Promise<unknown> {
	const response = await fetchImpl(url, {
		headers: { accept: "application/json" },
		signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
	});
	if (!response.ok) {
		return null;
	}
	const contentType = response.headers.get("content-type") ?? "";
	if (!contentType.includes("json")) {
		return null;
	}
	return response.json();
}

function collectEntities(raw: unknown): TweetTextEntity[] {
	if (!isRecord(raw)) {
		return [];
	}
	const entities: TweetTextEntity[] = [];

	const push = (
		indices: unknown,
		href: string | undefined,
		label: string | undefined,
	) => {
		const range = asRange(indices);
		const safeHref = httpsUrl(href);
		if (!range || !safeHref || !label) {
			return;
		}
		entities.push({ indices: range, href: safeHref, label });
	};

	if (Array.isArray(raw.urls)) {
		for (const item of raw.urls) {
			if (!isRecord(item)) {
				continue;
			}
			push(
				item.indices,
				stringValue(item.expanded_url),
				stringValue(item.display_url),
			);
		}
	}
	if (Array.isArray(raw.hashtags)) {
		for (const item of raw.hashtags) {
			if (!isRecord(item)) {
				continue;
			}
			const text = stringValue(item.text);
			if (!text) {
				continue;
			}
			push(
				item.indices,
				`https://x.com/hashtag/${encodeURIComponent(text)}`,
				`#${text}`,
			);
		}
	}
	if (Array.isArray(raw.user_mentions)) {
		for (const item of raw.user_mentions) {
			if (!isRecord(item)) {
				continue;
			}
			const screenName = stringValue(item.screen_name);
			if (!screenName) {
				continue;
			}
			push(item.indices, profileUrl(screenName), `@${screenName}`);
		}
	}

	return entities;
}

function collectPhotos(raw: unknown): TweetPhoto[] {
	if (!Array.isArray(raw)) {
		return [];
	}
	const photos: TweetPhoto[] = [];
	for (const item of raw) {
		if (!isRecord(item)) {
			continue;
		}
		const url = httpsUrl(item.url);
		if (!url) {
			continue;
		}
		photos.push({
			url,
			width: numberValue(item.width),
			height: numberValue(item.height),
		});
	}
	return photos;
}

function fromSyndication(
	data: unknown,
	allowQuote = true,
): TweetEmbedData | null {
	if (!isRecord(data) || Reflect.get(data, "__typename") === "TweetTombstone") {
		return null;
	}
	const id = nonEmpty(data.id_str);
	const text = stringValue(data.text);
	const createdAt = nonEmpty(data.created_at);
	const user = isRecord(data.user) ? data.user : null;
	const screenName = user ? nonEmpty(user.screen_name) : undefined;
	const name = user ? nonEmpty(user.name) : undefined;
	if (!id || text === undefined || !createdAt || !screenName || !name) {
		return null;
	}

	const avatarRaw = user ? httpsUrl(user.profile_image_url_https) : undefined;
	const video = isRecord(data.video) ? data.video : null;

	return {
		id,
		url: `https://x.com/${screenName}/status/${id}`,
		text,
		createdAt,
		displayTextRange: asRange(data.display_text_range),
		author: {
			name,
			screenName,
			avatarUrl: avatarRaw ? largerAvatar(avatarRaw) : undefined,
			verified: Boolean(user?.is_blue_verified || user?.verified),
		},
		photos: collectPhotos(data.photos),
		videoPoster: video ? httpsUrl(video.poster) : undefined,
		entities: collectEntities(data.entities),
		quoted:
			allowQuote && data.quoted_tweet
				? (fromSyndication(data.quoted_tweet, false) ?? undefined)
				: undefined,
	};
}

function fromFxtwitter(
	payload: unknown,
	allowQuote = true,
): TweetEmbedData | null {
	if (!isRecord(payload)) {
		return null;
	}
	const tweet = isRecord(payload.tweet) ? payload.tweet : payload;
	const id = nonEmpty(tweet.id) ?? nonEmpty(tweet.id_str);
	const text = stringValue(tweet.text);
	const author = isRecord(tweet.author) ? tweet.author : null;
	const screenName = author ? nonEmpty(author.screen_name) : undefined;
	const name = author ? nonEmpty(author.name) : undefined;
	if (!id || text === undefined || !screenName || !name) {
		return null;
	}

	const createdAtRaw = stringValue(tweet.created_at);
	const timestamp = numberValue(tweet.created_timestamp);
	const createdAt = createdAtRaw
		? new Date(createdAtRaw)
		: timestamp !== undefined
			? new Date(timestamp * 1000)
			: undefined;
	if (!createdAt || Number.isNaN(createdAt.getTime())) {
		return null;
	}

	const media = isRecord(tweet.media) ? tweet.media : null;
	const videos = media && Array.isArray(media.videos) ? media.videos : [];
	const firstVideo = isRecord(videos[0]) ? videos[0] : null;
	const verification = isRecord(author?.verification)
		? author.verification
		: null;

	return {
		id,
		url: `https://x.com/${screenName}/status/${id}`,
		text,
		createdAt: createdAt.toISOString(),
		author: {
			name,
			screenName,
			avatarUrl: httpsUrl(author?.avatar_url),
			verified: Boolean(
				verification?.verified || author?.verified || author?.is_blue_verified,
			),
		},
		photos: collectPhotos(media?.photos),
		videoPoster: firstVideo
			? (httpsUrl(firstVideo.thumbnail_url) ?? httpsUrl(firstVideo.poster))
			: undefined,
		entities: [],
		quoted:
			allowQuote && tweet.quote
				? (fromFxtwitter(tweet.quote, false) ?? undefined)
				: undefined,
	};
}

export async function fetchTweetEmbed(
	id: string,
	options: TweetFetchOptions = {},
): Promise<TweetEmbedData | null> {
	if (!isTweetId(id)) {
		return null;
	}
	const fetchImpl = options.fetch ?? fetch;

	try {
		const syndication = fromSyndication(
			await readJson(fetchImpl, syndicationRequestUrl(id)),
		);
		if (syndication) {
			return syndication;
		}
	} catch {
		// X の syndication が落ちていても fxtwitter で拾う
	}

	try {
		return fromFxtwitter(await readJson(fetchImpl, `${FXTWITTER_URL}${id}`));
	} catch {
		return null;
	}
}
