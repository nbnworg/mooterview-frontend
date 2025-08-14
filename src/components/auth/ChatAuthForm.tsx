import React from "react";
import { type AuthStep } from "../../utils/types/auth.types";
import { ChatBox } from "./ChatBox";
import { ChatInput } from "./ChatInput";
import { AuthButton } from "./AuthButton";
import { useChatAuth } from "../../hooks/useChatAuth";

interface ChatAuthFormProps {
  steps: AuthStep[];
  initialMessages: string[];
  apiEndpoint: string;
  successMessage: string;
  errorMessage: string;
  redirectPath: string;
  initialFormData: { [key: string]: string };
  finalButtonText: string;
  completedButtonText: string;
}

export const ChatAuthForm: React.FC<ChatAuthFormProps> = ({
  steps,
  initialMessages,
  apiEndpoint,
  successMessage,
  errorMessage,
  redirectPath,
  initialFormData,
  finalButtonText,
  completedButtonText,
}) => {
  const {
    chat,
    stepIndex,
    input,
    setInput,
    finalSubmissionComplete,
    chatEndRef,
    handleSubmit,
    handleFinalSubmit,
    handleRouteToHome,
    isSubmitting
  } = useChatAuth({
    steps,
    initialMessages,
    apiEndpoint,
    successMessage,
    errorMessage,
    redirectPath,
    initialFormData,
  });

  const isPasswordStep = steps[stepIndex]?.id === "password";

  return (
    <>
      <ChatBox messages={chat} chatEndRef={chatEndRef} />
      {stepIndex < steps.length ? (
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isPasswordType={isPasswordStep}
          disabled={isSubmitting}
        />
      ) : (
        <AuthButton
          onClick={
            finalSubmissionComplete ? handleRouteToHome : handleFinalSubmit
          }
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processing..." :
              finalSubmissionComplete ? completedButtonText : finalButtonText}
            
        </AuthButton>
      )}
    </>
  );
};
