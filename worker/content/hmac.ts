const CLOCK_SKEW_SECONDS = 300;
const SIGNATURE_PREFIX = "HMAC-SHA256 ";

export type HmacVerifyResult =
	| { ok: true }
	| { ok: false; status: 401; error: string };

function timingSafeEqualBytes(left: Uint8Array, right: Uint8Array): boolean {
	if (left.byteLength !== right.byteLength) {
		return false;
	}

	let mismatch = 0;
	for (let index = 0; index < left.byteLength; index += 1) {
		mismatch |= left[index] ^ right[index];
	}
	return mismatch === 0;
}

function bytesToHex(bytes: Uint8Array): string {
	return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array | null {
	if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) {
		return null;
	}

	const bytes = new Uint8Array(hex.length / 2);
	for (let index = 0; index < bytes.length; index += 1) {
		bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
	}
	return bytes;
}

export function canonicalHmacBytes(
	timestamp: string,
	pathname: string,
	body: Uint8Array,
): Uint8Array {
	const prefix = new TextEncoder().encode(`${timestamp}${pathname}`);
	const bytes = new Uint8Array(prefix.byteLength + body.byteLength);
	bytes.set(prefix, 0);
	bytes.set(body, prefix.byteLength);
	return bytes;
}

export async function signContentRequest(
	secret: string,
	timestamp: string,
	pathname: string,
	body: string | Uint8Array,
): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const payload =
		typeof body === "string"
			? canonicalHmacBytes(timestamp, pathname, new TextEncoder().encode(body))
			: canonicalHmacBytes(timestamp, pathname, body);
	const signature = await crypto.subtle.sign(
		"HMAC",
		key,
		payload.slice().buffer as ArrayBuffer,
	);
	return bytesToHex(new Uint8Array(signature));
}

export function readTimestampHeader(headers: Headers): string | null {
	return headers.get("X-Content-Timestamp") ?? headers.get("X-Timestamp");
}

export function readSignatureHeader(headers: Headers): string | null {
	const dedicated = headers.get("X-Content-Signature");
	if (dedicated) {
		return dedicated.trim().toLowerCase();
	}

	const authorization = headers.get("Authorization");
	if (authorization?.startsWith(SIGNATURE_PREFIX)) {
		return authorization.slice(SIGNATURE_PREFIX.length).trim().toLowerCase();
	}

	return null;
}

export async function verifyContentHmac(options: {
	secret: string;
	pathname: string;
	body: string | Uint8Array;
	headers: Headers;
	nowSeconds?: number;
}): Promise<HmacVerifyResult> {
	if (!options.secret) {
		return {
			ok: false,
			status: 401,
			error: "content hmac secret is not configured",
		};
	}

	const timestamp = readTimestampHeader(options.headers);
	const signature = readSignatureHeader(options.headers);
	if (!timestamp || !signature) {
		return {
			ok: false,
			status: 401,
			error: "missing X-Content-Timestamp or HMAC signature",
		};
	}

	if (!/^\d+$/.test(timestamp)) {
		return { ok: false, status: 401, error: "timestamp must be unix seconds" };
	}

	const now = options.nowSeconds ?? Math.floor(Date.now() / 1000);
	const age = Math.abs(now - Number(timestamp));
	if (age > CLOCK_SKEW_SECONDS) {
		return {
			ok: false,
			status: 401,
			error: "timestamp is outside the 5 minute window",
		};
	}

	const expected = await signContentRequest(
		options.secret,
		timestamp,
		options.pathname,
		options.body,
	);
	const expectedBytes = hexToBytes(expected);
	const providedBytes = hexToBytes(signature);
	if (
		!expectedBytes ||
		!providedBytes ||
		!timingSafeEqualBytes(expectedBytes, providedBytes)
	) {
		return { ok: false, status: 401, error: "invalid hmac signature" };
	}

	return { ok: true };
}
