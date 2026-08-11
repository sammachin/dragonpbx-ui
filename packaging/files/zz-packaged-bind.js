/**
 * zz-packaged-bind.js  (installed by the dragonpbx-ui package)
 *
 * Bind the Sails HTTP server to a single interface (default 127.0.0.1) so the UI
 * is reachable only through the nginx reverse proxy on the same host, not
 * directly on :1337 from the network.
 *
 * Override with HOST=0.0.0.0 in /opt/dragonpbx-ui/config/dragonpbx-ui.env to
 * listen on all interfaces (e.g. if you're not fronting it with nginx).
 */
module.exports.explicitHost = process.env.HOST || '127.0.0.1';
