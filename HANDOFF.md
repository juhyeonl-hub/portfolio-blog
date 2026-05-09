# Portfolio Blog (juhyeonl.dev) — AI 핸드오프 문서

다른 AI가 이 프로젝트를 이어받아 **저널 글을 발행**하고 **배포/운영**을 할 수 있도록, 알아야 할 모든 정보를 정리한 문서다.

> 사이트: https://juhyeonl.dev
> 소유자: Juhyeon Lee (Hive Helsinki, ex-한국 금융권 백엔드 2년)
> 로컬 경로: `/home/juhyeonl/workspace/portfolio-blog`
> GitHub: `git@github.com:juhyeonl-hub/portfolio-blog.git` (public)

---

## 1. 시스템 전체 구조 (한 장 요약)

```
[글 작성자(나/AI)]
       │
       │ git push (journal/*.md)
       ▼
[GitHub: juhyeonl-hub/portfolio-blog (main)]
       │
       ├──────────────► [Vercel] ──► juhyeonl.dev (frontend, 자동 배포)
       │
       └── webhook ──► [AWS EC2 eu-north-1, 13.50.178.179]
                          │
                          │  POST /api/public/webhook/github
                          ▼
                       [Spring Boot (blog.jar) :8080]
                          │
                          │  GitHubSyncService
                          │  ├─ raw.githubusercontent.com 에서 .md 다운로드
                          │  ├─ YAML frontmatter 파싱 (title/excerpt/tags)
                          │  ├─ .en.md / .ko.md 짝 매칭 (slug 기준)
                          │  └─ posts 테이블 upsert
                          ▼
                     [PostgreSQL 14, localhost:5432/portfolio_blog]
                          │
                          ▲
       Cloudflare DNS ────┘   (juhyeonl.dev → Vercel,
                                api 호출은 Vercel rewrites로 EC2 프록시)
```

핵심: **`journal/` 폴더에 마크다운 파일 push → 자동 발행.** 어드민 대시보드 CMS도 있지만, 거의 안 쓴다. **저널은 Git 기반으로 운영한다.**

---

## 2. 로컬 → 프로덕션까지의 흐름

| 단계 | 어디서 | 누가 자동? |
|---|---|---|
| 글 작성 | `/home/juhyeonl/workspace/portfolio-blog/journal/*.md` | 사람/AI |
| 커밋·푸시 | 로컬 git → `origin/main` | 사람/AI |
| 프론트 빌드/배포 | Vercel (push 감지) | ✅ 자동 |
| 백엔드 DB upsert | GitHub webhook → EC2 Spring Boot | ✅ 자동 |
| 백엔드 코드 변경 시 | EC2 SSH → mvn package → jar swap → systemctl restart | ❌ 수동 |

> **백엔드 코드는 거의 안 건드린다.** 글만 올리는 작업이면 push 한 번이면 끝난다.

---

## 3. 저널 글 발행 — 정확한 절차 (가장 자주 하는 작업)

### 3-1. 파일 위치와 네이밍

```
journal/
├── NN-slug.en.md     ← 영어 (필수, 베이스)
├── NN-slug.ko.md     ← 한국어 (선택, .en.md 와 같은 NN-slug 여야 함)
└── images/
    └── *.png/.svg    ← 글에 들어가는 이미지
```

- `NN`: 두 자리 시퀀스 (현재 마지막 = `15`). 다음 글이면 `16-...`.
- **slug는 알파벳·숫자·하이픈만**. 한글/공백 금지. (백엔드가 `[^a-z0-9\-]` 를 `-` 로 치환해버림.)
- 영어/한국어는 **같은 slug**여야 짝지어진다. `15-foo.en.md` ↔ `15-foo.ko.md`.
- **영어 파일이 없으면 한국어 파일은 무시된다.** (NOT NULL 제약 때문에 한 push에 영문 베이스가 같이 있어야 함. `GitHubSyncService` 가 영문 먼저 처리하도록 정렬해놨음.)

### 3-2. Frontmatter 형식 (필수)

```markdown
---
title: "Post Title"
excerpt: "Short description (150자 이내 권장)"
tags: [Dev, TIL, Career]
---

본문 마크다운 …
```

- `tags`: 배열 또는 콤마 리스트 둘 다 OK. 없으면 비어있음.
- `excerpt` 없으면 본문 첫 200자 자동 생성 (마크다운 기호 제거됨).
- frontmatter 없이 `# 제목` 만 있어도 동작은 한다. (제목으로 빠짐) — 하지만 frontmatter 쓰는 게 표준.

### 3-3. 이미지 삽입

이미지는 **GitHub raw URL**로 참조한다 (Vercel/EC2 어디서든 보이게):

```markdown
![alt](https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/<filename>)
```

- 이미지 파일은 `journal/images/` 에 같이 커밋.
- 절대 상대경로(`./images/...`) 쓰지 말 것 — 백엔드는 마크다운 본문을 그대로 저장하고 프론트가 렌더링하므로, raw URL이어야 어디서든 보인다.

### 3-4. 발행 한 줄 절차

```bash
cd /home/juhyeonl/workspace/portfolio-blog
# 1) journal/16-새글.en.md (+ .ko.md, 필요시 images/) 작성

# 2) 푸시
git add journal/16-*.md journal/images/16_*.png
git commit -m "Add journal post: <title>"
git push origin main
```

push 직후 자동으로:
- Vercel이 프론트엔드 재배포 (~30초)
- GitHub webhook이 EC2 hit → DB upsert (즉시)

### 3-5. 발행 검증

```bash
# 글 목록
curl -s https://juhyeonl.dev/api/public/posts | jq '.[] | {slug, title}' | head

# 특정 글
curl -s https://juhyeonl.dev/api/public/posts/16-새글-slug | jq '{title, titleKo, tags}'
```

브라우저로는 `https://juhyeonl.dev/journal/<slug>` 확인.

### 3-6. 수정/삭제

- **수정**: 같은 파일 다시 push. webhook이 upsert 처리.
- **`.ko.md` 삭제**: 글은 남고 한국어 필드만 비워짐.
- **`.en.md` (또는 plain `.md`) 삭제**: 글이 DB에서 완전히 삭제됨. 신중히.

---

## 4. 인프라 — 어디에 뭐가 있는지

### 4-1. AWS EC2 (백엔드)

| 항목 | 값 |
|---|---|
| Region | **eu-north-1 (Stockholm)** ← 콘솔 region 안 맞추면 인스턴스 안 보인다 |
| Instance ID | `i-0027fcb0a1a224b16` |
| Public IP | `13.50.178.179` |
| OS user | `ubuntu` |
| 접속 | AWS Console → EC2 → 해당 인스턴스 → **Connect → "EC2 Instance Connect"** (브라우저 터미널, SSH 키 불필요) |

### 4-2. EC2 안 디렉토리

| 경로 | 용도 |
|---|---|
| `/opt/portfolio-blog/blog.jar` | **운영 중인 jar** (owner `ubuntu:ubuntu`) |
| `/opt/portfolio-blog/blog.jar.bak` | 직전 버전 백업 |
| `~/portfolio-blog` | 빌드용 git clone (HTTPS, public repo) |
| `/var/portfolio-blog/uploads` | 업로드 디렉토리 (admin 이미지 업로드 시) |

### 4-3. systemd 서비스

```bash
sudo systemctl status portfolio-blog        # 상태
sudo systemctl restart portfolio-blog       # 재시작
sudo journalctl -u portfolio-blog -n 200 --no-pager   # 로그
```

실행 커맨드: `/usr/bin/java -jar /opt/portfolio-blog/blog.jar --spring.profiles.active=prod`

### 4-4. DB

- PostgreSQL 14 (네이티브 systemd, 같은 EC2)
- DB: `portfolio_blog`, host: `localhost:5432`
- 자격증명은 `portfolio-blog.service` 의 환경변수로 주입 (DB_USERNAME, DB_PASSWORD)
- 마이그레이션은 **Flyway** 가 부팅 시 자동 적용 (`backend/src/main/resources/db/migration/V*.sql`)

### 4-5. 도메인·DNS

- `juhyeonl.dev` → **Cloudflare** DNS → **Vercel**
- API 경로 (`/api/*`)는 Vercel `vercel.json` rewrites 로 `http://13.50.178.179:8080` 으로 프록시

### 4-6. Frontend (Vercel)

- Vercel 프로젝트가 `juhyeonl-hub/portfolio-blog` 의 `frontend/` 폴더를 감시
- `git push origin main` → Vercel 자동 빌드/배포 (수동 배포 거의 안 함)
- 환경변수: 별도 없음 (API는 `/api/*` 상대경로로 호출)

### 4-7. GitHub Webhook

- Repo: `juhyeonl-hub/portfolio-blog` → Settings → Webhooks
- URL: `http://13.50.178.179:8080/api/public/webhook/github` (혹은 도메인 경유 `https://juhyeonl.dev/api/public/webhook/github`)
- Content type: `application/json`
- Event: **Just the push event**
- Secret: **현재 검증 안 함** (코드에 secret 검증 로직 없음 — 보안 강화 필요하면 `WebhookController` 에 HMAC 검증 추가)

---

## 5. 백엔드 코드 변경 배포 (이건 가끔만)

```bash
# EC2 (ubuntu)
cd ~/portfolio-blog && git pull origin main
cd backend && mvn -DskipTests clean package

sudo systemctl stop portfolio-blog
sudo cp /opt/portfolio-blog/blog.jar /opt/portfolio-blog/blog.jar.bak
sudo cp ~/portfolio-blog/backend/target/blog-0.0.1-SNAPSHOT.jar /opt/portfolio-blog/blog.jar
sudo chown ubuntu:ubuntu /opt/portfolio-blog/blog.jar
sudo systemctl start portfolio-blog
sudo systemctl status portfolio-blog --no-pager
sudo journalctl -u portfolio-blog -n 100 --no-pager | grep -iE "flyway|migrat|Started"
```

### 롤백

```bash
sudo cp /opt/portfolio-blog/blog.jar.bak /opt/portfolio-blog/blog.jar
sudo systemctl restart portfolio-blog
```

### 빌드 환경 함정 (이미 해결됨, 참고용)

- `apt install maven` 만 하면 JRE만 깔린다. **`openjdk-21-jdk-headless` 도 깔아야** javac 동작 (`release version 21 not supported` 회피).
- `/opt/portfolio-blog` 에는 `.git` 없음 — 빌드는 `~/portfolio-blog` 에서, 산출물만 `/opt/...` 로 복사.

---

## 6. 코드베이스 한눈에

### Backend (`backend/src/main/java/com/portfolio/blog/`)

| 패키지 | 역할 |
|---|---|
| `BlogApplication.java` | Spring Boot 엔트리 |
| `controller/` | REST 엔드포인트. `Public*Controller` (인증 없음) / `Admin*Controller` (JWT 또는 API Key) / `WebhookController` (GitHub) |
| `service/` | 비즈니스 로직. `GitHubSyncService` 가 저널 자동 발행의 심장 |
| `repository/` | Spring Data JPA |
| `model/` | JPA 엔티티 (Post, Tag, Project, ProjectReview, GuestbookEntry, ResumeSection, AdminUser, PageView, ProjectScreenshot) |
| `config/` `dto/` `exception/` | 보조 |

주요 엔드포인트:
- `GET  /api/public/posts` — 글 목록
- `GET  /api/public/posts/{slug}` — 글 상세
- `GET  /api/public/projects` `GET /api/public/resume` `GET /api/public/guestbook`
- `POST /api/public/webhook/github` — GitHub push 이벤트 처리
- `POST /api/auth/login` — 어드민 로그인 (ID/PW + TOTP → JWT)
- `Admin*Controller` — JWT 보호된 CMS

### Frontend (`frontend/src/`)

- React 18 + Vite + TailwindCSS v4
- `pages/`: HomePage, JournalPage, PostDetailPage, PortfolioPage, ProjectDetailPage, ResumePage(=AboutPage), GuestbookPage, LoginPage, AdminDashboard, NotFoundPage 등
- `services/api.js`: axios 클라이언트 (`/api/*` 호출)
- 마크다운 렌더: `react-markdown` + `remark-gfm` + `rehype-highlight`
- 다크/라이트 토글, EN | KR 토글 (PostDetailPage 에서 `titleKo/contentKo` 가 있으면 노출)

### DB 마이그레이션

`backend/src/main/resources/db/migration/`
```
V1__initial_schema.sql
V2__seed_resume_data.sql
V3__page_view_tracking.sql
V4__remove_ip_tracking.sql       (GDPR 대비, IP 추적 제거)
V5__add_korean_post_columns.sql
V6__populate_korean_translations.sql
V7__consolidate_paired_posts.sql
V8__restore_original_post_dates.sql
```

스키마 바꾸려면 **새 V9 파일을 추가**한다. 이전 V 파일을 절대 수정하지 말 것 (Flyway checksum 깨짐).

---

## 7. 인증·시크릿 (어드민 작업 할 때만 필요)

운영에선 **환경변수로** 주입 (`/etc/systemd/system/portfolio-blog.service` 의 `Environment=` 또는 EnvironmentFile).

| 변수 | 용도 |
|---|---|
| `DB_USERNAME`, `DB_PASSWORD` | PostgreSQL |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | 어드민 ID/PW |
| `JWT_SECRET` | JWT 서명 키 |
| `API_KEY` | 로컬/AI 액세스용 API Key (Authorization 헤더) |
| `UPLOAD_DIR` | 기본 `/var/portfolio-blog/uploads` |

> **시크릿 값은 이 문서에 적지 않는다.** EC2 서비스 파일에서 확인하거나, 사용자에게 물어볼 것.

어드민 로그인 흐름: `/admin/login` → ID/PW + Google Authenticator OTP → JWT → `Authorization: Bearer <jwt>` 로 `/api/admin/*` 호출.

---

## 8. 자주 하는 작업 체크리스트

### A. "새 저널 글 올려" 라는 요청을 받았을 때

1. `journal/` 안의 마지막 NN 확인 → 다음 번호 정함.
2. 글 주제·언어 확인 (영어 필수, 한국어는 옵션).
3. `journal/NN-slug.en.md` 작성 (frontmatter + 본문). 필요하면 `.ko.md` 도.
4. 이미지 있으면 `journal/images/` 에 추가, 본문엔 `https://raw.githubusercontent.com/juhyeonl-hub/portfolio-blog/main/journal/images/<file>` 형태로.
5. `git add` → `git commit -m "Add journal post: <title>"` → `git push origin main`.
6. 1~2분 뒤 `https://juhyeonl.dev/journal/<slug>` 접속해 확인.
7. 안 뜨면 EC2에서 `sudo journalctl -u portfolio-blog -n 100 --no-pager` 로 webhook 처리 로그 확인.

### B. "사이트 안 떠요" 디버깅 순서

1. `curl -I https://juhyeonl.dev` — 프론트(Vercel) 살아있나
2. `curl -s https://juhyeonl.dev/api/public/posts | head` — API 프록시 동작?
3. `curl -I http://13.50.178.179:8080/api/public/posts` — EC2 직접 응답?
4. EC2 접속 → `sudo systemctl status portfolio-blog` → 죽었으면 `start`, 살았으면 `journalctl` 로그 확인
5. DB? → `sudo systemctl status postgresql` / `sudo -u postgres psql -d portfolio_blog -c "\dt"`

### C. "어드민 글이 안 보여요" / "프론트는 떴는데 글만 비어요"

- DB 조회: 글이 들어갔나? `SELECT slug, title FROM posts ORDER BY id DESC LIMIT 5;`
- webhook 안 도는 거면 GitHub repo → Settings → Webhooks → "Recent Deliveries" 에서 페이로드/응답코드 확인.
- 백엔드 죽었으면 (위 B의 4단계).

---

## 9. 알려진 제약·주의사항

- **EC2 region은 eu-north-1 (Stockholm).** Frankfurt/Ireland 가 아니다.
- **webhook 시크릿 검증 없음** — 누구나 webhook URL을 호출하면 GitHub raw URL을 fetch 한다. raw URL은 우리 repo만 보지만, DoS/스팸 가능성은 있음. 신경 쓰이면 HMAC 검증 추가.
- **`forward-headers-strategy: native`** 가 `application.yml` 에 켜져 있다 — Vercel 프록시 뒤에서 진짜 클라이언트 IP 보려고. 끄면 분석/레이트리밋 망가짐.
- **CI/CD 없음.** 백엔드 배포는 100% 수동. 글 발행만 자동.
- **이미지 업로드는 `/var/portfolio-blog/uploads` 로컬 파일시스템.** S3 안 씀. 인스턴스 날아가면 업로드 이미지도 같이 날아감 — 그래서 저널 이미지는 git repo 안에 넣어 GitHub raw URL로 참조하는 패턴을 쓰는 거다.
- **단일 인스턴스, 백업 정책 없음.** RDS 아님, EBS 스냅샷 자동화 안 되어 있음. 글이 실제로 쌓이기 시작하면 `pg_dump` 정기 백업 필요.

---

## 10. 글 만들 때 참고할 톤·스타일

(`journal/01-why-agentic-engineering.en.md` ~ `15-...` 가 레퍼런스)

- **영어**: 1인칭, 짧은 문장, 솔직한 어조. "I worked …, I realized …" 류. 마케팅 느낌 X.
- **한국어**: 같은 내용을 의역(직역 X). 한국어 자연스러움 우선.
- **구조**: 보통 2~5개 섹션, 한 글당 1~3장 이미지/다이어그램.
- **태그 풀**: `Dev`, `TIL`, `Career`, `AI`, `Agentic`, `Project`, `Life` (대문자 시작, PascalCase).
- **글쓴이 포지셔닝**: "한국 금융권 백엔드 2년 → Hive Helsinki 시스템 프로그래밍 → Agentic Engineering". 이력서·자기소개에 이 경로를 일관되게 유지. (저자 메모: '엔지니어' 직책으로 포지셔닝, '엔진' 표현·직종 한정 표현 피하기, Vantaa는 Helsinki와 다름.)

---

## 11. 이 문서 자체 관리

- 인프라/절차가 바뀌면 **이 HANDOFF.md 를 즉시 갱신**한다.
- `~/.claude/projects/-home-juhyeonl-workspace/memory/project_portfolio_blog.md` 에도 핵심 변경사항 반영 (다른 세션에서 자동으로 로드되는 메모리).
- `PROJECT_BRIEF.md` 는 초기 기획 스냅샷이다 — 현재 상태와 어긋나면 이 문서를 신뢰할 것.

---

**TL;DR — 다른 AI에게**

> `journal/NN-slug.en.md` 작성 → `git push origin main`. 끝.
> Vercel이 프론트 자동 빌드, GitHub webhook이 EC2 Spring Boot 를 깨워서 DB upsert.
> 코드/인프라 손댈 일 거의 없음. 손대야 하면 위 5번·9번 섹션 정독.
