This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Live activity notifications

The notification bell subscribes to `/api/notifications/stream` using SSE
(`EventSource`). MongoDB change streams notify connected clients when a new
`activity_logs` entry is committed, including entries written by another app
instance. The client reloads its filtered feed and unread count on each event.
Existing activity logging currently covers account and class operations through
`recordActivity`; new operations should call that helper after a successful write.

- MongoDB must be a replica set (including Atlas) or a sharded cluster, with
  permission to open a database change stream. A standalone MongoDB server does
  not support this feature.
- Hosting must support streaming responses for the Node.js route and allow at
  least 60 seconds per request. Disable reverse-proxy buffering for this endpoint
  (the route sends `X-Accel-Buffering: no`).
- Connections close after 55 seconds and automatically reconnect. A fresh snapshot
  on connection/reconnection recovers events missed while disconnected. Hidden
  tabs disconnect and reconnect when visible again.
- During a connection failure, the bell temporarily falls back to a 30-second
  refresh while SSE retries. Normal connected operation is event-driven.
- Session validity is checked on changes and heartbeats. Reading notifications in
  another tab and changing notification preferences also refresh the feed.
- No additional environment variables or Socket.IO server are required.

Run the notification and session regression tests with:

```bash
node --test --experimental-test-isolation=none tests/notifications.test.cjs tests/session.test.cjs
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
