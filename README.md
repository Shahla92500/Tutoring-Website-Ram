# TutorPro MVP (React + TypeScript)

This project is now implemented with **React + TypeScript + Vite**.

## Tech Stack

- React 18
- TypeScript
- Vite
- LocalStorage (temporary MVP data store)

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Open: `http://localhost:5173`

## Build

```bash
npm run build
npm run preview
```

## Demo Accounts

- Admin: `admin@site.com` / `admin123`
- Tutor: `tutor@site.com` / `tutor123`
- Student: `student@site.com` / `student123`

## Project Structure

- `index.html` - Vite entry HTML
- `src/main.tsx` - React bootstrap
- `src/App.tsx` - Main MVP app (routes, role logic, forms, dashboard)
- `src/styles.css` - UI styling
- `src/types.ts` - shared TypeScript types
- `src/data/seed.ts` - seeded data
- `src/data/testQuestions.ts` - assessment question bank
- `src/lib/storage.ts` - LocalStorage persistence
- `src/lib/id.ts` - ID helper

## Scope Included

- Visitor pages: Home, Courses, Exam Prep, Contact
- Login/signup with roles: student/parent/tutor/admin
- Assessment gated for logged-in student/parent
- Contact/booking request flow
- Tutor/Admin dashboard for managing requests/content
- Admin-only FAQ management

## Future (not implemented)

- Google auth
- Forgot password email flow
- Online payments
- Real backend/database
