export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  STUDIO_PASSCODE_HASH: string;
  SESSION_SECRET: string;
}

export type ArtworkStatus = 'available' | 'sold' | 'reserved';
export type InquiryStatus = 'unread' | 'read' | 'replied';

export interface CvItem {
  id: string;
  year: string;
  title: string;
  detail: string;
}

export interface CvSection {
  id: string;
  category: string;
  items: CvItem[];
}

export interface ProfileRow {
  name: string;
  tagline: string;
  philosophy: string;
  hero_image: string;
  bio_text: string;
  portrait_image: string;
  cv_json: string;
}

export interface ArtworkRow {
  id: string;
  title: string;
  year: string;
  medium: string;
  dimensions: string;
  price: string;
  status: string;
  description: string;
  image_url: string;
  is_gallery: number;
  is_featured: number;
  created_at: number;
}

export interface InquiryRow {
  id: string;
  artwork_id: string;
  artwork_title: string;
  name: string;
  email: string;
  message: string;
  created_at: number;
  status: string;
}
