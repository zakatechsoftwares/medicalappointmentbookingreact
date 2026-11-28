# StayHealthy — medical appointment booking

A web app for patients to find a doctor by speciality, pick a free date and time slot, and book a consultation from home. Patients can manage their appointments, rate the doctors they've seen and download a PDF report.

- **Frontend:** React 18 + TypeScript (Vite), React Bootstrap, Redux Toolkit, Formik/Yup
- **Backend:** Node.js + Express, PostgreSQL (`pg`, plain SQL migrations), JWT auth — in `src/server`
- **Database:** PostgreSQL on [Supabase](https://supabase.com). Tables live in a `booking` schema and are shaped like the Horama EMR's (UUID ids, first/last names, the same appointment statuses), so bookings can later flow into the EMR.

## Features

- Sign up / log in with JWT (the server works out who you are from the token only)
- Browse doctors by speciality, with ratings and consultation fee in ₦
- Book a date and time slot; slots already taken, in the past or on the doctor's off-days can't be booked
- Double booking of the same slot is blocked by the database itself
- **My Appointments** page: upcoming, past and cancelled, with cancel
- Star ratings and reviews (one per patient per doctor; doctors' average rating updates automatically)
- Profile editing, and PDF reports for doctors you've booked

## Getting started

You need Node.js 18+ and a PostgreSQL database (a free [Supabase](https://supabase.com) project works, or Postgres on your machine).

```bash
# 1. Install
npm install
cd src/server && npm install

# 2. Configure the API
cp .env.example .env
# then edit .env: set DATABASE_URL (and DIRECT_URL on Supabase) and a long random JWT_SECRET
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # makes a secret

# 3. Create the tables, then add sample doctors (both safe to run again)
npm run migrate
npm run seed

# 4. Start the API (http://localhost:8181)
npm run dev

# 5. In another terminal, from the project root, start the frontend (http://localhost:5173)
npm run dev
```

### Environment variables

API (`src/server/.env`) — see `src/server/.env.example`:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres URL the app uses. On Supabase, the transaction pooler (port 6543) |
| `DIRECT_URL` | Supabase | Postgres URL for migrations and seeding. On Supabase, the session pooler (port 5432) |
| `JWT_SECRET` | yes | At least 32 characters. The server refuses to start without it |
| `CLIENT_ORIGIN` | no | Frontend URL(s) allowed by CORS, comma-separated. Default `http://localhost:5173` |
| `PGSSL` | no | Set to `disable` for a local Postgres without SSL |
| `JWT_EXPIRES_IN` | no | Default `7d` |
| `APP_TIMEZONE` | no | Decides "today" for bookings. Default `Africa/Lagos` |
| `PORT` | no | Default `8181` |

Frontend (`.env` in the project root, optional): `VITE_API_URL` — the API's URL when it's hosted separately (e.g. frontend on Vercel, API on Railway). If unset, it uses `http://localhost:8181` in development and the same origin in production.

## API

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | – | Create account → `{ authtoken, user }` |
| POST | `/api/auth/login` | – | Log in → `{ authtoken, user }` (rate-limited) |
| GET / PUT | `/api/auth/me` | ✓ | Read / update your name and phone |
| GET | `/api/doctors?speciality=&search=` | – | List doctors |
| GET | `/api/doctors/specialities` | – | List specialities |
| GET | `/api/doctors/:id/slots?date=YYYY-MM-DD` | – | Free and taken slots for a day |
| GET | `/api/doctors/:id/reviews` | – | A doctor's reviews |
| GET | `/api/appointments` | ✓ | Your appointments |
| POST | `/api/appointments` | ✓ | Book `{ doctorId, patientName, phoneNumber, date, timeSlot }` |
| PATCH | `/api/appointments/:id/cancel` | ✓ | Cancel one of your appointments |
| GET | `/api/reviews/mine` | ✓ | Reviews you've written |
| POST | `/api/reviews` | ✓ | Add/update a review `{ doctorId, rating, comment }` |

Authenticated requests send `Authorization: Bearer <authtoken>`.

## Tests

```bash
cd src/server && npm test
```

The full booking-flow tests need a throwaway Postgres database (they wipe the `booking` schema):

```bash
TEST_DATABASE_URL=postgresql://postgres@localhost:5432/stayhealthy_test PGSSL=disable npm test
```

## Deploying

- **One server:** run `npm run build` in `src/server` (builds the frontend into `dist/`), then `npm start`. Express serves both the API and the app.
- **Separate hosts:** deploy `src/server` (e.g. Railway) with the env vars above, set `CLIENT_ORIGIN` to the frontend URL, and deploy the frontend (e.g. Vercel) with `VITE_API_URL` set to the API URL.

### Vercel (frontend + API together)

`vercel.json` builds the React app and runs the Express API as a serverless function (`api/index.js` → `src/server/serverless.js`). Each build runs `npm run migrate` first, so new SQL files in `src/server/migrations` are applied automatically. In the Vercel project, set `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` and `CLIENT_ORIGIN`. Leave `VITE_API_URL` unset so the app calls the API on the same domain. Functions run in Paris (`cdg1`), next to the Supabase database.
