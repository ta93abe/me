const DESKTOP_MQ = "(min-width: 48rem)";
const MENU_OPEN_ATTR = "data-menu-open";
const enhanced = new WeakSet<HTMLElement>();

function headerFor(root: HTMLElement): HTMLElement | null {
	return root.closest("header") ?? document.querySelector("header");
}

function syncOpen(
	open: boolean,
	openButton: HTMLButtonElement,
	header: HTMLElement | null,
): void {
	openButton.setAttribute("aria-expanded", open ? "true" : "false");
	if (!header) {
		return;
	}
	if (open) {
		header.setAttribute(MENU_OPEN_ATTR, "");
	} else {
		header.removeAttribute(MENU_OPEN_ATTR);
	}
}

function enhanceRoot(root: HTMLElement): void {
	if (enhanced.has(root)) {
		return;
	}

	const dialog = root.querySelector("dialog");
	const openButton = root.querySelector<HTMLButtonElement>(
		"[data-mobile-nav-open]",
	);
	const closeButton = root.querySelector<HTMLButtonElement>(
		"[data-mobile-nav-close]",
	);
	if (!dialog || !openButton || !closeButton) {
		return;
	}

	enhanced.add(root);
	const header = headerFor(root);

	const openMenu = (): void => {
		if (dialog.open) {
			return;
		}
		dialog.showModal();
		syncOpen(true, openButton, header);
		closeButton.focus();
	};

	const closeMenu = (): void => {
		if (!dialog.open) {
			return;
		}
		dialog.close();
	};

	openButton.addEventListener("click", openMenu);
	closeButton.addEventListener("click", closeMenu);

	dialog.addEventListener("close", () => {
		syncOpen(false, openButton, header);
		openButton.focus();
	});

	const mediaQuery = window.matchMedia(DESKTOP_MQ);
	const onViewportChange = (): void => {
		if (mediaQuery.matches) {
			closeMenu();
		}
	};
	mediaQuery.addEventListener("change", onViewportChange);
}

export function enhanceMobileNav(root: ParentNode = document): void {
	if (root instanceof HTMLElement && root.matches("[data-mobile-nav]")) {
		enhanceRoot(root);
		return;
	}
	root.querySelectorAll<HTMLElement>("[data-mobile-nav]").forEach(enhanceRoot);
}
