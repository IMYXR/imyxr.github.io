export interface LocaleMessages {
  common: {
    all: string;
    copyToClipboard: string;
    close: string;
  };
  navigation: {
    openMainMenu: string;
  };
  theme: {
    system: string;
    light: string;
    dark: string;
    currentTheme: string;
    cycleTheme: string;
  };
  profile: {
    email: string;
    location: string;
    workAddress: string;
    click: string;
    googleMap: string;
    send: string;
    sendEmail: string;
    researchInterests: string;
    attending: string;
    like: string;
    liked: string;
    thanks: string;
  };
  home: {
    about: string;
    news: string;
    selectedPublications: string;
    viewAll: string;
  };
  publications: {
    searchPlaceholder: string;
    filters: string;
    year: string;
    type: string;
    noResults: string;
    abstract: string;
    bibtex: string;
    code: string;
    pdf: string;
    link: string;
    downloadPdf: string;
    openPdf: string;
    openPdfFile: string;
    pdfOpensElsewhere: string;
    more: string;
    viewFigure: string;
  };
  visitors: {
    globeLabel: string;
    visits: string;
  };
  footer: {
    lastUpdated: string;
  };
}

const en: LocaleMessages = {
  common: {
    all: 'All',
    copyToClipboard: 'Copy to clipboard',
    close: 'Close',
  },
  navigation: {
    openMainMenu: 'Open main menu',
  },
  theme: {
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    currentTheme: 'Current theme',
    cycleTheme: 'Click to cycle theme',
  },
  profile: {
    email: 'Email',
    location: 'Location',
    workAddress: 'Work Address',
    click: 'Click',
    googleMap: 'Google Map',
    send: 'Send',
    sendEmail: 'Send Email',
    researchInterests: 'Research Interests',
    attending: 'Attending',
    like: 'Like',
    liked: 'Liked',
    thanks: 'Thanks!',
  },
  home: {
    about: 'About',
    news: 'News',
    selectedPublications: 'Selected Publications',
    viewAll: 'View All',
  },
  publications: {
    searchPlaceholder: 'Search publications...',
    filters: 'Filters',
    year: 'Year',
    type: 'Type',
    noResults: 'No publications found matching your criteria.',
    abstract: 'Abstract',
    bibtex: 'BibTeX',
    code: 'Code',
    pdf: 'PDF',
    link: 'Link',
    downloadPdf: 'Download PDF',
    openPdf: 'Open in new tab',
    openPdfFile: 'Open PDF',
    pdfOpensElsewhere: 'On this device the PDF opens in its own viewer.',
    more: 'More',
    viewFigure: 'View full-size figure',
  },
  visitors: {
    globeLabel: 'Rotating globe marking where visitors to this site come from',
    visits: 'Visits',
  },
  footer: {
    lastUpdated: 'Last updated',
  },
};

const zh: LocaleMessages = {
  common: {
    all: '全部',
    copyToClipboard: '复制到剪贴板',
    close: '关闭',
  },
  navigation: {
    openMainMenu: '打开主菜单',
  },
  theme: {
    system: '跟随系统',
    light: '浅色',
    dark: '深色',
    currentTheme: '当前主题',
    cycleTheme: '点击切换主题',
  },
  profile: {
    email: '邮箱',
    location: '地址',
    workAddress: '办公地址',
    click: '点击',
    googleMap: '谷歌地图',
    send: '发送',
    sendEmail: '发送邮件',
    researchInterests: '研究兴趣',
    attending: '参会',
    like: '点赞',
    liked: '已点赞',
    thanks: '感谢支持！',
  },
  home: {
    about: '关于我',
    news: '动态',
    selectedPublications: '精选论文',
    viewAll: '查看全部',
  },
  publications: {
    searchPlaceholder: '搜索论文...',
    filters: '筛选',
    year: '年份',
    type: '类型',
    noResults: '没有找到符合条件的论文。',
    abstract: '摘要',
    bibtex: 'BibTeX',
    code: '代码',
    pdf: 'PDF',
    link: '链接',
    downloadPdf: '下载 PDF',
    openPdf: '在新标签页打开',
    openPdfFile: '打开 PDF',
    pdfOpensElsewhere: '在此设备上，PDF 会在系统自带的阅读器中打开。',
    more: '更多',
    viewFigure: '查看大图',
  },
  visitors: {
    globeLabel: '标记本站访客来源地的旋转地球',
    visits: '访问次数',
  },
  footer: {
    lastUpdated: '最近更新',
  },
};

export const messages: Record<string, LocaleMessages> = {
  en,
  zh,
};

export function getMessages(locale: string): LocaleMessages {
  return messages[locale] || en;
}
