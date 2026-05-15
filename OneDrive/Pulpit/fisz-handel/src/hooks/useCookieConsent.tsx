import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

export type CookieCategory = 'necessary' | 'analytics' | 'marketing' | 'preferences';

export type ConsentState = Record<CookieCategory, boolean>;

export type StoredConsent = {
  version: number;
  timestamp: string;
  consent: ConsentState;
};

const STORAGE_KEY = 'ufisza_cookie_consent';
const CONSENT_VERSION = 1;

const DEFAULT_CONSENT: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

type Ctx = {
  consent: ConsentState;
  hasDecided: boolean;
  showBanner: boolean;
  showSettings: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePartial: (next: ConsentState) => void;
  openSettings: () => void;
  closeSettings: () => void;
  reopenBanner: () => void;
};

const CookieConsentContext = createContext<Ctx | null>(null);

const readStored = (): StoredConsent | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch { return null; }
};

const persist = (consent: ConsentState) => {
  const payload: StoredConsent = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    consent: { ...consent, necessary: true },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: payload }));
};

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT);
  const [hasDecided, setHasDecided] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setConsent(stored.consent);
      setHasDecided(true);
    } else {
      // Slight delay so banner doesn't flash before page paints
      const t = setTimeout(() => setShowBanner(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  const acceptAll = useCallback(() => {
    const next: ConsentState = { necessary: true, analytics: true, marketing: true, preferences: true };
    setConsent(next); persist(next); setHasDecided(true); setShowBanner(false); setShowSettings(false);
  }, []);

  const rejectAll = useCallback(() => {
    const next: ConsentState = { ...DEFAULT_CONSENT };
    setConsent(next); persist(next); setHasDecided(true); setShowBanner(false); setShowSettings(false);
  }, []);

  const savePartial = useCallback((next: ConsentState) => {
    const sanitized: ConsentState = { ...next, necessary: true };
    setConsent(sanitized); persist(sanitized); setHasDecided(true); setShowBanner(false); setShowSettings(false);
  }, []);

  return (
    <CookieConsentContext.Provider value={{
      consent, hasDecided, showBanner, showSettings,
      acceptAll, rejectAll, savePartial,
      openSettings: () => setShowSettings(true),
      closeSettings: () => setShowSettings(false),
      reopenBanner: () => { setShowSettings(true); },
    }}>
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider');
  return ctx;
};