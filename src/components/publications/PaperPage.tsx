'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowDownTrayIcon, ArrowLeftIcon, ArrowTopRightOnSquareIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import type { Publication } from '@/types/publication';
import { useMessages } from '@/lib/i18n/useMessages';
import { cn } from '@/lib/utils';
import FormattedBibTeXText from './FormattedBibTeXText';
import { AuthorList, AwardBadge, venueName } from './PublicationExtras';

interface PaperPageProps {
    publication: Publication;
    /** The publications list this paper belongs to: where "back" goes, and what it is called. */
    listHref: string;
    listTitle: string;
}

/**
 * Whether to show the PDF inside the page. Only where that works well: a browser with a
 * built-in PDF viewer, on a screen wide enough to read from, used with a mouse. Phones and
 * tablets show an embedded PDF badly or not at all (some only its first page), and their
 * own viewers do it far better. `null` until the page has had a chance to look.
 */
function useInlinePdf(): boolean | null {
    const [inline, setInline] = useState<boolean | null>(null);

    useEffect(() => {
        const roomy = window.matchMedia('(min-width: 768px) and (pointer: fine)');
        const decide = () => setInline(roomy.matches && navigator.pdfViewerEnabled !== false);

        decide();
        roomy.addEventListener('change', decide);
        return () => roomy.removeEventListener('change', decide);
    }, []);

    return inline;
}

/**
 * Asks the browser's PDF viewer to start with the page filling the width of the frame and
 * its side panel closed. The first two are Chrome's and Edge's names for that, the last two
 * Firefox's; each viewer ignores what it does not know, and Safari ignores them all.
 */
const PDF_VIEW = '#navpanes=0&view=FitH&pagemode=none&zoom=page-width';

// No `display` here: each button adds its own, because one of them is shown conditionally
// and two display classes on one element would be settled by the order of the stylesheet.
const BUTTON_CLASS =
    'items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const PRIMARY_BUTTON_CLASS = 'bg-accent text-white shadow-sm hover:bg-accent-dark hover:shadow-md';
const SECONDARY_BUTTON_CLASS =
    'border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 hover:border-accent hover:text-accent';

/**
 * A paper on its own page: its citation, the ways to get the PDF, and the PDF itself shown
 * in the page where the browser can do that.
 */
export default function PaperPage({ publication, listHref, listTitle }: PaperPageProps) {
    const messages = useMessages();
    const inline = useInlinePdf();
    const pdf = publication.pdfUrl;

    if (!pdf) return null;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <Link
                    href={listHref}
                    className="inline-flex items-center gap-1.5 -ml-2 px-2 py-1 rounded text-sm font-medium text-accent hover:text-accent-dark hover:bg-accent/10 transition-all duration-200"
                >
                    <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
                    {listTitle}
                </Link>

                <header className="mt-4">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-600 mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>{venueName(publication)}</span>
                        {publication.awards?.map((award) => (
                            <AwardBadge key={award} award={award} />
                        ))}
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-primary leading-snug text-balance">
                        <FormattedBibTeXText nodes={publication.titleNodes} fallback={publication.title} />
                    </h1>
                    <AuthorList
                        authors={publication.authors}
                        className="mt-3 text-base text-neutral-600 dark:text-neutral-400"
                    />
                </header>

                <div className="mt-5 flex flex-wrap gap-3">
                    <a href={pdf} download className={cn('inline-flex', BUTTON_CLASS, PRIMARY_BUTTON_CLASS)}>
                        <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                        {messages.publications.downloadPdf}
                    </a>
                    {/* Goes with the PDF shown in the page; where it is not, the panel below has
                        this link as its own button. */}
                    <a
                        href={pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                            BUTTON_CLASS,
                            SECONDARY_BUTTON_CLASS,
                            inline === null ? 'hidden md:inline-flex' : inline ? 'inline-flex' : 'hidden'
                        )}
                    >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                        {messages.publications.openPdf}
                    </a>
                </div>

                {/* The PDF in the page. Before the check above has run, it is laid out as it
                    will most likely end up: present on a wide screen, absent on a narrow one. */}
                <div
                    className={cn(
                        'mt-6 h-[calc(100vh-7rem)] min-h-[32rem] overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 shadow-sm',
                        inline === null ? 'hidden md:block' : inline ? 'block' : 'hidden'
                    )}
                >
                    {inline && <iframe src={pdf + PDF_VIEW} title={publication.title} className="block h-full w-full" />}
                </div>

                {/* Where it is not shown in the page: a pointer to the device's own viewer. */}
                <div
                    className={cn(
                        'mt-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 text-center shadow-sm',
                        inline === null ? 'md:hidden' : inline ? 'hidden' : 'block'
                    )}
                >
                    <DocumentTextIcon className="mx-auto h-10 w-10 text-neutral-400" aria-hidden="true" />
                    <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-500">{messages.publications.pdfOpensElsewhere}</p>
                    <a href={pdf} target="_blank" rel="noopener noreferrer" className={cn('inline-flex mt-4', BUTTON_CLASS, SECONDARY_BUTTON_CLASS)}>
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                        {messages.publications.openPdfFile}
                    </a>
                </div>
            </motion.div>
        </div>
    );
}
