'use client';

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { ResumeEntry, ResumePageConfig, ResumeSection } from '@/types/page';
import { cn } from '@/lib/utils';

// Entries hold short runs of text, so Markdown is used for inline marks only: a paragraph
// is unwrapped, leaving bold, emphasis and links.
const inlineMarkdown = {
    p: ({ children }: React.ComponentProps<'p'>) => <>{children}</>,
    strong: ({ children }: React.ComponentProps<'strong'>) => <strong className="font-semibold text-primary">{children}</strong>,
    em: ({ children }: React.ComponentProps<'em'>) => <em className="italic">{children}</em>,
    a: ({ ...props }) => (
        <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent font-medium transition-all duration-200 rounded hover:bg-accent/10 hover:shadow-sm"
        />
    ),
};

function Inline({ children }: { children: string }) {
    return <ReactMarkdown components={inlineMarkdown}>{children}</ReactMarkdown>;
}

/** A "Label  text" row: one line of a skills list. */
function LabelledRow({ entry }: { entry: ResumeEntry }) {
    return (
        <div className="sm:grid sm:grid-cols-[9.5rem_1fr] sm:gap-x-6">
            <dt className="font-semibold text-primary">{entry.label}</dt>
            <dd className="text-neutral-700 dark:text-neutral-600">
                <Inline>{entry.text ?? ''}</Inline>
            </dd>
        </div>
    );
}

/** A one-line row led by its date: "2025  Best Paper, Some Conference". */
function ListRow({ entry }: { entry: ResumeEntry }) {
    return (
        <li className="flex gap-x-5">
            <span className="w-12 flex-shrink-0 tabular-nums text-neutral-500">{entry.date}</span>
            <span className="text-neutral-700 dark:text-neutral-600">
                <span className="font-semibold text-primary">{entry.title}</span>
                {entry.subtitle && <>, {entry.subtitle}</>}
            </span>
        </li>
    );
}

/** A degree or a position: what and where on the left, when and in which place on the right. */
function Entry({ entry }: { entry: ResumeEntry }) {
    const hasMeta = entry.date || entry.location;

    return (
        <div>
            <div className="sm:flex sm:items-baseline sm:justify-between sm:gap-6">
                <div className="min-w-0">
                    <h3 className="text-lg font-semibold leading-snug text-primary">{entry.title}</h3>
                    {entry.subtitle && <p className="font-medium text-accent">{entry.subtitle}</p>}
                </div>
                {hasMeta && (
                    <div className="mt-1 flex-shrink-0 text-sm text-neutral-500 sm:mt-0 sm:text-right">
                        {/* Stacked in a column of their own on a wide screen; run together
                            on one line under the title on a narrow one. */}
                        <div className="hidden sm:block">
                            {entry.location && <p>{entry.location}</p>}
                            {entry.date && <p className="font-medium">{entry.date}</p>}
                        </div>
                        <p className="sm:hidden">{[entry.date, entry.location].filter(Boolean).join(' · ')}</p>
                    </div>
                )}
            </div>
            {entry.details && entry.details.length > 0 && (
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[0.95rem] leading-relaxed text-neutral-700 dark:text-neutral-600 marker:text-accent">
                    {entry.details.map((item, index) => (
                        <li key={index}>
                            <Inline>{item}</Inline>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function Section({ section, embedded }: { section: ResumeSection; embedded: boolean }) {
    const entries = section.entries ?? [];
    const labelled = entries.length > 0 && entries.every((entry) => entry.label);

    return (
        <section>
            <h2
                className={cn(
                    embedded ? 'text-xl' : 'text-2xl',
                    'mb-5 border-b border-neutral-200 dark:border-neutral-800 pb-2 font-serif font-bold text-primary'
                )}
            >
                {section.title}
            </h2>
            {labelled ? (
                <dl className="space-y-3">
                    {entries.map((entry, index) => (
                        <LabelledRow key={index} entry={entry} />
                    ))}
                </dl>
            ) : section.layout === 'list' ? (
                <ul className="space-y-2">
                    {entries.map((entry, index) => (
                        <ListRow key={index} entry={entry} />
                    ))}
                </ul>
            ) : (
                <div className="space-y-7">
                    {entries.map((entry, index) => (
                        <Entry key={index} entry={entry} />
                    ))}
                </div>
            )}
        </section>
    );
}

/**
 * A résumé, laid out from the sections in the page's TOML file: degrees and positions with
 * their dates and places, and compact lists for skills and awards.
 */
export default function ResumePage({ config, embedded = false }: { config: ResumePageConfig; embedded?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
        >
            <div className={embedded ? 'mb-6' : 'mb-10'}>
                <h1 className={cn(embedded ? 'text-2xl' : 'text-4xl', 'font-serif font-bold text-primary mb-4')}>{config.title}</h1>
                {config.description && (
                    <p className={cn(embedded ? 'text-base' : 'text-lg', 'text-neutral-600 dark:text-neutral-500 max-w-2xl')}>
                        {config.description}
                    </p>
                )}
            </div>

            <div className={embedded ? 'space-y-8' : 'space-y-12'}>
                {(config.sections ?? []).map((section, index) => (
                    <Section key={index} section={section} embedded={embedded} />
                ))}
            </div>
        </motion.div>
    );
}
