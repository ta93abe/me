import { motion, useReducedMotion } from "framer-motion";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { NavLink } from "@/config/navigation";

const ease = [0.22, 1, 0.36, 1] as const;
const EXIT_MS = 240;

type Props = {
	links: readonly NavLink[];
	currentPath: string;
};

function isActivePath(href: string, currentPath: string): boolean {
	if (href === "/") return currentPath === "/";
	return currentPath.startsWith(href);
}

export default function MobileNav({ links, currentPath }: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const prefersReducedMotion = useReducedMotion();
	const dialogRef = useRef<HTMLDialogElement>(null);
	const openButtonRef = useRef<HTMLButtonElement>(null);
	const closingRef = useRef(false);

	const syncHeader = useCallback((open: boolean) => {
		const header = document.querySelector("header");
		if (!header) return;
		if (open) {
			header.setAttribute("data-menu-open", "");
		} else {
			header.removeAttribute("data-menu-open");
		}
	}, []);

	const openMenu = useCallback(() => {
		const dialog = dialogRef.current;
		if (!dialog || dialog.open) return;
		closingRef.current = false;
		dialog.showModal();
		setIsOpen(true);
		syncHeader(true);
	}, [syncHeader]);

	const closeMenu = useCallback(() => {
		const dialog = dialogRef.current;
		if (!dialog?.open || closingRef.current) return;

		closingRef.current = true;
		setIsOpen(false);
		syncHeader(false);

		const delay = prefersReducedMotion ? 0 : EXIT_MS;
		window.setTimeout(() => {
			if (dialog.open) {
				dialog.close();
			}
			closingRef.current = false;
			openButtonRef.current?.focus();
		}, delay);
	}, [prefersReducedMotion, syncHeader]);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;

		const onCancel = (event: Event) => {
			event.preventDefault();
			closeMenu();
		};

		const onClose = () => {
			setIsOpen(false);
			syncHeader(false);
			closingRef.current = false;
		};

		dialog.addEventListener("cancel", onCancel);
		dialog.addEventListener("close", onClose);
		return () => {
			dialog.removeEventListener("cancel", onCancel);
			dialog.removeEventListener("close", onClose);
		};
	}, [closeMenu, syncHeader]);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(min-width: 768px)");
		const onViewportChange = () => {
			if (mediaQuery.matches && dialogRef.current?.open) {
				closeMenu();
			}
		};
		mediaQuery.addEventListener("change", onViewportChange);
		return () => mediaQuery.removeEventListener("change", onViewportChange);
	}, [closeMenu]);

	useEffect(() => {
		return () => {
			document.querySelector("header")?.removeAttribute("data-menu-open");
		};
	}, []);

	const listVariants = prefersReducedMotion
		? undefined
		: {
				open: {
					transition: { staggerChildren: 0.055, delayChildren: 0.04 },
				},
				closed: {
					transition: { staggerChildren: 0.03, staggerDirection: -1 },
				},
			};

	const itemVariants = prefersReducedMotion
		? undefined
		: {
				open: {
					opacity: 1,
					x: 0,
					transition: { duration: 0.42, ease },
				},
				closed: {
					opacity: 0,
					x: 36,
					transition: { duration: 0.22, ease },
				},
			};

	return (
		<div className="md:hidden">
			<button
				ref={openButtonRef}
				type="button"
				className="flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-(--bg-secondary)"
				aria-label="メニューを開く"
				aria-haspopup="dialog"
				aria-expanded={isOpen}
				onClick={openMenu}
			>
				<svg
					className="h-5 w-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			</button>

			<dialog
				ref={dialogRef}
				className="mobile-nav-dialog m-0 h-dvh max-h-dvh w-full max-w-none border-0 bg-(--bg-primary) p-0 text-(--text-primary)"
				aria-label="メニュー"
			>
				<div className="flex h-(--header-height) items-center justify-end px-6">
					<button
						type="button"
						className="flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-(--bg-secondary)"
						aria-label="メニューを閉じる"
						onClick={closeMenu}
					>
						<svg
							className="h-5 w-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<nav aria-label="モバイルナビゲーション">
					<motion.ul
						className="space-y-1 px-6 py-4"
						initial="closed"
						animate={isOpen ? "open" : "closed"}
						variants={listVariants}
					>
						{links.map((link) => {
							const active = isActivePath(link.href, currentPath);
							return (
								<motion.li key={link.href} variants={itemVariants}>
									<a
										href={link.href}
										aria-current={active ? "page" : undefined}
										className={[
											"block rounded-lg px-4 py-3 text-lg font-medium transition-colors duration-200 hover:bg-(--bg-secondary) hover:text-(--text-primary)",
											active
												? "font-semibold text-(--text-primary)"
												: "text-(--text-secondary)",
										].join(" ")}
									>
										{link.text}
									</a>
								</motion.li>
							);
						})}
					</motion.ul>
				</nav>
			</dialog>

			<style>{`
				.mobile-nav-dialog {
					border: none;
					outline: none;
					box-shadow: none;
				}

				.mobile-nav-dialog[open] {
					display: flex;
					flex-direction: column;
				}

				.mobile-nav-dialog::backdrop {
					background: rgb(28 27 25 / 0.28);
				}

				@media (prefers-reduced-motion: no-preference) {
					.mobile-nav-dialog[open]::backdrop {
						animation: mobile-nav-backdrop-in 0.2s cubic-bezier(0.22, 1, 0.36, 1) both;
					}
				}

				@keyframes mobile-nav-backdrop-in {
					from {
						opacity: 0;
					}
					to {
						opacity: 1;
					}
				}
			`}</style>
		</div>
	);
}
