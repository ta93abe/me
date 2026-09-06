export type Thing = {
	readonly slug: string;
	readonly name: string;
	readonly note: string;
	readonly image: string;
	readonly imageSource?: {
		readonly href: string;
		readonly label?: string;
	};
};

export const THINGS: readonly Thing[] = [
	{
		slug: "macbook-pro",
		name: "MacBook Pro",
		note: "Nix の土台。CLI は全部入れ直せる。GUI だけ Homebrew。",
		image: "/things/macbook-pro.svg",
	},
	{
		slug: "keyboard",
		name: "Keyboard",
		note: "いちばん長く触っているもの。打感が仕事のリズムになる。",
		image: "/things/keyboard.svg",
	},
	{
		slug: "headphones",
		name: "Headphones",
		note: "集中するときの蓋。音を置くときもここから出す。",
		image: "/things/headphones.svg",
	},
	{
		slug: "sketchbook",
		name: "Sketchbook",
		note: "コードの前に線を引く。サイトに出す絵はだいたいここから。",
		image: "/things/sketchbook.svg",
	},
	{
		slug: "fountain-pen",
		name: "Fountain Pen",
		note: "キーボードより遅い。だから残る。",
		image: "/things/fountain-pen.svg",
	},
	{
		slug: "camera",
		name: "Camera",
		note: "写真を置くための機械。上手く撮れた日だけ出す。",
		image: "/things/camera.svg",
	},
	{
		slug: "audio-interface",
		name: "Audio Interface",
		note: "音をファイルにする箱。置く前の入口。",
		image: "/things/audio-interface.svg",
	},
	{
		slug: "notebook",
		name: "Notebook",
		note: "タスクも設計も、いったん紙に落とす。",
		image: "/things/notebook.svg",
	},
];

const thingsBySlug = new Map(THINGS.map((thing) => [thing.slug, thing]));

export function getThing(slug: string): Thing | undefined {
	return thingsBySlug.get(slug);
}

export function thingPath(slug: string): string {
	return `/things/${slug}`;
}

export function thingViewTransitionName(slug: string): string {
	return `thing-${slug}`;
}

export function thingSlugFromPath(pathname: string): string | null {
	const match = pathname.replace(/\/+$/, "").match(/^\/things\/([^/]+)$/);
	return match?.[1] ?? null;
}

export function isThingsIndexPath(pathname: string): boolean {
	return pathname.replace(/\/+$/, "") === "/things";
}
