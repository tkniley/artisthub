export interface Artwork {
  id: string;
  title: string;
  year: string;
  medium: string;
  dimensions: string;
  price: string;
  status: 'available' | 'sold' | 'reserved';
  description: string;
  imageUrl: string; // Can be a URL or a base64 encoded string
  collections: string[]; // List of collection names/tags
  isGallery: boolean; // Toggled to show in the main gallery
  isFeatured: boolean; // Toggled to show on landing page
  createdAt: number;
}

export interface CVItem {
  id: string;
  year: string;
  title: string;
  detail: string;
}

export interface CVSection {
  id: string;
  category: string; // e.g. "Selected Solo Exhibitions", "Group Exhibitions", "Education", "Residencies"
  items: CVItem[];
}

export interface Profile {
  name: string;
  tagline: string;
  philosophy: string;
  heroImage: string;
  bioText: string;
  portraitImage: string;
  email: string;
  instagramUrl: string;
  artsyUrl: string;
  pinterestUrl: string;
  showCv: boolean;
  cv: CVSection[];
}

export interface Inquiry {
  id: string;
  artworkId: string;
  artworkTitle: string;
  name: string;
  email: string;
  message: string;
  createdAt: number;
  status: 'unread' | 'read' | 'replied';
}
