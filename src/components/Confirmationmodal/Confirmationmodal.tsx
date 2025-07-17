import React from "react";
import "./Confirmationmodal.css";

interface ModalData {
  text1: string;
  text2: string;
  btn1Text: string;
  btn2Text: string;
  btn1Handler: () => void;
  btn2Handler: () => void;
}

interface ConfirmationModalProps {
  modalData: ModalData;
}


const IconBtn: React.FC<{
  text: string;
  onclick: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}> = ({ text, onclick, children, disabled = false, type = "button" }) => {
  return (
    <button
      disabled={disabled}
      onClick={onclick}
      type={type}
      className="confirmation-icon-btn"
    >
      {children ? (
        <>
          <span>{text}</span>
          {children}
        </>
      ) : (
        text
      )}
    </button>
  );
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ modalData }) => {
  return (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal-container">
        <div className="confirmation-modal-content">
          <p className="confirmation-text">{modalData.text1}</p>
          <p className="confirmation-subtext">{modalData.text2}</p>
          <div className="confirmation-btn-group">
            <IconBtn
              onclick={modalData.btn1Handler}
              text={modalData.btn1Text}
            />
            <button
              onClick={modalData.btn2Handler}
              className="confirmation-cancel-btn"
            >
              {modalData.btn2Text}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
