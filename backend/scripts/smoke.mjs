/**
 * End-to-end smoke test for the Mini Social Feed API.
 *
 * Usage:
 *   node scripts/smoke.mjs                       # against http://localhost:4000
 *   BASE_URL=https://your-api.onrender.com node scripts/smoke.mjs
 *
 * Creates throwaway users (random suffix) so it can be re-run safely.
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4000';
const suffix = Math.random().toString(36).slice(2, 8);

let passed = 0;
let failed = 0;

function check(name, condition, extra = '') {
  if (condition) {
    passed++;
    console.log(`  ✔ ${name}`);
  } else {
    failed++;
    console.error(`  ✘ ${name}${extra ? ` — ${extra}` : ''}`);
  }
}

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON response */
  }
  return { status: res.status, json };
}

console.log(`Smoke testing ${BASE_URL}\n`);

// ── Health ──────────────────────────────────────────────────────────
{
  const r = await api('GET', '/health');
  check('GET /health returns ok', r.status === 200 && r.json?.data?.status === 'ok');
}

// ── Auth ────────────────────────────────────────────────────────────
const alice = { username: `alice_${suffix}`, email: `alice_${suffix}@test.dev`, password: 'secret123' };
const bob = { username: `bob_${suffix}`, email: `bob_${suffix}@test.dev`, password: 'secret123' };

let aliceToken, bobToken, aliceId;
{
  const r = await api('POST', '/api/auth/signup', { body: alice });
  check('signup returns 201 + token + user', r.status === 201 && !!r.json?.data?.token && r.json?.data?.user?.username === alice.username);
  check('signup response does not leak passwordHash', r.json?.data?.user?.passwordHash === undefined);
  aliceToken = r.json?.data?.token;
  aliceId = r.json?.data?.user?._id;

  const r2 = await api('POST', '/api/auth/signup', { body: bob });
  check('second user signup works', r2.status === 201);
  bobToken = r2.json?.data?.token;

  const dup = await api('POST', '/api/auth/signup', { body: alice });
  check('duplicate signup → 409', dup.status === 409);

  const bad = await api('POST', '/api/auth/signup', { body: { username: 'x', email: 'not-an-email', password: '1' } });
  check('invalid signup body → 400 with details', bad.status === 400 && Array.isArray(bad.json?.error?.details));

  const login = await api('POST', '/api/auth/login', { body: { identifier: alice.username, password: alice.password } });
  check('login with username works', login.status === 200 && !!login.json?.data?.token);

  const loginEmail = await api('POST', '/api/auth/login', { body: { identifier: alice.email, password: alice.password } });
  check('login with email works', loginEmail.status === 200);

  const wrong = await api('POST', '/api/auth/login', { body: { identifier: alice.username, password: 'wrong' } });
  check('wrong password → 401', wrong.status === 401);

  const me = await api('GET', '/api/auth/me', { token: aliceToken });
  check('GET /auth/me returns current user', me.status === 200 && me.json?.data?.user?.username === alice.username);
}

// ── Posts ───────────────────────────────────────────────────────────
let postId;
{
  const noAuth = await api('POST', '/api/posts', { body: { text: 'hi' } });
  check('create post without token → 401', noAuth.status === 401);

  const badToken = await api('GET', '/api/posts', { token: 'garbage' });
  check('request with invalid token → 401', badToken.status === 401);

  const r = await api('POST', '/api/posts', { token: aliceToken, body: { text: `Hello from ${alice.username}!` } });
  check('create post → 201 with serialized post', r.status === 201 && r.json?.data?.post?.author?.username === alice.username);
  postId = r.json?.data?.post?.id;

  const empty = await api('POST', '/api/posts', { token: aliceToken, body: { text: '   ' } });
  check('empty post text → 400', empty.status === 400);

  const tooLong = await api('POST', '/api/posts', { token: aliceToken, body: { text: 'x'.repeat(501) } });
  check('post over 500 chars → 400', tooLong.status === 400);

  // a few extra posts for pagination
  for (let i = 1; i <= 3; i++) {
    await api('POST', '/api/posts', { token: bobToken, body: { text: `Bob post #${i}` } });
  }

  const feed = await api('GET', '/api/posts?page=1&limit=2', { token: aliceToken });
  const posts = feed.json?.data?.posts ?? [];
  check('feed paginates (limit=2)', feed.status === 200 && posts.length === 2);
  check('feed is newest-first', posts.length === 2 && new Date(posts[0].createdAt) >= new Date(posts[1].createdAt));
  check('feed reports hasMore', feed.json?.data?.hasMore === true);

  const filtered = await api('GET', `/api/posts?username=${alice.username}`, { token: bobToken });
  const fp = filtered.json?.data?.posts ?? [];
  check('username filter returns only that user', filtered.status === 200 && fp.length >= 1 && fp.every((p) => p.author.username === alice.username));

  const prefix = await api('GET', `/api/posts?username=alice_${suffix.slice(0, 3)}`, { token: bobToken });
  check('username prefix match works', (prefix.json?.data?.posts ?? []).length >= 1);

  const none = await api('GET', '/api/posts?username=nosuchuser_zzz', { token: bobToken });
  check('unknown username filter → empty result', none.status === 200 && none.json?.data?.posts?.length === 0);

  const badPage = await api('GET', '/api/posts?page=0', { token: aliceToken });
  check('page=0 → 400', badPage.status === 400);
}

// ── Likes ───────────────────────────────────────────────────────────
{
  const like = await api('POST', `/api/posts/${postId}/like`, { token: bobToken });
  check('like → liked:true, likeCount:1', like.status === 200 && like.json?.data?.liked === true && like.json?.data?.likeCount === 1);

  const unlike = await api('POST', `/api/posts/${postId}/like`, { token: bobToken });
  check('like again toggles off', unlike.status === 200 && unlike.json?.data?.liked === false && unlike.json?.data?.likeCount === 0);

  const relike = await api('POST', `/api/posts/${postId}/like`, { token: bobToken });
  check('re-like works', relike.json?.data?.liked === true);

  const feed = await api('GET', `/api/posts?username=${alice.username}`, { token: bobToken });
  const post = feed.json?.data?.posts?.find((p) => p.id === postId);
  check('feed shows likedByMe for liker', post?.likedByMe === true && post?.likeCount === 1);

  const feedAlice = await api('GET', `/api/posts?username=${alice.username}`, { token: aliceToken });
  const postA = feedAlice.json?.data?.posts?.find((p) => p.id === postId);
  check('feed shows likedByMe=false for non-liker', postA?.likedByMe === false);

  const badId = await api('POST', '/api/posts/not-an-id/like', { token: bobToken });
  check('invalid post id → 400', badId.status === 400);

  const missing = await api('POST', '/api/posts/64b000000000000000000000/like', { token: bobToken });
  check('nonexistent post → 404', missing.status === 404);
}

// ── Comments ────────────────────────────────────────────────────────
{
  const c = await api('POST', `/api/posts/${postId}/comment`, { token: bobToken, body: { text: 'Nice post!' } });
  check('comment → 201 with author', c.status === 201 && c.json?.data?.comment?.author?.username === bob.username);

  const empty = await api('POST', `/api/posts/${postId}/comment`, { token: bobToken, body: { text: '' } });
  check('empty comment → 400', empty.status === 400);

  await api('POST', `/api/posts/${postId}/comment`, { token: aliceToken, body: { text: 'Thanks Bob (self-comment, no notif)' } });

  const list = await api('GET', `/api/posts/${postId}/comments`, { token: aliceToken });
  check('list comments returns both', list.status === 200 && list.json?.data?.comments?.length === 2);

  const feed = await api('GET', `/api/posts?username=${alice.username}`, { token: aliceToken });
  const post = feed.json?.data?.posts?.find((p) => p.id === postId);
  check('post commentCount incremented', post?.commentCount === 2);
}

// ── Notifications ───────────────────────────────────────────────────
{
  await new Promise((r) => setTimeout(r, 500)); // notifications are fire-and-forget

  const n = await api('GET', '/api/notifications', { token: aliceToken });
  const items = n.json?.data?.notifications ?? [];
  const types = items.map((i) => i.type).sort();
  check('alice has like + comment notifications', n.status === 200 && types.includes('like') && types.includes('comment'));
  check('no self-notification recorded', items.length === 2, `got ${items.length}`);
  check('unreadCount matches', n.json?.data?.unreadCount === 2);
  check('notification includes actor + post snippet', items[0]?.actor?.username === bob.username && typeof items[0]?.post?.text === 'string');

  const bobN = await api('GET', '/api/notifications', { token: bobToken });
  check('bob has no notifications', bobN.json?.data?.notifications?.length === 0);

  const mark = await api('POST', '/api/notifications/mark-read', { token: aliceToken });
  check('mark-read succeeds', mark.status === 200);

  const after = await api('GET', '/api/notifications', { token: aliceToken });
  check('unreadCount is 0 after mark-read', after.json?.data?.unreadCount === 0);
}

// ── FCM token registration ──────────────────────────────────────────
{
  const reg = await api('PUT', '/api/users/me/fcm-token', { token: aliceToken, body: { token: 'fake-device-token-123' } });
  check('register FCM token', reg.status === 200);

  const reg2 = await api('PUT', '/api/users/me/fcm-token', { token: bobToken, body: { token: 'fake-device-token-123' } });
  check('same device token moves to new account', reg2.status === 200);

  const del = await api('DELETE', '/api/users/me/fcm-token', { token: bobToken, body: { token: 'fake-device-token-123' } });
  check('remove FCM token', del.status === 200);

  const bad = await api('PUT', '/api/users/me/fcm-token', { token: aliceToken, body: {} });
  check('missing token body → 400', bad.status === 400);
}

// ── Misc ────────────────────────────────────────────────────────────
{
  const r = await api('GET', '/api/nope');
  check('unknown route → 404 JSON', r.status === 404 && r.json?.success === false);

  const badJson = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{broken',
  });
  check('malformed JSON → 400', badJson.status === 400);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
