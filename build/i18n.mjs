/**
 * i18n.mjs — 站点 locale。
 *
 * 默认 locale 是中文，URL 不加前缀，已有路径保持不变。
 * 其他 locale 挂在 /<id>/ 下（英文为 /en/）。
 * 某本书只有在 book.locales[id] 里登记了译文时，才会在该 locale 下出子站。
 * 界面文案按 locale 取 UI，不把英文写进中文渲染的默认参数。
 */

/** @typedef {'zh'|'en'} LocaleId */

export const DEFAULT_LOCALE = 'zh';

export const UI = {
  zh: {
    lang: 'zh-CN',
    label: '中文',
    siteName: 'AI 教程书架',
    repoCta: '源码仓库 · 有用请 Star',
    searchPlaceholder: '搜索全书…',
    navToggle: '打开目录',
    prev: '← 上一篇',
    next: '下一篇 →',
    onlineEdition: '在线阅读版',
    enter: '进入阅读 →',
    planned: '规划中',
    shelfTitle: 'AI 教程书架',
    shelfSubtitle: '多本“从入门到进阶”完整教程,按需取阅',
    searchTitle: '搜索',
    filterPrefix: '书: ',
  },
  en: {
    lang: 'en',
    label: 'English',
    siteName: 'AI Tutorial Shelf',
    repoCta: 'Source repository · Star if this helps',
    searchPlaceholder: 'Search…',
    navToggle: 'Open contents',
    prev: '← Previous',
    next: 'Next →',
    onlineEdition: 'Online edition',
    enter: 'Start reading →',
    planned: 'Planned',
    shelfTitle: 'AI Tutorial Shelf',
    shelfSubtitle: 'Hands-on tutorials. Read the one you need.',
    searchTitle: 'Search',
    filterPrefix: 'Book: ',
  },
};

/**
 * 把书配置投影到某个 locale。
 * 中文（或缺省）返回原对象的浅拷贝并标上 locale，不改 chaptersDir / PARTS。
 * 其他 locale 没有译文时返回 null。
 * 资源目录、demo 链接、bookId 沿用原书，避免英文站另存一套截图或改掉中文路径。
 */
export function localizedBook(book, localeId = DEFAULT_LOCALE) {
  if (localeId === DEFAULT_LOCALE) {
    return { ...book, locale: DEFAULT_LOCALE, localePrefix: '' };
  }
  const overlay = book.locales?.[localeId];
  if (!overlay) return null;
  return {
    ...book,
    ...overlay,
    bookId: book.bookId,
    status: book.status,
    locale: localeId,
    localePrefix: localeId,
    assetsDir: overlay.assetsDir ?? book.assetsDir,
    demoGithubBase: overlay.demoGithubBase ?? book.demoGithubBase,
    legacyRootChapters: false,
    locales: book.locales,
    PARTS: overlay.PARTS,
    chaptersDir: overlay.chaptersDir,
  };
}

const up = (n) => (n <= 0 ? '' : '../'.repeat(n));

/**
 * 当前页指向另一种语言的相对链接。
 * 该书没有译文时，英文侧落到 /en/ 首页，避免死链。
 *
 * @param {{ locale: LocaleId, page: 'shelf'|'search'|'book'|'chapter', bookId?: string, chapterHref?: string, hasTranslation?: boolean }} opts
 * @returns {{ current: LocaleId, zhHref: string|null, enHref: string|null }}
 */
export function localeSwitchHrefs({ locale, page, bookId, chapterHref, hasTranslation = false }) {
  if (locale === 'zh') {
    const depth = page === 'book' ? 1 : page === 'chapter' ? 2 : 0;
    const prefix = up(depth);
    let enHref;
    if (page === 'search') enHref = `${prefix}en/search.html`;
    else if (page === 'book' && hasTranslation) enHref = `${prefix}en/${bookId}/index.html`;
    else if (page === 'chapter' && hasTranslation) enHref = `${prefix}en/${bookId}/${chapterHref}`;
    else enHref = `${prefix}en/index.html`;
    return { current: 'zh', zhHref: null, enHref };
  }
  const depth = page === 'book' ? 2 : page === 'chapter' ? 3 : 1;
  const prefix = up(depth);
  let zhHref;
  if (page === 'search') zhHref = `${prefix}search.html`;
  else if (page === 'book') zhHref = `${prefix}${bookId}/index.html`;
  else if (page === 'chapter') zhHref = `${prefix}${bookId}/${chapterHref}`;
  else zhHref = `${prefix}index.html`;
  return { current: 'en', zhHref, enHref: null };
}
