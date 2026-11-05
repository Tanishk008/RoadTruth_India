# Road Truth India

An independent citizen portal for India's expressways. It provides: 

- **Expressway data** for 31 corridors (expressways, ring roads and a sea link): length, cost, status, and which contractor built which package, each with sources and a last-verified date.
- **A page for every corridor** with an embedded Google Maps route, an "Open in Google Maps" directions link and clickable route stops.
- **An interactive network map**: hover a corridor to see its details, or click it to open its page. It's drawn from the data, so no map library or API key is needed
- **A contractor directory** of 18 companies with founding year, headquarters, listing, FY25 revenue and expressway work, cross-linked with the expressway entries.
- **A toll calculator** with sourced rates for 8 expressways: per-km fares between any two stops (Samruddhi, Yamuna) or full-trip fares, by vehicle class, with return-trip and no-FASTag options. Each rate is marked official, reported or estimate.
- **Share cards**: every corridor and contractor page has a generated preview image (1200×630) with its key figures and route shape, for WhatsApp, X and LinkedIn.
- **A pothole detector.** Upload or take a photo and potholes are marked with a severity grade. It uses Claude vision when `ANTHROPIC_API_KEY` is set, and otherwise a private on-device detector.
- **Report and track.** A road-issue form with up to 3 photos, GPS location (from the device, or read from the photo's EXIF), validation, saved drafts, and a reference number for tracking.
- **Duplicate detection and "me too" votes.** When a report has GPS, open reports within 300 m are suggested so citizens can back an existing one. Votes rank priorities on the map.
- **Public issues map.** Every report with GPS on the network map, coloured by severity, ringed by age (30+ days unresolved is flagged) and sized by votes.
- **Citizen report cards** on contractor and corridor pages: open reports per 100 km, median days to fix, and the share fixed within 30 days.
- **Escalation shortcuts.** Each open report has a script for the NHAI 1033 helpline and pre-written grievance text for CPGRAMS (or the state portal).
- **RTI letter generator.** After 30 days unresolved, one click drafts a Right to Information application to the right authority (English or Hindi) with the report's location, dates and photos, plus a version that fits the 3000-character limit on RTI Online.
- **Works offline.** The report page is cached by a service worker. Reports made without signal wait in an on-device outbox and are sent automatically when the connection returns.
- **English and Hindi** across the citizen flows (header, reporting, tracking, map, accounts, RTI and escalation).

Built with Next.js 16, React 19, Tailwind CSS 4 and shadcn/ui.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY for AI detection
npm run dev                  # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Develop, build or serve the app |
| `npm test` | Unit tests (detector, data integrity, validation, API route) |
| `npm run check` | Type-check, lint and test in one go |

## Project layout

```
app/                    Pages (App Router); API route in app/api/detect-pothole
components/             Header, footer, form field, image dropzone, shadcn/ui
lib/data/               Expressway + contractor data (edit here, with sources)
lib/pothole/            On-device detector, Claude response schema, client analysis flow
lib/services/backend.ts The single persistence layer (see below)
lib/supabase/, lib/auth.ts  Supabase clients and the signed-in citizen helper
supabase/migrations/    Database schema: reports, private contacts, votes, stats, photo storage
lib/rti.ts, lib/escalation.ts, lib/authorities.ts  RTI letters and escalation text, per road authority
lib/accountability.ts   Report-card maths (mirrors the SQL function)
lib/exif.ts, lib/geo.ts Photo GPS reading; distances and duplicate radius
lib/outbox.ts, public/sw.js  Offline outbox (IndexedDB) and service worker
lib/i18n/               Dictionaries (en.ts is the source of truth) and translate helpers
app/auth/actions.ts     Server Actions for sign-in, sign-up, OTP, password reset, profile
proxy.ts                Refreshes the session cookie; guards /account and /reset-password
lib/validation.ts       Zod schemas for every form
tests/                  Vitest suites
```

## Data: device-only vs shared

`lib/services/backend.ts` is the only file that reads or writes data.

- **Without Supabase** (no env vars) everything is stored in the browser, so every flow works end to end for demos: the map, votes and report cards then only reflect this device.
- **With Supabase** reports, votes and stats are shared by everyone. Contact details go to a separate table that the public API can't read.

Contact messages are still stored on the device only.

## Citizen accounts (Supabase)

Citizens can sign up and log in with **email + password** or **mobile OTP** (Indian numbers). Accounts are optional: reporting and tracking work without them. Until the env vars are set, the auth pages explain that accounts are off.

1. Create a project at [supabase.com](https://supabase.com) and copy the **Project URL** and **publishable key** (Project Settings → API) into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. Create the tables: run `supabase/migrations/20261002000000_reports.sql` in the SQL editor (or `supabase db push` with the CLI). It also creates the public `report-photos` storage bucket.
3. **Authentication → URL Configuration:** set the Site URL to your deployed URL and add `http://localhost:3000/auth/confirm` and `https://<your-domain>/auth/confirm` to the redirect allow-list.
4. **Email:** works out of the box (Supabase's built-in mailer is rate-limited to a few emails an hour; add custom SMTP before launch). Confirmation and reset links land on `/auth/confirm`.
5. **Mobile OTP:** Authentication → Sign In / Providers → Phone → enable, and connect an SMS provider (Twilio, MessageBird, Vonage or Textlocal). Indian SMS also needs DLT template registration with your provider. For development, add **test phone numbers** with fixed OTPs on the same screen — no SMS is sent.

Name and mobile are stored in the user's `user_metadata` (`full_name`, `phone`). "Me too" votes need an account (one vote per person); reporting doesn't.

### Updating report status

There's no admin screen yet. Staff update status in the Supabase table editor or SQL editor; `status_updated_at` and `resolved_at` are stamped automatically, and resolution times feed the report cards:

```sql
update reports set status = 'Forwarded' where reference = 'RTR-2026-4K9Q2X';
update reports set status = 'Resolved'  where reference = 'RTR-2026-4K9Q2X';
-- Reporter contact details (dashboard/service role only):
select c.* from report_contacts c join reports r on r.id = c.report_id where r.reference = 'RTR-2026-4K9Q2X';
```

## Offline reporting

The service worker (`public/sw.js`, production builds only) caches `/report-issue`, `/track` and their scripts on first visit, and serves cached pages within 4 seconds on weak signal. Reports submitted offline get their reference number immediately, wait in IndexedDB, and are sent when the browser comes back online (or every minute while the site is open). Sending is idempotent, so a retry never creates a duplicate. Browsers only run this while the site is open; a closed tab sends on next visit.

## Languages

English and Hindi cover the citizen flows; the language switch is in the header and is remembered on the device. Corridor data, the home page and the footer stay in English. To add a language, copy `lib/i18n/hi.ts`, translate it (TypeScript flags any missing key, and `npm test` checks placeholders), and register it in `lib/i18n/core.ts`. Please have civic and legal wording reviewed by a native speaker.

## Updating data

Edit `lib/data/expressways.ts`, `lib/data/contractors.ts` or `lib/data/tolls.ts`. For each change, add a source link and update `lastVerified`. Each corridor also needs `mapStops` (place names for Google Maps) and approximate `coords` (for the network map). `npm test` checks that:

- status and dates agree (operational roads have an opening year, others a target year)
- every contractor link points to a real entry, in both directions
- every source URL uses https

## Pothole detector

- **AI mode** (`app/api/detect-pothole/route.ts`): sends the resized photo to Claude (`claude-opus-5-5`) and gets back structured JSON with bounding boxes, severity, a summary and any other defects. It has server-side refusal fallback enabled.
- **On-device mode** (`lib/pothole/detector.ts`): classical computer vision. It models the road surface in blocks, flags regions that differ in brightness, colour or texture, and scores them on rim sharpness and shape. On a sample of 10 public real-world pothole photos it found 8 of 11 potholes, with 4 false positives. It is labelled as an estimate in the UI.

Photos are resized and their EXIF data (including GPS) is stripped in the browser before upload.
