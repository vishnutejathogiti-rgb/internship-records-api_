require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const { createDatabase } = require('./src/db');
const { validateInternship } = require('./src/validation');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const dbFile = path.resolve(process.env.DATABASE_FILE || './data/internships.sqlite');
fs.mkdirSync(path.dirname(dbFile), { recursive: true });
let db;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function apiError(res, status, code, message, details) {
  const error = { code, message };
  if (details) error.details = details;
  return res.status(status).json({ success: false, error });
}
function serialize(row) {
  return row ? {
    id: row.id, title: row.title, company: row.company, location: row.location,
    mode: row.mode, type: row.type, description: row.description,
    skills: JSON.parse(row.skills || '[]'), apply_url: row.apply_url,
    status: row.status, created_at: row.created_at, updated_at: row.updated_at
  } : null;
}
function getRecord(id) {
  if (!/^[1-9]\d*$/.test(String(id))) return null;
  return db.prepare('SELECT * FROM internships WHERE id = ?').get(Number(id));
}
function bodyValues(body) {
  return {
    title: body.title, company: body.company, location: body.location,
    mode: body.mode, type: body.type, description: body.description,
    skills: body.skills, apply_url: body.apply_url, status: body.status
  };
}

app.get('/api/health', (req, res) => res.json({
  success: true, data: { status: 'ok', service: 'internship-records-api' }
}));

app.get('/api/internships', (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '10', 10) || 10));
  const search = String(req.query.search || '').trim().slice(0, 100);
  const status = String(req.query.status || '').trim().toLowerCase();
  const clauses = [], params = [];
  if (search) {
    clauses.push('(title LIKE ? OR company LIKE ? OR location LIKE ? OR description LIKE ?)');
    const q = `%${search}%`; params.push(q, q, q, q);
  }
  if (status) {
    if (!['open', 'closed', 'draft'].includes(status))
      return apiError(res, 400, 'VALIDATION_ERROR', 'status must be open, closed, or draft');
    clauses.push('status = ?'); params.push(status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) AS total FROM internships ${where}`).get(...params).total;
  const rows = db.prepare(`SELECT * FROM internships ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, (page - 1) * limit);
  res.json({ success: true, data: rows.map(serialize), meta: {
    page, limit, total, totalPages: Math.ceil(total / limit)
  }});
});

app.get('/api/internships/:id', (req, res) => {
  const row = getRecord(req.params.id);
  if (!row) return apiError(res, 404, 'NOT_FOUND', 'Internship record not found');
  res.json({ success: true, data: serialize(row) });
});

app.post('/api/internships', (req, res) => {
  const validation = validateInternship(req.body, false);
  if (!validation.valid) return apiError(res, 400, 'VALIDATION_ERROR', 'Please correct the submitted fields', validation.errors);
  const d = validation.data;
  const result = db.prepare(`INSERT INTO internships
    (title, company, location, mode, type, description, skills, apply_url, status)
    VALUES (@title, @company, @location, @mode, @type, @description, @skills, @apply_url, @status)`)
    .run({ ...d, skills: JSON.stringify(d.skills) });
  const row = db.prepare('SELECT * FROM internships WHERE id = ?').get(result.lastInsertRowid);
  res.location(`/api/internships/${row.id}`).status(201).json({ success: true, data: serialize(row) });
});

app.put('/api/internships/:id', (req, res) => {
  const existing = getRecord(req.params.id);
  if (!existing) return apiError(res, 404, 'NOT_FOUND', 'Internship record not found');
  const validation = validateInternship(req.body, false);
  if (!validation.valid) return apiError(res, 400, 'VALIDATION_ERROR', 'Please correct the submitted fields', validation.errors);
  const d = validation.data;
  db.prepare(`UPDATE internships SET title=@title, company=@company, location=@location,
    mode=@mode, type=@type, description=@description, skills=@skills, apply_url=@apply_url,
    status=@status, updated_at=CURRENT_TIMESTAMP WHERE id=@id`)
    .run({ ...d, skills: JSON.stringify(d.skills), id: Number(req.params.id) });
  res.json({ success: true, data: serialize(getRecord(req.params.id)) });
});

app.patch('/api/internships/:id/status', (req, res) => {
  const existing = getRecord(req.params.id);
  if (!existing) return apiError(res, 404, 'NOT_FOUND', 'Internship record not found');
  const status = String(req.body.status || '').toLowerCase();
  if (!['open', 'closed', 'draft'].includes(status))
    return apiError(res, 400, 'VALIDATION_ERROR', 'status must be open, closed, or draft');
  db.prepare('UPDATE internships SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run(status, Number(req.params.id));
  res.json({ success: true, data: serialize(getRecord(req.params.id)) });
});

app.delete('/api/internships/:id', (req, res) => {
  const existing = getRecord(req.params.id);
  if (!existing) return apiError(res, 404, 'NOT_FOUND', 'Internship record not found');
  db.prepare('DELETE FROM internships WHERE id = ?').run(Number(req.params.id));
  res.status(200).json({ success: true, data: { id: Number(req.params.id), deleted: true } });
});

app.use('/api', (req, res) => apiError(res, 404, 'ROUTE_NOT_FOUND', 'API endpoint not found'));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err)
    return apiError(res, 400, 'INVALID_JSON', 'Request body must contain valid JSON');
  console.error(err);
  return apiError(res, 500, 'INTERNAL_ERROR', 'An unexpected server error occurred');
});

async function start() {
  db = await createDatabase(dbFile);
  app.listen(PORT, () => console.log(`Internship Records API running at http://localhost:${PORT}`));
}
if (require.main === module) {
  start().catch(err => { console.error('Could not initialize database:', err); process.exit(1); });
}
module.exports = { app, start };