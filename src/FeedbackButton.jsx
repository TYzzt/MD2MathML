import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';

function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) textareaRef.current?.focus();
  }, [isOpen]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!feedback.trim()) return;

    window.location.href = `mailto:admin@uuuu.site?subject=MD2MathML feedback&body=${encodeURIComponent(feedback.trim())}`;
    setIsOpen(false);
    setFeedback('');
  };

  return (
    <div className="feedback-container">
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
        onClick={() => setIsOpen((open) => !open)}
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
