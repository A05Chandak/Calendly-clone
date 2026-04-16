# Deployment Guide

This project is split into:

- `client/`: Vite + React frontend
- `server/`: Node.js + Express backend
- MySQL: external database

The cleanest deployment path for this repo is:

- Frontend: Vercel
- Backend: Render
- MySQL: Railway MySQL

That keeps the setup simple and matches how the app is already structured.

## 1. Before You Deploy

1. Make sure the project is pushed to GitHub.
2. Make sure `.env` files are not committed.
3. Rotate any database password that was previously stored in `server/.env`.
4. Keep these two files handy:
   - `client/.env.example`
   - `server/.env.example`

## 2. Deploy MySQL First

Create the database before deploying the backend.

1. Sign in to Railway.
2. Create a new project.
3. Add a MySQL service.
4. Open the MySQL service and copy these values from Railway:
   - host
   - port
   - user
   - password
   - database name

Railway usually exposes them with names similar to:

```env
MYSQLHOST=
MYSQLPORT=
MYSQLUSER=
MYSQLPASSWORD=
MYSQLDATABASE=
```

## 3. Initialize the Remote Database

This repo already includes a database initializer:

```bash
npm run db:init
```

Run it against your Railway MySQL instance from your local machine.

1. Open `server/.env`.
2. Replace the local DB values with the Railway values.
3. Keep `CLIENT_URL` as a temporary placeholder for now, for example:

```env
PORT=4000
CLIENT_URL=https://temporary-frontend-url.vercel.app
DB_HOST=your-railway-host
DB_PORT=your-railway-port
DB_USER=your-railway-user
DB_PASSWORD=your-railway-password
DB_NAME=your-railway-database
```

4. From the project root, run:

```bash
npm install
npm run db:init
```

What this does:

- creates the database if needed
- runs `server/sql/schema.sql`
- runs `server/sql/seed.sql`

## 4. Deploy the Backend on Render

1. Sign in to Render.
2. Click `New +`.
3. Choose `Web Service`.
4. Connect your GitHub repository.
5. Set the service root directory to `server`.
6. Use these settings:

```txt
Build Command: npm install
Start Command: npm start
```

7. Add these environment variables in Render:

```env
CLIENT_URL=https://temporary-frontend-url.vercel.app
DB_HOST=your-railway-host
DB_PORT=your-railway-port
DB_USER=your-railway-user
DB_PASSWORD=your-railway-password
DB_NAME=your-railway-database
```

Notes:

- You usually do not need to hardcode `PORT` on Render because Render provides it.
- Your server already reads `process.env.PORT`, so it is compatible.

8. Deploy the service.
9. After deploy finishes, open:

```txt
https://your-render-backend.onrender.com/api/health
```

You should see:

```json
{"status":"ok","database":"connected"}
```

If health fails, the problem is almost always one of these:

- bad MySQL host or password
- database was not initialized
- wrong database name

## 5. Deploy the Frontend on Vercel

1. Sign in to Vercel.
2. Create a new project from the same GitHub repository.
3. Set the root directory to `client`.
4. Vercel should detect Vite automatically.
5. Add this environment variable:

```env
VITE_API_URL=https://your-render-backend.onrender.com/api
```

6. Deploy.

After deployment, Vercel will give you a frontend URL such as:

```txt
https://your-project.vercel.app
```

## 6. Fix CORS With the Real Frontend URL

Your backend only allows the origin stored in `CLIENT_URL`:

- `server/src/index.js`

So after the frontend is live:

1. Copy your real Vercel frontend URL.
2. Go back to Render.
3. Update:

```env
CLIENT_URL=https://your-project.vercel.app
```

4. Redeploy the backend.

This is the step that makes browser API calls work in production.

## 7. Final Production Check

Test these URLs:

1. Backend health:

```txt
https://your-render-backend.onrender.com/api/health
```

2. Frontend home page:

```txt
https://your-project.vercel.app
```

3. Public booking page:

```txt
https://your-project.vercel.app/book/intro-call
```

Then verify:

- dashboard loads
- event types load
- availability page loads
- booking page shows slots
- booking creation works
- meetings page shows seeded meetings

## 8. Required Environment Variables

### Backend

```env
PORT=4000
CLIENT_URL=https://your-frontend-domain
DB_HOST=...
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
```

### Frontend

```env
VITE_API_URL=https://your-backend-domain/api
```

## 9. Local Commands You Will Reuse

From the project root:

```bash
npm install
npm run db:init
npm run dev
npm run build
npm start
```

## 10. Common Problems

### `Route not found`

Use the API prefix:

```txt
/api/...
```

Example:

```txt
https://your-render-backend.onrender.com/api/health
```

### CORS error in browser

`CLIENT_URL` on Render does not exactly match your Vercel frontend URL.

### Frontend loads but no data appears

`VITE_API_URL` is wrong in Vercel.

### Health works but booking fails

The database likely was not seeded or the backend is pointing to the wrong MySQL database.

### Render works slowly on first request

This can happen on lower-tier instances if the service spins down when idle.

## 11. Recommended Order

Deploy in this exact sequence:

1. Railway MySQL
2. Run `npm run db:init` against Railway
3. Render backend
4. Vercel frontend
5. Update Render `CLIENT_URL`
6. Test everything

## Official Docs

- Vercel Vite docs: https://vercel.com/docs/frameworks/frontend/vite
- Render monorepo docs: https://render-web.app.render.com/docs/monorepo-support
- Render environment variable docs: https://render-web.app.render.com/docs/environment-variables
- Railway docs: https://docs.railway.com/
