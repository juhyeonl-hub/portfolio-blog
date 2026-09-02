# juhyeonl.dev Operations

Last verified: 2026-09-02

This is the current runbook for the production backend. Older EC2 instructions
in `HANDOFF.md` are historical and must not be used for deployment.

## Production topology

```text
Browser
  -> Vercel frontend (juhyeonl.dev)
  -> /api/* rewrite
  -> Cloudflare Tunnel (api.juhyeonl.dev)
  -> WSL2 Ubuntu-22.04
  -> portfolio-blog.service / Spring Boot on 127.0.0.1:8081
  -> PostgreSQL 14 on 127.0.0.1:5432
```

## WSL paths

| Purpose | Path |
|---|---|
| Source repository | `/home/juhyeonl/workspace/portfolio-blog` |
| Runtime directory | `/home/juhyeonl/portfolio-blog-ops` |
| Production JAR | `/home/juhyeonl/portfolio-blog-ops/blog.jar` |
| Runtime environment | `/home/juhyeonl/portfolio-blog-ops/blog.env` |
| Application log | `/home/juhyeonl/portfolio-blog-ops/logs/blog.log` |
| Database backups | `/home/juhyeonl/portfolio-blog-ops/backups` |
| systemd unit | `/etc/systemd/system/portfolio-blog.service` |

`blog.env` must remain mode `600`. Never commit or paste its values into chat,
issues, logs, or documentation.

## Required production environment variables

- `DB_USERNAME`
- `DB_PASSWORD`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `JWT_SECRET`
- `API_KEY`
- `UPLOAD_DIR`
- `SERVER_PORT` (must be `8081`)
- `WEBHOOK_SECRET`

Optional overrides:

- `DB_URL` (default: `jdbc:postgresql://localhost:5432/portfolio_blog`)
- `GITHUB_REPOSITORY` (default: `juhyeonl-hub/portfolio-blog`)

## Routine status checks

```bash
sudo systemctl status portfolio-blog --no-pager
sudo journalctl -u portfolio-blog -n 100 --no-pager
/usr/bin/pg_isready
/usr/bin/curl --fail http://127.0.0.1:8081/api/health
/usr/bin/curl --fail https://api.juhyeonl.dev/api/health
/usr/bin/curl --fail https://juhyeonl.dev/api/health
```

The service is enabled at boot. If WSL itself is not started after Windows
reboots, Windows/WSL startup remains a separate dependency.

## GitHub webhook secret

The webhook endpoint rejects unsigned requests. Before deploying a build that
contains signature verification:

1. Generate a strong secret locally, for example with `openssl rand -hex 32`.
2. Put it in `blog.env` as `WEBHOOK_SECRET=...` without sharing the value.
3. In the GitHub repository webhook settings, set the exact same value as the
   webhook secret and use content type `application/json`.
4. Keep the payload URL as
   `https://api.juhyeonl.dev/api/public/webhook/github`.
5. Restart the service and use GitHub's webhook delivery page to verify a `2xx`
   response for a signed push delivery.

## Safe deployment sequence

Run these commands from WSL. Do not replace the production JAR unless all tests
and builds succeed.

```bash
cd /home/juhyeonl/workspace/portfolio-blog/backend
mvn test
mvn -DskipTests clean package

cd /home/juhyeonl/workspace/portfolio-blog/frontend
npm ci
npm run lint
npm run build
```

Create a fresh database backup before installing the JAR. The exact credentials
must be loaded locally from `blog.env`; do not put them directly in shell history.
Verify the resulting dump with `pg_restore --list`.

Then install the already-tested JAR with an easily reversible backup:

```bash
sudo systemctl stop portfolio-blog
cp /home/juhyeonl/portfolio-blog-ops/blog.jar \
  /home/juhyeonl/portfolio-blog-ops/blog.jar.previous
cp /home/juhyeonl/workspace/portfolio-blog/backend/target/blog-0.0.1-SNAPSHOT.jar \
  /home/juhyeonl/portfolio-blog-ops/blog.jar
sudo systemctl start portfolio-blog
sudo systemctl status portfolio-blog --no-pager
/usr/bin/curl --fail http://127.0.0.1:8081/api/health
```

After local health passes, verify both public health URLs and a public posts
request. Vercel deploys the frontend from the Git repository; the backend is not
automatically deployed by GitHub Actions. The backend workflow only runs tests.

## Rollback

If the new backend does not become healthy, inspect the journal first. To restore
the preceding JAR:

```bash
sudo systemctl stop portfolio-blog
cp /home/juhyeonl/portfolio-blog-ops/blog.jar.previous \
  /home/juhyeonl/portfolio-blog-ops/blog.jar
sudo systemctl start portfolio-blog
/usr/bin/curl --fail http://127.0.0.1:8081/api/health
```

Database restoration is a separate, destructive operation. Do not restore a dump
unless the schema/data problem has been diagnosed and the intended backup file
has been explicitly verified.

## Daily database backup timer

The repository includes a backup script and systemd templates under `ops/`. The
script writes a temporary custom-format dump, verifies it with `pg_restore`, and
only then gives it the final `.dump` name. It does not automatically delete older
backups.

Install and test the timer from WSL:

```bash
chmod 755 /home/juhyeonl/workspace/portfolio-blog/ops/backup-db.sh
sudo cp /home/juhyeonl/workspace/portfolio-blog/ops/portfolio-blog-backup.service \
  /etc/systemd/system/portfolio-blog-backup.service
sudo cp /home/juhyeonl/workspace/portfolio-blog/ops/portfolio-blog-backup.timer \
  /etc/systemd/system/portfolio-blog-backup.timer
sudo systemctl daemon-reload
sudo systemctl enable --now portfolio-blog-backup.timer
sudo systemctl start portfolio-blog-backup.service
sudo systemctl status portfolio-blog-backup.service --no-pager
systemctl list-timers portfolio-blog-backup.timer --no-pager
```

Periodically copy verified backups off the WSL disk. A backup on the same physical
machine protects against application mistakes, but not against loss of the machine.
