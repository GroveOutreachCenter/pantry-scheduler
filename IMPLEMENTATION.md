# Community Pantry Scheduler implementation notes

## Current static version

This folder is a browser-only demo:

- Public view: `index.html?view=public`
- Staff view: `index.html?view=staff`
- The public view shows a `Staff access` button instead of an open staff tab.
- Demo staff code: `1234`
- Bookings and weekly hours are saved in `localStorage`, which means they only exist in the browser and device where they were entered.

Because this is static, the staff code is only a light demo gate. Use it for demos, training, and planning, but not for live public scheduling until it has a real backend and login.

## What regular scheduling needs

For real scheduling, add these pieces:

1. A hosted database
   - Store pantry hours and bookings in one shared place.
   - Good simple choices are Supabase, Firebase, Airtable, or a small custom app with PostgreSQL.

2. Staff authentication
   - Public visitors should only see open slots and submit bookings.
   - Staff should log in before viewing names, phone numbers, notes, exports, or schedule settings.

3. Double-booking protection
   - Enforce one booking per day, time, and shopper slot in the database.
   - Do this with a unique constraint or transaction, not only with front-end checks.

4. Basic data model
   - `pantry_hours`: day of week, enabled status, block label, start time, end time.
   - `bookings`: day/date, time, shopper slot, client name, phone, household size, notes, created timestamp.
   - For ongoing weekly scheduling, add a real calendar date to each booking instead of storing only Monday, Tuesday, etc.

5. Deployment
   - Host the public view at a simple URL such as `/schedule`.
   - Host the staff view at `/staff/schedule`, protected by login.
   - Keep HTTPS enabled because phone numbers and notes are private client information.

## Suggested next build step

The fastest practical upgrade is a Supabase-backed version:

1. Create a Supabase project.
2. Add `pantry_hours` and `bookings` tables.
3. Enable row-level security.
4. Allow anonymous users to read available slots and insert booking requests.
5. Allow only authenticated staff users to read all booking details, update hours, clear bookings, and export CSV.
6. Replace the current `localStorage` functions in `app.js` with API calls.

The current code is already separated around `loadBookings`, `saveBookings`, `loadDays`, and `saveDays`, so those functions are the main places to replace when moving from demo storage to production storage.
