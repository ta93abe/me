const deck = document.querySelector(".deck");
const slides = [...document.querySelectorAll(".slide")];
const progress = document.querySelector(".progress i");
const currentLabel = document.querySelector("[data-current]");
const clickLabel = document.querySelector("[data-click-current]");
const clickWrap = document.querySelector("[data-click-label]");
const counter = document.querySelector(".progress");
const playerUi = document.querySelector(".player-ui");
const presenter = document.querySelector("[data-presenter]");
const presenterNotes = document.querySelector("[data-presenter-notes]");
const presenterNext = document.querySelector("[data-presenter-next]");
const presenterTimer = document.querySelector("[data-presenter-timer]");
const helpDialog = document.querySelector("[data-help]");

const CHROME_IDLE_MS = 2800;
const SLIDE_ANIM_FALLBACK_MS = 450;
let chromeIdleTimer = null;
let slideAnimTimer = null;
let slideAnimating = false;

if (!deck || slides.length === 0) {
	throw new Error("deck is missing");
}

const total = slides.length;
let index = 0;
let click = 0;
let overview = false;
let presenterOn = false;
let touchX = null;
let startedAt = null;
let timerId = null;

function clamp(value) {
	return Math.min(total - 1, Math.max(0, value));
}

function prefersReducedMotion() {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function canAnimateSlides() {
	return (
		!overview &&
		!prefersReducedMotion() &&
		!document.documentElement.classList.contains("is-print")
	);
}

function clearSlideAnimTimer() {
	if (slideAnimTimer != null) {
		window.clearTimeout(slideAnimTimer);
		slideAnimTimer = null;
	}
}

function finishSlideAnimation(outgoing, incoming) {
	clearSlideAnimTimer();
	slideAnimating = false;
	deck.classList.remove("is-slide-animating");
	outgoing?.classList.remove("is-leaving", "is-slide-run");
	incoming?.classList.remove("is-entering", "is-slide-run");
	incoming?.style.removeProperty("--slide-dir");
	render();
}

function animateSlideChange(fromIndex, toIndex) {
	const outgoing = slides[fromIndex];
	const incoming = slides[toIndex];
	if (!outgoing || !incoming) {
		render();
		return;
	}

	clearSlideAnimTimer();
	slideAnimating = true;
	const direction = toIndex > fromIndex ? 1 : -1;

	deck.classList.add("is-slide-animating");
	outgoing.classList.remove("is-active");
	outgoing.classList.add("is-leaving");
	outgoing.removeAttribute("hidden");
	outgoing.classList.remove("is-slide-run");

	incoming.classList.add("is-entering", "is-active");
	incoming.style.setProperty("--slide-dir", String(direction));
	incoming.removeAttribute("hidden");
	incoming.classList.remove("is-slide-run");
	renderClicks(incoming);
	syncUi();

	const runFrames = () => {
		outgoing.classList.add("is-slide-run");
		incoming.classList.add("is-slide-run");
	};

	requestAnimationFrame(() => {
		requestAnimationFrame(runFrames);
	});

	const onDone = () => {
		incoming.removeEventListener("transitionend", onTransitionEnd);
		finishSlideAnimation(outgoing, incoming);
	};

	const onTransitionEnd = (event) => {
		if (event.target !== incoming) {
			return;
		}
		if (
			event.propertyName !== "opacity" &&
			event.propertyName !== "transform"
		) {
			return;
		}
		onDone();
	};

	incoming.addEventListener("transitionend", onTransitionEnd);
	slideAnimTimer = window.setTimeout(onDone, SLIDE_ANIM_FALLBACK_MS);
}

function maxClicks(slide) {
	return Number.parseInt(slide?.getAttribute("data-clicks") ?? "0", 10) || 0;
}

function parseHash() {
	const raw = window.location.hash.replace(/^#/, "");
	const match = raw.match(/^(\d+)(?:\.(\d+))?$/);
	if (!match) {
		return { slide: 0, click: 0 };
	}
	const slide = clamp(Number.parseInt(match[1], 10) - 1);
	const max = maxClicks(slides[slide]);
	const nextClick = Number.parseInt(match[2] ?? "0", 10);
	return {
		slide,
		click: Number.isFinite(nextClick)
			? Math.min(max, Math.max(0, nextClick))
			: 0,
	};
}

function slideHeading(slide) {
	const heading = slide?.querySelector("h1, h2");
	return (
		heading?.textContent?.trim() ||
		`スライド ${slide?.getAttribute("data-index") ?? ""}`
	);
}

function formatElapsed(ms) {
	const totalSeconds = Math.max(0, Math.floor(ms / 1000));
	const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
	const seconds = String(totalSeconds % 60).padStart(2, "0");
	return `${minutes}:${seconds}`;
}

function ensureTimer() {
	if (startedAt == null) {
		startedAt = Date.now();
	}
	if (timerId != null || !presenterOn) {
		return;
	}
	const tick = () => {
		if (presenterTimer) {
			presenterTimer.textContent = formatElapsed(Date.now() - startedAt);
		}
	};
	tick();
	timerId = window.setInterval(tick, 1000);
}

function stopTimerTick() {
	if (timerId != null) {
		window.clearInterval(timerId);
		timerId = null;
	}
}

function chromeShouldStayVisible() {
	return (
		overview ||
		presenterOn ||
		(helpDialog instanceof HTMLDialogElement && helpDialog.open)
	);
}

function clearChromeIdleTimer() {
	if (chromeIdleTimer != null) {
		window.clearTimeout(chromeIdleTimer);
		chromeIdleTimer = null;
	}
}

function hideChromeIdle() {
	if (!playerUi || chromeShouldStayVisible()) {
		return;
	}
	playerUi.classList.add("is-chrome-idle");
}

function wakeChrome() {
	if (!(playerUi instanceof HTMLElement)) {
		return;
	}
	playerUi.classList.remove("is-chrome-idle");
	if (chromeShouldStayVisible()) {
		clearChromeIdleTimer();
		return;
	}
	clearChromeIdleTimer();
	chromeIdleTimer = window.setTimeout(hideChromeIdle, CHROME_IDLE_MS);
}

function syncChromeIdlePolicy() {
	if (!(playerUi instanceof HTMLElement)) {
		return;
	}
	if (chromeShouldStayVisible()) {
		clearChromeIdleTimer();
		playerUi.classList.remove("is-chrome-idle");
		return;
	}
	wakeChrome();
}

function renderClicks(slide) {
	const nodes = slide.querySelectorAll("[data-click]");
	nodes.forEach((node) => {
		const need = Number.parseInt(node.getAttribute("data-click") ?? "0", 10);
		node.classList.toggle("is-visible", overview || click >= need);
	});
	const highlights = slide.querySelectorAll("[data-click-highlight]");
	highlights.forEach((node) => {
		const step = Number.parseInt(
			node.getAttribute("data-click-highlight") ?? "0",
			10,
		);
		node.classList.toggle("is-highlighted", overview || click === step);
	});
}

function renderPresenter() {
	if (!presenter) {
		return;
	}
	presenter.toggleAttribute("hidden", !presenterOn);
	document.documentElement.classList.toggle("is-presenter", presenterOn);
	if (!presenterOn) {
		stopTimerTick();
		return;
	}
	ensureTimer();
	const current = slides[index];
	const notes = current?.querySelector(".speaker-notes")?.textContent?.trim();
	if (presenterNotes) {
		presenterNotes.textContent = notes || "ノートなし";
	}
	const upcoming = slides[index + 1];
	if (presenterNext) {
		presenterNext.textContent = upcoming
			? slideHeading(upcoming)
			: "最後のスライド";
	}
}

function syncUi() {
	const ratio = ((index + 1) / total) * 100;
	if (progress instanceof HTMLElement) {
		progress.style.width = `${ratio}%`;
	}
	if (currentLabel) {
		currentLabel.textContent = String(index + 1);
	}
	const max = maxClicks(slides[index]);
	if (clickWrap instanceof HTMLElement) {
		clickWrap.toggleAttribute("hidden", max === 0 || click === 0);
	}
	if (clickLabel) {
		clickLabel.textContent = String(click);
	}
	if (counter instanceof HTMLElement) {
		counter.setAttribute("aria-valuenow", String(index + 1));
	}
	const nextHash = click > 0 ? `#${index + 1}.${click}` : `#${index + 1}`;
	if (window.location.hash !== nextHash) {
		history.replaceState(null, "", nextHash);
	}
	renderPresenter();
}

function render() {
	if (slideAnimating) {
		syncUi();
		return;
	}
	slides.forEach((slide, slideIndex) => {
		const on = overview || slideIndex === index;
		slide.classList.toggle("is-active", slideIndex === index);
		slide.classList.remove("is-entering", "is-leaving", "is-slide-run");
		slide.style.removeProperty("--slide-dir");
		slide.toggleAttribute("hidden", !on);
		slide.toggleAttribute("inert", !on);
		if (slideIndex === index || overview) {
			renderClicks(slide);
		}
	});
	deck.classList.remove("is-slide-animating");
	syncUi();
}

function go(nextIndex, nextClick = 0, { animate = true } = {}) {
	if (slideAnimating) {
		return;
	}
	const previousIndex = index;
	index = clamp(nextIndex);
	click = Math.min(maxClicks(slides[index]), Math.max(0, nextClick));
	const leavingOverview = overview;
	if (overview) {
		setOverview(false);
	}
	if (
		animate &&
		!leavingOverview &&
		previousIndex !== index &&
		canAnimateSlides()
	) {
		animateSlideChange(previousIndex, index);
		return;
	}
	render();
}

function next() {
	if (slideAnimating) {
		return;
	}
	ensureTimer();
	const max = maxClicks(slides[index]);
	if (!overview && click < max) {
		click += 1;
		render();
		return;
	}
	if (index < total - 1) {
		go(index + 1, 0);
	}
}

function prev() {
	if (slideAnimating) {
		return;
	}
	if (!overview && click > 0) {
		click -= 1;
		render();
		return;
	}
	if (index > 0) {
		const previous = index - 1;
		go(previous, maxClicks(slides[previous]));
	}
}

function setOverview(on) {
	overview = on;
	deck.classList.toggle("is-overview", on);
	render();
	syncChromeIdlePolicy();
}

function setPresenter(on) {
	presenterOn = on;
	if (on) {
		ensureTimer();
	}
	renderPresenter();
	syncChromeIdlePolicy();
}

function toggleHelp() {
	if (!(helpDialog instanceof HTMLDialogElement)) {
		return;
	}
	if (helpDialog.open) {
		helpDialog.close();
	} else {
		helpDialog.showModal();
	}
	syncChromeIdlePolicy();
}

window.addEventListener("keydown", (event) => {
	wakeChrome();

	if (
		event.defaultPrevented ||
		event.metaKey ||
		event.ctrlKey ||
		event.altKey
	) {
		return;
	}

	if (helpDialog instanceof HTMLDialogElement && helpDialog.open) {
		if (event.key === "Escape" || event.key === "?") {
			event.preventDefault();
			helpDialog.close();
		}
		return;
	}

	switch (event.key) {
		case "ArrowRight":
		case "PageDown":
		case " ":
			event.preventDefault();
			next();
			break;
		case "ArrowLeft":
		case "PageUp":
			event.preventDefault();
			prev();
			break;
		case "Home":
			event.preventDefault();
			go(0, 0);
			break;
		case "End":
			event.preventDefault();
			go(total - 1, 0);
			break;
		case "f":
		case "F":
			event.preventDefault();
			if (document.fullscreenElement) {
				void document.exitFullscreen();
			} else {
				void document.documentElement.requestFullscreen();
			}
			break;
		case "o":
		case "O":
			event.preventDefault();
			setOverview(!overview);
			break;
		case "p":
		case "P":
			event.preventDefault();
			setPresenter(!presenterOn);
			break;
		case "?":
			event.preventDefault();
			toggleHelp();
			break;
		case "Escape":
			if (overview) {
				event.preventDefault();
				setOverview(false);
			} else if (presenterOn) {
				event.preventDefault();
				setPresenter(false);
			}
			break;
		default:
			break;
	}
});

window.addEventListener("hashchange", () => {
	const parsed = parseHash();
	index = parsed.slide;
	click = parsed.click;
	if (slideAnimating) {
		const outgoing = slides.find((slide) =>
			slide.classList.contains("is-leaving"),
		);
		const incoming = slides.find((slide) =>
			slide.classList.contains("is-entering"),
		);
		finishSlideAnimation(outgoing, incoming);
		return;
	}
	render();
});

deck.addEventListener("click", (event) => {
	if (!overview) {
		return;
	}
	const slide =
		event.target instanceof Element ? event.target.closest(".slide") : null;
	if (!slide) {
		return;
	}
	const nextIndex =
		Number.parseInt(slide.getAttribute("data-index") ?? "1", 10) - 1;
	go(nextIndex, 0);
});

deck.addEventListener(
	"touchstart",
	(event) => {
		touchX = event.changedTouches[0]?.clientX ?? null;
	},
	{ passive: true },
);

deck.addEventListener(
	"touchend",
	(event) => {
		if (touchX == null) {
			return;
		}
		const x = event.changedTouches[0]?.clientX ?? touchX;
		const delta = x - touchX;
		touchX = null;
		if (Math.abs(delta) < 48) {
			return;
		}
		if (delta < 0) {
			next();
		} else {
			prev();
		}
	},
	{ passive: true },
);

window.addEventListener(
	"mousemove",
	() => {
		wakeChrome();
	},
	{ passive: true },
);

window.addEventListener(
	"touchstart",
	() => {
		wakeChrome();
	},
	{ passive: true },
);

const initial = parseHash();
index = initial.slide;
click = initial.click;
render();
wakeChrome();
