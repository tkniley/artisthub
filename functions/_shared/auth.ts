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
