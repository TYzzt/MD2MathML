import { describe, expect, it } from 'vitest';
import { documentSizeBucket, sanitizeAnalyticsParameters } from '../src/lib/analytics';

describe('analytics privacy boundary', () => {
  it('uses coarse document size buckets', () => {
    expect(documentSizeBucket(0)).toBe('empty');
    expect(documentSizeBucket(1_999)).toBe('small');
    expect(documentSizeBucket(20_000)).toBe('large');
    expect(documentSizeBucket(100_000)).toBe('very_large');
  });

  it('drops arbitrary values and document-like fields', () => {
    expect(sanitizeAnalyticsParameters({
      content: 'secret thesis text',
      error_kind: 'server_error',
      label: 'could contain content',
      size_bucket: 'medium',
      source: 'made-up-source',
    })).toEqual({ error_kind: 'server_error', size_bucket: 'medium' });
  });
});
