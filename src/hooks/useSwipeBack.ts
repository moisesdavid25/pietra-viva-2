import { useEffect, useRef, useCallback } from 'react';

/**
 * Intercepts mobile swipe-back gestures while inside an internal sub-view.
 *
 * How it works:
 * - When `isActive` becomes true, pushes a history entry (same URL, different state).
 * - When the user swipes back (popstate fires), calls `onBack` instead of
 *   navigating to the previous URL.
 * - When `isActive` becomes false externally (e.g. tab switch), automatically
 *   removes the pushed history entry.
 *
 * Returns `closeViaUI` — call this from UI back buttons so history stays in sync.
 *
 * Usage:
 *   const { closeViaUI } = useSwipeBack(subScreen !== null, () => setSubScreen(null));
 *   // In the back button: onClick={closeViaUI}
 */
export function useSwipeBack(isActive: boolean, onBack: () => void) {
    const pushedRef = useRef(false);
    const skipNextRef = useRef(false);
    // Keep onBack in a ref so the popstate handler is never stale
    const onBackRef = useRef(onBack);
    onBackRef.current = onBack;

    // Push / remove history entry when isActive changes
    useEffect(() => {
        if (isActive && !pushedRef.current) {
            window.history.pushState({ __leoBack: true }, '');
            pushedRef.current = true;
        } else if (!isActive && pushedRef.current) {
            // Closed externally (e.g. tab switch) — clean up the history entry
            pushedRef.current = false;
            skipNextRef.current = true;
            window.history.back();
        }
    }, [isActive]);

    // Global popstate listener (swipe-back gesture)
    useEffect(() => {
        const handler = () => {
            if (skipNextRef.current) {
                skipNextRef.current = false;
                return;
            }
            if (pushedRef.current) {
                pushedRef.current = false;
                onBackRef.current();
            }
        };
        window.addEventListener('popstate', handler);
        return () => window.removeEventListener('popstate', handler);
    }, []);

    // Use this for UI back buttons to keep history in sync
    const closeViaUI = useCallback(() => {
        if (pushedRef.current) {
            pushedRef.current = false;
            skipNextRef.current = true;
            window.history.back(); // remove our pushed entry
        }
        onBackRef.current();
    }, []);

    return { closeViaUI };
}
