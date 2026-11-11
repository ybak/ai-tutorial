import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { resolveBookPaths } from './paths.mjs';
import { BUILDABLE_BOOKS, PLANNED_BOOKS, ALL_BOOKS } from './registry.mjs';

// Windows 下 path.join 产生反斜杠,统一归一为正斜杠再断言(可移植)
const norm = (p) => p.split(path.sep).join('/');

const FAKE_BOOK = { bookId: 'x', chaptersDir: 'books/x/chapters', assetsDir: 'books/x/assets',
  pdfFileName: 'x.pdf' };

test('resolveBookPaths 推导子站与产物路径', () => {
  const p = resolveBookPaths(FAKE_BOOK, '/repo');
  assert.equal(norm(p.siteSubdir), 'x');
  assert.equal(norm(p.chaptersAbs), '/repo/books/x/chapters');
  assert.equal(norm(p.assetsAbs), '/repo/books/x/assets');
  assert.equal(norm(p.siteDir), '/repo/output/site/x');
  assert.equal(norm(p.htmlPath), '/repo/output/x/book.html');
  assert.equal(norm(p.pdfPath), '/repo/output/x/x.pdf');
});

test('registry:legacy 所有权唯一且 published 书显式声明 legacyRootChapters', () => {
  // 旧站点根 chapters/ 路径只属于 agentscope-java;其余 published 书必须显式 false
  const legacyOwners = BUILDABLE_BOOKS.filter((b) => b.legacyRootChapters === true);
  assert.deepEqual(legacyOwners.map((b) => b.bookId), ['agentscope-java']);
  for (const b of BUILDABLE_BOOKS) {
    if (b.bookId !== 'agentscope-java') assert.equal(b.legacyRootChapters, false);
  }
  for (const b of PLANNED_BOOKS) assert.equal('legacyRootChapters' in b, false);
});

test('registry:bookId 唯一且 published 名单符合预期', () => {
  const ids = ALL_BOOKS.map((b) => b.bookId);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(BUILDABLE_BOOKS.map((b) => b.bookId), ['agentscope-java', 'mcp', 'ragflow', 'copilotkit', 'fastgpt', 'super-agent', 'langfuse', 'litellm']);
  for (const id of ['cli'])
    assert.ok(PLANNED_BOOKS.some((b) => b.bookId === id));
});

