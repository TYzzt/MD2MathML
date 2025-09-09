import { useState, useEffect, useRef } from 'react';
import FeedbackButton from './FeedbackButton';
import SupportUs from './SupportUs';
import './SupportUs.css';
import MarkdownIt from 'markdown-it';
import temml from '@traeblain/markdown-it-temml';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import './App.css';

const initialMarkdown = `# Welcome to Markdown Previewer
# 欢迎使用 Markdown 预览器

This editor supports **Markdown** and **LaTeX** math formulas.
本编辑器支持 **Markdown** 和 **LaTeX** 数学公式。

Right-click on any rendered formula to copy its **MathML** code, ready to be pasted into Microsoft Word as an editable equation.
在渲染出的公式上右键点击，可将其 **MathML** 代码复制到剪贴板，并直接粘贴到 Microsoft Word 中作为可编辑的公式。

Or, upload a Markdown file using the button above.
或者，使用上方的按钮上传 Markdown 文件。

## Math Examples
## 数学公式示例

Inline formula 行内公式： $E=mc^2$

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

const proxy = (tokens, idx, options, env, self) => self.renderToken(tokens, idx, options);
const defaultParagraphRenderer = md.renderer.rules.paragraph_open || proxy;

md.renderer.rules.paragraph_open = (tokens, idx, options, env, self) => {
    const p = defaultParagraphRenderer(tokens, idx, options, env, self);
    return `
    <div class="paragraph-container">
        <button class="copy-btn" title="Copy paragraph">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3z"/>
            </svg>
        </button>
        ${p}`;
};

const defaultParagraphCloseRenderer = md.renderer.rules.paragraph_close || proxy;
md.renderer.rules.paragraph_close = (tokens, idx, options, env, self) => {
    return `${defaultParagraphCloseRenderer(tokens, idx, options, env, self)}</div>`;
};

function App() {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [html, setHtml] = useState('');
  const [copyNotification, setCopyNotification] = useState({ visible: false, text: '' });
  const [showSupportUs, setShowSupportUs] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);
  const moreMenuRef = useRef(null);

  useEffect(() => {
    const renderedHtml = md.render(markdown);
    setHtml(renderedHtml);
  }, [markdown]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const fallbackCopy = (textToCopy, successMessage, failureMessage) => {
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;

    // Make the textarea out of sight
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';

    document.body.appendChild(textArea);

    // Specific selection logic for Safari / iOS
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textArea.setSelectionRange(0, 999999);
    } else {
        textArea.select();
    }

    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed', err);
    }

    if (success) {
      showNotification(successMessage);
    } else {
      showNotification(failureMessage);
    }

    document.body.removeChild(textArea);
  };

  const handlePreviewContextMenu = (event) => {
    const target = event.target;
    const mathElement = target.closest('math');

    if (mathElement) {
      event.preventDefault();
      const mathClone = mathElement.cloneNode(true);
      mathClone.setAttribute('xmlns', 'http://www.w3.org/1998/Math/MathML');
      const mathml = mathClone.outerHTML;
      const successMessage = 'MathML copied to clipboard!';
      const failureMessage = 'Failed to copy MathML.';

      // Modern API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mathml).then(() => {
          showNotification(successMessage);
        }).catch(err => {
          // If modern API fails, it could be a permission issue.
          // Fallback to the old method just in case.
          console.error('Failed to copy MathML using modern API: ', err);
          fallbackCopy(mathml, successMessage, failureMessage);
        });
      } else {
        fallbackCopy(mathml, successMessage, failureMessage);
      }
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

  const handleDownloadDocx = async (template = null) => {
    // a. Get the current Markdown content from the markdown state.
    const content = markdown;
    if (!content) {
      alert('Markdown content is empty.');
      return;
    }

    setIsDownloading(true);

    try {
      // b. Create a File object from the content.
      const file = new File([content], "content.md", { type: "text/markdown" });

      // c. Use FormData to prepare the file for the POST request.
      const formData = new FormData();
      formData.append('file', file);

      // d. Use the fetch API to send the request.
      let url = 'https://markdown-to-word-converter.fly.dev/convert';
      if (template) {
        url += `?template=${template}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // e. Handle the API response by creating a blob.
      const blob = await response.blob();

      // f. Create a temporary link to trigger the download.
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      // g. Set the download attribute.
      a.download = template ? `${template}.docx` : 'document.docx';
      document.body.appendChild(a);
      a.click();

      // h. Clean up.
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download the document. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRemoveCitations = () => {
    const citationRegex = /\[cite_start\]|\[cite_end\]|\[cite:\s*[\d-]+(,\s*[\d-]+)*\]/g;
    const cleanedMarkdown = markdown.replace(citationRegex, '');
    setMarkdown(cleanedMarkdown);
    setShowMoreMenu(false);
  };

  const handleCopyClick = (event) => {
    const button = event.target.closest('.copy-btn');
    if (button) {
      const container = button.closest('.paragraph-container');
      if (container) {
        const paragraph = container.querySelector('p');
        if (paragraph) {
          const textToCopy = paragraph.innerText;
          const successMessage = 'Paragraph copied to clipboard!';
          const failureMessage = 'Failed to copy paragraph.';
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(() => {
              showNotification(successMessage);
            }).catch(err => {
              console.error('Failed to copy text: ', err);
              fallbackCopy(textToCopy, successMessage, failureMessage);
            });
          } else {
            fallbackCopy(textToCopy, successMessage, failureMessage);
          }
        }
      }
    }
  };

  const handleCopyMarkdown = () => {
    const successMessage = 'Markdown copied to clipboard!';
    const failureMessage = 'Failed to copy markdown.';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(markdown).then(() => {
        showNotification(successMessage);
      }).catch(err => {
        console.error('Failed to copy markdown: ', err);
        fallbackCopy(markdown, successMessage, failureMessage);
      });
    } else {
      fallbackCopy(markdown, successMessage, failureMessage);
    }
  };

  return (
    <div className="app-container">
      <SupportUs show={showSupportUs} onClose={() => setShowSupportUs(false)} />
      {copyNotification.visible && (
        <div className="copy-notification">
          {copyNotification.text}
        </div>
      )}
      <header className="app-header">
        <div className="header-content">
          <h1>Markdown Previewer with MathML</h1>
          <div className="header-actions">
            <button className="upload-btn" onClick={() => setShowSupportUs(true)}>
              Support Us
            </button>
            <button className="upload-btn" onClick={handleUploadClick}>
              Upload .md File
            </button>
            <button className="upload-btn" onClick={() => handleDownloadDocx()} disabled={isDownloading}>
              {isDownloading ? 'Downloading...' : 'Download as .docx'}
            </button>
            <button className="upload-btn" onClick={handleCopyMarkdown}>
              Copy Markdown
            </button>
            <div className="more-menu-container" ref={moreMenuRef}>
              <button className="upload-btn" onClick={() => setShowMoreMenu(!showMoreMenu)}>
                More
              </button>
              {showMoreMenu && (
                <div className="more-menu">
                  <button className="menu-item" onClick={handleRemoveCitations}>
                    Remove Citations
                  </button>
                  <button className="menu-item" onClick={() => handleDownloadDocx('acm')}>
                    Download acm.docx
                  </button>
                </div>
              )}
            </div>
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
        <div className="preview-pane" onContextMenu={handlePreviewContextMenu} onClick={handleCopyClick}>
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
