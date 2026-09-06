export type Gadget = {
	readonly slug: string;
	readonly name: string;
	readonly note: string;
	readonly image: string;
	readonly imageSource?: {
		readonly href: string;
		readonly label?: string;
	};
};

const gadgetImages = import.meta.glob<string>("../assets/gadgets/*.svg", {
	eager: true,
	query: "?url",
	import: "default",
});

function gadgetImage(slug: string): string {
	const match = Object.entries(gadgetImages).find(([key]) =>
		key.endsWith(`/${slug}.svg`),
	);
	const url = match?.[1];
	if (typeof url !== "string" || url.length === 0) {
		throw new Error(`Missing gadget image: ${slug}`);
	}
	return url;
}

const GADGET_ENTRIES = [
	{
		slug: "macbook-pro",
		name: "MacBook Pro",
		note: "Nix の土台。CLI は全部入れ直せる。GUI だけ Homebrew。",
	},
	{
		slug: "keyboard",
		name: "Keyboard",
		note: "いちばん長く触っているもの。打感が仕事のリズムになる。",
	},
	{
		slug: "headphones",
		name: "Headphones",
		note: "集中するときの蓋。音を置くときもここから出す。",
	},
	{
		slug: "sketchbook",
		name: "Sketchbook",
		note: "コードの前に線を引く。サイトに出す絵はだいたいここから。",
	},
	{
		slug: "fountain-pen",
		name: "Fountain Pen",
		note: "キーボードより遅い。だから残る。",
	},
	{
		slug: "camera",
		name: "Camera",
		note: "写真を置くための機械。上手く撮れた日だけ出す。",
	},
	{
		slug: "audio-interface",
		name: "Audio Interface",
		note: "音をファイルにする箱。置く前の入口。",
	},
	{
		slug: "notebook",
		name: "Notebook",
		note: "タスクも設計も、いったん紙に落とす。",
	},
] as const;

export const GADGETS: readonly Gadget[] = GADGET_ENTRIES.map((entry) => ({
	...entry,
	image: gadgetImage(entry.slug),
}));

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
