import ReactGA from 'react-ga4';

const EVENT_NAMES = new Set([
  'docx_export_failure',
  'docx_export_start',
  'docx_export_success',
  'export_feedback',
  'feedback_open',
  'feedback_submit',
  'file_import',
  'formula_copy',
  'markdown_copy',
  'paragraph_copy',
  'support_open',
]);

const ALLOWED_VALUES = {
  error_kind: new Set(['bad_request', 'offline', 'rate_limited', 'server_error', 'timeout', 'unknown']),
  method: new Set(['clipboard_api', 'exec_command']),
  result: new Set(['needs_work', 'ready']),
  size_bucket: new Set(['empty', 'large', 'medium', 'small', 'very_large']),
  source: new Set(['context_menu', 'file', 'keyboard', 'manual', 'pointer', 'post_export']),
  template: new Set(['acm', 'default']),
};

export function documentSizeBucket(length) {
  if (!length) return 'empty';
  if (length < 2_000) return 'small';
  if (length < 20_000) return 'medium';
  if (length < 100_000) return 'large';
  return 'very_large';
}

export function sanitizeAnalyticsParameters(parameters = {}) {
  return Object.fromEntries(
    Object.entries(parameters).filter(([key, value]) => ALLOWED_VALUES[key]?.has(value)),
  );
}

export function trackEvent(name, parameters = {}) {
  if (!EVENT_NAMES.has(name)) return false;

  ReactGA.event(name, sanitizeAnalyticsParameters(parameters));
  return true;
}
