import { useState, useEffect, useRef } from 'react';
import MarkdownIt from 'markdown-it';
import temml from '@traeblain/markdown-it-temml';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import './App.css';

const initialMarkdown = `# Welcome to Markdown Previewer

This editor supports **Markdown** and **LaTeX** math formulas.

Click on any rendered formula to copy its **MathML** code to your clipboard.
Or, upload a Markdown file using the button above.

## Math Examples

Inline formula: $E=mc^2$

Block formula:
$$
f(x) = \\int_{-\\infty}^\\infty
    \\hat f(\\xi)\\,e^{2 \\pi i \\xi x}
    \\,d\\xi
$$

## Code Example
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
      } catch (__) {}
    }
    return `<pre><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`;
  }
}).use(temml);

function App() {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [html, setHtml] = useState('');
  const [copyNotification, setCopyNotification] = useState({ visible: false, text: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    const renderedHtml = md.render(markdown);
    setHtml(renderedHtml);
  }, [markdown]);

  const handleMarkdownChange = (event) => {
    setMarkdown(event.target.value);
  };

  const showNotification = (text) => {
    setCopyNotification({ visible: true, text });
    setTimeout(() => {
      setCopyNotification({ visible: false, text: '' });
    }, 2000);
  };

  const handlePreviewClick = (event) => {
    const target = event.target;
    const mathElement = target.closest('math');

    if (mathElement) {
      const mathml = mathElement.outerHTML;
      navigator.clipboard.writeText(mathml).then(() => {
        showNotification('Copied MathML to clipboard!');
      }).catch(err => {
        console.error('Failed to copy MathML: ', err);
        showNotification('Error: Could not copy.');
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
          <button className="upload-btn" onClick={handleUploadClick}>
            Upload .md File
          </button>
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
        <div className="preview-pane" onClick={handlePreviewClick}>
          <div
            className="preview"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
