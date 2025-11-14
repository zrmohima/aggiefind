# 📊 AggieFind Workflow — Visual Summary

## The Big Picture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     USER ADDS ITEM (Mobile App)                    │
│  - Fill form: Name, Description, Location, Date, Finder           │
│  - Click "Save Item"                                               │
│  - Message: "Item submitted! Admin will review and approve it."   │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  ITEM STORED IN BACKEND    │
        │  (backend/db.json)         │
        │                            │
        │  verified: false           │
        │  found: false              │
        └────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │  👤 ADMIN REVIEWS (Admin Dashboard)    │
        │  - Sees item in pending list           │
        │  - Reads details                       │
        │  - Is this a real lost item?           │
        │  - Clicks "Verify"                     │
        └────────────────┬───────────────────────┘
                         │
                         ▼
        ┌─────────────────────────────┐
        │  ITEM UPDATED IN BACKEND    │
        │                             │
        │  verified: true ✅          │
        │  verifiedBy: "admin"       │
        └─────────────────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────────┐
        │  PUBLIC CAN NOW SEE ITEM 👥          │
        │  - "Approved Lost Items" list        │
        │  - Search results                    │
        │  - Shows: MISSING (yellow badge)    │
        └──────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────┐
        │  SOMEONE CLAIMS THEY FOUND IT 🎉      │
        │  - Contacts the finder                │
        │  - They confirm & exchange            │
        │  - Admin marks as "Found"             │
        │  - Status: FOUND (green badge)       │
        └────────────────────────────────────────┘
```

---

## Timeline View

```
TIME    EVENT                           VISIBLE TO PUBLIC?
────────────────────────────────────────────────────────

T+0     User submits item              ❌ NO
        └─ verified: false

T+5min  Admin clicks "Verify"          ✅ YES
        └─ verified: true
        └─ Item appears in list

T+2hr   Someone claims item            ✅ YES
        Admin marks as "Found"          (status: FOUND)

T+3hr   Item shows as claimed          ✅ YES
        └─ Status: FOUND
```

---

## Data Storage Diagram

```
BACKEND (Permanent Storage)
backend/db.json
{
  "items": [
    {
      "id": "123",
      "name": "MacBook Pro",
      "description": "Silver, 13 inch",
      "location": "Zuhl Library",
      "dateFound": "2025-10-24",
      "foundBy": "John Doe",
      "found": false,           ← Mark found/not found
      "verified": true,         ← Admin approval
      "verifiedBy": "admin",    ← Who verified
      "createdAt": 1699900000
    }
  ]
}
        │
        ├─→ Public sees only items where verified: true
        │
        └─→ Admin sees ALL items (verified or not)
```

---

## Screen Flow

```
MOBILE APP
─────────────────────────────────────────

Home Screen
    ├─ Add a Lost Item      ← User submits
    │  └─→ Form (name, desc, location, date, finder)
    │       └─→ Save
    │           └─→ Sends to backend
    │               └─→ "Item submitted! Admin will review..."
    │
    ├─ Show a List          ← Public list
    │  └─→ Only approved items shown
    │       └─→ Status badges: MISSING/FOUND
    │
    └─ Search Lost Items    ← Search approved only
       └─→ Filter approved items
           └─→ Status badges: MISSING/FOUND


ADMIN DASHBOARD (http://localhost:4000/admin)
─────────────────────────────────────────────

Login: admin / password123
    │
    └─→ Admin view
        ├─ List ALL items
        │  ├─ Pending items (verified: false)
        │  └─ Approved items (verified: true)
        │
        └─ Per item actions:
           ├─ Verify / Unverify
           ├─ Mark Found / Unfound
           └─ Delete
```

---

## Status Badges

```
MISSING (Yellow)
████████████████
  🔴 MISSING
████████████████
Still looking for this item


FOUND (Green)
████████████████
  🟢 FOUND
████████████████
Item has been claimed/returned
```

---

## Admin Dashboard Table

```
┌──────────────────┬──────────────────┬──────────────┬─────────────────┐
│ Item Name        │ Location         │ Status       │ Actions         │
├──────────────────┼──────────────────┼──────────────┼─────────────────┤
│ MacBook Pro      │ Zuhl Library     │ Verified ✓   │ [Unverify]      │
│ Silver, 13"      │ 2nd floor        │ MISSING 🔴   │ [Mark Found]    │
│ Found by: John   │                  │              │ [Delete]        │
├──────────────────┼──────────────────┼──────────────┼─────────────────┤
│ Blue Backpack    │ Student Center   │ Unverified ✗ │ [Verify]        │
│ Nike brand       │                  │ MISSING 🔴   │ [Mark Found]    │
│ Found by: Jane   │                  │              │ [Delete]        │
├──────────────────┼──────────────────┼──────────────┼─────────────────┤
│ Gold Ring        │ Library Cafe     │ Verified ✓   │ [Unverify]      │
│ Size 7           │                  │ FOUND 🟢     │ [Mark Unfound]  │
│ Found by: Mike   │                  │              │ [Delete]        │
└──────────────────┴──────────────────┴──────────────┴─────────────────┘
```

---

## Public List View (Mobile App)

```
┌──────────────────────────────────────────────────────────┐
│ Approved Lost Items                      [Back]           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Silver MacBook Pro              [MISSING] 🔴             │
│ 13 inch with stickers                                    │
│ Found at: Zuhl Library 2nd floor                         │
│ Found on: 2025-10-24                                     │
│ Found by: John Doe                                       │
│ Verified by: admin                                       │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Blue Backpack                   [MISSING] 🔴             │
│ Nike brand                                               │
│ Found at: Student Center                                 │
│ Found on: 2025-10-25                                     │
│ Found by: Jane Smith                                     │
│ Verified by: admin                                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Data Flow Summary

```
USER INPUT                  BACKEND                    PUBLIC VIEW
─────────────────────────────────────────────────────────────────

Add Item                    Store in db.json           ❌ Not visible
(mobile app)                verified: false            (pending)
    │                           │
    └──────────────────────────→│
                                │
                        Admin Reviews
                        Clicks "Verify"
                                │
                        Update in db.json
                        verified: true
                                │
                                └──────────────────────→ ✅ Visible
                                                        (in list & search)

                        Someone Found It
                        Admin Clicks
                        "Mark Found"
                                │
                        Update in db.json
                        found: true
                                │
                                └──────────────────────→ ✅ Still visible
                                                        (but marked FOUND)
```

---

## Key Facts

✅ **Items ARE stored permanently** in `backend/db.json`
✅ **Items require admin approval** before public sees
✅ **Admin sees everything** (all items, all statuses)
✅ **Public sees only approved items** (verified: true)
✅ **Found items are marked** with status badge
✅ **Data survives app restarts** (stored in backend)

---

**That's the complete workflow!** 🎉
