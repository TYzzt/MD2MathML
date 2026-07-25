import { describe, expect, it } from 'vitest';
import {
  ExportHttpError,
  buildExportUrl,
  classifyExportError,
  exportErrorMessage,
} from '../src/lib/export';

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
