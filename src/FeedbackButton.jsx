import { useEffect, useRef, useState } from 'react';
import { Check, MessageSquare, Send, X } from 'lucide-react';
import { trackEvent } from './lib/analytics';

function FeedbackButton({ exportFeedbackRequest = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showExportPrompt, setShowExportPrompt] = useState(false);
  const [feedback, setFeedback] = useState('');
  const textareaRef = useRef(null);
  const previousExportFeedbackRequestRef = useRef(0);

  useEffect(() => {
    if (isOpen) textareaRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!exportFeedbackRequest || exportFeedbackRequest === previousExportFeedbackRequestRef.current) return;
    previousExportFeedbackRequestRef.current = exportFeedbackRequest;
    setShowExportPrompt(true);
  }, [exportFeedbackRequest]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!feedback.trim()) return;

    trackEvent('feedback_submit', { source: 'manual' });
    window.location.href = `mailto:admin@uuuu.site?subject=MD2MathML feedback&body=${encodeURIComponent(feedback.trim())}`;
    setIsOpen(false);
    setFeedback('');
  };

  return (
    <div className="feedback-container">
      {showExportPrompt && !isOpen && (
        <div className="export-feedback-prompt" role="status">
          <div>
            <strong>Is the Word file ready to use?</strong>
            <button
              type="button"
              className="icon-button"
              onClick={() => setShowExportPrompt(false)}
              aria-label="Dismiss export feedback"
            >
              <X size={16} />
            </button>
          </div>
          <div className="export-feedback-actions">
            <button type="button" onClick={() => {
              trackEvent('export_feedback', { result: 'ready', source: 'post_export' });
              setShowExportPrompt(false);
            }}>
              <Check size={14} />
              Yes
            </button>
            <button type="button" onClick={() => {
              trackEvent('export_feedback', { result: 'needs_work', source: 'post_export' });
              setShowExportPrompt(false);
              setIsOpen(true);
            }}>
              Needs work
            </button>
          </div>
        </div>
      )}
      {isOpen && (
        <form className="feedback-panel" onSubmit={handleSubmit}>
          <div className="feedback-panel-header">
            <div>
              <strong>Share feedback</strong>
              <span>Ideas, bugs, or anything in between.</span>
            </div>
            <button type="button" className="icon-button" onClick={() => setIsOpen(false)} aria-label="Close feedback form">
              <X size={17} />
            </button>
          </div>
          <textarea
            ref={textareaRef}
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="What could be better?"
            aria-label="Feedback message"
          />
          <button className="feedback-submit" type="submit" disabled={!feedback.trim()}>
            <Send size={15} />
            Send by email
          </button>
        </form>
      )}
      <button
        className="feedback-button"
        onClick={() => setIsOpen((open) => {
          if (!open) {
            trackEvent('feedback_open', { source: 'manual' });
            setShowExportPrompt(false);
          }
          return !open;
        })}
        aria-label={isOpen ? 'Close feedback form' : 'Send feedback'}
        aria-expanded={isOpen}
        title="Send feedback"
      >
        <MessageSquare size={20} />
      </button>
    </div>
  );
}

export default FeedbackButton;
