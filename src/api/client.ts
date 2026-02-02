import axios from 'axios';
import type { BibleBook, Category, Verse, VerseFormData, VerseProgression } from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Bible Books
export const getBibleBooks = () => api.get<BibleBook[]>('/bible_books');
export const getBibleBook = (id: number) => api.get<BibleBook>(`/bible_books/${id}`);

// Categories
export const getCategories = () => api.get<Category[]>('/categories');
export const getCategory = (id: number) => api.get<Category>(`/categories/${id}`);

// Verses
export const getVerses = (params?: { bible_book_id?: number; category_id?: number }) =>
  api.get<Verse[]>('/verses', { params });
export const getVerse = (id: number) => api.get<Verse>(`/verses/${id}`);
export const createVerse = (data: VerseFormData) =>
  api.post<Verse>('/verses', { verse: data, category_ids: data.category_ids });
export const updateVerse = (id: number, data: Partial<VerseFormData>) =>
  api.patch<Verse>(`/verses/${id}`, { verse: data, category_ids: data.category_ids });
export const deleteVerse = (id: number) => api.delete(`/verses/${id}`);

// Verse References
export const addVerseReference = (verseId: number, referencedVerseId: number) =>
  api.post(`/verses/${verseId}/references`, { referenced_verse_id: referencedVerseId });
export const removeVerseReference = (verseId: number, referencedVerseId: number) =>
  api.delete(`/verses/${verseId}/references/${referencedVerseId}`);

// Progressions
export const getProgressions = () => api.get<VerseProgression[]>('/progressions');
export const getProgression = (id: number) => api.get<VerseProgression>(`/progressions/${id}`);
export const createProgression = (data: { name: string; description?: string }) =>
  api.post<VerseProgression>('/progressions', { progression: data });
export const updateProgression = (id: number, data: { name?: string; description?: string }) =>
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
  version_name: string;
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

export default api;
