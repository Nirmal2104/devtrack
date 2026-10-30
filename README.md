# DevTrack — Issue and Bug Tracker

A full-stack starter project using React + TypeScript, Node.js + Express, and PostgreSQL.

## Features
- Register and login with JWT
- Protected issue API
- Create, view, update, and delete issues
- Search issues and filter by status/priority
- Dashboard summary cards
- Responsive UI

## Requirements
- Node.js 20+
- PostgreSQL 14+

## 1. Database
Create a database, for example `devtrack`, then run `server/schema.sql` in it.

## 2. Backend
```bash
cd server
cp .env.example .env
# Update DATABASE_URL and JWT_SECRET in .env
npm install
npm run dev
```
Backend runs at `http://localhost:4000`.

## 3. Frontend
In a second terminal:
```bash
cd client
npm install
npm run dev
```
Open the URL printed by Vite (usually `http://localhost:5173`).

## Suggested demo flow
1. Register a user.
2. Create an issue with title, description, priority, and status.
3. Search/filter the issue list.
4. Edit status to In Progress or Done.
5. Delete a test issue.

## Important
This is a learning/portfolio starter. Before production use, add rate limiting, email verification/password reset, audit logs, stronger validation, automated tests, and deployment secrets management. Never commit `.env`.
