#!/usr/bin/env bash
set -euo pipefail

ORIGIN="${ORIGIN:-http://127.0.0.1:8787}"
SECRET="${CONTENT_HMAC_SECRET:?set CONTENT_HMAC_SECRET}"
COLLECTION="${1:-blog}"
SLUG="${2:-hello}"
ACTION="${3:-put}"
PATHNAME="/api/content/${COLLECTION}/${SLUG}"

BODY="${BODY:----
title: Hello Workers
excerpt: Stage 1 note
date: 2026-08-30
---

Published from curl.
}"

sign() {
	local pathname="$1"
	local body="$2"
	local ts
	ts="$(date +%s)"
	local sig
	sig="$(
		TS="$ts" PATHNAME="$pathname" BODY="$body" CONTENT_HMAC_SECRET="$SECRET" python3 - <<'PY'
import hashlib, hmac, os
secret = os.environ["CONTENT_HMAC_SECRET"].encode()
message = (os.environ["TS"] + os.environ["PATHNAME"] + os.environ["BODY"]).encode()
print(hmac.new(secret, message, hashlib.sha256).hexdigest())
PY
	)"
	printf '%s %s\n' "$ts" "$sig"
}

case "$ACTION" in
put)
	read -r TS SIG < <(sign "$PATHNAME" "$BODY")
	curl -sS -X PUT "${ORIGIN}${PATHNAME}" \
		-H "X-Content-Timestamp: ${TS}" \
		-H "X-Content-Signature: ${SIG}" \
		--data-binary "$BODY"
	printf '\n'
	;;
get)
	curl -sS "${ORIGIN}${PATHNAME}"
	printf '\n'
	;;
index)
	curl -sS "${ORIGIN}/api/content/index/${COLLECTION}"
	printf '\n'
	;;
schema)
	curl -sS "${ORIGIN}/api/content/schema"
	printf '\n'
	;;
delete)
	read -r TS SIG < <(sign "$PATHNAME" "")
	curl -sS -X DELETE "${ORIGIN}${PATHNAME}" \
		-H "X-Content-Timestamp: ${TS}" \
		-H "X-Content-Signature: ${SIG}"
	printf '\n'
	;;
*)
	echo "usage: $0 [collection] [slug] [put|get|index|schema|delete]" >&2
	exit 1
	;;
esac
