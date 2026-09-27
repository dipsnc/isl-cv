# In-browser "backend" — IndexedDB auth + progress

No server, no Mongo. Two IndexedDB object stores inside the user's own
browser do everything the app needs: a `users` store (email → hashed
password + name) and a `progress` store (email → sign progress). The
current session is a tiny, non-sensitive pointer in `localStorage`
(`{ email, name }` — never a password).

## Files in this zip

```
src/
├── App.tsx              ← replace
├── router.tsx             ← replace
├── lib/
│   ├── db.ts                ← new — raw IndexedDB wrapper
│   ├── auth.ts               ← new — register/login/session
│   └── progress.ts            ← replace — now async, keyed by user email
└── pages/
    ├── auth.tsx              ← replace — wired to real register/login
    ├── lesson.tsx             ← replace — one-line fix (see below)
    └── practice.tsx            ← replace — one-line fix (see below)
```

If you're working from the earlier "modular frontend" zip, this is a
drop-in overwrite of those same paths. Nothing else in `src/` needs to
change — `dashboard.tsx`, `progress-page.tsx`, `app-shell.tsx`, etc. all
still just receive `user`/`progress` as props, same as before.

## Step by step

1. **Copy the files in.** Drop this zip's `src/` into your `frontend/src/`,
   overwriting the 8 files listed above.

2. **That's it for code.** No new npm packages — everything here uses the
   browser's native `indexedDB`, `crypto.subtle`, and `localStorage` APIs.
   `npm run dev` and it works.

3. **Try it:**
   - Go to `/auth`, register with a name/email/password → you're taken to
     `/dashboard`.
   - Open devtools → Application → IndexedDB → `signlearn` → `users`. You'll
     see your account with a `salt` and `hash`, never a plaintext password.
   - Practice a sign, complete it, check `progress` store — your progress is
     there too, keyed by your email.
   - Sign out, log back in with the same email/password → progress is still
     there.
   - Register a second account → it gets its own separate progress.
   - "Try the preview as Aarav" still works — it lazily creates a demo
     account (`demo@signlearn.local`) on first use, then logs into it, so
     the demo persists progress too instead of resetting every visit.

## How auth actually works

- **Register**: normalizes the email, generates a random 16-byte salt,
  derives a password hash with PBKDF2 (100k iterations, SHA-256) via
  `crypto.subtle`, and stores `{ email, name, salt, hash }` in the `users`
  store. Throws if the email's taken.
- **Login**: looks up the user by email, re-derives the hash with the
  stored salt, and compares. Throws `"Incorrect password."` or
  `"No account found..."` on mismatch — `pages/auth.tsx` surfaces those in
  the existing error UI.
- **Session**: on success, `{ email, name }` is written to
  `localStorage['signlearn-session']`. `App.tsx` reads that on load, and
  loads that user's progress from IndexedDB into state. Log out just clears
  the pointer — the account and its progress stay in IndexedDB untouched.

## The two one-line fixes in lesson.tsx / practice.tsx

Both pages used to read `localStorage.getItem('signlearn-user')` directly
as a quick fallback for the sidebar's display name (a shortcut from the
original single-file `App.tsx`). That key no longer exists — the session
is now `{ email, name }` under a different key — so both now call
`getSessionUserName()` from `lib/auth.ts` instead, which does the same job
properly.

## Be aware of (worth knowing, not necessarily worth fixing)

- **This isn't real security.** The hashing is genuine, but there's no
  server and no secret — anyone with devtools access to *this browser* can
  read the (hashed) user table. That's fine for separating progress
  between people using the same machine / for a demo or portfolio project.
  Don't reuse this pattern if real users will ever type a real password
  they use elsewhere.
- **Per-browser, per-device.** IndexedDB doesn't sync across devices or
  browsers. Clearing site data wipes accounts and progress.
- **No password reset / recovery**, obviously — there's nowhere to send an
  email. If someone forgets their password, the only path is registering
  a new account.
