#!/usr/bin/env bash
#
# Banana Stand — mint an image via the authenticated JSON API and print its
# stable, cached URL. Use this in Claude Code (Mode A) so brand-new prompts get
# warmed and then serve to everyone from the CDN.
#
# Usage:
#   generate.sh "<prompt>" <width> <height> [style] [seed] [format] [quality]
#
# Reads from the environment:
#   GEN_TOKEN              shared secret for new generation (required on gated
#                          instances like bananastandai.com)
#   BANANA_STAND_BASE_URL  base URL (default https://bananastandai.com)
#
# Prints ONLY the resulting image URL on success. Never echoes the token.
set -euo pipefail

prompt="${1:-}"
width="${2:-}"
height="${3:-}"
style="${4:-web}"
seed="${5:-0}"
format="${6:-webp}"
quality="${7:-82}"

if [[ -z "$prompt" || -z "$width" || -z "$height" ]]; then
  echo 'usage: generate.sh "<prompt>" <width> <height> [style] [seed] [format] [quality]' >&2
  exit 2
fi

base="${BANANA_STAND_BASE_URL:-https://bananastandai.com}"
base="${base%/}"

# JSON-escape the prompt: backslashes first, then double quotes.
esc_prompt=${prompt//\\/\\\\}
esc_prompt=${esc_prompt//\"/\\\"}

body="{\"prompt\":\"$esc_prompt\",\"width\":$width,\"height\":$height,\"style\":\"$style\",\"seed\":$seed,\"format\":\"$format\",\"quality\":$quality}"

auth=()
if [[ -n "${GEN_TOKEN:-}" ]]; then
  auth=(-H "X-Gen-Token: $GEN_TOKEN")
fi

if ! resp=$(curl -fsSL -X POST "$base/api/generate" \
  -H "Content-Type: application/json" \
  "${auth[@]}" \
  -d "$body"); then
  echo "error: POST $base/api/generate failed — check GEN_TOKEN, network, or the prompt/dimensions" >&2
  exit 1
fi

# Pull "url" out of the JSON response without requiring jq.
url=$(printf '%s' "$resp" | sed -n 's/.*"url"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')

if [[ -z "$url" ]]; then
  echo "error: no url in response: $resp" >&2
  exit 1
fi

printf '%s\n' "$url"
