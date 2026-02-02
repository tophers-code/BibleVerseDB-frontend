import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getVerse, deleteVerse, getVerses, addVerseReference, removeVerseReference, getVerseTexts, fetchAllVerseTexts, type VerseTextResponse } from '../api/client';
import type { Verse } from '../types';
import CategoryTag from '../components/CategoryTag';

const VERSION_NAMES: Record<string, string> = {
  'esv': 'English Standard Version',
  'en-asv': 'American Standard Version',
  'en-t4t': 'Translation for Translators',
  'en-bsb': 'Berean Study Bible',
  'en-web': 'World English Bible',
};

export default function VerseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [verse, setVerse] = useState<Verse | null>(null);
  const [allVerses, setAllVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerseId, setSelectedVerseId] = useState<string>('');
  const [addingReference, setAddingReference] = useState(false);
  const [showReferenceForm, setShowReferenceForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verseTexts, setVerseTexts] = useState<VerseTextResponse[]>([]);
  const [fetchingTexts, setFetchingTexts] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string>('esv');

  useEffect(() => {
    if (id) {
      Promise.all([getVerse(parseInt(id)), getVerses(), getVerseTexts(parseInt(id))])
        .then(([verseRes, versesRes, textsRes]) => {
          setVerse(verseRes.data);
          setAllVerses(versesRes.data);
          const texts = textsRes.data.texts || [];
          if (texts.length > 0) {
            setVerseTexts(texts);
            // Set selected version to first available if current isn't in the list
            if (!texts.find((t: VerseTextResponse) => t.version === selectedVersion)) {
              setSelectedVersion(texts[0].version);
            }
          }
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleFetchTexts = async () => {
    if (!verse) return;

    setFetchingTexts(true);
    setError(null);

    try {
      const res = await fetchAllVerseTexts(verse.id);
      const texts = res.data.texts || [];
      setVerseTexts(texts.filter((t: VerseTextResponse) => t.text));
      // Set selected version to first available if current isn't available
      if (texts.length > 0 && !texts.find((t: VerseTextResponse) => t.version === selectedVersion)) {
        setSelectedVersion(texts[0].version);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch verse texts');
    } finally {
      setFetchingTexts(false);
    }
  };

  const refreshVerse = async () => {
    if (id) {
      const res = await getVerse(parseInt(id));
      setVerse(res.data);
    }
  };

  const handleAddReference = async () => {
    if (!verse || !selectedVerseId) return;

    setAddingReference(true);
    setError(null);

    try {
      await addVerseReference(verse.id, parseInt(selectedVerseId));
      await refreshVerse();
      setSelectedVerseId('');
      setShowReferenceForm(false);
    } catch (err: any) {
      setError(err.response?.data?.errors?.join(', ') || 'Failed to add reference');
    } finally {
      setAddingReference(false);
    }
  };

  const handleRemoveReference = async (referencedVerseId: number) => {
    if (!verse) return;
    if (!window.confirm('Remove this reference?')) return;

    try {
      await removeVerseReference(verse.id, referencedVerseId);
      await refreshVerse();
    } catch (err: any) {
      setError(err.response?.data?.errors?.join(', ') || 'Failed to remove reference');
    }
  };

  const handleDelete = async () => {
    if (verse && window.confirm('Are you sure you want to delete this verse?')) {
      await deleteVerse(verse.id);
      navigate('/verses');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!verse) {
    return <div className="text-center py-8">Verse not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-slate-800">{verse.reference}</h1>
          <div className="flex gap-2">
            <Link
              to={`/verses/${verse.id}/edit`}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="mb-4">
          <span className="text-sm text-gray-500">
            {verse.bible_book.testament === 'old_testament' ? 'Old Testament' : 'New Testament'}
          </span>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-medium text-gray-700">Verse Text</h2>
            <button
              onClick={handleFetchTexts}
              disabled={fetchingTexts}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {fetchingTexts ? 'Fetching...' : verseTexts.length > 0 ? 'Refresh' : 'Fetch Text'}
            </button>
          </div>

          {verseTexts.length > 0 ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {verseTexts.map((vt) => (
                  <button
                    key={vt.version}
                    onClick={() => setSelectedVersion(vt.version)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedVersion === vt.version
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {vt.version_name || VERSION_NAMES[vt.version] || vt.version}
                  </button>
                ))}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed italic">
                  {verseTexts.find((vt) => vt.version === selectedVersion)?.text || 'Select a version'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Click "Fetch Text" to load the verse text from Bible API.
            </p>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-2">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {verse.categories.length > 0 ? (
              verse.categories.map((category) => (
                <Link key={category.id} to={`/categories/${category.id}`}>
                  <CategoryTag category={category} />
                </Link>
              ))
            ) : (
              <span className="text-gray-500 text-sm">No categories assigned</span>
            )}
          </div>
        </div>

        {verse.notes && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Notes</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{verse.notes}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-medium text-gray-700">Cross-References</h2>
            <button
              onClick={() => setShowReferenceForm(!showReferenceForm)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showReferenceForm ? 'Cancel' : '+ Add Reference'}
            </button>
          </div>

          {showReferenceForm && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <div className="flex gap-2">
                <select
                  value={selectedVerseId}
                  onChange={(e) => setSelectedVerseId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a verse to reference...</option>
                  {allVerses
                    .filter((v) => v.id !== verse.id)
                    .filter((v) => !verse.referenced_verses?.some((ref) => ref.id === v.id))
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.reference}
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleAddReference}
                  disabled={!selectedVerseId || addingReference}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {addingReference ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          )}

          {verse.referenced_verses && verse.referenced_verses.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">This verse references:</p>
              <ul className="space-y-1">
                {verse.referenced_verses.map((ref) => (
                  <li key={ref.id} className="flex items-center justify-between group">
                    <Link
                      to={`/verses/${ref.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {ref.reference}
                    </Link>
                    <button
                      onClick={() => handleRemoveReference(ref.id)}
                      className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove reference"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No cross-references added yet.</p>
          )}
        </div>

        {verse.referencing_verses && verse.referencing_verses.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Referenced By</h2>
            <p className="text-xs text-gray-500 mb-2">Other verses that reference this one:</p>
            <ul className="space-y-1">
              {verse.referencing_verses.map((ref) => (
                <li key={ref.id}>
                  <Link
                    to={`/verses/${ref.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {ref.reference}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <Link to="/verses" className="text-blue-600 hover:text-blue-800">
            &larr; Back to all verses
          </Link>
        </div>
      </div>
    </div>
  );
}
