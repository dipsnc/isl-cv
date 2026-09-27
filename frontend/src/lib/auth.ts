// Browser-only "auth": accounts live in IndexedDB (see db.ts), passwords are
// never stored in plaintext (PBKDF2 + a random per-user salt via Web Crypto),
// and the current session is a small, non-sensitive pointer in localStorage
// — just { email, name }, no password, no hash.
//
// Worth knowing: this is real hashing, but there's no server secret and no
// gatekeeper — anyone with devtools access to this browser can open
// IndexedDB and see the (hashed) user records. That's fine for a local demo
// / learning project where "auth" just needs to separate one person's
// progress from another's on the same machine. It is not a substitute for
// server-side auth if you ever have real users or real secrets.
import { dbGet, dbPut, STORES } from '@/lib/db';

export type SessionUser = { email: string; name: string };

type StoredUser = {
  email: string;
  name: string;
  salt: string;
  hash: string;
  createdAt: number;
};

const SESSION_KEY = 'signlearn-session';
const PBKDF2_ITERATIONS = 100_000;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  return out;
}

function randomSaltHex(): string {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
}

async function hashPassword(password: string, saltHex: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: hexToBytes(saltHex), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

export async function registerUser(name: string, email: string, password: string): Promise<SessionUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await dbGet<StoredUser>(STORES.users, normalizedEmail);
  if (existing) throw new Error('An account with that email already exists.');

  const salt = randomSaltHex();
  const hash = await hashPassword(password, salt);
  const user: StoredUser = { email: normalizedEmail, name: name.trim(), salt, hash, createdAt: Date.now() };
  await dbPut(STORES.users, user);

  const session: SessionUser = { email: user.email, name: user.name };
  setSession(session);
  return session;
}

export async function loginUser(email: string, password: string): Promise<SessionUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await dbGet<StoredUser>(STORES.users, normalizedEmail);
  if (!user) throw new Error('No account found with that email.');

  const hash = await hashPassword(password, user.salt);
  if (hash !== user.hash) throw new Error('Incorrect password.');

  const session: SessionUser = { email: user.email, name: user.name };
  setSession(session);
  return session;
}

const DEMO_EMAIL = 'demo@signlearn.local';
const DEMO_PASSWORD = 'signlearn-demo-preview';
const DEMO_NAME = 'Aarav';

/** Powers the "Try the preview as Aarav" button — creates the demo account
 * on first use, then just logs into it (with real, persisted progress). */
export async function loginAsDemoUser(): Promise<SessionUser> {
  const existing = await dbGet<StoredUser>(STORES.users, DEMO_EMAIL);
  if (existing) return loginUser(DEMO_EMAIL, DEMO_PASSWORD);
  return registerUser(DEMO_NAME, DEMO_EMAIL, DEMO_PASSWORD);
}

export function getSession(): SessionUser | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setSession(session: SessionUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/** Convenience for the couple of pages that just want a display name. */
export function getSessionUserName(): string {
  return getSession()?.name || 'Learner';
}
