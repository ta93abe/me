/**
 * Calculate reading time for content
 * @param content - The text content to analyze
 * @param wordsPerMinute - Reading speed (default: 400 for Japanese)
 * @returns Reading time in minutes
 */
export const getReadingTime = (
	content: string,
	wordsPerMinute = 400,
): number => {
	// For Japanese text, count characters instead of words
	// Remove HTML tags, code blocks, and whitespace
	const cleanContent = content
		.replace(/<[^>]*>/g, "") // Remove HTML tags
		.replace(/```[\s\S]*?```/g, "") // Remove code blocks
		.replace(/`[^`]*`/g, "") // Remove inline code
		.replace(/\s+/g, ""); // Remove whitespace

	// Calculate based on character count for Japanese
	const characters = cleanContent.length;
	const minutes = Math.ceil(characters / wordsPerMinute);

	return Math.max(1, minutes);
};

/**
 * Format reading time as a string
 * @param minutes - Reading time in minutes
 * @returns Formatted string like "約3分で読了"
 */
export const formatReadingTime = (minutes: number): string => {
	return `約${minutes}分で読了`;
};
