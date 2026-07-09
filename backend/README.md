PeerTrack+ is an AI-powered tutoring + mentorship platform that connects Per Scholas alumni (tutors) and current learners to collaborate, share knowledge, and grow together.

This project supports:

Learner / Alumni (Tutor) / Admin role-based experience
Tutoring requests (create + list + accept/decline)
Tutor availability calendar (GET availability events)
JWT authentication + GitHub OAuth (Passport)

## Project Goals:

Per Scholas wants to strengthen the bridge between graduates and current learners by creating a smart, gamified tutoring system that:

- recognizes alumni for giving back
- helps learners get support faster and more effectively
- combines AI assistance with human mentorship

## Core Features (MVP)
- Authentication & Access Control
- Email/password register + login (JWT)
- GitHub OAuth login (Passport)
- Role-based access control (RBAC): admin, alumni, learner

## Availability Calendar

- Users (typically tutors) can expose availability dates
- Frontend calendar can fetch availability events

## Tutoring Requests

- Learner can create a tutoring request
- Tutors/Admin can view OPEN requests
- Tutor/Admin can accept/decline a request
- Status tracking: OPEN, ACCEPTED, DECLINED, etc.

## User Roles

- Learner: requests help, asks questions, views AI suggestions and progress
- Alumni (Tutor): sets availability, accepts/declines requests, earns points/badges
- Admin: manages users, moderation, monitoring, and AI matching rules

## Tech Stack:
# Backend

- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Passport + passport-github2 (GitHub OAuth)
- dotenv, cors, morgan, nodemon

# [Frontend](https://github.com/Team-4-Per-Scholas-Hackthon/frontend-project)

- React (Vite)
- React Router (recommended)
- FullCalendar
- Fetch/Axios for API calls


## Project Structure (Backend)

backend-project
 config/
    dbConnect.js
    passport.js
 controllers/
    userController.js
    requestController.js
 middleware/
    auth.js
 models/
    User.js
    TutoringRequest.js
 routes/
    userRouter.js
    requestRouter.js
 server.js
 package.json
 .env # do not commit it

Front-project
src/
api/
 client.js          # fetch helpers + token header
pages/
 Login.jsx
 Dashboard.jsx
 components/
  Calendar.jsx
   RequestForm.jsx
   RequestsList.jsx
 routes/
    AppRoutes.jsx

# API Endpoints: 
- Register:                                 POST /users/register
- Login:                                    POST /users/login
- Dashboard (logged-in user):               GET /users/dashboard
- Availability events (calendar) :          GET /users/:id/availability
- GitHub OAuth:                             GET /users/auth/github & GET /users/auth/github/callback
- Requests (TutoringRequest):               POST /requests
- List requests (role-based):               GET /requests
- Accept/Decline request (Alumni/Admin):    PATCH /requests/:id/accept/Decline
- Forgot Password                           POST /users/forgot-password

## Workflow Summary

- User registers/logs in
- System routes user to correct dashboard (Learner/Alumni/Admin)
- Alumni sets availability
- Learner creates a tutoring request
- Tutor views open requests and accepts/declines
- Accepted request becomes a scheduled TutoringSession and appears on calendars
- AI support: matching, summaries, learning paths
- Gamification: points, badges, ranks

## Planned Next Features
    TutoringSession model + scheduling endpoint
    Async Q&A: Question/Answer models
    AI Matching (US-401)
    AI Study Assistant (US-402)
    Admin dashboards + matching rules CRUD
    Points/Badges system + leaderboard
    Notifications (email/in-app)

## Environment Variables

### Local Development (Email Testing)
The project uses Mailtrap for email testing in development.

Required variables:
- MAIL_PROVIDER=mailtrap
- MAILTRAP_HOST
- MAILTRAP_PORT
- MAILTRAP_USER
- MAILTRAP_PASS
- MAIL_FROM

### Production (Email Sending)
In production, configure a real email provider (e.g. SendGrid).

Required variables:
- MAIL_PROVIDER=sendgrid
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS
- MAIL_FROM
