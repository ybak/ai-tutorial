/**
 * paths.mjs — 书路径推导（Task 1）
 *
 * 单一职责：纯函数。由书配置推导该书在仓库与产物目录中的全部路径，
 * 供后续多书构建任务使用（替代 build.mjs 里的单书硬编码路径）。
 * 约定：站点子目录 = bookId，每书产物隔离在 output/<bookId>/ 下，
 * 共享站点落在 output/site/<bookId>/。
 * 非默认 locale 只改站点子目录：output/site/<localePrefix>/<bookId>/。
 * 单书 HTML / PDF 仍在 output/<bookId>/，不随 locale 换目录。
 * 纯 path.join，不做 IO。
 */

import path from 'node:path';

/**
 * 推导一本书的全部路径（均为绝对路径）。
 *
 * @param {{ bookId: string, chaptersDir: string, assetsDir: string, pdfFileName: string, localePrefix?: string }} book 书配置对象
 * @param {string} rootDir 仓库根目录（绝对路径）
 * @returns {{ chaptersAbs: string, assetsAbs: string, siteSubdir: string, siteDir: string, htmlPath: string, pdfPath: string }}
 *   - chaptersAbs：章节源文件目录（<rootDir>/<book.chaptersDir>）
 *   - assetsAbs：静态资源目录（<rootDir>/<book.assetsDir>）
 *   - siteSubdir：共享站点下本书的子目录（默认 bookId；有 localePrefix 时为 <localePrefix>/<bookId>）
 *   - siteDir：共享站点中本书目录（<rootDir>/output/site/<siteSubdir>）
 *   - htmlPath：本书 HTML 产物（<rootDir>/output/<bookId>/book.html，不随 locale 改变）
 *   - pdfPath：本书 PDF 产物（<rootDir>/output/<bookId>/<pdfFileName>，不随 locale 改变）
 */
export function resolveBookPaths(book, rootDir) {
  const siteSubdir = book.localePrefix
    ? path.join(book.localePrefix, book.bookId)
    : book.bookId;
  return {
    chaptersAbs: path.join(rootDir, book.chaptersDir),
    assetsAbs: path.join(rootDir, book.assetsDir),
    siteSubdir,
    siteDir: path.join(rootDir, 'output', 'site', siteSubdir),
    htmlPath: path.join(rootDir, 'output', book.bookId, 'book.html'),
    pdfPath: path.join(rootDir, 'output', book.bookId, book.pdfFileName),
  };
}
