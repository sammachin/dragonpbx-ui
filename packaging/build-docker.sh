#!/usr/bin/env bash
#
# Build the dragonpbx-ui .deb locally in a Debian bookworm container (no AWS).
# It's a pure Node/Sails app, so this clones a tagged release (or stages a local
# checkout), bundles Node, `npm ci` (compiling bcrypt), and assembles the
# package. Output lands in the repo-root output/ dir alongside the main dragonpbx .deb.
#
# On Apple Silicon the default amd64 build runs under QEMU emulation.
#
# Override via env, e.g.:
#   DRAGONPBX_UI_VERSION=0.7.0 ./build-docker.sh
#   (the .deb version tracks DRAGONPBX_UI_VERSION unless you set DEB_VERSION)
# Or build from a local checkout (used by CI to package the exact tagged commit):
#   DRAGONPBX_UI_VERSION=local APP_PATH=/path/to/checkout DEB_VERSION=0.7.0 ./build-docker.sh
set -euo pipefail

PLATFORM="${PLATFORM:-linux/amd64}"
ARCH_DEB="${ARCH_DEB:-amd64}"
IMAGE="${IMAGE:-debian:bookworm}"

DRAGONPBX_UI_REPO="${DRAGONPBX_UI_REPO:-https://github.com/sammachin/dragonpbx-ui.git}"
DRAGONPBX_UI_VERSION="${DRAGONPBX_UI_VERSION:-0.7.0}"   # git tag/branch, or "local"
APP_PATH="${APP_PATH:-../}"   # local app checkout (used when version=local)
# UI package.json version is 0.0.0, so the deb version comes from the tag.
DEB_VERSION="${DEB_VERSION:-}"
DEB_EPOCH="${DEB_EPOCH:-1}"   # control-Version epoch (matches the dragonpbx package)

PROJ_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$(cd "$PROJ_DIR/.." && pwd)/output"
mkdir -p "$OUT_DIR"

# In "local" mode, resolve + mount the app checkout read-only.
APP_MOUNT=()
APP_SRC_ENV=()
if [ "$DRAGONPBX_UI_VERSION" = "local" ]; then
  if [ -d "$PROJ_DIR/$APP_PATH" ]; then APP_ABS="$(cd "$PROJ_DIR/$APP_PATH" && pwd)"
  elif [ -d "$APP_PATH" ]; then APP_ABS="$(cd "$APP_PATH" && pwd)"
  else echo "ERROR: local app checkout not found at '$APP_PATH'"; exit 1; fi
  APP_MOUNT=(-v "$APP_ABS":/work/app-src:ro)
  APP_SRC_ENV=(-e APP_SRC=/work/app-src)
  UI_DESC="local: $APP_ABS"
  [ -n "$DEB_VERSION" ] || { echo "ERROR: DEB_VERSION is required in local mode (UI package.json is 0.0.0)"; exit 1; }
else
  UI_DESC="$DRAGONPBX_UI_REPO @ $DRAGONPBX_UI_VERSION"
  # Track the tag unless overridden.
  [ -n "$DEB_VERSION" ] || DEB_VERSION="$DRAGONPBX_UI_VERSION"
fi

echo "Building dragonpbx-ui_${DEB_VERSION}_${ARCH_DEB}.deb on $PLATFORM ($IMAGE)"
echo "  ui : $UI_DESC"

docker run --rm --platform="$PLATFORM" \
  -v "$PROJ_DIR":/work \
  -v "$OUT_DIR":/out \
  "${APP_MOUNT[@]}" "${APP_SRC_ENV[@]}" \
  -e DEBIAN_FRONTEND=noninteractive \
  -e PKGROOT=/work/ui-pkgroot \
  -e FILES=/work/files \
  -e DEBSRC=/work/debian \
  -e OUTDIR=/out \
  -e DRAGONPBX_UI_REPO="$DRAGONPBX_UI_REPO" \
  -e DRAGONPBX_UI_VERSION="$DRAGONPBX_UI_VERSION" \
  -e DEB_VERSION="$DEB_VERSION" \
  -e DEB_EPOCH="$DEB_EPOCH" \
  -e ARCH_DEB="$ARCH_DEB" \
  -w /work \
  "$IMAGE" bash -euo pipefail -c '
    rm -rf /work/ui-pkgroot
    apt-get update -qq
    apt-get install -y -qq git curl ca-certificates xz-utils python3 make g++ dpkg-dev >/dev/null 2>&1
    bash scripts/10-stage-ui.sh       "$DRAGONPBX_UI_REPO" "$DRAGONPBX_UI_VERSION"
    bash scripts/20-assemble-ui-deb.sh "$DEB_VERSION"      "$ARCH_DEB"
  '

echo "Done → output/dragonpbx-ui_${DEB_VERSION}_${ARCH_DEB}.deb"
ls -lh "$OUT_DIR/dragonpbx-ui_${DEB_VERSION}_${ARCH_DEB}.deb"
