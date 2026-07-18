# Techzu Social Zeo — Mobile App

React Native app built with **Expo (SDK 57), TypeScript, expo-router, TanStack Query**, and **expo-notifications** for FCM push.

## Features

- Onboarding/welcome screen, login / signup with inline validation
- Feed: infinite scroll, pull-to-refresh, newest first, inline post composer
- Filter feed by username (server-side prefix search; tap any author to filter)
- Like/unlike posts with optimistic UI and a spring-bounce heart animation
- Inline comment threads: comment, reply (one level deep), like a comment
- `@mention` autocomplete while typing a comment, mentions rendered as links
- Public profile screens (`/profile/[username]`) — join date, post count, their posts
- Activity screen: like/comment/reply/mention notifications with unread badge, plus in-app toast on new activity
- FCM push notifications; tapping one deep-links to the post
- Light / dark / system theme, switchable from Settings
- Tablet-friendly: content column caps at 640 px and centers on wide screens

## Project structure

```
app/                        expo-router routes
├── _layout.tsx              providers (React Query, Auth, Toast) + root stack
├── index.tsx                entry redirect (session → feed, else welcome)
├── (auth)/                  welcome, login, signup
└── (app)/                   authenticated area (guard + push registration)
    ├── (tabs)/               Feed · Activity · Settings
    ├── post/[id].tsx         post detail + comments
    └── profile/[username].tsx  public profile + their posts
src/
├── api/                     axios client, React Query hooks, types
├── auth/                    AuthContext + secure token storage
├── components/              PostCard, PostComments, PostComposer, MentionAutocomplete,
│                             Avatar, GlassSurface, Toast, skeleton/status states…
├── hooks/                   useMentionSuggestions, useTextTruncation, useDebouncedValue
├── notifications/push.ts    FCM token registration + tap handling
└── theme/                   ThemeContext (light/dark/system), palettes, shared style hooks
```

## Running in development

```bash
cd mobile
npm install
npm start          # scan QR with Expo Go, or press a / w
```

- **API URL:** in dev the app automatically targets port `4000` on the machine running Metro (works on devices/emulators on the same network). Make sure the backend is running (`cd backend && npm run dev`).
- To point somewhere else, set `EXPO_PUBLIC_API_URL` (e.g. in `.env` or the shell).
- **Note:** push notifications do not work in Expo Go on Android (SDK 53+) or on web — everything else does. Use a development/preview build for push.

## Firebase (FCM) setup

1. Create a Firebase project → add an **Android app** with package name `com.shibly.minisocialfeed`.
2. Download `google-services.json` into `mobile/`.
3. Reference it in `app.json`:
   ```json
   "android": { "googleServicesFile": "./google-services.json", ... }
   ```
4. Backend: generate a service-account key (Project settings → Service accounts) and set `FIREBASE_SERVICE_ACCOUNT_BASE64` (see `backend/.env.example`).

## Building the APK (EAS)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

- The `preview` profile in [eas.json](eas.json) produces an installable **APK** and bakes in `EXPO_PUBLIC_API_URL` — set it to the deployed backend URL first.
- Download the APK from the EAS build page when it finishes.

## Push notification flow (device)

1. On sign-in the app creates the Android notification channel, requests permission, fetches the **native FCM device token**, and registers it with the backend.
2. When another user likes/comments on your post, the backend sends an FCM message; it arrives even when the app is backgrounded.
3. Tapping the notification opens the app directly on that post. The token is detached on logout.
