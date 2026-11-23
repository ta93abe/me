/// <reference lib="dom" />
import { afterEach, describe, expect, it, vi } from "vitest";

import { enhanceMobileNav } from "@/scripts/mobile-nav";

function mountNav(): {
	header: HTMLElement;
	root: HTMLElement;
	dialog: HTMLDialogElement;
	openButton: HTMLButtonElement;
	closeButton: HTMLButtonElement;
} {
	document.body.innerHTML = `
		<header>
			<div data-mobile-nav>
				<button
					type="button"
					aria-label="メニューを開く"
					aria-expanded="false"
					data-mobile-nav-open
				></button>
				<dialog aria-label="メニュー">
					<button
						type="button"
						aria-label="メニューを閉じる"
						data-mobile-nav-close
					></button>
					<nav aria-label="モバイルナビゲーション">
						<ul>
							<li><a href="/blog/" aria-current="page">Blog</a></li>
						</ul>
					</nav>
				</dialog>
			</div>
		</header>
	`;
	const header = document.querySelector("header");
	const root = document.querySelector<HTMLElement>("[data-mobile-nav]");
	const dialog = document.querySelector("dialog");
	const openButton = document.querySelector<HTMLButtonElement>(
		"[data-mobile-nav-open]",
	);
	const closeButton = document.querySelector<HTMLButtonElement>(
		"[data-mobile-nav-close]",
	);
	if (!header || !root || !dialog || !openButton || !closeButton) {
		throw new Error("mobile nav fixture is incomplete");
	}
	return { header, root, dialog, openButton, closeButton };
}

describe("enhanceMobileNav", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		document.body.innerHTML = "";
	});

	it("opens the dialog, expands the trigger, and marks the header", () => {
		const { header, dialog, openButton, closeButton } = mountNav();
		enhanceMobileNav();

		openButton.click();

		expect(dialog.open).toBe(true);
		expect(openButton.getAttribute("aria-expanded")).toBe("true");
		expect(header.hasAttribute("data-menu-open")).toBe(true);
		expect(document.activeElement).toBe(closeButton);
	});

	it("closes from the close button and restores focus to the trigger", () => {
		const { header, dialog, openButton, closeButton } = mountNav();
		enhanceMobileNav();

		openButton.click();
		closeButton.click();

		expect(dialog.open).toBe(false);
		expect(openButton.getAttribute("aria-expanded")).toBe("false");
		expect(header.hasAttribute("data-menu-open")).toBe(false);
		expect(document.activeElement).toBe(openButton);
	});

	it("closes on the dialog close event (Escape)", () => {
		const { header, dialog, openButton } = mountNav();
		enhanceMobileNav();

		openButton.click();
		dialog.close();

		expect(dialog.open).toBe(false);
		expect(openButton.getAttribute("aria-expanded")).toBe("false");
		expect(header.hasAttribute("data-menu-open")).toBe(false);
		expect(document.activeElement).toBe(openButton);
	});

	it("closes when the viewport crosses to desktop", () => {
		const listeners = new Map<string, EventListener>();
		let matchesDesktop = false;
		const mediaQuery: MediaQueryList = {
			get matches() {
				return matchesDesktop;
			},
			media: "(min-width: 768px)",
			addEventListener: (type: string, listener: EventListener) => {
				listeners.set(type, listener);
			},
			removeEventListener: () => {},
			dispatchEvent: () => false,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
		};
		vi.spyOn(window, "matchMedia").mockReturnValue(mediaQuery);

		const { header, dialog, openButton } = mountNav();
		enhanceMobileNav();
		openButton.click();
		expect(dialog.open).toBe(true);

		matchesDesktop = true;
		listeners.get("change")?.(new Event("change"));

		expect(dialog.open).toBe(false);
		expect(header.hasAttribute("data-menu-open")).toBe(false);
	});

	it("is a no-op when enhanceMobileNav runs twice", () => {
		const { openButton } = mountNav();
		const add = vi.spyOn(openButton, "addEventListener");
		enhanceMobileNav();
		enhanceMobileNav();
		expect(add.mock.calls.filter((call) => call[0] === "click")).toHaveLength(
			1,
		);
	});
});
