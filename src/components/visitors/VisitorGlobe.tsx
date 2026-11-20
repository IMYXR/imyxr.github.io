'use client';

import { useEffect, useRef, useState } from 'react';
import type { GlobeInstance } from 'globe.gl';
import { useMessages } from '@/lib/i18n/useMessages';
import {
  fetchLatestVisitTime,
  fetchVisitorPoints,
  readCachedPoints,
  writeCachedPoints,
  type VisitorMapSettings,
  type VisitorPoint,
} from '@/lib/visitors';
import { VISIT_RECORDED_EVENT } from '@/components/visitors/VisitorTracker';

const POLL_INTERVAL_MS = 30_000;
const GLOBE_HEIGHT = 280;

/** Tooltip built with textContent: city and country come from the database, so they are never parsed as HTML. */
function buildPointLabel(point: VisitorPoint, visitsLabel: string): HTMLElement {
  const box = document.createElement('div');
  box.className = 'visitor-globe-label';

  const place = document.createElement('strong');
  place.textContent = [point.city, point.country].filter(Boolean).join(', ') || 'Unknown';

  const visits = document.createElement('span');
  visits.textContent = `${visitsLabel}: ${point.visits.toLocaleString('en-US')}`;

  box.append(place, visits);
  return box;
}

/**
 * A bare rotating globe marking where recent visitors came from: no frame, no
 * background, so it sits directly on the page. Hover a bar for the place and count.
 */
export default function VisitorGlobe({ settings }: { settings: VisitorMapSettings }) {
  const messages = useMessages();
  const visitsLabel = messages.visitors.visits;

  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const visitsLabelRef = useRef(visitsLabel);
  useEffect(() => {
    visitsLabelRef.current = visitsLabel;
  }, [visitsLabel]);

  const [nearViewport, setNearViewport] = useState(false);
  const [globeReady, setGlobeReady] = useState(false);
  const [globeFailed, setGlobeFailed] = useState(false);
  const [points, setPoints] = useState<VisitorPoint[] | null>(null);

  // Nothing heavy happens until the globe is about to scroll into view.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Visitor data: initial load, a light poll for new visits, and recovery after the database was unreachable.
  useEffect(() => {
    if (!nearViewport) return;

    let cancelled = false;
    let lastSeen: number | null | undefined;
    let wasOffline = false;

    const load = async () => {
      try {
        const next = await fetchVisitorPoints(settings);
        if (cancelled) return;
        writeCachedPoints(next);
        setPoints(next);
        wasOffline = false;
      } catch {
        if (cancelled) return;
        // Paused or unreachable database: fall back to what this browser saw last time.
        setPoints((current) => current ?? readCachedPoints());
        wasOffline = true;
      }
    };

    const poll = async () => {
      if (document.hidden) return;
      try {
        const latest = await fetchLatestVisitTime(settings);
        if (cancelled) return;
        const changed = lastSeen !== undefined && latest !== lastSeen;
        lastSeen = latest;
        if (changed || wasOffline) await load();
      } catch {
        wasOffline = true;
      }
    };

    const onVisitRecorded = () => {
      void load();
    };

    void load();
    const timer = window.setInterval(poll, POLL_INTERVAL_MS);
    window.addEventListener(VISIT_RECORDED_EVENT, onVisitRecorded);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener(VISIT_RECORDED_EVENT, onVisitRecorded);
    };
  }, [nearViewport, settings]);

  // The globe itself. three.js is fetched on demand, so it costs nothing on first paint.
  useEffect(() => {
    if (!nearViewport) return;
    const element = containerRef.current;
    if (!element) return;

    let disposed = false;
    let globe: GlobeInstance | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let visibilityObserver: IntersectionObserver | null = null;

    import('globe.gl')
      .then(({ default: Globe }) => {
        if (disposed) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

        globe = new Globe(element, { rendererConfig: { antialias: true, alpha: true } })
          .backgroundColor('rgba(0,0,0,0)')
          .globeImageUrl('/globe/earth-blue-marble.jpg')
          .atmosphereColor('#60a5fa')
          .atmosphereAltitude(0.16)
          .pointsData([])
          .pointLat('lat')
          .pointLng('lng')
          .pointAltitude('size')
          .pointColor('color')
          .pointRadius(0.5)
          .pointsMerge(false)
          .pointLabel((point) => buildPointLabel(point as VisitorPoint, visitsLabelRef.current))
          .width(element.clientWidth)
          .height(GLOBE_HEIGHT);

        const controls = globe.controls();
        controls.autoRotate = !reduceMotion;
        controls.autoRotateSpeed = 0.5;
        controls.enableZoom = false;
        globe.pointOfView({ lat: 30, lng: -83, altitude: 1.7 }, 0);

        // On touch screens a drag should scroll the page, not get trapped spinning the globe.
        if (coarsePointer) {
          globe.enablePointerInteraction(false);
          element.style.pointerEvents = 'none';
        }

        resizeObserver = new ResizeObserver(() => {
          if (element.clientWidth > 0) globe?.width(element.clientWidth);
        });
        resizeObserver.observe(element);

        // Stop rendering frames while the globe is off screen.
        visibilityObserver = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) globe?.resumeAnimation();
          else globe?.pauseAnimation();
        });
        visibilityObserver.observe(element);

        globeRef.current = globe;
        setGlobeReady(true);
      })
      .catch(() => {
        // WebGL unavailable or the chunk failed to load: leave the space out entirely.
        if (!disposed) setGlobeFailed(true);
      });

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      globe?._destructor();
      globeRef.current = null;
      element.replaceChildren();
      element.style.pointerEvents = '';
      setGlobeReady(false);
    };
  }, [nearViewport]);

  useEffect(() => {
    if (!globeReady) return;
    globeRef.current?.pointsData(points ?? []);
  }, [globeReady, points]);

  if (globeFailed) return null;

  return (
    <div
      ref={containerRef}
      className="mb-6"
      style={{ height: GLOBE_HEIGHT }}
      role="img"
      aria-label={messages.visitors.globeLabel}
    />
  );
}
