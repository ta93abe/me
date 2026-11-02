/** HTML の robots メタに noindex があるか。属性順の両方を見る。 */
export function htmlHasNoindex(html: string): boolean {
	return (
		/<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*\bnoindex\b/i.test(
			html,
		) ||
		/<meta\b[^>]*\bcontent=["'][^"']*\bnoindex\b[^"']*["'][^>]*\bname=["']robots["']/i.test(
			html,
		)
	);
}
