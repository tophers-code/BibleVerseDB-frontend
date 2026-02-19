export interface BibleBook {
  id: number;
  name: string;
  abbreviation: string;
  testament: 'old_testament' | 'new_testament';
  book_order: number;
  chapter_count: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  meaning: string;
  color_code: string;
  description?: string;
  verses_count?: number;
  category_note?: string | null;
  prominent?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Tag {
  id: number;
  name: string;
  definition?: string;
  description?: string;
  verses_count?: number;
}

export interface Verse {
  id: number;
  reference: string;
  bible_book: BibleBook;
  chapter: number;
  verse_start: number;
  verse_end: number | null;
  notes: string | null;
  categories: Category[];
  tags: Tag[];
  referenced_verses?: VerseReference[];
  referencing_verses?: VerseReference[];
  created_at: string;
  updated_at: string;
}

export interface VerseReference {
  id: number;
  reference: string;
}

export interface VerseProgression {
  id: number;
  name: string;
  definition?: string;
  description: string | null;
  steps: ProgressionStep[];
  created_at: string;
  updated_at: string;
}

export interface ProgressionStep {
  id: number;
  step_order: number;
  verse: VerseReference;
}

export interface VerseFormData {
  bible_book_id: number;
  chapter: number;
  verse_start: number;
  verse_end?: number | null;
  notes?: string;
  category_ids?: number[];
  category_notes?: Record<number, string>;
  category_prominent?: Record<number, boolean>;
  tag_names?: string[];
}

export type ColorCode =
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'blue'
  | 'teal'
  | 'pink'
  | 'pink-black'
  | 'red-black'
  | 'black'
  | 'red'
  | 'green'
  | 'light-green'
  | 'brown'
  | 'light-orange';

export const categoryColors: Record<ColorCode, string> = {
  'yellow': 'bg-amber-400 text-black',
  'purple': 'bg-violet-500 text-white',
  'orange': 'bg-orange-500 text-white',
  'blue': 'bg-blue-500 text-white',
  'teal': 'bg-teal-500 text-white',
  'pink': 'bg-pink-500 text-white',
  'pink-black': 'bg-pink-900 text-white',
  'red-black': 'bg-red-900 text-white',
  'black': 'bg-gray-800 text-white',
  'red': 'bg-red-500 text-white',
  'green': 'bg-green-500 text-white',
  'light-green': 'bg-green-300 text-black',
  'brown': 'bg-amber-800 text-white',
  'light-orange': 'bg-orange-300 text-black',
};
