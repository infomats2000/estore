import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { ADMIN_CONTRAST_PAIRS, contrastRatio } from '../utils/accessibility';

test('admin interface colour pairs meet WCAG contrast thresholds', () => {
  for (const pair of ADMIN_CONTRAST_PAIRS) {
    assert.ok(contrastRatio(pair.foreground, pair.background) >= pair.minimum, `${pair.name} must meet ${pair.minimum}:1 contrast`);
  }
});

test('admin CSS includes readable text, focus visibility, and 200% zoom reflow safeguards', () => {
  const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
  assert.match(css, /font-size:\s*0\.75rem\s*!important/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /outline:\s*3px solid #2563eb/);
  assert.match(css, /max-width:\s*calc\(100vw - 1rem\)/);
  assert.match(css, /max-width:\s*100%/);
});

test('responsive admin CSS covers mobile, portrait tablet, tablet and laptop resolutions', () => {
  const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
  assert.match(css, /max-width:\s*40rem/); // 390px mobile card layout
  assert.match(css, /min-width:\s*48rem/); // 768px portrait tablet
  assert.match(css, /min-width:\s*64rem/); // 1024px tablet/laptop
  assert.match(css, /max-width:\s*85\.375rem/); // 1366px laptop
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /content:\s*attr\(data-label\)/);
});
