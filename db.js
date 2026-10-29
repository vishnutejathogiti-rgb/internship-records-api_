const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

function openDatabase(file) {
  // sql.js is WebAssembly-based and does not require Visual Studio C++ build tools.
  const SQL = global.__SQLJS__;
  if (!SQL) throw new Error('Database initialization is incomplete.');
  const resolved = path.resolve(file);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const db = fs.existsSync(resolved) ? new SQL.Database(fs.readFileSync(resolved)) : new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');
  db.run(`
    CREATE TABLE IF NOT EXISTS internships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL CHECK(length(title) BETWEEN 3 AND 120),
      company TEXT NOT NULL CHECK(length(company) BETWEEN 2 AND 100),
      location TEXT NOT NULL DEFAULT 'Remote',
      mode TEXT NOT NULL DEFAULT 'Remote' CHECK(mode IN ('Remote','Hybrid','On-site')),
      type TEXT NOT NULL DEFAULT 'Internship' CHECK(type IN ('Internship','Full-time','Part-time','Contract')),
      description TEXT NOT NULL CHECK(length(description) BETWEEN 10 AND 2000),
      skills TEXT NOT NULL DEFAULT '[]',
      apply_url TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed','draft')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  let inTransaction = false;
  function persist() {
    if (inTransaction) return;
    const bytes = db.export();
    fs.writeFileSync(resolved, Buffer.from(bytes));
  }
  function normalizeParams(params) {
    const value = params.length === 1 && params[0] && !Array.isArray(params[0]) && typeof params[0] === 'object'
      ? params[0] : params;
    if (value && !Array.isArray(value)) {
      const mapped = {};
      for (const [key, item] of Object.entries(value)) {
        const normalizedKey = /^[:@$]/.test(key) ? key : `@${key}`;
        mapped[normalizedKey] = item;
      }
      return mapped;
    }
    return value;
  }
  function allRows(sql, params=[]) {
    const stmt = db.prepare(sql);
    try {
      const normalized = normalizeParams(params);
      if (normalized && (Array.isArray(normalized) ? normalized.length : Object.keys(normalized).length)) stmt.bind(normalized);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      return rows;
    } finally { stmt.free(); }
  }
  function run(sql, params=[]) {
    db.run(sql, normalizeParams(params));
    const changes = db.getRowsModified();
    const lastIdRows = allRows('SELECT last_insert_rowid() AS id');
    persist();
    return { changes, lastInsertRowid: lastIdRows[0]?.id };
  }
  const adapter = {
    pragma() {},
    exec(sql) { db.run(sql); persist(); },
    prepare(sql) {
      return {
        all(...params) { return allRows(sql, params); },
        get(...params) { return allRows(sql, params)[0]; },
        run(...params) { return run(sql, params); }
      };
    },
    transaction(fn) {
      return (...args) => {
        db.run('BEGIN');
        inTransaction = true;
        try {
          const result = fn(...args);
          db.run('COMMIT');
          inTransaction = false;
          persist();
          return result;
        } catch (e) {
          try { db.run('ROLLBACK'); } finally { inTransaction = false; }
          throw e;
        }
      };
    },
    close() { persist(); db.close(); }
  };

  const count = adapter.prepare('SELECT COUNT(*) AS count FROM internships').get().count;
  if (count === 0) {
    const seed = require('./seed-data');
    const insert = adapter.prepare(`INSERT INTO internships
      (title,company,location,mode,type,description,skills,apply_url,status)
      VALUES (?,?,?,?,?,?,?,?,?)`);
    const transaction = adapter.transaction(items => items.forEach(item =>
      insert.run(item.title,item.company,item.location,item.mode,item.type,item.description,
        JSON.stringify(item.skills),item.apply_url,item.status)));
    transaction(seed);
  }
  return adapter;
}

async function createDatabase(file) {
  global.__SQLJS__ = await initSqlJs();
  return openDatabase(file);
}
module.exports = { openDatabase, createDatabase };