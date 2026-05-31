import type { Artwork, Profile, Inquiry } from './types';

// ─── Static Data Imports (bundled at build time) ───────────────────────────
import staticProfile from '../data/profile.json';
import staticArtworks from '../data/artworks.json';
import staticCollections from '../data/collections.json';

// ─── In-Memory State ───────────────────────────────────────────────────────
// These hold the "live" working copies. On first load they clone the static
// JSON so the originals are never mutated.  Studio edits update these in
// memory so the artist gets instant preview.  To persist changes permanently,
// the artist exports a site-data.json and drops it back into /data/.

let currentProfile: Profile = { ...staticProfile };
let currentArtworks: Artwork[] = staticArtworks.map((a) => ({ ...a } as Artwork));
let currentCollections: string[] = [...staticCollections];
let currentInquiries: Inquiry[] = [];

// Track whether the artist has made in-memory edits (for the "unsaved" badge)
let _hasUnsavedChanges = false;

// ─── Change Listeners ──────────────────────────────────────────────────────
// Components can subscribe to be notified when data changes in memory.
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const subscribe = (fn: Listener): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const notifyListeners = () => {
  listeners.forEach((fn) => fn());
};

// ─── Public API — identical signatures to the old IndexedDB layer ──────────

export const getProfile = async (): Promise<Profile> => {
  return { ...currentProfile };
};

export const saveProfile = async (profile: Profile): Promise<void> => {
  currentProfile = { ...profile };
  _hasUnsavedChanges = true;
  notifyListeners();
};

export const getArtworks = async (): Promise<Artwork[]> => {
  // Return sorted by createdAt descending (highest = newest)
  return [...currentArtworks].sort((a, b) => b.createdAt - a.createdAt);
};

export const saveArtwork = async (artwork: Artwork): Promise<void> => {
  const idx = currentArtworks.findIndex((a) => a.id === artwork.id);
  if (idx >= 0) {
    currentArtworks[idx] = { ...artwork };
  } else {
    currentArtworks.push({ ...artwork });
  }
  _hasUnsavedChanges = true;
  notifyListeners();
};

export const deleteArtwork = async (id: string): Promise<void> => {
  currentArtworks = currentArtworks.filter((a) => a.id !== id);
  _hasUnsavedChanges = true;
  notifyListeners();
};

export const getCollections = async (): Promise<string[]> => {
  return [...currentCollections];
};

export const saveCollections = async (collections: string[]): Promise<void> => {
  currentCollections = [...collections];
  _hasUnsavedChanges = true;
  notifyListeners();
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
};

export const deleteInquiry = async (id: string): Promise<void> => {
  currentInquiries = currentInquiries.filter((i) => i.id !== id);
};

// ─── Export / Import (Publish workflow) ────────────────────────────────────

export interface PortfolioBackup {
  version: string;
  timestamp: number;
  profile: Profile;
  artworks: Artwork[];
  collections: string[];
}

/** Build a full snapshot of the current in-memory state for download. */
export const exportPortfolioData = async (): Promise<PortfolioBackup> => {
  return {
    version: 'artisthub_v2',
    timestamp: Date.now(),
    profile: { ...currentProfile },
    artworks: currentArtworks.map((a) => ({ ...a })),
    collections: [...currentCollections],
  };
};

/** Load a backup into memory so the artist can preview it, then re-export. */
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
  _hasUnsavedChanges = true;
  notifyListeners();
};

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Whether in-memory state differs from the static build data. */
export const hasUnsavedChanges = (): boolean => _hasUnsavedChanges;

/** Reset in-memory state back to the static build data (undo all edits). */
export const resetToStaticData = (): void => {
  currentProfile = { ...staticProfile };
  currentArtworks = staticArtworks.map((a) => ({ ...a } as Artwork));
  currentCollections = [...staticCollections];
  currentInquiries = [];
  _hasUnsavedChanges = false;
  notifyListeners();
};

// Backwards-compat: the old code called seedDatabaseIfEmpty() on startup.
// This is now a no-op since data comes from static JSON.
export const seedDatabaseIfEmpty = async (): Promise<void> => {
  // no-op
};
