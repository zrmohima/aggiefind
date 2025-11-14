# AggieFind — JSON-backed backend + admin dashboard

This small backend uses a JSON file (`db.json`) as storage and serves a tiny React-based admin dashboard at `/admin`.

## Quick start (local)

1. From the repo root, navigate to backend:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (optional) Set admin credentials and JWT secret via environment variables:
   ```bash
   export ADMIN_USER=admin
   export ADMIN_PASS=password123
   export JWT_SECRET="a_strong_secret"
   ```

4. Create initial admin:
   ```bash
   npm run create-admin
   ```

5. Start server:
   ```bash
   npm start
   ```

6. Open admin UI in a browser:
   ```
   http://localhost:4000/admin
   ```

   Default credentials: **admin / password123**

## API Endpoints

### Public API

- **POST /api/items** — Add a lost item
  ```json
  {
    "name": "Silver MacBook Pro",
    "description": "13 inch with stickers",
    "location": "Zuhl Library 2nd floor",
    "dateFound": "2025-10-24",
    "foundBy": "John Doe"
  }
  ```

- **GET /api/items** — List/search items (optional `q` query param)
  ```
  http://localhost:4000/api/items
  http://localhost:4000/api/items?q=MacBook
  ```

### Admin API (Requires JWT token)

- **POST /api/admin/login** — Admin login, returns JWT token
  ```json
  { "username": "admin", "password": "password123" }
  ```

- **GET /api/admin/items** — List all items (admin only, requires `Authorization: Bearer <token>` header)

- **PUT /api/admin/items/:id** — Update item (admin only)
  ```json
  {
    "name": "Updated Name",
    "description": "Updated description",
    "location": "Updated location",
    "dateFound": "2025-10-25",
    "found": true,
    "verified": true
  }
  ```

- **DELETE /api/admin/items/:id** — Delete item (admin only)

## Notes

- This is meant as a minimal local/development backend. For production, consider using a real DB (PostgreSQL, MongoDB, etc.), HTTPS, and stronger secret management.
- The admin dashboard is a single static HTML file using React via CDN — easy to iterate on and served by the backend.
- The JSON file (`db.json`) stores everything and is written synchronously for simplicity. For multi-instance/high-concurrency use, migrate to a real database.

## Next Steps

- Connect your Expo mobile app to POST items to `http://localhost:4000/api/items`
- Use the admin dashboard at `/admin` to manage, verify, and delete items
- For production, deploy to a VPS or cloud platform (Heroku, DigitalOcean, AWS, etc.)
