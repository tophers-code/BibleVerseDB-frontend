import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBibleBooks, getCategories, getVerse, createVerse, updateVerse } from '../api/client';
import type { BibleBook, Category } from '../types';
import BookAutocomplete from '../components/BookAutocomplete';
import CategoryTag from '../components/CategoryTag';

export default function VerseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [books, setBooks] = useState<BibleBook[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [chapter, setChapter] = useState('');
  const [verseStart, setVerseStart] = useState('');
  const [verseEnd, setVerseEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  // Working book for continuous entry
  const [workingBook, setWorkingBook] = useState<BibleBook | null>(null);

  useEffect(() => {
    Promise.all([getBibleBooks(), getCategories()])
      .then(([bookRes, catRes]) => {
        setBooks(bookRes.data);
        setCategories(catRes.data);
      })
      .finally(() => {
        if (!isEdit) setLoading(false);
      });

    if (isEdit && id) {
      getVerse(parseInt(id))
        .then((res) => {
          const verse = res.data;
          setSelectedBook(verse.bible_book);
          setChapter(verse.chapter.toString());
          setVerseStart(verse.verse_start.toString());
          setVerseEnd(verse.verse_end?.toString() || '');
          setNotes(verse.notes || '');
          setSelectedCategories(verse.categories.map((c) => c.id));
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) {
      setError('Please select a book');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const data = {
        bible_book_id: selectedBook.id,
        chapter: parseInt(chapter),
        verse_start: parseInt(verseStart),
        verse_end: verseEnd ? parseInt(verseEnd) : null,
        notes: notes || undefined,
        category_ids: selectedCategories,
      };

      if (isEdit && id) {
        await updateVerse(parseInt(id), data);
        navigate(`/verses/${id}`);
      } else {
        const res = await createVerse(data);
        // Reset form for continuous entry
        setChapter('');
        setVerseStart('');
        setVerseEnd('');
        setNotes('');
        // Keep categories and working book
        if (workingBook) {
          setSelectedBook(workingBook);
        }
        navigate(`/verses/${res.data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.errors?.join(', ') || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        {isEdit ? 'Edit Verse' : 'Add New Verse'}
      </h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        {!isEdit && (
          <div className="bg-blue-50 p-4 rounded-md">
            <label className="block text-sm font-medium text-blue-800 mb-2">
              Working Book (optional - auto-fills book for batch entry)
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <BookAutocomplete
                  books={books}
                  value={workingBook}
                  onChange={setWorkingBook}
                />
              </div>
              {workingBook && (
                <button
                  type="button"
                  onClick={() => {
                    setWorkingBook(null);
                    setSelectedBook(null);
                  }}
                  className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Book *</label>
          <BookAutocomplete
            books={books}
            value={selectedBook}
            onChange={setSelectedBook}
            workingBook={workingBook}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chapter *</label>
            <input
              type="number"
              min="1"
              max={selectedBook?.chapter_count || 150}
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verse Start *</label>
            <input
              type="number"
              min="1"
              value={verseStart}
              onChange={(e) => setVerseStart(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verse End</label>
            <input
              type="number"
              min={verseStart ? parseInt(verseStart) : 1}
              value={verseEnd}
              onChange={(e) => setVerseEnd(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <CategoryTag
                key={category.id}
                category={category}
                onClick={() => handleCategoryToggle(category.id)}
                selected={selectedCategories.includes(category.id)}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add personal notes..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Verse' : 'Add Verse'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
