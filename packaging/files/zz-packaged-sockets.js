/**
 * zz-packaged-sockets.js  (installed by the dragonpbx-ui Debian package)
 *
 * Sails refuses to lift in production unless socket connections are constrained
 * via `sockets.onlyAllowOrigins` or `sockets.beforeConnect`. The upstream app's
 * config/env/production.js leaves this unset, so we provide it here.
 *
 * Set DRAGONPBX_UI_ORIGINS (comma-separated, e.g. "https://pbx.example.com") to
 * lock socket connections to those origins. If unset, all connections are
 * allowed — fine for an internal, single-host admin/config API.
 *
 * Named "zz-" so Sails loads it after config/sockets.js and this wins.
 */
const origins = (process.env.DRAGONPBX_UI_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

module.exports.sockets = origins.length
  ? { onlyAllowOrigins: origins }
  : { beforeConnect: function (handshake, cb) { return cb(null, true); } };
