import type { Artwork, Profile, Inquiry } from './types';

const TOKEN_KEY = 'artisthub_studio_token';

type Listener = () => void;
const listeners = new Set<Listener>();

let cachedProfile: Profile | null = null;
let cachedArtworks: Artwork[] | null = null;
let cachedCollections: string[] | null = null;
let cachedInquiries: Inquiry[] | null = null;

export const subscribe = (fn: Listener): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const notifyListeners = () => {
  listeners.forEach((fn) => fn());
};

function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStudioToken(token: string, rememberMe: boolean): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    if (rememberMe) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function clearStudioToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    // legacy keys from old client-only auth
    sessionStorage.removeItem('artisthub_studio_auth');
    localStorage.removeItem('artisthub_studio_auth');
  } catch {
    // ignore
  }
}

export function hasStudioSession(): boolean {
  return !!getToken();
}

async function api<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (auth) {
    const token = getToken();
    if (!token) throw new Error('Please sign in to Studio first.');
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(path, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

async function loadPortfolio(force = false): Promise<{
  profile: Profile;
  artworks: Artwork[];
  collections: string[];
}> {
  if (!force && cachedProfile && cachedArtworks && cachedCollections) {
    return {
      profile: cachedProfile,
      artworks: cachedArtworks,
      collections: cachedCollections,
    };
  }

  const data = await api<{
    profile: Profile;
    artworks: Artwork[];
    collections: string[];
  }>('/api/portfolio');

  cachedProfile = data.profile;
  cachedArtworks = data.artworks;
  cachedCollections = data.collections;
  return data;
}

export const loginStudio = async (passcode: string, rememberMe: boolean): Promise<void> => {
  const data = await api<{ token: string }>('/api/auth', {
    method: 'POST',
    body: JSON.stringify({ passcode, rememberMe }),
  });
  setStudioToken(data.token, rememberMe);
};

export const getProfile = async (): Promise<Profile> => {
  const { profile } = await loadPortfolio();
  return {
    ...profile,
    email: profile.email || '',
    instagramUrl: profile.instagramUrl || '',
    artsyUrl: profile.artsyUrl || '',
    pinterestUrl: profile.pinterestUrl || '',
    cv: profile.cv ? [...profile.cv] : [],
  };
};

export const saveProfile = async (profile: Profile): Promise<void> => {
  await api('/api/profile', { method: 'PUT', body: JSON.stringify(profile) }, true);
  cachedProfile = { ...profile };
  notifyListeners();
};

export const getArtworks = async (): Promise<Artwork[]> => {
  const { artworks } = await loadPortfolio();
  return [...artworks].sort((a, b) => b.createdAt - a.createdAt);
};

export const saveArtwork = async (artwork: Artwork): Promise<void> => {
  const method = cachedArtworks?.some((a) => a.id === artwork.id) ? 'PUT' : 'POST';
  const path = method === 'PUT' ? `/api/artworks/${encodeURIComponent(artwork.id)}` : '/api/artworks';
  await api(path, { method, body: JSON.stringify(artwork) }, true);

  const list = cachedArtworks ? [...cachedArtworks] : [];
  const idx = list.findIndex((a) => a.id === artwork.id);
  if (idx >= 0) list[idx] = { ...artwork };
  else list.push({ ...artwork });
  cachedArtworks = list;
  notifyListeners();
};

export const deleteArtwork = async (id: string): Promise<void> => {
  await api(`/api/artworks/${encodeURIComponent(id)}`, { method: 'DELETE' }, true);
  cachedArtworks = (cachedArtworks || []).filter((a) => a.id !== id);
  notifyListeners();
};

export const getCollections = async (): Promise<string[]> => {
  const { collections } = await loadPortfolio();
  return [...collections];
};

export const saveCollections = async (collections: string[]): Promise<void> => {
  // Compatibility shim: sync by creating missing names.
  const current = await getCollections();
  for (const name of collections) {
    if (!current.includes(name)) {
      await api('/api/collections', { method: 'POST', body: JSON.stringify({ name }) }, true);
    }
  }
  for (const name of current) {
    if (!collections.includes(name)) {
      await api(`/api/collections/${encodeURIComponent(name)}`, { method: 'DELETE' }, true);
    }
  }
  cachedCollections = [...collections];
  notifyListeners();
};

export const addCollection = async (name: string): Promise<string[]> => {
  const data = await api<{ collections: string[] }>(
    '/api/collections',
    { method: 'POST', body: JSON.stringify({ name }) },
    true
  );
  cachedCollections = data.collections;
  notifyListeners();
  return data.collections;
};

export const renameCollection = async (oldName: string, newName: string): Promise<string[]> => {
  const data = await api<{ collections: string[] }>(
    `/api/collections/${encodeURIComponent(oldName)}`,
    { method: 'PUT', body: JSON.stringify({ name: newName, oldName }) },
    true
  );
  cachedCollections = data.collections;
  // Refresh artworks so tags reflect rename
  await loadPortfolio(true);
  notifyListeners();
  return data.collections;
};

export const removeCollection = async (name: string): Promise<string[]> => {
  const data = await api<{ collections: string[] }>(
    `/api/collections/${encodeURIComponent(name)}`,
    { method: 'DELETE' },
    true
  );
  cachedCollections = data.collections;
  await loadPortfolio(true);
  notifyListeners();
  return data.collections;
};

export const getInquiries = async (): Promise<Inquiry[]> => {
  if (cachedInquiries) return [...cachedInquiries].sort((a, b) => b.createdAt - a.createdAt);
  const data = await api<{ inquiries: Inquiry[] }>('/api/inquiries', {}, true);
  cachedInquiries = data.inquiries;
  return [...cachedInquiries].sort((a, b) => b.createdAt - a.createdAt);
};

export const saveInquiry = async (inquiry: Inquiry): Promise<void> => {
  const token = getToken();
  if (token && cachedInquiries?.some((i) => i.id === inquiry.id)) {
    await api(
      `/api/inquiries/${encodeURIComponent(inquiry.id)}`,
      { method: 'PUT', body: JSON.stringify(inquiry) },
      true
    );
    cachedInquiries = (cachedInquiries || []).map((i) =>
      i.id === inquiry.id ? { ...inquiry } : i
    );
  } else {
    await api('/api/inquiries', { method: 'POST', body: JSON.stringify(inquiry) });
    if (cachedInquiries) {
      const idx = cachedInquiries.findIndex((i) => i.id === inquiry.id);
      if (idx >= 0) cachedInquiries[idx] = { ...inquiry };
      else cachedInquiries = [...cachedInquiries, { ...inquiry }];
    }
  }
  notifyListeners();
};

export const deleteInquiry = async (id: string): Promise<void> => {
  await api(`/api/inquiries/${encodeURIComponent(id)}`, { method: 'DELETE' }, true);
  cachedInquiries = (cachedInquiries || []).filter((i) => i.id !== id);
  notifyListeners();
};

export const uploadImage = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append('file', file);
  const data = await api<{ url: string }>('/api/upload', { method: 'POST', body: form }, true);
  return data.url;
};

export interface PortfolioBackup {
  version: string;
  timestamp: number;
  profile: Profile;
  artworks: Artwork[];
  collections: string[];
}

export const exportPortfolioData = async (): Promise<PortfolioBackup> => {
  return api<PortfolioBackup>('/api/backup', {}, true);
};

export const importPortfolioData = async (_backup?: PortfolioBackup): Promise<void> => {
  void _backup;
  throw new Error(
    'Import is no longer needed — your website saves live to the cloud. Contact your helper if you need a restore from backup.'
  );
};

export const hasUnsavedChanges = (): boolean => false;

export const resetToStaticData = async (): Promise<void> => {
  await loadPortfolio(true);
  cachedInquiries = null;
  notifyListeners();
};

export const refreshPortfolio = async (): Promise<void> => {
  await loadPortfolio(true);
  cachedInquiries = null;
  notifyListeners();
};

export const seedDatabaseIfEmpty = async (): Promise<void> => {
  await loadPortfolio(true);
};

/** Compress an image file in the browser before upload. */
export async function compressImageFile(file: File, maxEdge = 2000, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality)
  );
  if (!blob) return file;

  const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
}
