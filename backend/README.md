# Techzu Social Zeo — Backend

REST API built with **Node.js, Express 5, TypeScript, MongoDB (Mongoose)**, secured with **JWT**, and integrated with **Firebase Cloud Messaging** for push notifications.

## Setup

### Prerequisites

- Node.js ≥ 20
- A MongoDB instance — either [MongoDB Atlas](https://www.mongodb.com/atlas) (free M0 tier) or local Docker:
  ```bash
  docker run -d --name mini-social-mongo -p 27017:27017 mongo:7
  ```

### Run locally

```bash
cd backend
npm install
cp .env.example .env    # then edit values
npm run dev             # tsx watch mode on http://localhost:4000
```

### Run with Docker

The whole backend (API + MongoDB) can run with one command from the **repo root**:

```bash
docker compose up --build
```

- API on http://localhost:4000; MongoDB is internal to the compose network (not published).
- Data persists in the `mongo-data` volume; `docker compose down -v` wipes it.
- Override secrets via shell env or a root `.env` file: `JWT_SECRET`, `FIREBASE_SERVICE_ACCOUNT_BASE64`.

[backend/Dockerfile](Dockerfile) is a multi-stage build: TypeScript compiles in a build stage, and the runtime image is `node:20-alpine` with production dependencies only, running as the non-root `node` user.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | no (4000) | HTTP port |
| `MONGODB_URI` | **yes** | MongoDB connection string |
| `JWT_SECRET` | **yes** | ≥16-char secret for signing JWTs |
| `JWT_EXPIRES_IN` | no (`7d`) | Token lifetime |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | no | Base64 of the Firebase service-account JSON. Push is disabled (logged no-op) when unset |
| `CORS_ORIGIN` | no (`*`) | Comma-separated allowed origins |

### Scripts

| Script | Description |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` / `npm start` | Compile to `dist/` and run |
| `npm run typecheck` | TypeScript check |
| `npm run smoke` | 72-check end-to-end API test (`BASE_URL` env to target a deployment) |

## API documentation

Base URL: `/api`. All request/response bodies are JSON.

**Response envelope** — every endpoint returns:

```jsonc
// success
{ "success": true, "data": { ... } }
// error
{ "success": false, "error": { "message": "...", "details": [ ... ] } }
```

**Authentication** — endpoints marked 🔒 require `Authorization: Bearer <token>`.

### Auth

#### `POST /api/auth/signup`

| Field | Rules |
|---|---|
| `username` | 3–20 chars, `a-z 0-9 _`, unique |
| `email` | valid email, unique |
| `password` | 6–128 chars |

Returns `201` with `{ token, user }`. `409` if username/email taken.

#### `POST /api/auth/login`

| Field | Rules |
|---|---|
| `identifier` | username **or** email |
| `password` | — |

Returns `200` with `{ token, user }`. `401` on bad credentials.
Auth routes are rate-limited (30 requests / 15 min / IP).

#### `GET /api/auth/me` 🔒

Returns the authenticated user.

### Posts

#### `POST /api/posts` 🔒

Body: `{ "text": "1–500 chars" }` → `201` with the created post.

#### `GET /api/posts` 🔒

Query params:

| Param | Default | Description |
|---|---|---|
| `page` | 1 | 1-based page number |
| `limit` | 10 | Page size (max 50) |
| `username` | — | Case-insensitive **prefix** filter on author username |
| `exact` | `false` | When `true`, `username` must match exactly (used by profile pages) |

Returns newest-first:

```jsonc
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "…",
        "text": "…",
        "author": { "id": "…", "username": "alice" },
        "likeCount": 3,
        "commentCount": 1,
        "likedByMe": true,
        "createdAt": "2026-07-16T10:00:00.000Z"
      }
    ],
    "page": 1, "limit": 10, "total": 42, "hasMore": true
  }
}
```

#### `GET /api/posts/:id` 🔒

Single post (same shape as feed items). `404` if missing, `400` on malformed id.

#### `POST /api/posts/:id/like` 🔒

**Toggles** like state. Returns `{ liked: boolean, likeCount: number }`.
Sends an FCM push + records a notification for the post author (not on self-like; re-liking doesn't re-notify).

#### `POST /api/posts/:id/comment` 🔒

Body: `{ "text": "1–300 chars", "parentCommentId"?: "…" }` → `201` with the created comment.

- Without `parentCommentId`: a top-level comment. Notifies the post author (not on self-comment).
- With `parentCommentId`: a **reply** to that top-level comment. Notifies the parent comment's author. Replies are **one level deep only** — replying to a reply returns `400`.
- Any `@username` mentions in the text notify each mentioned user (case-insensitive, dedup'd), regardless of top-level/reply.

Comment shape (used consistently for top-level comments, replies, and this endpoint's response):

```jsonc
{
  "id": "…",
  "text": "…",
  "author": { "id": "…", "username": "bob" },
  "postId": "…",
  "parentId": null,           // set for replies
  "likeCount": 0,
  "likedByMe": false,
  "replyCount": 0,
  "createdAt": "2026-07-16T10:00:00.000Z"
}
```

#### `GET /api/posts/:id/comments` 🔒

Paginated (`page`, `limit`), oldest-first, **top-level comments only**. Same pagination envelope as the feed.

### Comments

#### `POST /api/comments/:commentId/like` 🔒

**Toggles** like state on a comment (top-level or reply). Returns `{ liked: boolean, likeCount: number }`. Notifies the comment author (not on self-like; re-liking doesn't re-notify).

#### `GET /api/comments/:commentId/replies` 🔒

Paginated (`page`, `limit`), oldest-first, replies to the given top-level comment.

### Notifications

#### `GET /api/notifications` 🔒

Paginated, newest-first. Each item: `{ id, type: "like"|"comment"|"comment_like"|"reply"|"mention", actor, post: { id, text (snippet) }, commentText, read, createdAt }`. Response also includes `unreadCount`.

#### `POST /api/notifications/mark-read` 🔒

Marks all of the caller's notifications as read.

### Users

#### `GET /api/users/search?q=` 🔒

Username-prefix search (case-insensitive, max 8 results) — powers @mention autocomplete. Returns `{ users: [{ id, username }] }`.

#### `GET /api/users/:username` 🔒

Public profile lookup (case-insensitive). Returns `{ user: { id, username, createdAt, postCount } }`. `404` if the username doesn't exist.

> Combine with `GET /api/posts?username=<name>&exact=true` to list exactly that user's posts (the plain `username` filter is a prefix match; `exact=true` requires an exact match, used by profile pages).

### Device tokens

#### `PUT /api/users/me/fcm-token` 🔒

Body: `{ "token": "<FCM device token>" }`. Registers the device for push; a token previously attached to another account is moved to the caller.

#### `DELETE /api/users/me/fcm-token` 🔒

Body: `{ "token": "…" }`. Detaches the device (call on logout).

### Misc

- `GET /health` — liveness probe (no auth).

## Push notification flow

1. App obtains a native FCM device token (`expo-notifications`) and registers it via `PUT /api/users/me/fcm-token`.
2. An interaction happening — post like, top-level comment, comment like, reply, or `@mention` — records a `Notification` document (type `like` / `comment` / `comment_like` / `reply` / `mention`) and sends an FCM HTTP v1 message (`firebase-admin`) to **all** of the recipient's registered devices — fire-and-forget, so push failures never fail the API request.
3. Tokens rejected by FCM as unregistered/invalid are pruned automatically.
4. Self-interactions are never notified (including mentioning yourself); un-liking and re-liking doesn't notify twice.

## Project structure

```
src/
├── index.ts            bootstrap (DB connect, FCM init, listen)
├── app.ts              express app wiring (helmet, cors, routes, errors)
├── config/env.ts       zod-validated environment
├── schemas.ts          zod request schemas
├── models/             User, Post, Comment, Notification (Mongoose)
├── routes/             route definitions per resource (posts, comments, users, notifications, auth)
├── controllers/        request handlers
├── middleware/         requireAuth (JWT), validate (zod), errorHandler
├── services/           fcm.service (firebase-admin), notification.service (interactions + @mention parsing)
└── utils/              apiError, serializers (shared comment shape), regex helpers
```

## Deployment (Render)

- **Root directory:** `backend`
- With the root directory set, Render **auto-detects the [Dockerfile](Dockerfile)** and builds/runs the container image — no build or start command needed. (To force the native Node runtime instead, set language to Node with build `npm install && npm run build` and start `npm start`.)
- **Health check path:** `/health`
- Set env vars from the table above (use the base64 helper in `.env.example` for the Firebase service account). `MONGODB_URI` must point at MongoDB Atlas — the compose `mongo` service exists only for local development.
