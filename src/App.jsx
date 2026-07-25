import { useEffect, useMemo, useRef, useState } from 'react';
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
import 'highlight.js/styles/github-dark.css';
import FeedbackButton from './FeedbackButton';
import SupportUs from './SupportUs';
import { documentSizeBucket, trackEvent } from './lib/analytics';
import { copyPlainText, serializeMathElement } from './lib/clipboard';
import {
  classifyExportError,
  downloadDocx,
  exportErrorMessage,
  requestDocx,
} from './lib/export';
import { initialMarkdown, markdownRenderer } from './lib/markdown';
import './App.css';

const STORAGE_KEY = 'md2mathml.draft.v1';

function getInitialMarkdown() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || initialMarkdown;
  } catch {
    return initialMarkdown;
  }
}

function App() {
  const [markdown, setMarkdown] = useState(getInitialMarkdown);
  const html = useMemo(() => markdownRenderer.render(markdown), [markdown]);
  const [notification, setNotification] = useState({ visible: false, text: '' });
  const [showSupportUs, setShowSupportUs] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [activePane, setActivePane] = useState('editor');
  const [exportFeedbackRequest, setExportFeedbackRequest] = useState(0);
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);
  const moreMenuRef = useRef(null);
  const notificationTimerRef = useRef(null);

  useEffect(() => {
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

  const copyText = async (text, successMessage, failureMessage, eventName, source) => {
    try {
      const method = await copyPlainText(text);
      showNotification(successMessage);
      trackEvent(eventName, { method, source });
    } catch {
      showNotification(failureMessage);
    }
  };

  const copyMathElement = (mathElement, source) => {
    void copyText(
      serializeMathElement(mathElement),
      'MathML copied',
      'Could not copy MathML',
      'formula_copy',
      source,
    );
  };

  const handlePreviewInteraction = (event) => {
    const paragraphButton = event.target.closest('.copy-paragraph-button');
    if (paragraphButton) {
      const paragraph = paragraphButton.closest('.paragraph-container')?.querySelector('p');
      if (paragraph) {
        void copyText(
          paragraph.innerText,
          'Paragraph copied',
          'Could not copy paragraph',
          'paragraph_copy',
          'pointer',
        );
      }
      return;
    }

    const mathElement = event.target.closest('math');
    if (mathElement) copyMathElement(mathElement, 'pointer');
  };

  const handlePreviewKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const mathElement = event.target.closest('math');
    if (!mathElement) return;
    event.preventDefault();
    copyMathElement(mathElement, 'keyboard');
  };

  const handlePreviewContextMenu = (event) => {
    const mathElement = event.target.closest('math');
    if (!mathElement) return;
    event.preventDefault();
    copyMathElement(mathElement, 'context_menu');
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setMarkdown(loadEvent.target.result);
      setActivePane('editor');
      showNotification(`${file.name} loaded`);
      trackEvent('file_import', {
        size_bucket: documentSizeBucket(loadEvent.target.result.length),
        source: 'file',
      });
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
    const analyticsParameters = {
      size_bucket: documentSizeBucket(markdown.length),
      template: template || 'default',
    };
    trackEvent('docx_export_start', analyticsParameters);

    try {
      const blob = await requestDocx(markdown, { template });
      downloadDocx(blob, template);
      showNotification('Document downloaded');
      trackEvent('docx_export_success', analyticsParameters);
      setExportFeedbackRequest((request) => request + 1);
    } catch (error) {
      const errorKind = classifyExportError(error);
      showNotification(exportErrorMessage(errorKind));
      trackEvent('docx_export_failure', { ...analyticsParameters, error_kind: errorKind });
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
            <span>AI &amp; Markdown to editable Word</span>
          </div>
        </div>

        <div className="header-actions">
          <button className="button support-button" onClick={() => {
            trackEvent('support_open', { source: 'manual' });
            setShowSupportUs(true);
          }} title="Support MD2MathML">
            <Heart size={17} />
            <span className="button-label">Support</span>
          </button>
          <button className="button secondary-button" onClick={() => fileInputRef.current?.click()} title="Upload Markdown file">
            <FileUp size={17} />
            <span className="button-label">Upload</span>
          </button>
          <button className="button primary-button" onClick={() => handleDownloadDocx()} disabled={isDownloading} title="Export as Word document">
            {isDownloading ? <RefreshCcw className="spin" size={17} /> : <Download size={17} />}
            <span className="button-label">{isDownloading ? 'Preparing Word' : 'Download Word'}</span>
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
                  void copyText(
                    markdown,
                    'Markdown copied',
                    'Could not copy Markdown',
                    'markdown_copy',
                    'manual',
                  );
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

      <FeedbackButton exportFeedbackRequest={exportFeedbackRequest} />
    </div>
  );
}

export default App;
