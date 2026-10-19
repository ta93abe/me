const COPY_LABEL = "コードをコピー";
const COPIED_LABEL = "コピーしました";
const LIVE_REGION_ID = "blog-copy-status";

const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" /><path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" /></svg>`;
const copiedIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" /></svg>`;

function liveRegion(root: ParentNode): HTMLElement {
	const existing = root.querySelector<HTMLElement>(`#${LIVE_REGION_ID}`);
	if (existing) {
		return existing;
	}
	const region = document.createElement("div");
	region.id = LIVE_REGION_ID;
	region.className = "sr-only";
	region.setAttribute("aria-live", "polite");
	const host = root instanceof Document ? root.body : root;
	host.appendChild(region);
	return region;
}

export function enhanceCodeCopyButtons(root: ParentNode = document): void {
	const status = liveRegion(root);

	const pres =
		root instanceof Document
			? root.querySelectorAll(".prose pre")
			: root.querySelectorAll("pre");
	pres.forEach((pre) => {
		if (pre.querySelector(":scope > .copy-button")) {
			return;
		}
		const button = document.createElement("button");
		button.type = "button";
		button.className = "copy-button";
		button.setAttribute("aria-label", COPY_LABEL);
		button.innerHTML = copyIcon;
		button.addEventListener("click", async () => {
			const code = pre.querySelector("code");
			if (!code) {
				return;
			}
			await navigator.clipboard.writeText(code.textContent || "");
			button.classList.add("copied");
			button.setAttribute("aria-label", COPIED_LABEL);
			button.innerHTML = copiedIcon;
			status.textContent = COPIED_LABEL;
			window.posthog?.capture("blog_code_copied", {
				post_title: document.title,
				post_url: window.location.href,
			});
			window.setTimeout(() => {
				button.classList.remove("copied");
				button.setAttribute("aria-label", COPY_LABEL);
				button.innerHTML = copyIcon;
				if (status.textContent === COPIED_LABEL) {
					status.textContent = "";
				}
			}, 2000);
		});
		pre.appendChild(button);
	});
}
