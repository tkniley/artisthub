-- ArtistHub portfolio schema

CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  philosophy TEXT NOT NULL DEFAULT '',
  hero_image TEXT NOT NULL DEFAULT '',
  bio_text TEXT NOT NULL DEFAULT '',
  portrait_image TEXT NOT NULL DEFAULT '',
  cv_json TEXT NOT NULL DEFAULT '[]',
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS artworks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  year TEXT NOT NULL DEFAULT '',
  medium TEXT NOT NULL DEFAULT '',
  dimensions TEXT NOT NULL DEFAULT '',
  price TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'available',
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  is_gallery INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS artwork_collections (
  artwork_id TEXT NOT NULL,
  collection_id TEXT NOT NULL,
  PRIMARY KEY (artwork_id, collection_id),
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  artwork_id TEXT NOT NULL DEFAULT '',
  artwork_title TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread'
);

CREATE INDEX IF NOT EXISTS idx_artworks_created ON artworks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at DESC);
