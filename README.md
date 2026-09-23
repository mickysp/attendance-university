# Attendance University

A university classroom attendance management system built with Next.js, React, TypeScript, Tailwind CSS, and MongoDB.

## Features

- Manage classes, teachers, students, and enrollments.
- Configure attendance sessions and check in through links or QR codes.
- View attendance summaries and history.
- Manage user accounts and roles through Administrators.
- Update profiles, upload avatars, and switch between light and dark themes.
- Recover passwords using email OTP.

## Getting Started

Requires Node.js 20.19.0 or newer, npm, and access to MongoDB.

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Create `.env.local` in the project root:

   ```dotenv
   MONGODB_URI=mongodb://127.0.0.1:27017/attendance
   JWT_SECRET=replace-with-a-long-random-secret
   EMAIL_USER=your-sender@gmail.com
   EMAIL_PASS=replace-with-your-mail-credential
   ```

   The application uses the `attendance` database. Email delivery is configured for Gmail. Replace the example values and keep credentials out of version control.

3. Start the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000/login](http://localhost:3000/login).

## User Accounts

Self-registration is disabled. Create accounts through the Administrators page.

- **Teacher:** Can create accounts, change roles, and delete other users.
- **Teaching Assistant:** Can view users and create Teaching Assistant accounts.

A fresh database requires an initial Teacher account in `attendance.users` with a bcrypt-hashed password. There is currently no automatic seed command.

## Project Structure

```text
src/
  app/           Pages, layouts, and server API routes
  components/    UI components and feature forms
  services/api/  Frontend API services
  types/         Shared TypeScript types
  lib/           Database, email, validation, and utilities
  context/       Alerts and confirmation dialogs
  stores/        Zustand state
  styles/        Global styles and theme variables
public/          Static assets
```

Frontend API calls go through `src/services/api`. Keep request URLs and methods in services, and handle loading, validation, and feedback in components. See the [API service guide](src/services/api/README.md).

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Check TypeScript |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server after building |

Production requires a Next.js-compatible server, environment variables, MongoDB access, and HTTPS.
