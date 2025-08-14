import React from "react";
import { IoSend } from "react-icons/io5";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  isPasswordType?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Your Message...",
  isPasswordType = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSubmit();
    }
  };

  return (
    <div className="inputRow">
      <input
        type={isPasswordType ? "password" : "text"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="chatInput"
      />
      <button onClick={onSubmit} className="sendButton">
        <IoSend />
      </button>
    </div>
  );
};
