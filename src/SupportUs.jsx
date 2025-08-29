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
            <img src="/paypal_qr.png" alt="PayPal QR Code" />
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
