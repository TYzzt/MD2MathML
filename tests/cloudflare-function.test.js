import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequestOptions, onRequestPost } from '../functions/api/convert';

afterEach(() => vi.unstubAllGlobals());

describe('Cloudflare export proxy', () => {
  it('forwards document streams without reading their content', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('docx-bytes', {
      headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      status: 200,
    }));
    vi.stubGlobal('fetch', fetchMock);
    const request = new Request('https://example.test/api/convert?template=acm&ignored=secret', {
      body: 'multipart-body',
      headers: { 'Content-Type': 'multipart/form-data; boundary=test' },
      method: 'POST',
    });

    const response = await onRequestPost({ env: {}, request });
    const [target, options] = fetchMock.mock.calls[0];

    expect(target.toString()).toBe('https://markdown-to-word-converter.fly.dev/convert?template=acm');
    expect(options.body).toBe(request.body);
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Expose-Headers')).toBe(
      'Content-Disposition, Content-Length, Content-Type',
    );
  });

  it('rejects oversized requests before contacting the upstream', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const request = new Request('https://example.test/api/convert', {
      body: 'x',
      headers: { 'Content-Length': String(11 * 1024 * 1024) },
      method: 'POST',
    });

    const response = await onRequestPost({ env: {}, request });
    expect(response.status).toBe(413);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('answers preflight without exposing an upstream', () => {
    const response = onRequestOptions();
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
  });
});
