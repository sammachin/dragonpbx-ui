/**
 * zz-packaged-datastore.js  (installed by the dragonpbx-ui Debian package)
 *
 * Persist the default sails-disk datastore OUTSIDE the app directory so that
 * package upgrades — which replace /opt/dragonpbx-ui/app — don't wipe stored
 * domains/tokens. Override the location with DRAGONPBX_UI_DB_DIR.
 *
 * Named "zz-" so Sails loads it after config/datastores.js and this wins.
 */
module.exports.datastores = {
  default: {
    adapter: 'sails-disk',
    dir: process.env.DRAGONPBX_UI_DB_DIR || '/var/lib/dragonpbx-ui/db',
  },
};
