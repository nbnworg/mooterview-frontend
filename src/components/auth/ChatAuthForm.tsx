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
    isSubmitting,
    addChatMessage,
    goToStep,
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

  
  const validateInput = (stepId: string, value: string) => {
    switch (stepId) {
      case "fullName":
        if (value.trim().length < 3) return "Full name must be at least 3 characters.";
        break;
      case "username":
        if (!/^[a-zA-Z0-9_]{3,15}$/.test(value))
          return "Username must be 3–15 characters (letters, numbers, underscores).";
        break;
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Email format is invalid.";
        break;
      case "location":
        if (value.trim().length < 2) return "Please enter a valid location.";
        break;
      case "password":
        if (
          !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value)
        ) {
          return "Password must have 8+ chars, upper, lower, number & special.";
        }
        break;
      default:
        return null;
    }
    return null;
  };

  
  const  handleStepSubmit = () => {
    const currentStep = steps[stepIndex];
    const errorMsg = validateInput(currentStep.id, input);

    if (errorMsg) {
      addChatMessage({ from: "Moo", text: `❌ ${errorMsg}` });
      goToStep(currentStep.id);
      return;
    }

    handleSubmit();
  };

  return (
    <>
      <ChatBox messages={chat} chatEndRef={chatEndRef} />
      {stepIndex < steps.length ? (
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleStepSubmit} 
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
          {isSubmitting
            ? "Processing..."
            : finalSubmissionComplete
            ? completedButtonText
            : finalButtonText}
        </AuthButton>
      )}
    </>
  );
};
