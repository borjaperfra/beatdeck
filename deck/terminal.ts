/**
 * Every terminal line shown on stage, copied character for character from a real run on this deck.
 * Never retype or "tidy" these in a scene; import them from here.
 */
export const TERM = {
  build: ['$ npm run build', '✓ offline check: dist has no remote references'],
  verify: ['$ npm run verify', '✓ verify · 24 beats walked, 23 walked back, 24 reloaded from the URL · 144s'],
} as const;
