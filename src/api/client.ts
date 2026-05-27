import axios from 'axios';
import type { BibleBook, Category, Tag, Verse, VerseFormData, VerseProgression, PortalUser } from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Bible Books
export const getBibleBooks = (params?: { with_verses?: boolean; category_id?: number }) =>
  api.get<BibleBook[]>('/bible_books', { params });
export const getBibleBook = (id: number) => api.get<BibleBook>(`/bible_books/${id}`);

// Categories
export const getCategories = (params?: { with_verses?: boolean; bible_book_id?: number }) =>
  api.get<Category[]>('/categories', { params });
export const getCategory = (id: number) => api.get<Category>(`/categories/${id}`);
export const createCategory = (data: { name: string; meaning: string; color_code: string; description?: string }) =>
  api.post<Category>('/categories', { category: data });
export const updateCategory = (id: number, data: { name?: string; meaning?: string; color_code?: string; description?: string }) =>
  api.patch<Category>(`/categories/${id}`, { category: data });
export const deleteCategory = (id: number) => api.delete(`/categories/${id}`);

// Tags
export const getTags = (params?: { with_verses?: boolean; bible_book_id?: number; category_id?: number }) =>
  api.get<Tag[]>('/tags', { params });
export const getTag = (id: number) => api.get<Tag>(`/tags/${id}`);
export const createTag = (data: { name: string; definition?: string; description?: string }) =>
  api.post<Tag>('/tags', { tag: data });
export const updateTag = (id: number, data: { name?: string; definition?: string; description?: string }) =>
  api.patch<Tag>(`/tags/${id}`, { tag: data });
export const deleteTag = (id: number) => api.delete(`/tags/${id}`);

// Verses
export const getVerses = (params?: { bible_book_id?: number; category_id?: number; tag_id?: number }) =>
  api.get<Verse[]>('/verses', { params });
export const getVerse = (id: number) => api.get<Verse>(`/verses/${id}`);
export const createVerse = (data: VerseFormData) =>
  api.post<Verse>('/verses', { verse: data, category_ids: data.category_ids, category_notes: data.category_notes, category_prominent: data.category_prominent, tag_names: data.tag_names });
export const updateVerse = (id: number, data: Partial<VerseFormData>) =>
  api.patch<Verse>(`/verses/${id}`, { verse: data, category_ids: data.category_ids, category_notes: data.category_notes, category_prominent: data.category_prominent, tag_names: data.tag_names });
export const deleteVerse = (id: number) => api.delete(`/verses/${id}`);

// Verse References
export const addVerseReference = (verseId: number, referencedVerseId: number) =>
  api.post(`/verses/${verseId}/references`, { referenced_verse_id: referencedVerseId });
export const removeVerseReference = (verseId: number, referencedVerseId: number) =>
  api.delete(`/verses/${verseId}/references/${referencedVerseId}`);

// Progressions
export const getProgressions = () => api.get<VerseProgression[]>('/progressions');
export const getProgression = (id: number) => api.get<VerseProgression>(`/progressions/${id}`);
export const createProgression = (data: { name: string; definition?: string; description?: string }) =>
  api.post<VerseProgression>('/progressions', { progression: data });
export const updateProgression = (id: number, data: { name?: string; definition?: string; description?: string }) =>
  api.patch<VerseProgression>(`/progressions/${id}`, { progression: data });
export const deleteProgression = (id: number) => api.delete(`/progressions/${id}`);

// Progression Steps
export const addProgressionStep = (progressionId: number, verseId: number, stepOrder: number) =>
  api.post(`/progressions/${progressionId}/steps`, { step: { verse_id: verseId, step_order: stepOrder } });
export const updateProgressionStep = (progressionId: number, stepId: number, stepOrder: number) =>
  api.patch(`/progressions/${progressionId}/steps/${stepId}`, { step: { step_order: stepOrder } });
export const removeProgressionStep = (progressionId: number, stepId: number) =>
  api.delete(`/progressions/${progressionId}/steps/${stepId}`);

export const reorderProgressionSteps = (progressionId: number, stepIds: number[]) =>
  api.post(`/progressions/${progressionId}/steps/reorder`, { step_ids: stepIds });

// Verse Texts
export interface VerseTextResponse {
  version: string;
  text: string;
  version_name?: string;
}

export interface VerseTextsListResponse {
  supported_versions: Record<string, string>;
  texts: { version: string; text: string }[];
}

export interface FetchTextsResponse {
  reference: string;
  texts: VerseTextResponse[];
}

export const getVerseTexts = (verseId: number) =>
  api.get<VerseTextsListResponse>(`/verses/${verseId}/texts`);

export const getVerseText = (verseId: number, version: string) =>
  api.get<VerseTextResponse>(`/verses/${verseId}/texts`, { params: { version } });

export const fetchAllVerseTexts = (verseId: number) =>
  api.post<FetchTextsResponse>(`/verses/${verseId}/fetch_texts`);

export const deleteVerseText = (verseId: number, version: string) =>
  api.delete(`/verses/${verseId}/texts/${version}`);

// Verse Text Status & Batch Fetch
export interface VersionStatus {
  code: string;
  name: string;
  missing_count: number;
  fetched_count: number;
}

export interface ProviderStatus {
  name: string;
  versions: VersionStatus[];
}

export interface VerseTextStatusResponse {
  total_verses: number;
  providers: ProviderStatus[];
}

export interface BatchFetchResult {
  verse_id: number;
  reference: string;
  status: 'success' | 'error';
  text?: string;
  error?: string;
}

export interface BatchFetchResponse {
  version: string;
  results: BatchFetchResult[];
}

export const getVerseTextStatus = () =>
  api.get<VerseTextStatusResponse>('/verse_texts/status');

export const batchFetchVerseTexts = (version: string) =>
  api.post<BatchFetchResponse>('/verse_texts/batch_fetch', { version });

// Users (admin only)
export const getUsers = () => api.get<PortalUser[]>('/users');
export const createUser = (data: { email: string; password: string; role: 'admin' | 'user' }) =>
  api.post<PortalUser>('/users', { user: data });
export const updateUser = (id: number, data: { role?: 'admin' | 'user'; password?: string }) =>
  api.patch<PortalUser>(`/users/${id}`, { user: data });
export const deleteUser = (id: number) => api.delete(`/users/${id}`);

export default api;
