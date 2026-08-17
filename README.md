# DragonPBX UI

The admin web UI and configuration API for [DragonPBX](https://github.com/sammachin/dragonpbx) — a
[Sails v1](https://sailsjs.com) application. It manages **domains, clients, trunks and API tokens**
and serves that configuration over HTTP (default port `1337`) to the DragonPBX call-control app,
which reads it via its `CONFIG_URL`/`CONFIG_TOKEN` (`DATA_SOURCE=api`).

Designed to run on the **same host** as the `dragonpbx` package.

## Deployment (Debian package)

The supported way to run the UI in production is the **Debian package**, which bundles a
self-contained Node.js runtime and the app, wired up with a systemd unit and an nginx reverse-proxy
site. Packages are published on the
[GitHub Releases](https://github.com/sammachin/dragonpbx-ui/releases) for each tag, built for Debian
**bookworm** (12) and **trixie** (13) on **amd64** and **arm64** (the `arm64` build also runs on a
**Raspberry Pi 5** with 64-bit Raspberry Pi OS). Pick the file matching your host:

```bash
# on the target host, identify the right file:
. /etc/os-release; echo "$VERSION_CODENAME"   # bookworm | trixie
dpkg --print-architecture                     # amd64 | arm64

# install (apt resolves dependencies, including nginx):
sudo apt install -y ./dragonpbx-ui_<version>+<codename>_<arch>.deb
```

Install it on the same host as the `dragonpbx` package. Verify:

```bash
systemctl status dragonpbx-ui --no-pager
curl -s localhost:1337 >/dev/null && echo "UI up on :1337"
```

Full deployment guide (both packages, service management, TLS, upgrades) is in the main repo:
[dragonpbx/docs/deployment.md](https://github.com/sammachin/dragonpbx/blob/main/docs/deployment.md).

## Where configuration is stored

| Path | Purpose |
|---|---|
| `/opt/dragonpbx-ui/config/dragonpbx-ui.env` | Runtime settings (dpkg **conffile** — edits survive upgrades): `PORT`, bind `HOST`, `DRAGONPBX_UI_DB_DIR`, `DRAGONPBX_UI_ORIGINS` |
| `/var/lib/dragonpbx-ui/db` | On-disk datastore holding domains / trunks / tokens — kept **outside** the app dir so upgrades don't wipe it |
| `/etc/nginx/sites-available/dragonpbx-ui` | nginx reverse-proxy site for port 1337 (enabled on install) |
| `/opt/dragonpbx-ui/app` | The Sails app |
| `/opt/dragonpbx-ui/node` | Bundled Node.js runtime |

After editing the env file, apply changes with:

```bash
sudoedit /opt/dragonpbx-ui/config/dragonpbx-ui.env
sudo systemctl restart dragonpbx-ui
```

### Connecting the UI to DragonPBX

Create an API token in the UI (`/tokens`) and set it as `CONFIG_TOKEN` in the main package's
`/opt/dragonpbx/config/dragonpbx.env`, then `sudo systemctl restart dragonpbx`. The app then fetches
its domain/trunk config from this UI.

## HTTPS / nginx

The package depends on **nginx** and installs a reverse-proxy site for `:1337`. To enable TLS:

```bash
sudoedit /etc/nginx/sites-available/dragonpbx-ui      # set server_name to your FQDN
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d pbx.example.com               # adds the :443 block + cert
# lock socket origins to the TLS host:
echo 'DRAGONPBX_UI_ORIGINS=https://pbx.example.com' | sudo tee -a /opt/dragonpbx-ui/config/dragonpbx-ui.env
sudo systemctl restart dragonpbx-ui
```

## Development (from source)

It's a standard Sails app. For local development:

```bash
npm install
npm start          # or: node app.js  (NODE_ENV defaults to development)
```

The app listens on `PORT` (default `1337`). In development Sails uses its local `sails-disk`
datastore; in the package the datastore path is overridden to `/var/lib/dragonpbx-ui/db` via
`config/zz-packaged-datastore.js`.

Useful Sails references: [documentation](https://sailsjs.com/get-started) ·
[deployment](https://sailsjs.com/documentation/concepts/deployment) ·
[upgrading](https://sailsjs.com/documentation/upgrading).

## Building the package

Built automatically by GitHub Actions on each release tag (see
`.github/workflows/build-deb.yml`), and buildable locally with Docker — see
[`packaging/README.md`](packaging/README.md).

---

Part of [DragonPBX](https://github.com/sammachin/dragonpbx). Copyright 2026 Sam Machin.
