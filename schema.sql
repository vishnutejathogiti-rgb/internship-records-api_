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
);