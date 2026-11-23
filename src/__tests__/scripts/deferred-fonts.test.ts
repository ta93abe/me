import { afterEach, describe, expect, it, vi } from "vitest";

import { injectDeferredFonts } from "@/scripts/deferred-fonts";

describe("injectDeferredFonts", () => {
	afterEach(() => {
		delete document.documentElement.dataset.deferredFonts;
		vi.restoreAllMocks();
		document.head.replaceChildren();
	});

	it("injects a stylesheet from the layout data attribute", () => {
		document.documentElement.dataset.deferredFonts =
			"/_astro/fonts-defer.test.css";
		const append = vi
			.spyOn(document.head, "appendChild")
			.mockImplementation((node) => node);
		injectDeferredFonts();
		expect(append).toHaveBeenCalledTimes(1);
		const link = append.mock.calls[0]?.[0] as HTMLLinkElement;
		expect(link.rel).toBe("stylesheet");
		expect(link.getAttribute("href")).toBe("/_astro/fonts-defer.test.css");
	});

	it("is a no-op without the data attribute", () => {
		const append = vi.spyOn(document.head, "appendChild");
		injectDeferredFonts();
		expect(append).not.toHaveBeenCalled();
	});

	it("does not inject twice", () => {
		const href = "/_astro/fonts-defer.test.css";
		document.documentElement.dataset.deferredFonts = href;
		const existing = document.createElement("link");
		existing.setAttribute("href", href);
		document.head.appendChild(existing);
		const append = vi.spyOn(document.head, "appendChild");
		injectDeferredFonts();
		expect(append).not.toHaveBeenCalled();
	});
});
