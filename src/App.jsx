import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Clipboard,
  Download,
  FileUp,
  Heart,
  MoreHorizontal,
  RefreshCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import MarkdownIt from 'markdown-it';
import temml from '@traeblain/markdown-it-temml';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import FeedbackButton from './FeedbackButton';
import SupportUs from './SupportUs';
import './App.css';

const STORAGE_KEY = 'md2mathml.draft.v1';

const initialMarkdown = `# Markdown + MathML, without the friction

Write Markdown and LaTeX on the left. See the rendered result instantly on the right.

Click any formula to copy its **MathML**, ready to paste into Microsoft Word as an editable equation.

## Math examples

Inline formula: $E=mc^2$

Block formula:

$$
f(x) = \\int_{-\\infty}^\\infty
  \\hat f(\\xi)\\,e^{2 \\pi i \\xi x}
  \\,d\\xi
$$

## Code example

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`
`;

const md = new MarkdownIt({
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre><code class="hljs">${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
      } catch {
        // Fall through to escaped plain text.
      }
    }
    return `<pre><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`;
  },
}).use(temml);

const proxy = (tokens, idx, options, env, self) => self.renderToken(tokens, idx, options);
const defaultParagraphOpen = md.renderer.rules.paragraph_open || proxy;
const defaultParagraphClose = md.renderer.rules.paragraph_close || proxy;

md.renderer.rules.paragraph_open = (tokens, idx, options, env, self) => `
  <div class="paragraph-container">
    <button class="copy-paragraph-button" type="button" aria-label="Copy paragraph">Copy</button>
    ${defaultParagraphOpen(tokens, idx, options, env, self)}`;

md.renderer.rules.paragraph_close = (tokens, idx, options, env, self) =>
  `${defaultParagraphClose(tokens, idx, options, env, self)}</div>`;

function getInitialMarkdown() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || initialMarkdown;
  } catch {
    return initialMarkdown;
  }
}

function App() {
  const [markdown, setMarkdown] = useState(getInitialMarkdown);
  const [html, setHtml] = useState(() => md.render(getInitialMarkdown()));
  const [notification, setNotification] = useState({ visible: false, text: '' });
  const [showSupportUs, setShowSupportUs] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [activePane, setActivePane] = useState('editor');
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);
  const moreMenuRef = useRef(null);
  const notificationTimerRef = useRef(null);

  useEffect(() => {
    setHtml(md.render(markdown));
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, markdown);
      } catch {
        // Editing still works when storage is blocked or full.
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [markdown]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setShowMoreMenu(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!previewRef.current) return;

    const previewElement = previewRef.current;
    const decorateMath = () => {
      previewElement.querySelectorAll('math').forEach((element) => {
        element.setAttribute('title', 'Click to copy MathML');
        element.setAttribute('tabindex', '0');
        element.setAttribute('role', 'button');
        element.setAttribute('aria-label', 'Copy formula as MathML');
      });
    };

    decorateMath();
    const observer = new MutationObserver(decorateMath);
    observer.observe(previewElement, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [html]);

  useEffect(() => () => window.clearTimeout(notificationTimerRef.current), []);

  const showNotification = (text) => {
    window.clearTimeout(notificationTimerRef.current);
    setNotification({ visible: true, text });
    notificationTimerRef.current = window.setTimeout(() => {
      setNotification({ visible: false, text: '' });
    }, 2200);
  };

  const fallbackCopy = (textToCopy, successMessage, failureMessage) => {
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();

    let success = false;
    try {
      success = document.execCommand('copy');
    } catch {
      success = false;
    }
    document.body.removeChild(textArea);
    showNotification(success ? successMessage : failureMessage);
  };

  const copyText = (text, successMessage, failureMessage) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showNotification(successMessage))
        .catch(() => fallbackCopy(text, successMessage, failureMessage));
    } else {
      fallbackCopy(text, successMessage, failureMessage);
    }
  };

  const copyMathElement = (mathElement) => {
    const mathClone = mathElement.cloneNode(true);
    mathClone.removeAttribute('title');
    mathClone.removeAttribute('tabindex');
    mathClone.removeAttribute('role');
    mathClone.removeAttribute('aria-label');
    mathClone.setAttribute('xmlns', 'http://www.w3.org/1998/Math/MathML');
    copyText(mathClone.outerHTML, 'MathML copied', 'Could not copy MathML');
  };

  const handlePreviewInteraction = (event) => {
    const paragraphButton = event.target.closest('.copy-paragraph-button');
    if (paragraphButton) {
      const paragraph = paragraphButton.closest('.paragraph-container')?.querySelector('p');
      if (paragraph) copyText(paragraph.innerText, 'Paragraph copied', 'Could not copy paragraph');
      return;
    }

    const mathElement = event.target.closest('math');
    if (mathElement) copyMathElement(mathElement);
  };

  const handlePreviewKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const mathElement = event.target.closest('math');
    if (!mathElement) return;
    event.preventDefault();
    copyMathElement(mathElement);
  };

  const handlePreviewContextMenu = (event) => {
    const mathElement = event.target.closest('math');
    if (!mathElement) return;
    event.preventDefault();
    copyMathElement(mathElement);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setMarkdown(loadEvent.target.result);
      setActivePane('editor');
      showNotification(`${file.name} loaded`);
    };
    reader.onerror = () => showNotification('Could not read that file');
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleDownloadDocx = async (template = null) => {
    if (!markdown) {
      showNotification('Add some Markdown before exporting');
      return;
    }

    setIsDownloading(true);
    setShowMoreMenu(false);

    try {
      const file = new File([markdown], 'content.md', { type: 'text/markdown' });
      const formData = new FormData();
      formData.append('file', file);

      let url = 'https://markdown-to-word-converter.fly.dev/convert';
      if (template) url += `?template=${template}`;

      const response = await fetch(url, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = template ? `${template}.docx` : 'document.docx';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);
      showNotification('Document downloaded');
    } catch {
      showNotification('Export failed. Please try again');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRemoveCitations = () => {
    setMarkdown((value) => value.replace(/\[(cite\\?_start|cite\\?_end|cite:.*?)\]/g, ''));
    setShowMoreMenu(false);
    showNotification('Citations removed');
  };

  const handleRestoreSample = () => {
    if (markdown !== initialMarkdown && !window.confirm('Replace your current draft with the sample document?')) return;
    setMarkdown(initialMarkdown);
    setShowMoreMenu(false);
    setActivePane('editor');
    showNotification('Sample restored');
  };

  return (
    <div className="app-shell">
      <SupportUs show={showSupportUs} onClose={() => setShowSupportUs(false)} />

      {notification.visible && (
        <div className="toast" role="status" aria-live="polite">
          <Check size={16} />
          {notification.text}
        </div>
      )}

      <header className="app-header">
        <div className="brand" aria-label="MD2MathML">
          <span className="brand-mark" aria-hidden="true">M²</span>
          <div className="brand-copy">
            <strong>MD2MathML</strong>
            <span>Markdown equation workspace</span>
          </div>
        </div>

        <div className="header-actions">
          <button className="button support-button" onClick={() => setShowSupportUs(true)} title="Support MD2MathML">
            <Heart size={17} />
            <span className="button-label">Support</span>
          </button>
          <button className="button secondary-button" onClick={() => fileInputRef.current?.click()} title="Upload Markdown file">
            <FileUp size={17} />
            <span className="button-label">Upload</span>
          </button>
          <button className="button primary-button" onClick={() => handleDownloadDocx()} disabled={isDownloading} title="Export as Word document">
            {isDownloading ? <RefreshCcw className="spin" size={17} /> : <Download size={17} />}
            <span className="button-label">{isDownloading ? 'Exporting' : 'Export .docx'}</span>
          </button>
          <div className="more-menu-container" ref={moreMenuRef}>
            <button
              className="icon-button header-more-button"
              onClick={() => setShowMoreMenu((open) => !open)}
              aria-label="More actions"
              aria-expanded={showMoreMenu}
              title="More actions"
            >
              <MoreHorizontal size={20} />
            </button>
            {showMoreMenu && (
              <div className="more-menu" role="menu">
                <button role="menuitem" onClick={() => {
                  copyText(markdown, 'Markdown copied', 'Could not copy Markdown');
                  setShowMoreMenu(false);
                }}>
                  <Clipboard size={16} />
                  Copy Markdown
                </button>
                <button role="menuitem" onClick={handleRemoveCitations}>
                  <Trash2 size={16} />
                  Remove citations
                </button>
                <button role="menuitem" onClick={() => handleDownloadDocx('acm')}>
                  <Download size={16} />
                  Export ACM .docx
                </button>
                <div className="menu-separator" />
                <button role="menuitem" onClick={handleRestoreSample}>
                  <Sparkles size={16} />
                  Restore sample
                </button>
              </div>
            )}
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".md,.markdown,text/markdown,text/plain"
          hidden
        />
      </header>

      <nav className="mobile-pane-switcher" aria-label="Workspace view">
        <button className={activePane === 'editor' ? 'active' : ''} onClick={() => setActivePane('editor')}>Editor</button>
        <button className={activePane === 'preview' ? 'active' : ''} onClick={() => setActivePane('preview')}>Preview</button>
      </nav>

      <main className="workspace">
        <section className={`workspace-pane editor-pane ${activePane === 'editor' ? 'mobile-active' : ''}`}>
          <header className="pane-toolbar">
            <div>
              <span className="status-dot" aria-hidden="true" />
              <strong>Markdown</strong>
            </div>
            <span>{markdown.length.toLocaleString()} characters</span>
          </header>
          <textarea
            className="editor"
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
            aria-label="Markdown editor"
            spellCheck="false"
          />
        </section>

        <section className={`workspace-pane preview-pane ${activePane === 'preview' ? 'mobile-active' : ''}`}>
          <header className="pane-toolbar">
            <div>
              <span className="status-dot preview-dot" aria-hidden="true" />
              <strong>Preview</strong>
            </div>
            <span>Click a formula to copy MathML</span>
          </header>
          <div
            className="preview-scroll"
            onClick={handlePreviewInteraction}
            onKeyDown={handlePreviewKeyDown}
            onContextMenu={handlePreviewContextMenu}
          >
            <article
              ref={previewRef}
              className="preview markdown-body"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </section>
      </main>

      <FeedbackButton />
    </div>
  );
}

export default App;
