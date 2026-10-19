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
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return;
		}

		const now = Date.now();
		setSmashing(true);
		setFaces([pickGlyph(now), pickGlyph(now + 3), pickGlyph(now + 7)]);
		setSmashTick((tick) => tick + 1);
	}, []);

	return (
		<main className="nf-shell" aria-labelledby={titleId}>
			<div className="nf-ruler nf-ruler-top" aria-hidden="true">
				<span>404 / missing folio / 404 / misplaced page /</span>
				<span>404 / missing folio / 404 / misplaced page /</span>
			</div>

			<section className="nf-stage" aria-label="404 playground">
				<div className="nf-masthead">
					<span>TA93ABE.COM</span>
					<span className="nf-flicker">Issue 404</span>
					<span>Broken route special</span>
				</div>

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

						{floatingLabels.map((item) => (
							<span
								key={item.text}
								className={item.className}
								aria-hidden="true"
							>
								{item.text}
							</span>
						))}

						<div className="nf-number" aria-hidden="true">
							{displayDigits.map((digit, index) => (
								<button
									key={digit.id}
									type="button"
									className={`nf-digit-hit nf-digit-hit-${index + 1}`}
									tabIndex={-1}
									onClick={smash}
								>
									<span className={`nf-digit nf-digit-${index + 1}`}>
										<span className="nf-digit-layer">
											<span className="nf-digit-ghost nf-digit-r">
												{faces[index]}
											</span>
											<span className="nf-digit-ghost nf-digit-c">
												{faces[index]}
											</span>
											<span className="nf-digit-face">{faces[index]}</span>
										</span>
									</span>
								</button>
							))}
						</div>

						<div className="nf-signal" aria-hidden="true">
							<span className="nf-signal-bar" />
						</div>
						<p className="nf-caption">
							The requested page stepped out of the layout grid.
						</p>
					</section>

					<section className="nf-panel">
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
								<a
									key={link.href}
									href={link.href}
									className="nf-index-row"
									aria-label={link.label}
								>
									<span className="nf-index-number">
										{String(index + 1).padStart(2, "0")}
									</span>
									<span>
										<strong>{link.label}</strong>
										<small>{link.meta}</small>
									</span>
								</a>
							))}
						</nav>
					</section>
				</div>

				<aside className="nf-ticker" aria-label="Route diagnostics">
					{fieldNotes.map((note, index) => (
						<span key={note}>
							<b>{String(index + 1).padStart(2, "0")}</b>
							{note}
						</span>
					))}
				</aside>
			</section>

			<div className="nf-ruler nf-ruler-bottom" aria-hidden="true">
				<span>return home / recalibrate / open archive /</span>
				<span>return home / recalibrate / open archive /</span>
			</div>
		</main>
	);
}
