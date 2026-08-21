import { describe, expect, it } from 'vitest';
import { shouldShowLandingPage } from '../src/lib/site';

describe('site routing', () => {
  it('shows the marketing page on the apex domain', () => {
    expect(shouldShowLandingPage({ hostname: 'uuuu.site', search: '' })).toBe(true);
  });

  it('keeps the product on the application subdomain', () => {
    expect(shouldShowLandingPage({ hostname: 'md2mathml.uuuu.site', search: '' })).toBe(false);
  });

  it('supports an explicit landing-page preview', () => {
    expect(shouldShowLandingPage({ hostname: '10.0.0.2', search: '?landing=1' })).toBe(true);
  });
});
