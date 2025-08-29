import React from 'react';
import './SupportUs.css';

const SupportUs = ({ show, onClose }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Support Us</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="qr-code-container">
            <h3>Alipay</h3>
            <img src="/alipay_qr.png" alt="Alipay QR Code" />
          </div>
          <div className="qr-code-container">
            <h3>PayPal</h3>
            <a href="https://www.paypal.com/paypalme/uuuusite" target="_blank" rel="noopener noreferrer">
              Go to PayPal
            </a>
          </div>
        </div>
        <div className="modal-footer">
          <p>Your support is greatly appreciated!</p>
        </div>
      </div>
    </div>
  );
};

export default SupportUs;
