import fs from 'fs';
import path from 'path';
import { Publication, PublicationType, ResearchArea, VenueIcon } from '@/types/publication';
import { getConfig } from './config';
import { getRuntimeI18nConfig } from './i18n/config';
import { parseBibTeXInline } from './bibtexInline';
import { getPublicationsPage, paperPagePath } from './paperPages';
import { readPublicImageSize } from './publicImage';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bibtexParse = require('@orcid/bibtex-parse-js');

// Site-specific fields in publications.bib that are not part of the citation itself.
const CUSTOM_FIELDS = ['selected', 'preview', 'description', 'keywords', 'code', 'pdf', 'award', 'venue_icon', 'paper_type'];

/** Where a bare file name in `venue_icon` is looked up, as a path under public/. */
const VENUE_ICON_DIR = '/figures/Conference Icon';
/** A logo "name.ext" is swapped for "name-dark.<one of these>" on the dark theme, if that file exists. */
const DARK_ICON_EXTENSIONS = ['.svg', '.webp', '.png'];

// Map BibTeX entry types to our publication types
const typeMapping: Record<string, PublicationType> = {
  article: 'journal',
  inproceedings: 'conference',
  conference: 'conference',
  incollection: 'book-chapter',
  book: 'book',
  phdthesis: 'thesis',
  mastersthesis: 'thesis',
  techreport: 'technical-report',
  unpublished: 'preprint',
  misc: 'preprint',
};

// Convert month names to numbers
const monthMapping: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, september: 9, sept: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

/**
 * Checks a `preview` value and reads the image's pixel size from public/, so the page can
 * show the whole figure at its own proportions instead of cropping it into a fixed box.
 * A preview the browser could not display (a PDF) is dropped with a build warning.
 */
function resolvePreview(preview?: string): { preview?: string; width?: number; height?: number } {
  if (!preview) return {};
  if (/^https?:\/\//.test(preview)) return { preview };

  if (/\.pdf$/i.test(preview)) {
    console.warn(
      `publications.bib: preview "${preview}" is a PDF, which browsers cannot show as an image. ` +
      'Export the figure as PNG, JPG or WebP and point "preview" at that file.'
    );
    return {};
  }

  // Same rule as previewSrc() on the client: a bare filename lives in public/papers/.
  const size = readPublicImageSize(preview.startsWith('/') ? preview : `/papers/${preview}`);
  if (!size) {
    console.warn(`publications.bib: could not read preview image "${preview}" (missing file or unknown format).`);
    return { preview };
  }
  return { preview, ...size };
}

/** The dark-theme version of a logo: the file beside it named "<name>-dark", in any supported format. */
function findDarkIcon(urlPath: string): string | undefined {
  const base = urlPath.slice(0, urlPath.length - path.extname(urlPath).length);
  return DARK_ICON_EXTENSIONS
    .map(extension => `${base}-dark${extension}`)
    .find(candidate => fs.existsSync(path.join(process.cwd(), 'public', candidate)));
}

/**
 * Turns a `venue_icon` value (one logo, or several separated by commas) into image URLs
 * with their pixel sizes. A logo that cannot be shown, because the file is missing or is a
 * PDF, is left out with a build warning; an entry left with no logo shows the venue's name.
 */
function resolveVenueIcons(value?: string): VenueIcon[] | undefined {
  const names = (value || '').replace(/[{}]/g, '').split(',').map(name => name.trim()).filter(Boolean);

  const icons = names.flatMap((name): VenueIcon[] => {
    if (/^https?:\/\//.test(name)) return [{ src: name }];

    if (/\.pdf$/i.test(name)) {
      console.warn(
        `publications.bib: venue icon "${name}" is a PDF, which browsers cannot show as an image. ` +
        'Export the logo as SVG, PNG or WebP and point "venue_icon" at that file.'
      );
      return [];
    }

    const urlPath = name.startsWith('/') ? name : `${VENUE_ICON_DIR}/${name}`;
    const size = readPublicImageSize(urlPath);
    if (!size) {
      console.warn(`publications.bib: could not read venue icon "${name}" (looked for public${urlPath}).`);
      return [];
    }
    const darkPath = findDarkIcon(urlPath);
    // Encoded because the path may contain spaces, as the default folder's name does.
    return [{ src: encodeURI(urlPath), ...(darkPath ? { darkSrc: encodeURI(darkPath) } : {}), ...size }];
  });

  return icons.length > 0 ? icons : undefined;
}

/**
 * The paper page for an entry, if it gets one: its `pdf` has to be a PDF file under
 * public/ (an address elsewhere, or another kind of file, is simply linked to), and the
 * entry needs a citation key to name the page by.
 */
function resolvePaperPage(pdf: string | undefined, citationKey: string, publicationsSlug?: string): string | undefined {
  if (!pdf || !citationKey || !publicationsSlug) return undefined;
  if (!pdf.startsWith('/') || !/\.pdf$/i.test(pdf)) return undefined;

  if (!fs.existsSync(path.join(process.cwd(), 'public', pdf))) {
    console.warn(`publications.bib: pdf "${pdf}" was not found (looked for public${pdf}).`);
    return undefined;
  }
  return paperPagePath(publicationsSlug, citationKey);
}

/**
 * The standard `url` field, which becomes the "Link" button (the paper at its publisher's).
 * Anything that is not a web address is not offered as a link, with a build warning.
 */
function resolveUrl(url?: string): string | undefined {
  const value = url?.trim();
  if (!value) return undefined;

  if (!/^https?:\/\//i.test(value)) {
    console.warn(`publications.bib: url "${value}" is not a web address (it should start with https://), so it gets no "Link" button.`);
    return undefined;
  }
  return value;
}

/** A field's value whatever the capitals in its name: arXiv writes "archivePrefix". */
function readField(tags: Record<string, string>, name: string): string | undefined {
  const key = Object.keys(tags).find(candidate => candidate.toLowerCase() === name);
  return key === undefined ? undefined : tags[key];
}

/**
 * Where a preprint is to be found. An entry as arXiv exports it (@misc, with `eprint` and
 * `archivePrefix` in place of a journal) names no venue, so one is put together from those
 * fields the way citation styles print it: "arXiv preprint arXiv:2610.07477".
 */
function preprintVenue(tags: Record<string, string>): string {
  const eprint = cleanBibTeXString(readField(tags, 'eprint')).trim();
  if (!eprint) return '';

  const archive = cleanBibTeXString(readField(tags, 'archiveprefix')).trim() || 'arXiv';
  return `${archive} preprint ${archive}:${eprint}`;
}

export function parseBibTeX(bibtexContent: string, locale?: string): Publication[] {
  const highlightNames = getHighlightNames(locale);
  const publicationsSlug = getPublicationsPage(locale)?.slug;
  const entries = bibtexParse.toJSON(bibtexContent);

  return entries.map((entry: { entryType: string; citationKey: string; entryTags: Record<string, string> }, index: number) => {
    const tags = entry.entryTags;

    // Parse authors
    const authors = parseAuthors(tags.author || '', highlightNames);

    // Parse year and month
    const year = parseInt(tags.year) || new Date().getFullYear();
    const monthStr = tags.month?.toLowerCase() || '';
    const month = monthMapping[monthStr] || (parseInt(monthStr) || undefined);

    // Determine type
    const type = typeMapping[entry.entryType.toLowerCase()] || 'journal';

    // Parse tags/keywords
    const keywords = tags.keywords?.split(',').map((k: string) => k.trim()) || [];

    // Parse selected field (convert string to boolean)
    const selected = tags.selected === 'true' || tags.selected === 'yes';

    // Parse preview field (remove braces if present)
    const { preview, width: previewWidth, height: previewHeight } = resolvePreview(
      tags.preview?.replace(/[{}]/g, '').trim()
    );
    const title = parseBibTeXInline(tags.title || 'Untitled');
    const award = cleanBibTeXString(tags.award).trim();
    const pdfUrl = tags.pdf?.trim() || undefined;

    // Create publication object
    const publication: Publication = {
      id: entry.citationKey || tags.id || `pub-${Date.now()}-${index}`,
      title: title.plainText || 'Untitled',
      titleNodes: title.nodes,
      authors,
      year,
      month: monthMapping[tags.month?.toLowerCase()] ? String(month) : tags.month,
      type,
      status: 'published',
      tags: keywords,
      keywords,
      researchArea: detectResearchArea(tags.title, keywords),

      // Optional fields
      // The venue's name. A preprint has neither a journal nor a proceedings volume.
      journal: cleanBibTeXString(tags.journal) || (tags.booktitle ? '' : preprintVenue(tags)),
      conference: cleanBibTeXString(tags.booktitle),
      volume: tags.volume,
      issue: tags.number,
      pages: tags.pages,
      doi: tags.doi,
      url: resolveUrl(tags.url),
      code: tags.code,
      pdfUrl,
      paperPage: resolvePaperPage(pdfUrl, entry.citationKey, publicationsSlug),
      awards: award ? [award] : undefined,
      abstract: cleanBibTeXString(tags.abstract),
      description: cleanBibTeXString(tags.description || tags.note),
      selected,
      preview,
      previewWidth,
      previewHeight,
      venueIcons: resolveVenueIcons(tags.venue_icon),
      paperType: cleanBibTeXString(tags.paper_type).trim() || undefined,

      // Store original BibTeX (excluding custom fields)
      bibtex: reconstructBibTeX(entry, CUSTOM_FIELDS),
    };

    // Clean up undefined fields
    Object.keys(publication).forEach(key => {
      if (publication[key as keyof Publication] === undefined) {
        delete publication[key as keyof Publication];
      }
    });

    return publication;
  }).sort((a: Publication, b: Publication) => {
    // Sort by year (descending), then by month if available
    if (b.year !== a.year) return b.year - a.year;

    // For month comparison, treat missing months as January (1) to ensure they appear last within the year
    const monthA = typeof a.month === 'string' ?
      (monthMapping[a.month.toLowerCase()] || parseInt(a.month) || 1) :
      (a.month || 1);
    const monthB = typeof b.month === 'string' ?
      (monthMapping[b.month.toLowerCase()] || parseInt(b.month) || 1) :
      (b.month || 1);

    // Sort by month descending (December to January)
    return monthB - monthA;
  });
}

function getHighlightNames(locale?: string): string[] {
  const names = new Set<string>();
  const baseConfig = getConfig();
  const runtimeI18n = getRuntimeI18nConfig(baseConfig.i18n);

  const addName = (name?: string) => {
    const cleaned = cleanBibTeXString(name).trim();
    if (cleaned) {
      names.add(cleaned);
    }
  };

  addName(baseConfig.author.name);

  if (runtimeI18n.enabled) {
    runtimeI18n.locales.forEach((localeCode) => {
      const localizedConfig = getConfig(localeCode);
      addName(localizedConfig.author.name);
    });
  }

  if (locale) {
    const currentLocaleConfig = getConfig(locale);
    addName(currentLocaleConfig.author.name);
  }

  return Array.from(names);
}

function normalizePersonNameForMatch(name: string): string {
  return name.toLowerCase().replace(/[\s.,'’`"()\-_/]/g, '');
}

function buildNameVariants(name: string): Set<string> {
  const variants = new Set<string>();
  const cleaned = cleanBibTeXString(name).toLowerCase().trim();

  if (!cleaned) {
    return variants;
  }

  variants.add(cleaned);

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 2) {
    variants.add(`${parts[1]} ${parts[0]}`);
  }

  return variants;
}

function parseAuthors(authorsStr: string, highlightNames: string[]): Array<{ name: string; isHighlighted?: boolean; isCorresponding?: boolean; isCoAuthor?: boolean }> {
  if (!authorsStr) return [];

  const highlightTextCandidates = new Set<string>();
  const highlightNormalizedCandidates = new Set<string>();

  highlightNames.forEach((name) => {
    const variants = buildNameVariants(name);
    variants.forEach((variant) => {
      highlightTextCandidates.add(variant);
      highlightNormalizedCandidates.add(normalizePersonNameForMatch(variant));
    });
  });

  const highlightTextList = Array.from(highlightTextCandidates);
  const highlightNormalizedList = Array.from(highlightNormalizedCandidates);

  // Split by "and" and clean up
  return authorsStr
    .split(/\sand\s/)
    .map(author => {
      // Clean up the author name
      let name = author.trim();

      // Check for corresponding author marker
      const isCorresponding = name.includes('*');

      // Check for co-author marker (#)
      const isCoAuthor = name.includes('#');

      // Remove special markers from name
      name = name.replace(/[*#]/g, '');

      // Handle "Last, First" format
      if (name.includes(',')) {
        const parts = name.split(',').map(p => p.trim());
        name = `${parts[1]} ${parts[0]}`;
      }

      name = cleanBibTeXString(name);

      // Check if this is the site owner (to highlight)
      const lowerName = name.toLowerCase();
      const normalizedName = normalizePersonNameForMatch(lowerName);
      const isHighlighted =
        highlightTextList.some((candidate) => lowerName.includes(candidate)) ||
        highlightNormalizedList.some((candidate) => normalizedName.includes(candidate));

      return {
        name,
        isHighlighted,
        isCorresponding,
        isCoAuthor,
      };
    })
    .filter(author => author.name);
}

function cleanBibTeXString(str?: string): string {
  if (!str) return '';

  return parseBibTeXInline(str).plainText;
}

function detectResearchArea(title: string, keywords: string[]): ResearchArea {
  const text = (title + ' ' + keywords.join(' ')).toLowerCase();

  if (text.includes('healthcare') || text.includes('medical') || text.includes('health')) {
    return 'ai-healthcare';
  }
  if (text.includes('signal') || text.includes('processing')) {
    return 'signal-processing';
  }
  if (text.includes('reliability') || text.includes('fault') || text.includes('diagnosis')) {
    return 'reliability-engineering';
  }
  if (text.includes('quantum')) {
    return 'quantum-computing';
  }
  if (text.includes('neural') || text.includes('spiking')) {
    return 'neural-networks';
  }
  if (text.includes('transformer') || text.includes('attention')) {
    return 'transformer-architectures';
  }

  return 'machine-learning';
}

function reconstructBibTeX(entry: { entryType: string; citationKey: string; entryTags: Record<string, string> }, excludeFields: string[] = []): string {
  const { entryType, citationKey, entryTags } = entry;

  let bibtex = `@${entryType}{${citationKey},\n`;

  Object.entries(entryTags).forEach(([key, value]) => {
    // Skip excluded fields
    if (!excludeFields.includes(key.toLowerCase())) {
      let cleanValue = value;

      // Clean author field by removing # and * symbols
      if (key.toLowerCase() === 'author') {
        cleanValue = value.replace(/[#*]/g, '');
      }

      bibtex += `  ${key} = {${cleanValue}},\n`;
    }
  });

  // Remove trailing comma and newline
  bibtex = bibtex.slice(0, -2) + '\n';
  bibtex += '}';

  return bibtex;
} 
