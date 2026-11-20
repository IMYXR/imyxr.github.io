'use client';

import { Fragment } from 'react';
import Image from 'next/image';
import { DocumentTextIcon, LinkIcon, TrophyIcon } from '@heroicons/react/24/outline';
import type { Author, Publication } from '@/types/publication';
import { useMessages } from '@/lib/i18n/useMessages';
import { cn } from '@/lib/utils';

/** A `preview` that is already a path or URL is used as is; a bare filename is looked up in public/papers/. */
export function previewSrc(preview: string): string {
    return preview.startsWith('/') || /^https?:\/\//.test(preview) ? preview : `/papers/${preview}`;
}

/** The look shared by the small buttons and links under a publication. */
export const CHIP_CLASS =
    'inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors';
// On the dark theme the chip is a wash of white rather than a fixed colour, so that it is a
// shade lighter than whatever card it sits on: the cards differ between pages.
export const CHIP_IDLE_CLASS =
    'bg-neutral-100 dark:bg-white/[0.08] text-neutral-700 hover:bg-accent hover:text-white';

/**
 * The figure as it appears in the list: cropped to one fixed shape, so that every entry
 * lines up whatever the proportions of its image. It opens the preview, where the figure
 * is shown whole.
 */
export function PublicationThumbnail({
    publication,
    label,
    onOpen,
}: {
    publication: Publication;
    label: string;
    onOpen: () => void;
}) {
    if (!publication.preview) return null;

    return (
        <button
            type="button"
            onClick={onOpen}
            aria-haspopup="dialog"
            aria-label={`${label}: ${publication.title}`}
            className="group block w-full md:w-48 flex-shrink-0 self-start rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900"
        >
            <span className="relative block aspect-video md:aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <Image
                    src={previewSrc(publication.preview)}
                    alt={publication.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 192px"
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                />
            </span>
        </button>
    );
}

/**
 * How tall a figure may be in the preview.
 *
 * With the usual few lines of description the panel can fit the window whole, and the
 * figure gets whatever the window has left once the text around it (about 28rem with a long
 * title) is allowed for; never more than 60% of the window, nor so little that the figure
 * is lost.
 *
 * With a long text, a whole abstract say, the panel has to be scrolled however small the
 * figure is made, so squeezing the figure gains nothing: it gets the 60% outright.
 */
const FIGURE_MAX_HEIGHT = {
    fitted: 'clamp(10rem, 100vh - 28rem, 60vh)',
    roomy: '60vh',
};

/**
 * Past this many characters (about five lines of the panel on a wide screen) the text
 * beside a figure is too long for the panel to fit a laptop window.
 */
const LONG_TEXT = 450;

/** Whether a publication's text in the preview is long enough that the panel will scroll. */
function hasLongText(publication: Publication): boolean {
    return (publication.description?.length ?? 0) + (publication.abstract?.length ?? 0) > LONG_TEXT;
}

/**
 * The whole figure, at its own proportions. Clicking it opens the image file at full size.
 */
export function PublicationFigure({ publication, label }: { publication: Publication; label: string }) {
    if (!publication.preview) return null;

    const src = previewSrc(publication.preview);
    const { previewWidth: width, previewHeight: height } = publication;
    const sizes = '(max-width: 832px) 100vw, 768px';
    const maxHeight = hasLongText(publication) ? FIGURE_MAX_HEIGHT.roomy : FIGURE_MAX_HEIGHT.fitted;

    return (
        <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            title={label}
            aria-label={`${label}: ${publication.title}`}
            // White behind the image in both themes: figures are drawn for a white page.
            className="mx-auto block w-full overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white cursor-zoom-in transition-shadow duration-200 hover:shadow-md"
            // The width at which the image reaches the height limit. Capping the width,
            // rather than the height, keeps the frame tight around the image.
            style={width && height ? { maxWidth: `calc(${maxHeight} * ${(width / height).toFixed(4)})` } : undefined}
        >
            {width && height ? (
                <Image src={src} alt={publication.title} width={width} height={height} sizes={sizes} className="block w-full h-auto" />
            ) : (
                // Size unknown (a remote image, or a file that could not be read at build
                // time): fit it inside a 4:3 box, still without cropping.
                <span className="relative block aspect-[4/3]">
                    <Image src={src} alt={publication.title} fill sizes={sizes} className="object-contain" />
                </span>
            )}
        </a>
    );
}

/** A publication's venue and year in words: "IEEE Transactions on … 2026". */
export function venueName(publication: Publication): string {
    return [publication.journal || publication.conference, publication.year].filter(Boolean).join(' ');
}

/**
 * Where a publication appeared. With venue logos set (`venue_icon` in publications.bib) it
 * is the logos followed by the kind of paper ("Poster", "Conference Paper"…); the venue's
 * name is then their text alternative and tooltip. Without logos it is the name in words.
 * Renders bare inline pieces, for the caller's row to lay out.
 *
 * The logos sit straight on the page, with no backing. One drawn in dark colours would be
 * lost on the dark theme, so a logo can come with a second version for it; the two are
 * both in the page and the theme decides which is displayed.
 */
export function PublicationVenue({
    publication,
    logoClassName = 'h-6',
}: {
    publication: Publication;
    /** Sets the height of the logos; their width follows from each one's own proportions. */
    logoClassName?: string;
}) {
    const { venueIcons, paperType } = publication;
    const name = venueName(publication);

    if (!venueIcons?.length) {
        return <span>{[name, paperType].filter(Boolean).join(' · ')}</span>;
    }

    return (
        <>
            <span className="venue-logos" role="img" aria-label={name} title={name}>
                {venueIcons.map((icon) => {
                    // The fallback size only matters for a remote logo, whose size is not
                    // known until it loads.
                    const size = { width: icon.width ?? 96, height: icon.height ?? 32 };
                    return (
                        <Fragment key={icon.src}>
                            <Image
                                src={icon.src}
                                alt=""
                                {...size}
                                className={cn('w-auto', logoClassName, icon.darkSrc && 'dark:hidden')}
                            />
                            {icon.darkSrc && (
                                <Image
                                    src={icon.darkSrc}
                                    alt=""
                                    {...size}
                                    className={cn('w-auto hidden dark:block', logoClassName)}
                                />
                            )}
                        </Fragment>
                    );
                })}
            </span>
            {paperType && <span>{paperType}</span>}
        </>
    );
}

/** The author line, with the site owner highlighted and the usual marks for shared and corresponding authorship. */
export function AuthorList({ authors, className }: { authors: Author[]; className?: string }) {
    return (
        <p className={className}>
            {authors.map((author, index) => (
                <span key={index}>
                    <span
                        className={cn(
                            author.isHighlighted && 'font-semibold text-accent',
                            author.isCoAuthor && 'underline underline-offset-4',
                            author.isCoAuthor && (author.isHighlighted ? 'decoration-accent' : 'decoration-neutral-400')
                        )}
                    >
                        {author.name}
                    </span>
                    {author.isCorresponding && (
                        <sup className={author.isHighlighted ? 'text-accent' : 'text-neutral-600 dark:text-neutral-400'}>†</sup>
                    )}
                    {index < authors.length - 1 && ', '}
                </span>
            ))}
        </p>
    );
}

/**
 * Links out of a publication: the paper itself, its page at the publisher's, its DOI, its
 * code. "PDF" goes to the paper's page on this site when it has one, and otherwise wherever
 * the `pdf` field points; "Link" goes to the entry's `url`.
 * Renders nothing but the links, for the caller to lay out.
 */
export function PublicationLinks({ publication }: { publication: Publication }) {
    const messages = useMessages();
    const linkClass = cn(CHIP_CLASS, CHIP_IDLE_CLASS);
    const pdfHref = publication.paperPage ?? publication.pdfUrl;

    return (
        <>
            {pdfHref && (
                <a href={pdfHref} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    <DocumentTextIcon className="h-3 w-3 mr-1.5" />
                    {messages.publications.pdf}
                </a>
            )}
            {publication.url && (
                <a href={publication.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    <LinkIcon className="h-3 w-3 mr-1.5" />
                    {messages.publications.link}
                </a>
            )}
            {publication.doi && (
                <a href={`https://doi.org/${publication.doi}`} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    DOI
                </a>
            )}
            {publication.code && (
                <a href={publication.code} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    {messages.publications.code}
                </a>
            )}
        </>
    );
}

export function AwardBadge({ award }: { award: string }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent/15 text-accent-dark">
            <TrophyIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {award}
        </span>
    );
}
