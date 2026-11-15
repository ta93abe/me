/** ブログ本文の「URL だけの段落」を埋め込みにするときの種類。 */
export type BlogEmbedTweet = {
	kind: "tweet";
	id: string;
	href: string;
};

export type BlogEmbedYoutube = {
	kind: "youtube";
	id: string;
	href: string;
};

export type BlogEmbedLink = {
	kind: "link";
	href: string;
};

export type BlogEmbedSpotify = {
	kind: "spotify";
	href: string;
};

export type BlogEmbed =
	| BlogEmbedTweet
	| BlogEmbedYoutube
	| BlogEmbedLink
	| BlogEmbedSpotify;
