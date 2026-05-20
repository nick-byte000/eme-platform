const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

const runMigrations = async () => {
  const migrationsPath = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsPath).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsPath, file), 'utf8');
    console.log('Running migration:', file);
    await pool.query(sql);
    console.log('Done:', file);
  }
  console.log('All migrations completed successfully');
  process.exit(0);
};

runMigrations().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});