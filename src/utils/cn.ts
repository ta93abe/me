import { twMerge } from "tailwind-merge";

export const cn = (...classNames: Parameters<typeof twMerge>): string =>
	twMerge(...classNames);
