# Ad-hoc HTTPS for testing on a phone (Cloudflare Tunnel)

## Why you'd need this

`navigator.geolocation` — the API the rider and driver views depend on — only
works in a browser **secure context**: `https://`, or literally `http://localhost`.
Plain `http://<your-lan-ip>` or `http://<vm-ip>` is not secure, so location
sharing silently fails there with `Only secure origins are allowed`.

The two other HTTPS paths in this repo don't fit ad-hoc local testing:

- `docker-compose.prod.yml` + Let's Encrypt needs a domain (or an
  [sslip.io](https://sslip.io) stand-in) with a **publicly reachable** port 80
  — it can't issue a certificate for a private LAN IP like `192.168.x.x`.
- Trusting a self-signed cert on every test device (mkcert) works, but is
  extra setup per phone/laptop you want to test from.

A [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trigger-scripts/)
"quick tunnel" gives you a real, already-trusted `https://*.trycloudflare.com`
URL pointed at whatever's running on your machine — no account, no cert, no
per-device setup. Use it to test the rider/driver location flow from an actual
phone while developing locally.

**This is for testing only** — not a deployment method. The URL is random,
temporary, unauthenticated (anyone who has the link can reach your local
stack while the tunnel is up), and Cloudflare's quick tunnels come with no
uptime guarantee and [explicitly disallow production use](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trigger-scripts/#limitations-of-a-quick-tunnel).

## One-time install

```bash
brew install cloudflared        # macOS
# or: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

## Every time you want a tunnel

1. Make sure the app is up locally (whatever port `APP_PORT` is set to in
   `.env`, default 80):

   ```bash
   docker compose up -d --build
   ```

2. Point a tunnel at it:

   ```bash
   cloudflared tunnel --url http://localhost:80
   ```

3. Wait a few seconds for cloudflared to print a box like:

   ```
   Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):
   https://plots-mention-frontier-document.trycloudflare.com
   ```

4. Open that URL on any device — phone, another laptop, doesn't matter. It's
   real HTTPS, so geolocation works immediately, no flags or warnings.

5. When you're done testing, stop the tunnel with `Ctrl+C` (or kill the
   process if you ran it in the background). The URL stops resolving as soon
   as it exits — it isn't reserved, so running the command again later gives
   you a **different** random URL.

### Running it in the background

If you want to keep working in the same terminal:

```bash
nohup cloudflared tunnel --url http://localhost:80 > /tmp/cloudflared.log 2>&1 &
# grep the URL out once it's up:
grep trycloudflare.com /tmp/cloudflared.log
```

Find and stop it later with:

```bash
pgrep -fl cloudflared        # find the PID
kill <pid>
```

## How it reaches the backend/socket.io

The tunnel only points at nginx (port 80/`frontend`), same as opening the app
locally — it doesn't need to know about `backend` or the database. Because
the browser only ever talks to the single `trycloudflare.com` origin, nginx's
existing `/api/` and `/socket.io/` proxy rules (see `frontend/nginx.conf`)
handle everything internally over the Docker network exactly as they do for
`http://localhost`. No `CORS_ORIGIN` or config changes are needed for this.

## Want a stable URL instead of a random one each time?

That needs a free Cloudflare account and a *named* tunnel (as opposed to the
account-less "quick tunnel" above) — `cloudflared tunnel login`, `cloudflared
tunnel create <name>`, and a DNS record via `cloudflared tunnel route dns`.
That's a one-time setup that then gives you the same URL every time; out of
scope here since quick tunnels are enough for occasional device testing, but
see [Cloudflare's tunnel docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
if you end up wanting that.
