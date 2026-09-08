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
		imageSource: {
			href: "https://commons.wikimedia.org/wiki/File:Mac_Studio_(2022)_front.jpg",
			label: "Yasu / CC BY-SA 3.0",
		},
	},
	{
		slug: "hhkb-type-s",
		name: "HHKB Type-S",
		note: "いちばん長く触っているもの。静かな打感が仕事のリズムになる。",
		imageSource: {
			href: "https://happyhackingkb.com/jp/products/hybrid_types/",
			label: "PFU HHKB",
		},
	},
	{
		slug: "shure-sm7b",
		name: "Shure SM7B",
		note: "声を置くためのマイク。近づいて話す。",
		imageSource: {
			href: "https://www.shure.com/en-US/products/microphones/sm7b",
			label: "Shure",
		},
	},
	{
		slug: "volt-276",
		name: "Volt 276",
		note: "音をファイルにする箱。コンプもここ。",
		imageSource: {
			href: "https://www.uaudio.com/products/volt-276-usb-audio-interface",
			label: "Universal Audio",
		},
	},
	{
		slug: "philips-hue",
		name: "Philips Hue",
		note: "部屋の明るさを変える。仕事と休みの境目。",
		imageSource: {
			href: "https://www.philips-hue.com/en-us/p/hue-white-and-color-ambiance-60w-a19-e26-1p-nam-rtp/046677590826",
			label: "Philips Hue",
		},
	},
	{
		slug: "nature-remo-lapis",
		name: "Nature Remo Lapis",
		note: "家電のリモコンを一つに。出先からも。",
		imageSource: {
			href: "https://shop.nature.global/products/nature-remo-lapis",
			label: "Nature",
		},
	},
	{
		slug: "novation-launchkey-49",
		name: "Novation Launchkey 49",
		note: "鍵盤でアイデアを置く。",
		imageSource: {
			href: "https://novationmusic.com/products/launchkey-49",
			label: "Novation",
		},
	},
	{
		slug: "novation-launchpad-pro",
		name: "Novation Launchpad Pro",
		note: "パッドでリズムを置く。",
		imageSource: {
			href: "https://novationmusic.com/products/launchpad-pro",
			label: "Novation",
		},
	},
	{
		slug: "sony-mdr-7506",
		name: "Sony MDR-7506",
		note: "集中するときの蓋。音を置くときもここから出す。",
		imageSource: {
			href: "https://commons.wikimedia.org/wiki/File:Sony_MDR-7506_7615.jpg",
			label: "Ashley Pomeroy / CC BY 4.0",
		},
	},
	{
		slug: "oura-ring-5",
		name: "Oura Ring 5",
		note: "睡眠と回復を見る。朝いちばんに数字を見る。",
		imageSource: {
			href: "https://ouraring.com/blog/introducing-oura-ring-5/",
			label: "Oura",
		},
	},
	{
		slug: "pebble-index-01",
		name: "Pebble Index 01",
		note: "思いついたら指で押す。忘れる前に置く。",
		imageSource: {
			href: "https://repebble.com/index01",
			label: "Pebble",
		},
	},
	{
		slug: "evering",
		name: "Evering",
		note: "改札は指で通る。財布を出さない。",
		imageSource: {
			href: "https://evering.jp/products/evering",
			label: "Evering",
		},
	},
	{
		slug: "eufy-omni-e25",
		name: "Eufy Robot Vacuum Omni E25",
		note: "床はこれに任せる。",
		imageSource: {
			href: "https://www.ankerjapan.com/products/t2353",
			label: "Anker Japan",
		},
	},
	{
		slug: "holo-orb-l-x-pac",
		name: "holo オーブ L X-PAC",
		note: "山に行くときの袋。30L で足りる。",
		imageSource: {
			href: "https://checkout.store.yamap.com/products/holo-yamap-orb-l-24fw",
			label: "YAMAP Store",
		},
	},
	{
		slug: "nike-acg-zegama",
		name: "Nike ACG ゼガマ ハイク",
		note: "歩くための靴。",
		imageSource: {
			href: "https://www.nike.com/t/acg-zegama-hike-mens-hiking-shoes-6qcazrJu/IO7854-100",
			label: "Nike",
		},
	},
	{
		slug: "milestone-ms-i1",
		name: "milestone MS-i1",
		note: "夜道と山の灯り。",
		imageSource: {
			href: "https://store.runtrip.jp/products/milestone-headlamp-ms-i1-endurance-model",
			label: "Runtrip Store",
		},
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
