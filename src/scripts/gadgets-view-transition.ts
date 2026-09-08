import {
	gadgetSlugFromPath,
	gadgetViewTransitionName,
	isGadgetsIndexPath,
} from "@/data/gadgets";

const STORAGE_KEY = "gadgets-view-transition-slug";

type ViewTransitionLike = {
	finished: Promise<unknown>;
};

function nameThumbnail(slug: string): void {
	const img = document.querySelector<HTMLElement>(
		`[data-gadget-thumb="${CSS.escape(slug)}"]`,
	);
	if (!img) {
		return;
	}
	img.style.viewTransitionName = gadgetViewTransitionName(slug);
}

function clearGadgetNames(): void {
	for (const img of document.querySelectorAll<HTMLElement>(
		"[data-gadget-thumb]",
	)) {
		img.style.removeProperty("view-transition-name");
	}
}

function slugFromHref(href: string | null): string | null {
	if (!href) {
		return null;
	}
	try {
		return gadgetSlugFromPath(new URL(href, location.origin).pathname);
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

function slugForCurrentPage(): string | null {
	return (
		gadgetSlugFromPath(location.pathname) ??
		(isGadgetsIndexPath(location.pathname) ? readStoredSlug() : null)
	);
}

function armViewTransition(viewTransition: ViewTransitionLike): void {
	const slug = slugForCurrentPage();
	if (slug) {
		nameThumbnail(slug);
	}
	void viewTransition.finished.finally(clearGadgetNames);
	window.setTimeout(clearGadgetNames, 800);
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
	const reveal = event as Event & { viewTransition?: ViewTransitionLike };
	if (!reveal.viewTransition) {
		return;
	}
	armViewTransition(reveal.viewTransition);
});

window.addEventListener("pageswap", (event) => {
	const swap = event as Event & {
		viewTransition?: ViewTransitionLike;
		activation?: { entry?: { url?: string } };
	};
	if (!swap.viewTransition) {
		return;
	}
	const toPath = swap.activation?.entry?.url
		? new URL(swap.activation.entry.url).pathname
		: "";
	const toSlug = gadgetSlugFromPath(toPath);
	if (isGadgetsIndexPath(location.pathname) && toSlug) {
		nameThumbnail(toSlug);
		storeSlug(toSlug);
		return;
	}
	const fromSlug = gadgetSlugFromPath(location.pathname);
	if (fromSlug) {
		nameThumbnail(fromSlug);
		storeSlug(fromSlug);
	}
});

window.setTimeout(() => {
	for (const img of document.querySelectorAll<HTMLElement>(
		"[data-gadget-thumb]",
	)) {
		if (getComputedStyle(img).visibility === "hidden") {
			img.style.removeProperty("view-transition-name");
		}
	}
}, 1000);
