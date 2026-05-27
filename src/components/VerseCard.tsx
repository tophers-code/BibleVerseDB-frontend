import { Link } from 'react-router-dom';
import type { Verse } from '../types';
import CategoryTag from './CategoryTag';
import { useAuth } from '../contexts/AuthContext';

interface VerseCardProps {
  verse: Verse;
  onDelete?: (id: number) => void;
  linkState?: object;
}

export default function VerseCard({ verse, onDelete, linkState }: VerseCardProps) {
  const { isAdmin } = useAuth();

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <Link to={`/verses/${verse.id}`} state={linkState} className="text-lg font-semibold text-slate-800 hover:text-blue-600">
          {verse.reference}
        </Link>
        {isAdmin && (
          <div className="flex space-x-2">
            <Link
              to={`/verses/${verse.id}/edit`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Edit
            </Link>
            {onDelete && (
              <button
                onClick={() => onDelete(verse.id)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {verse.categories.map((category) => (
          <CategoryTag key={category.id} category={category} />
        ))}
        {verse.tags?.map((tag) => (
          <Link
            key={tag.id}
            to={`/tags/${tag.id}`}
            onClick={(e) => e.stopPropagation()}
            className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            {tag.name}
          </Link>
        ))}
      </div>

      {verse.notes && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{verse.notes}</p>
      )}
    </div>
  );
}
