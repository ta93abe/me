const SNOW_FLAKE_COUNT = 52;

function prefersReducedMotion() {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function seedSnowLayer(layer) {
	if (layer.dataset.seeded === "true") {
		return;
	}
	layer.dataset.seeded = "true";
	const fragment = document.createDocumentFragment();
	for (let i = 0; i < SNOW_FLAKE_COUNT; i += 1) {
		const flake = document.createElement("span");
		flake.className = "snow-flake";
		flake.style.setProperty("--snow-x", `${Math.random() * 100}%`);
		flake.style.setProperty("--snow-delay", `${Math.random() * -18}s`);
		flake.style.setProperty("--snow-duration", `${9 + Math.random() * 10}s`);
		flake.style.setProperty("--snow-size", `${2.5 + Math.random() * 3.5}px`);
		flake.style.setProperty("--snow-drift", `${-24 + Math.random() * 48}px`);
		fragment.appendChild(flake);
	}
	layer.appendChild(fragment);
}

export function initDeckEffects() {
	if (prefersReducedMotion()) {
		return;
	}
	const effect = document.documentElement.dataset.effect;
	if (effect !== "snow") {
		return;
	}
	const layer = document.querySelector('[data-deck-effect-layer="snow"]');
	if (!(layer instanceof HTMLElement)) {
		return;
	}
	seedSnowLayer(layer);
}
