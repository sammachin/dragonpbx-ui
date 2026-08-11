#!/bin/bash
#
# UI step 1 — stage the DragonPBX UI (Sails app) from a git tag (or a local
# checkout), bundle a self-contained Node runtime, install production deps, and
# drop in the packaging config (persistent datastore dir + env).
#
# Args: [repo_url] [version]
#   version = a git tag/branch on repo_url (e.g. 0.7.0), OR "local" to copy from
#             $APP_SRC (a local checkout whose root contains package.json).
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

: "${PKGROOT:=/tmp/dragonpbx-ui-pkgroot}"
: "${FILES:=/work/files}"
: "${APP_SRC:=/tmp/dragonpbx-ui-app}"   # local app root (package.json at top), used when version=local
: "${NODE_VERSION:=22.14.0}"

REPO="${1:-${DRAGONPBX_UI_REPO:-https://github.com/sammachin/dragonpbx-ui.git}}"
VERSION="${2:-${DRAGONPBX_UI_VERSION:-0.7.0}}"

DEST="$PKGROOT/opt/dragonpbx-ui"
rm -rf "$DEST"
mkdir -p "$DEST/app"

# --- obtain the app source ---
if [ "$VERSION" != "local" ]; then
  echo "Fetching DragonPBX UI from $REPO @ $VERSION"
  command -v git >/dev/null 2>&1 || { apt-get update; apt-get install -y --no-install-recommends git ca-certificates; }
  rm -rf /tmp/ui-src
  git -c advice.detachedHead=false clone --depth 1 "$REPO" -b "$VERSION" /tmp/ui-src
  cp -a /tmp/ui-src/. "$DEST/app/"
  rm -rf "$DEST/app/.git"
else
  echo "Staging DragonPBX UI from local path $APP_SRC"
  cp -a "$APP_SRC/." "$DEST/app/"
  rm -rf "$DEST/app/.git"
fi
find "$DEST" -name '.DS_Store' -delete 2>/dev/null || true

# --- bundle Node (no system node dep) ---
case "$(dpkg --print-architecture)" in
  amd64) NODE_ARCH=x64 ;;
  arm64) NODE_ARCH=arm64 ;;
  *)     NODE_ARCH=x64 ;;
esac
command -v xz >/dev/null 2>&1 || { apt-get update; apt-get install -y --no-install-recommends xz-utils curl ca-certificates; }
mkdir -p "$DEST/node"
curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz" -o /tmp/node.tar.xz
tar -xJf /tmp/node.tar.xz -C "$DEST/node" --strip-components=1
export PATH="$DEST/node/bin:$PATH"
echo "bundled node: $(node --version), npm: $(npm --version)"

# --- production deps (bcrypt compiles natively if no prebuilt is available) ---
( cd "$DEST/app" && npm ci --omit=dev )

# Strip foreign-arch native prebuilds to keep the package lean.
KEEP="linux-x64"; [ "$NODE_ARCH" = arm64 ] && KEEP="linux-arm64"
find "$DEST/app" -type d -name prebuilds -print | while read -r p; do
  find "$p" -mindepth 1 -maxdepth 1 -type d ! -name "$KEEP" -exec rm -rf {} +
done

# --- packaging config drop-ins ---
# Persist the sails-disk datastore outside the app dir so upgrades don't wipe data.
install -D -m 0644 "$FILES/zz-packaged-datastore.js" "$DEST/app/config/zz-packaged-datastore.js"
# Satisfy Sails' production socket-origin guard (upstream production.js leaves it unset).
install -D -m 0644 "$FILES/zz-packaged-sockets.js"   "$DEST/app/config/zz-packaged-sockets.js"
# Bind the HTTP server to localhost (behind the nginx proxy) by default.
install -D -m 0644 "$FILES/zz-packaged-bind.js"      "$DEST/app/config/zz-packaged-bind.js"
install -D -m 0644 "$FILES/dragonpbx-ui.env"         "$DEST/config/dragonpbx-ui.env"

echo "DragonPBX UI staged under $DEST:"
ls -la "$DEST"
test -d "$DEST/app/node_modules/sails-disk" && echo "sails-disk present (datastore adapter OK)" || echo "WARNING: sails-disk not found in node_modules"
