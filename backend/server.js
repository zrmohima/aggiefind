const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'db.json');
const ALLOWED_FIELDS = ['campusConfig', 'heuristicScores', 'schedule'];
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

function userAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function findPathBetween(start, end, graph) {
  if (start === end) return [start];
  function dfs(node, path, visited) {
    if (node === end) return path;
    for (const neighbor of Object.keys(graph[node] ?? {})) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        const result = dfs(neighbor, [...path, neighbor], visited);
        if (result) return result;
      }
    }
    return null;
  }
  return dfs(start, [start], new Set([start]));
}

function predictLocations(item, db) {
  const { graph, distanceMatrix, locationIds } = db.campusConfig;
  const locationNames = Object.fromEntries(
    Object.entries(locationIds).map(([id, name]) => [name, parseInt(id)])
  );
  const startLocation = graph[item.location] ? item.location : Object.keys(graph)[0];
  const buildingProbs = {};

  function dfs(node, prob, depth, visited) {
    if (depth > 6 || prob < 0.001) return;
    visited.add(node);
    buildingProbs[node] = (buildingProbs[node] ?? 0) + prob;
    const neighbors = Object.keys(graph[node] ?? {});
    const raw = {};
    for (const n of neighbors) {
      if (!visited.has(n)) {
        const i = locationNames[node], j = locationNames[n];
        const dist = (i !== undefined && j !== undefined) ? distanceMatrix[i][j] : 500;
        raw[n] = 1 / (1 + dist / 100);
      }
    }
    const total = Object.values(raw).reduce((s, v) => s + v, 0);
    for (const [neighbor, w] of Object.entries(raw)) {
      const p = total > 0 ? w / total : 0;
      if (p > 0) dfs(neighbor, prob * p, depth + 1, new Set(visited));
    }
  }
  dfs(startLocation, 1.0, 0, new Set());

  const maxProb = Math.max(...Object.values(buildingProbs), 1);
  const startId = locationNames[startLocation];

  return Object.entries(buildingProbs)
    .map(([building, rawProb]) => {
      const pathProb = rawProb / maxProb;
      const buildId = locationNames[building];
      const dist = (startId !== undefined && buildId !== undefined) ? distanceMatrix[startId][buildId] : 500;
      const learned = db.heuristicScores[building] ?? 0.3;
      const hScore = 0.5 * learned + 0.5 * pathProb;
      return { building, hScore };
    })
    .sort((a, b) => b.hScore - a.hScore)
    .slice(0, 5);
}

function getSmartAlpha(item, confirmedBuilding, db) {
  const predictions = predictLocations(item, db);
  const predictedNames = predictions.map(p => p.building);
  const isPredicted = predictedNames.includes(confirmedBuilding);
  const currentScore = db.heuristicScores[confirmedBuilding] ?? 0.3;

  if (isPredicted && currentScore > 0.7) return 0.05;
  if (isPredicted && currentScore <= 0.7) return 0.10;
  if (!isPredicted && currentScore < 0.4) return 0.07;
  return 0.10;
}

function applySmartHeuristicUpdate(db, item, confirmedBuilding) {
  if (!confirmedBuilding || !db.heuristicScores[confirmedBuilding]) return;
  const alpha = getSmartAlpha(item, confirmedBuilding, db);
  db.heuristicScores[confirmedBuilding] =
    (1 - alpha) * db.heuristicScores[confirmedBuilding] + alpha * 1.0;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({ message: 'AggieFind backend' });
});

app.post('/api/items', (req, res) => {
  const {
    name, description, location, dateFound, foundBy,
    postType, dropLocation, imageUrl, visibility,
    users, shareContact, contactName, contactPhone
  } = req.body;

  if (!name || name.trim().length === 0)
    return res.status(400).json({ error: 'Missing name' });
  if (!postType || !['lost', 'found'].includes(postType))
    return res.status(400).json({ error: 'postType must be lost or found' });

  let creatorId = null, creatorName = null, creatorEmail = null;
  try {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      const payload = jwt.verify(auth.slice(7), JWT_SECRET);
      creatorId = payload.userId;
      const db = readDB();
      const u = db.users.find(x => x.id === payload.userId);
      if (u) {
        creatorName = u.name || u.username;
        creatorEmail = u.email || u.username;
      }
    }
  } catch (e) { }

  const item = {
    id: uuidv4(),
    name: name.trim(),
    description: (description || '').trim(),
    location: (location || '').trim(),
    dateFound: (dateFound || '').trim(),
    foundBy: (foundBy || '').trim(),
    status: postType === 'found' ? 'found' : 'lost',
    postType,
    createdAt: Date.now(),
    dropLocation: (dropLocation || '').trim(),
    imageUrl: (imageUrl || '').trim(),
    visibility: visibility || 'public',
    users: users || [],
    shareContact: !!shareContact,
    contactName: contactName || null,
    contactPhone: contactPhone || null,
    creatorId,
    creatorName,
    creatorEmail,
    pendingClaim: null,
    resolvedById: null,
    resolvedBy: null,
  };

  const db = readDB();
  db.items.unshift(item);
  writeDB(db);
  res.status(201).json(item);
});

app.get('/api/items', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  const db = readDB();
  let rows = db.items.slice().sort((a, b) => b.createdAt - a.createdAt);
  if (q.length) {
    rows = rows.filter(it =>
      (it.name || '').toLowerCase().includes(q) ||
      (it.description || '').toLowerCase().includes(q) ||
      (it.location || '').toLowerCase().includes(q) ||
      (it.foundBy || '').toLowerCase().includes(q)
    );
  }
  res.json(rows);
});

app.get('/api/items/:id', (req, res) => {
  const db = readDB();
  const item = db.items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

app.post('/api/user/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username/password' });
  const db = readDB();
  const user = db.users.find(a => a.username === username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXP });
  res.json({ token, user: { id: user.id, username: user.username, name: user.name || null, email: user.email || null } });
});

app.post('/api/user/register', async (req, res) => {
  const { username, password, name, email } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username/password' });
  const db = readDB();
  if (db.users.find(u => u.username === username)) return res.status(409).json({ error: 'User already exists' });
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = { id: uuidv4(), username, passwordHash, name: name || null, email: email || null, createdAt: Date.now() };
    db.users.push(user);
    writeDB(db);
    res.status(201).json({ id: user.id, username: user.username, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Could not register user' });
  }
});

app.get('/api/user/items', userAuth, (req, res) => {
  const db = readDB();
  const rows = db.items
    .filter(i => i.creatorId === req.user.userId)
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json(rows);
});

app.put('/api/user/items/:id', userAuth, (req, res) => {
  const db = readDB();
  const item = db.items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const body = req.body || {};
  const isCreator = item.creatorId && item.creatorId === req.user.userId;
  const action = body.action;

  if (!action) {
    if (!isCreator) return res.status(403).json({ error: 'Not your item' });
    if (body.name !== undefined) item.name = String(body.name).trim();
    if (body.description !== undefined) item.description = String(body.description).trim();
    if (body.location !== undefined) item.location = String(body.location).trim();
    if (body.dateFound !== undefined) item.dateFound = String(body.dateFound).trim();
    if (body.dropLocation !== undefined) item.dropLocation = String(body.dropLocation).trim();
    if (body.shareContact !== undefined) item.shareContact = !!body.shareContact;
    if (body.contactName !== undefined) item.contactName = String(body.contactName);
    if (body.contactPhone !== undefined) item.contactPhone = String(body.contactPhone);
    writeDB(db);
    return res.json(item);
  }

  if (action === 'markFound') {
    const foundLocation = body.foundLocation || item.location;
    applySmartHeuristicUpdate(db, item, foundLocation);
    if (isCreator) {
      item.status = 'found';
      item.foundBy = req.user.username;
      item.dropLocation = foundLocation;
      writeDB(db);
      return res.json(item);
    } else {
      item.pendingClaim = {
        byId: req.user.userId,
        byName: req.user.username,
        byEmail: req.user.username,
        foundLocation,
        at: Date.now(),
      };
      writeDB(db);
      return res.json(item);
    }
  }

  if (action === 'iLostThis') {
    if (isCreator) return res.status(400).json({ error: 'You posted this item' });
    if (item.postType !== 'found') return res.status(400).json({ error: 'Item is not a found post' });
    applySmartHeuristicUpdate(db, item, item.location);
    item.pendingClaim = {
      byId: req.user.userId,
      byName: req.user.username,
      byEmail: req.user.username,
      foundLocation: item.location,
      at: Date.now(),
    };
    writeDB(db);
    return res.json(item);
  }

  if (action === 'confirm') {
    if (!isCreator) return res.status(403).json({ error: 'Only the creator can confirm' });
    if (!item.pendingClaim) return res.status(400).json({ error: 'No pending claim to confirm' });
    const foundLocation = item.pendingClaim.foundLocation || item.dropLocation || item.location;
    applySmartHeuristicUpdate(db, item, foundLocation);
    item.status = 'claimed';
    item.resolvedById = item.pendingClaim.byId;
    item.resolvedBy = item.pendingClaim.byName;
    item.resolvedAt = Date.now();
    item.pendingClaim = null;
    writeDB(db);
    return res.json({ resolved: true, item });
  }

  return res.status(400).json({ error: `Unknown action: ${action}` });
});

app.delete('/api/user/items/:id', userAuth, (req, res) => {
  const db = readDB();
  const before = db.items.length;
  db.items = db.items.filter(i => i.id !== req.params.id);
  if (db.items.length === before) return res.status(404).json({ error: 'Item not found' });
  writeDB(db);
  res.json({ success: true });
});

app.get('/api/ai/:field', (req, res) => {
  const { field } = req.params;
  const db = readDB();
  if (db[field] === undefined) return res.status(400).json({ error: 'Unknown field' });
  res.json(db[field]);
});

app.put('/api/ai/:field', (req, res) => {
  const { field } = req.params;
  if (!ALLOWED_FIELDS.includes(field) || field === 'schedule')
    return res.status(400).json({ error: 'Use /api/ai/schedule/append for schedule' });
  const db = readDB();
  db[field] = req.body;
  writeDB(db);
  res.json({ ok: true });
});

app.post('/api/ai/schedule/append', (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0)
    return res.json({ ok: true, added: 0 });
  const db = readDB();
  const existing = db.schedule ?? [];
  const existingDates = new Set(existing.map(r => r.date));
  const newRows = rows.filter(r => !existingDates.has(r.date));
  if (newRows.length > 0) {
    db.schedule = [...existing, ...newRows];
    writeDB(db);
  }
  res.json({ ok: true, added: newRows.length, skipped: rows.length - newRows.length });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`AggieFind backend listening on http://localhost:${PORT}`);
});