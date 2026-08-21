export function shouldShowLandingPage(locationRef = globalThis.location) {
  if (!locationRef) return false;

  return locationRef.hostname === 'uuuu.site'
    || new URLSearchParams(locationRef.search).has('landing');
}
