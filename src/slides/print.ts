/**
 * print / PDF 用に、プレイヤー向けに出したスライドをすべて開く。
 * - 全スライドを is-active にし、hidden / inert を外す
 * - クリックで出す fragment とコードの段階ハイライトを最初から見せる（プレイヤーの一覧と同じ）
 */
export function revealPrintSlidesHtml(html: string): string {
	return html
		.replace(
			/<section class="slide"(?![^>]*is-active)/g,
			'<section class="slide is-active"',
		)
		.replace(
			/(<section class="slide[^"]*"[^>]*?)\s+hidden(?:="")?\s+inert(?:="")?/g,
			"$1",
		)
		.replace(/\bclass="fragment"/g, 'class="fragment is-visible"')
		.replace(
			/\bclass="line"(\s+data-click-highlight=)/g,
			'class="line is-highlighted"$1',
		);
}
