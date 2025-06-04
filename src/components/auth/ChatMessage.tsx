import React from "react";
import { type ChatMessage as ChatMessageType } from "../../utils/types/auth.types";

interface ChatMessageProps {
  message: ChatMessageType;
  index: number;
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({
  message,
  index,
}) => {
  return (
    <div key={index} className={`chatMessage ${message.from}`}>
      {message.text}
    </div>
  );
};
