import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

export const api = axios.create({ baseURL: BASE });

// ── Guides ────────────────────────────────────────────────────────────────────
export const listGuides    = (params) => api.get("/v2/guides", { params }).then(r => r.data);
export const getGuide      = id => api.get(`/v2/guides/${id}`).then(r => r.data);
export const createGuide   = data => api.post("/v2/guides", data).then(r => r.data);
export const updateGuide   = (id, data) => api.patch(`/v2/guides/${id}`, data).then(r => r.data);
export const deleteGuide    = id => api.delete(`/v2/guides/${id}`);
export const duplicateGuide = (id, params) => api.post(`/v2/guides/${id}/duplicate`, null, { params }).then(r => r.data);
export const getConfig     = id => api.get(`/v2/guides/${id}/export/config`).then(r => r.data);

// ── Items ─────────────────────────────────────────────────────────────────────
export const listItems      = (id, params) => api.get(`/v2/guides/${id}/items`, { params }).then(r => r.data);
export const createItem     = (id, data) => api.post(`/v2/guides/${id}/items`, data).then(r => r.data);
export const bulkItems      = (id, items, replaceSection) =>
  api.post(`/v2/guides/${id}/items/bulk`, items, {
    params: replaceSection ? { replace_section: replaceSection } : {},
  }).then(r => r.data);
export const updateItem     = (gid, iid, data) => api.patch(`/v2/guides/${gid}/items/${iid}`, data).then(r => r.data);
export const deleteItem     = (gid, iid) => api.delete(`/v2/guides/${gid}/items/${iid}`);

// ── Media ─────────────────────────────────────────────────────────────────────
export const listMedia    = id => api.get(`/v2/guides/${id}/media`).then(r => r.data);
export const uploadMedia  = (id, formData) =>
  api.post(`/v2/guides/${id}/media`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(r => r.data);
export const deleteMedia     = (id, assetId) => api.delete(`/v2/guides/${id}/media/${assetId}`);
export const generateAiPhoto = (id, body)   => api.post(`/v2/guides/${id}/media/generate-ai`, body).then(r => r.data);

// ── Import ────────────────────────────────────────────────────────────────────
export const downloadTemplate = () =>
  api.get("/v2/import/template", { responseType: "blob" }).then(r => r.data);
export const importExcel = formData =>
  api.post("/v2/import/excel", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(r => r.data);

// ── Export + history ──────────────────────────────────────────────────────────
export const exportGuide    = (id, format = "pdf") =>
  api.post(`/v2/guides/${id}/export`, { format }).then(r => r.data);
export const listSnapshots  = id => api.get(`/v2/guides/${id}/export/history`).then(r => r.data);
export const createSnapshot = (id, label) =>
  api.post(`/v2/guides/${id}/export/snapshot`, null, { params: label ? { label } : {} }).then(r => r.data);

// ── CMS Bridge (api.discoolver.com) ───────────────────────────────────────────
export const cmsCities      = () => api.get("/v2/cms/cities").then(r => r.data);
export const cmsCategories  = () => api.get("/v2/cms/categories").then(r => r.data);
export const cmsSearch      = (params) => api.get("/v2/cms/search", { params }).then(r => r.data);
export const cmsPreview     = (id, section) =>
  api.get(`/v2/cms/business/${id}/preview`, { params: section ? { section } : {} }).then(r => r.data);
export const cmsGallery     = (id) => api.get(`/v2/cms/business/${id}/gallery`).then(r => r.data);
export const cmsImport      = (guideId, body) =>
  api.post(`/v2/guides/${guideId}/cms/import`, body).then(r => r.data);

// ── Instagram ─────────────────────────────────────────────────────────────────
export const getInstagramStatus   = (guideId) => api.get(`/v2/guides/${guideId}/instagram/status`).then(r => r.data);
export const getInstagramAuthUrl  = (guideId) => api.get(`/v2/instagram/auth-url`, { params: { guide_id: guideId } }).then(r => r.data);
export const getInstagramMedia    = (guideId, after) => api.get(`/v2/guides/${guideId}/instagram/media`, { params: after ? { after } : {} }).then(r => r.data);
export const importInstagramPosts = (guideId, payload) => api.post(`/v2/guides/${guideId}/instagram/import`, payload).then(r => r.data);
export const disconnectInstagram  = (guideId) => api.delete(`/v2/guides/${guideId}/instagram/connection`).then(r => r.data);

// ── AI ────────────────────────────────────────────────────────────────────────
export const generateAI = (id, data) =>
  api.post(`/v2/guides/${id}/ai/generate`, data).then(r => r.data);

export const suggestItems = (id, data) =>
  api.post(`/v2/guides/${id}/ai/suggest`, data).then(r => r.data);

export const acceptSuggestions = (id, data) =>
  api.post(`/v2/guides/${id}/ai/suggest/accept`, data).then(r => r.data);
