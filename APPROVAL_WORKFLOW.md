# 📋 AggieFind — Item Approval Workflow

## ✅ How the System Now Works

### **The Complete Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│ USER (Mobile App)                                           │
├─────────────────────────────────────────────────────────────┤
│ 1. User finds a lost item                                   │
│ 2. Taps "Add a Lost Item"                                   │
│ 3. Fills in: Name, Description, Location, Date, Finder    │
│ 4. Taps "Save Item"                                         │
│ ⬇️                                                           │
│ Item is SENT to backend                                     │
│ Status: ⏳ PENDING APPROVAL (verified: false)              │
│                                                             │
│ ❌ Item NOT visible in public list yet!                     │
│ ❌ Item NOT visible in search results yet!                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ADMIN (Dashboard at http://localhost:4000/admin)            │
├─────────────────────────────────────────────────────────────┤
│ 1. Sees the item in the pending list                        │
│ 2. Reviews: Is this a real lost item?                       │
│ 3. Clicks "Verify" button                                   │
│ ⬇️                                                           │
│ Item is MARKED as verified (verified: true)                │
│ Status: ✅ APPROVED                                         │
│                                                             │
│ ✅ Item NOW visible in public list                          │
│ ✅ Item NOW visible in search results                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PUBLIC (Everyone can see)                                   │
├─────────────────────────────────────────────────────────────┤
│ 1. Users see approved items in "Approved Lost Items"        │
│ 2. Items show status: 🔴 MISSING or 🟢 FOUND               │
│ 3. Users can search for items                               │
│ 4. If they found it, they contact the finder                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SOMEONE CLAIMS THEY FOUND IT                                │
├─────────────────────────────────────────────────────────────┤
│ 1. Person contacts finder (via Contact Us)                  │
│ 2. If they agree → Item is MARKED as FOUND                  │
│ Status: 🟢 FOUND (found: true)                             │
│                                                             │
│ Admin still shows it in list but marked as "FOUND"          │
│ Can verify the claim to confirm it's really found           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Points to Understand

### **1. Data Storage**
- ✅ **YES** — Items ARE stored permanently in `backend/db.json`
- ✅ Items persist even if you close the app
- ✅ Admin can see all items (approved & pending)
- ✅ Public can see only approved items

### **2. Approval Flow**
| Status | Visible to Public? | Visible to Admin? | Action |
|--------|-------------------|------------------|--------|
| ⏳ Pending | ❌ NO | ✅ YES | Awaiting admin review |
| ✅ Approved | ✅ YES | ✅ YES | Ready for public |
| 🟢 Found | ✅ YES | ✅ YES | Marked as claimed/found |

### **3. What Users See**

**In Mobile App:**
- "Show a List of Lost Items" → Only approved items
- "Search Lost Items" → Only approved items
- Each item shows: Name, Description, Location, Finder, Status (MISSING/FOUND)

**In Admin Dashboard:**
- All items (approved & pending)
- Can verify, mark found, or delete
- See who verified and when

---

## 📍 Data Locations

### **Backend Storage** (`backend/db.json`)
```json
{
  "admins": [
    { "username": "admin", "passwordHash": "...", ... }
  ],
  "items": [
    {
      "id": "1234567890",
      "name": "Silver MacBook Pro",
      "description": "13 inch with stickers",
      "location": "Zuhl Library 2nd floor",
      "dateFound": "2025-10-24",
      "foundBy": "John Doe",
      "found": false,
      "verified": true,                    ← KEY: Is item approved?
      "verifiedBy": "admin",               ← Who approved it?
      "createdAt": 1699900000000
    },
    {
      "id": "1234567891",
      "name": "Blue Backpack",
      "description": "Nike brand",
      "location": "Student Center",
      "dateFound": "2025-10-25",
      "foundBy": "Jane Smith",
      "found": false,
      "verified": false,                   ← NOT approved yet!
      "verifiedBy": null,
      "createdAt": 1699900100000
    }
  ]
}
```

---

## 🔄 Complete Workflow Example

### **Step 1: User Adds Item (Mobile App)**
```
User: "I found a MacBook at the library"
User Action: Fill form + "Save Item"
↓
Result: Item saved to backend with verified: false
Status: ⏳ PENDING (not visible to public)
```

### **Step 2: Admin Reviews (Admin Dashboard)**
```
Admin sees item in pending list
Admin reads: "Silver MacBook, 13 inch, Zuhl Library"
Admin checks: Is this a real lost item? (not spam)
Admin Action: Click "Verify" button
↓
Result: Item updated with verified: true, verifiedBy: "admin"
Status: ✅ APPROVED (now visible to public)
```

### **Step 3: Public Can See (Mobile App - List/Search)**
```
Any user opens mobile app
User Action: "Show a List of Lost Items" or "Search"
↓
User sees: "Silver MacBook - MISSING" (because found: false)
User can contact John Doe via "Contact Us"
```

### **Step 4: Item Is Found (Admin Marks)**
```
Someone found the MacBook, contacted John Doe
Admin verifies: Yes, they gave it back
Admin Action: Click "Mark Found" button
↓
Result: Item updated with found: true
Status: 🟢 FOUND (still visible, but marked as found)
```

---

## 🎨 What Users See

### **Mobile App - Before Approval**
```
❌ No items visible in "Approved Lost Items" list
❌ No items found when searching
❌ (Item exists in backend but hidden from public)
```

### **Mobile App - After Approval**
```
✅ Item visible in "Approved Lost Items" list
✅ Shows: Name, Description, Location, Finder, Status
✅ Can search and find the item
✅ Status badge shows: MISSING (yellow) or FOUND (green)
```

### **Admin Dashboard**
```
✅ Pending items shown separately
✅ Can see unverified items needing approval
✅ Can verify, mark found, or delete
✅ Can see who verified and when
```

---

## 🔐 Admin Controls

In the admin dashboard at `/admin`, admins can:

| Action | What It Does |
|--------|--------------|
| **Verify** | Approve item for public (verified: true) |
| **Unverify** | Remove from public view (verified: false) |
| **Mark Found** | Item has been claimed/returned (found: true) |
| **Mark Unfound** | Item still missing (found: false) |
| **Delete** | Remove item completely |

---

## 🌐 Public vs Admin View

### **Public View (Mobile App)**
- Only sees **approved** items
- Can search approved items
- Can see item status (MISSING/FOUND)
- Can contact finder

### **Admin View (Dashboard)**
- Sees **all** items (approved & pending)
- Can approve/reject items
- Can mark items as found
- Can delete items
- Can search all items
- Can see approval history

---

## ⚙️ API Endpoints (For Reference)

### **Public API**
```
POST /api/items              ← Add item (auto-sent from mobile app)
GET /api/items?q=search     ← Search items
```

### **Admin API** (requires JWT token)
```
POST /api/admin/login               ← Admin login
GET /api/admin/items                ← List all items (approved & pending)
PUT /api/admin/items/:id            ← Update item (verify, mark found, etc)
DELETE /api/admin/items/:id         ← Delete item
```

---

## 💾 Your Questions Answered

### **Q: If I add an item in the app, is it stored anywhere?**
✅ **YES!** 
- Stored in `backend/db.json` permanently
- Survives app restarts
- BUT: Not visible to public until admin approves

### **Q: Will the item appear in the list immediately?**
❌ **NO!**
- Item appears in admin dashboard (pending approval)
- Item does NOT appear in public list until admin clicks "Verify"
- This prevents spam/fake items from cluttering the list

### **Q: What happens when someone claims an item is found?**
1. User contacts the finder (via Contact Us email)
2. If confirmed found, admin marks it as "Found" 
3. Status changes from MISSING to FOUND
4. Item still visible but marked as already claimed

### **Q: Can the admin see items that users added?**
✅ **YES!**
- Admin dashboard shows ALL items (approved & pending)
- Admin can approve new submissions
- Admin can manage everything

### **Q: How do users know if an item needs admin approval?**
- Users add item and see: "Item submitted! Admin will review and approve it."
- Item appears in their local list as "pending"
- When approved by admin, it automatically updates to show in public list

---

## 🚀 To Test This Workflow

1. **Start mobile app:** `npm start`
2. **Start backend:** `cd backend && npm start`
3. **Open admin dashboard:** `http://localhost:4000/admin` (admin/password123)

### **Test Steps:**
1. Add item in mobile app ("Add a Lost Item")
2. See confirmation message
3. Check admin dashboard → Item appears in table but NOT verified
4. Click "Verify" on admin dashboard
5. Go back to mobile app → Item now appears in "Approved Lost Items" list
6. In admin, click "Mark Found" 
7. In mobile app, item now shows status as "FOUND"

---

## 🎯 Summary

| Feature | Status |
|---------|--------|
| Items stored permanently | ✅ YES (backend/db.json) |
| Items require admin approval | ✅ YES (before public sees) |
| Users see only approved items | ✅ YES |
| Admin sees all items | ✅ YES |
| Admin can verify items | ✅ YES |
| Admin can mark items found | ✅ YES |
| Admin can delete items | ✅ YES |
| Data survives app restart | ✅ YES |

---

**Everything is working as you requested!** 🎉
