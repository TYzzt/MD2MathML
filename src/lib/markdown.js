import MarkdownIt from 'markdown-it';
import footnote from 'markdown-it-footnote';
import temml from '@traeblain/markdown-it-temml';
import temmlCore from 'temml';
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

function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cleanLatex(raw) {
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function renderMathString(latex, displayMode) {
  const cleaned = cleanLatex(latex);
  if (!cleaned) return '';
  try {
    return temmlCore.renderToString(cleaned, { displayMode });
  } catch (error) {
    return `<span class="tml-error" title="${escapeHtml(error.toString())}">${escapeHtml(cleaned)}</span>`;
  }
}

function convertMathInText(text) {
  // 1. Display math $$...$$
  let result = text.replace(/(?<!\\)\$\$([\s\S]+?)(?<!\\)\$\$/g, (_, math) => renderMathString(math, true));
  // 2. Display math \[...\]
  result = result.replace(/\\\[([\s\S]+?)\\\]/g, (_, math) => renderMathString(math, true));
  // 3. Bare LaTeX environments
  result = result.replace(/(\\begin\{(?:pmatrix|bmatrix|vmatrix|Vmatrix|matrix|aligned|align\*?|cases|array|split)\}[\s\S]+?\\end\{(?:pmatrix|bmatrix|vmatrix|Vmatrix|matrix|aligned|align\*?|cases|array|split)\})/g, (_, math) => renderMathString(math, true));
  // 4. Inline math \(...\)
  result = result.replace(/\\\(([\s\S]+?)\\\)/g, (_, math) => renderMathString(math, false));
  // 5. Inline math $...$
  result = result.replace(/(?<!\\)\$([^\s$\n\r](?:[^$\n\r]*?[^\s\\$\n\r])?)\$(?!\d)/g, (_, math) => renderMathString(math, false));
  return result;
}

function convertMathInHtmlCells(html) {
  const cellRegex = /(<(?:td|th|caption)\b[^>]*>)([\s\S]*?)(<\/(?:td|th|caption)>)/gi;
  return html.replace(cellRegex, (match, openTag, inner, closeTag) => {
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9:-]*)\b[^>]*>|<!--[\s\S]*?-->/g;
    let result = '';
    let lastIndex = 0;
    let m;
    while ((m = tagRegex.exec(inner)) !== null) {
      if (m.index > lastIndex) {
        result += convertMathInText(inner.slice(lastIndex, m.index));
      }
      result += m[0];
      lastIndex = tagRegex.lastIndex;
    }
    if (lastIndex < inner.length) {
      result += convertMathInText(inner.slice(lastIndex));
    }
    return openTag + result + closeTag;
  });
}

function processHtmlTables(html) {
  const openRegex = /<table\b[^>]*>/gi;
  const closeRegex = /<\/table>/gi;
  const tags = [];
  let match;
  while ((match = openRegex.exec(html)) !== null) {
    tags.push({ type: 'open', index: match.index, length: match[0].length });
  }
  while ((match = closeRegex.exec(html)) !== null) {
    tags.push({ type: 'close', index: match.index, length: match[0].length });
  }
  if (!tags.length) return html;

  tags.sort((a, b) => a.index - b.index);

  const ranges = [];
  let depth = 0;
  let start = -1;
  for (const tag of tags) {
    if (tag.type === 'open') {
      if (depth === 0) start = tag.index;
      depth++;
    } else if (tag.type === 'close') {
      depth--;
      if (depth === 0 && start !== -1) {
        ranges.push({ start, end: tag.index + tag.length });
        start = -1;
      }
    }
  }

  if (!ranges.length) {
    return convertMathInHtmlCells(html);
  }

  let result = '';
  let lastEnd = 0;
  for (const { start: rangeStart, end: rangeEnd } of ranges) {
    result += html.slice(lastEnd, rangeStart);
    const tableHtml = html.slice(rangeStart, rangeEnd);
    const processed = convertMathInHtmlCells(tableHtml);

    const before = html.slice(Math.max(0, rangeStart - 40), rangeStart);
    const isAlreadyWrapped = /<div\s+class=["'][^"']*table-wrapper[^"']*["']\s*>\s*$/i.test(before);
    if (isAlreadyWrapped) {
      result += processed;
    } else {
      result += `<div class="table-wrapper">${processed}</div>`;
    }
    lastEnd = rangeEnd;
  }
  result += html.slice(lastEnd);
  return result;
}

function isValidDelim(src, pos, max) {
  const prevChar = pos > 0 ? src.charCodeAt(pos - 1) : -1;
  const nextChar = pos < max ? src.charCodeAt(pos) : -1;
  let can_open = true;
  let can_close = true;

  if (prevChar === 0x20 || prevChar === 0x09 || (nextChar >= 0x30 && nextChar <= 0x39)) {
    can_close = false;
  }
  if (nextChar === 0x20 || nextChar === 0x09) {
    can_open = false;
  }
  return { can_open, can_close };
}

function enhancedMathInline(state, silent) {
  if (state.src.charCodeAt(state.pos) !== 0x24 /* $ */) {
    return false;
  }

  const max = state.posMax;
  const start = state.pos;
  const isDouble = (start + 1 < max && state.src.charCodeAt(start + 1) === 0x24);
  const delimLength = isDouble ? 2 : 1;

  if (!isDouble) {
    const res = isValidDelim(state.src, start + 1, max);
    if (!res.can_open) {
      if (!silent) state.pending += '$';
      state.pos += 1;
      return true;
    }
  }

  let match = start + delimLength;
  let found = false;

  while (match < max) {
    if (state.src.charCodeAt(match) === 0x24) {
      let pos = match - 1;
      while (pos >= start && state.src.charCodeAt(pos) === 0x5C) {
        pos--;
      }
      if ((match - 1 - pos) % 2 === 0) {
        if (isDouble) {
          if (match + 1 < max && state.src.charCodeAt(match + 1) === 0x24) {
            found = true;
            break;
          }
        } else {
          const res = isValidDelim(state.src, match, max);
          if (res.can_close) {
            found = true;
            break;
          }
        }
      }
    }
    match++;
  }

  if (!found) {
    if (!silent) state.pending += isDouble ? '$$' : '$';
    state.pos = start + delimLength;
    return true;
  }

  const content = state.src.slice(start + delimLength, match);
  if (!content.trim()) {
    if (!silent) state.pending += isDouble ? '$$' : '$';
    state.pos = match + delimLength;
    return true;
  }

  if (!silent) {
    const token = state.push(isDouble ? 'math_display_inline' : 'math_inline', 'math', 0);
    token.markup = isDouble ? '$$' : '$';
    token.content = content;
  }
  state.pos = match + delimLength;
  return true;
}

export function createMarkdownRenderer() {
  const renderer = new MarkdownIt({
    html: true,
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

  renderer.inline.ruler.at('math_inline', enhancedMathInline);

  renderer.core.ruler.before('block', 'protect_table_math', (state) => {
    state.src = state.src.replace(/^.*\|.*$/gm, (line) => {
      return line.replace(/(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g, (math) => {
        return math.replace(/(?<!\\)\|/g, '\uE000');
      });
    });
  });

  renderer.core.ruler.before('inline', 'restore_table_math', (state) => {
    for (const token of state.tokens) {
      if (token.content && token.content.includes('\uE000')) {
        token.content = token.content.replaceAll('\uE000', '|');
      }
    }
  });

  renderer.renderer.rules.math_display_inline = (tokens, idx) => {
    return renderMathString(tokens[idx].content, true);
  };

  const proxy = (tokens, idx, options, env, self) => self.renderToken(tokens, idx, options);
  const defaultParagraphOpen = renderer.renderer.rules.paragraph_open || proxy;
  const defaultParagraphClose = renderer.renderer.rules.paragraph_close || proxy;

  renderer.renderer.rules.paragraph_open = (tokens, idx, options, env, self) => {
    if (tokens[idx].level === 0) {
      return `
    <div class="paragraph-container">
      <button class="copy-paragraph-button" type="button" aria-label="Copy paragraph">Copy</button>
      ${defaultParagraphOpen(tokens, idx, options, env, self)}`;
    }
    return defaultParagraphOpen(tokens, idx, options, env, self);
  };

  renderer.renderer.rules.paragraph_close = (tokens, idx, options, env, self) => {
    if (tokens[idx].level === 0) {
      return `${defaultParagraphClose(tokens, idx, options, env, self)}</div>`;
    }
    return defaultParagraphClose(tokens, idx, options, env, self);
  };

  const defaultTableOpen = renderer.renderer.rules.table_open || proxy;
  const defaultTableClose = renderer.renderer.rules.table_close || proxy;

  renderer.renderer.rules.table_open = (tokens, idx, options, env, self) =>
    `<div class="table-wrapper">${defaultTableOpen(tokens, idx, options, env, self)}`;

  renderer.renderer.rules.table_close = (tokens, idx, options, env, self) =>
    `${defaultTableClose(tokens, idx, options, env, self)}</div>`;

  const defaultHtmlBlock = renderer.renderer.rules.html_block || ((tokens, idx) => tokens[idx].content);
  const defaultHtmlInline = renderer.renderer.rules.html_inline || ((tokens, idx) => tokens[idx].content);

  renderer.renderer.rules.html_block = (tokens, idx, options, env, self) => {
    const content = defaultHtmlBlock(tokens, idx, options, env, self);
    return processHtmlTables(content);
  };

  renderer.renderer.rules.html_inline = (tokens, idx, options, env, self) => {
    const content = defaultHtmlInline(tokens, idx, options, env, self);
    return processHtmlTables(content);
  };

  return renderer;
}

export const markdownRenderer = createMarkdownRenderer();
