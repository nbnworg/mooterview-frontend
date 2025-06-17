/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL, exceptionMap } from "../utils/constants";
import type {
  ChatMessage,
  AuthStep,
  AuthFormData,
} from "../utils/types/auth.types";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../contexts/AuthContext";

interface UseChatAuthProps {
  steps: AuthStep[];
  initialMessages: string[];
  apiEndpoint: string;
  successMessage: string;
  errorMessage: string;
  redirectPath: string;
  initialFormData: AuthFormData;
}

export const useChatAuth = ({
  steps,
  initialMessages,
  apiEndpoint,
  successMessage,
  errorMessage,
  redirectPath,
  initialFormData,
}: UseChatAuthProps) => {
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [input, setInput] = useState("");
  const [formData, setFormData] = useState<AuthFormData>(initialFormData);
  const [introComplete, setIntroComplete] = useState(false);
  const [finalSubmissionComplete, setFinalSubmissionComplete] = useState(false);

  const { login } = useAuth();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timeouts: (number | undefined)[] = [];

    initialMessages.forEach((message, index) => {
      const timeout = setTimeout(() => {
        setChat((prev) => [...prev, { from: "Moo", text: message }]);
        if (index === initialMessages.length - 1) {
          setIntroComplete(true);
        }
      }, (index + 1) * 1000);

      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [initialMessages]);

  useEffect(() => {
    if (introComplete && stepIndex < steps.length) {
      const question = steps[stepIndex].question;
      setTimeout(() => {
        setChat((prev) => [...prev, { from: "Moo", text: question }]);
      }, 600);
    }
  }, [introComplete, stepIndex, steps]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleSubmit = () => {
    if (!input.trim()) return;

    const currentStep = steps[stepIndex];

    const displayText =
      currentStep.id === "password"
        ? "*".repeat(input.trim().length)
        : input.trim();

    setChat((prev) => [...prev, { from: "You", text: displayText }]);

    setFormData((prev) => ({
      ...prev,
      [currentStep.id]: input.trim(),
    }));

    setInput("");
    setStepIndex((prev) => prev + 1);
  };

  const handleFinalSubmit = async () => {
    try {
      let resUserId = "";

      const response = await axios.post(`${BASE_URL}${apiEndpoint}`, formData);
      if (apiEndpoint === "/users/login") {
        const idToken = response.data.AuthenticationResult.IdToken;
        const decodedToken = jwtDecode<{ sub: string }>(idToken);
        resUserId = decodedToken.sub;
      } else {
        resUserId = response.data.userId;
      }

      localStorage.setItem(
        "userData",
        JSON.stringify({
          id: resUserId,
          accessToken: response.data.AuthenticationResult.AccessToken,
        })
      );
      login();

      setChat((prev) => [...prev, { from: "Moo", text: successMessage }]);
      setFinalSubmissionComplete(true);
    } catch (error: any) {
      const message = error.response?.data || "";
      const exceptionMatch = message.match(/(\w+Exception)/);
      const exceptionName = exceptionMatch ? exceptionMatch[1] : null;

      let userMessage = errorMessage;
      let resetStepId = "";

      if (exceptionName && exceptionMap[exceptionName]) {
        const { message: userMsg, stepId } = exceptionMap[exceptionName];
        userMessage = userMsg;
        resetStepId = stepId;
      }

      setChat((prev) => [...prev, { from: "Moo", text: userMessage }]);

      if (resetStepId) {
        const index = steps.findIndex((step) => step.id === resetStepId);
        if (index !== -1) {
          setStepIndex(index);
          setFormData((prev) => ({
            ...prev,
            [resetStepId]: "",
          }));
        }
      }
    }
  };

  const handleRouteToHome = () => {
    navigate(redirectPath);
  };

  return {
    chat,
    stepIndex,
    input,
    setInput,
    introComplete,
    finalSubmissionComplete,
    chatEndRef,
    handleSubmit,
    handleFinalSubmit,
    handleRouteToHome,
  };
};
