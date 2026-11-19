export type SlideDeckGroup = {
	readonly id: string;
	readonly title: string;
	readonly description: string;
	/** 表示順（シリーズ内の読む順） */
	readonly slugs: readonly string[];
};

/**
 * `/slides` 一覧でネスト表示するデッキ系列。frontmatter の breaking change は避け、
 * ここで slug の所属と順序だけを宣言する。
 */
export const SLIDE_DECK_GROUPS: readonly SlideDeckGroup[] = [
	{
		id: "snowflake-ops",
		title: "Snowflake 運用シリーズ",
		description:
			"ClickOps の限界、dbt との役割分担、観測で外側を閉じる — 全3回を読む順に並べています。",
		slugs: [
			"snowflake-clickops-limits",
			"snowflake-dbt",
			"snowflake-observability",
		],
	},
] as const;
