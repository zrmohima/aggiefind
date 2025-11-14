# 🎯 Quick Reference — Approval Workflow

## The 3 Essential States

```
┌──────────────────────┐
│  ITEM ADDED          │
│  verified: false     │
│  ❌ NOT public       │
│  ⏳ Pending approval │
└──────┬───────────────┘
       │
       │ Admin clicks "Verify"
       ▼
┌──────────────────────┐
│  ITEM APPROVED       │
│  verified: true      │
│  ✅ VISIBLE public   │
│  Status: MISSING     │
└──────┬───────────────┘
       │
       │ Admin clicks "Mark Found"
       ▼
┌──────────────────────┐
│  ITEM FOUND          │
│  verified: true      │
│  ✅ Still public     │
│  Status: FOUND       │
└──────────────────────┘
```

---

## Quick Checklist

### **Adding an Item (User)**
- [ ] Open mobile app → "Add a Lost Item"
- [ ] Fill: Name, Description, Location, Date, Finder
- [ ] Click "Save Item"
- [ ] See: "Item submitted! Admin will review..."
- [ ] Item stored in backend (not visible yet)

### **Approving an Item (Admin)**
- [ ] Open http://localhost:4000/admin
- [ ] Login: admin/password123
- [ ] Find item in table (might be unverified)
- [ ] Read details (is it real? not spam?)
- [ ] Click "Verify" button
- [ ] Done! Item now public

### **Marking as Found (Admin)**
- [ ] Item confirmed found by real person
- [ ] Open admin dashboard
- [ ] Find item in table
- [ ] Click "Mark Found" button
- [ ] Done! Status changes to FOUND

---

## What Each Role Can Do

### **🟢 Regular User**
- ✅ Add lost items
- ✅ View approved items
- ✅ Search approved items
- ✅ Contact finder (via email)
- ❌ Can't approve items
- ❌ Can't mark as found
- ❌ Can't see pending items

### **🔵 Admin**
- ✅ See all items (approved & pending)
- ✅ Verify/approve items
- ✅ Reject items (unverify)
- ✅ Mark as found/unfound
- ✅ Delete items
- ✅ Track who verified what
- ✅ Search all items

---

## Data Flow (Simple)

```
User Adds    Backend       Admin        Public
Item         Stores        Reviews      Sees
 │            │             │            │
 └───────────→ Item stored  │            │
               (unverified) │            │
                            │            │
                    Admin clicks Verify  │
                            │            │
                 Updates db.json         │
                 (verified:true)         │
                            │            │
                            └───────────→ Item visible
                                         in list
```

---

## File Reference

| File | What It Does | Key Info |
|------|--------------|----------|
| `app/index.tsx` | Mobile app | Add/search approved items |
| `backend/server.js` | API server | Handles requests |
| `backend/admin.html` | Admin UI | Manage items |
| `backend/db.json` | Database | Stores everything |
| `APPROVAL_WORKFLOW.md` | Detailed guide | Full explanation |
| `YOUR_QUESTIONS_ANSWERED.md` | Q&A | Your specific questions |
| `WORKFLOW_VISUAL.md` | Diagrams | Visual guides |

---

## Commands to Run

### **Start Mobile App**
```bash
cd /Users/zrm/Documents/NMSU/Websites/aggiefind
npm start
# Then press w, i, a, or scan QR
```

### **Start Backend**
```bash
cd /Users/zrm/Documents/NMSU/Websites/aggiefind/backend
npm start
# Runs on http://localhost:4000
```

### **Open Admin Dashboard**
```
http://localhost:4000/admin
Username: admin
Password: password123
```

---

## Item Status Summary

| Status | verified | found | Visible Public | User Sees |
|--------|----------|-------|----------------|-----------|
| Pending | false | false | ❌ NO | ❌ Hidden |
| Approved | true | false | ✅ YES | 🔴 MISSING |
| Found | true | true | ✅ YES | 🟢 FOUND |
| Deleted | — | — | ❌ NO | ❌ Gone |

---

## Common Scenarios

### **Scenario 1: Someone Lost a MacBook**
```
User: Adds MacBook details → Sent to backend
Admin: Reviews in dashboard → Clicks "Verify"
Public: Sees "MacBook - MISSING" in list
Finder: Searches, finds it, contacts owner
Admin: Receives confirmation → Clicks "Mark Found"
Public: Sees "MacBook - FOUND"
```

### **Scenario 2: Spam Item Added**
```
User: Adds obviously fake item
Admin: Sees in pending list → Deletes it
Public: Never sees it ✅ (prevented spam)
```

### **Scenario 3: Item Found Later**
```
User: Adds item, admin approves
Days pass: Item appears as MISSING
Person: Finds item, gives to admin
Admin: Clicks "Mark Found" → Item shows FOUND
Public: Knows item is claimed
```

---

## Key Points to Remember

✅ **Items ARE stored** — In `backend/db.json` permanently  
✅ **Approval required** — Can't be public without admin verify  
✅ **Admin controls status** — Only admin can mark found  
✅ **Data is safe** — Survives restarts & app closures  
✅ **Prevents spam** — Unapproved items hidden from public  
✅ **Verification tracked** — Shows who verified what  

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Item not showing in public list | Admin needs to click "Verify" |
| Admin can't see item | Make sure backend is running |
| Backend won't start | Check port 4000 not in use: `lsof -i :4000` |
| Can't login to admin | Default is admin/password123 |
| Items disappear on restart | They shouldn't! Check backend running |

---

**That's everything you need to know!** 📖
