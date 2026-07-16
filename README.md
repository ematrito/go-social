# GopherSocial

A REST API for a social media platform built with Go. Users can register, log in, create posts with tags, comment on posts, follow other users, and browse a personalised feed.

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Go 1.26 |
| HTTP router | [chi](https://github.com/go-chi/chi) |
| Database | PostgreSQL |
| Cache | Redis (optional) |
| Auth | JWT (HS256) |
| Email | SendGrid (prod), Mailpit/SMTP (dev) |
| Docs | Swagger/OpenAPI |
| Logging | Zap |
| Frontend | React 19 + TypeScript + Vite |

## Architecture

```
cmd/api/          HTTP handlers, middleware, routing
internal/
  auth/           JWT signing and validation
  db/             PostgreSQL connection pool, seed data
  env/            Environment variable helpers
  mailer/         Email client interface (SendGrid, SMTP)
  ratelimiter/    In-memory fixed-window rate limiter
  store/          Repository layer (PostgreSQL)
    cache/        Redis cache layer (read-through, write-through)
cmd/migrate/      Database migrations + seed script
scripts/          Concurrency tests
frontend/         React SPA
```

### Design Patterns

- **Repository pattern** — each domain entity (Users, Posts, Comments, Followers, Roles) has its own store with an interface, composed into a `Storage` aggregate. Makes mocking trivial.
- **Cache-aside** — user lookups check Redis first; on miss, fetch from Postgres and populate Redis (1-minute TTL). Falls back to Postgres-only if Redis is disabled.
- **Optimistic concurrency** — post updates use a `version` column. If two requests update the same post, the second fails with `ErrNotFound` and the client retries.
- **SAGA for email** — user registration creates the user, then sends a welcome email asynchronously. If the email fails after retries, the user is deleted as compensating action.
- **Graceful shutdown** — the server catches `SIGINT`/`SIGTERM`, drains in-flight requests with a 5-second deadline, then exits.
- **Interface-based mailer** — a `mailer.Client` interface lets the app switch between SendGrid (production) and Mailpit/SMTP (development) based on the `ENV` variable.

## Quick Start

**Prerequisites:** Go 1.26+, Node.js 20+, Docker, [golang-migrate CLI](https://github.com/golang-migrate/migrate), [air](https://github.com/air-verse/air) (optional, for live reload)

### 1. Clone and configure

```bash
git clone https://github.com/ematrito/go-social.git
cd go-social
cp .envrc.example .envrc
source .envrc
```

### 2. Start PostgreSQL and Redis

```bash
docker compose up -d
```

### 3. Run migrations and seed data

```bash
make migrate-up
make seed
```

This creates 100 users (`user_0` through `user_99`, password: `asdasdasd`), 200 posts, and 500 comments.

### 4. Start the backend

```bash
# With live reload (recommended):
air

# Or directly:
go run ./cmd/api
```

The API runs at `http://localhost:8080` by default.

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

### 6. Try it out

- **Register** a new account at `http://localhost:5173/register`
- Check Mailpit at `http://localhost:8025` for the activation email
- **Activate** your account by clicking the link
- **Login** with your credentials
- Browse the feed, create posts, comment, and follow other users

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/v1/health` | — | Health check |
| `GET` | `/v1/swagger/*` | — | Swagger UI |
| `POST` | `/v1/authentication/user` | — | Register |
| `POST` | `/v1/authentication/token` | — | Login (returns JWT) |
| `PUT` | `/v1/users/activate/{token}` | — | Activate account |
| `GET` | `/v1/users/{id}` | Bearer | Get user profile |
| `PUT` | `/v1/users/{id}/follow` | Bearer | Follow user |
| `PUT` | `/v1/users/{id}/unfollow` | Bearer | Unfollow user |
| `GET` | `/v1/users/feed` | Bearer | Get feed (search, sort, pagination) |
| `POST` | `/v1/posts` | Bearer | Create post |
| `GET` | `/v1/posts/{id}` | Bearer | Get post with comments |
| `PATCH` | `/v1/posts/{id}` | Bearer + moderator/owner | Update post |
| `DELETE` | `/v1/posts/{id}` | Bearer + admin/owner | Delete post |
| `POST` | `/v1/posts/{id}/comments` | Bearer | Add comment |

All responses use a JSON envelope: `{"data": <payload>}` on success, `{"error": "<message>"}` on error.

Full API docs available at `http://localhost:8080/v1/swagger/index.html` when the server is running.

## Environment Variables

See `.envrc.example` for the complete list. Key variables:

| Variable | Default | Description |
|---|---|---|
| `ADDR` | `:8080` | Server listen address |
| `DB_ADDR` | `postgres://...` | PostgreSQL connection string |
| `AUTH_TOKEN_SECRET` | `gophersocial-dev-secret` | JWT signing secret (change in prod!) |
| `AUTH_BASIC_USER` | `dev` | Basic auth username for `/v1/metrics` |
| `AUTH_BASIC_PASS` | `dev` | Basic auth password for `/v1/metrics` |
| `REDIS_ENABLED` | `false` | Enable Redis caching |
| `ENV` | `development` | `development` uses SMTP/Mailpit, otherwise SendGrid |

## Makefile

```bash
make migrate-up          # Apply all pending migrations
make migrate-down [N]    # Roll back N migrations
make migration NAME=...  # Create a new migration pair
make seed                # Seed database with sample data
make gen-docs            # Regenerate Swagger docs
make test                # Run all tests
```

## Running Tests

```bash
make test
```

Tests use the `test_utils.go` helper which creates an isolated test application with a mock authenticator and rate limiter.

## CI/CD

Three GitHub Actions workflows run on push to `main`:

| Workflow | Trigger | What it does |
|---|---|---|
| `audit.yaml` | push, PR to main | `go mod verify` → `go build` → `go vet` → `staticcheck` → `go test -race` |
| `release-please.yaml` | push to main | [Release Please](https://github.com/googleapis/release-please) — auto-creates release PRs and changelog entries from conventional commits |
| `update-api-version.yaml` | push to main | Extracts version from CHANGELOG.md, syncs it to `cmd/api/main.go`, commits the change |

## Deployment

The `Dockerfile` is a multi-stage build producing a scratch-based image. Build:

```bash
docker build -t gophersocial .
docker run -p 8080:8080 --env-file .envrc gophersocial
```

For Google Cloud Run or similar, set the environment variables and let the container listen on `:8080` (the default).
