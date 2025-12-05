const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'db.json');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_for_prod';
const JWT_EXP = '8h';

function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    return { users: [], items: [] };
  }
}
function writeDB(obj) {
  fs.writeFileSync(DB_PATH, JSON.stringify(obj, null, 2), 'utf8');
}

const app = express();
app.use(cors());
app.use(express.json());

// Serve root with minimal info
app.get('/', (req, res) => {
  res.json({ message: 'AggieFind backend' });
});

// Public API: add item
app.post('/api/items', (req, res) => {
  const { name, description, location, dateFound, foundBy, status, createdAt, postType, dropLocation, imageUrl, visibility, users } = req.body;
  if (!name || name.trim().length === 0) return res.status(400).json({ error: 'Missing name' });
  const id = uuidv4();
  const item = {
    id,
    name: name.trim(),
    description: (description || '').trim(),
    location: (location || '').trim(),
    dateFound: (dateFound || '').trim(),
    foundBy: (foundBy || '').trim(),
    status,
    createdAt,
    dropLocation: (dropLocation || '').trim(),
    imageUrl: (imageUrl || '').trim(),
    postType,
    visibility,
    users
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
  let rows = db.items.slice().sort((a, b) => b.createdAt - a.createdAt);
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

// User auth middleware
function userAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { userId, username, iat, exp }
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// User login
app.post('/api/user/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username/password' });
  const db = readDB();
  const user = db.users.find(a => a.username === username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXP });
  res.json({ token, username: user.username });
});

// user: list items
app.get('/api/user/items', userAuth, (req, res) => {
  const db = readDB();
  res.json(db.items.slice().sort((a, b) => b.createdAt - a.createdAt));
});

// get specific item details
app.get('/api/items/:id', (req, res) => {
  const id = req.params.id;
  const db = readDB();
  const item = db.items.find(i => i.id === id);
  res.json(item);
});

// user: update item
app.put('/api/user/items/:id', (req, res) => {
  const id = req.params.id;
  const db = readDB();
  const item = db.items.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const body = req.body || {};
  if (body.name !== undefined) item.name = String(body.name);
  if (body.description !== undefined) item.description = String(body.description);
  if (body.location !== undefined) item.location = String(body.location);
  if (body.dateFound !== undefined) item.dateFound = String(body.dateFound);
  if (body.status !== undefined) item.status = body.status;
  // save
  writeDB(db);
  res.json(item);
});

// user: delete item
app.delete('/api/user/items/:id', userAuth, (req, res) => {
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
});
