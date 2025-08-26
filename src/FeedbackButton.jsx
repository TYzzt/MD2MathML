import { useState } from 'react';

function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleFeedbackChange = (event) => {
    setFeedback(event.target.value);
  };

  const handleSubmit = () => {
    const mailtoLink = `mailto:admin@uuuu.site?subject=Feedback&body=${encodeURIComponent(feedback)}`;
    window.location.href = mailtoLink;
    setIsOpen(false);
    setFeedback('');
  };

  return (
    <div className="feedback-container">
      <button className="feedback-button" onClick={handleToggle}>
        Feedback
      </button>
      {isOpen && (
        <div className="feedback-form">
          <h3>Send Feedback</h3>
          <textarea
            value={feedback}
            onChange={handleFeedbackChange}
            placeholder="Your feedback..."
          />
          <button onClick={handleSubmit}>Submit</button>
        </div>
      )}
    </div>
  );
}

export default FeedbackButton;
