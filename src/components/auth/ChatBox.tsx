import React, { type RefObject } from "react";
import type { ChatMessage } from "../../utils/types/auth.types";
import { ChatMessageComponent } from "./ChatMessage";

interface ChatBoxProps {
  messages: ChatMessage[];
  chatEndRef: RefObject<HTMLDivElement | null>;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, chatEndRef }) => {
  return (
    <div className="chatBox">
      {messages.map((message, index) => (
        <ChatMessageComponent key={index} message={message} index={index} />
      ))}
      <div ref={chatEndRef}></div>
    </div>
  );
};
