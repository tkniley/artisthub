import type { Env } from '../types';

const encoder = new TextEncoder();

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function toBase64Url(value: string): string {
  const bytes = encoder.encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function verifyPasscode(env: Env, passcode: string): Promise<boolean> {
  const expected = (env.STUDIO_PASSCODE_HASH || '').trim().toLowerCase();
  if (!expected) return false;
  const hashed = await sha256Hex(passcode);
  return hashed === expected;
}

const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_FAILS = 8;

function clientIp(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

/** Returns an error Response if this IP is temporarily locked out. */
export async function assertAuthNotRateLimited(
  request: Request,
  env: Env
): Promise<Response | null> {
  const ip = clientIp(request);
  const now = Date.now();
  const row = await env.DB.prepare(
    'SELECT fails, window_start FROM auth_attempts WHERE ip = ?'
  )
    .bind(ip)
    .first<{ fails: number; window_start: number }>();

  if (!row) return null;
  if (now - row.window_start > AUTH_WINDOW_MS) return null;
  if (row.fails < AUTH_MAX_FAILS) return null;

  const minutes = Math.max(1, Math.ceil((AUTH_WINDOW_MS - (now - row.window_start)) / 60000));
  return new Response(
    JSON.stringify({
      error: `Too many incorrect attempts. Try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`,
    }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function recordAuthFailure(request: Request, env: Env): Promise<void> {
  const ip = clientIp(request);
  const now = Date.now();
  const row = await env.DB.prepare(
    'SELECT fails, window_start FROM auth_attempts WHERE ip = ?'
  )
    .bind(ip)
    .first<{ fails: number; window_start: number }>();

  if (!row || now - row.window_start > AUTH_WINDOW_MS) {
    await env.DB.prepare(
      `INSERT INTO auth_attempts (ip, fails, window_start) VALUES (?, 1, ?)
       ON CONFLICT(ip) DO UPDATE SET fails = 1, window_start = excluded.window_start`
    )
      .bind(ip, now)
      .run();
    return;
  }

  await env.DB.prepare('UPDATE auth_attempts SET fails = fails + 1 WHERE ip = ?')
    .bind(ip)
    .run();
}

export async function clearAuthFailures(request: Request, env: Env): Promise<void> {
  const ip = clientIp(request);
  await env.DB.prepare('DELETE FROM auth_attempts WHERE ip = ?').bind(ip).run();
}

export async function createSessionToken(env: Env, rememberMe: boolean): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const ttl = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 12;
  const payload = JSON.stringify({ iat: now, exp: now + ttl });
  const body = toBase64Url(payload);
  const sig = await hmacSign(env.SESSION_SECRET || 'dev-secret', body);
  return `${body}.${sig}`;
}

export async function verifySessionToken(env: Env, token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  const [body, sig] = token.split('.');
  if (!body || !sig) return false;
  const expected = await hmacSign(env.SESSION_SECRET || 'dev-secret', body);
  if (expected !== sig) return false;
  try {
    const payload = JSON.parse(fromBase64Url(body)) as { exp?: number };
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

export async function requireAuth(request: Request, env: Env): Promise<Response | null> {
  const ok = await verifySessionToken(env, getBearerToken(request));
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Please sign in to Studio first.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}
