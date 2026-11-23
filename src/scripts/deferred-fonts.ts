/**
 * LCP 後に本文用 400 / Noto 700 日本語を読む（TA-2240）。
 *
 * 初期 CSS に載せると preload scanner が CJK woff2 を LCP 前に取りに行く。
 * `?url` でアセット URL だけ静的 import し、load 後に <link> を足す。
 * 動的 import() にしないのは、関数内 import を避けるため。
 */

import deferredFontsHref from "../styles/fonts-defer.css?url";

function injectDeferredFonts(): void {
	if (document.querySelector(`link[href="${deferredFontsHref}"]`)) {
		return;
	}
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = deferredFontsHref;
	document.head.append(link);
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
