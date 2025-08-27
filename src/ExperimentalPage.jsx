import { useState, useEffect, useRef } from 'react';
import MarkdownIt from 'markdown-it';
import temml from '@traeblain/markdown-it-temml';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import './App.css';

const initialMarkdown = `# Welcome to the Experimental Markdown Previewer

This page features an experimental "mixed copy" function.

**How to use:**
1. Select any content in the preview pane below (text, tables, formulas, etc.).
2. Use your system's copy command (Ctrl+C or Cmd+C).
3. Paste directly into a rich text editor like Microsoft Word.

Formulas should remain editable.

## Math Examples

Inline formula: $E=mc^2$

Block formula:
$$
f(x) = \\int_{-\\infty}^\\infty
    \\hat f(\\xi)\\,e^{2 \\pi i \\xi x}
    \\,d\\xi
$$
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

function ExperimentalPage() {
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


  const handleCopy = async (event) => {
    // 检查是否支持 ClipboardItem，Safari 不完全支持
    if (typeof ClipboardItem === "undefined" || !navigator.clipboard.write) {
        showNotification('This browser does not support mixed copy. Please use Chrome or Firefox.');
        return;
    }

    event.preventDefault();
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    try {
      const range = selection.getRangeAt(0);
      const selectedContent = range.cloneContents();
      const tempDiv = document.createElement('div');
      tempDiv.appendChild(selectedContent);

      const mathElements = tempDiv.querySelectorAll('math');
      mathElements.forEach(el => {
        el.setAttribute('xmlns', 'http://www.w3.org/1998/Math/MathML');
      });

      const html = tempDiv.innerHTML;
      const text = tempDiv.innerText;

      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([text], { type: 'text/plain' });

      const clipboardItem = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      });

      await navigator.clipboard.write([clipboardItem]);
      showNotification('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      showNotification('Error: Could not copy.');
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
          <h1>Experimental Markdown Previewer</h1>
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
        <div className="preview-pane" onCopy={handleCopy}>
          <div
            ref={previewRef}
            className="preview markdown-body"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </main>
    </div>
  );
}

export default ExperimentalPage;
