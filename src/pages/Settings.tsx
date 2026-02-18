import { useEffect, useState } from 'react';
import { getVerseTextStatus, batchFetchVerseTexts } from '../api/client';
import type { ProviderStatus } from '../api/client';
import { VERSIONS } from '../constants';
import { usePreferredVersion } from '../contexts/PreferredVersionContext';

export default function Settings() {
  const { preferredVersion, setPreferredVersion } = usePreferredVersion();
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [totalVerses, setTotalVerses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchingVersions, setFetchingVersions] = useState<Set<string>>(new Set());

  const loadStatus = () => {
    getVerseTextStatus()
      .then((res) => {
        setProviders(res.data.providers);
        setTotalVerses(res.data.total_verses);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleFetch = async (version: string) => {
    setFetchingVersions((prev) => new Set(prev).add(version));
    try {
      await batchFetchVerseTexts(version);
      loadStatus();
    } finally {
      setFetchingVersions((prev) => {
        const next = new Set(prev);
        next.delete(version);
        return next;
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Settings</h1>

      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-semibold text-slate-700 mb-3">Default Translation</h2>
        <p className="text-sm text-gray-500 mb-3">
          This translation will be shown by default on verse and progression pages.
        </p>
        <select
          value={preferredVersion}
          onChange={(e) => setPreferredVersion(e.target.value)}
          className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {VERSIONS.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">
          Bible API Connections
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({totalVerses} verses in database)
          </span>
        </h2>

        <div className="space-y-4">
          {providers.map((provider) => (
            <div key={provider.name} className="bg-white rounded-lg shadow-md p-5">
              <h3 className="text-md font-semibold text-slate-800 mb-3">{provider.name}</h3>
              <div className="space-y-2">
                {provider.versions.map((version) => {
                  const isFetching = fetchingVersions.has(version.code);
                  const allFetched = version.missing_count === 0;

                  return (
                    <div
                      key={version.code}
                      className="flex items-center justify-between py-2 px-3 rounded-md bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-800">{version.name}</span>
                        {allFetched ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            All fetched
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            {version.missing_count} missing
                          </span>
                        )}
                      </div>

                      {allFetched ? (
                        <span className="text-green-600" title="All passages fetched">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleFetch(version.code)}
                          disabled={isFetching}
                          className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {isFetching && (
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          )}
                          {isFetching ? 'Fetching...' : 'Fetch Passages'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
