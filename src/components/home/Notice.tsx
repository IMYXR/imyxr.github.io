'use client';

import { useId } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface NoticeAction {
    label: string;
    /** "email" (the address in config.toml), a page of this site ("/resume") or a full address. */
    href: string;
}

interface NoticeProps {
    /** The short line at the top, beside the pulsing dot. */
    label?: string;
    title?: string;
    /** Words of the title to pick out with a stroke of highlighter. */
    highlight?: string;
    text?: string;
    topics?: string[];
    /** The first is shown as a button, the rest as links. */
    actions?: NoticeAction[];
    /** The site's contact address, for an action whose `href` is "email". */
    email?: string;
}

function Headline({ title, highlight }: { title: string; highlight?: string }) {
    const start = highlight ? title.indexOf(highlight) : -1;
    if (!highlight || start < 0) return <>{title}</>;

    return (
        <>
            {title.slice(0, start)}
            <span className="notice__mark">{highlight}</span>
            {title.slice(start + highlight.length)}
        </>
    );
}

function Action({ action, email, primary }: { action: NoticeAction; email?: string; primary: boolean }) {
    const toEmail = action.href === 'email';
    const href = toEmail ? (email ? `mailto:${email}` : null) : action.href;
    if (!href) return null;

    const className = cn(
        'inline-flex items-center text-sm font-medium',
        primary ? 'notice__button gap-2 rounded-lg px-4 py-2' : 'notice__link -mx-1.5 gap-1 rounded px-1.5 py-1'
    );
    const content = (
        <>
            {(toEmail || href.startsWith('mailto:')) && <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />}
            {action.label}
            {!primary && <span aria-hidden="true">→</span>}
        </>
    );

    if (href.startsWith('/')) {
        return <Link href={href} className={className}>{content}</Link>;
    }

    const elsewhere = /^https?:\/\//.test(href);
    return (
        <a
            href={href}
            className={className}
            {...(elsewhere ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
            {content}
        </a>
    );
}

/**
 * A highlighted announcement among the home page sections, such as an internship search.
 * Its look is in globals.css, under "Notice".
 */
export default function Notice({ label, title, highlight, text, topics = [], actions = [], email }: NoticeProps) {
    const headingId = useId();

    if (!title) return null;

    return (
        <motion.section
            data-notice
            aria-labelledby={headingId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="notice p-4 sm:p-6"
        >
            {label && (
                <p className="notice__label mb-2.5 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.14em]">
                    <span className="notice__dot" aria-hidden="true" />
                    {label}
                </p>
            )}

            <h2 id={headingId} className="text-xl sm:text-[1.375rem] font-serif font-bold leading-snug text-primary text-balance">
                <Headline title={title} highlight={highlight} />
            </h2>

            {text && (
                <p className="mt-2 leading-relaxed text-neutral-700 dark:text-neutral-600">{text}</p>
            )}

            {topics.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                    {topics.map((topic) => (
                        <li key={topic} className="notice__topic rounded-full px-3 py-1 text-sm font-medium text-primary">
                            {topic}
                        </li>
                    ))}
                </ul>
            )}

            {actions.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                    {actions.map((action, index) => (
                        <Action key={action.label} action={action} email={email} primary={index === 0} />
                    ))}
                </div>
            )}
        </motion.section>
    );
}
