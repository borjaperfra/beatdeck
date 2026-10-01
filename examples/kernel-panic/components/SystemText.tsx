import { Fragment } from 'react';

/** Renders "≠" (missing from the local Roboto subsets) as an inline SVG so no fallback font ever shows. */
export function SystemText({ text }: { text: string }) {
  const parts = text.split('≠');
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <svg width="0.62em" height="0.7em" viewBox="0 0 62 70" style={{ verticalAlign: '-0.05em' }} aria-label="≠">
              <path d="M6 27h50M6 45h50M44 8L18 62" fill="none" stroke="currentColor" strokeWidth="6" />
            </svg>
          )}
          {p}
        </Fragment>
      ))}
    </>
  );
}
