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

  it('renders a long math document without dropping its final section', () => {
    const longMarkdown = Array.from({ length: 120 }, (_, index) => `
## Section ${index + 1}

Repeated research-note content for deterministic long-document coverage. Inline math $x_{${index + 1}}^2$.

$$
y_{${index + 1}} = \\frac{x_{${index + 1}}}{${index + 2}}
$$
`).join('\n');
    const html = createMarkdownRenderer().render(longMarkdown);

    expect(html).toContain('Section 120');
    expect(html.match(/<h2>/g)).toHaveLength(120);
    expect(html.match(/<math/g)).toHaveLength(240);
  });
});
