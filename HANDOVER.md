# Answer This — Native App Conversion: Handover

Last updated: 2026-09-20

## ⚠️ Architecture pivot (2026-09-20) — read this first

Everything below this notice describes an **earlier, superseded plan** (Supabase-backed, shared multi-app project). That direction has been dropped. The app is now **fully local/offline**:

- **No backend, no database.** Game history/settings/cached content live in `AsyncStorage`; the admin's PIN + GitHub token live in `expo-secure-store`.
- **Content sync** = the same public static `questions.json` this repo has always served via GitHub Pages (`https://airfohsah.github.io/answerthis/questions.json`), fetched read-only by every install (`src/lib/questionsRepo.js`), with a three-tier fallback (remote → cached copy → bundled `src/data/questions.json`) — same shape as before, just no Supabase in the remote tier.
- **Admin auth** is a PIN the admin creates on first run (`src/lib/adminAuth.js`, salted SHA-256 via `expo-crypto`, no more hardcoded `answerthis2024`). Their GitHub PAT is entered once at that same first-run setup and stored in `expo-secure-store` — never re-typed again on that device, gated behind the PIN.
- **Admin writes** stage locally in memory (`src/lib/adminRepo.js`) and commit to GitHub only on an explicit "Push Changes" action (`src/lib/githubContent.js`, get-sha-then-PUT against the Contents API, same pattern the old `admin.html` used, scoped to just `questions.json` — `index.html`/`sw.js` are **not** touched by the native admin, the legacy web PWA is left frozen as-is).
- Supabase (`src/lib/supabaseClient.js`, `@supabase/supabase-js`, the `answerthis` Postgres schema, the SQL below) has been fully removed from the native app. The "Schema SQL" / "What's blocking a real device test" sections below are **historical, not applicable**.
- Root `questions.json` was synced to the canonical 3,630-question dataset (`data/questions.canonical.json`) as part of this pivot, since that file is now the one the native app's admin pushes to and every install fetches from.

**Update (same day):** the pivot above is fully implemented and both a `development` and a `preview` local Android build succeeded in WSL2 (see the plan file for the exact commands). `eas init --force` created and linked the EAS project (`app.json` now has a real `extra.eas.projectId`) — the account turned out to already have an active EAS session shared from other local projects, so no interactive `eas login` was actually needed. `npx expo-doctor` also caught real dependency drift (including a known Hermes memory-regression bug in `expo@57.0.8`) that's now fixed — all 21 checks pass. Build artifacts: `answerthis-dev.apk` (186MB, `expo-dev-client`, needs `npx expo start --dev-client` running to load JS) and `answerthis-preview.apk` (76MB, standalone, installable and runnable with no dev server) are both at the repo root, gitignored.

Remaining blockers — these genuinely need the device owner, not something that can be done on their behalf:
1. **Device install + verification pass.** No physical device was connected in the build environment. Sideload `answerthis-preview.apk`, then: first-run admin setup (create a PIN, enter your real GitHub PAT — has to be typed on-device), edit a question, push, confirm the commit lands on `github.com/Airfohsah/answerthis`, confirm a second install/reinstall picks it up, confirm offline/airplane-mode fallback, confirm backup export/import, confirm the forgot-PIN reset path.
2. App icons are still the flat stopgap noted below; real 1024×1024 artwork is still outstanding.
3. Once the device pass above confirms everything works, a final `production`-profile local build is the last step before distribution (held off on that build until correctness is confirmed on-device, since it churns a real signing keystore + EAS build-number state).

See the plan file used to execute this pivot for full milestone detail: `C:\Users\Airfohsah\.claude\plans\c-users-airfohsah-downloads-local-eas-b-sunny-treasure.md`.

---

## Original plan (superseded — kept for history only)

Last updated: 2026-07-25

## What this is

Converting "Answer This — Trivia Naija" from a static PWA (GitHub Pages, no backend) into a native Android app (Expo/React Native), with the admin panel built **inside the app** instead of the old separate `admin.html` + GitHub-commit workflow. This fixes two real security issues found in the original: a hardcoded plaintext admin password, and a GitHub PAT typed into a browser form.

The old PWA source (`index.html`, `admin.html`, `sw.js`, `manifest.json`, `questions.json`, `icon-*.png`) is still sitting at the repo root, untouched — **do not delete it yet**. The plan is to keep it live until the native app is fully verified, then retire it (see "Decisions" below).

## Decisions already made (don't re-litigate these)

- **Framework**: Expo / React Native, mirroring the pattern already proven in the `verified` repo's `mobile/` app (same Supabase-client shape, same `context` + role-gated-admin-screens pattern, same EAS config shape).
- **Platforms**: Android only for v1.
- **Web fate**: retire the GitHub Pages PWA once the native app is verified working — this is a one-time cutover, not a permanent dual-surface.
- **Backend**: a **separate Postgres schema** (`answerthis`) inside one shared Supabase project used by this app + "Watin be this" + See-Oh-Dee-Emm (the CODM league app). **Never** verified's Supabase project, and this codebase must **never** be merged into the `verified` repo — always a separate repo/directory.
- **Builds**: **local builds only** (`eas build --local` or `npx expo run:android`) — explicitly not Expo's cloud build service.

## Current status (2026-07-25)

Everything below is built and the app **bundles cleanly** (`npx expo export --platform android` — 987 modules, zero errors). It has **not** been run on a device or emulator yet (none was available in the build environment), and it has **no real Supabase backend yet** — see "What's blocking a real test" below.

### Done
- [x] Repo cloned locally to `C:\Users\Airfohsah\Desktop\answerthis` with full git history (not a shallow clone — can push back to `github.com/Airfohsah/answerthis`).
- [x] **Question data reconciled.** The old repo had two data sources that had drifted: `questions.json`/`index.html`'s embedded fallback (3,424 questions, live) vs. `admin.html`'s own embedded fallback (3,630 questions — a stale, never-fully-pushed superset). Diffed them: all 3,424 live questions were byte-identical in both, and the extra 206 in admin.html's set were well-formed, legitimate content with zero id collisions. **Merged to 3,630 questions, kept as canonical.** Also fixed the one real bug found: question `brt_h2` (dark-room riddle) had an `answer` that wasn't among its own `options` — added "The match" as an option. Full validation pass (id uniqueness, category refs, answerability) now finds **zero** problems across all 3,630 questions.
  - Canonical dataset: `data/questions.canonical.json` (pretty-printed, for reference/seeding) and `src/data/questions.json` (same content, bundled into the app as the offline fallback — see below).
- [x] Expo app scaffolded at repo root (SDK 57, React 19.2, RN 0.86 — newer than verified/mobile's SDK 54, that's fine, no need to match versions exactly). Full dependency stack installed: React Navigation v7, `@supabase/supabase-js`, AsyncStorage, `expo-font` + `@expo-google-fonts/syne` + `@expo-google-fonts/dm-sans` (bundled fonts, not the old Google Fonts CDN `<link>`), `expo-file-system`/`expo-sharing` (data export), `expo-document-picker` (bulk import file upload), `expo-dev-client`.
- [x] Core app structure, mirroring `verified/mobile`'s shape:
  - `src/lib/supabaseClient.js` — same AsyncStorage-session pattern as verified/mobile, scoped to `db: { schema: 'answerthis' }`.
  - `src/context/AdminStatusProvider.js` — mirrors verified/mobile's `UserStatusProvider` pattern (much simpler: just `{user, isAdmin, loading}`, checks a Supabase `admins` table).
  - `src/context/DataProvider.js` — loads categories/questions once on app start via `src/lib/questionsRepo.js`'s **three-tier fallback**: live Supabase query → last cached copy (AsyncStorage) → bundled `src/data/questions.json`. This means gameplay works even with zero backend connectivity.
  - `src/navigation/RootNavigator.js` + `MainTabNavigator.js` — bottom tabs (Home/History/Profile) + a stack for Setup→Game→Results and all admin screens.
  - `src/theme/index.js` — carries forward the original gold `#f5a623` on near-black `#0a0a0f` brand, Syne (display) + DM Sans (body) fonts.
- [x] **All player-facing screens** (`src/screens/main/`): `HomeScreen`, `SetupScreen`, `GameScreen`, `ResultsScreen`, `HistoryScreen`, `HistoryDetailScreen`, `ProfileScreen`.
  - `GameScreen.js` implements all 4 modes with the exact rules found in the original-app audit: Question mode (no timer, except a 30s per-question ring on Hard), Countdown (session timer, default 60/90/120s by difficulty or custom, Hard difficulty adds -10s wrong/-5s skip penalties), Survival (always starts at 60s regardless of difficulty, +5s correct/-10s wrong/-5s skip, refills its question pool on exhaustion), Multiplayer (2-10 players, each gets the same base question set independently shuffled, 3s transition screen between turns).
  - Game logic lives in `src/lib/gameConstants.js` (all the numeric rules, named and commented with which mode/difficulty they apply to), `src/lib/gamePool.js` (unseen-question tracking + progressive fallback: category+difficulty → category → difficulty → all), `src/lib/buildGame.js` (assembles per-player queues), `src/lib/fuzzyMatch.js` (Levenshtein-≤1 text-answer matching), `src/lib/history.js` (game log, streak calc, profile stats — all AsyncStorage-backed, replacing the old `localStorage` calls 1:1).
- [x] **All admin screens** (`src/screens/main/admin/`): `AdminLoginScreen` (Supabase Auth email/password), `AdminHomeScreen` (dashboard + per-category stat breakdown), `AdminQuestionsScreen` (search/filter/paginate/delete) + `AdminQuestionEditScreen` (add/edit form), `AdminCategoriesScreen` + `AdminCategoryEditScreen` (add/edit, **and a real cascade-safe delete** — if a category still has questions, you must pick a category to reassign them to before it'll let you delete; the old admin.html just warned and orphaned them), `AdminBulkImportScreen` (paste or load-from-file JSON, preview before committing), `AdminBulkDeleteScreen` (paste/load ids, preview, confirm). All CRUD goes through `src/lib/adminRepo.js` straight to Supabase — no more GitHub PAT, no more 3-file commit dance.
- [x] `app.json` configured: name "Answer This", Android package `com.answerthis.trivianaja` (reusing the id already referenced in the old repo's `.well-known/assetlinks.json`), dark-only `userInterfaceStyle` (the whole brand is dark, there was never a light mode). `eas.json` configured with `development`/`preview`/`production` profiles, Android-only, matching verified/mobile's shape.
- [x] App icons swapped in as a **stopgap**: copied the existing `icon-512.png`/`icon-192.png` into `assets/icon.png` etc. These are flat, non-padded images being used where Expo really wants a proper 1024×1024 source with safe-zone padding for the adaptive icon — it'll work for testing but will likely look cropped/wrong on real adaptive icon masks. **Needs real design work before a Play Store submission.**

### What's blocking a real device test
1. **No Supabase project exists yet.** `.env` has placeholder values (`REPLACE_WITH_SUPABASE_PROJECT_URL` / `REPLACE_WITH_SUPABASE_ANON_KEY`). This requires the user's Supabase dashboard access — not something that can be done from here. Once it exists:
   - Create the `answerthis` schema (see SQL below) and expose it via Supabase's Data API settings.
   - Fill in real values in `.env`.
   - Seed `categories`/`questions` from `data/questions.canonical.json`.
2. **No EAS project id** in `app.json` (`extra.eas.projectId`) — needs `eas login` with the user's Expo account, then `eas init`, before EAS build profiles can run (even locally).
3. **No emulator/device was available** in the build environment — Android SDK + `adb` + JDK 17 are present locally, but no AVD is set up and no physical device was connected. The app has only been verified via `npx expo export` (proves it bundles with no import/syntax errors — not the same as seeing it run).
4. App icons are the stopgap described above.

## Schema SQL (run this in the Supabase SQL editor once the project exists)

```sql
create schema if not exists answerthis;

create table answerthis.categories (
  id text primary key,
  name text not null,
  icon text not null
);

create table answerthis.questions (
  id text primary key,
  category text not null references answerthis.categories(id),
  difficulty text not null check (difficulty in ('easy','medium','hard')),
  type text not null check (type in ('multiple','text')),
  question text not null,
  options text[],
  answer text not null
);

create table answerthis.admins (
  user_id uuid primary key references auth.users(id)
);

alter table answerthis.categories enable row level security;
alter table answerthis.questions enable row level security;
alter table answerthis.admins enable row level security;

-- Public can read categories/questions (no login needed to play, matches old behavior).
create policy "public read categories" on answerthis.categories for select using (true);
create policy "public read questions" on answerthis.questions for select using (true);

-- Only admins can write.
create policy "admin write categories" on answerthis.categories for all
  using (exists (select 1 from answerthis.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from answerthis.admins a where a.user_id = auth.uid()));
create policy "admin write questions" on answerthis.questions for all
  using (exists (select 1 from answerthis.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from answerthis.admins a where a.user_id = auth.uid()));

-- admins table itself: only readable by the row owner (used by AdminStatusProvider's check).
create policy "read own admin row" on answerthis.admins for select using (user_id = auth.uid());
```

Then in the Supabase dashboard: **Settings → Data API → Exposed schemas**, add `answerthis` to the list (alongside `public`).

To make someone an admin after they sign up via Supabase Auth: `insert into answerthis.admins (user_id) values ('<their auth.users.id>');`

To seed questions/categories from the canonical JSON, a small script reading `data/questions.canonical.json` and calling `supabase.from('categories').insert(...)` / `.from('questions').insert(...)` (service-role key, run once, not from the app) is the straightforward way — not yet written.

## Next steps, in order

1. User creates the Supabase project (separate from verified's, shared with Watin be this / See-Oh-Dee-Emm) and runs the schema SQL above.
2. Fill in real `.env` values.
3. Seed `categories`/`questions` from `data/questions.canonical.json`.
4. Create a first admin user (sign up via Supabase Auth dashboard or the app's own auth, then insert into `answerthis.admins`).
5. `eas login` + `eas init` to get a real `projectId` into `app.json`.
6. Get it running on a device or emulator (`npx expo run:android` for a quick local debug build, or `eas build --local -p android --profile development`).
7. Manual pass through all 4 game modes + every admin CRUD action against real data.
8. Confirm RLS actually blocks anon writes (e.g. `curl` the REST API with just the anon key, expect a rejection).
9. Real 1024×1024 icon/adaptive-icon artwork before any Play Store submission.
10. Once verified end-to-end: retire the GitHub Pages PWA (`index.html`/`admin.html`/`sw.js` etc. can come out of this repo at that point, not before).

## Reference

- Full original audit (data model, every game rule, every admin capability, security findings, PWA bugs) was done 2026-07-25 against the pre-conversion `index.html`/`admin.html` — the rule constants in `src/lib/gameConstants.js` and the docstring-style comments throughout `src/lib/` are the distilled, load-bearing output of that audit. If game behavior ever seems to disagree with this app's implementation, trust `gameConstants.js` as the audited source of truth over memory of the old PWA.
- See-Oh-Dee-Emm (CODM league) is a separate, not-yet-started conversion sharing the same Supabase project/account — do not conflate the two codebases.
