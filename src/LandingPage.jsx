import { ArrowRight, Download, FileDown, MousePointer2, PanelTop, ShieldCheck } from 'lucide-react';
import './LandingPage.css';

const APP_URL = 'https://md2mathml.uuuu.site/';
const EDGE_EXTENSION_URL = 'https://microsoftedge.microsoft.com/addons/detail/select2obsidian/foenpoepoknbjfiejgcjcnlkogaophen';
const CHROME_EXTENSION_URL = 'https://github.com/TYzzt/select2obsidian/releases/latest/download/select-to-note-browser-extension.zip';

function Brand() {
  return (
    <a className="landing-brand" href="#top" aria-label="MD2MathML home">
      <img src="/md2mathml-mark.svg" alt="" width="38" height="38" />
      <span>MD2MathML</span>
    </a>
  );
}

function LandingPage() {
  return (
    <div className="landing-page" id="top">
      <header className="landing-header">
        <Brand />
        <a className="landing-nav-link" href={APP_URL}>
          Open the app <ArrowRight size={16} aria-hidden="true" />
        </a>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <p className="landing-kicker">Markdown in. Native Word equations out.</p>
            <h1 id="landing-title">MD2MathML</h1>
            <p className="landing-intro">
              Turn Markdown from ChatGPT, Claude, Gemini, or Obsidian into a Word document
              with equations that remain editable.
            </p>
            <div className="landing-actions">
              <a className="landing-primary-action" href={APP_URL}>
                Convert Markdown <ArrowRight size={18} aria-hidden="true" />
              </a>
              <span>No sign-in. Free to use.</span>
            </div>
          </div>

          <a className="product-preview" href={APP_URL} aria-label="Open MD2MathML">
            <img
              src="/md2mathml-preview.png"
              alt="MD2MathML editor showing Markdown beside a rendered document with editable equations"
            />
          </a>
        </section>

        <section className="landing-workflow" aria-labelledby="workflow-title">
          <div className="landing-section-heading">
            <p>One direct workflow</p>
            <h2 id="workflow-title">From AI response to editable document.</h2>
          </div>
          <ol className="workflow-steps">
            <li>
              <span>01</span>
              <strong>Paste or upload</strong>
              <p>Bring in Markdown from an AI chat, notes app, or local file.</p>
            </li>
            <li>
              <span>02</span>
              <strong>Review the result</strong>
              <p>Check prose, tables, code, and semantic MathML before export.</p>
            </li>
            <li>
              <span>03</span>
              <strong>Download Word</strong>
              <p>Open the DOCX and edit equations as native Office Math objects.</p>
            </li>
          </ol>
        </section>

        <section className="landing-extension" aria-labelledby="extension-title">
          <div className="extension-copy">
            <p className="landing-kicker">Browser extension</p>
            <h2 id="extension-title">Select an AI response. Send it where you work.</h2>
            <p>
              Select to Word &amp; Obsidian captures part of ChatGPT, Claude, Gemini,
              DeepSeek, or an ordinary web page while preserving equations, tables, and code.
            </p>
            <div className="extension-actions">
              <a
                className="landing-primary-action"
                href={EDGE_EXTENSION_URL}
                rel="noreferrer"
                target="_blank"
              >
                <PanelTop size={18} aria-hidden="true" /> Install for Edge
              </a>
              <a
                className="landing-secondary-action"
                href={CHROME_EXTENSION_URL}
                rel="noreferrer"
                target="_blank"
              >
                <Download size={18} aria-hidden="true" /> Download for Chrome
              </a>
            </div>
          </div>
          <ol className="extension-flow" aria-label="Select content, then export it to Word or Obsidian">
            <li><MousePointer2 size={22} aria-hidden="true" /><strong>Select</strong><span>Any web chat or page</span></li>
            <span aria-hidden="true">→</span>
            <li><FileDown size={22} aria-hidden="true" /><strong>Export</strong><span>Word, DOCX, or Obsidian</span></li>
          </ol>
        </section>

        <section className="landing-proof" aria-labelledby="proof-title">
          <div className="proof-copy">
            <p>Built for the document, not the screenshot</p>
            <h2 id="proof-title">Your equations stay useful after export.</h2>
          </div>
          <div className="proof-points">
            <div>
              <FileDown size={22} aria-hidden="true" />
              <p><strong>Native DOCX output</strong><br />Equations, tables, footnotes, and images travel together.</p>
            </div>
            <div>
              <ShieldCheck size={22} aria-hidden="true" />
              <p><strong>Private by default</strong><br />Drafts stay in your browser until you request conversion.</p>
            </div>
          </div>
        </section>

        <section className="landing-final-cta" aria-labelledby="final-cta-title">
          <h2 id="final-cta-title">Make the next equation editable.</h2>
          <a className="landing-primary-action" href={APP_URL}>
            Open MD2MathML <ArrowRight size={18} aria-hidden="true" />
          </a>
        </section>
      </main>

      <footer className="landing-footer">
        <Brand />
        <p>AI and Markdown to editable Word.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
