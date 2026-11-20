'use client';

import { useEffect } from 'react';
import { recordVisit, type VisitorMapSettings } from '@/lib/visitors';

/** Fired on window once this page load has been stored, so the globe can refresh. */
export const VISIT_RECORDED_EVENT = 'visitor-map:recorded';

// One row per page load: survives client-side navigation and React's double-invoked effects in development.
let attempted = false;

function isLocalHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local')
  );
}

/**
 * Logs the current visit. Mounted once in the root layout so every landing page counts,
 * not only the home page where the globe lives. Local development and automated
 * browsers are not recorded.
 */
export default function VisitorTracker({ settings }: { settings: VisitorMapSettings | null }) {
  useEffect(() => {
    if (!settings || attempted) return;
    attempted = true;

    if (isLocalHost(window.location.hostname) || navigator.webdriver) return;

    recordVisit(settings)
      .then((stored) => {
        if (stored) window.dispatchEvent(new Event(VISIT_RECORDED_EVENT));
      })
      .catch(() => {
        // Blocked lookup or paused database: nothing to record this time.
      });
  }, [settings]);

  return null;
}
