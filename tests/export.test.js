import { describe, expect, it } from 'vitest';
import {
  ExportHttpError,
  buildExportUrl,
  classifyExportError,
  exportErrorMessage,
  requestDocx,
} from '../src/lib/export';
import { normalizeMathForExport } from '../src/lib/markdown';

describe('Word export math compatibility', () => {
  it('normalizes backslash math in the upload sent to older converters', async () => {
    const markdown = String.raw`Inline \( x^2 \), $y^2$, and \[\frac{1}{2}\].`;
    let uploaded;
    const blob = await requestDocx(markdown, {
      fetchRef: async (_url, options) => {
        uploaded = await options.body.get('file').text();
        return new Response('PK-test-docx');
      },
    });

    expect(uploaded).toBe(String.raw`Inline $x^2$, $y^2$, and $$\frac{1}{2}$$.`);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('normalizes multiline math and table math while preserving code and escapes', () => {
    const markdown = [
      String.raw`\[`, String.raw`\frac{1}{2}`, String.raw`\]`, '',
      '| Formula |', '| --- |', String.raw`| \( |x| \) |`, '',
      '`\\(literal\\)` and ``\\[literal\\]``', '',
      '```latex', String.raw`\[literal\]`, '```', '',
      '~~~latex', String.raw`\(literal\)`, '~~~', '',
      '    \\(literal\\)', '',
      String.raw`\\(escaped\\) and \(unclosed`,
    ].join('\n');
    const normalized = normalizeMathForExport(markdown);

    expect(normalized).toContain(String.raw`$$\frac{1}{2}$$`);
    expect(normalized).toContain('| $|x|$ |');
    expect(normalized).toContain('`\\(literal\\)` and ``\\[literal\\]``');
    expect(normalized).toContain('```latex\n\\[literal\\]\n```');
    expect(normalized).toContain('~~~latex\n\\(literal\\)\n~~~');
    expect(normalized).toContain('    \\(literal\\)');
    expect(normalized).toContain(String.raw`\\(escaped\\) and \(unclosed`);
  });

  it('preserves code inside list and quote containers, CRLF, and existing dollar math', () => {
    const markdown = [
      '> ```latex', String.raw`> \(literal\)`, '> ```', '',
      '- Code:', '', '      \\[literal\\]', '',
      String.raw`$\text{\(literal\)}$`, '',
      String.raw`\(x\)`,
    ].join('\r\n');
    const normalized = normalizeMathForExport(markdown);

    expect(normalized).toBe(markdown.replace(String.raw`\(x\)`, '$x$'));
  });
});

describe('Word export errors', () => {
  it('builds template URLs without string concatenation', () => {
    expect(buildExportUrl('acm')).toContain('?template=acm');
    expect(buildExportUrl(null)).not.toContain('template=');
    expect(buildExportUrl(null)).toBe('http://localhost/api/convert');
  });

  it.each([
    [new ExportHttpError(400), true, 'bad_request'],
    [new ExportHttpError(429), true, 'rate_limited'],
    [new ExportHttpError(503), true, 'server_error'],
    [Object.assign(new Error(), { name: 'AbortError' }), true, 'timeout'],
    [new TypeError('Failed to fetch'), false, 'offline'],
  ])('classifies failures without exposing server messages', (error, online, expected) => {
    const kind = classifyExportError(error, online);
    expect(kind).toBe(expected);
    expect(exportErrorMessage(kind)).toBeTruthy();
    if (error.message) expect(exportErrorMessage(kind)).not.toContain(error.message);
  });
});
