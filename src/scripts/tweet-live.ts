import { TWEET_WIDGETS_SRC } from "@/lib/content/tweet-live";

type TwitterWidgets = {
	widgets: {
		createTweet: (
			id: string,
			target: HTMLElement,
			options: Record<string, string | boolean>,
		) => Promise<HTMLElement | undefined>;
	};
};

declare global {
	interface Window {
		twttr?: TwitterWidgets;
	}
}

let widgetsPromise: Promise<TwitterWidgets> | undefined;

function loadWidgets(): Promise<TwitterWidgets> {
	if (window.twttr?.widgets) {
		return Promise.resolve(window.twttr);
	}
	widgetsPromise ??= new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = TWEET_WIDGETS_SRC;
		script.async = true;
		script.charset = "utf-8";
		script.addEventListener("load", () =>
			window.twttr?.widgets
				? resolve(window.twttr)
				: reject(new Error("twttr.widgets is unavailable")),
		);
		script.addEventListener("error", () =>
			reject(new Error("failed to load widgets.js")),
		);
		document.head.appendChild(script);
	});
	return widgetsPromise;
}

async function mount(frame: HTMLElement): Promise<void> {
	const id = frame.dataset.tweetId;
	const target = frame.querySelector<HTMLElement>(".tweet-embed-live");
	if (!id || !target) {
		return;
	}
	const twttr = await loadWidgets();
	const embed = await twttr.widgets.createTweet(id, target, {
		dnt: true,
		lang: "ja",
		theme: "light",
		align: "center",
		conversation: "none",
		cards: frame.dataset.tweetCards === "hidden" ? "hidden" : "visible",
	});
	if (embed) {
		frame.classList.add("is-live");
	}
}

/**
 * `<Tweet live />` を、画面に近づいたときに X の公式埋め込みへ差し替える。
 * widgets.js はページに live があるときだけ読む。失敗したら静的カードのまま。
 */
export function mountLiveTweets(root: ParentNode = document): void {
	const frames = [...root.querySelectorAll<HTMLElement>("[data-tweet-live]")];
	if (frames.length === 0) {
		return;
	}
	const start = (frame: HTMLElement) => {
		mount(frame).catch(() => {
			// 静的カードを残す
		});
	};
	if (typeof window.IntersectionObserver !== "function") {
		frames.forEach(start);
		return;
	}
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					observer.unobserve(entry.target);
					start(entry.target as HTMLElement);
				}
			}
		},
		{ rootMargin: "400px 0px" },
	);
	frames.forEach((frame) => observer.observe(frame));
}
