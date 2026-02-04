import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getVerses, getCategories, getBibleBooks, deleteVerse } from '../api/client';
import type { Verse, Category, BibleBook } from '../types';
import VerseCard from '../components/VerseCard';

export default function VerseList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryFilter = searchParams.get('category_id');
  const bookFilter = searchParams.get('bible_book_id');

  // Fetch available categories based on current book filter
  useEffect(() => {
    const params: { with_verses: boolean; bible_book_id?: number } = { with_verses: true };
    if (bookFilter) {
      params.bible_book_id = parseInt(bookFilter);
    }
    getCategories(params).then((res) => {
      setCategories(res.data);
      // Clear category filter if current selection is no longer valid
      if (categoryFilter && !res.data.some((c) => c.id === parseInt(categoryFilter))) {
        searchParams.delete('category_id');
        setSearchParams(searchParams);
      }
    });
  }, [bookFilter]);

  // Fetch available books based on current category filter
  useEffect(() => {
    const params: { with_verses: boolean; category_id?: number } = { with_verses: true };
    if (categoryFilter) {
      params.category_id = parseInt(categoryFilter);
    }
    getBibleBooks(params).then((res) => {
      setBooks(res.data);
      // Clear book filter if current selection is no longer valid
      if (bookFilter && !res.data.some((b) => b.id === parseInt(bookFilter))) {
        searchParams.delete('bible_book_id');
        setSearchParams(searchParams);
      }
    });
  }, [categoryFilter]);

  // Fetch verses based on both filters
  useEffect(() => {
    setLoading(true);
    const params: { category_id?: number; bible_book_id?: number } = {};
    if (categoryFilter) params.category_id = parseInt(categoryFilter);
    if (bookFilter) params.bible_book_id = parseInt(bookFilter);

    getVerses(params)
      .then((res) => setVerses(res.data))
      .finally(() => setLoading(false));
  }, [categoryFilter, bookFilter]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this verse?')) {
      await deleteVerse(id);
      setVerses((prev) => prev.filter((v) => v.id !== id));
    }
  };

  const handleFilterChange = (type: 'category_id' | 'bible_book_id', value: string) => {
    if (value) {
      searchParams.set(type, value);
    } else {
      searchParams.delete(type);
    }
    setSearchParams(searchParams);
  };

  const hasFilters = categoryFilter || bookFilter;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">All Verses</h1>
        <span className="text-gray-500">
          {loading ? '...' : `${verses.length} ${verses.length === 1 ? 'verse' : 'verses'}${hasFilters ? ' (filtered)' : ''}`}
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
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : verses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No verses found. Try adjusting your filters or add a new verse.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {verses.map((verse) => (
            <VerseCard key={verse.id} verse={verse} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
