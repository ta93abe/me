import { motion, useReducedMotion } from "framer-motion";
import * as React from "react";

const quickLinks = [
	{ href: "/", label: "Home", meta: "Front cover" },
	{ href: "/works/", label: "Works", meta: "Selected archive" },
	{ href: "/blog/", label: "Blog", meta: "Field notes" },
	{ href: "/links/", label: "Links", meta: "Elsewhere" },
];

const fieldNotes = [
	"Route slipped between the columns",
	"Margin marks are still blinking",
	"Index says: try another doorway",
	"Signal recovered near /works/",
];

const floatingLabels = [
	{ text: "NO SIGNAL", className: "nf-ticket nf-ticket-a" },
	{ text: "TRY /BLOG", className: "nf-ticket nf-ticket-b" },
	{ text: "LOST LINK", className: "nf-ticket nf-ticket-c" },
	{ text: "PAGE DRIFT", className: "nf-ticket nf-ticket-d" },
];

const displayDigits = [
	{ id: "first-four", value: "4" },
	{ id: "zero", value: "0" },
	{ id: "last-four", value: "4" },
];

const smoothEase = [0.22, 1, 0.36, 1] as const;
const loopEase = "easeInOut" as const;
const linearEase = "linear" as const;

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

export default function NotFoundPlayground() {
	const prefersReducedMotion = useReducedMotion();
	const titleId = React.useId();

	const entrance = prefersReducedMotion
		? {}
		: {
				initial: false,
				animate: { opacity: 1, y: 0 },
				transition: { duration: 0.72, ease: smoothEase },
			};

	const digitMotion = (index: number) =>
		prefersReducedMotion
			? {}
			: {
					animate: {
						y: [0, -16 - index * 4, 0],
						rotate: [0, index % 2 === 0 ? 1.5 : -1.5, 0],
					},
					transition: {
						duration: 4.8 + index * 0.5,
						delay: index * 0.22,
						ease: loopEase,
						repeat: Infinity,
					},
				};

	const ticketMotion = (index: number) =>
		prefersReducedMotion
			? {}
			: {
					animate: {
						x: [0, index % 2 === 0 ? 12 : -12, 0],
						y: [0, index % 2 === 0 ? -18 : 18, 0],
						rotate: [
							index % 2 === 0 ? -4 : 4,
							index % 2 === 0 ? 5 : -5,
							index % 2 === 0 ? -4 : 4,
						],
					},
					transition: {
						duration: 6.4 + index,
						delay: index * 0.35,
						ease: loopEase,
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
								duration: 18,
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
					<span>Issue 404</span>
					<span>Broken route special</span>
				</motion.div>

				<div className="nf-layout">
					<section className="nf-hero" aria-label="404 animated poster">
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
								<motion.span
									key={digit.id}
									className={`nf-digit nf-digit-${index + 1}`}
									{...digitMotion(index)}
									whileHover={
										prefersReducedMotion
											? undefined
											: { rotate: index === 1 ? 8 : -8, scale: 1.04 }
									}
									whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
								>
									{digit.value}
								</motion.span>
							))}
						</div>

						<motion.div
							className="nf-signal"
							aria-hidden="true"
							{...(prefersReducedMotion
								? {}
								: {
										animate: { scaleX: [0.7, 1, 0.78] },
										transition: {
											duration: 2.8,
											ease: loopEase,
											repeat: Infinity,
										},
									})}
						/>
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

						<nav className="nf-index" aria-label="Main sections">
							{quickLinks.map((link, index) => (
								<motion.a
									key={link.href}
									href={link.href}
									className="nf-index-row"
									initial={false}
									animate={
										prefersReducedMotion ? undefined : { opacity: 1, x: 0 }
									}
									transition={
										prefersReducedMotion
											? undefined
											: {
													delay: 0.42 + index * 0.08,
													duration: 0.5,
													ease: smoothEase,
												}
									}
									whileHover={
										prefersReducedMotion
											? undefined
											: { x: 8, backgroundColor: "rgba(255, 255, 255, 0.08)" }
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
								initial: false,
								animate: { opacity: 1, y: 0 },
								transition: { delay: 0.25, duration: 0.6 },
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
								duration: 22,
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
					min-height: 100svh;
					overflow: hidden;
					padding: clamp(3.25rem, 7vw, 6rem) clamp(1rem, 4vw, 4rem);
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
				}

				.nf-shell::after {
					position: absolute;
					inset: 0;
					z-index: -1;
					content: "";
					background-image: repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 5px);
					opacity: 0.18;
					pointer-events: none;
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

				.nf-layout {
					display: grid;
					grid-template-columns: minmax(0, 1.28fr) minmax(21rem, 0.72fr);
					gap: clamp(1.25rem, 3vw, 2.5rem);
					align-items: stretch;
					margin-top: clamp(1.5rem, 3vw, 2.25rem);
				}

				.nf-hero {
					position: relative;
					display: flex;
					min-height: clamp(33rem, 56vw, 43rem);
					flex-direction: column;
					justify-content: center;
					padding: clamp(1.5rem, 4vw, 3rem);
					border: 2px solid rgba(248, 243, 231, 0.88);
					background:
						linear-gradient(125deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 52%),
						linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015));
					box-shadow: 18px 18px 0 #cffc54;
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
					width: min(100%, 42rem);
					height: 0.7rem;
					margin: clamp(1.5rem, 4vw, 3rem) auto 1rem;
					transform-origin: left center;
					background:
						linear-gradient(90deg, transparent 0 4%, #cffc54 4% 18%, transparent 18% 23%, #22d3ee 23% 48%, transparent 48% 55%, #ff5a4f 55% 100%);
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
					justify-content: center;
					min-height: clamp(33rem, 56vw, 43rem);
					padding: clamp(1.35rem, 3vw, 2rem);
					border: 1px solid rgba(248, 243, 231, 0.35);
					background: rgba(8, 9, 10, 0.74);
					backdrop-filter: blur(16px);
				}

				.nf-panel-label {
					width: max-content;
					margin-bottom: 1.25rem;
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
					font-size: clamp(2.6rem, 4.8vw, 5.2rem);
					font-weight: 700;
					line-height: 1.05;
					letter-spacing: 0;
				}

				.nf-panel p {
					margin: 1.2rem 0 0;
					color: rgba(248, 243, 231, 0.72);
					font-size: 1rem;
					line-height: 1.85;
				}

				.nf-actions {
					display: grid;
					grid-template-columns: repeat(2, minmax(0, 1fr));
					gap: 0.75rem;
					margin-top: 1.65rem;
				}

				.nf-action {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					min-height: 3.2rem;
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
					margin-top: 1.5rem;
					border-top: 1px solid rgba(248, 243, 231, 0.24);
				}

				.nf-index-row {
					display: grid;
					grid-template-columns: 3rem 1fr;
					gap: 0.9rem;
					align-items: center;
					padding: 1rem 0.2rem;
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
