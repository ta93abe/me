/**
 * `<Tweet live />`（ブログだけ）で読む X の公式ウィジェット。
 * 既定は静的カードで、live のときだけ閲覧時に widgets.js を読み、iframe の埋め込みに差し替える。
 */
export const TWEET_WIDGETS_ORIGIN = "https://platform.twitter.com";
export const TWEET_WIDGETS_SRC = `${TWEET_WIDGETS_ORIGIN}/widgets.js`;

/** 記事の MDX に `<Tweet ... live />` があるか（そのページだけ CSP に widgets.js を足す）。 */
export function hasLiveTweet(mdx: string): boolean {
	return /<Tweet\b[^>]*\slive(?:\s|=|\/?>)/.test(mdx);
}
