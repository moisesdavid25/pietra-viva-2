/**
 * sessionSecurity.ts
 *
 * Handles:
 *  - Session fingerprinting (per-device random ID in localStorage)
 *  - Session registration on login + concurrent-session enforcement
 *  - Session cleanup on logout
 *  - Immutable auth event logging
 */

import db from '../db';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Max simultaneous sessions per user. Exceeding this revokes all other sessions. */
const MAX_SESSIONS = 5;
const SESSION_KEY  = 'leomenu_session_fp';

// ── Device helpers ────────────────────────────────────────────────────────────

/** Returns a stable per-device fingerprint (random UUID stored in localStorage). */
export function getSessionFingerprint(): string {
  let fp = localStorage.getItem(SESSION_KEY);
  if (!fp) {
    fp = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_KEY, fp);
  }
  return fp;
}

/** Returns a human-readable device label from the User-Agent. */
function getDeviceLabel(): string {
  const ua  = navigator.userAgent;
  const browser = ua.includes('Edg')    ? 'Edge'
    : ua.includes('Chrome')             ? 'Chrome'
    : ua.includes('Firefox')            ? 'Firefox'
    : ua.includes('Safari')             ? 'Safari'
    : 'Browser';
  const os  = /iPhone|iPad/.test(ua)    ? 'iOS'
    : ua.includes('Android')            ? 'Android'
    : ua.includes('Windows')            ? 'Windows'
    : ua.includes('Mac')                ? 'Mac'
    : ua.includes('Linux')              ? 'Linux'
    : 'Dispositivo';
  return `${browser} su ${os}`;
}

// ── Session registration ──────────────────────────────────────────────────────

/**
 * Called right after a successful login.
 * 1. Upserts the current session in user_sessions.
 * 2. If total sessions > MAX_SESSIONS, revokes all others and cleans them up.
 * Returns true if other sessions were revoked (caller can show a notification).
 */
export async function registerSession(userId: string): Promise<boolean> {
  try {
    const fp    = getSessionFingerprint();
    const label = getDeviceLabel();

    // Upsert current session
    await db.from('user_sessions').upsert({
      user_id:             userId,
      session_fingerprint: fp,
      device_label:        label,
      last_active_at:      new Date().toISOString(),
    }, { onConflict: 'user_id,session_fingerprint' });

    // Count all sessions for this user
    const { data: sessions } = await db
      .from('user_sessions')
      .select('id, session_fingerprint, last_active_at')
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false });

    if (!sessions || sessions.length <= MAX_SESSIONS) return false;

    // Too many sessions → revoke all others (Supabase invalidates their JWTs)
    await db.auth.signOut({ scope: 'others' });

    // Delete all other session records from our table
    const otherIds = sessions
      .filter(s => s.session_fingerprint !== fp)
      .map(s => s.id);
    if (otherIds.length > 0) {
      await db.from('user_sessions').delete().in('id', otherIds);
    }

    await logAuthEvent(userId, 'session_revoked', {
      reason: 'max_sessions_exceeded',
      revoked: otherIds.length,
    });

    return true; // caller should notify the user
  } catch (err) {
    // Non-fatal — auth flow continues regardless
    console.warn('[sessionSecurity] registerSession error:', err);
    return false;
  }
}

/**
 * Called on logout. Removes the current device's session record.
 */
export async function unregisterSession(userId: string): Promise<void> {
  try {
    const fp = getSessionFingerprint();
    await db
      .from('user_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('session_fingerprint', fp);
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Non-fatal
  }
}

/**
 * Updates last_active_at for the current session (call periodically or on focus).
 */
export async function touchSession(userId: string): Promise<void> {
  try {
    const fp = getSessionFingerprint();
    await db
      .from('user_sessions')
      .update({ last_active_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('session_fingerprint', fp);
  } catch {
    // Non-fatal
  }
}

// ── Audit log ─────────────────────────────────────────────────────────────────

export type AuthEventType =
  | 'login' | 'logout' | 'login_failed'
  | 'password_changed' | 'email_changed'
  | 'session_revoked' | 'account_deleted';

/**
 * Appends an immutable event to auth_events.
 * Always non-throwing — never breaks the caller's flow.
 */
export async function logAuthEvent(
  userId: string | null,
  eventType: AuthEventType,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await db.from('auth_events').insert({
      user_id:        userId,
      event_type:     eventType,
      user_agent_hint: navigator.userAgent.slice(0, 120),
      metadata:       metadata ?? {},
    });
  } catch {
    // Non-fatal — log failures must never break authentication
  }
}

// ── Session list (for SettingsManager) ───────────────────────────────────────

export interface ActiveSession {
  id: string;
  device_label: string | null;
  created_at: string;
  last_active_at: string;
  isCurrent: boolean;
}

/** Returns all active sessions for the current user. */
export async function listActiveSessions(userId: string): Promise<ActiveSession[]> {
  try {
    const fp = getSessionFingerprint();
    const { data } = await db
      .from('user_sessions')
      .select('id, device_label, created_at, last_active_at, session_fingerprint')
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false });

    return (data || []).map(s => ({
      id:             s.id,
      device_label:   s.device_label,
      created_at:     s.created_at,
      last_active_at: s.last_active_at,
      isCurrent:      s.session_fingerprint === fp,
    }));
  } catch {
    return [];
  }
}

/** Revokes all sessions except the current one. */
export async function revokeAllOtherSessions(userId: string): Promise<void> {
  const fp = getSessionFingerprint();
  await db.auth.signOut({ scope: 'others' });
  await db
    .from('user_sessions')
    .delete()
    .eq('user_id', userId)
    .neq('session_fingerprint', fp);
  await logAuthEvent(userId, 'session_revoked', { reason: 'manual_revoke_all' });
}
