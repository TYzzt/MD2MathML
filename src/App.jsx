import { useState, useEffect, useRef } from 'react';
import FeedbackButton from './FeedbackButton';
import MarkdownIt from 'markdown-it';
import temml from '@traeblain/markdown-it-temml';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import './App.css';

const initialMarkdown = `# Welcome to Markdown Previewer
# 欢迎使用 Markdown 预览器

This editor supports **Markdown** and **LaTeX** math formulas.
本编辑器支持 **Markdown** 和 **LaTeX** 数学公式。

Right-click on any rendered formula to copy its **MathML** code to your clipboard.
在渲染出的公式上右键点击，可将其 **MathML** 代码复制到剪贴板。

Or, upload a Markdown file using the button above.
或者，使用上方的按钮上传 Markdown 文件。

## Math Examples
## 数学公式示例

Inline formula: $E=mc^2$
行内公式：$E=mc^2$

Block formula:
块级公式：
$$
f(x) = \\int_{-\\infty}^\\infty
    \\hat f(\\xi)\\,e^{2 \\pi i \\xi x}
    \\,d\\xi
$$

## Code Example
## 代码示例
\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`
`;

const md = new MarkdownIt({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre><code class="hljs">${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
      } catch (e) { // eslint-disable-line no-unused-vars
        // ignore highlight errors
      }
    }
    return `<pre><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`;
  }
}).use(temml);

function App() {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [html, setHtml] = useState('');
  const [copyNotification, setCopyNotification] = useState({ visible: false, text: '' });
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    const renderedHtml = md.render(markdown);
    setHtml(renderedHtml);
  }, [markdown]);

  useEffect(() => {
    if (previewRef.current) {
      const mathElements = previewRef.current.querySelectorAll('math');
      mathElements.forEach(el => {
        el.setAttribute('title', 'Right-click to copy MathML');
      });
    }
  }, [html]);

  const handleMarkdownChange = (event) => {
    setMarkdown(event.target.value);
  };

  const showNotification = (text) => {
    setCopyNotification({ visible: true, text });
    setTimeout(() => {
      setCopyNotification({ visible: false, text: '' });
    }, 2000);
  };

  const handlePreviewContextMenu = (event) => {
    const target = event.target;
    const mathElement = target.closest('math');

    if (mathElement) {
      event.preventDefault();
      // Clone the element to avoid modifying the live DOM
      const mathClone = mathElement.cloneNode(true);
      mathClone.setAttribute('xmlns', 'http://www.w3.org/1998/Math/MathML');
      const mathml = mathClone.outerHTML;

      navigator.clipboard.writeText(mathml).then(() => {
        showNotification('MathML copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy MathML: ', err);
        showNotification('Failed to copy MathML.');
      });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMarkdown(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="app-container">
      {copyNotification.visible && (
        <div className="copy-notification">
          {copyNotification.text}
        </div>
      )}
      <header className="app-header">
        <div className="header-content">
          <h1>Markdown Previewer with MathML</h1>
          <div className="header-actions">
            <a href="/experimental.html" className="nav-link">Experimental Page</a>
            <button className="upload-btn" onClick={handleUploadClick}>
              Upload .md File
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".md"
            style={{ display: 'none' }}
          />
        </div>
      </header>
      <main className="main-content">
        <div className="editor-pane">
          <textarea
            className="editor"
            value={markdown}
            onChange={handleMarkdownChange}
            aria-label="Markdown Input"
          />
        </div>
        <div className="preview-pane" onContextMenu={handlePreviewContextMenu}>
          <div
            ref={previewRef}
            className="preview markdown-body"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </main>
      <FeedbackButton />
    </div>
  );
}

export default App;
