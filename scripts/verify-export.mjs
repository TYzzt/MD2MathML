import { readFile } from 'node:fs/promises';
import process from 'node:process';
import AdmZip from 'adm-zip';

const endpoint = process.env.MD2MATHML_EXPORT_URL || 'https://markdown-to-word-converter.fly.dev/convert';
const fixtureUrl = new URL('../tests/fixtures/complex-document.md', import.meta.url);
const markdown = await readFile(fixtureUrl, 'utf8');
const countOfficeMath = (xml) => (xml.match(/<m:oMath(?:\s[^>]*)?>/g) || []).length;

async function convertDocument(source, filename) {
  const formData = new FormData();
  formData.append('file', new File([source], filename, { type: 'text/markdown' }));
  const startedAt = Date.now();
  const response = await fetch(endpoint, { body: formData, method: 'POST' });
  if (!response.ok) throw new Error(`${filename} export failed with HTTP ${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 1_000 || buffer.subarray(0, 2).toString() !== 'PK') {
    throw new Error(`${filename} response is not a valid DOCX archive`);
  }

  const zip = new AdmZip(buffer);
  return {
    buffer,
    documentXml: zip.readAsText('word/document.xml'),
    elapsedMs: Date.now() - startedAt,
    zip,
  };
}

const { buffer, documentXml, elapsedMs, zip } = await convertDocument(markdown, 'complex-document.md');
for (const expected of ['<m:oMath', '<w:tbl', 'Conversion regression document']) {
  if (!documentXml.includes(expected)) throw new Error(`DOCX is missing expected content: ${expected}`);
}
const mathMatrices = (documentXml.match(/<m:m>/g) || []).length;
if (
  mathMatrices < 2
  || !documentXml.includes('<m:mcJc m:val="right"')
  || !documentXml.includes('<m:mcJc m:val="left"')
) {
  throw new Error('DOCX is missing the aligned multiline Office Math structure');
}
if (!zip.getEntry('word/footnotes.xml')) throw new Error('DOCX is missing native Word footnotes');
if (!zip.getEntries().some((entry) => entry.entryName.startsWith('word/media/'))) {
  throw new Error('DOCX is missing the embedded regression image');
}

const longParagraph = 'This deterministic paragraph represents a substantial research note with explanatory prose, intermediate results, assumptions, and discussion for collaborators. '.repeat(6);
const longMarkdown = `# Long document regression

${Array.from({ length: 120 }, (_, index) => `## Section ${index + 1}

${longParagraph}

$$
y_{${index + 1}} = \\frac{x_{${index + 1}}}{${index + 2}}
$$`).join('\n\n')}

LONG_DOCUMENT_FINAL_MARKER
`;
const longExport = await convertDocument(longMarkdown, 'long-document.md');
const longEquations = countOfficeMath(longExport.documentXml);
if (!longExport.documentXml.includes('Section 120') || !longExport.documentXml.includes('LONG_DOCUMENT_FINAL_MARKER')) {
  throw new Error('Long DOCX export was truncated before its final section');
}
if (longEquations < 120) throw new Error(`Long DOCX is missing equations: found ${longEquations}`);

console.log(JSON.stringify({
  complexDocument: {
    bytes: buffer.length,
    elapsedMs,
    equations: countOfficeMath(documentXml),
    mathMatrices,
    footnotes: true,
    images: zip.getEntries().filter((entry) => entry.entryName.startsWith('word/media/')).length,
  },
  longDocument: {
    bytes: longExport.buffer.length,
    elapsedMs: longExport.elapsedMs,
    equations: longEquations,
    markdownBytes: Buffer.byteLength(longMarkdown),
    sections: 120,
  },
  ok: true,
}));
