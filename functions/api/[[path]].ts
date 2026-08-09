import type { Env } from '../types';
import { createSessionToken, requireAuth, verifyPasscode } from '../_shared/auth';
import {
  addCollection,
  deleteArtwork,
  deleteCollection,
  deleteInquiry,
  getPortfolio,
  listInquiries,
  renameCollection,
  saveInquiry,
  saveProfile,
  upsertArtwork,
  type PortfolioArtwork,
  type PortfolioInquiry,
  type PortfolioProfile,
} from '../_shared/db';
import { error, json, withCors } from '../_shared/http';

function pathParts(params: { path?: string | string[] }): string[] {
  const raw = params.path;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

async function handle(context: EventContext<Env, 'path', unknown>): Promise<Response> {
  const { request, env } = context;
  const method = request.method.toUpperCase();
  const parts = pathParts(context.params);
  const [resource, id, ...rest] = parts;

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  try {
    // GET /api/portfolio
    if (resource === 'portfolio' && method === 'GET') {
      const data = await getPortfolio(env);
      return json(data);
    }

    // POST /api/auth
    if (resource === 'auth' && method === 'POST') {
      const body = (await request.json()) as { passcode?: string; rememberMe?: boolean };
      const passcode = (body.passcode || '').trim();
      if (!passcode) return error('Enter your studio passcode.', 400);
      const ok = await verifyPasscode(env, passcode);
      if (!ok) return error('That passcode is incorrect.', 401);
      const token = await createSessionToken(env, !!body.rememberMe);
      return json({ token });
    }

    // GET /api/media/<key...>
    if (resource === 'media' && method === 'GET') {
      const key = [id, ...rest].filter(Boolean).join('/');
      if (!key) return error('Missing image key', 400);
      const obj = await env.IMAGES.get(key);
      if (!obj) return error('Image not found', 404);
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set('etag', obj.httpEtag);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      return new Response(obj.body, { headers });
    }

    // POST /api/upload
    if (resource === 'upload' && method === 'POST') {
      const authErr = await requireAuth(request, env);
      if (authErr) return authErr;

      const form = await request.formData();
      const file = form.get('file');
      if (!(file instanceof File)) return error('Choose a photo to upload.', 400);

      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      const key = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext || 'jpg'}`;
      await env.IMAGES.put(key, file.stream(), {
        httpMetadata: {
          contentType: file.type || 'image/jpeg',
        },
      });
      return json({ url: `/api/media/${key}`, key });
    }

    // PUT /api/profile
    if (resource === 'profile' && method === 'PUT') {
      const authErr = await requireAuth(request, env);
      if (authErr) return authErr;
      const profile = (await request.json()) as PortfolioProfile;
      if (!profile?.name) return error('Artist name is required.', 400);
      await saveProfile(env, profile);
      return json({ ok: true, profile });
    }

    // Artworks
    if (resource === 'artworks') {
      if (method === 'POST') {
        const authErr = await requireAuth(request, env);
        if (authErr) return authErr;
        const art = (await request.json()) as PortfolioArtwork;
        if (!art?.title || !art?.imageUrl) {
          return error('A title and photo are required.', 400);
        }
        const saved: PortfolioArtwork = {
          id: art.id || `art-${Date.now()}`,
          title: art.title,
          year: art.year || String(new Date().getFullYear()),
          medium: art.medium || '',
          dimensions: art.dimensions || '',
          price: art.price || '',
          status: art.status || 'available',
          description: art.description || '',
          imageUrl: art.imageUrl,
          collections: art.collections || [],
          isGallery: art.isGallery !== false,
          isFeatured: !!art.isFeatured,
          createdAt: art.createdAt || Date.now(),
        };
        await upsertArtwork(env, saved);
        return json({ ok: true, artwork: saved });
      }

      if ((method === 'PUT' || method === 'PATCH') && id) {
        const authErr = await requireAuth(request, env);
        if (authErr) return authErr;
        const art = (await request.json()) as PortfolioArtwork;
        const saved: PortfolioArtwork = {
          ...art,
          id,
          title: art.title,
          year: art.year || '',
          medium: art.medium || '',
          dimensions: art.dimensions || '',
          price: art.price || '',
          status: art.status || 'available',
          description: art.description || '',
          imageUrl: art.imageUrl,
          collections: art.collections || [],
          isGallery: art.isGallery !== false,
          isFeatured: !!art.isFeatured,
          createdAt: art.createdAt || Date.now(),
        };
        if (!saved.title || !saved.imageUrl) {
          return error('A title and photo are required.', 400);
        }
        await upsertArtwork(env, saved);
        return json({ ok: true, artwork: saved });
      }

      if (method === 'DELETE' && id) {
        const authErr = await requireAuth(request, env);
        if (authErr) return authErr;
        await deleteArtwork(env, id);
        return json({ ok: true });
      }
    }

    // Collections
    if (resource === 'collections') {
      if (method === 'POST') {
        const authErr = await requireAuth(request, env);
        if (authErr) return authErr;
        const body = (await request.json()) as { name?: string };
        const collections = await addCollection(env, body.name || '');
        return json({ ok: true, collections });
      }

      if (method === 'PUT' && id) {
        const authErr = await requireAuth(request, env);
        if (authErr) return authErr;
        const body = (await request.json()) as { name?: string; oldName?: string };
        const oldName = decodeURIComponent(id);
        const collections = await renameCollection(env, body.oldName || oldName, body.name || '');
        return json({ ok: true, collections });
      }

      if (method === 'DELETE' && id) {
        const authErr = await requireAuth(request, env);
        if (authErr) return authErr;
        const collections = await deleteCollection(env, decodeURIComponent(id));
        return json({ ok: true, collections });
      }
    }

    // Inquiries
    if (resource === 'inquiries') {
      if (method === 'GET') {
        const authErr = await requireAuth(request, env);
        if (authErr) return authErr;
        const inquiries = await listInquiries(env);
        return json({ inquiries });
      }

      if (method === 'POST') {
        const body = (await request.json()) as Partial<PortfolioInquiry>;
        if (!body.name || !body.email || !body.message) {
          return error('Please fill in your name, email, and message.', 400);
        }
        const inquiry: PortfolioInquiry = {
          id: body.id || `inq-${Date.now()}`,
          artworkId: body.artworkId || '',
          artworkTitle: body.artworkTitle || '',
          name: body.name,
          email: body.email,
          message: body.message,
          createdAt: body.createdAt || Date.now(),
          status: body.status || 'unread',
        };
        await saveInquiry(env, inquiry);
        return json({ ok: true, inquiry });
      }

      if ((method === 'PUT' || method === 'PATCH') && id) {
        const authErr = await requireAuth(request, env);
        if (authErr) return authErr;
        const body = (await request.json()) as PortfolioInquiry;
        const inquiry: PortfolioInquiry = {
          ...body,
          id,
        };
        await saveInquiry(env, inquiry);
        return json({ ok: true, inquiry });
      }

      if (method === 'DELETE' && id) {
        const authErr = await requireAuth(request, env);
        if (authErr) return authErr;
        await deleteInquiry(env, id);
        return json({ ok: true });
      }
    }

    // Backup export
    if (resource === 'backup' && method === 'GET') {
      const authErr = await requireAuth(request, env);
      if (authErr) return authErr;
      const data = await getPortfolio(env);
      return json({
        version: 'artisthub_v2',
        timestamp: Date.now(),
        ...data,
      });
    }

    return error('Not found', 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error(err);
    return error(message, 500);
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const response = await handle(context);
  return withCors(response, context.request);
};
