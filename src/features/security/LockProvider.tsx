import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { hasPin } from './lock';

type Status = 'checking' | 'locked' | 'unlocked';

interface LockContextValue {
  status: Status;
  pinSet: boolean;
  /** Call after a successful PIN or fingerprint check. */
  unlock: () => void;
  /** Lock the app again (requires PIN / biometrics). No-op if no PIN is set. */
  lock: () => void;
  /** Re-read whether a PIN exists (after setting or removing it). */
  refresh: () => Promise<void>;
  /** Tell the provider a system prompt (fingerprint) is open, so it doesn't count as leaving the app. */
  setPrompting: (open: boolean) => void;
}

const LockContext = createContext<LockContextValue | null>(null);

/** Lock again when the app has been in the background longer than this. */
const GRACE_MS = 15_000;

export function LockProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('checking');
  const [pinSet, setPinSet] = useState(false);
  const leftAt = useRef<number | null>(null);
  const prompting = useRef(false);
  const pinSetRef = useRef(false);

  const refresh = useCallback(async () => {
    const has = await hasPin();
    pinSetRef.current = has;
    setPinSet(has);
    setStatus((s) => (!has ? 'unlocked' : s === 'checking' ? 'locked' : s));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (prompting.current) return;
      if (next === 'background') leftAt.current = Date.now();
      if (next === 'active' && leftAt.current !== null) {
        const away = Date.now() - leftAt.current;
        leftAt.current = null;
        if (pinSetRef.current && away > GRACE_MS) setStatus('locked');
      }
    });
    return () => sub.remove();
  }, []);

  const value = useMemo<LockContextValue>(
    () => ({
      status,
      pinSet,
      unlock: () => setStatus('unlocked'),
      lock: () => {
        if (pinSetRef.current) setStatus('locked');
      },
      refresh,
      setPrompting: (open) => {
        prompting.current = open;
      },
    }),
    [status, pinSet, refresh],
  );

  return <LockContext.Provider value={value}>{children}</LockContext.Provider>;
}

export function useLock(): LockContextValue {
  const ctx = useContext(LockContext);
  if (!ctx) throw new Error('useLock must be used inside <LockProvider>');
  return ctx;
}
