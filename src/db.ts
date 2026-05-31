import type { Artwork, Profile, Inquiry } from './types';

// ─── Static Data Imports (bundled at build time) ───────────────────────────
import staticProfile from '../data/profile.json';
import staticArtworks from '../data/artworks.json';
import staticCollections from '../data/collections.json';

// ─── localStorage Keys ─────────────────────────────────────────────────────
const LS_PROFILE = 'artisthub_profile';
const LS_ARTWORKS = 'artisthub_artworks';
const LS_COLLECTIONS = 'artisthub_collections';
const LS_INQUIRIES = 'artisthub_inquiries';

// ─── localStorage Helpers ──────────────────────────────────────────────────
function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // corrupted — ignore and fall back to static
  }
  return null;
}

function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or private browsing — silent fail
  }
}

function lsRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // silent
  }
}

// ─── In-Memory State (hydrated from localStorage → static JSON fallback) ──
// On first load: if localStorage has saved data, use it.
// Otherwise fall back to the static JSON bundled at build time.
// Every save* call persists to BOTH in-memory AND localStorage.

let currentProfile: Profile = lsGet<Profile>(LS_PROFILE) ?? { ...staticProfile };
let currentArtworks: Artwork[] = lsGet<Artwork[]>(LS_ARTWORKS) ?? staticArtworks.map((a) => ({ ...a } as Artwork));
let currentCollections: string[] = lsGet<string[]>(LS_COLLECTIONS) ?? [...staticCollections];
let currentInquiries: Inquiry[] = lsGet<Inquiry[]>(LS_INQUIRIES) ?? [];

// Track whether localStorage state differs from the static build data
let _hasUnsavedChanges = lsGet<Profile>(LS_PROFILE) !== null;

// ─── Change Listeners ──────────────────────────────────────────────────────
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const subscribe = (fn: Listener): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const notifyListeners = () => {
  listeners.forEach((fn) => fn());
};

// ─── Local Filesystem Autosave (Development Only) ───────────────────────────
async function syncToDisk(): Promise<void> {
  if (import.meta.env.DEV) {
    try {
      const data = {
        profile: currentProfile,
        artworks: currentArtworks,
        collections: currentCollections,
      };
      const res = await fetch('/api/save-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        console.error('Failed to autosave changes to local filesystem.');
      } else {
        console.log('Autosaved changes to local data/*.json files successfully!');
      }
    } catch (err) {
      console.error('Error autosaving to local filesystem:', err);
    }
  }
}

// ─── Public API — identical signatures to the old layer ────────────────────

export const getProfile = async (): Promise<Profile> => {
  return { ...currentProfile };
};

export const saveProfile = async (profile: Profile): Promise<void> => {
  currentProfile = { ...profile };
  lsSet(LS_PROFILE, currentProfile);
  _hasUnsavedChanges = true;
  notifyListeners();
  await syncToDisk();
};

export const getArtworks = async (): Promise<Artwork[]> => {
  return [...currentArtworks].sort((a, b) => b.createdAt - a.createdAt);
};

export const saveArtwork = async (artwork: Artwork): Promise<void> => {
  const idx = currentArtworks.findIndex((a) => a.id === artwork.id);
  if (idx >= 0) {
    currentArtworks[idx] = { ...artwork };
  } else {
    currentArtworks.push({ ...artwork });
  }
  lsSet(LS_ARTWORKS, currentArtworks);
  _hasUnsavedChanges = true;
  notifyListeners();
  await syncToDisk();
};

export const deleteArtwork = async (id: string): Promise<void> => {
  currentArtworks = currentArtworks.filter((a) => a.id !== id);
  lsSet(LS_ARTWORKS, currentArtworks);
  _hasUnsavedChanges = true;
  notifyListeners();
  await syncToDisk();
};

export const getCollections = async (): Promise<string[]> => {
  return [...currentCollections];
};

export const saveCollections = async (collections: string[]): Promise<void> => {
  currentCollections = [...collections];
  lsSet(LS_COLLECTIONS, currentCollections);
  _hasUnsavedChanges = true;
  notifyListeners();
  await syncToDisk();
};

export const getInquiries = async (): Promise<Inquiry[]> => {
  return [...currentInquiries].sort((a, b) => b.createdAt - a.createdAt);
};

export const saveInquiry = async (inquiry: Inquiry): Promise<void> => {
  const idx = currentInquiries.findIndex((i) => i.id === inquiry.id);
  if (idx >= 0) {
    currentInquiries[idx] = { ...inquiry };
  } else {
    currentInquiries.push({ ...inquiry });
  }
  lsSet(LS_INQUIRIES, currentInquiries);
};

export const deleteInquiry = async (id: string): Promise<void> => {
  currentInquiries = currentInquiries.filter((i) => i.id !== id);
  lsSet(LS_INQUIRIES, currentInquiries);
};

// ─── Export / Import (Publish workflow) ────────────────────────────────────

export interface PortfolioBackup {
  version: string;
  timestamp: number;
  profile: Profile;
  artworks: Artwork[];
  collections: string[];
}

/** Build a full snapshot of the current state for download. */
export const exportPortfolioData = async (): Promise<PortfolioBackup> => {
  return {
    version: 'artisthub_v2',
    timestamp: Date.now(),
    profile: { ...currentProfile },
    artworks: currentArtworks.map((a) => ({ ...a })),
    collections: [...currentCollections],
  };
};

/** Load a backup into memory + localStorage. Persists across refreshes. */
export const importPortfolioData = async (backup: PortfolioBackup): Promise<void> => {
  if (!backup.version || !backup.version.startsWith('artisthub_v')) {
    throw new Error('Invalid backup file — missing or unrecognised version.');
  }
  if (!backup.profile || !Array.isArray(backup.artworks) || !Array.isArray(backup.collections)) {
    throw new Error('Invalid backup data structure.');
  }

  currentProfile = { ...backup.profile };
  currentArtworks = backup.artworks.map((a) => ({ ...a } as Artwork));
  currentCollections = [...backup.collections];

  // Persist to localStorage so data survives refresh
  lsSet(LS_PROFILE, currentProfile);
  lsSet(LS_ARTWORKS, currentArtworks);
  lsSet(LS_COLLECTIONS, currentCollections);

  _hasUnsavedChanges = true;
  notifyListeners();
  await syncToDisk();
};

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Whether localStorage state differs from the static build data. */
export const hasUnsavedChanges = (): boolean => _hasUnsavedChanges;

/** Reset everything back to the static build data and clear localStorage. */
export const resetToStaticData = (): void => {
  currentProfile = { ...staticProfile };
  currentArtworks = staticArtworks.map((a) => ({ ...a } as Artwork));
  currentCollections = [...staticCollections];
  currentInquiries = [];

  lsRemove(LS_PROFILE);
  lsRemove(LS_ARTWORKS);
  lsRemove(LS_COLLECTIONS);
  lsRemove(LS_INQUIRIES);

  _hasUnsavedChanges = false;
  notifyListeners();
  syncToDisk(); // Non-blocking sync to reset files on disk as well
};

// Backwards-compat no-op
export const seedDatabaseIfEmpty = async (): Promise<void> => {
  // no-op — data comes from static JSON + localStorage
};
