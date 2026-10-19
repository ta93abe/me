import { describe, expect, it } from "vitest";

import { splitWords } from "@/scripts/home/split-text";

describe("splitWords", () => {
	it("keeps the original sentence for AT and hides the visual word spans", () => {
		const el = document.createElement("p");
		el.textContent = "データ基盤と CI を書く";
		splitWords(el);

		expect(el.getAttribute("aria-label")).toBeNull();
		expect(el.dataset.split).toBe("words");
		expect(el.querySelector(".sr-only")?.textContent).toBe(
			"データ基盤と CI を書く",
		);
		const words = [...el.querySelectorAll(".home-split-word")];
		expect(words.map((node) => node.textContent)).toEqual([
			"データ基盤と",
			"CI",
			"を書く",
		]);
		expect(
			words.every((node) => node.getAttribute("aria-hidden") === "true"),
		).toBe(true);
	});

	it("is a no-op when already split", () => {
		const el = document.createElement("p");
		el.textContent = "一度だけ";
		splitWords(el);
		splitWords(el);
		expect(el.querySelectorAll(".sr-only")).toHaveLength(1);
	});
});
