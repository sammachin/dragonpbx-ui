# dragonpbx-ui package

Builds `dragonpbx-ui_<version>_amd64.deb` — the DragonPBX admin web UI / config
API (a [Sails.js](https://sailsjs.com) app from
[github.com/sammachin/dragonpbx-ui](https://github.com/sammachin/dragonpbx-ui)), with a
self-contained Node runtime bundled in. Separate from the main `dragonpbx` package; designed to run
on the **same host** (serves config on port 1337, which the main app's `CONFIG_URL` points at).

## Build

```bash
cd ui
./build-docker.sh                       # clones tag 0.7.0 by default
DRAGONPBX_UI_VERSION=0.7.0 ./build-docker.sh
# → ../output/dragonpbx-ui_0.7.0_amd64.deb
```

It's a pure Node app (no C compilation beyond `bcrypt`), so there's no Packer/AWS path — Docker only.

## Install (on the dragonpbx host)

```bash
sudo apt-get install -y ./dragonpbx-ui_0.7.0_amd64.deb
systemctl status dragonpbx-ui --no-pager
curl -s localhost:1337 >/dev/null && echo "UI up on :1337"
```

## HTTPS / nginx

The package depends on **nginx** and ships a reverse-proxy site
([files/nginx-dragonpbx-ui.conf](files/nginx-dragonpbx-ui.conf)) for `:1337`, enabled on install at
`/etc/nginx/sites-available/dragonpbx-ui` (the stock `default` site is disabled to avoid a
`default_server` clash). It also recommends `certbot` + `python3-certbot-nginx`. To turn on TLS:

```bash
sudoedit /etc/nginx/sites-available/dragonpbx-ui      # set server_name to your FQDN
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d pbx.example.com               # adds the :443 block + cert
# lock socket origins to the TLS host:
echo 'DRAGONPBX_UI_ORIGINS=https://pbx.example.com' | sudo tee -a /opt/dragonpbx-ui/config/dragonpbx-ui.env
sudo systemctl restart dragonpbx-ui
```

## Runtime notes

- Service: `dragonpbx-ui.service` runs `node app.js` as the `dragonpbx-ui` user (`NODE_ENV=production`).
- Config: `/opt/dragonpbx-ui/config/dragonpbx-ui.env` (conffile) — `PORT`, `DRAGONPBX_UI_DB_DIR`, etc.
- Data: Sails uses an on-disk datastore at `/var/lib/dragonpbx-ui/db` (outside the app dir, so
  upgrades don't wipe stored domains/tokens — see `files/zz-packaged-datastore.js`).
- redis is optional (memory sessions by default); if you enable redis sessions, point at the host's
  redis from the main package.
- Tie-in: create an API token in the UI (`/tokens`) and set it as `CONFIG_TOKEN` in the main
  package's `/opt/dragonpbx/config/dragonpbx.env`.

## Layout

```
ui/
├── build-docker.sh
├── scripts/{10-stage-ui.sh, 20-assemble-ui-deb.sh}
├── debian/{control.tmpl, conffiles, postinst, prerm, postrm}
└── files/{dragonpbx-ui.service, dragonpbx-ui.env, zz-packaged-datastore.js}
```
