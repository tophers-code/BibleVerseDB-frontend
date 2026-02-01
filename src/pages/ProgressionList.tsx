import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProgressions, deleteProgression } from '../api/client';
import type { VerseProgression } from '../types';

export default function ProgressionList() {
  const [progressions, setProgressions] = useState<VerseProgression[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProgressions()
      .then((res) => setProgressions(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this progression?')) {
      await deleteProgression(id);
      setProgressions((prev) => prev.filter((p) => p.id !== id));
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Verse Progressions</h1>
        <Link
          to="/progressions/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Progression
        </Link>
      </div>

      <p className="text-gray-600">
        Linear progressions show how verses connect in a theological narrative.
      </p>

      {progressions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No progressions yet. Create your first one!
        </div>
      ) : (
        <div className="space-y-4">
          {progressions.map((progression) => (
            <div
              key={progression.id}
              className="bg-white rounded-lg shadow-md p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <Link
                    to={`/progressions/${progression.id}`}
                    className="text-lg font-semibold text-slate-800 hover:text-blue-600"
                  >
                    {progression.name}
                  </Link>
                  {progression.description && (
                    <p className="text-gray-600 text-sm mt-1">{progression.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(progression.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>

              {progression.steps.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {progression.steps.map((step, index) => (
                    <span
                      key={step.id}
                      className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-sm"
                    >
                      <span className="text-gray-500 mr-1">{index + 1}.</span>
                      <Link
                        to={`/verses/${step.verse.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {step.verse.reference}
                      </Link>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
