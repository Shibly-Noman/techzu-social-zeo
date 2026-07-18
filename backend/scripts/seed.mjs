/**
 * Demo content seeder for Techzu Social Zeo.
 *
 * Populates realistic, on-theme content — a viral rumor that Shibly is
 * joining Techzu — so every feature is immediately visible to an evaluator
 * without hunting: long-post "See more" truncation, a guaranteed
 * comment + comment-like + reply thread, @mentions, and unevenly varied
 * like/comment counts across posts.
 *
 * SAFE TO RE-RUN:
 *   - Users: signup is tried first; if the username already exists (409),
 *     this logs in instead of failing.
 *   - Posts/comments/replies: each is only created if an item with the
 *     exact same author + text doesn't already exist — re-running this
 *     script will not duplicate content.
 *   - Likes (post + comment): checked via `likedByMe` before toggling, so
 *     re-running never accidentally *un*-likes something.
 *
 * Usage:
 *   node scripts/seed.mjs                                     # http://localhost:4000
 *   BASE_URL=https://techzu-social-zeo.onrender.com node scripts/seed.mjs
 *
 * This writes real data. Double-check BASE_URL before running against a
 * live deployment.
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4000';
const SEED_PASSWORD = 'TechzuDemoSeed!1';
const MAX_POST_CHARS = 500;
const MAX_COMMENT_CHARS = 300;

console.log(`Seeding ${BASE_URL}\n`);

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

function assertLimit(label, text, max) {
  if (text.length > max) {
    throw new Error(`${label} is ${text.length} chars, over the ${max}-char limit:\n${text}`);
  }
}

// ── Users ───────────────────────────────────────────────────────────────
const USER_LIST = [
  'shibly_dev',
  'sundar_parody',
  'techzu_official',
  'priya_builds',
  'marcus_ships',
  'alex_debugs',
  'nina_hacks',
  'devraj_codes',
  'jay_watches',
  'sara_ships',
].map((username) => ({ username, email: `${username.replace(/_/g, '.')}@techzuseed.dev` }));

const users = {}; // username -> { token, id }

async function ensureUser({ username, email }) {
  // Login first (not signup-then-fallback): on a re-run every user already
  // exists, so this costs 1 auth-rate-limited request per user instead of 2
  // — matters because /api/auth/* is capped at 30 requests/15min/IP.
  const login = await api('POST', '/api/auth/login', {
    body: { identifier: username, password: SEED_PASSWORD },
  });
  if (login.status === 200) {
    console.log(`  = logged in as @${username} (already existed)`);
    users[username] = { token: login.json.data.token, id: login.json.data.user._id };
    return;
  }
  const signup = await api('POST', '/api/auth/signup', {
    body: { username, email, password: SEED_PASSWORD },
  });
  if (signup.status !== 201) {
    throw new Error(`Could not create or log in as @${username}: ${JSON.stringify(login.json)} / ${JSON.stringify(signup.json)}`);
  }
  console.log(`  + created @${username}`);
  users[username] = { token: signup.json.data.token, id: signup.json.data.user._id };
}

// ── Posts ───────────────────────────────────────────────────────────────
// Theme: viral tech-world rumor that Shibly (genius engineer) is joining Techzu.
const POSTS = [
  {
    key: 'shibly_announcement',
    author: 'shibly_dev',
    text:
      "Some personal news \u{1F440} After a lot of thinking (and even more coffee), I've decided to join Techzu as a senior engineer.\n\n" +
      "It's been a whirlwind couple of weeks since word started getting around, and I'm equal parts stunned and grateful for how many of you reached out. There were some genuinely great offers on the table, but the team and the mission tipped it for me.\n\n" +
      'More details soon. For now: thank you, thank you, thank you.',
  },
  {
    key: 'techzu_welcome',
    author: 'techzu_official',
    text:
      "\u{1F389} It's official: Shibly is joining Techzu! We've been trying to get this hire across the line for months, and we still can't quite believe it worked. Buckle up — this is going to be fun.",
  },
  {
    key: 'priya_hype',
    author: 'priya_builds',
    text:
      "Wait, THE Shibly is going to Techzu?? I've been following his work for years and this is honestly one of the best hires I've seen announced in a long time \u{1F525}",
  },
  {
    key: 'marcus_rumor',
    author: 'marcus_ships',
    text:
      "Rumor mill is in overdrive today. Three different people sent me the same screenshot about Shibly and Techzu before I'd even had my coffee. If true, this is a genuinely wild get for them.",
  },
  {
    key: 'alex_humor',
    author: 'alex_debugs',
    text:
      "Meanwhile in my codebase: works locally, works in CI, explodes in prod. \u{1F605} Anyway yes, I also heard about the Shibly → Techzu thing — incredible timing to bury my own shame under someone else's good news.",
  },
  {
    key: 'sundar_parody',
    author: 'sundar_parody',
    text:
      '[parody account, not a real quote \u{1F604}] Confession: we are still very much behind in the frontier model race, and yes — I did quietly try to recruit Shibly. Alas, he’s headed to Techzu instead. A humbling week for all of us.',
  },
  {
    key: 'nina_humor',
    author: 'nina_hacks',
    text:
      "Status update: replaced three days of 'why is this API rate-limiting me' with one Shibly-is-joining-Techzu rumor, and suddenly my whole team is in a good mood. Morale > uptime today. \u{1F680}",
  },
  {
    key: 'devraj_longform',
    author: 'devraj_codes',
    text:
      "Okay I need to actually write this down because I keep getting DMs asking if it's true. Yes — from everything I'm hearing, Shibly is genuinely moving to Techzu.\n\n" +
      'I worked adjacent to him on a couple of things a while back, and honestly this checks out with everything I know about how he thinks about problems.\n\n' +
      "What I find funniest is watching the timeline react in real time — half hype, half 'wait is this real'. Either way: congrats to Techzu, and congrats to Shibly. Well deserved.",
  },
  {
    key: 'jay_commentary',
    author: 'jay_watches',
    text:
      "The engagement on the Shibly-joins-Techzu posts today is genuinely wild for what's still an unconfirmed rumor. Tech Twitter really does not need much to go feral, huh.",
  },
  {
    key: 'sara_hype',
    author: 'sara_ships',
    text:
      "Okay but if the Shibly → Techzu rumor is true, that's one of the best hiring moves I've seen all year. Techzu's roadmap just got a lot more interesting. \u{1F44F}",
  },
];

const postIds = {}; // key -> id

async function findExistingPost(author, text) {
  const { json } = await api('GET', `/api/posts?username=${author}&exact=true&limit=50`, {
    token: users[author].token,
  });
  return (json?.data?.posts ?? []).find((p) => p.text === text);
}

async function ensurePost({ key, author, text }) {
  assertLimit(`Post "${key}" by @${author}`, text, MAX_POST_CHARS);
  const existing = await findExistingPost(author, text);
  if (existing) {
    postIds[key] = existing.id;
    console.log(`  = post "${key}" already exists (${existing.id})`);
    return;
  }
  const { status, json } = await api('POST', '/api/posts', { token: users[author].token, body: { text } });
  if (status !== 201) throw new Error(`Failed to create post "${key}": ${JSON.stringify(json)}`);
  postIds[key] = json.data.post.id;
  console.log(`  + created post "${key}" (${json.data.post.id})`);
}

// ── Post likes (deliberately uneven — the flagship post gets the most) ──
const POST_LIKES = {
  shibly_announcement: ['sundar_parody', 'techzu_official', 'priya_builds', 'marcus_ships', 'alex_debugs', 'nina_hacks', 'devraj_codes', 'jay_watches', 'sara_ships'],
  techzu_welcome: ['shibly_dev', 'priya_builds', 'marcus_ships', 'alex_debugs', 'nina_hacks', 'sara_ships'],
  priya_hype: ['shibly_dev', 'marcus_ships', 'jay_watches'],
  marcus_rumor: ['shibly_dev', 'alex_debugs'],
  alex_humor: ['shibly_dev', 'priya_builds', 'nina_hacks', 'devraj_codes'],
  sundar_parody: ['shibly_dev', 'priya_builds', 'marcus_ships', 'alex_debugs', 'jay_watches'],
  nina_humor: ['shibly_dev', 'sara_ships', 'devraj_codes'],
  devraj_longform: ['shibly_dev', 'priya_builds', 'nina_hacks', 'jay_watches', 'sara_ships'],
  jay_commentary: ['shibly_dev', 'marcus_ships'],
  sara_hype: ['shibly_dev', 'priya_builds', 'nina_hacks'],
};

async function isPostLikedBy(postId, author, liker) {
  const { json } = await api('GET', `/api/posts?username=${author}&exact=true&limit=50`, {
    token: users[liker].token,
  });
  return (json?.data?.posts ?? []).find((p) => p.id === postId)?.likedByMe === true;
}

async function ensurePostLike(postKey, author, liker) {
  const postId = postIds[postKey];
  if (await isPostLikedBy(postId, author, liker)) return;
  const { status, json } = await api('POST', `/api/posts/${postId}/like`, { token: users[liker].token });
  if (status !== 200) throw new Error(`@${liker} failed to like post "${postKey}": ${JSON.stringify(json)}`);
}

// ── Comments (includes the guaranteed thread + guaranteed @mentions) ────
// Each entry: { post, author, text, parent? } — `parent` names another
// comment entry's `id` (set after creation) to post it as a reply.
const COMMENTS = [
  { id: 'c_priya_on_shibly', post: 'shibly_announcement', author: 'priya_builds', text: 'So happy for you, this is huge!! \u{1F389}' },
  { id: 'c_marcus_on_shibly', post: 'shibly_announcement', author: 'marcus_ships', text: 'Well deserved. Excited to see what you build next \u{1F44F}' },
  // Guaranteed reply, and guaranteed @mention #1.
  { id: 'r_shibly_reply', post: 'shibly_announcement', author: 'shibly_dev', text: '@priya_builds means a lot \u{1F64F}', parent: 'c_priya_on_shibly' },

  // Guaranteed @mention #2.
  { id: 'c_nina_on_techzu', post: 'techzu_welcome', author: 'nina_hacks', text: '@shibly_dev congrats again, still can’t believe we pulled this off \u{1F604}' },
  { id: 'c_sara_on_techzu', post: 'techzu_welcome', author: 'sara_ships', text: 'This is going to be such a good hire, congrats to the whole team.' },

  // Guaranteed @mention #3.
  { id: 'c_jay_on_parody', post: 'sundar_parody', author: 'jay_watches', text: '@sundar_parody \u{1F602}\u{1F602} this is amazing, sending it to my whole team' },
  { id: 'c_alex_on_parody', post: 'sundar_parody', author: 'alex_debugs', text: 'The frontier model race callout is sending me \u{1F480}' },

  { id: 'c_devraj_on_alex', post: 'alex_humor', author: 'devraj_codes', text: 'Felt this in my soul \u{1F605}' },
  { id: 'c_priya_on_devraj', post: 'devraj_longform', author: 'priya_builds', text: 'This is such a good writeup of the vibe today lol' },
];

const commentIds = {}; // COMMENTS entry id -> real comment id

async function findExistingComment(postId, author, text, viewerToken) {
  const { json } = await api('GET', `/api/posts/${postId}/comments?limit=50`, { token: viewerToken });
  return (json?.data?.comments ?? []).find((c) => c.author.username === author && c.text === text);
}

async function findExistingReply(parentCommentId, author, text, viewerToken) {
  const { json } = await api('GET', `/api/comments/${parentCommentId}/replies?limit=50`, { token: viewerToken });
  return (json?.data?.replies ?? []).find((c) => c.author.username === author && c.text === text);
}

async function ensureComment(entry) {
  assertLimit(`Comment "${entry.id}" by @${entry.author}`, entry.text, MAX_COMMENT_CHARS);
  const postId = postIds[entry.post];
  const authorToken = users[entry.author].token;
  const parentCommentId = entry.parent ? commentIds[entry.parent] : undefined;

  const existing = parentCommentId
    ? await findExistingReply(parentCommentId, entry.author, entry.text, authorToken)
    : await findExistingComment(postId, entry.author, entry.text, authorToken);

  if (existing) {
    commentIds[entry.id] = existing.id;
    console.log(`  = comment "${entry.id}" already exists (${existing.id})`);
    return;
  }

  const { status, json } = await api('POST', `/api/posts/${postId}/comment`, {
    token: authorToken,
    body: { text: entry.text, ...(parentCommentId ? { parentCommentId } : {}) },
  });
  if (status !== 201) throw new Error(`Failed to create comment "${entry.id}": ${JSON.stringify(json)}`);
  commentIds[entry.id] = json.data.comment.id;
  console.log(`  + created comment "${entry.id}" (${json.data.comment.id})`);
}

// ── Comment likes (includes the guaranteed thread's like) ──────────────
const COMMENT_LIKES = {
  c_priya_on_shibly: ['marcus_ships', 'nina_hacks'],
  c_nina_on_techzu: ['sara_ships'],
};

async function isCommentLikedBy(postKey, commentEntryId, liker) {
  const postId = postIds[postKey];
  const { json } = await api('GET', `/api/posts/${postId}/comments?limit=50`, { token: users[liker].token });
  return (json?.data?.comments ?? []).find((c) => c.id === commentIds[commentEntryId])?.likedByMe === true;
}

async function ensureCommentLike(commentEntryId, postKey, liker) {
  if (await isCommentLikedBy(postKey, commentEntryId, liker)) return;
  const commentId = commentIds[commentEntryId];
  const { status, json } = await api('POST', `/api/comments/${commentId}/like`, { token: users[liker].token });
  if (status !== 200) throw new Error(`@${liker} failed to like comment "${commentEntryId}": ${JSON.stringify(json)}`);
}

// ── Run ──────────────────────────────────────────────────────────────────
console.log('Users:');
for (const user of USER_LIST) await ensureUser(user);

console.log('\nPosts:');
for (const post of POSTS) await ensurePost(post);

console.log('\nPost likes:');
for (const [postKey, likers] of Object.entries(POST_LIKES)) {
  for (const liker of likers) await ensurePostLike(postKey, POSTS.find((p) => p.key === postKey).author, liker);
}
console.log(`  applied (idempotently) across ${Object.keys(POST_LIKES).length} posts`);

console.log('\nComments & replies:');
for (const entry of COMMENTS) await ensureComment(entry);

console.log('\nComment likes:');
for (const [commentEntryId, likers] of Object.entries(COMMENT_LIKES)) {
  const postKey = COMMENTS.find((c) => c.id === commentEntryId).post;
  for (const liker of likers) await ensureCommentLike(commentEntryId, postKey, liker);
}
console.log(`  applied (idempotently) across ${Object.keys(COMMENT_LIKES).length} comments`);

console.log('\n✓ Seed complete.\n');
console.log('Spot-check these:');
console.log(`  Long post (truncation):     GET /api/posts/${postIds.shibly_announcement}`);
console.log(`  Long post #2 (truncation):  GET /api/posts/${postIds.devraj_longform}`);
console.log(`  Guaranteed thread post:     GET /api/posts/${postIds.shibly_announcement}`);
console.log(`    top-level comment (liked): ${commentIds.c_priya_on_shibly}`);
console.log(`    reply (@mention):          ${commentIds.r_shibly_reply}`);
console.log(`  Parody post:                GET /api/posts/${postIds.sundar_parody}`);
console.log(`  @mention comments: ${commentIds.r_shibly_reply}, ${commentIds.c_nina_on_techzu}, ${commentIds.c_jay_on_parody}`);
