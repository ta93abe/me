export type Gadget = {
	readonly slug: string;
	readonly name: string;
	readonly note: string;
	readonly imageSource?: {
		readonly href: string;
		readonly label?: string;
	};
};

export const GADGETS: readonly Gadget[] = [
	{
		slug: "mac-studio",
		name: "Mac Studio M1 Max",
		note: "Nix の土台。据え置きのまま。CLI は全部入れ直せる。",
	},
	{
		slug: "hhkb-type-s",
		name: "HHKB Type-S",
		note: "いちばん長く触っているもの。静かな打感が仕事のリズムになる。",
	},
	{
		slug: "shure-sm7b",
		name: "Shure SM7B",
		note: "声を置くためのマイク。近づいて話す。",
	},
	{
		slug: "volt-276",
		name: "Volt 276",
		note: "音をファイルにする箱。コンプもここ。",
	},
	{
		slug: "philips-hue",
		name: "Philips Hue",
		note: "部屋の明るさを変える。仕事と休みの境目。",
	},
	{
		slug: "nature-remo-lapis",
		name: "Nature Remo Lapis",
		note: "家電のリモコンを一つに。出先からも。",
	},
	{
		slug: "novation-launchkey-49",
		name: "Novation Launchkey 49",
		note: "鍵盤でアイデアを置く。",
	},
	{
		slug: "novation-launchpad-pro",
		name: "Novation Launchpad Pro",
		note: "パッドでリズムを置く。",
	},
	{
		slug: "sony-mdr-7506",
		name: "Sony MDR-7506",
		note: "集中するときの蓋。音を置くときもここから出す。",
	},
	{
		slug: "oura-ring-5",
		name: "Oura Ring 5",
		note: "睡眠と回復を見る。朝いちばんに数字を見る。",
	},
	{
		slug: "pebble-index-01",
		name: "Pebble Index 01",
		note: "思いついたら指で押す。忘れる前に置く。",
	},
	{
		slug: "evering",
		name: "Evering",
		note: "改札は指で通る。財布を出さない。",
	},
	{
		slug: "eufy-omni-e25",
		name: "Eufy Robot Vacuum Omni E25",
		note: "床はこれに任せる。",
	},
	{
		slug: "holo-orb-l-x-pac",
		name: "holo オーブ L X-PAC",
		note: "山に行くときの袋。30L で足りる。",
	},
	{
		slug: "nike-acg-zegama",
		name: "Nike ACG ゼガマ ハイク",
		note: "歩くための靴。",
	},
	{
		slug: "milestone-ms-i1",
		name: "milestone MS-i1",
		note: "夜道と山の灯り。",
	},
];

const gadgetsBySlug = new Map(GADGETS.map((gadget) => [gadget.slug, gadget]));

export function getGadget(slug: string): Gadget | undefined {
	return gadgetsBySlug.get(slug);
}

export function gadgetPath(slug: string): string {
	return `/gadgets/${slug}`;
}

export function gadgetViewTransitionName(slug: string): string {
	return `gadget-${slug}`;
}

export function gadgetSlugFromPath(pathname: string): string | null {
	const match = pathname.replace(/\/+$/, "").match(/^\/gadgets\/([^/]+)$/);
	return match?.[1] ?? null;
}

export function isGadgetsIndexPath(pathname: string): boolean {
	return pathname.replace(/\/+$/, "") === "/gadgets";
}
