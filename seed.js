require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { createDatabase } = require('../src/db');
(async () => {
  const file = path.resolve(process.env.DATABASE_FILE || './data/internships.sqlite');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = await createDatabase(file);
  console.log('Database is ready. Seed records are inserted only when the table is empty.');
  console.log('Record count:', db.prepare('SELECT COUNT(*) AS n FROM internships').get().n);
  db.close();
})().catch(err => { console.error(err); process.exit(1); });