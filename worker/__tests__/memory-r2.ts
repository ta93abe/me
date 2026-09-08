type StoredObject = {
	body: Uint8Array;
	uploaded: Date;
	httpMetadata?: R2HTTPMetadata;
	customMetadata?: Record<string, string>;
};

async function toBytes(value: unknown): Promise<Uint8Array> {
	if (typeof value === "string") {
		return new TextEncoder().encode(value);
	}
	if (value instanceof Uint8Array) {
		return value;
	}
	if (value instanceof ArrayBuffer) {
		return new Uint8Array(value);
	}
	if (ArrayBuffer.isView(value)) {
		return new Uint8Array(
			value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength),
		);
	}
	if (value instanceof ReadableStream) {
		return new Uint8Array(await new Response(value).arrayBuffer());
	}
	if (value instanceof Blob) {
		return new Uint8Array(await value.arrayBuffer());
	}
	throw new Error("unsupported r2 put value in tests");
}

function asHttpMetadata(
	value: R2PutOptions["httpMetadata"],
): R2HTTPMetadata | undefined {
	if (!value || value instanceof Headers) {
		return undefined;
	}
	return value;
}

class MemoryR2Object {
	readonly key: string;
	readonly uploaded: Date;
	readonly size: number;
	readonly httpEtag: string;
	readonly httpMetadata?: R2HTTPMetadata;
	readonly customMetadata?: Record<string, string>;
	private readonly bytes: Uint8Array;

	constructor(key: string, stored: StoredObject) {
		this.key = key;
		this.bytes = stored.body;
		this.uploaded = stored.uploaded;
		this.size = stored.body.byteLength;
		this.httpEtag = `"${stored.body.byteLength}"`;
		this.httpMetadata = stored.httpMetadata;
		this.customMetadata = stored.customMetadata;
	}

	get body(): ReadableStream<Uint8Array> {
		const copy = Uint8Array.from(this.bytes);
		return new ReadableStream({
			start(controller) {
				controller.enqueue(copy);
				controller.close();
			},
		});
	}

	async text(): Promise<string> {
		return new TextDecoder().decode(this.bytes);
	}

	async json<T>(): Promise<T> {
		return JSON.parse(await this.text()) as T;
	}

	async arrayBuffer(): Promise<ArrayBuffer> {
		return this.bytes.slice().buffer as ArrayBuffer;
	}
}

export function createMemoryR2(): R2Bucket {
	const store = new Map<string, StoredObject>();

	return {
		async head(key: string) {
			const stored = store.get(key);
			return stored ? new MemoryR2Object(key, stored) : null;
		},
		async get(key: string) {
			const stored = store.get(key);
			return stored ? new MemoryR2Object(key, stored) : null;
		},
		async put(key: string, value: unknown, options?: R2PutOptions) {
			const body = await toBytes(value);
			const stored: StoredObject = {
				body,
				uploaded: new Date(),
				httpMetadata: asHttpMetadata(options?.httpMetadata),
				customMetadata: options?.customMetadata,
			};
			store.set(key, stored);
			return new MemoryR2Object(key, stored);
		},
		async delete(keys: string | string[]) {
			for (const key of Array.isArray(keys) ? keys : [keys]) {
				store.delete(key);
			}
		},
		async list(options?: R2ListOptions) {
			const prefix = options?.prefix ?? "";
			const keys = [...store.keys()]
				.filter((key) => key.startsWith(prefix))
				.toSorted();
			return {
				objects: keys.map((key) => new MemoryR2Object(key, store.get(key)!)),
				truncated: false,
				delimitedPrefixes: [],
			};
		},
	} as unknown as R2Bucket;
}

export function createContentEnv(
	overrides: Partial<{
		CONTENT: R2Bucket;
		IMAGES: R2Bucket;
		CONTENT_HMAC_SECRET: string;
		IMAGES_PUBLIC_ORIGIN: string;
	}> = {},
) {
	return {
		CONTENT: overrides.CONTENT ?? createMemoryR2(),
		IMAGES: overrides.IMAGES ?? createMemoryR2(),
		CONTENT_HMAC_SECRET: overrides.CONTENT_HMAC_SECRET ?? "test-hmac-secret",
		IMAGES_PUBLIC_ORIGIN:
			overrides.IMAGES_PUBLIC_ORIGIN ?? "https://images.ta93abe.com",
	};
}
