import { parseSpotifyUrl, spotifyEmbedSrc } from "./spotify-url.ts";

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

export function spotifyFallbackHtml(href: string): string {
	const display = href.replace(/^https:\/\//, "");
	return `<figure class="embed-spotify embed-spotify-fallback"><a class="embed-card embed-spotify-link" href="${escapeHtml(href)}" rel="noopener noreferrer" target="_blank"><span class="embed-card-body"><span class="embed-card-title">Spotifyで聴く</span><span class="embed-card-site"><span class="embed-card-domain">${escapeHtml(display)}</span></span></span></a></figure>\n`;
}

export function spotifyEmbedHtml(href: string): string {
	const src = spotifyEmbedSrc(href);
	if (!src || !parseSpotifyUrl(href)) {
		return spotifyFallbackHtml(href);
	}
	return `<figure class="embed-spotify"><iframe class="embed-spotify-frame" src="${escapeHtml(src)}" title="Spotify embed" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe></figure>\n`;
}
