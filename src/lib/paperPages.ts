import { getConfig } from './config';
import { getPageConfig } from './content';
import type { BasePageConfig, PublicationPageConfig } from '@/types/page';

/**
 * Paper pages: for every publication whose `pdf` is a PDF file of ours, the site builds a
 * page that shows it inside the normal layout, at /<publications page>/<citation key>/.
 * The "PDF" buttons link there rather than to the bare file.
 */

export interface PublicationsPage {
  /** The page's name in content/ and its path segment: "publications". */
  slug: string;
  title: string;
  /** The BibTeX file it lists. */
  source: string;
}

/** The page that lists the publications: the first navigation entry of type "publication". */
export function getPublicationsPage(locale?: string): PublicationsPage | null {
  for (const item of getConfig(locale).navigation) {
    if (item.type !== 'page') continue;

    const page = getPageConfig<BasePageConfig>(item.target, locale);
    if (page?.type === 'publication') {
      return { slug: item.target, title: page.title, source: (page as PublicationPageConfig).source };
    }
  }
  return null;
}

/** Address of the paper page for the publication with the given citation key. */
export function paperPagePath(publicationsSlug: string, citationKey: string): string {
  return `/${publicationsSlug}/${encodeURIComponent(citationKey)}/`;
}
