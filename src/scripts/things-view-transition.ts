import {
	isThingsIndexPath,
	thingSlugFromPath,
	thingViewTransitionName,
} from "@/data/things";

const STORAGE_KEY = "things-view-transition-slug";

function nameThumbnail(slug: string): void {
	const img = document.querySelector<HTMLElement>(
		`[data-thing-thumb="${CSS.escape(slug)}"]`,
	);
	if (!img) {
		return;
	}
	img.style.viewTransitionName = thingViewTransitionName(slug);
}

function slugFromHref(href: string | null): string | null {
	if (!href) {
		return null;
	}
	try {
		return thingSlugFromPath(new URL(href, location.origin).pathname);
	} catch {
		return null;
	}
}

function readStoredSlug(): string | null {
	try {
		return sessionStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
}

function storeSlug(slug: string): void {
	try {
		sessionStorage.setItem(STORAGE_KEY, slug);
	} catch {
		// private mode / blocked storage
	}
}

document.addEventListener(
	"click",
	(event) => {
		if (!(event.target instanceof Element)) {
			return;
		}
		if (event.defaultPrevented || event.button !== 0) {
			return;
		}
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}
		const link = event.target.closest("a[href]");
		if (!(link instanceof HTMLAnchorElement)) {
			return;
		}
		const slug = slugFromHref(link.getAttribute("href"));
		if (!slug) {
			return;
		}
		nameThumbnail(slug);
		storeSlug(slug);
	},
	true,
);

window.addEventListener("pagereveal", (event) => {
	const reveal = event as Event & { viewTransition?: unknown };
	if (!reveal.viewTransition) {
		return;
	}
	if (!isThingsIndexPath(location.pathname)) {
		return;
	}
	const slug = readStoredSlug();
	if (slug) {
		nameThumbnail(slug);
	}
});

window.addEventListener("pageswap", (event) => {
	const swap = event as Event & {
		viewTransition?: unknown;
		activation?: { entry?: { url?: string } };
	};
	if (!swap.viewTransition) {
		return;
	}
	const toPath = swap.activation?.entry?.url
		? new URL(swap.activation.entry.url).pathname
		: "";
	const toSlug = thingSlugFromPath(toPath);
	if (isThingsIndexPath(location.pathname) && toSlug) {
		nameThumbnail(toSlug);
		storeSlug(toSlug);
		return;
	}
	const fromSlug = thingSlugFromPath(location.pathname);
	if (fromSlug && isThingsIndexPath(toPath)) {
		storeSlug(fromSlug);
	}
});
