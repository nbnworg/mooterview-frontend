/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import "./Chatbox.css";
import { getPromptResponse } from "../../utils/handlers/getPromptResponse";
import { updateSessionById } from "../../utils/handlers/updateSessionById";
import { Actor, type Problem } from "mooterview-client";
import { useNavigate } from "react-router-dom";
import { setSpeakingStateCallback, speak } from "../../utils/voiceSupport";

interface ChatBoxProps {
  problem: Problem;
  code: string;
  elapsedTime: number;
  onVerifyRef?: React.MutableRefObject<(() => void) | null>;
}

const ChatBox: React.FC<ChatBoxProps> = ({
  problem,
  code,
  elapsedTime,
  onVerifyRef,
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const lastAutoTimeRef = useRef(0);
  const elapsedTimeRef = useRef(elapsedTime);
  const codeRef = useRef(code);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const hasExplainedRef = useRef(false);
  const [isSolutionVerifiedCorrect, setIsSolutionVerifiedCorrect] =
    useState(false);
  const isSolutionVerifiedCorrectRef = useRef(false);
  const [, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");
  const [microphonePermission, setMicrophonePermission] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  const sessionId = localStorage.getItem("mtv-sessionId");
  const navigate = useNavigate();

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const isSecure =
          window.location.protocol === "https:" ||
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";

        if (!isSecure) {
          setSpeechError(
            "Speech recognition requires HTTPS. Please use a secure connection."
          );
          return;
        }

        if (navigator.permissions) {
          try {
            const permission = await navigator.permissions.query({
              name: "microphone" as PermissionName,
            });
            setMicrophonePermission(permission.state);

            permission.onchange = () => {
              setMicrophonePermission(permission.state);
            };
          } catch (err) {
            console.warn("Permission API not supported", err);
            setMicrophonePermission("unknown");
          }
        }

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            stream.getTracks().forEach((track) => track.stop());
            setMicrophonePermission("granted");
          } catch (err: any) {
            console.warn("Microphone access denied or unavailable", err);
            if (err.name === "NotAllowedError") {
              setSpeechError(
                "Microphone permission denied. Please allow microphone access in your browser settings."
              );
              setMicrophonePermission("denied");
            } else if (err.name === "NotFoundError") {
              setSpeechError(
                "No microphone found. Please connect a microphone."
              );
            } else {
              setSpeechError("Microphone access error: " + err.message);
            }
          }
        }
      } catch (err) {
        console.error("Error checking permissions", err);
        setSpeechError("Unable to check microphone permissions.");
      }
    };

    checkPermissions();
  }, []);

  useEffect(() => {
    if (!isMicrophoneAvailable) {
      console.warn("Microphone not available");
    }
  }, [isMicrophoneAvailable]);

  useEffect(() => {
    elapsedTimeRef.current = elapsedTime;
  }, [elapsedTime]);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    isSolutionVerifiedCorrectRef.current = isSolutionVerifiedCorrect;
  }, [isSolutionVerifiedCorrect]);

  useEffect(() => {
    messagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (hasExplainedRef.current && !listening) {
      startListening();
    }
  }, [messages, listening]);

  const startListening = () => {
    if (!listening) {
      SpeechRecognition.startListening({
        continuous: true,
        language: "en-US",
      });
      setIsListening(true);
    }
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
    setIsListening(false);
  };

  useEffect(() => {
    const handleSpeechError = (event: any) => {
      console.error("Speech recognition error", event);
      setSpeechError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const recognition = new (window.SpeechRecognition ||
        window.webkitSpeechRecognition)();
      recognition.onerror = handleSpeechError;
    }
  }, []);

  useEffect(() => {
    const handleSpeakingStateChange = (isSpeaking: boolean) => {
      if (isSpeaking) {
        stopListening();
      } else {
        if (!listening && hasExplainedRef.current) {
          startListening();
        }
      }
    };
    setSpeakingStateCallback(handleSpeakingStateChange);

    return () => {
      setSpeakingStateCallback(() => {});
    };
  }, [listening]);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const addBotMessage = async (text: string) => {
    const newMessage = { actor: Actor.INTERVIEWER, message: text };
    await updateChatsInSession([newMessage]);

    setMessages((prevMessages) => {
      const updated = [...prevMessages, newMessage];
      return updated;
    });
    await speak(text);
  };

  const updateChatsInSession = async (newChats: any[]) => {
    if (!sessionId) return;
    try {
      await updateSessionById({
        sessionId,
        chatsQueue: newChats,
      });
    } catch (err) {
      console.error("Failed to update chatsQueue", err);
    }
  };

  const generateEvaluationSummary = async (): Promise<{
    summary: string;
    alternativeSolutions: string[];
  }> => {
    console.log(
      "data",
      problem.title,
      problem.problemDescription,
      codeRef.current,
      messages
    );
    console.log("code", codeRef.current);

    const promptKey = "generate-summary";

    const response = await getPromptResponse({
      actor: Actor.INTERVIEWER,
      context: `Problem: ${problem.title}\n
            Description: ${problem.problemDescription}
                
            Elapsed time: ${elapsedTimeRef.current / 60} minutes
                
            Final code:
            ${codeRef.current?.trim() || "No code was written."}
                
            Chat transcript:
            ${JSON.stringify(messages, null, 2)}`,
      promptKey,
    });

    try {
      return JSON.parse(response);
    } catch (err) {
      console.error("Failed to parse evaluation response", response);
      return {
        summary: "Evaluation could not be parsed.",
        alternativeSolutions: [],
      };
    }
  };

  const endSession = async () => {
    const wantsSolution = window.confirm(
      "Are you sure you want to end session and view real solution?"
    );

    const sessionId = localStorage.getItem("mtv-sessionId");
    if (!sessionId) return;

    try {
      await updateSessionById({
        sessionId,
        endTime: new Date().toISOString(),
      });

      if (wantsSolution) {
        const evaluation = await generateEvaluationSummary();
        await updateSessionById({
          sessionId,
          notes: [
            { content: evaluation.summary },
            {
              content: codeRef.current.trim() || "No code provided",
            },
          ],
        });
        console.log("evaluation", evaluation);
        navigate(`/solution/${encodeURIComponent(problem.title ?? "")}`, {
          state: { evaluation },
          replace: true,
        });
      } else {
        alert("Session ended successfully.");
        navigate("/home", { replace: true });
      }
    } catch (err) {
      console.error("Failed to end session", err);
    }
  };

  useEffect(() => {
    const explainProblem = async () => {
      if (hasExplainedRef.current) return;
      hasExplainedRef.current = true;
      const response = await getPromptResponse({
        actor: Actor.INTERVIEWER,
        context: `The candidate has just started working on the following coding problem:\n\n${problem.problemDescription}`,
        promptKey: "explain-problem",
      });
      await addBotMessage(response);
    };

    explainProblem();
  }, [problem]);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = elapsedTimeRef.current;

      if (
        !isSolutionVerifiedCorrectRef.current &&
        elapsed - lastAutoTimeRef.current >= 180
      ) {
        lastAutoTimeRef.current = elapsed;

        const codeSnapshot = codeRef.current?.trim() || "";
        const autoPrompt = `auto-tip`;
        getPromptResponse({
          actor: Actor.INTERVIEWER,
          context: `Problem: ${problem.title}\n\n${problem.problemDescription}
                    You are acting as a human coding interviewer.

          It’s been ${Math.floor(
            elapsed / 60
          )} minutes since the interview started. The candidate is working on the following problem:

          "${problem.title}"

          Their current code is:
          ${codeSnapshot || "[No code written yet]"}`,
          promptKey: autoPrompt,
        }).then(async (response) => {
          await addBotMessage(response);
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [problem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    stopListening();
    resetTranscript();
    if (!input.trim()) return;

    const userMsg = { actor: Actor.USER, message: input };
    const updatedUserMessages = [...messages, userMsg];
    console.log("updatedUserMessages", updatedUserMessages);
    setMessages(updatedUserMessages);
    setInput("");
    setLoading(true);

    await updateChatsInSession([userMsg]);

    try {
      const requiresResponse = await checkIfResponseNeeded(input);

      if (requiresResponse) {
        const aiResponse = await getPromptResponse({
          actor: Actor.USER,
          context: `Problem: ${problem.title}\n\n${problem.problemDescription}\n\nCurrent code:\n${codeRef.current}\nCandidate's message:
          "${input}"`,
          promptKey: `handle-chat`,
        });

        const botMsg = { actor: Actor.INTERVIEWER, message: aiResponse };
        const updatedFinalMessages = [...updatedUserMessages, botMsg];
        setMessages(updatedFinalMessages);
        await updateChatsInSession([botMsg]);

        await speak(aiResponse);
      } else {
        const updatedFinalMessages = [...updatedUserMessages];
        setMessages(updatedFinalMessages);
      }
    } catch {
      const errorMsg = {
        actor: Actor.AI,
        message: "Sorry, I couldn't process that.",
      };
      const fallbackMessages = [...updatedUserMessages, errorMsg];
      setMessages(fallbackMessages);
      await updateChatsInSession(fallbackMessages);

      await speak("Sorry, I couldn't process that.");
    }

    setLoading(false);
  };

  const checkIfResponseNeeded = async (input: string): Promise<boolean> => {
    if (
      input.length < 3 ||
      /^(ok|yes|no|thanks?|thank you|got it|i see)$/i.test(input.trim())
    ) {
      return false;
    }

    const response = await getPromptResponse({
      actor: "response-determiner",
      context: input,
      promptKey: "needs-response",
    });
    return response.trim().toLowerCase() === "yes";
  };

  useEffect(() => {
    if (onVerifyRef) {
      onVerifyRef.current = handleVerifyCode;
    }
  }, [code, problem]);

  const handleVerifyCode = async () => {
    const currentCode = codeRef.current;

    const promptKey = `verify-code`;

    const response = await getPromptResponse({
      actor: Actor.INTERVIEWER,
      context: `Problem: ${problem.title}\n${problem.problemStatement}\n
                Problem: ${problem.title}\n
    Description: ${problem.problemStatement}\n
  
    Candidate's solution code:\n
    ${currentCode || "[No code provided]"}`,
      promptKey,
    });

    console.log("code", currentCode);

    if (response.trim().startsWith("Correct")) {
      setIsSolutionVerifiedCorrect(true);
      isSolutionVerifiedCorrectRef.current = true;
    }

    await addBotMessage(response);
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (listening && transcript && transcript.trim().length > 0) {
        if (shouldRespondToTranscript(transcript)) {
          await handleSubmit(new Event("auto-submit") as any);
        } else {
          setInput("");
          resetTranscript();
        }
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [transcript, listening]);

  const shouldRespondToTranscript = (text: string): boolean => {
    const trimmed = text.trim();
    const isQuestion = trimmed.endsWith("?");
    const hasCompleteThoughtKeywords =
      /(what|how|why|help|explain|tell me|show me|i don't|i need)/i.test(
        trimmed
      );

    return isQuestion || hasCompleteThoughtKeywords || trimmed.length > 20;
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div>
        Your browser doesn't support speech recognition. Please use Chrome,
        Edge, or Safari for voice features.
      </div>
    );
  }

  return (
    <div className="chatbox">
      <div className="chatMessages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chatMessage ${msg.actor.toLowerCase()}`}>
            {msg.message}
          </div>
        ))}
        {loading && <div className="chatMessage bot">...</div>}

        <div ref={messagesRef} />
      </div>

      <form className="chatInputForm" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chatInput"
          placeholder="Ask for guidance..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="chatSendButton" disabled={loading}>
          Send
        </button>
      </form>

      <button className="endSessionButton" onClick={endSession}>
        End Session
      </button>

      {listening && (
        <div className="speech-indicator">
          <div className="pulse-ring"></div>
          Listening...
        </div>
      )}
    </div>
  );
};

export default ChatBox;
