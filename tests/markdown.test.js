import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createMarkdownRenderer } from '../src/lib/markdown';

const fixture = readFileSync(new URL('./fixtures/complex-document.md', import.meta.url), 'utf8');

describe('TeX backslash math delimiters', () => {
  it('renders mixed dollar and backslash delimiters with the correct display modes', () => {
    const html = createMarkdownRenderer().render(String.raw`Inline \(x^2\), $y^2$, display \[z^2\] and $$w^2$$.`);

    expect(html.match(/<math\b/g)).toHaveLength(4);
    expect(html.match(/display="block"/g)).toHaveLength(2);
    expect(html).toContain('<msup><mi>x</mi><mn>2</mn></msup>');
    expect(html).not.toContain('\\(');
    expect(html).not.toContain('\\[');
  });

  it('keeps multiline display equations intact across blank lines and Markdown syntax', () => {
    const html = createMarkdownRenderer().render(String.raw`Before
\[
\begin{aligned}
x_1 &= \frac{1}{2} \\

x_2 &= \sqrt{4}
\end{aligned}
\]
After`);

    expect(html.match(/<math\b/g)).toHaveLength(1);
    expect(html).toContain('display="block"');
    expect(html).toContain('<mtable');
    expect(html).toContain('<mfrac><mn>1</mn><mn>2</mn></mfrac>');
    expect(html).toContain('Before');
    expect(html).toContain('After');
    expect(html).not.toContain('tml-error');
  });

  it.each([
    String.raw`\[x^2\]`,
    String.raw`> \[
> x^2
> \]`,
    String.raw`- Equation:

  \[
  x^2
  \]`,
  ])('renders standalone display equations in document containers: %s', (markdown) => {
    const html = createMarkdownRenderer().render(markdown);
    expect(html.match(/<math\b/g)).toHaveLength(1);
    expect(html).toContain('display="block"');
    expect(html).not.toContain('tml-error');
  });

  it('preserves prose following a display equation on the same line', () => {
    const html = createMarkdownRenderer().render(String.raw`\[x^2\] is the result.`);
    expect(html).toContain('<math display="block"');
    expect(html).toContain(' is the result.');
  });

  it('protects vertical bars in both backslash math formats inside pipe tables', () => {
    const html = createMarkdownRenderer().render(String.raw`| Inline | Display |
| --- | --- |
| \(f(x) = |x|\) | \[|A| = \frac{a}{b}\] |`);

    expect(html.match(/<td\b/g)).toHaveLength(2);
    expect(html.match(/<math\b/g)).toHaveLength(2);
    expect(html).toContain('<mfrac><mi>a</mi><mi>b</mi></mfrac>');
  });

  it('continues to render backslash math in HTML tables', () => {
    const html = createMarkdownRenderer().render(String.raw`<table><tr><td>\(x^2\)</td><td>\[y^2\]</td></tr></table>`);
    expect(html.match(/<math\b/g)).toHaveLength(2);
    expect(html.match(/display="block"/g)).toHaveLength(1);
  });

  it('leaves code spans, fenced code, and indented code literal', () => {
    const markdown = [
      '`\\(x^2\\)` and `\\[y^2\\]`',
      '',
      '```latex',
      '\\[',
      'x^2',
      '\\]',
      '```',
      '',
      '    \\[x^2\\]',
    ].join('\n');
    const html = createMarkdownRenderer().render(markdown);

    expect(html).not.toContain('<math');
    expect(html).toContain('<code>\\(x^2\\)</code>');
    expect(html).toContain('<code>\\[y^2\\]</code>');
    expect(html.match(/<pre>/g)).toHaveLength(2);
  });

  it('does not recognize escaped, empty, or unmatched delimiters as equations', () => {
    const html = createMarkdownRenderer().render(String.raw`\\(literal\\) and \\[literal\\]

\( \) and \[ \]

\(unclosed

\[
unclosed

## Still a heading`);

    expect(html).not.toContain('<math');
    expect(html).toContain('\\(literal\\)');
    expect(html).toContain('<h2>Still a heading</h2>');
  });

  it('skips escaped closing delimiters within a formula', () => {
    const tokens = createMarkdownRenderer().parseInline(String.raw`\(x \\) + y\)`, {});
    const math = tokens[0].children.find((token) => token.type === 'math_inline');
    expect(math.content).toBe(String.raw`x \\) + y`);
  });
});

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

  it('preserves Malayalam, fractions, and currency signs in MathML', () => {
    const html = createMarkdownRenderer().render('$മലയാളം + \\frac{1}{2} + \\$100$');

    expect(html.replace(/<[^>]+>/gu, '')).toContain('മലയാളം');
    expect(html).toContain('<mfrac><mn>1</mn><mn>2</mn></mfrac>');
    expect(html).toContain('<mi>$</mi>');
  });

  it('renders complex HTML tables with embedded formulas, fractions, matrices, and alignment', () => {
    const markdown = `
<table border="1">
  <thead>
    <tr>
      <th align="left">Name</th>
      <th align="center">Formula</th>
      <th align="right">Matrix</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td valign="top">Einstein</td>
      <td align="center">$E = mc^2$</td>
      <td align="right">$$\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}$$</td>
    </tr>
    <tr>
      <td valign="middle" colspan="1">Fraction</td>
      <td align="center">$\\frac{\\sqrt{x + 1}}{y^2}$</td>
      <td align="right">$$\\begin{matrix} a & b \\\\ c & d \\end{matrix}$$</td>
    </tr>
  </tbody>
</table>
`;
    const html = createMarkdownRenderer().render(markdown);

    expect(html).toContain('class="table-wrapper"');
    expect(html).toContain('<table border="1">');
    expect(html).toContain('align="center"');
    expect(html).toContain('align="right"');
    expect(html).toContain('valign="top"');
    expect(html).toContain('colspan="1"');

    // Formulas inside cells converted to MathML
    expect(html).toContain('<math');
    expect(html).toContain('<mfrac><msqrt><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow></msqrt><msup><mi>y</mi><mn>2</mn></msup></mfrac>');
    expect(html).toContain('<mtable');
    expect(html).not.toContain('$E = mc^2$');
    expect(html).not.toContain('$$\\begin{pmatrix}');
  });

  it('renders pipe tables with display math, matrices, fractions, and vertical bars without breaking columns', () => {
    const markdown = `
| Function | Formula | Matrix |
| :--- | :---: | ---: |
| Absolute | $f(x) = |x|$ | $\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}$ |
| Determinant | $|A| = \\left| \\frac{a}{b} \\right|$ | $$\\begin{matrix} x & y \\\\ z & w \\end{matrix}$$ |
`;
    const html = createMarkdownRenderer().render(markdown);

    expect(html).toContain('class="table-wrapper"');
    expect(html).toContain('style="text-align:left"');
    expect(html).toContain('style="text-align:center"');
    expect(html).toContain('style="text-align:right"');

    // Both rows must have all 3 columns intact (not broken by | in math)
    const rowMatches = html.match(/<tr>/g);
    expect(rowMatches).toHaveLength(3); // 1 header row + 2 data rows
    const cellMatches = html.match(/<td\b/g);
    expect(cellMatches).toHaveLength(6); // 2 rows * 3 columns

    // Formulas converted to MathML
    expect(html).toContain('<mfrac><mi>a</mi><mi>b</mi></mfrac>');
    expect(html).not.toContain('$f(x) = |x|$');
  });
});
