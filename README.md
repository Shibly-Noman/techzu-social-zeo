# Techzu Social Zeo

A lightweight social media application where users can post text updates, browse a shared feed, like and comment on posts, and receive real-time push notifications (Firebase Cloud Messaging) when their posts get interactions.

> **Deliverable links**
>
> - **APK download:** _(Google Drive link — added on release)_
> - **Live API:** _(Render URL — added on deploy)_

## Repository structure

| Folder | Description |
|---|---|
| [`backend/`](backend/) | Node.js + Express + TypeScript REST API (MongoDB Atlas, JWT auth, FCM) |
| [`mobile/`](mobile/) | React Native (Expo) + TypeScript mobile app |

## Tech stack

- **Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose), JWT, Zod, firebase-admin (FCM HTTP v1)
- **Mobile:** React Native, Expo (expo-router), TanStack Query, Axios, expo-notifications, expo-secure-store
- **Infra:** MongoDB Atlas, Render (API hosting), EAS Build (APK), Firebase Cloud Messaging

## Features

- Signup / login with JWT authentication
- Create text-only posts
- Shared feed — paginated, newest first, infinite scroll, pull-to-refresh
- Filter feed by username (server-side search)
- Like / unlike posts (optimistic UI)
- Comment on posts
- Push notifications via FCM when someone likes or comments on your post
- In-app notifications screen with unread badge
- Tablet-responsive layouts

## Quick start

See per-folder READMEs for full instructions:

- [Backend setup & API documentation](backend/README.md)
- [Mobile app setup & build instructions](mobile/README.md)

## Architecture overview

```
┌─────────────┐        HTTPS/JSON         ┌──────────────┐
│  Expo App   │ ────────────────────────► │  Express API │
│ (React      │ ◄──────────────────────── │  (Render)    │
│  Native)    │                           └──────┬───────┘
└──────▲──────┘                                  │
       │                                 ┌───────▼───────┐
       │        FCM push                 │ MongoDB Atlas │
       └──────────────┐                  └───────────────┘
                ┌─────┴──────┐
                │  Firebase  │ ◄── firebase-admin (HTTP v1)
                │    FCM     │      sends on like/comment
                └────────────┘
```
