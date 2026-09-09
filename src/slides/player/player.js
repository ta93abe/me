const deck = document.querySelector(".deck");
const slides = [...document.querySelectorAll(".slide")];
const progress = document.querySelector(".progress i");
const currentLabel = document.querySelector("[data-current]");
const clickLabel = document.querySelector("[data-click]");
const clickWrap = document.querySelector("[data-click-label]");
const counter = document.querySelector(".progress");
const presenter = document.querySelector("[data-presenter]");
const presenterNotes = document.querySelector("[data-presenter-notes]");
const presenterNext = document.querySelector("[data-presenter-next]");
const presenterTimer = document.querySelector("[data-presenter-timer]");
const helpDialog = document.querySelector("[data-help]");

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

function render() {
	slides.forEach((slide, slideIndex) => {
		const on = overview || slideIndex === index;
		slide.classList.toggle("is-active", slideIndex === index);
		slide.toggleAttribute("hidden", !on);
		slide.toggleAttribute("inert", !on);
		if (slideIndex === index || overview) {
			renderClicks(slide);
		}
	});
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

function go(nextIndex, nextClick = 0) {
	index = clamp(nextIndex);
	click = Math.min(maxClicks(slides[index]), Math.max(0, nextClick));
	if (overview) {
		setOverview(false);
	}
	render();
}

function next() {
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
}

function setPresenter(on) {
	presenterOn = on;
	if (on) {
		ensureTimer();
	}
	renderPresenter();
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
}

window.addEventListener("keydown", (event) => {
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

const initial = parseHash();
index = initial.slide;
click = initial.click;
render();
