# Schedura

A full-stack scheduling platform built for the Scaler SDE Intern full-stack assignment using React, Node.js, Express, and MySQL.

## Tech Stack

- Frontend: React + Vite + React Router
- Backend: Node.js + Express
- Database: MySQL
- Date handling: Day.js

## Features

- Event type CRUD with unique public booking links
- Active/inactive event visibility and event color customization
- Weekly availability settings with timezone support
- Public booking page with month calendar, slot selection, timezone switching, and guest notes
- Double-booking protection using an app-level pre-check plus a database unique constraint
- Booking confirmation screen with full invitee details
- Upcoming, past, and cancelled meetings views
- Meeting cancellation
- Seeded sample user, availability, event types, and meetings
- Responsive admin and public UI inspired by Calendly

## Project Structure

- `client/`: React frontend
- `server/`: Express API and MySQL setup scripts
- `server/sql/schema.sql`: database schema
- `server/sql/seed.sql`: sample data
- `DEPLOYMENT.md`: production deployment guide for frontend, backend, and MySQL

## Setup

1. Install MySQL Server and make sure a user with database create privileges is available.
2. Copy `server/.env.example` to `server/.env` and update the database credentials.
3. Copy `client/.env.example` to `client/.env` if you want to change the API URL.
4. Install dependencies:

```bash
npm install
```

5. Initialize the database and seed sample data:

```bash
npm run db:init
```

6. Start the frontend and backend together:

```bash
npm run dev
```

7. Open `http://localhost:5173`

## Default Routes

- Admin dashboard: `http://localhost:5173/`
- Availability: `http://localhost:5173/availability`
- Meetings: `http://localhost:5173/meetings`
- Public booking example: `http://localhost:5173/book/intro-call`

## MySQL Connection Notes

- `server/src/config/db.js` reads `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` from `server/.env`.
- `npm run db:init` creates the database if it does not exist, runs `server/sql/schema.sql`, and then inserts `server/sql/seed.sql`.
- If MySQL is running on the same machine with the default root user, a typical local setup is:

```env
PORT=4000
CLIENT_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=calendly_clone
```

## Detailed MySQL Setup

1. Install MySQL Server.
2. Open MySQL Workbench, Command Line Client, or any MySQL shell.
3. Make sure the MySQL service is running on port `3306`.
4. Check the username and password you actually want this app to use.
5. Open [server/.env](C:/Users/gsrio/Music/calendly/server/.env) and replace the placeholder values:

```env
PORT=4000
CLIENT_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_real_mysql_password
DB_NAME=calendly_clone
```

6. If you prefer creating a dedicated app user instead of using `root`, run SQL like:

```sql
CREATE USER 'calendly_app'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON calendly_clone.* TO 'calendly_app'@'localhost';
FLUSH PRIVILEGES;
```

7. Then update `server/.env` to:

```env
DB_USER=calendly_app
DB_PASSWORD=strong_password_here
```

8. From the project root, run:

```bash
npm install
npm run db:init
```

9. `npm run db:init` will:
   create the `calendly_clone` database if needed
   create all required tables from `server/sql/schema.sql`
   seed one default host, availability, event types, and sample meetings from `server/sql/seed.sql`

10. Start the app:

```bash
npm run dev
```

11. Open `http://localhost:5173`.
12. Use the Event Types page to create/edit public booking links, Availability to set weekly hours, and Meetings to manage scheduled calls.

## Useful MySQL Commands

```sql
SHOW DATABASES;
USE calendly_clone;
SHOW TABLES;
SELECT * FROM users;
SELECT * FROM event_types;
SELECT * FROM availability_rules;
SELECT * FROM meetings;
```

## If Buttons Still Fail

- Make sure the backend is running on `http://localhost:4000`.
- Open `http://localhost:4000/api/health` and confirm it returns `{"status":"ok","database":"connected"}`.
- If health fails, your MySQL credentials in `server/.env` are wrong or MySQL is not running.
- If you changed the schema after an older setup, drop the old database and run `npm run db:init` again.

## Assumptions

- A single default admin user is considered logged in.
- Public users can book without authentication.
- Availability is defined as one time range per weekday.
- Slots are shown in the host's configured timezone.

## Submission Notes

- Add screenshots or a deployment link before submitting.
- The UI was designed to feel close to Calendly's clean scheduling workflow while keeping the code modular and easy to explain in an interview.
