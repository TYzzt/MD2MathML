import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createMarkdownRenderer } from '../src/lib/markdown';

const fixture = readFileSync(new URL('./fixtures/complex-document.md', import.meta.url), 'utf8');

describe('Markdown regression document', () => {
  it('renders formulas as semantic MathML and preserves structured content', () => {
    const html = createMarkdownRenderer().render(fixture);

    expect(html).toContain('<math');
    expect(html.match(/<mtable/g)).toHaveLength(2);
    expect(html).toContain('columnalign="right left"');
    expect(html).toContain('<table>');
    expect(html).toContain('<pre><code class="hljs">');
    expect(html).toContain('copy-paragraph-button');
    expect(html).toContain('footnote-ref');
    expect(html).toContain('<img');
  });
});
