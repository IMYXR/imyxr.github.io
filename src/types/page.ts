export interface BasePageConfig {
    type: 'about' | 'publication' | 'card' | 'text' | 'resume';
    title: string;
    description?: string;
}

export interface PublicationPageConfig extends BasePageConfig {
    type: 'publication';
    source: string;
}

export interface TextPageConfig extends BasePageConfig {
    type: 'text';
    source: string;
}

export interface CardItem {
    title: string;
    subtitle?: string;
    date?: string;
    content?: string;
    tags?: string[];
    link?: string;
    image?: string;
}

export interface CardPageConfig extends BasePageConfig {
    type: 'card';
    items: CardItem[];
}

/** One thing in a résumé: a degree, a position, an award, a line of skills. */
export interface ResumeEntry {
    title?: string;
    subtitle?: string;
    date?: string;
    location?: string;
    /** Bullet points. Markdown is allowed: **bold**, [links](https://…). */
    details?: string[];
    /** With `text`, makes the entry a single "Label  text" row, as in a list of skills. */
    label?: string;
    text?: string;
}

export interface ResumeSection {
    title: string;
    /** "list" sets the entries as one-line rows led by their date, for awards and the like. */
    layout?: 'entries' | 'list';
    entries: ResumeEntry[];
}

export interface ResumePageConfig extends BasePageConfig {
    type: 'resume';
    sections: ResumeSection[];
}
