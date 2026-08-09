import type { Env, ArtworkRow, InquiryRow, ProfileRow, CvSection } from '../types';
import seedProfile from '../../data/profile.json';
import seedArtworks from '../../data/artworks.json';
import seedCollections from '../../data/collections.json';

export interface PortfolioArtwork {
  id: string;
  title: string;
  year: string;
  medium: string;
  dimensions: string;
  price: string;
  status: 'available' | 'sold' | 'reserved';
  description: string;
  imageUrl: string;
  collections: string[];
  isGallery: boolean;
  isFeatured: boolean;
  createdAt: number;
}

export interface PortfolioProfile {
  name: string;
  tagline: string;
  philosophy: string;
  heroImage: string;
  bioText: string;
  portraitImage: string;
  cv: CvSection[];
}

export interface PortfolioInquiry {
  id: string;
  artworkId: string;
  artworkTitle: string;
  name: string;
  email: string;
  message: string;
  createdAt: number;
  status: 'unread' | 'read' | 'replied';
}

function mapProfile(row: ProfileRow): PortfolioProfile {
  let cv: CvSection[] = [];
  try {
    cv = JSON.parse(row.cv_json || '[]') as CvSection[];
  } catch {
    cv = [];
  }
  return {
    name: row.name,
    tagline: row.tagline,
    philosophy: row.philosophy,
    heroImage: row.hero_image,
    bioText: row.bio_text,
    portraitImage: row.portrait_image,
    cv,
  };
}

function mapArtwork(row: ArtworkRow, collections: string[]): PortfolioArtwork {
  return {
    id: row.id,
    title: row.title,
    year: row.year,
    medium: row.medium,
    dimensions: row.dimensions,
    price: row.price,
    status: (row.status as PortfolioArtwork['status']) || 'available',
    description: row.description,
    imageUrl: row.image_url,
    collections,
    isGallery: !!row.is_gallery,
    isFeatured: !!row.is_featured,
    createdAt: row.created_at,
  };
}

function mapInquiry(row: InquiryRow): PortfolioInquiry {
  return {
    id: row.id,
    artworkId: row.artwork_id,
    artworkTitle: row.artwork_title,
    name: row.name,
    email: row.email,
    message: row.message,
    createdAt: row.created_at,
    status: (row.status as PortfolioInquiry['status']) || 'unread',
  };
}

export async function ensureSeeded(env: Env): Promise<void> {
  const existing = await env.DB.prepare('SELECT id FROM profile WHERE id = 1').first();
  if (existing) return;

  const cvJson = JSON.stringify(seedProfile.cv || []);
  await env.DB.prepare(
    `INSERT INTO profile (id, name, tagline, philosophy, hero_image, bio_text, portrait_image, cv_json, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      seedProfile.name,
      seedProfile.tagline,
      seedProfile.philosophy,
      seedProfile.heroImage,
      seedProfile.bioText,
      seedProfile.portraitImage,
      cvJson,
      Date.now()
    )
    .run();

  const collectionIds = new Map<string, string>();
  for (let i = 0; i < seedCollections.length; i++) {
    const name = seedCollections[i];
    const id = `col-${i + 1}`;
    collectionIds.set(name, id);
    await env.DB.prepare(
      'INSERT INTO collections (id, name, sort_order) VALUES (?, ?, ?)'
    )
      .bind(id, name, i)
      .run();
  }

  for (const art of seedArtworks as Array<{
    id: string;
    title: string;
    year: string;
    medium: string;
    dimensions: string;
    price: string;
    status: string;
    description: string;
    imageUrl: string;
    collections: string[];
    isGallery: boolean;
    isFeatured: boolean;
    createdAt: number;
  }>) {
    await env.DB.prepare(
      `INSERT INTO artworks
        (id, title, year, medium, dimensions, price, status, description, image_url, is_gallery, is_featured, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        art.id,
        art.title,
        art.year,
        art.medium,
        art.dimensions,
        art.price,
        art.status,
        art.description,
        art.imageUrl,
        art.isGallery ? 1 : 0,
        art.isFeatured ? 1 : 0,
        art.createdAt
      )
      .run();

    for (const colName of art.collections || []) {
      let colId = collectionIds.get(colName);
      if (!colId) {
        colId = `col-${collectionIds.size + 1}`;
        collectionIds.set(colName, colId);
        await env.DB.prepare(
          'INSERT INTO collections (id, name, sort_order) VALUES (?, ?, ?)'
        )
          .bind(colId, colName, collectionIds.size - 1)
          .run();
      }
      await env.DB.prepare(
        'INSERT OR IGNORE INTO artwork_collections (artwork_id, collection_id) VALUES (?, ?)'
      )
        .bind(art.id, colId)
        .run();
    }
  }
}

export async function getPortfolio(env: Env) {
  await ensureSeeded(env);

  const profileRow = await env.DB.prepare('SELECT * FROM profile WHERE id = 1').first<ProfileRow>();
  if (!profileRow) throw new Error('Profile missing after seed');

  const collections = (
    await env.DB.prepare('SELECT id, name FROM collections ORDER BY sort_order ASC, name ASC').all<{
      id: string;
      name: string;
    }>()
  ).results;

  const artworkRows = (
    await env.DB.prepare('SELECT * FROM artworks ORDER BY created_at DESC').all<ArtworkRow>()
  ).results;

  const links = (
    await env.DB.prepare(
      `SELECT ac.artwork_id as artwork_id, c.name as name
       FROM artwork_collections ac
       JOIN collections c ON c.id = ac.collection_id`
    ).all<{ artwork_id: string; name: string }>()
  ).results;

  const byArtwork = new Map<string, string[]>();
  for (const link of links) {
    const list = byArtwork.get(link.artwork_id) || [];
    list.push(link.name);
    byArtwork.set(link.artwork_id, list);
  }

  return {
    profile: mapProfile(profileRow),
    collections: collections.map((c) => c.name),
    artworks: artworkRows.map((row) => mapArtwork(row, byArtwork.get(row.id) || [])),
  };
}

export async function saveProfile(env: Env, profile: PortfolioProfile): Promise<void> {
  await ensureSeeded(env);
  await env.DB.prepare(
    `UPDATE profile SET
      name = ?, tagline = ?, philosophy = ?, hero_image = ?, bio_text = ?,
      portrait_image = ?, cv_json = ?, updated_at = ?
     WHERE id = 1`
  )
    .bind(
      profile.name,
      profile.tagline,
      profile.philosophy,
      profile.heroImage,
      profile.bioText,
      profile.portraitImage,
      JSON.stringify(profile.cv || []),
      Date.now()
    )
    .run();
}

export async function upsertArtwork(env: Env, art: PortfolioArtwork): Promise<void> {
  await ensureSeeded(env);
  await env.DB.prepare(
    `INSERT INTO artworks
      (id, title, year, medium, dimensions, price, status, description, image_url, is_gallery, is_featured, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      year = excluded.year,
      medium = excluded.medium,
      dimensions = excluded.dimensions,
      price = excluded.price,
      status = excluded.status,
      description = excluded.description,
      image_url = excluded.image_url,
      is_gallery = excluded.is_gallery,
      is_featured = excluded.is_featured,
      created_at = excluded.created_at`
  )
    .bind(
      art.id,
      art.title,
      art.year,
      art.medium,
      art.dimensions,
      art.price,
      art.status,
      art.description,
      art.imageUrl,
      art.isGallery ? 1 : 0,
      art.isFeatured ? 1 : 0,
      art.createdAt
    )
    .run();

  await env.DB.prepare('DELETE FROM artwork_collections WHERE artwork_id = ?').bind(art.id).run();

  for (const colName of art.collections || []) {
    const col = await env.DB.prepare('SELECT id FROM collections WHERE name = ?')
      .bind(colName)
      .first<{ id: string }>();
    if (!col) continue;
    await env.DB.prepare(
      'INSERT OR IGNORE INTO artwork_collections (artwork_id, collection_id) VALUES (?, ?)'
    )
      .bind(art.id, col.id)
      .run();
  }
}

export async function deleteArtwork(env: Env, id: string): Promise<void> {
  await env.DB.prepare('DELETE FROM artwork_collections WHERE artwork_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM artworks WHERE id = ?').bind(id).run();
}

export async function listCollections(env: Env): Promise<string[]> {
  await ensureSeeded(env);
  const rows = (
    await env.DB.prepare('SELECT name FROM collections ORDER BY sort_order ASC, name ASC').all<{
      name: string;
    }>()
  ).results;
  return rows.map((r) => r.name);
}

export async function addCollection(env: Env, name: string): Promise<string[]> {
  await ensureSeeded(env);
  const clean = name.trim();
  if (!clean) throw new Error('Collection name is required');
  const existing = await env.DB.prepare('SELECT id FROM collections WHERE name = ?')
    .bind(clean)
    .first();
  if (existing) throw new Error('That collection already exists');

  const count = await env.DB.prepare('SELECT COUNT(*) as c FROM collections').first<{ c: number }>();
  const id = `col-${Date.now()}`;
  await env.DB.prepare('INSERT INTO collections (id, name, sort_order) VALUES (?, ?, ?)')
    .bind(id, clean, count?.c ?? 0)
    .run();
  return listCollections(env);
}

export async function renameCollection(env: Env, oldName: string, newName: string): Promise<string[]> {
  await ensureSeeded(env);
  const clean = newName.trim();
  if (!clean) throw new Error('New name is required');
  const clash = await env.DB.prepare('SELECT id FROM collections WHERE name = ?')
    .bind(clean)
    .first();
  if (clash) throw new Error('That collection already exists');
  await env.DB.prepare('UPDATE collections SET name = ? WHERE name = ?')
    .bind(clean, oldName)
    .run();
  return listCollections(env);
}

export async function deleteCollection(env: Env, name: string): Promise<string[]> {
  await ensureSeeded(env);
  const col = await env.DB.prepare('SELECT id FROM collections WHERE name = ?')
    .bind(name)
    .first<{ id: string }>();
  if (!col) return listCollections(env);
  await env.DB.prepare('DELETE FROM artwork_collections WHERE collection_id = ?').bind(col.id).run();
  await env.DB.prepare('DELETE FROM collections WHERE id = ?').bind(col.id).run();
  return listCollections(env);
}

export async function listInquiries(env: Env): Promise<PortfolioInquiry[]> {
  await ensureSeeded(env);
  const rows = (
    await env.DB.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all<InquiryRow>()
  ).results;
  return rows.map(mapInquiry);
}

export async function saveInquiry(env: Env, inquiry: PortfolioInquiry): Promise<void> {
  await ensureSeeded(env);
  await env.DB.prepare(
    `INSERT INTO inquiries
      (id, artwork_id, artwork_title, name, email, message, created_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
      artwork_id = excluded.artwork_id,
      artwork_title = excluded.artwork_title,
      name = excluded.name,
      email = excluded.email,
      message = excluded.message,
      created_at = excluded.created_at,
      status = excluded.status`
  )
    .bind(
      inquiry.id,
      inquiry.artworkId,
      inquiry.artworkTitle,
      inquiry.name,
      inquiry.email,
      inquiry.message,
      inquiry.createdAt,
      inquiry.status
    )
    .run();
}

export async function deleteInquiry(env: Env, id: string): Promise<void> {
  await env.DB.prepare('DELETE FROM inquiries WHERE id = ?').bind(id).run();
}
