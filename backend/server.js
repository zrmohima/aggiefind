// Simple JSON-file-backed Express server with admin JWT auth and static admin UI at /admin
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'db.json');
const ADMIN_HTML = path.join(__dirname, 'admin.html');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_for_prod';
const JWT_EXP = '8h';

function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    return { admins: [], items: [] };
  }
}
function writeDB(obj) {
  fs.writeFileSync(DB_PATH, JSON.stringify(obj, null, 2), 'utf8');
}

// small helper to save items (synchronous for simplicity)
function saveItem(item) {
  const db = readDB();
  const idx = db.items.findIndex(i => i.id === item.id);
  if (idx >= 0) db.items[idx] = item;
  else db.items.unshift(item);
  writeDB(db);
}

const app = express();
app.use(cors());
app.use(express.json());

// Serve admin dashboard (single file)
app.get('/admin', (req, res) => {
  res.sendFile(ADMIN_HTML);
});

// Serve root with minimal info
app.get('/', (req, res) => {
  res.json({ message: 'AggieFind backend', adminUI: '/admin' });
});

// Public API: add item
app.post('/api/items', (req, res) => {
  const { name, description = '', location = '', dateFound = '', foundBy = '' } = req.body;
  if (!name || name.trim().length === 0) return res.status(400).json({ error: 'Missing name' });
  const id = uuidv4();
  const item = {
    id,
    name: name.trim(),
    description: (description || '').trim(),
    location: (location || '').trim(),
    dateFound: (dateFound || '').trim(),
    foundBy: (foundBy || '').trim(),
    found: false,
    verified: false,
    verifiedBy: null,
    createdAt: Date.now()
  };
  const db = readDB();
  db.items.unshift(item);
  writeDB(db);
  res.status(201).json(item);
});

// Public API: list/search items (q optional)
app.get('/api/items', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  const db = readDB();
  let rows = db.items.slice().sort((a,b) => b.createdAt - a.createdAt);
  if (q.length) {
    rows = rows.filter(it => {
      return (it.name || '').toLowerCase().includes(q) ||
             (it.description || '').toLowerCase().includes(q) ||
             (it.location || '').toLowerCase().includes(q) ||
             (it.foundBy || '').toLowerCase().includes(q);
    });
  }
  res.json(rows);
});

// Admin auth middleware
function adminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload; // { adminId, username, iat, exp }
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Admin login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username/password' });
  const db = readDB();
  const admin = db.admins.find(a => a.username === username);
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, admin.passwordHash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ adminId: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: JWT_EXP });
  res.json({ token, username: admin.username });
});

// Admin: list items
app.get('/api/admin/items', adminAuth, (req, res) => {
  const db = readDB();
  res.json(db.items.slice().sort((a,b) => b.createdAt - a.createdAt));
});

// Admin: update item
app.put('/api/admin/items/:id', adminAuth, (req, res) => {
  const id = req.params.id;
  const db = readDB();
  const item = db.items.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  // allow partial updates: name, description, location, dateFound, found (bool), verified (bool)
  const body = req.body || {};
  if (body.name !== undefined) item.name = String(body.name);
  if (body.description !== undefined) item.description = String(body.description);
  if (body.location !== undefined) item.location = String(body.location);
  if (body.dateFound !== undefined) item.dateFound = String(body.dateFound);
  if (body.found !== undefined) item.found = !!body.found;
  if (body.verified !== undefined) {
    item.verified = !!body.verified;
    item.verifiedBy = item.verified ? req.admin.username : null;
  }
  // save
  writeDB(db);
  res.json(item);
});

// Admin: delete item
app.delete('/api/admin/items/:id', adminAuth, (req, res) => {
  const id = req.params.id;
  const db = readDB();
  const before = db.items.length;
  db.items = db.items.filter(i => i.id !== id);
  if (db.items.length === before) return res.status(404).json({ error: 'Item not found' });
  writeDB(db);
  res.json({ success: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`AggieFind backend listening on http://localhost:${PORT}`);
  console.log(`Admin dashboard available at http://localhost:${PORT}/admin`);
});
