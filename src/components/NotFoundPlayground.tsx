import { motion, useReducedMotion } from "framer-motion";
import * as React from "react";

import { NAV_LINKS } from "@/config/navigation";

const linkMeta: Record<string, string> = {
	About: "Intro",
	Blog: "Field notes",
	Contact: "SNS",
};

const quickLinks = NAV_LINKS.map((link) => ({
	href: link.href,
	label: link.text,
	meta: linkMeta[link.text] ?? link.href,
}));

const fieldNotes = [
	"Route slipped between the columns",
	"Margin marks are still blinking",
	"Index says: try another doorway",
	"Signal recovered near /about/",
];

const floatingLabels = [
	{ text: "NO SIGNAL", className: "nf-ticket nf-ticket-a" },
	{ text: "TRY /ABOUT", className: "nf-ticket nf-ticket-b" },
	{ text: "LOST LINK", className: "nf-ticket nf-ticket-c" },
	{ text: "PAGE DRIFT", className: "nf-ticket nf-ticket-d" },
];

const displayDigits = [
	{ id: "first-four", value: "4" },
	{ id: "zero", value: "0" },
	{ id: "last-four", value: "4" },
] as const;

const idleFaces = displayDigits.map((digit) => digit.value);

const glitchGlyphs = ["4", "0", "#", "/", "X", "%", "?", "■"] as const;
const smashEase = [0.18, 1.4, 0.28, 1] as const;
const linearEase = "linear" as const;
const SMASH_MS = 240;

const handleBack = (event: React.MouseEvent<HTMLButtonElement>) => {
	event.preventDefault();

	try {
		if (
			document.referrer &&
			new URL(document.referrer).origin === window.location.origin
		) {
			window.history.back();
			return;
		}
	} catch (error) {
		console.error("Failed to inspect referrer:", error);
	}

	window.location.href = "/";
};

const pickGlyph = (seed: number) =>
	glitchGlyphs[Math.abs(seed) % glitchGlyphs.length];

export default function NotFoundPlayground() {
	const prefersReducedMotion = useReducedMotion();
	const titleId = React.useId();
	const [smashing, setSmashing] = React.useState(false);
	const [smashTick, setSmashTick] = React.useState(0);
	const [faces, setFaces] = React.useState<string[]>(idleFaces);

	React.useEffect(() => {
		if (smashTick === 0) return;

		const timeoutId = window.setTimeout(() => {
			setFaces(idleFaces);
			setSmashing(false);
		}, SMASH_MS);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [smashTick]);

	const smash = React.useCallback(() => {
		if (prefersReducedMotion) return;

		const now = Date.now();
		setSmashing(true);
		setFaces([pickGlyph(now), pickGlyph(now + 3), pickGlyph(now + 7)]);
		setSmashTick((tick) => tick + 1);
	}, [prefersReducedMotion]);

	const entrance = prefersReducedMotion
		? {}
		: {
				initial: { opacity: 0, y: 28 },
				animate: { opacity: 1, y: 0 },
				transition: {
					duration: 0.42,
					ease: smashEase,
				},
			};

	const digitMotion = (index: number) =>
		prefersReducedMotion
			? {}
			: {
					initial: {
						opacity: 0,
						y: -220,
						scale: 1.35,
						rotate: index === 1 ? 18 : -16,
					},
					animate: {
						opacity: 1,
						y: 0,
						scale: 1,
						rotate: 0,
					},
					transition: {
						type: "spring" as const,
						stiffness: 420,
						damping: 14,
						mass: 1.15,
						delay: 0.06 + index * 0.11,
					},
					whileHover: {
						scale: 1.08,
						rotate: index === 1 ? 10 : -10,
					},
					whileTap: {
						scale: 0.84,
						rotate: index === 1 ? -14 : 14,
					},
				};

	const ticketMotion = (index: number) =>
		prefersReducedMotion
			? {}
			: {
					animate: {
						x: [0, index % 2 === 0 ? 26 : -26, 0],
						y: [0, index % 2 === 0 ? -34 : 34, 0],
						rotate: [
							index % 2 === 0 ? -14 : 12,
							index % 2 === 0 ? 18 : -16,
							index % 2 === 0 ? -14 : 12,
						],
					},
					transition: {
						duration: 1.05 + index * 0.18,
						delay: index * 0.08,
						ease: smashEase,
						repeat: Infinity,
					},
				};

	return (
		<main className="nf-shell" aria-labelledby={titleId}>
			<motion.div
				className="nf-ruler nf-ruler-top"
				aria-hidden="true"
				{...(prefersReducedMotion
					? {}
					: {
							animate: { x: ["0%", "-50%"] },
							transition: {
								duration: 5.5,
								ease: linearEase,
								repeat: Infinity,
							},
						})}
			>
				<span>404 / missing folio / 404 / misplaced page /</span>
				<span>404 / missing folio / 404 / misplaced page /</span>
			</motion.div>

			<section className="nf-stage" aria-label="404 playground">
				<motion.div className="nf-masthead" {...entrance}>
					<span>TA93ABE.COM</span>
					<span className="nf-flicker">Issue 404</span>
					<span>Broken route special</span>
				</motion.div>

				<div className="nf-layout">
					<section
						className={`nf-hero${smashing ? " is-smashing" : ""}`}
						aria-label="404 animated poster"
					>
						<div className="nf-hero-fx" aria-hidden="true">
							<div className="nf-shock" />
							<div className="nf-scan" />
							<div className="nf-noise" />
						</div>
						<div
							className="nf-print-mark nf-print-mark-left"
							aria-hidden="true"
						/>
						<div
							className="nf-print-mark nf-print-mark-right"
							aria-hidden="true"
						/>

						{floatingLabels.map((item, index) => (
							<motion.span
								key={item.text}
								className={item.className}
								aria-hidden="true"
								{...ticketMotion(index)}
							>
								{item.text}
							</motion.span>
						))}

						<div className="nf-number" aria-hidden="true">
							{displayDigits.map((digit, index) => (
								<motion.button
									key={digit.id}
									type="button"
									className={`nf-digit nf-digit-${index + 1}`}
									tabIndex={-1}
									onClick={smash}
									{...digitMotion(index)}
								>
									<span className="nf-digit-layer">
										<span className="nf-digit-ghost nf-digit-r">
											{faces[index]}
										</span>
										<span className="nf-digit-ghost nf-digit-c">
											{faces[index]}
										</span>
										<span className="nf-digit-face">{faces[index]}</span>
									</span>
								</motion.button>
							))}
						</div>

						<div className="nf-signal" aria-hidden="true">
							<motion.span
								className="nf-signal-bar"
								{...(prefersReducedMotion
									? {}
									: {
											animate: { x: ["-120%", "180%"] },
											transition: {
												duration: 0.62,
												repeat: Infinity,
												repeatDelay: 0.55,
												ease: linearEase,
											},
										})}
							/>
						</div>
						<p className="nf-caption">
							The requested page stepped out of the layout grid.
						</p>
					</section>

					<motion.section className="nf-panel" {...entrance}>
						<div className="nf-panel-label">Page recovery desk</div>
						<h1 id={titleId}>ページが街角で迷子です。</h1>
						<p>
							リンクの行き先が移動したか、まだ公開されていないページを見ています。
							近い入口から戻るか、下の索引をたどってください。
						</p>

						<div className="nf-actions">
							<a className="nf-action nf-action-primary" href="/">
								ホームへ
							</a>
							<button
								className="nf-action nf-action-secondary"
								type="button"
								onClick={handleBack}
							>
								前のページへ
							</button>
						</div>

						<nav className="nf-index" aria-label="主要ページ">
							{quickLinks.map((link, index) => (
								<motion.a
									key={link.href}
									href={link.href}
									className="nf-index-row"
									aria-label={link.label}
									initial={false}
									animate={
										prefersReducedMotion ? undefined : { opacity: 1, x: 0 }
									}
									transition={
										prefersReducedMotion
											? undefined
											: {
													delay: 0.28 + index * 0.06,
													duration: 0.32,
													ease: smashEase,
												}
									}
									whileHover={
										prefersReducedMotion
											? undefined
											: {
													x: 10,
													backgroundColor: "rgba(255, 255, 255, 0.08)",
												}
									}
								>
									<span className="nf-index-number">
										{String(index + 1).padStart(2, "0")}
									</span>
									<span>
										<strong>{link.label}</strong>
										<small>{link.meta}</small>
									</span>
								</motion.a>
							))}
						</nav>
					</motion.section>
				</div>

				<motion.aside
					className="nf-ticker"
					aria-label="Route diagnostics"
					{...(prefersReducedMotion
						? {}
						: {
								initial: { opacity: 0, y: 18 },
								animate: { opacity: 1, y: 0 },
								transition: { delay: 0.18, duration: 0.36 },
							})}
				>
					{fieldNotes.map((note, index) => (
						<span key={note}>
							<b>{String(index + 1).padStart(2, "0")}</b>
							{note}
						</span>
					))}
				</motion.aside>
			</section>

			<motion.div
				className="nf-ruler nf-ruler-bottom"
				aria-hidden="true"
				{...(prefersReducedMotion
					? {}
					: {
							animate: { x: ["-50%", "0%"] },
							transition: {
								duration: 6.2,
								ease: linearEase,
								repeat: Infinity,
							},
						})}
			>
				<span>return home / recalibrate / open archive /</span>
				<span>return home / recalibrate / open archive /</span>
			</motion.div>

			<style>{`
				.nf-shell {
					position: relative;
					isolation: isolate;
					height: 100svh;
					min-height: 100svh;
					overflow-x: hidden;
					overflow-y: auto;
					padding: clamp(1.5rem, 4vw, 2.75rem) clamp(1rem, 4vw, 4rem);
					background:
						linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px) 0 0 / 72px 72px,
						linear-gradient(0deg, rgba(255,255,255,0.045) 1px, transparent 1px) 0 0 / 72px 72px,
						linear-gradient(135deg, #08090a 0%, #111111 42%, #191611 100%);
					color: #f8f3e7;
				}

				.nf-shell::before {
					position: absolute;
					inset: 0;
					z-index: -1;
					content: "";
					background:
						repeating-linear-gradient(90deg, transparent 0 16px, rgba(239, 68, 68, 0.08) 16px 17px, transparent 17px 42px),
						repeating-linear-gradient(0deg, transparent 0 13px, rgba(34, 211, 238, 0.06) 13px 14px, transparent 14px 37px);
					mix-blend-mode: screen;
					opacity: 0.75;
					pointer-events: none;
					animation: nf-grid-drift 0.72s steps(4) infinite;
				}

				.nf-shell::after {
					position: absolute;
					inset: 0;
					z-index: -1;
					content: "";
					background-image: repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 5px);
					opacity: 0.18;
					pointer-events: none;
					animation: nf-scan-film 1.4s linear infinite;
				}

				.nf-stage {
					position: relative;
					width: min(100%, 1320px);
					margin: 0 auto;
				}

				.nf-masthead,
				.nf-ticker,
				.nf-ruler {
					font-family: "Inter", system-ui, sans-serif;
					font-size: clamp(0.72rem, 1vw, 0.86rem);
					font-weight: 700;
					letter-spacing: 0;
					text-transform: uppercase;
				}

				.nf-masthead {
					display: grid;
					grid-template-columns: 1fr auto 1fr;
					gap: 1rem;
					align-items: center;
					padding: 0.75rem 0;
					border-top: 2px solid rgba(248, 243, 231, 0.92);
					border-bottom: 1px solid rgba(248, 243, 231, 0.32);
					color: rgba(248, 243, 231, 0.78);
				}

				.nf-masthead span:nth-child(2) {
					color: #cffc54;
				}

				.nf-masthead span:last-child {
					text-align: right;
				}

				.nf-flicker {
					animation: nf-flicker 1.65s steps(2, jump-none) infinite;
				}

				.nf-layout {
					display: grid;
					grid-template-columns: minmax(0, 1.28fr) minmax(21rem, 0.72fr);
					gap: clamp(1.25rem, 3vw, 2.5rem);
					align-items: start;
					margin-top: clamp(1.5rem, 3vw, 2.25rem);
				}

				.nf-hero {
					position: relative;
					display: flex;
					min-height: clamp(22rem, 38vw, 28rem);
					flex-direction: column;
					justify-content: center;
					padding: clamp(1.5rem, 4vw, 3rem);
					border: 2px solid rgba(248, 243, 231, 0.88);
					background:
						linear-gradient(125deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 52%),
						linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015));
					box-shadow: 18px 18px 0 #cffc54;
					animation: nf-hero-jitter 2.4s steps(2, jump-none) infinite;
				}

				.nf-hero.is-smashing {
					animation: nf-smash 0.24s steps(4) both;
				}

				.nf-print-mark {
					position: absolute;
					width: 3.4rem;
					height: 3.4rem;
					border: 1px solid rgba(248, 243, 231, 0.82);
					pointer-events: none;
				}

				.nf-print-mark::before,
				.nf-print-mark::after {
					position: absolute;
					content: "";
					background: rgba(248, 243, 231, 0.82);
				}

				.nf-print-mark::before {
					top: 50%;
					left: -0.8rem;
					width: 5rem;
					height: 1px;
				}

				.nf-print-mark::after {
					top: -0.8rem;
					left: 50%;
					width: 1px;
					height: 5rem;
				}

				.nf-print-mark-left {
					top: 1rem;
					left: 1rem;
				}

				.nf-print-mark-right {
					right: 1rem;
					bottom: 1rem;
				}

				.nf-hero-fx {
					position: absolute;
					inset: 0;
					z-index: 0;
					overflow: hidden;
					pointer-events: none;
				}

				.nf-shock,
				.nf-scan,
				.nf-noise {
					position: absolute;
					inset: 0;
					pointer-events: none;
				}

				.nf-shock {
					z-index: 0;
					background: repeating-conic-gradient(
						from 0deg at 50% 48%,
						transparent 0deg 8deg,
						rgba(255, 255, 255, 0.09) 8deg 9deg
					);
					opacity: 0.22;
					mix-blend-mode: overlay;
					transform-origin: 50% 48%;
					animation: nf-shock-pulse 1.1s steps(3, jump-none) infinite;
				}

				.nf-scan {
					z-index: 3;
					background: linear-gradient(
						180deg,
						transparent 0%,
						rgba(207, 252, 84, 0.0) 42%,
						rgba(207, 252, 84, 0.28) 50%,
						rgba(34, 211, 238, 0.16) 54%,
						transparent 62%
					);
					mix-blend-mode: screen;
					animation: nf-scan-bar 1.15s linear infinite;
				}

				.nf-noise {
					z-index: 3;
					background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E");
					background-size: 180px 180px;
					mix-blend-mode: overlay;
					opacity: 0.18;
					animation: nf-noise-shift 0.18s steps(2) infinite;
				}

				.nf-number {
					position: relative;
					z-index: 1;
					display: flex;
					flex-wrap: wrap;
					gap: clamp(0.65rem, 1.6vw, 1rem);
					align-items: center;
					justify-content: center;
				}

				.nf-digit {
					display: inline-grid;
					width: clamp(6.6rem, 16vw, 15rem);
					aspect-ratio: 0.82;
					place-items: center;
					padding: 0;
					appearance: none;
					overflow: visible;
					border: 2px solid rgba(8, 9, 10, 0.9);
					font-family: "Inter", system-ui, sans-serif;
					font-size: clamp(7.8rem, 20vw, 20rem);
					font-weight: 700;
					line-height: 0.78;
					letter-spacing: 0;
					text-shadow: 5px 5px 0 rgba(8, 9, 10, 0.18);
					box-shadow: 0 18px 0 rgba(0, 0, 0, 0.32);
					cursor: crosshair;
					user-select: none;
				}

				.nf-digit-layer {
					position: relative;
					display: grid;
					width: 100%;
					height: 100%;
					overflow: hidden;
					place-items: center;
					animation: nf-digit-tear 1.7s steps(2, jump-none) infinite;
				}

				.nf-digit-1 .nf-digit-layer {
					animation-duration: 1.45s;
				}

				.nf-digit-2 .nf-digit-layer {
					animation-duration: 1.95s;
					animation-delay: 0.18s;
				}

				.nf-digit-3 .nf-digit-layer {
					animation-duration: 1.6s;
					animation-delay: 0.36s;
				}

				.nf-digit-ghost,
				.nf-digit-face {
					grid-area: 1 / 1;
					display: grid;
					place-items: center;
				}

				.nf-digit-ghost {
					pointer-events: none;
					opacity: 0.55;
				}

				.nf-digit-r {
					color: #ff1e2d;
					animation: nf-rgb-r 0.2s steps(2) infinite;
				}

				.nf-digit-c {
					color: #00e5ff;
					animation: nf-rgb-c 0.22s steps(2) infinite;
					animation-delay: 0.04s;
				}

				.nf-digit-face {
					position: relative;
					z-index: 1;
				}

				.nf-digit-1 {
					background: #f8f3e7;
					color: #111111;
				}

				.nf-digit-2 {
					background: #22d3ee;
					color: #071012;
				}

				.nf-digit-3 {
					background: #ff5a4f;
					color: #160807;
				}

				.nf-ticket {
					position: absolute;
					z-index: 2;
					display: inline-flex;
					align-items: center;
					justify-content: center;
					min-width: 7.6rem;
					padding: 0.62rem 0.8rem;
					border: 2px solid #08090a;
					background: #f8f3e7;
					color: #08090a;
					font-family: "Inter", system-ui, sans-serif;
					font-size: 0.78rem;
					font-weight: 700;
					letter-spacing: 0;
					text-transform: uppercase;
					box-shadow: 7px 7px 0 rgba(0, 0, 0, 0.38);
				}

				.nf-ticket-a {
					top: 13%;
					left: 11%;
					background: #cffc54;
				}

				.nf-ticket-b {
					top: 20%;
					right: 8%;
					background: #22d3ee;
				}

				.nf-ticket-c {
					right: 15%;
					bottom: 23%;
					background: #ff5a4f;
				}

				.nf-ticket-d {
					bottom: 17%;
					left: 7%;
				}

				.nf-signal {
					position: relative;
					width: min(100%, 42rem);
					height: 0.7rem;
					margin: clamp(1.5rem, 4vw, 3rem) auto 1rem;
					overflow: hidden;
					background: rgba(248, 243, 231, 0.12);
				}

				.nf-signal-bar {
					position: absolute;
					top: 0;
					left: 0;
					width: 42%;
					height: 100%;
					background: linear-gradient(
						90deg,
						transparent,
						#cffc54 18%,
						#22d3ee 52%,
						#ff5a4f 88%,
						transparent
					);
				}

				.nf-caption {
					max-width: 38rem;
					margin: 0 auto;
					color: rgba(248, 243, 231, 0.66);
					font-size: clamp(0.9rem, 1.2vw, 1rem);
					text-align: center;
				}

				.nf-panel {
					display: flex;
					flex-direction: column;
					justify-content: flex-start;
					min-height: 0;
					padding: clamp(1.35rem, 3vw, 2rem);
					border: 1px solid rgba(248, 243, 231, 0.35);
					background: rgba(8, 9, 10, 0.74);
					backdrop-filter: blur(16px);
				}

				.nf-panel-label {
					width: max-content;
					margin-bottom: 0.75rem;
					padding: 0.35rem 0.62rem;
					background: #cffc54;
					color: #08090a;
					font-family: "Inter", system-ui, sans-serif;
					font-size: 0.74rem;
					font-weight: 700;
					text-transform: uppercase;
				}

				.nf-panel h1 {
					margin: 0;
					font-family: "Shippori Mincho", "Noto Serif JP", serif;
					font-size: clamp(1.85rem, 3.2vw, 3.1rem);
					font-weight: 700;
					line-height: 1.15;
					letter-spacing: 0;
				}

				.nf-panel p {
					margin: 0.75rem 0 0;
					color: rgba(248, 243, 231, 0.72);
					font-size: 1rem;
					line-height: 1.7;
				}

				.nf-actions {
					display: grid;
					grid-template-columns: repeat(2, minmax(0, 1fr));
					gap: 0.75rem;
					margin-top: 1rem;
				}

				.nf-action {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					min-height: 2.75rem;
					padding: 0.75rem 1rem;
					border: 1px solid rgba(248, 243, 231, 0.54);
					border-radius: 0;
					font-family: "Inter", system-ui, sans-serif;
					font-size: 0.95rem;
					font-weight: 700;
					line-height: 1.2;
					text-align: center;
					text-decoration: none;
					transition: transform 180ms ease, background 180ms ease, color 180ms ease, border-color 180ms ease;
				}

				.nf-action:hover {
					transform: translateY(-2px);
				}

				.nf-action-primary {
					background: #f8f3e7;
					color: #08090a;
				}

				.nf-action-secondary {
					background: transparent;
					color: #f8f3e7;
					cursor: pointer;
				}

				.nf-action-secondary:hover {
					border-color: #22d3ee;
					background: rgba(34, 211, 238, 0.12);
				}

				.nf-index {
					margin-top: 0.85rem;
					border-top: 1px solid rgba(248, 243, 231, 0.24);
				}

				.nf-index-row {
					display: grid;
					grid-template-columns: 3rem 1fr;
					gap: 0.9rem;
					align-items: center;
					padding: 0.65rem 0.2rem;
					border-bottom: 1px solid rgba(248, 243, 231, 0.16);
					color: inherit;
					text-decoration: none;
				}

				.nf-index-number {
					color: #22d3ee;
					font-family: "Inter", system-ui, sans-serif;
					font-weight: 700;
				}

				.nf-index-row strong,
				.nf-index-row small {
					display: block;
					letter-spacing: 0;
				}

				.nf-index-row strong {
					font-family: "Inter", system-ui, sans-serif;
					font-size: 1.04rem;
				}

				.nf-index-row small {
					margin-top: 0.2rem;
					color: rgba(248, 243, 231, 0.58);
					font-size: 0.78rem;
				}

				.nf-ticker {
					display: grid;
					grid-template-columns: repeat(4, minmax(0, 1fr));
					gap: 1px;
					margin-top: 1.5rem;
					border: 1px solid rgba(248, 243, 231, 0.28);
					background: rgba(248, 243, 231, 0.18);
				}

				.nf-ticker span {
					display: flex;
					min-height: 4.2rem;
					flex-direction: column;
					justify-content: center;
					padding: 0.85rem;
					background: rgba(8, 9, 10, 0.84);
					color: rgba(248, 243, 231, 0.7);
					line-height: 1.35;
				}

				.nf-ticker b {
					margin-bottom: 0.35rem;
					color: #ff5a4f;
				}

				.nf-ruler {
					position: absolute;
					left: 0;
					z-index: 0;
					display: flex;
					width: max-content;
					min-width: 200%;
					color: rgba(248, 243, 231, 0.18);
					white-space: nowrap;
					pointer-events: none;
				}

				.nf-ruler span {
					display: inline-block;
					padding-right: 2rem;
				}

				.nf-ruler-top {
					top: 1rem;
				}

				.nf-ruler-bottom {
					bottom: 1rem;
				}

				@keyframes nf-grid-drift {
					0% { background-position: 0 0, 0 0; }
					25% { background-position: 17px -8px, -10px 13px; }
					50% { background-position: -9px 14px, 12px -6px; }
					75% { background-position: 6px -11px, -14px 8px; }
					100% { background-position: 0 0, 0 0; }
				}

				@keyframes nf-scan-film {
					0% { background-position: 0 0; }
					100% { background-position: 0 12px; }
				}

				@keyframes nf-flicker {
					0%, 76%, 100% { opacity: 1; }
					78% { opacity: 0.15; }
					80% { opacity: 1; }
					84% { opacity: 0.45; }
					86% { opacity: 1; }
				}

				@keyframes nf-hero-jitter {
					0%, 90%, 100% { transform: translate(0, 0); }
					92% { transform: translate(-6px, 3px); }
					94% { transform: translate(8px, -4px); }
					96% { transform: translate(-3px, 2px); }
				}

				@keyframes nf-smash {
					0% { transform: translate(-18px, 8px) rotate(-1.2deg); filter: contrast(1.55) saturate(1.7); }
					25% { transform: translate(16px, -10px) rotate(1.1deg); }
					50% { transform: translate(-10px, 5px) rotate(-0.6deg); }
					75% { transform: translate(6px, -3px); }
					100% { transform: none; filter: none; }
				}

				@keyframes nf-shock-pulse {
					0%, 100% { opacity: 0.08; transform: scale(0.92); }
					30% { opacity: 0.32; transform: scale(1); }
					58% { opacity: 0.12; transform: scale(1.06); }
				}

				@keyframes nf-scan-bar {
					0% { transform: translateY(-110%); }
					100% { transform: translateY(110%); }
				}

				@keyframes nf-noise-shift {
					0% { transform: translate(0, 0); opacity: 0.12; }
					50% { transform: translate(-2%, 1.5%); opacity: 0.28; }
					100% { transform: translate(1.5%, -2%); opacity: 0.16; }
				}

				@keyframes nf-digit-tear {
					0%, 86%, 100% { clip-path: inset(0); transform: translate(0, 0) skewX(0); }
					88% { clip-path: inset(10% 0 58% 0); transform: translate(12px, -5px) skewX(16deg); }
					91% { clip-path: inset(46% 0 8% 0); transform: translate(-16px, 7px) skewX(-12deg); }
					94% { clip-path: inset(22% 0 30% 0); transform: translate(7px, -2px) skewX(7deg); }
				}

				@keyframes nf-rgb-r {
					0%, 70%, 100% { transform: translate(0, 0); }
					75% { transform: translate(8px, -3px); }
					85% { transform: translate(-6px, 2px); }
				}

				@keyframes nf-rgb-c {
					0%, 70%, 100% { transform: translate(0, 0); }
					78% { transform: translate(-9px, 3px); }
					88% { transform: translate(5px, -4px); }
				}

				@media (max-width: 960px) {
					.nf-layout {
						grid-template-columns: 1fr;
					}

					.nf-hero,
					.nf-panel {
						min-height: auto;
					}

					.nf-panel {
						padding: 1.3rem;
					}

					.nf-ticker {
						grid-template-columns: repeat(2, minmax(0, 1fr));
					}
				}

				@media (max-width: 620px) {
					.nf-shell {
						padding: 3.6rem 0.9rem;
					}

					.nf-masthead {
						grid-template-columns: 1fr;
						gap: 0.45rem;
					}

					.nf-masthead span:last-child {
						text-align: left;
					}

					.nf-hero {
						padding: 4rem 0.75rem 1.2rem;
						box-shadow: 9px 9px 0 #cffc54;
					}

					.nf-number {
						gap: 0.45rem;
					}

					.nf-digit {
						width: clamp(5.25rem, 28vw, 7rem);
						font-size: clamp(6rem, 31vw, 8rem);
					}

					.nf-ticket {
						min-width: auto;
						padding: 0.48rem 0.55rem;
						font-size: 0.68rem;
						box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.36);
					}

					.nf-ticket-a {
						top: 1rem;
						left: 0.85rem;
					}

					.nf-ticket-b {
						top: 1.25rem;
						right: 0.85rem;
					}

					.nf-ticket-c,
					.nf-ticket-d {
						display: none;
					}

					.nf-actions,
					.nf-ticker {
						grid-template-columns: 1fr;
					}

					.nf-index-row {
						grid-template-columns: 2.4rem 1fr;
					}
				}

				@media (prefers-reduced-motion: reduce) {
					.nf-shell::before,
					.nf-shell::after,
					.nf-flicker,
					.nf-hero,
					.nf-shock,
					.nf-scan,
					.nf-noise,
					.nf-digit-layer,
					.nf-digit-r,
					.nf-digit-c {
						animation: none;
					}

					.nf-action {
						transition: none;
					}

					.nf-action:hover {
						transform: none;
					}
				}
			`}</style>
		</main>
	);
}
