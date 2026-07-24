import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Heart, X } from 'lucide-react';
import supporters from './supporters';
import './SupportUs.css';

function SupportUs({ show, onClose }) {
  const [qrExpanded, setQrExpanded] = useState(false);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const qrButtonRef = useRef(null);
  const qrPreviewRef = useRef(null);
  const qrCloseButtonRef = useRef(null);

  useEffect(() => {
    if (!show) return undefined;

    previousFocusRef.current = document.activeElement;
    closeButtonRef.current?.focus();

    return () => previousFocusRef.current?.focus();
  }, [show]);

  useEffect(() => {
    if (qrExpanded) qrCloseButtonRef.current?.focus();
  }, [qrExpanded]);

  useEffect(() => {
    if (!show) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (qrExpanded) {
          setQrExpanded(false);
          window.requestAnimationFrame(() => qrButtonRef.current?.focus());
        } else {
          onClose();
        }
        return;
      }

      const focusRoot = qrExpanded ? qrPreviewRef.current : dialogRef.current;
      if (event.key !== 'Tab' || !focusRoot) return;

      const focusable = focusRoot.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose, qrExpanded]);

  const handleClose = () => {
    setQrExpanded(false);
    onClose();
  };

  const closeQrPreview = () => {
    setQrExpanded(false);
    window.requestAnimationFrame(() => qrButtonRef.current?.focus());
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && handleClose()}>
      <section
        ref={dialogRef}
        className="support-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-title"
      >
        <header className="support-header">
          <div className="support-heading">
            <span className="support-heading-icon" aria-hidden="true">
              <Heart size={18} strokeWidth={2.2} />
            </span>
            <div>
              <h2 id="support-title">Support MD2MathML</h2>
              <p>Help keep this tool available and improving.</p>
            </div>
          </div>
          <button ref={closeButtonRef} className="icon-button close-button" onClick={handleClose} aria-label="Close support dialog">
            <X size={19} />
          </button>
        </header>

        <div className="support-content">
          <section className="support-options" aria-labelledby="support-options-title">
            <div className="section-heading-row compact">
              <div>
                <span className="section-eyebrow">Contribute</span>
                <h3 id="support-options-title">Support the project</h3>
              </div>
              <p>Choose the option that works best for you.</p>
            </div>

            <div className="payment-grid">
              <button
                ref={qrButtonRef}
                type="button"
                className="payment-option alipay-option"
                onClick={() => setQrExpanded(true)}
                aria-label="Enlarge Alipay QR code"
                title="Click to enlarge QR code"
              >
                <div>
                  <strong>Alipay</strong>
                  <span>Click the QR code to enlarge</span>
                </div>
                <img src="/alipay_qr.png" alt="" />
              </button>
              <a
                className="payment-option paypal-option"
                href="https://www.paypal.com/paypalme/uuuusite"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div>
                  <strong>PayPal</strong>
                  <span>Open the secure PayPal page</span>
                </div>
                <ExternalLink size={18} aria-hidden="true" />
              </a>
            </div>
          </section>

          <section className="thanks-section" aria-labelledby="thanks-title">
            <div className="section-heading-row">
              <div>
                <span className="section-eyebrow">Community</span>
                <h3 id="thanks-title">With thanks</h3>
              </div>
              <p>Made better by people who believe in useful, open tools.</p>
            </div>

            <div className="supporter-list">
              {[...supporters]
                .sort((a, b) => b.sortValue - a.sortValue)
                .map((supporter) => (
                  <article className="supporter-row" key={supporter.displayName}>
                    <img className="supporter-avatar" src={supporter.avatar} alt="" width="32" height="32" />
                    <div className="supporter-copy">
                      <div className="supporter-name-row">
                        <strong>{supporter.displayName}</strong>
                        <span className="supporter-amount">{supporter.amount}</span>
                      </div>
                      {supporter.message && <p>“{supporter.message}”</p>}
                    </div>
                  </article>
                ))}
            </div>
          </section>
        </div>
      </section>

      {qrExpanded && (
        <div className="qr-preview-overlay" onMouseDown={(event) => event.target === event.currentTarget && closeQrPreview()}>
          <div ref={qrPreviewRef} className="qr-preview" role="dialog" aria-modal="true" aria-label="Alipay QR code preview">
            <button
              ref={qrCloseButtonRef}
              className="icon-button qr-preview-close"
              onClick={closeQrPreview}
              aria-label="Close QR code preview"
            >
              <X size={19} />
            </button>
            <span className="section-eyebrow">Alipay</span>
            <h3>Scan with Alipay</h3>
            <img src="/alipay_qr.png" alt="Alipay QR code" />
            <p>Scan with Alipay, or long-press the image to save it.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportUs;
