/**
 * LCP 後に本文用 400 / Noto 700 日本語を読む（TA-2240）。
 *
 * 初期 CSS に載せると preload scanner が CJK woff2 を LCP 前に取りに行く。
 * URL は Layout の `data-deferred-fonts` から読む。`?url` をこのスクリプトに
 * 埋め込むと、サブセット後の CSS 改名で本文が変わり CSP ハッシュが壊れる。
 */

export function injectDeferredFonts(): void {
	const href = document.documentElement.dataset.deferredFonts;
	if (!href) {
		return;
	}
	if (document.querySelector(`link[href="${href}"]`)) {
		return;
	}
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = href;
	document.head.appendChild(link);
}

function start(): void {
	const ric = globalThis.requestIdleCallback;
	if (typeof ric === "function") {
		ric(() => injectDeferredFonts(), { timeout: 2000 });
		return;
	}
	setTimeout(injectDeferredFonts, 1);
}

if (document.readyState === "complete") {
	start();
} else {
	window.addEventListener("load", start, { once: true });
}
