const DEFAULT_UPSTREAM = 'https://markdown-to-word-converter.fly.dev/convert';
const MAX_CONTENT_LENGTH = 10 * 1024 * 1024;

function upstreamUrl(requestUrl, baseUrl) {
  const incoming = new URL(requestUrl);
  const upstream = new URL(baseUrl || DEFAULT_UPSTREAM);
  const template = incoming.searchParams.get('template');
  if (template === 'acm') upstream.searchParams.set('template', template);
  return upstream;
}

function responseHeaders(upstreamHeaders) {
  const headers = new Headers();
  for (const name of ['content-disposition', 'content-length', 'content-type']) {
    const value = upstreamHeaders.get(name);
    if (value) headers.set(name, value);
  }
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  return headers;
}

export async function onRequestPost(context) {
  const contentLength = Number(context.request.headers.get('content-length') || 0);
  if (contentLength > MAX_CONTENT_LENGTH) {
    return Response.json({ error: 'Document is too large' }, { status: 413 });
  }

  const upstream = await fetch(upstreamUrl(context.request.url, context.env.DOCX_EXPORT_URL), {
    body: context.request.body,
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Type': context.request.headers.get('content-type') || 'application/octet-stream',
    },
    method: 'POST',
    redirect: 'manual',
  });

  return new Response(upstream.body, {
    headers: responseHeaders(upstream.headers),
    status: upstream.status,
  });
}

export function onRequestOptions() {
  return new Response(null, {
    headers: { Allow: 'POST, OPTIONS', 'Cache-Control': 'no-store' },
    status: 204,
  });
}
