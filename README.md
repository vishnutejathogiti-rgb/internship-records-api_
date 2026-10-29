# InternshipHub — REST API & Persistent Data

A full-stack internship board built with **Node.js, Express, sql.js (SQLite in WebAssembly), and vanilla HTML/CSS/JavaScript**. It includes a working website, persistent CRUD API, server-side validation, pagination, seed records, tests, and API documentation.

## Features
- List, detail, create, update, and delete internship records.
- SQLite database persists records across server restarts. The database engine uses WebAssembly and does not require native C++ compilation.
- Pagination: `page` and `limit` (maximum limit 100).
- Search across title, company, location, and description.
- Optional status filter: `open`, `closed`, `draft`.
- Server-side validation and consistent JSON error responses.
- Browser UI to search, filter, add, edit, and delete records.
- Security basics: Helmet headers, JSON body size limit, parameterized SQL statements.
- Seed data inserted automatically when the database is empty.

## Requirements
- Node.js 20 or newer
- npm (included with Node.js)

## Run locally on Windows
1. Install Node.js LTS from https://nodejs.org/ if `node -v` is not recognized. Close and reopen PowerShell after installing.
2. Extract the ZIP file.
3. Open PowerShell in the extracted project folder (the folder containing `package.json`).
4. Run:

```powershell
npm.cmd install
Copy-Item .env.example .env
npm.cmd start
```

5. Open http://localhost:3000 in your browser.
6. API health check: http://localhost:3000/api/health

If PowerShell says `Copy-Item` failed because `.env` already exists, continue. You can also run `npm.cmd start` without creating `.env`; defaults are configured.

## Run tests
```powershell
npm.cmd test
```

## Database and seed
- Database file defaults to `data/internships.sqlite`.
- The SQLite database is created automatically on first launch. It is saved as a SQLite-compatible file at `data/internships.sqlite`.
- Seed records are inserted only if the table is empty.
- `npm.cmd run seed` checks/initializes the database and prints the record count.
- Schema: `data/schema.sql`
- Fictional seed records: `src/seed-data.js`

## API contract
Successful response:
```json
{ "success": true, "data": {} }
```
List response:
```json
{
  "success": true,
  "data": [],
  "meta": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
}
```
Error response:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the submitted fields",
    "details": { "title": "This field is required" }
  }
}
```

## Endpoints

| Method | Endpoint | Description | Typical response |
|---|---|---|---|
| GET | `/api/health` | Health check | 200 |
| GET | `/api/internships?page=1&limit=10` | Paginated list | 200 |
| GET | `/api/internships?search=analyst&status=open` | Search/filter | 200 |
| GET | `/api/internships/:id` | Detail | 200 or 404 |
| POST | `/api/internships` | Create | 201 or 400 |
| PUT | `/api/internships/:id` | Replace editable fields | 200, 400 or 404 |
| PATCH | `/api/internships/:id/status` | Change status | 200, 400 or 404 |
| DELETE | `/api/internships/:id` | Delete | 200 or 404 |

### Example: create a record
```bash
curl -X POST http://localhost:3000/api/internships \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Business Analyst Intern",
    "company": "Example Company",
    "location": "Hyderabad, India",
    "mode": "Hybrid",
    "type": "Internship",
    "description": "Support business analysis, research, and dashboard reporting.",
    "skills": ["Excel", "SQL", "Power BI"],
    "apply_url": "https://example.com/apply",
    "status": "open"
  }'
```

PowerShell users can use `Invoke-RestMethod`:
```powershell
$body = @{
  title = "Business Analyst Intern"
  company = "Example Company"
  location = "Hyderabad, India"
  mode = "Hybrid"
  type = "Internship"
  description = "Support business analysis, research, and dashboard reporting."
  skills = @("Excel", "SQL", "Power BI")
  apply_url = "https://example.com/apply"
  status = "open"
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/internships -ContentType "application/json" -Body $body
```

### Example: validation error
`POST /api/internships` with `{ "title": "x" }` returns HTTP 400 with `VALIDATION_ERROR` and field-level details.

## Status codes
- `200 OK`: read/update/delete completed
- `201 Created`: record created
- `400 Bad Request`: invalid JSON, invalid fields, invalid filters
- `404 Not Found`: record or API route not found
- `500 Internal Server Error`: unexpected server failure

## Project structure
```text
internship_records_api_fullstack/
├── public/                 # Responsive website
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── src/
│   ├── db.js               # SQLite schema + initialization
│   ├── seed-data.js        # Fictional starter records
│   └── validation.js       # Input validation
├── scripts/seed.js
├── tests/validation.test.js
├── data/schema.sql
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## Deployment and proof link
This project runs locally without any external database account. For a public proof link, push the source to GitHub and deploy to a Node.js host that supports persistent disk storage. **SQLite requires a persistent writable disk**; ephemeral serverless filesystems may reset the database. If the hosting provider does not offer persistent disk, use PostgreSQL and configure a hosted database before deployment. Do not commit `.env`, `node_modules`, or a live database file.

## Checklist
- [x] REST endpoints for list, detail, create, update, delete
- [x] SQLite persistent storage
- [x] Server-side validation
- [x] Pagination and search
- [x] Consistent response/error format
- [x] Schema and fictional seed data
- [x] API examples and setup guide
- [x] Frontend for CRUD operations
- [x] Validation unit tests
- [ ] Run locally and confirm on your computer
- [ ] Push to your GitHub account and submit the repository URL
