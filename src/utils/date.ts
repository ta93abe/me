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
