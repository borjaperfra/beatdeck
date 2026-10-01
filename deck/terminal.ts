/**
 * Every terminal line shown on stage, copied character for character from a real run on this deck.
 * Never retype or "tidy" these in a scene; import them from here.
 */
export const TERM = {
  build: ['$ npm run build', '✓ offline check: dist has no remote references'],
  verify: ['$ npm run verify', '✓ verify · 22 beats walked, 21 walked back, 22 reloaded from the URL · 132s'],
} as const;
