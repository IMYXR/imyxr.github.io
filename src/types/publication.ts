export interface Author {
  name: string;
  isMainAuthor?: boolean;
  affiliation?: string;
  email?: string;
  orcid?: string;
  isHighlighted?: boolean;
  isCorresponding?: boolean;
  isCoAuthor?: boolean;
}

export type BibTeXInlineNode =
  | { type: 'text'; text: string }
  | {
    type: 'em' | 'strong' | 'smallCaps' | 'sup' | 'sub';
    children: BibTeXInlineNode[];
  };

/** A venue's logo, with its pixel size read at build time so it can be laid out before it loads. */
export interface VenueIcon {
  src: string;
  /** A version of the same logo for the dark theme, where one exists. Same size as `src`. */
  darkSrc?: string;
  width?: number;
  height?: number;
}

export interface Publication {
  id: string;
  title: string;
  titleNodes?: BibTeXInlineNode[];
  authors: Author[];
  abstract?: string;
  journal?: string;
  conference?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  year: number;
  month?: string;
  publishedDate?: string;
  doi?: string;
  arxivId?: string;
  pmid?: string;
  url?: string;
  code?: string;
  /** The `pdf` field as written: a PDF file under public/, or any other address. */
  pdfUrl?: string;
  /** For a PDF file of ours, the page on this site that shows it; "PDF" buttons link here. */
  paperPage?: string;
  tags: string[];
  keywords?: string[];
  type: PublicationType;
  status: PublicationStatus;
  citations?: number;
  impactFactor?: number;
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  bibtex?: string;
  venue?: string;
  location?: string;
  awards?: string[];
  featured?: boolean;
  selected?: boolean;
  preview?: string;
  /** Pixel size of the preview image, read at build time so it can be laid out uncropped. */
  previewWidth?: number;
  previewHeight?: number;
  /** Logos shown in place of the venue's name. */
  venueIcons?: VenueIcon[];
  /** The kind of paper, shown beside the venue: "Poster", "Full Paper", "Journal Paper"… */
  paperType?: string;
  summary?: string;
  researchArea: ResearchArea;
  description?: string;
}

export type PublicationType =
  | 'journal'
  | 'conference'
  | 'workshop'
  | 'book-chapter'
  | 'book'
  | 'thesis'
  | 'preprint'
  | 'patent'
  | 'technical-report';

export type PublicationStatus =
  | 'published'
  | 'accepted'
  | 'under-review'
  | 'submitted'
  | 'in-preparation'
  | 'draft';

export type ResearchArea =
  | 'ai-healthcare'
  | 'signal-processing'
  | 'reliability-engineering'
  | 'quantum-computing'
  | 'machine-learning'
  | 'fault-diagnosis'
  | 'neural-networks'
  | 'transformer-architectures'
  | 'biomedical-engineering'
  | 'other';
