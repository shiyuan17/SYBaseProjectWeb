# Nginx Config

- `web-ele.conf` is for the frontend static site, defaulting to `apps/web-ele/dist`
- Update `root` to the real dist path on your server before deployment
- Proxies:
  - `/api/v1/auth/` -> `127.0.0.1:8081`
  - `/api/v1/` -> `127.0.0.1:8080`
- `location /` falls back to `index.html` for SPA history routing
