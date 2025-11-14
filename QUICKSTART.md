# 🚀 AggieFind — Quick Start Guide

## 📱 Mobile App + 🖥️ Backend Ready to Go!

### One-Time Setup ✅ DONE
- ✅ Mobile app code created & fixed
- ✅ Backend server created & dependencies installed
- ✅ Admin user created (admin / password123)
- ✅ Database initialized

---

## ▶️ How to Run

### Terminal 1: Mobile App
```bash
cd /Users/zrm/Documents/NMSU/Websites/aggiefind
npm start
```
Then press:
- `w` for web browser
- `i` for iOS simulator  
- `a` for Android emulator
- or scan QR with Expo Go app

### Terminal 2: Backend
```bash
cd /Users/zrm/Documents/NMSU/Websites/aggiefind/backend
npm start
```
Server runs on: `http://localhost:4000`

### Terminal 3 (optional): Admin Dashboard
Open in your browser:
```
http://localhost:4000/admin
```
- Username: `admin`
- Password: `password123`

---

## ✨ Test It Out

### From Mobile App:
1. Press "Add a Lost Item"
2. Fill in: name, description, location, date, finder name
3. Press "Save Item"
4. Press "Show a List" to see it
5. Press "Search Lost Items" to find it

### From Admin Dashboard:
1. Open `http://localhost:4000/admin`
2. Login with admin/password123
3. See all items
4. Click buttons to:
   - ✓ Verify (marks as reviewed)
   - Found/Unfound (toggle found status)
   - Delete (remove item)

---

## 🎨 What You Built

| Component | Status | File |
|-----------|--------|------|
| Mobile UI | ✅ Complete | `app/index.tsx` |
| Backend API | ✅ Complete | `backend/server.js` |
| Admin Dashboard | ✅ Complete | `backend/admin.html` |
| Database | ✅ Ready | `backend/db.json` |
| Documentation | ✅ Complete | `SETUP.md`, `COMPLETE_SETUP.md` |

---

## 📂 Where Everything Is

```
/Users/zrm/Documents/NMSU/Websites/aggiefind/
├── app/index.tsx              ← Mobile app (React Native)
├── backend/
│   ├── server.js              ← Backend API
│   ├── admin.html             ← Admin dashboard UI
│   ├── db.json                ← Data storage
│   ├── package.json
│   ├── init-admin.js
│   └── README.md
├── SETUP.md                   ← Full setup guide
└── COMPLETE_SETUP.md          ← What was done

```

---

## 🔑 Key Points

- **Mobile app** uses in-memory storage (for now)
- **Backend** stores items permanently in `db.json`
- **Admin dashboard** accessible at `/admin` on backend
- **All errors fixed** — bcrypt and Node.js imports removed from mobile app
- **Ready to connect** — Optional: Make mobile app save to backend API

---

## 🎯 Next Steps (If Desired)

1. **Test everything locally** ← Do this first!
2. **Connect mobile app to backend** — Update `addItem()` to use `http://localhost:4000/api/items`
3. **Deploy backend** — Host on Heroku, DigitalOcean, or AWS
4. **Build mobile app** — `eas build` or submit to app stores

---

## ❓ FAQ

**Q: Error says "bcrypt not found"**
A: Already fixed! The imports have been removed from the mobile app.

**Q: Backend won't start**
A: Make sure you're in the `/backend` folder and ran `npm install`

**Q: Admin login doesn't work**
A: Default is `admin` / `password123`. Run `npm run create-admin` if needed.

**Q: How do I change the admin password?**
A:
```bash
cd backend
export ADMIN_USER=admin
export ADMIN_PASS=mynewpassword
npm run create-admin
```

**Q: Can I see items from the mobile app in the admin dashboard?**
A: Not yet — they're stored in different places. To connect them, update `addItem()` in the mobile app to POST to the backend API.

---

## 📞 Support

Check these files for more info:
- `SETUP.md` — Full detailed guide
- `backend/README.md` — API documentation
- `app/index.tsx` — Mobile app source code

---

**Everything is set up and ready to go! 🎉**

Start the mobile app and backend, then test the features!
