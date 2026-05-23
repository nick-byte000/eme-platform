// Run once: node scripts/hash-admin-password.js yourpassword
// Copy the output hash into ADMIN_PASSWORD_HASH in your .env
const bcrypt = require('bcryptjs');
const password = process.argv[2];
if (!password) { console.error('Usage: node scripts/hash-admin-password.js <password>'); process.exit(1); }
bcrypt.hash(password, 10).then(hash => {
  console.log('\nAdd this to your .env:\n');
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
});
