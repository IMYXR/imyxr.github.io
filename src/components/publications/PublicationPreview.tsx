'use client';

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Publication } from '@/types/publication';
import { useMessages } from '@/lib/i18n/useMessages';
import FormattedBibTeXText from './FormattedBibTeXText';
import { AuthorList, AwardBadge, PublicationFigure, PublicationLinks, venueName } from './PublicationExtras';

interface PublicationPreviewProps {
    /** The publication to show, or null while the preview is closed. */
    publication: Publication | null;
    onClose: () => void;
}

// The panel rises into place on a spring with a slight overshoot, and leaves faster than it came.
const RISE = { type: 'spring', stiffness: 320, damping: 26 } as const;
const LEAVE = { duration: 0.18, ease: 'easeIn' } as const;
const RISE_FROM = 64; // px below its resting place
const LEAVE_TO = 40;

/**
 * The full view of one publication, opened from its "More" button: the whole figure at its
 * own proportions, the description, and the links. It pops up from below over a blurred
 * page, and closes on Escape, on the close button, or on a click outside the panel.
 */
export default function PublicationPreview({ publication, onClose }: PublicationPreviewProps) {
    const messages = useMessages();
    const reduceMotion = useReducedMotion();

    return (
        <AnimatePresence>
            {publication && (
                <Dialog static open onClose={onClose} className="relative z-[100]">
                    {/* The page behind, dimmed and blurred. */}
                    <motion.div
                        aria-hidden="true"
                        className="publication-preview__backdrop fixed inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    />

                    {/* Scrolls as a whole if the panel is taller than the window. */}
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
                            <DialogPanel
                                as={motion.div}
                                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: RISE_FROM, scale: 0.96 }}
                                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, transition: RISE }}
                                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: LEAVE_TO, scale: 0.98, transition: LEAVE }}
                                className="w-full max-w-3xl rounded-2xl bg-white dark:bg-neutral-900 p-5 sm:p-8 shadow-2xl border border-neutral-200 dark:border-[rgba(148,163,184,0.24)]"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        {/* The venue in words here, not as the logos the lists use. */}
                                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-600 mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <span>{venueName(publication)}</span>
                                            {publication.awards?.map((award) => (
                                                <AwardBadge key={award} award={award} />
                                            ))}
                                        </p>
                                        <DialogTitle as="h2" className="text-xl sm:text-2xl font-serif font-bold text-primary leading-snug text-balance">
                                            <FormattedBibTeXText nodes={publication.titleNodes} fallback={publication.title} />
                                        </DialogTitle>
                                        <AuthorList
                                            authors={publication.authors}
                                            className="mt-2 text-sm sm:text-base text-neutral-600 dark:text-neutral-400"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        aria-label={messages.common.close}
                                        className="-mr-2 -mt-2 flex-shrink-0 rounded-full p-2 text-neutral-500 hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                    >
                                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </div>

                                {publication.preview && (
                                    <div className="mt-5">
                                        <PublicationFigure publication={publication} label={messages.publications.viewFigure} />
                                    </div>
                                )}

                                {publication.description && (
                                    <p className="mt-5 text-base leading-relaxed text-neutral-700">
                                        {publication.description}
                                    </p>
                                )}

                                {publication.abstract && (
                                    <div className="mt-5">
                                        <h3 className="text-sm font-semibold text-primary mb-1">{messages.publications.abstract}</h3>
                                        <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-500">
                                            {publication.abstract}
                                        </p>
                                    </div>
                                )}

                                <div className="mt-6 flex flex-wrap gap-2 empty:hidden">
                                    <PublicationLinks publication={publication} />
                                </div>
                            </DialogPanel>
                        </div>
                    </div>
                </Dialog>
            )}
        </AnimatePresence>
    );
}
