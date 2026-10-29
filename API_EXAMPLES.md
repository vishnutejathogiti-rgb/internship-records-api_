# API examples

Base URL (local): `http://localhost:3000`

## Health
```http
GET /api/health
```

## List and pagination
```http
GET /api/internships?page=1&limit=5
```

## Search
```http
GET /api/internships?search=analyst&status=open
```

## Get one record
```http
GET /api/internships/1
```

## Create
```http
POST /api/internships
Content-Type: application/json

{
  "title": "Business Analyst Intern",
  "company": "Example Company",
  "location": "Hyderabad, India",
  "mode": "Hybrid",
  "type": "Internship",
  "description": "Support research, data analysis, and reporting.",
  "skills": ["Excel", "SQL", "Power BI"],
  "apply_url": "https://example.com/apply",
  "status": "open"
}
```

## Update
Use `PUT /api/internships/1` with the complete editable record body.

## Update status only
```http
PATCH /api/internships/1/status
Content-Type: application/json

{"status":"closed"}
```

## Delete
```http
DELETE /api/internships/1
```

## Common error statuses
- `400 VALIDATION_ERROR`: invalid or missing field
- `400 INVALID_JSON`: malformed JSON request body
- `404 NOT_FOUND`: requested record does not exist
- `404 ROUTE_NOT_FOUND`: unknown `/api` route
