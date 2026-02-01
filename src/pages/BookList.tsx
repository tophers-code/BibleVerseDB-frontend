import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBibleBooks } from '../api/client';
import type { BibleBook } from '../types';

export default function BookList() {
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBibleBooks()
      .then((res) => setBooks(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const oldTestament = books.filter((b) => b.testament === 'old_testament');
  const newTestament = books.filter((b) => b.testament === 'new_testament');

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Books of the Bible</h1>

      <div>
        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          Old Testament ({oldTestament.length} books)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {oldTestament.map((book) => (
            <Link
              key={book.id}
              to={`/verses?bible_book_id=${book.id}`}
              className="bg-amber-50 border border-amber-200 rounded p-2 text-center hover:bg-amber-100 transition-colors"
            >
              <div className="font-medium text-amber-900">{book.name}</div>
              <div className="text-xs text-amber-700">{book.chapter_count} chapters</div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          New Testament ({newTestament.length} books)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {newTestament.map((book) => (
            <Link
              key={book.id}
              to={`/verses?bible_book_id=${book.id}`}
              className="bg-blue-50 border border-blue-200 rounded p-2 text-center hover:bg-blue-100 transition-colors"
            >
              <div className="font-medium text-blue-900">{book.name}</div>
              <div className="text-xs text-blue-700">{book.chapter_count} chapters</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
