import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBibleBooks, getCategories, getVerse, createVerse, updateVerse, fetchAllVerseTexts } from '../api/client';
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [chapter, setChapter] = useState('');
  const [verseStart, setVerseStart] = useState('');
  const [verseEnd, setVerseEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [categoryNotes, setCategoryNotes] = useState<Record<number, string>>({});
  const [categoryProminent, setCategoryProminent] = useState<Record<number, boolean>>({});
  const [tagNames, setTagNames] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

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
          // Load category notes and prominent flags
          const notes: Record<number, string> = {};
          const prominent: Record<number, boolean> = {};
          verse.categories.forEach((c) => {
            if (c.category_note) {
              notes[c.id] = c.category_note;
            }
            if (c.prominent) {
              prominent[c.id] = true;
            }
          });
          setCategoryNotes(notes);
          setCategoryProminent(prominent);
          if (verse.tags) {
            setTagNames(verse.tags.map((t) => t.name));
          }
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        // Remove category, its notes, and prominent flag
        setCategoryNotes((notes) => {
          const { [categoryId]: _, ...rest } = notes;
          return rest;
        });
        setCategoryProminent((prominent) => {
          const { [categoryId]: _, ...rest } = prominent;
          return rest;
        });
        return prev.filter((id) => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const handleCategoryNoteChange = (categoryId: number, note: string) => {
    setCategoryNotes((prev) => ({
      ...prev,
      [categoryId]: note,
    }));
  };

  const handleProminentToggle = (categoryId: number) => {
    setCategoryProminent((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
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
        category_notes: categoryNotes,
        category_prominent: categoryProminent,
        tag_names: tagNames,
      };

      if (isEdit && id) {
        await updateVerse(parseInt(id), data);
        // Auto-fetch verse texts after update
        fetchAllVerseTexts(parseInt(id)).catch(() => {});
        navigate(`/verses/${id}`);
      } else {
        const res = await createVerse(data);
        const newVerseId = res.data.id;
        const newReference = res.data.reference;

        // Auto-fetch verse texts in background
        fetchAllVerseTexts(newVerseId).catch(() => {});

        if (workingBook) {
          // Stay on form for continuous entry
          setChapter('');
          setVerseStart('');
          setVerseEnd('');
          setNotes('');
          setSelectedCategories([]);
          setCategoryNotes({});
          setCategoryProminent({});
          setTagNames([]);
          setTagInput('');
          setSelectedBook(workingBook);
          setSuccessMessage(`Added ${newReference} - ready for next verse`);
          // Clear success message after 3 seconds
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          // Navigate to the new verse
          navigate(`/verses/${newVerseId}`);
        }
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

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">{successMessage}</div>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
          <p className="text-xs text-gray-500 mb-2">Click to select multiple categories</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <CategoryTag
                key={category.id}
                category={category}
                onClick={() => handleCategoryToggle(category.id)}
                selected={selectedCategories.includes(category.id)}
                showTooltip={false}
                showMeaning={true}
              />
            ))}
          </div>

          {/* Per-category notes and prominent toggle */}
          {selectedCategories.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Category Notes & Prominence</p>
              {selectedCategories.map((catId) => {
                const category = categories.find((c) => c.id === catId);
                if (!category) return null;
                const isProminent = categoryProminent[catId] || false;
                return (
                  <div key={catId} className="flex gap-2 items-start">
                    <button
                      type="button"
                      onClick={() => handleProminentToggle(catId)}
                      className={`p-1.5 rounded transition-colors ${
                        isProminent
                          ? 'text-yellow-500 hover:text-yellow-600'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                      title={isProminent ? 'Remove prominent marker' : 'Mark as prominent verse for this category'}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                    <CategoryTag category={category} showTooltip={false} />
                    <input
                      type="text"
                      value={categoryNotes[catId] || ''}
                      onChange={(e) => handleCategoryNoteChange(catId, e.target.value)}
                      placeholder={`Why does this verse relate to ${category.name}?`}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <p className="text-xs text-gray-500 mb-2">Type a tag name and press Enter or comma to add</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {tagNames.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setTagNames((prev) => prev.filter((t) => t !== tag))}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const name = tagInput.trim().toLowerCase().replace(/,/g, '');
                if (name && !tagNames.includes(name)) {
                  setTagNames((prev) => [...prev, name]);
                }
                setTagInput('');
              }
            }}
            placeholder="e.g. atonement, grace, salvation..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">General Notes</label>
          <textarea
            value={notes}
            onInput={(e) => setNotes((e.target as HTMLTextAreaElement).value)}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add personal notes (applies to the whole verse)..."
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
