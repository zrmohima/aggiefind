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
  const { name, description, location, dateFound, foundBy, status, createdAt, postType, dropLocation, imageUrl, visibility, users, shareContact, contactName, contactPhone } = req.body;
  if (!name || name.trim().length === 0) return res.status(400).json({ error: 'Missing name' });
  const id = uuidv4();

  // try to extract user from Authorization header (optional)
  let creatorId = null, creatorName = null, creatorEmail = null;
  try {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.slice(7);
      const payload = jwt.verify(token, JWT_SECRET);
      creatorId = payload.userId;
      creatorName = payload.username;
      // lookup email/name in db
      const db = readDB();
      const u = db.users.find(x => x.id === creatorId || x.username === payload.username);
      if (u) {
        creatorName = u.name || u.username;
        creatorEmail = u.email || u.username;
      }
    }
  } catch (e) {
    // ignore invalid token — item will be anonymous
  }

  const item = {
    id,
    name: name.trim(),
    description: (description || '').trim(),
    location: (location || '').trim(),
    dateFound: (dateFound || '').trim(),
    foundBy: (foundBy || '').trim(),
    status: status || (postType === 'found' ? 'found' : 'lost'),
    createdAt: createdAt || Date.now(),
    dropLocation: (dropLocation || '').trim(),
    imageUrl: (imageUrl || '').trim(),
    postType,
    visibility,
    users: users || [],
    shareContact: !!shareContact,
    contactName: contactName || null,
    contactPhone: contactPhone || null,
    creatorId,
    creatorName,
    creatorEmail,
    pendingClaim: null,
    resolvedById: null,
    resolvedBy: null
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
  // return token and basic user info (name/email may be undefined for older entries)
  res.json({ token, user: { id: user.id, username: user.username, name: user.name || null, email: user.email || null } });
});

// User registration
app.post('/api/user/register', async (req, res) => {
  const { username, password, name, email } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username/password' });
  const db = readDB();
  const exists = db.users.find(u => u.username === username);
  if (exists) return res.status(409).json({ error: 'User already exists' });
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const user = { id, username, passwordHash, name: name || null, email: email || null, createdAt: Date.now() };
    db.users.push(user);
    writeDB(db);
    res.status(201).json({ id: user.id, username: user.username, name: user.name, email: user.email });
  } catch (err) {
    console.error('Error registering user', err);
    res.status(500).json({ error: 'Could not register user' });
  }
});

// user: list items (only items created by this user)
app.get('/api/user/items', userAuth, (req, res) => {
  const db = readDB();
  const rows = db.items.filter(i => i.creatorId === req.user.userId).slice().sort((a, b) => b.createdAt - a.createdAt);
  res.json(rows);
});

// get specific item details
app.get('/api/items/:id', (req, res) => {
  const id = req.params.id;
  const db = readDB();
  const item = db.items.find(i => i.id === id);
  res.json(item);
});

// user: update item (protected) — used for edits, marking found, and confirming claims
app.put('/api/user/items/:id', userAuth, (req, res) => {
  const id = req.params.id;
  const db = readDB();
  const item = db.items.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const body = req.body || {};

  // If the authenticated user is the creator, allow direct edits and confirmations
  const isCreator = item.creatorId && (item.creatorId === req.user.userId);

  if (body.name !== undefined && isCreator) item.name = String(body.name);
  if (body.description !== undefined && isCreator) item.description = String(body.description);
  if (body.location !== undefined && isCreator) item.location = String(body.location);
  if (body.dateFound !== undefined) item.dateFound = String(body.dateFound);

  // Handling marking found / claim flow
  if (body.status !== undefined || body.action !== undefined) {
    // If creator confirms a pending claim, allow confirmation via action: 'confirm'
    if (body.action === 'confirm' && isCreator && item.pendingClaim) {
      // finalize by deleting the item (simpler flow)
      db.items = db.items.filter(i => i.id !== id);
      writeDB(db);
      return res.json({ deleted: true, id });
    }

    if (body.status !== undefined) {
      // non-creator initiating a claim for desired status
      if (!isCreator) {
        item.pendingClaim = {
          byId: req.user.userId,
          byName: req.user.username,
          byEmail: req.user.username,
          desiredStatus: String(body.status),
          at: Date.now()
        };
        // persist and return item (creator contact info included)
        writeDB(db);
        return res.json(item);
      } else {
        // creator can directly set status when editing
        item.status = body.status;
      }
    }
  }

  // allow creator to set dropLocation/contact if provided
  if (body.dropLocation !== undefined && isCreator) item.dropLocation = String(body.dropLocation);
  if (body.shareContact !== undefined && isCreator) item.shareContact = !!body.shareContact;
  if (body.contactName !== undefined && isCreator) item.contactName = String(body.contactName);
  if (body.contactPhone !== undefined && isCreator) item.contactPhone = String(body.contactPhone);

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
