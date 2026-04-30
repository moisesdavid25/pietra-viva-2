import { useState, useEffect, useCallback, useRef } from 'react';
import db from '../db';

const TIMEOUT_MS     = 30 * 60 * 1000; // 30 min → auto-logout
const WARN_BEFORE_MS =  5 * 60 * 1000; // 25 min → show warning
const THROTTLE_MS    = 30_000;          // reset at most once every 30 s (avoid mousemove spam)
const ACTIVITY_KEY   = 'leomenu_last_activity';

const WATCHED_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click',
];

export function useInactivityTimeout() {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);

  const logoutTimerRef    = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const warnTimerRef      = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const countdownRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastResetTimestamp = useRef<number>(0);

  const clearAll = useCallback(() => {
    if (logoutTimerRef.current)  clearTimeout (logoutTimerRef.current);
    if (warnTimerRef.current)    clearTimeout (warnTimerRef.current);
    if (countdownRef.current)    clearInterval(countdownRef.current);
  }, []);

  const doLogout = useCallback(async () => {
    clearAll();
    try { await db.auth.signOut(); } catch { /* ignore */ }
    // Preserve the return path so user lands back after re-login
    const returnTo = encodeURIComponent(window.location.pathname);
    window.location.href = `/login?motivo=sessione-scaduta&return=${returnTo}`;
  }, [clearAll]);

  const resetTimers = useCallback(() => {
    clearAll();
    setShowWarning(false);
    setSecondsLeft(300);
    localStorage.setItem(ACTIVITY_KEY, Date.now().toString());

    // ── Warning timer (fires at 25 min) ──────────────────────────────────
    warnTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      let secs = Math.floor(WARN_BEFORE_MS / 1000);
      setSecondsLeft(secs);
      countdownRef.current = setInterval(() => {
        secs -= 1;
        setSecondsLeft(secs);
        if (secs <= 0) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
        }
      }, 1_000);
    }, TIMEOUT_MS - WARN_BEFORE_MS);

    // ── Logout timer (fires at 30 min) ───────────────────────────────────
    logoutTimerRef.current = setTimeout(doLogout, TIMEOUT_MS);
  }, [clearAll, doLogout]);

  // Called from the warning modal "Rimani connesso" button
  const stayLoggedIn = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  useEffect(() => {
    // ── Throttled activity handler ────────────────────────────────────────
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastResetTimestamp.current > THROTTLE_MS) {
        lastResetTimestamp.current = now;
        resetTimers();
      }
    };

    // ── Cross-tab sync via localStorage ──────────────────────────────────
    // If another tab is active, reset this tab's timers too
    const handleStorageActivity = (e: StorageEvent) => {
      if (e.key === ACTIVITY_KEY && e.newValue) {
        const lastActivity = parseInt(e.newValue, 10);
        if (Date.now() - lastActivity < THROTTLE_MS * 2) {
          lastResetTimestamp.current = Date.now();
          resetTimers();
        }
      }
    };

    WATCHED_EVENTS.forEach(ev =>
      window.addEventListener(ev, handleActivity, { passive: true })
    );
    window.addEventListener('storage', handleStorageActivity);

    resetTimers(); // Start timers on mount

    return () => {
      WATCHED_EVENTS.forEach(ev =>
        window.removeEventListener(ev, handleActivity)
      );
      window.removeEventListener('storage', handleStorageActivity);
      clearAll();
    };
  }, [resetTimers, clearAll]);

  return { showWarning, secondsLeft, stayLoggedIn, doLogout };
}
