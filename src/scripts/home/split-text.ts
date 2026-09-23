/** Club SplitText の代わりに単語 span へ分割（`/` 専用） */
export function splitWords(el: HTMLElement): void {
	if (el.dataset.split === "words") return;

	const text = el.textContent?.replace(/\s+/g, " ").trim() ?? "";
	if (!text) return;

	el.dataset.split = "words";
	el.setAttribute("aria-label", text);
	el.textContent = "";

	const words = text.split(" ");
	for (let i = 0; i < words.length; i++) {
		const wrap = document.createElement("span");
		wrap.className = "home-split-word";
		wrap.setAttribute("aria-hidden", "true");
		wrap.style.display = "inline-block";
		wrap.textContent = words[i];
		el.appendChild(wrap);
		if (i < words.length - 1) {
			el.appendChild(document.createTextNode(" "));
		}
	}
}
