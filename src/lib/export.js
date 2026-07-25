export const DEFAULT_EXPORT_ENDPOINT = '/api/convert';
const EXPORT_TIMEOUT_MS = 60_000;

export class ExportHttpError extends Error {
  constructor(status) {
    super(`Export service returned HTTP ${status}`);
    this.name = 'ExportHttpError';
    this.status = status;
  }
}

export function buildExportUrl(template, endpoint = DEFAULT_EXPORT_ENDPOINT) {
  const url = new URL(endpoint, globalThis.location?.origin || 'http://localhost');
  if (template) url.searchParams.set('template', template);
  return url.toString();
}

export function classifyExportError(error, online = globalThis.navigator?.onLine !== false) {
  if (!online) return 'offline';
  if (error?.name === 'AbortError' || error?.name === 'TimeoutError') return 'timeout';
  if (error instanceof ExportHttpError) {
    if (error.status === 400 || error.status === 413 || error.status === 422) return 'bad_request';
    if (error.status === 429) return 'rate_limited';
    if (error.status >= 500) return 'server_error';
  }
  if (error instanceof TypeError) return 'server_error';
  return 'unknown';
}

export function exportErrorMessage(errorKind) {
  const messages = {
    bad_request: 'This document could not be converted. Check unsupported LaTeX or large embedded files.',
    offline: 'You appear to be offline. Reconnect and try the Word export again.',
    rate_limited: 'The export service is busy. Wait a moment and try again.',
    server_error: 'The Word export service is unavailable. Your draft is safe in this browser.',
    timeout: 'The export took too long. Try again or export a smaller document.',
    unknown: 'Word export failed. Your draft is safe in this browser.',
  };
  return messages[errorKind] || messages.unknown;
}

export async function requestDocx(
  markdown,
  {
    endpoint = DEFAULT_EXPORT_ENDPOINT,
    fetchRef = globalThis.fetch,
    template = null,
    timeoutMs = EXPORT_TIMEOUT_MS,
  } = {},
) {
  const file = new File([markdown], 'content.md', { type: 'text/markdown' });
  const formData = new FormData();
  formData.append('file', file);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchRef(buildExportUrl(template, endpoint), {
      body: formData,
      method: 'POST',
      signal: controller.signal,
    });
    if (!response.ok) throw new ExportHttpError(response.status);

    const blob = await response.blob();
    if (!blob.size) throw new Error('Export service returned an empty document');
    return blob;
  } finally {
    clearTimeout(timeout);
  }
}

export function downloadDocx(blob, template, documentRef = globalThis.document, urlRef = globalThis.URL) {
  const downloadUrl = urlRef.createObjectURL(blob);
  const anchor = documentRef.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = template ? `${template}.docx` : 'document.docx';
  documentRef.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  urlRef.revokeObjectURL(downloadUrl);
}
