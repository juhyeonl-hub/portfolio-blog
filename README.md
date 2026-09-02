# juhyeonl.dev

Personal portfolio & dev journal — [juhyeonl.dev](https://juhyeonl.dev)

## Stack

| Layer | Tech |
|-------|------|
| Backend | Java 21, Spring Boot 3, Spring Security, Spring Data JPA |
| Database | PostgreSQL 14, Flyway |
| Auth | JWT + TOTP (Google Authenticator) + API Key |
| Frontend | React 19, Vite, TailwindCSS v4 |
| Markdown | react-markdown, remark-gfm, rehype-highlight |
| Deploy | WSL2 + systemd (backend), Vercel (frontend) |
| Network | Cloudflare DNS/Tunnel |

## Features

- **Projects** — showcase with live README rendering from GitHub
- **Journal** — markdown blog with GitHub webhook auto-publish
- **About** — interactive resume with accordion experience cards
- **Admin** — dashboard with dual auth (browser: ID/PW + OTP, local/AI: API Key)
- **Theme** — dark/light mode toggle
- **Analytics** — page view counter (total + today)
- **SEO** — Open Graph, Twitter Card
- **404** — easter egg with random messages

## Architecture

```
Browser → Vercel (frontend)
              ↓ /api/* proxy
         Cloudflare Tunnel
              ↓
         WSL2 systemd (Spring Boot :8081) → PostgreSQL
              ↑
GitHub Webhook (journal auto-publish)
```

## Journal Auto-Publish

Push a `.md` file to `journal/` → signed GitHub webhook → backend parses frontmatter → post published.

```yaml
---
title: "Post Title"
excerpt: "Short description"
tags: [Dev, TIL]
---

Markdown content here...
```

## Local Development

```bash
# Backend
cd backend
mvn clean package
java -jar target/blog-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev

# Frontend
cd frontend
npm install
npm run dev
```

Requires PostgreSQL running locally. The development profile defaults to database
`portfolio_blog_dev`; production defaults to `portfolio_blog`. Set `DB_URL` to
override either connection URL.

The GitHub webhook requires `WEBHOOK_SECRET` and expects repository
`juhyeonl-hub/portfolio-blog` by default. See [OPERATIONS.md](OPERATIONS.md) for
the current production layout and deployment procedure.

## License

MIT
