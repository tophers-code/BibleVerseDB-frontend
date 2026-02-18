import { createContext, useContext, useState, type ReactNode } from 'react';
import { DEFAULT_VERSION } from '../constants';

const STORAGE_KEY = 'preferredBibleVersion';

function getStoredVersion(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_VERSION;
}

interface PreferredVersionContextValue {
  preferredVersion: string;
  setPreferredVersion: (version: string) => void;
}

const PreferredVersionContext = createContext<PreferredVersionContextValue>({
  preferredVersion: DEFAULT_VERSION,
  setPreferredVersion: () => {},
});

export function PreferredVersionProvider({ children }: { children: ReactNode }) {
  const [preferredVersion, setPreferredVersionState] = useState(getStoredVersion);

  const setPreferredVersion = (version: string) => {
    localStorage.setItem(STORAGE_KEY, version);
    setPreferredVersionState(version);
  };

  return (
    <PreferredVersionContext.Provider value={{ preferredVersion, setPreferredVersion }}>
      {children}
    </PreferredVersionContext.Provider>
  );
}

export function usePreferredVersion() {
  return useContext(PreferredVersionContext);
}
