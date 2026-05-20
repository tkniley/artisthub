import type { Artwork, Profile, Inquiry } from './types';

const DB_NAME = 'ArtistHubDB';
const DB_VERSION = 1;

// Helper to open the database
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      
      // Store for profile / landing page settings
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'id' });
      }
      
      // Store for artworks
      if (!db.objectStoreNames.contains('artworks')) {
        db.createObjectStore('artworks', { keyPath: 'id' });
      }
      
      // Store for collection tags
      if (!db.objectStoreNames.contains('collections')) {
        db.createObjectStore('collections', { keyPath: 'id' });
      }

      // Store for inquiries
      if (!db.objectStoreNames.contains('inquiries')) {
        db.createObjectStore('inquiries', { keyPath: 'id' });
      }
    };
  });
};

// Seed Data
const DEFAULT_PROFILE: Profile = {
  name: 'Eleonora Vance',
  tagline: 'Sculptor & Painter of Ethereal Geometries',
  philosophy: 'Art is the silent geometry of the soul, rendered in stone, ink, and light. My work explores the spaces between form and nothingness, capturing the quiet weight of existence.',
  heroImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1200',
  bioText: 'Eleonora Vance (b. 1988) is a contemporary mixed-media artist and sculptor based in Florence and Paris. Drawing inspiration from brutalist architecture, Japanese wabi-sabi philosophy, and classical Italian marble work, Vance creates tactile objects and paintings that contemplate space, void, and stillness.\n\nShe graduated with honors from the Accademia di Belle Arti di Firenze and subsequently trained in traditional stone carving in Carrara. Her practice is characterized by a deep reverence for raw materials—including Carrara marble, raw linen, alabaster, gesso, and hand-gathered mineral pigments. By leaving portions of her materials in their natural, unrefined state, she invites the viewer to appreciate the geological history of the medium alongside the deliberate human intervention.',
  portraitImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600',
  cv: [
    {
      id: 'cv-1',
      category: 'Selected Solo Exhibitions',
      items: [
        { id: 'cvi-1', year: '2025', title: 'The Weight of Absence', detail: 'Galerie Alabaster, Paris, France' },
        { id: 'cvi-2', year: '2024', title: 'Ethereal Geometries', detail: 'Contemporary Art Center, Milan, Italy' },
        { id: 'cvi-3', year: '2022', title: 'Silent Dialogues', detail: 'Tate Modern Project Space, London, UK' },
      ],
    },
    {
      id: 'cv-2',
      category: 'Selected Group Exhibitions',
      items: [
        { id: 'cvi-4', year: '2025', title: 'Echoes of Stone', detail: 'Carrara Biennale, Carrara, Italy' },
        { id: 'cvi-5', year: '2023', title: 'Tactile Realism', detail: 'Museum of Fine Arts, Zurich, Switzerland' },
        { id: 'cvi-6', year: '2021', title: 'New Monochromes', detail: 'Metropolitan Museum of Art (Sackler Gallery), New York, USA' },
      ],
    },
    {
      id: 'cv-3',
      category: 'Education & Residencies',
      items: [
        { id: 'cvi-7', year: '2023', title: 'Villa Medici Residency', detail: 'French Academy in Rome, Italy' },
        { id: 'cvi-8', year: '2016', title: 'Master of Fine Arts (Sculpture)', detail: 'Accademia di Belle Arti di Firenze, Italy' },
      ],
    },
  ],
};

const DEFAULT_ARTWORKS: Artwork[] = [
  {
    id: 'art-1',
    title: 'Silent Dialogue I',
    year: '2025',
    medium: 'Carved Alabaster & White Oak',
    dimensions: '18 x 12 x 8 inches',
    price: '$4,200',
    status: 'available',
    description: 'An exploration of intersecting geometric planes carved from solid alabaster, mounted on a hand-charred white oak base.',
    imageUrl: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=800',
    collections: ['Sculpture', 'Alabaster Series'],
    isGallery: true,
    isFeatured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
  {
    id: 'art-2',
    title: 'Monolith & Void',
    year: '2024',
    medium: 'Bronze on Travertine Pedestal',
    dimensions: '34 x 16 x 16 inches',
    price: '$9,500',
    status: 'reserved',
    description: 'A textured cast bronze structure that frames a central void, questioning the dialogue between matter and empty space.',
    imageUrl: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?q=80&w=800',
    collections: ['Sculpture', 'Bronze Works'],
    isGallery: true,
    isFeatured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
  },
  {
    id: 'art-3',
    title: 'Tracing Silence, No. 4',
    year: '2025',
    medium: 'Charcoal & Raw Gesso on Linen',
    dimensions: '48 x 48 inches',
    price: '$3,800',
    status: 'available',
    description: 'Expressive sweeping gestures in pure charcoal powder, fixed over a textured raw gesso canvas. Part of the ongoing Silence series.',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800',
    collections: ['Paintings', 'Monochrome'],
    isGallery: true,
    isFeatured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
  },
  {
    id: 'art-4',
    title: 'Subterranean Light',
    year: '2025',
    medium: 'Oil, Earth Pigment & Marble Dust on Canvas',
    dimensions: '60 x 72 inches',
    price: '$12,000',
    status: 'available',
    description: 'A large-scale canvas layering natural ochres and marble dust to create a tactile surface that catches raking natural light.',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800',
    collections: ['Paintings', 'Earth Pigments'],
    isGallery: true,
    isFeatured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 40,
  },
  {
    id: 'art-5',
    title: 'Form Study in White',
    year: '2023',
    medium: 'Plaster, Canvas & Wood Frame',
    dimensions: '24 x 30 inches',
    price: '$2,600',
    status: 'sold',
    description: 'A minimal plaster relief study capturing the shadows cast by soft organic ridges in midday light.',
    imageUrl: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=800',
    collections: ['Reliefs', 'Alabaster Series'],
    isGallery: true,
    isFeatured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 50,
  },
  {
    id: 'art-6',
    title: 'Echoes of Ochre',
    year: '2024',
    medium: 'Mixed Media & Pigment on Cotton Paper',
    dimensions: '16 x 20 inches',
    price: '$1,800',
    status: 'available',
    description: 'A delicate study of warm earth tones, mapping organic shapes on heavy French cotton paper.',
    imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=800',
    collections: ['Works on Paper', 'Earth Pigments'],
    isGallery: true,
    isFeatured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
  },
];

const DEFAULT_COLLECTIONS = [
  'Sculpture',
  'Paintings',
  'Reliefs',
  'Works on Paper',
  'Alabaster Series',
  'Bronze Works',
  'Monochrome',
  'Earth Pigments',
];

// Core Seed Function
export const seedDatabaseIfEmpty = async (): Promise<void> => {
  const db = await openDB();
  
  // 1. Seed Profile
  const profileTx = db.transaction('profile', 'readwrite');
  const profileStore = profileTx.objectStore('profile');
  const hasProfile = await new Promise((resolve) => {
    const req = profileStore.get('main');
    req.onsuccess = () => resolve(!!req.result);
    req.onerror = () => resolve(false);
  });

  if (!hasProfile) {
    profileStore.put({ id: 'main', ...DEFAULT_PROFILE });
  }
  await new Promise((resolve) => { profileTx.oncomplete = resolve; });

  // 2. Seed Collections
  const collTx = db.transaction('collections', 'readwrite');
  const collStore = collTx.objectStore('collections');
  const hasCollections = await new Promise((resolve) => {
    const req = collStore.get('main');
    req.onsuccess = () => resolve(!!req.result);
    req.onerror = () => resolve(false);
  });

  if (!hasCollections) {
    collStore.put({ id: 'main', list: DEFAULT_COLLECTIONS });
  }
  await new Promise((resolve) => { collTx.oncomplete = resolve; });

  // 3. Seed Artworks
  const artTx = db.transaction('artworks', 'readwrite');
  const artStore = artTx.objectStore('artworks');
  const artworkCount = await new Promise<number>((resolve) => {
    const req = artStore.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(0);
  });

  if (artworkCount === 0) {
    for (const art of DEFAULT_ARTWORKS) {
      artStore.put(art);
    }
  }
  await new Promise((resolve) => { artTx.oncomplete = resolve; });
};

// Database APIs

export const getProfile = async (): Promise<Profile> => {
  await seedDatabaseIfEmpty();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('profile', 'readonly');
    const store = tx.objectStore('profile');
    const req = store.get('main');
    req.onsuccess = () => {
      if (req.result) {
        const { id, ...profile } = req.result;
        resolve(profile as Profile);
      } else {
        resolve(DEFAULT_PROFILE);
      }
    };
    req.onerror = () => reject(req.error);
  });
};

export const saveProfile = async (profile: Profile): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('profile', 'readwrite');
    const store = tx.objectStore('profile');
    const req = store.put({ id: 'main', ...profile });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const getArtworks = async (): Promise<Artwork[]> => {
  await seedDatabaseIfEmpty();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('artworks', 'readonly');
    const store = tx.objectStore('artworks');
    const req = store.getAll();
    req.onsuccess = () => {
      // Sort by createdAt descending
      const artworks = (req.result || []) as Artwork[];
      artworks.sort((a, b) => b.createdAt - a.createdAt);
      resolve(artworks);
    };
    req.onerror = () => reject(req.error);
  });
};

export const saveArtwork = async (artwork: Artwork): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('artworks', 'readwrite');
    const store = tx.objectStore('artworks');
    const req = store.put(artwork);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const deleteArtwork = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('artworks', 'readwrite');
    const store = tx.objectStore('artworks');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const getCollections = async (): Promise<string[]> => {
  await seedDatabaseIfEmpty();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('collections', 'readonly');
    const store = tx.objectStore('collections');
    const req = store.get('main');
    req.onsuccess = () => {
      if (req.result && req.result.list) {
        resolve(req.result.list);
      } else {
        resolve(DEFAULT_COLLECTIONS);
      }
    };
    req.onerror = () => reject(req.error);
  });
};

export const saveCollections = async (collections: string[]): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('collections', 'readwrite');
    const store = tx.objectStore('collections');
    const req = store.put({ id: 'main', list: collections });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const getInquiries = async (): Promise<Inquiry[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('inquiries', 'readonly');
    const store = tx.objectStore('inquiries');
    const req = store.getAll();
    req.onsuccess = () => {
      const inquiries = (req.result || []) as Inquiry[];
      inquiries.sort((a, b) => b.createdAt - a.createdAt);
      resolve(inquiries);
    };
    req.onerror = () => reject(req.error);
  });
};

export const saveInquiry = async (inquiry: Inquiry): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('inquiries', 'readwrite');
    const store = tx.objectStore('inquiries');
    const req = store.put(inquiry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const deleteInquiry = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('inquiries', 'readwrite');
    const store = tx.objectStore('inquiries');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};
