# AggieFind — Setup & Running Guide

This project consists of two parts:
1. **Mobile App** (React Native / Expo) — User-facing app for reporting lost items and searching
2. **Backend Server** (Node.js / Express) — REST API + Admin Dashboard for managing items

## Mobile App Setup

### Prerequisites
- Node.js and npm installed
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or Expo Go app on your phone)

### Installation & Running

From the **root directory** (`aggiefind/`):

```bash
# Install dependencies (if not already done)
npm install

# Start the Expo development server
npm start

# The app will show a QR code you can scan with:
# - Expo Go app (iOS/Android)
# - iOS Camera app (iOS only)
# - Or press 'w' to open in web browser
# - Or press 'i' for iOS Simulator / 'a' for Android Emulator
```

### Mobile App Features
- **Add a Lost Item** — Submit found items with name, description, location, date, finder name
- **View Lost Items List** — Browse all reported items
- **Search Lost Items** — Filter items by name, description, location, or finder
- **Beautiful UI** — White background, crimson header with NMSU branding, patterned home background

## Backend Server Setup

### Prerequisites
- Node.js and npm installed
- Port 4000 available (or set `PORT` env var)

### Installation & Running

From the **backend directory** (`aggiefind/backend/`):

```bash
cd backend

# Install dependencies (if not already done)
npm install

# Create the initial admin user (admin / password123)
npm run create-admin

# Start the backend server
npm start

# Server runs on http://localhost:4000
# Admin dashboard available at http://localhost:4000/admin
```

### Admin Dashboard Features
Login with **admin** / **password123**

- **View all lost items** — See all items submitted via the app
- **Search items** — Client-side filtering by name, description, location, finder
- **Verify items** — Mark items as verified (for admin review)
- **Mark Found** — Toggle items as found/unfound
- **Delete items** — Remove spam or resolved items
- **Track verification** — See which admin verified each item

### Backend API

#### Public Endpoints (no auth required)

**Add a lost item:**
```bash
curl -X POST http://localhost:4000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Silver MacBook Pro",
    "description": "13 inch with stickers",
    "location": "Zuhl Library 2nd floor",
    "dateFound": "2025-10-24",
    "foundBy": "John Doe"
  }'
```

**Search/List items:**
```bash
# Get all items
curl http://localhost:4000/api/items

# Search for items (case-insensitive)
curl "http://localhost:4000/api/items?q=MacBook"
```

#### Admin Endpoints (require JWT token)

**Login:**
```bash
curl -X POST http://localhost:4000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password123"}'

# Response: {"token": "eyJhbGc...", "username": "admin"}
```

**List all items (admin only):**
```bash
curl http://localhost:4000/api/admin/items \
  -H "Authorization: Bearer <token>"
```

**Update an item (verify, mark found, edit):**
```bash
curl -X PUT http://localhost:4000/api/admin/items/<item-id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"verified": true, "found": true}'
```

**Delete an item:**
```bash
curl -X DELETE http://localhost:4000/api/admin/items/<item-id> \
  -H "Authorization: Bearer <token>"
```

## Data Storage

- **Mobile app** — Items stored in-memory (lost when app reloads)
- **Backend** — Items stored in `backend/db.json` (persistent JSON file)

### Connecting the Mobile App to Backend (Optional)

Currently, the mobile app stores items locally. To persist items on the backend:

Update `app/index.tsx` to replace the local `addItem()` function:

```javascript
const addItemRemote = async () => {
  if (!valid) {
    Alert.alert('Missing name', 'Please enter an item name.');
    return;
  }
  try {
    const resp = await fetch('http://localhost:4000/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name, 
        description: desc, 
        location: loc, 
        dateFound, 
        foundBy 
      })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed');
    setItems(prev => [data, ...prev]);
    setName(''); setDesc(''); setLoc(''); setFoundBy('');
    setMode('list');
  } catch (err) {
    Alert.alert('Error', String(err));
  }
};
```

Then update the button to call `addItemRemote()` instead of `addItem()`.

## Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# JWT secret (change this in production!)
JWT_SECRET=your_super_secret_key_here

# Admin credentials (used by init-admin.js)
ADMIN_USER=admin
ADMIN_PASS=password123

# Port (optional, defaults to 4000)
PORT=4000
```

Or set via environment:
```bash
export JWT_SECRET="my_secret"
export ADMIN_USER="admin"
export ADMIN_PASS="mypassword"
npm run create-admin
npm start
```

## Production Notes

**Security & Deployment:**
- ✅ Use HTTPS (not HTTP) in production
- ✅ Use a strong, random JWT_SECRET
- ✅ Store admin credentials securely (not in code)
- ✅ Consider using a real database (PostgreSQL, MongoDB) instead of JSON file
- ✅ Add rate limiting, input validation, and logging
- ✅ Deploy to a cloud platform (Heroku, DigitalOcean, AWS, etc.)

**Mobile App:**
- Build for iOS: `expo build:ios`
- Build for Android: `expo build:android`
- Or use EAS Build: `eas build`

## Troubleshooting

### "Unable to resolve module bcrypt" error
This error appears if Node.js dependencies are imported in the mobile app. The mobile app should **not** import `bcrypt`, `fs`, `path`, etc. These are backend-only modules. If you see this error, the app code is mixed with backend code.

### Backend won't start on port 4000
```bash
# Check if port 4000 is already in use
lsof -i :4000

# Kill the process using port 4000
kill -9 <PID>

# Or use a different port
PORT=5000 npm start
```

### Admin login fails
- Make sure you've run `npm run create-admin`
- Check that `backend/db.json` has an admin entry
- Default credentials are `admin` / `password123` (unless you changed them via env vars)

### Mobile app can't reach backend
- Make sure backend is running on `http://localhost:4000`
- On an actual phone, use your machine's IP address instead of `localhost`
  - Find your IP: `ifconfig | grep "inet "`
  - Use: `http://<your-ip>:4000`

## Next Steps

1. **Test locally** — Run mobile app + backend together
2. **Verify items flow** — Submit items from app, manage in admin dashboard
3. **Customize** — Add your own logo, colors, and branding
4. **Deploy** — Host backend on a VPS/cloud platform, build mobile app for app stores

---

**Questions?** Check the backend and app README files for more details.
