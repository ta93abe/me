/**
 * 日付を日本語形式でフォーマットする
 */
export const formatDate = (
	date: Date | string,
	options: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "long",
		day: "numeric",
	},
): string => {
	const dateObj = typeof date === "string" ? new Date(date) : date;
	return new Intl.DateTimeFormat("ja-JP", options).format(dateObj);
};

/**
 * `<time datetime>` と JSON-LD の datePublished / dateModified 用の ISO-8601。
 */
export const toDatetimeAttr = (date: Date | string): string => {
	const dateObj = typeof date === "string" ? new Date(date) : date;
	return dateObj.toISOString();
};

const calendarDayInJst = (date: Date): string =>
	new Intl.DateTimeFormat("ja-JP", {
		timeZone: "Asia/Tokyo",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);

/** 公開日と更新日が同じ暦日（JST）なら更新日は UI に出さない。 */
export const isSameCalendarDayInJst = (a: Date, b: Date): boolean =>
	calendarDayInJst(a) === calendarDayInJst(b);

/**
 * ブログ一覧・記事・関連記事などユーザー向けの日付 1 行。
 * 更新日は公開日と暦日が異なるときだけ括弧付きで付ける。
 */
export const formatBlogSurfaceDate = (publish: Date, revise?: Date): string => {
	if (!revise || isSameCalendarDayInJst(publish, revise)) {
		return formatDate(publish);
	}
	return `${formatDate(publish)}（${formatDate(revise)}更新）`;
};
