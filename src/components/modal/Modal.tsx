import React from "react";
import "./modal.css";

interface ModalProps {
  title: string;
  description: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({
  title,
  description,
  onClose,
  onConfirm,
  confirmText = "OK",
  cancelText = "Close",
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="modal-buttons">
          {onConfirm ? (
            <>
              <button onClick={onConfirm}>{confirmText}</button>
              <button onClick={onClose}>{cancelText}</button>
            </>
          ) : (
            <button onClick={onClose}>{confirmText}</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
