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
  name: 'Vonder Gray',
  tagline: 'Contemporary Painter & Mixed-Media Artist',
  philosophy: 'Art is the silent geometry of the soul, rendered in stone, ink, and light. My work explores the spaces between form and nothingness, capturing the quiet weight of existence.',
  heroImage: '/vonder/Love.jpg',
  bioText: 'Vonder Gray (b. 1988) is an American contemporary painter and mixed-media artist based in Denver, Colorado. Working out of her studio in the historic art districts, Vonder creates highly energetic, layered abstract canvases that contemplate space, void, and stillness.\n\nShe is best known for her bold use of fluid pigments, heavy acrylic layering, fixed charcoal gestures, and delicate gold accents. Her work has been shown in prominent contemporary spaces across the West, including regular installations at Rolo Gallery. She contemplates the boundary where raw feeling meets deliberate creative expression.',
  portraitImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600',
  cv: [
    {
      id: 'cv-1',
      category: 'Selected Solo Exhibitions',
      items: [
        { id: 'cvi-1', year: '2026', title: 'Variations in Joy', detail: 'Rolo Gallery, Denver, CO' },
        { id: 'cvi-2', year: '2025', title: 'The Weight of Absence', detail: 'Galerie Alabaster, Paris, France' },
        { id: 'cvi-3', year: '2024', title: 'Ethereal Geometries', detail: 'Contemporary Art Center, Milan, Italy' },
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
    id: 'art-vonder-1',
    title: 'Chaos in the Moment',
    year: '2026',
    medium: 'Mixed Media & Acrylic on Canvas',
    dimensions: '40 x 40 inches',
    price: '$3,400',
    status: 'available',
    description: 'A vibrant exploration of sudden movement and emotional intensity, captured through textured layering.',
    imageUrl: '/vonder/Chaos%20in%20the%20Moment.jpg',
    collections: ['Variations in Joy'],
    isGallery: true,
    isFeatured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
  {
    id: 'art-vonder-2',
    title: 'Early Snow at the Botanic Gardens',
    year: '2026',
    medium: 'Oil & Marble Dust on Linen',
    dimensions: '48 x 36 inches',
    price: '$4,500',
    status: 'available',
    description: 'Delicate crystalline white structures meeting dark organic forms, representing the first whisper of winter.',
    imageUrl: '/vonder/Early%20Snow%20at%20the%20Botanic%20Gardens.jpg',
    collections: ['Variations in Joy'],
    isGallery: true,
    isFeatured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: 'art-vonder-3',
    title: 'Heat of the Moment',
    year: '2026',
    medium: 'Mixed Media on Heavy Cotton Paper',
    dimensions: '24 x 30 inches',
    price: '$2,200',
    status: 'sold',
    description: 'An expressive burst of warm tones and sharp linework, conveying passion and structural urgency.',
    imageUrl: '/vonder/Heat%20of%20the%20Moment.jpg',
    collections: ['Variations in Joy'],
    isGallery: true,
    isFeatured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 'art-vonder-4',
    title: 'I Love a Man Who Wears Pink',
    year: '2026',
    medium: 'Acrylic, Charcoal & Pastel on Canvas',
    dimensions: '36 x 36 inches',
    price: '$2,900',
    status: 'available',
    description: 'A bold, playful study in contrasts, juxtaposing soft rose tones with deep, grounding black strokes.',
    imageUrl: '/vonder/I%20Love%20a%20Man%20Who%20Wears%20Pink.jpg',
    collections: ['Variations in Joy'],
    isGallery: true,
    isFeatured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
  },
  {
    id: 'art-vonder-5',
    title: 'IMG_3296',
    year: '2026',
    medium: 'Fine Art Archival Print',
    dimensions: '16 x 20 inches',
    price: '$850',
    status: 'available',
    description: 'A minimalist photographic study of light refractions on natural stone surfaces.',
    imageUrl: '/vonder/IMG_3296.jpg',
    collections: ['Variations in Joy'],
    isGallery: true,
    isFeatured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: 'art-vonder-6',
    title: 'IMG_3600',
    year: '2026',
    medium: 'Fine Art Archival Print',
    dimensions: '16 x 20 inches',
    price: '$850',
    status: 'available',
    description: 'A quiet contemplation of textured shadows playing across industrial concrete architecture.',
    imageUrl: '/vonder/IMG_3600.jpg',
    collections: ['Variations in Joy'],
    isGallery: true,
    isFeatured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
  },
  {
    id: 'art-vonder-7',
    title: 'IMG_4685',
    year: '2026',
    medium: 'Fine Art Archival Print',
    dimensions: '16 x 20 inches',
    price: '$850',
    status: 'sold',
    description: 'An intimate close-up detailing the fine micro-textures and fractures of raw alabaster.',
    imageUrl: '/vonder/IMG_4685.jpg',
    collections: ['Variations in Joy'],
    isGallery: true,
    isFeatured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: 'art-vonder-8',
    title: 'IMG_4852',
    year: '2026',
    medium: 'Fine Art Archival Print',
    dimensions: '16 x 20 inches',
    price: '$850',
    status: 'available',
    description: 'Captured light balancing on the edge of a sculpted marble geometry.',
    imageUrl: '/vonder/IMG_4852.jpg',
    collections: ['Variations in Joy'],
    isGallery: true,
    isFeatured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
  },
  {
    id: 'art-vonder-9',
    title: 'IMG_5476',
    year: '2026',
    medium: 'Fine Art Archival Print',
    dimensions: '24 x 24 inches',
    price: '$1,200',
    status: 'reserved',
    description: 'A structural view of intersecting geometric planes illuminated by hard afternoon light.',
    imageUrl: '/vonder/IMG_5476.jpg',
    collections: ['Variations in Joy'],
    isGallery: true,
    isFeatured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 9,
  },
  {
    id: 'art-vonder-10',
    title: 'IMG_5479',
    year: '2026',
    medium: 'Fine Art Archival Print',
    dimensions: '24 x 24 inches',
    price: '$1,200',
    status: 'available',
    description: 'An elegant abstract capturing the boundary where sculpture meets space.',
    imageUrl: '/vonder/IMG_5479.jpg',
    collections: ['Variations in Joy'],
    isGallery: true,
    isFeatured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
  {
    id: 'art-vonder-11',
    title: 'IMG_5490',
    year: '2026',
    medium: 'Fine Art Archival Print',
    dimensions: '24 x 24 inches',
    price: '$1,200',
    status: 'available',
    description: 'A detailed study in contrast, observing soft atmospheric transitions over hard stone edges.',
    imageUrl: '/vonder/IMG_5490.jpg',
    collections: ['Variations in Joy'],
    isGallery: true,
    isFeatured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 11,
  },
  {
    id: 'art-vonder-12',
    title: 'IMG_5520',
    year: '2026',
    medium: 'Fine Art Archival Print',
    dimensions: '16 x 20 inches',
    price: '$850',
    status: 'available',
    description: 'A serene, low-contrast composition exploring the weight of absolute silence.',
    imageUrl: '/vonder/IMG_5520.jpg',
    collections: ['Variations in Joy'],
    isGallery: true,
    isFeatured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
  },
  {
    id: 'art-vonder-13',
    title: 'IMG_5522',
    year: '2026',
    medium: 'Fine Art Archival Print',
    dimensions: '16 x 20 inches',
    price: '$850',
    status: 'sold',
    description: 'Interplay of natural wood grain and cast shadows under soft gallery lighting.',
    imageUrl: '/vonder/IMG_5522.jpg',
    collections: ['Variations in Joy'],
    isGallery: true,
    isFeatured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 13,
  },
  {
    id: 'art-vonder-14',
    title: 'Love',
    year: '2026',
    medium: 'Acrylic, Oil & Gold Leaf on Canvas',
    dimensions: '30 x 40 inches',
    price: '$3,600',
    status: 'available',
    description: 'A rich, textured canvas reflecting warmth and connection through layered brushwork and delicate gold accents.',
    imageUrl: '/vonder/Love.jpg',
    collections: ['Variations in Joy'],
    isGallery: true,
    isFeatured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
  },
  {
    id: 'art-vonder-15',
    title: 'Sneaky Peek',
    year: '2026',
    medium: 'Mixed Media on Linen',
    dimensions: '24 x 24 inches',
    price: '$1,950',
    status: 'available',
    description: 'A playful, partially obscured composition inviting the viewer to look beyond the dominant foreground.',
    imageUrl: '/vonder/Sneaky%20Peek.jpg',
    collections: ['Variations in Joy'],
    isGallery: true,
    isFeatured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
  },
  {
    id: 'art-vonder-16',
    title: 'The Neighborhood',
    year: '2026',
    medium: 'Oil & Charcoal on Canvas',
    dimensions: '36 x 48 inches',
    price: '$4,100',
    status: 'available',
    description: 'An abstract spatial landscape exploring collective forms, community, and shared geometric borders.',
    imageUrl: '/vonder/The%20Neighborhood.jpg',
    collections: ['Variations in Joy'],
    isGallery: true,
    isFeatured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 16,
  },
  {
    id: 'art-vonder-17',
    title: 'Whirlwind',
    year: '2026',
    medium: 'Mixed Media & Plaster Relief',
    dimensions: '30 x 30 inches',
    price: '$2,800',
    status: 'available',
    description: 'A dynamic plaster study evoking energy, circular motion, and structural change.',
    imageUrl: '/vonder/Whirlwind.jpg',
    collections: ['Variations in Joy'],
    isGallery: true,
    isFeatured: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 17,
  },
  {
    id: 'art-vonder-18',
    title: 'Winds of Change',
    year: '2026',
    medium: 'Acrylic & Pigment on Raw Linen',
    dimensions: '40 x 50 inches',
    price: '$4,800',
    status: 'available',
    description: 'Sweeping horizontal movements of paint that capture transient moments and emotional shifts.',
    imageUrl: '/vonder/Winds%20of%20Change.jpg',
    collections: ['Variations in Joy'],
    isGallery: true,
    isFeatured: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
  },
];

const DEFAULT_COLLECTIONS = [
  'Variations in Joy',
];

// Core Seed Function
export const seedDatabaseIfEmpty = async (): Promise<void> => {
  const db = await openDB();
  
  // 1. Check if we need to migrate/re-seed to the vonder collection
  const checkProfileTx = db.transaction('profile', 'readonly');
  const checkProfileStore = checkProfileTx.objectStore('profile');
  const currentProfile = await new Promise<any>((resolve) => {
    const req = checkProfileStore.get('main');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
  await new Promise((resolve) => { checkProfileTx.oncomplete = resolve; });

  const needsVonderSeed = !currentProfile || currentProfile.seededVersion !== 'vonder_v3';

  if (needsVonderSeed) {
    // A. Clear artworks store to ensure all old pictures are deleted
    const clearArtTx = db.transaction('artworks', 'readwrite');
    clearArtTx.objectStore('artworks').clear();
    await new Promise((resolve) => { clearArtTx.oncomplete = resolve; });

    // B. Clear collections store to ensure all old collections are deleted
    const clearCollTx = db.transaction('collections', 'readwrite');
    clearCollTx.objectStore('collections').clear();
    await new Promise((resolve) => { clearCollTx.oncomplete = resolve; });

    // C. Write profile with seededVersion
    const profileTx = db.transaction('profile', 'readwrite');
    const newProfile = currentProfile 
      ? { ...currentProfile, name: 'Vonder Gray', tagline: 'Contemporary Painter & Mixed-Media Artist', heroImage: '/vonder/Love.jpg', seededVersion: 'vonder_v3' } 
      : { id: 'main', ...DEFAULT_PROFILE, seededVersion: 'vonder_v3' };
    profileTx.objectStore('profile').put(newProfile);
    await new Promise((resolve) => { profileTx.oncomplete = resolve; });

    // D. Write new collections
    const collTx = db.transaction('collections', 'readwrite');
    collTx.objectStore('collections').put({ id: 'main', list: DEFAULT_COLLECTIONS });
    await new Promise((resolve) => { collTx.oncomplete = resolve; });

    // E. Write new artworks
    const artTx = db.transaction('artworks', 'readwrite');
    const artStore = artTx.objectStore('artworks');
    for (const art of DEFAULT_ARTWORKS) {
      artStore.put(art);
    }
    await new Promise((resolve) => { artTx.oncomplete = resolve; });
  } else {
    // Standard safety fallback (in case DB exists but somehow got cleared partially)
    // 1. Seed Profile
    const profileTx = db.transaction('profile', 'readwrite');
    const profileStore = profileTx.objectStore('profile');
    const hasProfile = await new Promise((resolve) => {
      const req = profileStore.get('main');
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
    if (!hasProfile) {
      profileStore.put({ id: 'main', ...DEFAULT_PROFILE, seededVersion: 'vonder_v3' });
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
  }
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
    const req = store.put({ id: 'main', ...profile, seededVersion: 'vonder_v3' });
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

export interface PortfolioBackup {
  version: string;
  timestamp: number;
  profile: Profile;
  artworks: Artwork[];
  collections: string[];
}

export const exportPortfolioData = async (): Promise<PortfolioBackup> => {
  const profile = await getProfile();
  const artworks = await getArtworks();
  const collections = await getCollections();
  
  return {
    version: 'artisthub_v1',
    timestamp: Date.now(),
    profile,
    artworks,
    collections
  };
};

export const importPortfolioData = async (backup: PortfolioBackup): Promise<void> => {
  if (backup.version !== 'artisthub_v1') {
    throw new Error('Invalid backup file version.');
  }
  if (!backup.profile || !Array.isArray(backup.artworks) || !Array.isArray(backup.collections)) {
    throw new Error('Invalid backup data structure.');
  }

  const db = await openDB();

  // 1. Clear existing profile and write new one
  const profileTx = db.transaction('profile', 'readwrite');
  profileTx.objectStore('profile').clear();
  profileTx.objectStore('profile').put({ id: 'main', ...backup.profile, seededVersion: 'vonder_v3' });
  await new Promise((resolve) => { profileTx.oncomplete = resolve; });

  // 2. Clear existing artworks and write new ones
  const artTx = db.transaction('artworks', 'readwrite');
  artTx.objectStore('artworks').clear();
  const artStore = artTx.objectStore('artworks');
  for (const art of backup.artworks) {
    artStore.put(art);
  }
  await new Promise((resolve) => { artTx.oncomplete = resolve; });

  // 3. Clear existing collections and write new ones
  const collTx = db.transaction('collections', 'readwrite');
  collTx.objectStore('collections').clear();
  collTx.objectStore('collections').put({ id: 'main', list: backup.collections });
  await new Promise((resolve) => { collTx.oncomplete = resolve; });
};

