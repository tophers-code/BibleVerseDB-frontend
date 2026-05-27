import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { getVerse, deleteVerse, getVerses, addVerseReference, removeVerseReference, getVerseTexts, fetchAllVerseTexts, getVerseText, deleteVerseText, type VerseTextResponse } from '../api/client';
import type { Verse } from '../types';
import CategoryTag from '../components/CategoryTag';
import Markdown from '../components/Markdown';
import { VERSIONS } from '../constants';
import { usePreferredVersion } from '../contexts/PreferredVersionContext';
import { useAuth } from '../contexts/AuthContext';

interface NavState {
  backPath?: string;
  backLabel?: string;
  verseIds?: number[];
}

export default function VerseDetail() {
  const { isAdmin } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as NavState) || {};
  const { preferredVersion } = usePreferredVersion();
  const [verse, setVerse] = useState<Verse | null>(null);
  const [allVerses, setAllVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerseId, setSelectedVerseId] = useState<string>('');
  const [addingReference, setAddingReference] = useState(false);
  const [showReferenceForm, setShowReferenceForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verseTexts, setVerseTexts] = useState<VerseTextResponse[]>([]);
  const [fetchingTexts, setFetchingTexts] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string>(preferredVersion);
  const [refreshingVersion, setRefreshingVersion] = useState<string | null>(null);

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

  const handleRefreshSingleVersion = async (version: string) => {
    if (!verse) return;

    setRefreshingVersion(version);
    setError(null);

    try {
      // Delete the cached version first if it exists
      const existing = verseTexts.find((vt) => vt.version === version);
      if (existing) {
        await deleteVerseText(verse.id, version);
      }

      // Fetch the (fresh) version
      const res = await getVerseText(verse.id, version);

      // Update the verseTexts array with the new text
      setVerseTexts((prev) => {
        const filtered = prev.filter((vt) => vt.version !== version);
        return [...filtered, { version: res.data.version, text: res.data.text, version_name: res.data.version_name }]
          .sort((a, b) => {
            const order = VERSIONS.map((v) => v.id);
            return order.indexOf(a.version) - order.indexOf(b.version);
          });
      });
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to refresh ${version}`);
    } finally {
      setRefreshingVersion(null);
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
          {isAdmin && (
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
          )}
        </div>

        <div className="mb-4">
          <span className="text-sm text-gray-500">
            {verse.bible_book.testament === 'old_testament' ? 'Old Testament' : 'New Testament'}
          </span>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-medium text-gray-700">Verse Text</h2>
            {isAdmin && (
              <button
                onClick={handleFetchTexts}
                disabled={fetchingTexts}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {fetchingTexts ? 'Fetching...' : verseTexts.length > 0 ? 'Refresh' : 'Fetch Text'}
              </button>
            )}
          </div>

          {verseTexts.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {VERSIONS.map((v) => {
                    const fetched = verseTexts.some((vt) => vt.version === v.id);
                    return (
                      <option key={v.id} value={v.id}>
                        {v.name}{!fetched ? ' (not fetched)' : ''}
                      </option>
                    );
                  })}
                </select>
                {isAdmin && (
                  <button
                    onClick={() => handleRefreshSingleVersion(selectedVersion)}
                    disabled={refreshingVersion === selectedVersion}
                    className="p-1.5 text-gray-500 hover:text-blue-600 disabled:opacity-50 border border-gray-300 rounded-md"
                    title="Refresh selected translation"
                  >
                    {refreshingVersion === selectedVersion ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                {verseTexts.find((vt) => vt.version === selectedVersion)?.text ? (
                  <p className="text-gray-800 leading-relaxed italic">
                    {verseTexts.find((vt) => vt.version === selectedVersion)!.text}
                  </p>
                ) : (
                  <p className="text-gray-400 text-sm italic">
                    This translation hasn't been fetched yet. Click the refresh button to fetch it.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Click "Fetch Text" to load the verse text from Bible API.
            </p>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-2">Study In</h2>
          {(() => {
            const versionMap: Record<string, string> = {
              'esv': 'ESV', 'nlt': 'NLT', 'niv': 'NIV', 'nasb': 'NASB',
              'csb': 'CSB', 'en-bsb': 'BSB', 'en-asv': 'ASV', 'en-web': 'WEB',
            };
            const v = versionMap[selectedVersion] ?? 'ESV';
            const ref = encodeURIComponent(verse.reference);

            // Logos uses OT book_order as-is (1–39); NT offset by +21 (Matthew 40 → 61, Romans 45 → 66)
            const logosBookNum = verse.bible_book.book_order <= 39
              ? verse.bible_book.book_order
              : verse.bible_book.book_order + 21;
            const logosVersionMap: Record<string, { bookId: string; refCode: string }> = {
              'esv':  { bookId: 'LLS%3A1.0.710',  refCode: 'esv' },
              'nlt':  { bookId: 'LLS%3A1.0.171',  refCode: 'nlt' },
              'niv':  { bookId: 'LLS%3ANIV2011',  refCode: 'niv' },
              'nasb': { bookId: 'LLS%3A1.0.71',   refCode: 'nasb95' },
              'csb':  { bookId: 'LLS%3ACSB',      refCode: 'csb2' },
            };
            const logosInfo = logosVersionMap[selectedVersion];
            const logosUrl = logosInfo
              ? `https://app.logos.com/books/${logosInfo.bookId}/references/bible%2B${logosInfo.refCode}.${logosBookNum}.${verse.chapter}.${verse.verse_start}`
              : `https://app.logos.com/search?query=${ref}`;

            const links = [
              {
                label: 'BibleGateway',
                url: `https://www.biblegateway.com/passage/?search=${ref}&version=${v}`,
                color: '#80250D',
              },
              {
                label: 'Blue Letter Bible',
                url: `https://www.blueletterbible.org/search/preSearch.cfm?Criteria=${ref}&t=${v}`,
                color: '#485B84',
              },
              {
                label: 'Logos',
                url: logosUrl,
                color: '#426AFA',
              },
            ];
            return (
              <div className="flex flex-wrap gap-2">
                {links.map(({ label, url, color }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ backgroundColor: color }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-white rounded-md transition-[filter] hover:brightness-90"
                  >
                    {label}
                    <svg className="w-3 h-3 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            );
          })()}
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-2">Categories</h2>
          {verse.categories.length > 0 ? (
            <div className="space-y-2">
              {verse.categories.map((category) => (
                <div key={category.id} className="flex items-start gap-2">
                  <Link to={`/categories/${category.id}`}>
                    <CategoryTag category={category} showTooltip={false} />
                  </Link>
                  {category.category_note && (
                    <span className="text-sm text-gray-600 italic">— {category.category_note}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-gray-500 text-sm">No categories assigned</span>
          )}
        </div>

        {verse.tags && verse.tags.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {verse.tags.map((tag) => (
                <Link
                  key={tag.id}
                  to={`/tags/${tag.id}`}
                  className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm hover:bg-slate-200 hover:text-slate-900 transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {verse.notes && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Notes</h2>
            <Markdown>{verse.notes}</Markdown>
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
            {isAdmin && (
              <button
                onClick={() => setShowReferenceForm(!showReferenceForm)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showReferenceForm ? 'Cancel' : '+ Add Reference'}
              </button>
            )}
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
                    {isAdmin && (
                      <button
                        onClick={() => handleRemoveReference(ref.id)}
                        className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove reference"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
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

        <div className="pt-4 border-t border-gray-200 flex items-center justify-between gap-4">
          <Link
            to={navState.backPath ?? '/verses'}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            &larr; {navState.backLabel ? `Back to "${navState.backLabel}"` : 'Back to all verses'}
          </Link>

          {navState.verseIds && navState.verseIds.length > 1 && (() => {
            const currentIndex = navState.verseIds!.indexOf(parseInt(id!));
            const prevId = currentIndex > 0 ? navState.verseIds![currentIndex - 1] : null;
            const nextId = currentIndex < navState.verseIds!.length - 1 ? navState.verseIds![currentIndex + 1] : null;
            return (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-400">{currentIndex + 1} / {navState.verseIds!.length}</span>
                <Link
                  to={prevId ? `/verses/${prevId}` : '#'}
                  state={navState}
                  aria-disabled={!prevId}
                  className={prevId ? 'text-blue-600 hover:text-blue-800' : 'text-gray-300 pointer-events-none'}
                >
                  ← Prev
                </Link>
                <Link
                  to={nextId ? `/verses/${nextId}` : '#'}
                  state={navState}
                  aria-disabled={!nextId}
                  className={nextId ? 'text-blue-600 hover:text-blue-800' : 'text-gray-300 pointer-events-none'}
                >
                  Next →
                </Link>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
