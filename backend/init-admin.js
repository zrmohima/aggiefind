// Create an initial admin user and store it in db.json.
// Defaults: ADMIN_USER=admin ADMIN_PASS=password123
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'db.json');

const username = process.env.ADMIN_USER || 'admin';
const password = process.env.ADMIN_PASS || 'password123';
const saltRounds = 10;

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}
function writeDB(json) {
  fs.writeFileSync(DB_PATH, JSON.stringify(json, null, 2), 'utf8');
}

async function createAdmin() {
  const db = readDB();
  const exists = db.admins.find(a => a.username === username);
  if (exists) {
    console.log(`Admin "${username}" already exists. Skipping creation.`);
    return;
  }
  const passwordHash = await bcrypt.hash(password, saltRounds);
  const admin = {
    id: uuidv4(),
    username,
    passwordHash,
    createdAt: Date.now()
  };
  db.admins.push(admin);
  writeDB(db);
  console.log(`Created admin "${username}". Use ADMIN_USER/ADMIN_PASS env to change defaults.`);
}

createAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
