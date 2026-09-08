import type { FrontmatterValue } from "./frontmatter.ts";

export function toDate(value: unknown): Date | undefined {
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value;
	}
	if (typeof value === "string" && value.length > 0) {
		const parsed = new Date(value);
		if (!Number.isNaN(parsed.getTime())) {
			return parsed;
		}
	}
	return undefined;
}

export function hasDateValue(value: unknown): boolean {
	return toDate(value) !== undefined;
}

export function firstDateValue(...values: unknown[]): unknown {
	return values.find((value) => hasDateValue(value));
}

export function toIso(value: unknown): string | undefined {
	return toDate(value)?.toISOString();
}

export function publishDateValue(
	frontmatter: Record<string, unknown>,
): unknown {
	return firstDateValue(frontmatter.publish_date, frontmatter.date);
}

export function reviseDateValue(frontmatter: Record<string, unknown>): unknown {
	return firstDateValue(frontmatter.revise_date, frontmatter.updatedDate);
}

export function applyDateAliases(
	frontmatter: Record<string, FrontmatterValue>,
): Record<string, FrontmatterValue> {
	const next: Record<string, FrontmatterValue> = { ...frontmatter };
	const publish = firstDateValue(next.publish_date, next.date);
	const revise = firstDateValue(next.revise_date, next.updatedDate);
	if (hasDateValue(publish)) {
		next.publish_date = publish as FrontmatterValue;
	}
	if (hasDateValue(revise)) {
		next.revise_date = revise as FrontmatterValue;
	}
	return next;
}
