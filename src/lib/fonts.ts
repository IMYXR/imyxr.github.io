import localFont from 'next/font/local';

/**
 * Roboto Condensed (SIL Open Font License, see src/fonts/), in the two weights the
 * institution wordmark is set in. It stands in for Univers Condensed, the typeface of
 * the NC State wordmark, which is commercial and cannot be shipped with the site.
 *
 * The files are bundled with the site, so nothing is requested from a font service.
 */
export const wordmarkFont = localFont({
  src: [
    { path: '../fonts/roboto-condensed-latin-300.woff2', weight: '300', style: 'normal' },
    { path: '../fonts/roboto-condensed-latin-800.woff2', weight: '800', style: 'normal' },
  ],
  display: 'swap',
  fallback: ['Arial Narrow', 'Arial', 'sans-serif'],
});
