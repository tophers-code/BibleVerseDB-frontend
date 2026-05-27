import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getVerses, getCategories, getBibleBooks, getTags, deleteVerse } from '../api/client';
import type { Verse, Category, BibleBook, Tag } from '../types';
import VerseCard from '../components/VerseCard';

export default function VerseList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryFilter = searchParams.get('category_id');
  const bookFilter = searchParams.get('bible_book_id');
  const tagFilter = searchParams.get('tag_id');
  const [prominentOnly, setProminentOnly] = useState(false);

  // Fetch available categories based on current filters
  useEffect(() => {
    const params: { with_verses: boolean; bible_book_id?: number } = { with_verses: true };
    if (bookFilter) {
      params.bible_book_id = parseInt(bookFilter);
    }
    getCategories(params).then((res) => {
      setCategories(res.data);
      if (categoryFilter && !res.data.some((c) => c.id === parseInt(categoryFilter))) {
        searchParams.delete('category_id');
        setSearchParams(searchParams);
      }
    });
  }, [bookFilter]);

  // Fetch available books based on current filters
  useEffect(() => {
    const params: { with_verses: boolean; category_id?: number } = { with_verses: true };
    if (categoryFilter) {
      params.category_id = parseInt(categoryFilter);
    }
    getBibleBooks(params).then((res) => {
      setBooks(res.data);
      if (bookFilter && !res.data.some((b) => b.id === parseInt(bookFilter))) {
        searchParams.delete('bible_book_id');
        setSearchParams(searchParams);
      }
    });
  }, [categoryFilter]);

  // Fetch available tags based on current filters
  useEffect(() => {
    const params: { with_verses: boolean; bible_book_id?: number; category_id?: number } = { with_verses: true };
    if (bookFilter) params.bible_book_id = parseInt(bookFilter);
    if (categoryFilter) params.category_id = parseInt(categoryFilter);
    getTags(params).then((res) => {
      setTags(res.data);
      if (tagFilter && !res.data.some((t) => t.id === parseInt(tagFilter))) {
        searchParams.delete('tag_id');
        setSearchParams(searchParams);
      }
    });
  }, [bookFilter, categoryFilter]);

  // Fetch verses based on all filters
  useEffect(() => {
    setLoading(true);
    const params: { category_id?: number; bible_book_id?: number; tag_id?: number } = {};
    if (categoryFilter) params.category_id = parseInt(categoryFilter);
    if (bookFilter) params.bible_book_id = parseInt(bookFilter);
    if (tagFilter) params.tag_id = parseInt(tagFilter);

    getVerses(params)
      .then((res) => setVerses(res.data))
      .finally(() => setLoading(false));
  }, [categoryFilter, bookFilter, tagFilter]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this verse?')) {
      await deleteVerse(id);
      setVerses((prev) => prev.filter((v) => v.id !== id));
    }
  };

  const handleFilterChange = (type: 'category_id' | 'bible_book_id' | 'tag_id', value: string) => {
    if (value) {
      searchParams.set(type, value);
    } else {
      searchParams.delete(type);
    }
    setSearchParams(searchParams);
  };

  const displayedVerses = prominentOnly
    ? verses.filter((v) => {
        if (categoryFilter) {
          return v.categories.some((c) => c.id === parseInt(categoryFilter) && c.prominent);
        }
        return v.categories.some((c) => c.prominent);
      })
    : verses;

  const hasFilters = categoryFilter || bookFilter || tagFilter || prominentOnly;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">All Verses</h1>
        <span className="text-gray-500">
          {loading ? '...' : `${displayedVerses.length} ${displayedVerses.length === 1 ? 'verse' : 'verses'}${hasFilters ? ' (filtered)' : ''}`}
        </span>
      </div>

      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Category
          </label>
          <select
            value={categoryFilter || ''}
            onChange={(e) => handleFilterChange('category_id', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Book
          </label>
          <select
            value={bookFilter || ''}
            onChange={(e) => handleFilterChange('bible_book_id', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Books</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Tag
          </label>
          <select
            value={tagFilter || ''}
            onChange={(e) => handleFilterChange('tag_id', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => setProminentOnly((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
              prominentOnly
                ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill={prominentOnly ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={prominentOnly ? 0 : 1.5} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Prominent only
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : verses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No verses found. Try adjusting your filters or add a new verse.
        </div>
      ) : displayedVerses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No prominent verses match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedVerses.map((verse) => (
            <VerseCard key={verse.id} verse={verse} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
