import { readFile } from 'node:fs/promises';
import process from 'node:process';
import AdmZip from 'adm-zip';

const endpoint = process.env.MD2MATHML_EXPORT_URL || 'https://markdown-to-word-converter.fly.dev/convert';
const fixtureUrl = new URL('../tests/fixtures/complex-document.md', import.meta.url);
const markdown = await readFile(fixtureUrl, 'utf8');
const formData = new FormData();
formData.append('file', new File([markdown], 'complex-document.md', { type: 'text/markdown' }));

const startedAt = Date.now();
const response = await fetch(endpoint, { body: formData, method: 'POST' });
if (!response.ok) throw new Error(`Export integration failed with HTTP ${response.status}`);

const buffer = Buffer.from(await response.arrayBuffer());
if (buffer.length < 1_000 || buffer.subarray(0, 2).toString() !== 'PK') {
  throw new Error('Export response is not a valid DOCX archive');
}

const zip = new AdmZip(buffer);
const documentXml = zip.readAsText('word/document.xml');
for (const expected of ['<m:oMath', '<w:tbl', 'Conversion regression document']) {
  if (!documentXml.includes(expected)) throw new Error(`DOCX is missing expected content: ${expected}`);
}
if (!zip.getEntry('word/footnotes.xml')) throw new Error('DOCX is missing native Word footnotes');
if (!zip.getEntries().some((entry) => entry.entryName.startsWith('word/media/'))) {
  throw new Error('DOCX is missing the embedded regression image');
}

console.log(JSON.stringify({
  bytes: buffer.length,
  elapsedMs: Date.now() - startedAt,
  equations: (documentXml.match(/<m:oMath/g) || []).length,
  footnotes: true,
  images: zip.getEntries().filter((entry) => entry.entryName.startsWith('word/media/')).length,
  ok: true,
}));
