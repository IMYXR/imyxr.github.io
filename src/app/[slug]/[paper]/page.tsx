import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBibtexContent } from '@/lib/content';
import { parseBibTeX } from '@/lib/bibtexParser';
import { getPublicationsPage, type PublicationsPage } from '@/lib/paperPages';
import type { Publication } from '@/types/publication';
import PaperPage from '@/components/publications/PaperPage';

// A paper page: /<publications page>/<citation key>/. See src/lib/paperPages.ts.

interface Params {
  slug: string;
  paper: string;
}

// Only the pages listed by generateStaticParams exist; anything else under a page is a 404.
export const dynamicParams = false;

function papersWithPages(page: PublicationsPage): Publication[] {
  return parseBibTeX(getBibtexContent(page.source)).filter((publication) => publication.paperPage);
}

function findPaper({ slug, paper }: Params): { page: PublicationsPage; publication: Publication } | null {
  const page = getPublicationsPage();
  if (!page || page.slug !== slug) return null;

  const citationKey = decodeURIComponent(paper);
  const publication = papersWithPages(page).find((candidate) => candidate.id === citationKey);
  return publication ? { page, publication } : null;
}

export function generateStaticParams(): Params[] {
  const page = getPublicationsPage();
  if (!page) return [];

  return papersWithPages(page).map((publication) => ({ slug: page.slug, paper: publication.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const found = findPaper(await params);
  if (!found) return {};

  return {
    title: found.publication.title,
    description: found.publication.description,
  };
}

export default async function PaperRoute({ params }: { params: Promise<Params> }) {
  const found = findPaper(await params);
  if (!found) notFound();

  return (
    <PaperPage
      publication={found.publication}
      listHref={`/${found.page.slug}/`}
      listTitle={found.page.title}
    />
  );
}
