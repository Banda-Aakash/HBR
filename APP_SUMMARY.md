# HomeBridgeReality — Current State Summary

## Overview
A React Native mobile application for real estate — property sales, rental management, and interior design services. Two user modes (Owner/Buyer and Tenant/Renter) with a toggle switch in the profile, backed by a PostgreSQL database via Express + Prisma API.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native (CLI, not Expo), TypeScript |
| Navigation | React Navigation (bottom tabs + native stack) |
| Backend API | Express.js, TypeScript |
| Database | PostgreSQL 16 (local, migration-ready for cloud) |
| ORM | Prisma 6.9 |
| Icons | react-native-vector-icons (MaterialIcons) |

---

## User Modes

### Owner / Buyer Mode
| Tab | What it does |
|---|---|
| **Home** | Browse properties for sale. Featured carousel + full listings. Search bar with filter modal (location, price, type, bedrooms, sort). |
| **Bookings** | View upcoming and past visit bookings. Cancel visits. Tab switcher (Upcoming / Past). |
| **My Rentals** | Manage owned rental properties. See state machine status per property. Add new properties. Tap to view details or advance state. |
| **Interiors** | 3 categories: Rental Ready, Moderate, Luxury. Tap to see sample gallery + features + price range. Enquire via WhatsApp. |
| **Profile** | User info, stats, mode toggle, account settings, sign out. |

### Tenant / Renter Mode
| Tab | What it does |
|---|---|
| **Rentals** | Browse available rental properties (marketing + occupied state). Search and filter by city. |
| **Saved** | Bookmarked properties. |
| **Profile** | Same as owner, with mode toggle to switch back. |

---

## Screens (15 total)

| Screen | Purpose |
|---|---|
| LoginScreen | Email + password login |
| RegisterScreen | Create account form |
| HomeScreen | Arch cards for featured homes, search, BHK chips, newest homes, heart button to Saved |
| BookingsTabScreen | Your visits: upcoming/past, status tracker, call agent, cancel (also opens from Profile) |
| RentalListScreen | Owner's managed properties with state badges |
| InteriorsScreen | 3 interior categories (Rental Ready / Moderate / Luxury) |
| ProfileScreen | Profile, stats, saved homes, visits, help, sign out, delete account |
| PropertyDetailScreen | Full property details, image gallery, amenities, agent info, book visit |
| BookingScreen | Date + time picker, notes, request a visit → WhatsApp |
| BookingConfirmationScreen | Visit request details, pending until the business confirms |
| TenancyDetailScreen | Full rental detail — timeline, parties, financials, documents, inspections, ledger |
| TransitionScreen | Guard checklist to advance rental state |
| AddPropertyScreen | Form to add a new rental property |
| InteriorDetailScreen | Sample gallery, features list, price range, WhatsApp enquiry |
| RentalBrowseScreen | Tenant view — browse available rentals |
| RentalPropertyDetailScreen | Tenant view of rental details, enquire via WhatsApp |
| SavedScreen | Saved homes, opened from the heart on Home or from Profile |

---

## Admin Website

Staff use a separate website in its own repo, `HBR_Website`. It lists visit requests to confirm or cancel, and manages listings. Only listings with the status Available show in the app.

The website calls this backend's `/api/admin` routes, so its address must be listed in `ALLOWED_ORIGINS`.

```bash
# Sign up in the app first, then give that account admin access
cd backend && npm run build && npm run make-admin -- person@example.com

# Take admin access away
cd backend && npm run make-admin -- person@example.com --remove
```

---

## Rental State Machine

Properties move through a lifecycle with enforced guards:

```
onboarding → marketing → agreement → occupied → notice → move_out → marketing
```

| Transition | Guards Required |
|---|---|
| onboarding → marketing | POA, ownership deed, society NOC, baseline photos, maintenance limit |
| marketing → agreement | Screening report, owner approval |
| agreement → occupied | Signed agreement, deposit received, police verification, move-in inventory |
| occupied → notice | Notice document with dated receipt |
| notice → move_out | Move-out inspection linked to move-in |
| move_out → marketing | Deposit settled, dues cleared, final statement |

---

## API Endpoints (20)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| GET | /api/auth/me | Current user |
| GET | /api/festive | Which festival theme is on today, if any |
| GET | /api/properties | List sale properties (filters, sort, `page`, `limit`) |
| GET | /api/properties/:id | Single property |
| GET | /api/bookings?mode= | User's bookings filtered by mode |
| POST | /api/bookings | Create a pending visit request (with mode) |
| PATCH | /api/bookings/:id/cancel | Cancel booking |
| GET | /api/favorites | User's saved properties |
| POST | /api/favorites/toggle | Add/remove favorite |
| GET | /api/interiors?category= | Interior designs |
| GET | /api/interiors/:id | Single interior |
| POST | /api/interiors/:id/like | Toggle like (per-user) |
| GET | /api/rentals?state= | Owner's rentals (filtered by user) |
| GET | /api/rentals/browse/all | Rentals for tenant browsing (`search`, `page`, `limit`) |
| POST | /api/rentals | Create new rental |
| GET | /api/rentals/:id | Single rental with docs, inspections, ledger |
| POST | /api/rentals/:id/transition | Advance state (with guard checks) |
| POST | /api/rentals/:id/documents | Add document to rental |
| PATCH | /api/rentals/:id | Update rental fields |
| GET | /api/properties/cities | Cities that have listings |
| GET | /api/admin/summary | Counts for the admin page (admin only) |
| GET | /api/admin/bookings | Visit requests (admin only) |
| PATCH | /api/admin/bookings/:id | Confirm or cancel a visit (admin only) |
| GET, POST | /api/admin/properties | List or add listings (admin only) |
| PUT, DELETE | /api/admin/properties/:id | Edit or delete a listing (admin only) |

---

## Database (11 tables)

| Table | Purpose |
|---|---|
| users | App users with roles |
| properties | Sale catalog (project cards) |
| bookings | Visit bookings with mode (owner/tenant) |
| favorites | User ↔ Property saves |
| interiors | Interior design catalog |
| interior_likes | Per-user likes on interiors |
| rentals | Managed rental properties with state machine |
| rental_documents | Documents attached to rentals |
| rental_inspections | Move-in/periodic/move-out inspections |
| rental_inspection_items | Room-by-room condition items |
| ledger_entries | Rent in, expenses out (append-only) |

---

## WhatsApp Integration

Three touchpoints that open WhatsApp to +91 6281889589:

1. **Book a Visit** — owner requests a visit → pre-filled message with property name, date, time
2. **Rental Enquiry** — tenant taps Enquire Now → message with property details, rent, deposit
3. **Interior Enquiry** — owner taps Enquire on WhatsApp → message with category and budget range

---

## Logo

The logo is an H made of two pillars and an arched bridge, under a roof. The master files are in `brand/`.

---

## Color Palette

High-End Heritage (Midnight Navy · Alabaster White · Muted Gold · Warm Slate):
- Primary: #0F172A (midnight navy)
- Secondary/Gold: #D4AF37 (muted gold)
- Background: #F8FAFC (alabaster)
- Text: #0F172A / #475569 / #94A3B8

Fonts are Bricolage Grotesque for headings and Instrument Sans for everything else, both under the SIL Open Font License. To change a font, replace it in `app/src/assets/fonts` and `app/android/app/src/main/assets/fonts`.

---

## Festival Themes

The app's design is The Arch all year. During a festival it swaps in that festival's colours and artwork, and decoration never sits over a property photo.

- **16 festivals**: colours are in `app/src/theme/festivals.ts`, artwork is in `brand/festive`. After changing artwork, run `node scripts/build-festive-art.js` from `app/`.
- **Dates**: `backend/src/festivals.ts` is the schedule, so dates change without an app release. Add each new year there and check Eid against the moon sighting.
- **Override**: set `FESTIVE_THEME` on the server to force a festival on (such as `diwali`) or to `none` to turn themes off.
- **Offline**: the app remembers the running festival until it ends, and falls back to The Arch if it can't find out.

---

## How to Run

```bash
# Database changes (also run this on every deploy)
cd backend && npx prisma migrate deploy

# Backend
cd backend && npx ts-node src/server.ts

# Frontend (Android)
cd app && npm run android

# Reseed database
cd backend && npx ts-node prisma/seed.ts
```

Login: `alex@example.com` / `password123`
