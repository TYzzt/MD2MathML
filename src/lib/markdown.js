import MarkdownIt from 'markdown-it';
import footnote from 'markdown-it-footnote';
import temml from '@traeblain/markdown-it-temml';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';

Object.entries({ bash, css, javascript, json, python, sql, typescript, xml }).forEach(([name, language]) => {
  hljs.registerLanguage(name, language);
});
hljs.registerAliases(['js', 'jsx'], { languageName: 'javascript' });
hljs.registerAliases(['sh', 'shell'], { languageName: 'bash' });
hljs.registerAliases(['html'], { languageName: 'xml' });
hljs.registerAliases(['ts', 'tsx'], { languageName: 'typescript' });

export const initialMarkdown = `# AI or Markdown to editable Word

Paste Markdown from ChatGPT, Claude, Gemini, or your notes. Preview it here, then download a Word document with native, editable equations.

## Equations stay editable

Inline formula: $E=mc^2$

$$
f(x) = \\int_{-\\infty}^\\infty
  \\hat f(\\xi)\\,e^{2 \\pi i \\xi x}
  \\,d\\xi
$$

Matrix example:

$$
A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}
$$

## Structured content

| Source | Workflow |
| --- | --- |
| AI chat | Paste the Markdown response |
| Obsidian | Upload or paste a note |
| Markdown file | Use the Upload button |
`;

export function createMarkdownRenderer() {
  const renderer = new MarkdownIt({
    highlight(str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre><code class="hljs">${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
        } catch {
          // Fall through to escaped plain text.
        }
      }
      return `<pre><code class="hljs">${renderer.utils.escapeHtml(str)}</code></pre>`;
    },
  }).use(temml).use(footnote);

  const proxy = (tokens, idx, options, env, self) => self.renderToken(tokens, idx, options);
  const defaultParagraphOpen = renderer.renderer.rules.paragraph_open || proxy;
  const defaultParagraphClose = renderer.renderer.rules.paragraph_close || proxy;

  renderer.renderer.rules.paragraph_open = (tokens, idx, options, env, self) => `
    <div class="paragraph-container">
      <button class="copy-paragraph-button" type="button" aria-label="Copy paragraph">Copy</button>
      ${defaultParagraphOpen(tokens, idx, options, env, self)}`;

  renderer.renderer.rules.paragraph_close = (tokens, idx, options, env, self) =>
    `${defaultParagraphClose(tokens, idx, options, env, self)}</div>`;

  return renderer;
}

export const markdownRenderer = createMarkdownRenderer();
