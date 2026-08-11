#!/bin/bash
#
# UI step 2 — write DEBIAN metadata + the systemd unit and build the .deb.
# Node is bundled and the only native bits (bcrypt) link libc/libstdc++, so
# Depends is hand-declared (no dpkg-shlibdeps needed).
#
# Args: <deb_version> <arch>
set -euo pipefail

DEB_VERSION="$1"
ARCH="$2"

: "${PKGROOT:=/tmp/dragonpbx-ui-pkgroot}"
: "${FILES:=/work/files}"
: "${DEBSRC:=/work/debian}"
: "${OUTDIR:=/tmp}"

[ -n "$DEB_VERSION" ] || { echo "ERROR: deb version required (UI package.json is 0.0.0; pass the tag)"; exit 1; }

# Version epoch (see the dragonpbx package): makes 1:0.7.0 sort above any 1.0.x
# previously installed, so apt upgrades cleanly. Epoch is in the control Version
# only, not the filename.
: "${DEB_EPOCH:=1}"
CONTROL_VERSION="${DEB_EPOCH:+${DEB_EPOCH}:}${DEB_VERSION}"

# systemd unit.
install -D -m 0644 "$FILES/dragonpbx-ui.service" "$PKGROOT/lib/systemd/system/dragonpbx-ui.service"

# nginx reverse-proxy site (enabled by the postinst).
install -D -m 0644 "$FILES/nginx-dragonpbx-ui.conf" "$PKGROOT/etc/nginx/sites-available/dragonpbx-ui"

# DEBIAN control scripts.
mkdir -p "$PKGROOT/DEBIAN"
install -m 0644 "$DEBSRC/conffiles" "$PKGROOT/DEBIAN/conffiles"
install -m 0755 "$DEBSRC/postinst"  "$PKGROOT/DEBIAN/postinst"
install -m 0755 "$DEBSRC/prerm"     "$PKGROOT/DEBIAN/prerm"
install -m 0755 "$DEBSRC/postrm"    "$PKGROOT/DEBIAN/postrm"

INSTALLED_SIZE="$(du -sk "$PKGROOT" | cut -f1)"
sed -e "s/__VERSION__/${CONTROL_VERSION}/" \
    -e "s/__ARCH__/${ARCH}/" \
    -e "s/__INSTALLED_SIZE__/${INSTALLED_SIZE}/" \
    "$DEBSRC/control.tmpl" > "$PKGROOT/DEBIAN/control"

echo "=== DEBIAN/control ==="
cat "$PKGROOT/DEBIAN/control"

mkdir -p "$OUTDIR"
OUT="${OUTDIR}/dragonpbx-ui_${DEB_VERSION}_${ARCH}.deb"
dpkg-deb --build --root-owner-group "$PKGROOT" "$OUT"
chown "$(id -un)":"$(id -gn)" "$OUT" 2>/dev/null || true
ls -lh "$OUT"
echo "Built $OUT"
