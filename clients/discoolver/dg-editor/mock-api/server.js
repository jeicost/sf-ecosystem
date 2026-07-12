/**
 * Mock API — simula api.discoolver.com/cms/v2
 * Cubre todos los endpoints que usa el editor de guías.
 * Puerto: 3100  |  Auth: cualquier token es válido en dev
 *
 * Cuando Diego tenga los endpoints reales:
 *   cd editor && npm run dev:spring   (apunta a api.discoolver.com/cms)
 */

const express = require('express');
const cors    = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = 3100;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Servir los templates de diseño y archivos estáticos (mismo comportamiento que FastAPI)
const DESIGN_DIR  = path.join(__dirname, '../design');
const STATIC_DIR  = path.join(__dirname, '../static');
const EXPORTS_DIR = path.join(__dirname, '../exports');
app.use('/design',  express.static(DESIGN_DIR));
app.use('/static',  express.static(STATIC_DIR));
app.use('/exports', express.static(EXPORTS_DIR));

// ── Seed data ────────────────────────────────────────────────────────────────
const SEED = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/seed.json'), 'utf8'));

// Normaliza UUID sin guiones (SQLite hex) → formato estándar con guiones
function toUUID(v) {
  if (!v) return v;
  const s = String(v).replace(/-/g, '');
  if (s.length === 32 && /^[0-9a-f]+$/i.test(s)) {
    return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;
  }
  return v;
}

const DEFAULT_SECTIONS = {
  restaurantes:      { enabled: true,  page_number: '11' },
  gastronomia_bcn:   { enabled: true,  page_number: '12' },
  fiesta:            { enabled: true,  page_number: '18' },
  ocio_eventos:      { enabled: true,  page_number: '22' },
  arte_exposiciones: { enabled: true,  page_number: '25' },
  experiencias:      { enabled: true,  page_number: '28' },
  alojamientos:      { enabled: true,  page_number: '30' },
  shopping:          { enabled: true,  page_number: '38' },
  influencers:       { enabled: true,  page_number: '44' },
  persona_del_ano:   { enabled: true,  page_number: '5'  },
  nota_director:     { enabled: true,  page_number: '1'  },
};

const db = {
  guides: SEED.guides.map(normalizeGuide),
  items:  SEED.items.map(normalizeItem),
  media:  [],
  snapshots: {},
};

function normalizeGuide(g) {
  return {
    id: toUUID(g.id), city: g.city || '', year: g.year || '26',
    edition: g.edition || '', guide_type: g.guide_type || 'world',
    collection: g.collection || 'estandar', status: g.status || 'draft',
    director: g.director || 'Carlos Jacoste',
    director_role: g.director_role || 'CEO & Fundador — discoolver',
    primary_color: g.primary_color || '#C8006B', accent_color: g.accent_color || '#C8006B',
    cover_headline1: g.cover_headline1 || '', cover_headline2: g.cover_headline2 || '',
    cover_tagline: g.cover_tagline || '', cover_sub_tagline: g.cover_sub_tagline || '',
    cover_photo_url: g.cover_photo_url || null, cover_bg_color: g.cover_bg_color || '#1a1a1a',
    cover_tint_opacity: g.cover_tint_opacity || 0, headline_align: g.headline_align || 'right',
    directors_letter: g.directors_letter || '', director_photo_url: g.director_photo_url || null,
    director_pull_quote: g.director_pull_quote || '', director_signature: g.director_signature || '',
    mission_text: g.mission_text || '', criteria_list: g.criteria_list || [],
    persona_name: g.persona_name || '', persona_tagline: g.persona_tagline || '',
    persona_photo_url: g.persona_photo_url || null, persona_body_photo_url: g.persona_body_photo_url || null,
    persona_bio: g.persona_bio || '', persona_quote: g.persona_quote || '',
    persona_awards: g.persona_awards || [],
    sections_config: g.sections_config || {}, back_cover_config: g.back_cover_config || {},
    ad_config: g.ad_config || {}, site_url: g.site_url || 'discoolver.com',
    owner_user_id: toUUID(g.owner_id) || null, created_by: null,
    created_at: g.created_at || new Date().toISOString(),
    updated_at: g.updated_at || new Date().toISOString(),
  };
}

function normalizeItem(i) {
  return {
    id: toUUID(i.id), guide_id: toUUID(i.guide_id), section: i.section || 'restaurantes',
    name: i.name || '', tagline: i.tagline || '', description: i.description || '',
    photo_url: i.photo_url || null, badge: i.badge || '', web: i.web || '',
    address: i.address || '', discoolver_url: i.discoolver_url || '',
    subcategory: i.subcategory || '', handle: i.handle || '', platform: i.platform || '',
    ig_followers: i.ig_followers || 0, engagement_rate: i.engagement_rate || 0,
    stats: i.stats || [], categories: i.categories || [],
    timeline_year: i.timeline_year || '', timeline_items: i.timeline_items || [],
    sort_order: i.sort_order ?? 0, enabled: i.enabled ?? true,
    cms_business_id: i.cms_business_id || null,
    created_at: i.created_at || new Date().toISOString(),
    updated_at: i.updated_at || new Date().toISOString(),
  };
}

// ── Auth ─────────────────────────────────────────────────────────────────────
function auth(req, res, next) {
  const h = req.headers['cmsauthorization'] || req.headers['authorization'] || '';
  if (!h) return res.status(401).json({ error: 'No token' });
  next();
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const guideWithCount = g => ({
  ...g,
  items_count: db.items.filter(i => i.guide_id === g.id && i.enabled).length,
});

function getSectionsConfig(guide) {
  const stored = guide.sections_config || {};
  return Object.fromEntries(
    Object.entries(DEFAULT_SECTIONS).map(([k, defaults]) => [
      k,
      { ...defaults, ...(stored[k] || {}) },
    ])
  );
}

function buildConfig(guide) {
  const items = db.items.filter(i => i.guide_id === guide.id && i.enabled);
  const bySec = {};
  items.forEach(i => { (bySec[i.section] = bySec[i.section] || []).push(i); });
  const sort = arr => (arr || []).sort((a, b) => a.sort_order - b.sort_order);

  const SECTION_MAP = {
    restaurantes: 'restaurantes', gastronomia_bcn: 'gastronomia_bcn',
    fiesta: 'fiesta', ocioEventos: 'ocio_eventos', arteExposiciones: 'arte_exposiciones',
    experienciasActividades: 'experiencias', alojamientos: 'alojamientos', shopping: 'shopping',
  };
  const cfg = guide.sections_config || {};
  const sections = {};
  for (const [ck, dk] of Object.entries(SECTION_MAP)) {
    const sc = cfg[dk] || {};
    const enabled = sc.enabled !== false;
    sections[ck] = {
      enabled, pageNumber: sc.page_number || null,
      items: enabled ? sort(bySec[dk]).map(iOut) : [],
    };
  }
  const tl = sort(bySec['persona_timeline']).map(i => ({ year: i.timeline_year, items: i.timeline_items || [] }));
  const coollGroups = {};
  sort(bySec['coollections']).forEach(i => {
    const s = i.subcategory || 'General';
    (coollGroups[s] = coollGroups[s] || []).push(iOut(i));
  });
  return {
    city: guide.city, year: guide.year, edition: guide.edition, director: guide.director,
    primaryColor: guide.primary_color, accentColor: guide.accent_color, collection: guide.collection,
    coverHeadline1: guide.cover_headline1, coverHeadline2: guide.cover_headline2,
    coverTagline: guide.cover_tagline, coverSubTagline: guide.cover_sub_tagline,
    coverPhoto: guide.cover_photo_url, coverBgColor: guide.cover_bg_color,
    coverTintOpacity: guide.cover_tint_opacity, headlineAlign: guide.headline_align,
    directorsLetter: guide.directors_letter, directorRole: guide.director_role,
    directorPhoto: guide.director_photo_url, directorPullQuote: guide.director_pull_quote,
    directorSignature: guide.director_signature, criteriaList: guide.criteria_list || [],
    missionText: guide.mission_text,
    personaDelAno: {
      name: guide.persona_name, tagline: guide.persona_tagline, photo: guide.persona_photo_url,
      bodyPhoto: guide.persona_body_photo_url, bio: guide.persona_bio, quote: guide.persona_quote,
      awards: guide.persona_awards || [], quotes: [], timeline: tl,
      recomendados: sort(bySec['persona_recom']).map(iOut),
    },
    sections,
    influencers: sort(bySec['influencers']).map(i => ({
      name: i.name, handle: i.handle, platform: i.platform, city: i.subcategory,
      description: i.description, photo: i.photo_url, stats: i.stats || [], categories: i.categories || [],
    })),
    topSaves: sort(bySec['top_saves']).map(iOut),
    coollections: Object.entries(coollGroups).map(([style, items]) => ({ style, items })),
    ad: guide.ad_config || {}, backCover: guide.back_cover_config || {}, siteUrl: guide.site_url,
  };
}

function iOut(i) {
  return {
    name: i.name, tagline: i.tagline, description: i.description, photo: i.photo_url,
    badge: i.badge, web: i.web, address: i.address, discoolverUrl: i.discoolver_url,
    subcategory: i.subcategory,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════════════════

app.post('/cms/v1/user', (req, res) => {
  const { user, password } = req.body;
  if (!user || !password) return res.status(400).json({ error: 'user y password requeridos' });
  res.json({ token: 'mock-dev-token-' + Date.now(), user, role: 'editor' });
});

app.post('/cms/v2/auth/token', (req, res) => {
  res.json({
    access_token: 'mock-dev-token-' + Date.now(),
    token_type: 'bearer', role: 'editor',
    user_id: 'mock-user-1', name: 'Editor Dev',
  });
});

app.get('/cms/v2/auth/me', auth, (req, res) => {
  res.json({ id: 'mock-user-1', name: 'Editor Dev', email: 'editor@discoolver.com', role: 'editor', status: 'active' });
});

// ════════════════════════════════════════════════════════════════════════════
// GUÍAS
// ════════════════════════════════════════════════════════════════════════════

app.get('/cms/v2/guides', auth, (req, res) => {
  const { q, status, collection, guide_type } = req.query;
  let list = db.guides;
  if (q)          list = list.filter(g => (g.city + ' ' + g.edition).toLowerCase().includes(q.toLowerCase()));
  if (status)     list = list.filter(g => g.status === status);
  if (collection) list = list.filter(g => g.collection === collection);
  if (guide_type) list = list.filter(g => g.guide_type === guide_type);
  res.json(list.map(guideWithCount));
});

app.post('/cms/v2/guides', auth, (req, res) => {
  const guide = normalizeGuide({ id: uuidv4(), ...req.body });
  db.guides.push(guide);
  res.status(201).json(guideWithCount(guide));
});

app.get('/cms/v2/guides/:id', auth, (req, res) => {
  const g = db.guides.find(g => g.id === req.params.id);
  if (!g) return res.status(404).json({ detail: 'Guide not found' });
  res.json(guideWithCount(g));
});

// Acepta PUT y PATCH
function updateGuideHandler(req, res) {
  const idx = db.guides.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ detail: 'Guide not found' });
  db.guides[idx] = { ...db.guides[idx], ...req.body, id: req.params.id, updated_at: new Date().toISOString() };
  res.json(guideWithCount(db.guides[idx]));
}
app.put('/cms/v2/guides/:id', auth, updateGuideHandler);
app.patch('/cms/v2/guides/:id', auth, updateGuideHandler);

app.delete('/cms/v2/guides/:id', auth, (req, res) => {
  const idx = db.guides.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ detail: 'Guide not found' });
  db.guides.splice(idx, 1);
  db.items = db.items.filter(i => i.guide_id !== req.params.id);
  res.status(204).send();
});

app.post('/cms/v2/guides/:id/duplicate', auth, (req, res) => {
  const orig = db.guides.find(g => g.id === req.params.id);
  if (!orig) return res.status(404).json({ detail: 'Guide not found' });
  const newId = uuidv4();
  const copy = normalizeGuide({
    ...orig, id: newId,
    city: req.body.new_city || orig.city,
    year: req.body.new_year || orig.year,
    status: 'draft',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
  db.guides.push(copy);
  db.items.filter(i => i.guide_id === orig.id).forEach(i =>
    db.items.push({ ...i, id: uuidv4(), guide_id: newId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
  );
  res.status(201).json(guideWithCount(copy));
});

// ════════════════════════════════════════════════════════════════════════════
// SECCIONES
// ════════════════════════════════════════════════════════════════════════════

app.get('/cms/v2/guides/:id/sections', auth, (req, res) => {
  const g = db.guides.find(g => g.id === req.params.id);
  if (!g) return res.status(404).json({ detail: 'Guide not found' });
  res.json(getSectionsConfig(g));
});

app.patch('/cms/v2/guides/:id/sections/:key', auth, (req, res) => {
  const g = db.guides.find(g => g.id === req.params.id);
  if (!g) return res.status(404).json({ detail: 'Guide not found' });
  const { enabled, page_number } = req.body;
  const current = g.sections_config || {};
  const section = { ...(DEFAULT_SECTIONS[req.params.key] || {}), ...(current[req.params.key] || {}) };
  if (enabled !== undefined) section.enabled = enabled;
  if (page_number !== undefined) section.page_number = page_number;
  g.sections_config = { ...current, [req.params.key]: section };
  g.updated_at = new Date().toISOString();
  res.json(getSectionsConfig(g));
});

// ════════════════════════════════════════════════════════════════════════════
// ITEMS
// ════════════════════════════════════════════════════════════════════════════

app.get('/cms/v2/guides/:id/items', auth, (req, res) => {
  const { section, enabled_only } = req.query;
  let list = db.items.filter(i => i.guide_id === req.params.id);
  if (section)              list = list.filter(i => i.section === section);
  if (enabled_only === 'true') list = list.filter(i => i.enabled);
  res.json(list.sort((a, b) => a.sort_order - b.sort_order));
});

app.post('/cms/v2/guides/:id/items', auth, (req, res) => {
  if (!db.guides.find(g => g.id === req.params.id))
    return res.status(404).json({ detail: 'Guide not found' });
  const item = normalizeItem({
    id: uuidv4(), guide_id: req.params.id,
    sort_order: db.items.filter(i => i.guide_id === req.params.id).length,
    ...req.body, id: uuidv4(), guide_id: req.params.id,
  });
  db.items.push(item);
  res.status(201).json(item);
});

// Bulk create/replace items for a section
app.post('/cms/v2/guides/:id/items/bulk', auth, (req, res) => {
  const { replace_section } = req.query;
  const items = Array.isArray(req.body) ? req.body : [];
  if (replace_section) db.items = db.items.filter(i => !(i.guide_id === req.params.id && i.section === replace_section));
  const created = items.map((item, idx) => {
    const newItem = normalizeItem({ id: uuidv4(), guide_id: req.params.id, sort_order: idx, ...item, id: uuidv4(), guide_id: req.params.id });
    db.items.push(newItem);
    return newItem;
  });
  res.status(201).json(created);
});

function updateItemHandler(req, res) {
  const idx = db.items.findIndex(i => i.id === req.params.itemId && i.guide_id === req.params.id);
  if (idx === -1) return res.status(404).json({ detail: 'Item not found' });
  db.items[idx] = { ...db.items[idx], ...req.body, id: req.params.itemId, guide_id: req.params.id, updated_at: new Date().toISOString() };
  res.json(db.items[idx]);
}
app.put('/cms/v2/guides/:id/items/:itemId', auth, updateItemHandler);
app.patch('/cms/v2/guides/:id/items/:itemId', auth, updateItemHandler);

app.delete('/cms/v2/guides/:id/items/:itemId', auth, (req, res) => {
  const idx = db.items.findIndex(i => i.id === req.params.itemId && i.guide_id === req.params.id);
  if (idx === -1) return res.status(404).json({ detail: 'Item not found' });
  db.items.splice(idx, 1);
  res.status(204).send();
});

app.post('/cms/v2/guides/:id/items/reorder', auth, (req, res) => {
  const order = Array.isArray(req.body) ? req.body : (req.body.order || []);
  order.forEach(({ id, sort_order }) => {
    const item = db.items.find(i => i.id === id);
    if (item) item.sort_order = sort_order;
  });
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════════════════════════
// MEDIA (stubs — devuelve URLs de placeholder)
// ════════════════════════════════════════════════════════════════════════════

app.get('/cms/v2/guides/:id/media', auth, (req, res) => {
  res.json(db.media.filter(m => m.guide_id === req.params.id));
});

app.post('/cms/v2/guides/:id/media', auth, (req, res) => {
  // En mock: devolver URL de placeholder. El upload real usa el FastAPI con R2.
  const asset = {
    id: uuidv4(), guide_id: req.params.id,
    url: `https://placehold.co/800x600/1a1a2e/C8006B?text=Mock+Photo`,
    cdn_url: `https://placehold.co/800x600/1a1a2e/C8006B?text=Mock+Photo`,
    mime_type: 'image/jpeg', size_bytes: 0, original_filename: 'mock.jpg',
    field_key: null, item_id: null,
    created_at: new Date().toISOString(),
  };
  db.media.push(asset);
  res.status(201).json(asset);
});

app.delete('/cms/v2/guides/:id/media/:assetId', auth, (req, res) => {
  db.media = db.media.filter(m => m.id !== req.params.assetId);
  res.status(204).send();
});

app.post('/cms/v2/guides/:id/media/generate-ai', auth, (req, res) => {
  const asset = {
    id: uuidv4(), guide_id: req.params.id,
    url: `https://placehold.co/1024x768/C8006B/ffffff?text=AI+Generated`,
    cdn_url: `https://placehold.co/1024x768/C8006B/ffffff?text=AI+Generated`,
    mime_type: 'image/jpeg', size_bytes: 0, original_filename: 'ai-generated.jpg',
    field_key: req.body.field_key || null, item_id: null,
    created_at: new Date().toISOString(),
  };
  db.media.push(asset);
  res.status(201).json(asset);
});

// ════════════════════════════════════════════════════════════════════════════
// IMPORT (stubs)
// ════════════════════════════════════════════════════════════════════════════

// Descargar plantilla Excel — devuelve bytes mínimos válidos
app.get('/cms/v2/import/template', auth, (req, res) => {
  // Redirigir al FastAPI si está corriendo, o devolver error amigable
  res.setHeader('Content-Disposition', 'attachment; filename="discoolver-guide-template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  // Archivo Excel mínimo válido (1 byte dummy — el editor solo descarga y abre)
  res.status(200).send(Buffer.from('PK', 'utf8'));
});

// Importar Excel — stub que crea una guía de ejemplo
app.post('/cms/v2/import/excel', auth, (req, res) => {
  const newId = uuidv4();
  const guide = normalizeGuide({ id: newId, city: 'Importada', year: '26', status: 'draft' });
  db.guides.push(guide);
  res.json({ guide_id: newId, city: 'Importada', year: '26', items_created: 0, warnings: ['Mock: Excel no procesado — conectar al FastAPI para importación real'] });
});

// ════════════════════════════════════════════════════════════════════════════
// EXPORT / CONFIG
// ════════════════════════════════════════════════════════════════════════════

// Ruta canónica nueva (Spring Boot)
app.get('/cms/v2/guides/:id/config', (req, res) => {
  const g = db.guides.find(g => g.id === req.params.id);
  if (!g) return res.status(404).json({ detail: 'Guide not found' });
  res.json(buildConfig(g));
});

// Ruta de compatibilidad (templates HTML existentes)
app.get('/api/v2/guides/:id/export/config', (req, res) => {
  const g = db.guides.find(g => g.id === req.params.id);
  if (!g) return res.status(404).json({ detail: 'Guide not found' });
  res.json(buildConfig(g));
});

// POST /export — genera PDF (en mock: devuelve URL placeholder)
app.post('/cms/v2/guides/:id/export', auth, (req, res) => {
  const g = db.guides.find(g => g.id === req.params.id);
  if (!g) return res.status(404).json({ detail: 'Guide not found' });
  res.json({
    url: `/exports/mock-${req.params.id}.pdf`,
    format: req.body.format || 'pdf',
    generated_at: new Date().toISOString(),
    note: 'Mock: para PDF real arranca el FastAPI en puerto 8000',
  });
});

// Snapshots
app.get('/cms/v2/guides/:id/export/history', auth, (req, res) => {
  res.json(db.snapshots[req.params.id] || []);
});
app.post('/cms/v2/guides/:id/export/snapshot', auth, (req, res) => {
  if (!db.snapshots[req.params.id]) db.snapshots[req.params.id] = [];
  db.snapshots[req.params.id].unshift({
    id: uuidv4(), label: req.query.label || `Snapshot ${new Date().toLocaleString('es-ES')}`,
    trigger: 'manual', items_count: db.items.filter(i => i.guide_id === req.params.id).length,
    created_at: new Date().toISOString(),
  });
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════════════════════════
// CMS BRIDGE — simula api.discoolver.com endpoints de búsqueda
// Paths que usa el editor: /v2/cms/cities, /v2/cms/categories, /v2/cms/search
// ════════════════════════════════════════════════════════════════════════════

const MOCK_CITIES = [
  { id: 1, name: 'Madrid', country: 'España' }, { id: 2, name: 'Barcelona', country: 'España' },
  { id: 3, name: 'Valencia', country: 'España' }, { id: 4, name: 'Sevilla', country: 'España' },
  { id: 5, name: 'Bilbao', country: 'España' }, { id: 6, name: 'San Sebastián', country: 'España' },
  { id: 7, name: 'Granada', country: 'España' }, { id: 8, name: 'Málaga', country: 'España' },
];

const MOCK_CATEGORIES = [
  { id: 1, name: 'Restaurantes' }, { id: 2, name: 'Bares y Copas' }, { id: 3, name: 'Cultura' },
  { id: 4, name: 'Hoteles' }, { id: 5, name: 'Shopping' }, { id: 6, name: 'Experiencias' },
  { id: 7, name: 'Arte' }, { id: 8, name: 'Ocio' },
];

const MOCK_BUSINESSES = [
  { id: 100, name: 'DiverXO', city: { id: 1, name: 'Madrid' }, categories: [{ name: 'Restaurantes' }], description: '3 estrellas Michelin. Fusión asiática-española.', web: 'diverxo.com', address: 'NH Eurobuilding, Chamartín', phone: '+34 915 700 766', instagram: '@diverxo_david' },
  { id: 101, name: 'Salmon Guru', city: { id: 1, name: 'Madrid' }, categories: [{ name: 'Bares y Copas' }], description: 'El mejor bar de cócteles de Europa.', web: 'salmonguru.es', address: 'Echegaray 21, Huertas', phone: '+34 910 602 185', instagram: '@salmonguru' },
  { id: 102, name: 'La Tasquería', city: { id: 1, name: 'Madrid' }, categories: [{ name: 'Restaurantes' }], description: 'Casquería fine dining con estrella Michelin.', web: 'latasqueria.com', address: 'Duque de Sesto 48, Salamanca', phone: '+34 914 512 166', instagram: '@latasqueria' },
  { id: 103, name: 'Disfrutar', city: { id: 2, name: 'Barcelona' }, categories: [{ name: 'Restaurantes' }], description: '3 estrellas Michelin. Vanguardia y creatividad.', web: 'disfrutarbarcelona.com', address: 'Villarroel 163, Eixample', phone: '+34 933 486 896', instagram: '@disfrutar_bcn' },
  { id: 104, name: 'Bar Calders', city: { id: 2, name: 'Barcelona' }, categories: [{ name: 'Bares y Copas' }], description: 'El bar más auténtico del barrio Sant Antoni.', web: 'barcalders.cat', address: 'Parlament 25, Sant Antoni', phone: '+34 933 294 349', instagram: '@barcalders' },
];

app.get('/cms/v2/cms/cities', auth, (req, res) => res.json(MOCK_CITIES));
app.get('/cms/v2/cms/categories', auth, (req, res) => res.json(MOCK_CATEGORIES));

app.get('/cms/v2/cms/search', auth, (req, res) => {
  const { q, city_id, category_id, page = 1, limit = 20 } = req.query;
  let results = [...MOCK_BUSINESSES];
  if (q)           results = results.filter(b => b.name.toLowerCase().includes(q.toLowerCase()));
  if (city_id)     results = results.filter(b => String(b.city.id) === String(city_id));
  if (category_id) results = results.filter(b => b.categories.some(c => String(c.id) === String(category_id)));
  res.json({ results: results.slice(0, Number(limit)), total: results.length, page: Number(page) });
});

app.get('/cms/v2/cms/business/:id/preview', auth, (req, res) => {
  const b = MOCK_BUSINESSES.find(b => String(b.id) === req.params.id);
  if (!b) return res.status(404).json({ detail: 'Business not found' });
  res.json({
    cms_raw: { ...b, rawId: b.id },
    mapped_item: {
      name: b.name, tagline: b.description.split('.')[0],
      description: b.description, web: b.web, address: b.address,
      badge: 'ICÓNICO', section: b.categories[0]?.name === 'Restaurantes' ? 'restaurantes' : 'fiesta',
    },
    gallery: [
      { url: `https://placehold.co/400x300/1a1a2e/C8006B?text=${encodeURIComponent(b.name)}+1` },
      { url: `https://placehold.co/400x300/C8006B/ffffff?text=${encodeURIComponent(b.name)}+2` },
    ],
  });
});

app.get('/cms/v2/cms/business/:id/gallery', auth, (req, res) => {
  res.json([
    { url: `https://placehold.co/800x600/1a1a2e/C8006B?text=Photo+1` },
    { url: `https://placehold.co/800x600/C8006B/ffffff?text=Photo+2` },
    { url: `https://placehold.co/800x600/1a1a2e/ffffff?text=Photo+3` },
  ]);
});

app.post('/cms/v2/guides/:id/cms/import', auth, (req, res) => {
  const { items, language } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ detail: 'items debe ser un array' });
  const created = items.map((item, idx) => {
    const newItem = normalizeItem({ id: uuidv4(), guide_id: req.params.id, sort_order: idx, ...item, id: uuidv4(), guide_id: req.params.id });
    db.items.push(newItem);
    return newItem;
  });
  res.status(201).json(created);
});

// También soportar la ruta legacy del CMS directo
app.get('/cms/v1/city/:lang', auth, (req, res) => res.json(MOCK_CITIES));
app.get('/cms/v1/category/:lang', auth, (req, res) => res.json(MOCK_CATEGORIES));
app.get('/cms/v1/business', auth, (req, res) => {
  const { language, state } = req.query;
  res.json(MOCK_BUSINESSES);
});

// ════════════════════════════════════════════════════════════════════════════
// AI EDITORIAL (stubs realistas)
// ════════════════════════════════════════════════════════════════════════════

app.post('/cms/v2/guides/:id/ai/generate', auth, (req, res) => {
  const { field, style_hint, overwrite } = req.body;
  res.json({
    updated: 3,
    message: `[Mock] Textos AI generados para ${field || 'description'}. En producción usa ANTHROPIC_API_KEY.`,
  });
});

app.post('/cms/v2/guides/:id/ai/suggest', auth, (req, res) => {
  const g = db.guides.find(g => g.id === req.params.id);
  res.json({
    suggestions: [
      { section: 'restaurantes', name: 'Ejemplo Restaurante IA', tagline: 'Sugerido por IA', description: 'Mock: en producción esto usa Claude para sugerir recomendados basados en la ciudad.', badge: 'WOW', address: 'Calle Ejemplo 1', score: 0.95 },
      { section: 'fiesta', name: 'Ejemplo Bar IA', tagline: 'Late night vibes', description: 'Mock: sugerencia de bar basada en el perfil de colección.', badge: 'LATE NIGHT', address: 'Calle Nocturna 5', score: 0.88 },
    ],
    guide_city: g?.city || 'Ciudad',
    model: 'mock',
  });
});

app.post('/cms/v2/guides/:id/ai/suggest/accept', auth, (req, res) => {
  const { suggestions } = req.body;
  const created = (suggestions || []).map((s, idx) => {
    const item = normalizeItem({ id: uuidv4(), guide_id: req.params.id, sort_order: idx, ...s });
    db.items.push(item);
    return item;
  });
  res.status(201).json(created);
});

// ════════════════════════════════════════════════════════════════════════════
// INSTAGRAM (stubs mínimos para que no rompa)
// ════════════════════════════════════════════════════════════════════════════

app.get('/cms/v2/guides/:id/instagram/status', auth, (req, res) => {
  res.json({ connected: false, message: 'Instagram OAuth pendiente — requiere Meta App ID del equipo Discoolver.' });
});

app.get('/cms/v2/instagram/auth-url', auth, (req, res) => {
  res.json({ auth_url: '#mock-instagram-not-configured' });
});

app.get('/cms/v2/guides/:id/instagram/media', auth, (req, res) => {
  res.json({ media: [], next_cursor: null, message: 'Mock: sin conexión Instagram en dev' });
});

// ════════════════════════════════════════════════════════════════════════════
// HEALTH
// ════════════════════════════════════════════════════════════════════════════

app.get('/health', (req, res) => res.json({ status: 'ok', mode: 'mock', guides: db.guides.length, items: db.items.length }));

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const line = '─'.repeat(50);
  console.log(`\n  ${line}`);
  console.log(`  🟢  Mock API  →  http://localhost:${PORT}`);
  console.log(`  ${line}`);
  console.log(`  Datos:  ${db.guides.length} guías · ${db.items.length} items`);
  console.log(`\n  Guías disponibles:`);
  db.guides.forEach(g => console.log(`    ${g.id.slice(0,8)}…  ${g.city} ${g.year} (${g.guide_type})`));
  console.log(`\n  Para usar con el editor:`);
  console.log(`    cd ../editor && npm run dev:mock`);
  console.log(`  ${line}\n`);
});
