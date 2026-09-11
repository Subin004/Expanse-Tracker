# Expense Tracker — Project Summary

Last updated: 2026-09-11

## Purpose

This project is a learning-focused Expense Tracker that is evolving from a client-side HTML/CSS/JavaScript app into a full-stack Android application.

## Repository and Local Project

- GitHub: `https://github.com/Subin004/Expanse-Tracker`
- Local project: `D:\projects\Expense Tracker\Expense-Tracker`
- Android wrapper: Capacitor
- Android project: `android/`
- Web frontend: `www/`
- Node.js backend: `server/`

> Note: The repository/app currently uses the name **Expanse Tracker** in some places. The intended product name is **Expense Tracker**; standardize it later as a separate cleanup task.

## Current Architecture

```text
Chrome frontend / Capacitor Android app
            |
            | fetch() requests
            v
Node.js + Express API (local development)
            |
            v
Temporary in-memory expenses array
```

The database layer has not yet been connected. When Node.js stops or restarts, in-memory expense data is erased.

## Completed Frontend Work

- Created a HTML/CSS/JavaScript expense form, table, total, category filter, edit, and delete controls.
- Added persistent `localStorage` as an earlier frontend-only milestone.
- Improved edit behavior: records are updated instead of deleted before saving.
- Added positive amount validation and trimmed expense names.
- Added mobile viewport configuration, responsive form wrapping, table overflow handling, accessible input labels, and validation messaging.
- Replaced unsafe user-data HTML rendering with DOM elements and `textContent`.
- Changed the frontend to use the Express API as its active data source instead of localStorage.
- Confirmed frontend API operations work while the backend server is running:
  - Load expenses
  - Create expense
  - Update expense
  - Delete expense

## Completed Backend Work

Backend location: `server/server.js`

- Installed Node.js dependencies: `express` and `cors`.
- Added CORS for local development.
- Added a health check endpoint:
  - `GET /api/health`
- Added in-memory CRUD API endpoints:
  - `GET /api/expenses`
  - `POST /api/expenses`
  - `PUT /api/expenses/:id`
  - `DELETE /api/expenses/:id`
- Added reusable validation for name, positive amount, category, and date.
- Added JSON error responses for invalid data and malformed JSON.
- Learned and tested API status codes:
  - `200 OK` — successful read or update
  - `201 Created` — successful creation
  - `204 No Content` — successful deletion
  - `400 Bad Request` — invalid request data/JSON
  - `404 Not Found` — requested expense ID does not exist
  - `500 Internal Server Error` — unexpected server error

## Important Development Commands

### Run the backend

Run in Terminal 1:

```powershell
cd "D:\projects\Expense Tracker\Expense-Tracker\server"
node server.js
```

The development API is available at:

```text
http://localhost:3000
```

### Test API endpoints

Use a separate Terminal 2. Examples:

```powershell
curl.exe -i "http://localhost:3000/api/expenses"
```

For PowerShell POST/PUT requests, prefer a PowerShell object plus `ConvertTo-Json` to avoid malformed JSON/quoting errors.

```powershell
$body = @{
    name = "Coffee"
    amount = 120
    category = "Food"
    date = "2026-09-11"
} | ConvertTo-Json

Invoke-WebRequest `
  -Uri "http://localhost:3000/api/expenses" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

### Update Android after frontend changes

```powershell
cd "D:\projects\Expense Tracker\Expense-Tracker"
npx cap sync android
```

Then build/run from Android Studio. Capacitor must be synced before the new `www/` files are included in an APK.

## Current Limitations

- Expense data is stored only in server memory and resets after Node.js restarts.
- The API is local; Android cannot use `localhost` to access the laptop server. On a phone, `localhost` refers to the phone, not the laptop.
- No authentication, user accounts, authorization, cloud deployment, automated tests, CI/CD, production signing, or Play Store release yet.
- CORS currently permits local development broadly; it must be restricted in production.

## Next Milestone — PostgreSQL Persistence

PostgreSQL and pgAdmin are installed.

### Database to create

Create a database named:

```text
expense_tracker
```

### Table SQL

Run this in the pgAdmin Query Tool while connected to `expense_tracker`:

```sql
CREATE TABLE expenses (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(120) NOT NULL CHECK (char_length(trim(name)) > 0),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category VARCHAR(50) NOT NULL CHECK (char_length(trim(category)) > 0),
    expense_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Verify with:

```sql
SELECT * FROM expenses;
```

### Planned database integration

```text
Frontend
  -> Express API
  -> PostgreSQL database
  -> Expenses persist across server restarts
```

Next technical steps:

1. Create `expense_tracker` database and `expenses` table.
2. Install the Node.js `pg` PostgreSQL driver.
3. Add environment variables for database credentials; never commit credentials.
4. Create a PostgreSQL connection module.
5. Replace the in-memory `expenses` array with parameterized SQL queries.
6. Retest all CRUD operations through the frontend and API.

## Learning Principles

- Work one layer at a time: frontend, API, database, then authentication/deployment.
- Explain what, why, and how before major edits.
- Test each feature before moving forward.
- Commit completed milestones to GitHub with meaningful messages.
- Treat frontend validation as user experience; keep backend/database validation as the security and data-integrity boundary.
