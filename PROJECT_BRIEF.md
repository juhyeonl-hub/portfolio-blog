# Project Brief

## Project Name
Portfolio Blog (working title -- final name TBD)

## Final Goal
A personal portfolio blog with project showcase, online resume/CV, daily dev journal, guestbook, and project reviews -- deployed on AWS with a custom free subdomain, always-on server.

## Tech Stack & Environment
- Backend: Java 21, Spring Boot 3, Spring Security, Spring Data JPA, Flyway
- Database: PostgreSQL (same Lightsail instance initially)
- Cache: Redis (optional, add later if needed)
- Frontend: React 18 + Vite + TailwindCSS
- Frontend Deploy: Vercel (free subdomain: {username}.vercel.app)
- Backend Deploy: AWS Lightsail $5/month plan (1GB RAM, 40GB SSD)
- Auth (Admin): Dual authentication
  - Browser login: ID/Password + TOTP (Google Authenticator)
  - Local/AI access: API Key via Authorization header (env variable, restricted to localhost/allowed IPs)
- Auth (Visitors): None (anonymous guestbook and reviews)
- Image Storage: Lightsail local filesystem (/uploads/, static serve)
- Build: Maven (backend), npm (frontend)
- OS: Ubuntu (WSL for local dev, Ubuntu on Lightsail)

## Main Features

### 1. Home Page
- Intro / short bio
- Recent journal posts preview
- Links to portfolio, resume, journal sections

### 2. Portfolio (Project Showcase)
- Project cards with thumbnail, title, tech stack tags, short description
- Project detail page: full description, screenshots, GitHub link, demo link
- Visitor reviews per project (anonymous, no auth required)
- Admin: CRUD projects from admin dashboard

### 3. Resume / CV
- Online interactive resume page
- PDF download button
- Sections: summary, experience, education, skills, certifications
- Admin: edit resume content from admin dashboard

### 4. Journal (Dev Blog)
- Markdown-based blog posts with syntax highlighting
- Tag system for filtering (e.g., [Dev], [TIL], [Project], [Life])
- Two writing methods:
  a) CMS: write directly from admin dashboard (rich markdown editor)
  b) GitHub sync: push .md files to a specific repo/folder -> auto-publish (Phase 2)
- Pagination, search by title/tag

### 5. Guestbook
- Visitors leave messages (anonymous, nickname + message)
- Admin: delete inappropriate messages

### 6. Project Reviews
- Visitors write reviews on specific portfolio projects (anonymous, nickname)
- Star rating (1-5) + text comment
- Display on project detail page
- Admin: moderate reviews

### 7. Admin Dashboard (admin only, ID/Password login)
- Manage portfolio projects (CRUD)
- Write/edit journal posts (CMS)
- Edit resume sections
- Moderate guestbook entries and project reviews
- Simple analytics: page views, popular projects

## Directory Structure
```
portfolio-blog/
├── CLAUDE.md
├── PROJECT_BRIEF.md
├── backend/
│   ├── pom.xml
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/portfolio/blog/
│   │   │   │   ├── BlogApplication.java
│   │   │   │   ├── config/
│   │   │   │   ├── controller/
│   │   │   │   ├── service/
│   │   │   │   ├── repository/
│   │   │   │   ├── model/
│   │   │   │   ├── dto/
│   │   │   │   └── exception/
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-dev.yml
│   │   │       ├── application-prod.yml
│   │   │       └── db/migration/
│   │   └── test/
│   └── Dockerfile
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   └── assets/
│   └── Dockerfile
├── docker-compose.yml
├── .github/
│   └── workflows/
└── README.md
```

## Completion Criteria
1. Backend builds successfully: `mvn clean package` passes with no errors
2. Frontend builds successfully: `npm run build` produces dist/ with no errors
3. Local dev environment runs: docker-compose up starts backend + postgres + frontend
4. Home page loads at localhost:5173 showing intro and recent journal preview
5. Portfolio page displays at least 1 sample project card
6. Clicking a project card shows the detail page with description and tech tags
7. Resume page renders all sections and PDF download works
8. Journal page lists posts with tag filtering working
9. Admin can log in via ID/Password and access the admin dashboard
10. Admin can create a portfolio project from the dashboard and it appears on the public site
11. Admin can write a journal post from the dashboard and it appears on the journal page
12. Guestbook page allows any visitor to leave a message (nickname + message)
13. The message appears on the guestbook page with the visitor's nickname
14. AWS Lightsail deployment: backend API accessible at the public IP
15. Vercel deployment: frontend accessible at {username}.vercel.app
16. Frontend successfully communicates with the deployed backend API

## Notes
1. Design: Dark mode only, minimal developer aesthetic (think Linear/Notion dark mode)
2. No OAuth for visitors. Guestbook and reviews are anonymous (nickname-based). Simple spam prevention via rate limiting.
3. GitHub repo: portfolio-blog (new repo under Hive-juhyeonl)
4. The site owner (admin) is Juhyeon Lee, Hive Helsinki student. Background: Java/Spring Boot backend experience from Korean fintech, currently studying systems programming at Hive Helsinki, Finland. Resume positioning will shift to Agentic Engineering.
5. Budget: ~$5-10/month for AWS Lightsail. Frontend on Vercel free tier.
6. Journal GitHub sync feature can be Phase 2 -- CMS writing is Phase 1 priority.
7. No mobile app needed. Responsive web design is sufficient.
8. Language: Site content in English (targeting Finnish/international employers).
9. Previous project context: PEER had Spring Boot + PostgreSQL + React + AWS architecture. Same stack carries over but the application is completely new.
10. Dev environment: WSL (Ubuntu) on Windows.

## Task Progress

### Phase 0: Project Setup
- [x] Step 1: Initialize Spring Boot project (Java 21, Spring Boot 3, Maven)
- [x] Step 2: Initialize React project (Vite + React 18 + TailwindCSS)
- [x] Step 3: Set up local PostgreSQL database (Docker Compose deferred)
- [x] Step 4: Configure Flyway and create initial DB schema
- [x] Step 5: Verify local dev environment runs end-to-end

### Phase 1: Auth System
- [x] Step 6: Configure Spring Security + admin ID/PW + TOTP authentication
- [x] Step 7: Implement admin login API + JWT token issuance (browser path)
- [x] Step 8: Implement API Key authentication (local/AI path, IP restriction)
- [x] Step 9: Frontend admin login page (ID/PW + OTP input) + auth context + route guards

### Phase 2: Portfolio CRUD
- [x] Step 10: Create Project entity, repository, service, controller (backend)
- [x] Step 11: Admin dashboard: project create/edit/delete UI
- [x] Step 12: Public portfolio page: project cards and detail page

### Phase 3: Resume Page
- [x] Step 13: Create Resume entity/model and admin edit API
- [x] Step 14: Public resume page with all sections
- [x] Step 15: PDF download functionality (browser Print/PDF)

### Phase 4: Journal / Blog
- [x] Step 16: Create Post entity, CRUD API with tag system
- [x] Step 17: Admin CMS: markdown editor for writing posts
- [x] Step 18: Public journal page: list, tag filter, search, pagination
- [x] Step 19: Markdown rendering with syntax highlighting

### Phase 5: Guestbook + Reviews
- [x] Step 20: Guestbook entity and API (create/list/delete, anonymous)
- [x] Step 21: Guestbook UI (nickname + message form)
- [x] Step 22: Project Review entity and API (create/list/moderate, anonymous)
- [x] Step 23: Review display on project detail page

### Phase 6: Admin Dashboard
- [x] Step 24: Unified admin dashboard layout
- [x] Step 25: Analytics: page views, popular projects

### Phase 7: Deployment
- [x] Step 26: AWS EC2 setup (backend + PostgreSQL) — 13.50.178.179
- [x] Step 27: Vercel deployment (frontend)
- [ ] Step 28: Domain/subdomain configuration, CORS, HTTPS

### Phase 8: GitHub Sync (Optional)
- [ ] Step 29: GitHub webhook listener for journal .md files
- [ ] Step 30: Auto-publish synced markdown posts
