/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Chatbox.css";
import { getPromptResponse } from "../../utils/handlers/getPromptResponse";
import { updateSessionById } from "../../utils/handlers/updateSessionById";
import { Actor, type Problem } from "mooterview-client";
import { useNavigate } from "react-router-dom";
import { createSession } from "../../utils/handlers/createSession";
import { classifyUserMessage } from "../../utils/classifyUserMsg";
import { evaluateSolutionWithRubric } from "../../utils/evaluateSolutionWithRubric";
import { generateTestCasesWithAI } from "../../utils/generateTestCasesWithAI";
import ConfirmationModal from "../Confirmationmodal/Confirmationmodal";
import { clearCachedReport } from "../../utils/localStorageReport";
import { verifyApproach } from "../../utils/handlers/verifyApproach";
import { getTokenData } from "../../utils/constants";
import { IoSend } from "react-icons/io5";
import { GoMoveToEnd } from "react-icons/go";
import Loading from "../Loader/Loading";
import {
  handleUnderstoodConfirmation,
  handleConfusedCase,
  handleRightAnswerCase,
  handleWrongCase,
  handleRequestExampleCase,
  handleApproachProvided,
  handleProblemExplanationCase,
  handleCodingQuestion,
  handleCodingHelp,
  handleGenralAcknowledgement,
  handleOffTopic,
  handleDefaultCase,
  generateEvaluationSolution,
  evaluationReportEval,
} from "./caseHandler";

interface ChatBoxProps {
  problem: Problem;
  code: string;
  elapsedTime: number;
  onVerifyRef?: React.MutableRefObject<
    ((isAutoSubmit?: boolean) => void) | null
  >;
  userId: string;
  onEndRef?: React.MutableRefObject<(() => void) | null>;
  onApproachCorrectChange?: (isCorrect: boolean) => void;
  onVerificationSuccess?: () => void;
}

type Stage =
  | "EXPLAIN_PROBLEM"
  | "ASK_UNDERSTAND"
  | "WAIT_FOR_APPROACH"
  | "CODING"
  | "FOLLOW_UP"
  | "SESSION_END";

type Phase =
  | "CODING"
  | "CODING_NOT_STARTED"
  | "goingOnWrongPath"
  | "stuckWhileCoding";

const ChatBox: React.FC<ChatBoxProps> = ({
  problem,
  code,
  elapsedTime,
  onVerifyRef,
  userId,
  onEndRef,
  onApproachCorrectChange,
  onVerificationSuccess,
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [gptMessages, setGptMessages] = useState<any[]>([]);
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
  const stageRef = useRef<Stage>("EXPLAIN_PROBLEM");
  const intitalCodeContextRef = useRef("");
  const approachAttemptCountRef = useRef(0);
  const hasProvidedApproachRef = useRef(false);
  const phaseRef = useRef<Phase>("CODING_NOT_STARTED");
  const sessionId = localStorage.getItem("mtv-sessionId");
  const [rubricResult, setrubricResult] = useState<any>();
  const [isInputDisabled, setIsInputDisabled] = useState(true);

  const navigate = useNavigate();
  const [loadingSessionEnd, setLoadingSessionEnd] = useState(false);

  const approachTextRef = useRef<string>("");
  const [loadingMessage, setLoadingMessage] = useState("");

  const [confirmationModal, setConfirmationModal] = useState<{
    text1: string;
    text2: string;
    btn1Text: string;
    btn2Text: string;
    btn1Handler: () => void;
    btn2Handler: () => void;
  } | null>(null);

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
    // triggered when time is : 00 
    if (onEndRef) {
      onEndRef.current = () => endSession(true, setConfirmationModal);
    }
  }, [code, problem, onEndRef, setConfirmationModal]);

  useEffect(() => {
    if (stageRef.current === "SESSION_END") {
      setIsInputDisabled(true);
      setTimeout(() => {
        endSession(true, undefined, true);
      }, 1500);
    }
  }, [stageRef.current]);

  const addBotMessage = async (text: string, isOffTopic: boolean = false) => {
    const newMessage = { actor: Actor.INTERVIEWER, message: text };
    await updateChatsInSession([newMessage]);

    setMessages((prevMessages) => {
      const updated = [...prevMessages, newMessage];
      return updated;
    });
    if (!isOffTopic) {
      setGptMessages((prev) => [...prev, newMessage]);
    }
  };

  const updateChatsInSession = async (newChats: any[]) => {
    const sessionId = localStorage.getItem("mtv-sessionId");
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

  const endSession = async (
    calledAutomatically: boolean,
    setConfirmationModal?: React.Dispatch<
      React.SetStateAction<{
        text1: string;
        text2: string;
        btn1Text: string;
        btn2Text: string;
        btn1Handler: () => void;
        btn2Handler: () => void;
      } | null>
    >,
    skipAutoAlert?: boolean,
    customMessage?: string

  ) => {
    const sessionId = localStorage.getItem("mtv-sessionId");
    const message = customMessage || "Ending session and generating evaluation...";
    setLoadingMessage(message);

    if (!sessionId) {
      navigate("/home", { replace: true });
      return;
    }

    const getCleanedEvaluation = async () => {
      try {
        const elapsed = elapsedTimeRef.current;
        const evaluationResponse = await generateEvaluationSolution(problem, elapsed, messages, codeRef.current.trim());
        const evaluationReporteval = await evaluationReportEval(problem, elapsed, messages, codeRef.current.trim());

        let summaryString: string;
        let alternativeSolutionsArray: string[] = [];

        if (typeof evaluationReporteval === "string") {
          summaryString = evaluationReporteval.trim();
        } else {
          summaryString = JSON.stringify(evaluationReporteval);
        }

        try {
          const parsed = typeof evaluationResponse === "string"
            ? JSON.parse(evaluationResponse)
            : evaluationResponse;

          if (parsed && Array.isArray(parsed.alternativeSolutions)) {
            alternativeSolutionsArray = parsed.alternativeSolutions;
          }
        } catch (err) {
          console.error("Failed to parse alternativeSolutions:", err);
        }
        const parsedData = {
          summary: summaryString,
          alternativeSolutions: alternativeSolutionsArray,
        };

        return parsedData;
      } catch (error) {
        console.error(
          "Failed to parse evaluation summary. Proceeding without it.",
          error
        );
        return {
          summary: "Could not generate an AI evaluation for this session.",
        };
      }
    };

    const wantsSolution = true;

    if (!calledAutomatically) {
      if (setConfirmationModal) {
        setConfirmationModal({
          text1: "Are you sure?",
          text2: "This will end your session and take you to the evaluation.",
          btn1Text: "Yes, End Session",
          btn2Text: "Cancel",
          btn1Handler: () => {
            setConfirmationModal(null);
            endSession(true, undefined, true);
          },
          btn2Handler: () => {
            setConfirmationModal(null);
            setLoadingMessage("");
          },
        });
      }
      return;
    } else if (!skipAutoAlert) {
      if (setConfirmationModal) {
        setConfirmationModal({
          text1: "Your time is up!",
          text2: message || "This will end your session and take you to the evaluation.",
          btn1Text: "OK, Proceed",
          btn2Text: "Cancel",
          btn1Handler: async () => {
            setConfirmationModal(null);

            if (
              stageRef.current === "CODING" ||
              stageRef.current === "FOLLOW_UP" ||
              stageRef.current === "SESSION_END"
            ) {
              setLoadingSessionEnd(true);
              setLoadingMessage(message || "Ending session, preparing evaluation...");
              const evaluation = await getCleanedEvaluation();

              const summaryContent = evaluation?.summary || "No evaluation summary available";
              const codeContent = codeRef.current.trim() || "No code provided";

              await updateSessionById({
                sessionId,
                endTime: new Date().toISOString(),
                notes: [
                  { content: summaryContent },
                  { content: codeContent },
                ],
              });
              console.log("Created new session with ID:", codeContent);
              console.log("Summary:", summaryContent.slice(0, 100));

              setLoadingSessionEnd(false);
              navigate(`/solution/${encodeURIComponent(problem.title ?? "")}`, {
                state: { evaluation, sessionId, rubricResult },
                replace: true,
              });
            } else {
              navigate("/home", { replace: true });
            }
          },
          btn2Handler: async () => {
            setConfirmationModal(null);
            await addBotMessage("Your Time is up!  Kindly End the session.");
            setIsInputDisabled(true);
            setLoadingMessage("");
          },
        });
      }
      setLoadingMessage("");
      return;
    }

    try {
      setLoadingSessionEnd(true);

      if (wantsSolution) {
        const evaluation = await getCleanedEvaluation();

        const summaryContent = evaluation?.summary || "No evaluation summary available";
        const codeContent = codeRef.current.trim() || "No code provided";

        await updateSessionById({
          sessionId,
          endTime: new Date().toISOString(),
          notes: [
            { content: summaryContent },
            { content: codeContent },
          ],
        });
        navigate(`/solution/${encodeURIComponent(problem.title ?? "")}`, {
          state: { evaluation, sessionId, rubricResult },
          replace: true,
        });
      } else {
        await updateSessionById({
          sessionId,
          endTime: new Date().toISOString(),
        });
        navigate("/home", { replace: true });
      }
    } catch (err) {
      console.error("Failed to end session", err);
    } finally {
      setLoadingSessionEnd(false);
      setLoadingMessage("");
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
        modelName: "gpt-3.5-turbo",
      });
      await addBotMessage(response);
      await addBotMessage("Have you understood the problem?");
      stageRef.current = "ASK_UNDERSTAND";
      setIsInputDisabled(false);
    };

    explainProblem();
  }, [problem]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const elapsed = elapsedTimeRef.current;

      if (
        !isSolutionVerifiedCorrectRef.current &&
        elapsed - lastAutoTimeRef.current >= 300
      ) {
        lastAutoTimeRef.current = elapsed;
        const codeSnapshot = codeRef.current?.trim() || "";
        if (codeSnapshot.length > 20) {
          phaseRef.current = "CODING";
        }

        const commonContext = `Problem: ${problem.title}\n\n${problem.problemDescription
          }
                    Elapsed time: ${Math.floor(
            elapsed / 60
          )} minutes\nUser's last message: ${input}
                    Current stage: ${stageRef.current}`;
        const prevAnalysisCode = intitalCodeContextRef.current;

        if (phaseRef.current === "CODING_NOT_STARTED") {
          await getPromptResponse({
            actor: Actor.INTERVIEWER,
            context: commonContext,
            promptKey: "nudge-start-coding",
            modelName: "gpt-4o",
          }).then(async (response) => await addBotMessage(response));
        } else if (phaseRef.current === "CODING") {
          const response = await getPromptResponse({
            actor: Actor.INTERVIEWER,
            context: `
                        Problem: ${problem.title}
                        Description: ${problem.problemDescription}
                        Elapsed Time: ${Math.floor(elapsed / 60)} minutes

                        Candidate's code:
                        ${codeSnapshot || "[No code written yet]"}

                        Candidate's last analyzed code:
                        ${prevAnalysisCode || "[No previous code analyzed]"}

                        Chat history:
                        ${JSON.stringify(messages.slice(-8), null, 2)}
                        \nUser's last message: ${input}

                        Evaluate the situation and respond with:
                        - One of: #STUCK, #WRONG_PATH, or #NORMAL
                        - Followed by a one-line suggestion.`,
            promptKey: "analyze-coding-progress",
            modelName: "gpt-4o",
          });

          if (response.includes("#NORMAL")) {
            await addBotMessage(response.replace("#NORMAL", "Good! "));
          }

          if (response.includes("#STUCK")) {
            phaseRef.current = "stuckWhileCoding";
            const tip = await getPromptResponse({
              actor: Actor.INTERVIEWER,
              context: `${commonContext}\nUser seems stuck. Offer hints or ask them to revisit logic.`,
              promptKey: "stuck-feedback",
              modelName: "gpt-3.5-turbo",
            });

            await addBotMessage(tip);
          } else if (response.includes("#WRONG_PATH")) {
            phaseRef.current = "goingOnWrongPath";
            const warning = await getPromptResponse({
              actor: Actor.INTERVIEWER,
              context: `${commonContext}\nThe user seems to be going in a wrong direction or using an incorrect approach.`,
              promptKey: "wrong-path-feedback",
              modelName: "gpt-4o",
            });
            await addBotMessage(warning);
          }
          intitalCodeContextRef.current = codeSnapshot;
          phaseRef.current = "CODING";
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [problem]);

  // let followUp;
  const questionCounterValueRef = useRef<{ number: number } | null>(null);
  const handleFollowUp = useRef(0);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { actor: Actor.USER, message: input };
    const updatedUserMessages = [...messages, userMsg];
    setMessages(updatedUserMessages);
    setInput("");
    setLoading(true);

    await updateChatsInSession([userMsg]);

    const currentStage = stageRef.current;
    const codeSnapshot = codeRef.current?.trim() || "";

    try {
      const classification = await classifyUserMessage(
        input,
        currentStage,
        updatedUserMessages
      );
      if (classification !== "#OFF_TOPIC") {
        setGptMessages((prev) => [...prev, userMsg]);
      }
      console.log("Classified as:", classification);
      switch (classification) {
        case "#UNDERSTOOD_CONFIRMATION": {
          await handleUnderstoodConfirmation(
            stageRef.current,
            gptMessages,
            problem,
            input,
            stageRef,
            approachAttemptCountRef,
            hasProvidedApproachRef,
            addBotMessage
          );
          break;
        }
        case "#CONFUSED": {
          const clarification = await handleConfusedCase(
            gptMessages,
            problem,
            input
          );
          await addBotMessage(clarification);
          break;
        }

        case "#RIGHT_ANSWER": {
          await handleRightAnswerCase(
            gptMessages,
            problem,
            codeSnapshot,
            input,
            handleFollowUp,
            questionCounterValueRef,
            stageRef,
            addBotMessage
          );
          break;
        }

        case "#WRONG_ANSWER": {
          await handleWrongCase(gptMessages, problem, input, addBotMessage);
          break;
        }

        case "#REQUESTED_EXAMPLE": {
          await handleRequestExampleCase(
            gptMessages,
            problem,
            input,
            currentStage,
            addBotMessage
          );
          break;
        }


        case "#APPROACH_PROVIDED": {
          await handleApproachProvided(
            stageRef.current,
            gptMessages,
            problem,
            input,
            hasProvidedApproachRef,
            stageRef,
            approachTextRef,
            onApproachCorrectChange,
            addBotMessage
          );
          break;
        }

        case "#PROBLEM_EXPLANATIONS": {
          addBotMessage("Okay,Can you please explain your approach ?");
          break;
        }

        case "#PROBLEM_EXPLANATION": {
          await handleProblemExplanationCase(
            stageRef.current,
            gptMessages,
            problem,
            addBotMessage,
            input
          );
          break;
        }

        case "#RESPOND": {
          const responsed = await getPromptResponse({
            actor: Actor.INTERVIEWER,
            context: `User has said confirmation message, acknowledge 
                the confirmation briefly and then redirect the user back to the current problem.
                        Current stage: ${currentStage}
                         Chat transcript: ${JSON.stringify(
              messages.slice(-3),
              null,
              2
            )}
                        Problem: ${problem.title}
                        Description: ${problem.problemDescription}\n
                        User's last message: ${input}`,
            promptKey: "general-respond",
            modelName: "gpt-3.5-turbo",
          });
          await addBotMessage(responsed);
          break;
        }

        case "#USER_ASKED_QUESTION": {
          const responsed = await getPromptResponse({
            actor: Actor.INTERVIEWER,
            context: `The user has asked a conceptual question. Your task is to provide a  
               general explanation of the concept they asked about WITHOUT relating it to the current 
               problem or giving away the solution.
                        Current stage: ${currentStage}
                         Chat transcript: ${JSON.stringify(
              messages.slice(-3),
              null,
              2
            )}
                        Problem: ${problem.title}
                        Description: ${problem.problemDescription}\n
                        User's last message: ${input}`,
            promptKey: "user-asked",
            modelName: "gpt-3.5-turbo",
          });
          await addBotMessage(responsed);
          break;
        }



        case "#CODING_QUESTION": {
          await handleCodingQuestion({
            currentStage: stageRef.current,
            gptMessages,
            problem,
            input,
            currentCode: codeRef.current,
            hasProvidedApproachRef,
            addBotMessage,
          });
          break;
        }

        case "#CODING_HELP": {
          await handleCodingHelp(
            gptMessages,
            problem,
            codeRef.current,
            input,
            addBotMessage
          );
          break;
        }

        case "#GENERAL_ACKNOWLEDGMENT": {
          await handleGenralAcknowledgement(
            stageRef.current,
            gptMessages,
            problem,
            addBotMessage,
            input
          );
          break;
        }

        case "#OFF_TOPIC": {
          await handleOffTopic(
            stageRef.current,
            gptMessages,
            problem,
            addBotMessage
          );
          break;
        }

        case "#INTERVIEW_END": {
          addBotMessage(
            "The interview is over, Now you will be redirected to evaluation page!"
          );
          stageRef.current = "SESSION_END";
          setIsInputDisabled(true);
          setTimeout(() => {
            endSession(true, undefined, true);
          }, 1500);
          break;
        }

        default: {
          await handleDefaultCase(
            stageRef.current,
            gptMessages,
            problem,
            codeRef.current,
            input,
            addBotMessage
          );
          break;
        }
      }

      if (stageRef.current === "CODING") {
        if (!sessionId) {
          const sessionId = await createSession({
            userId,
            problemId: problem.problemId || "",
            problemPattern: (problem as any).problemPattern || "",
          });
          localStorage.setItem("mtv-sessionId", sessionId);

          clearCachedReport();
          updateChatsInSession(updatedUserMessages);

        }
      }
    } catch (err) {
      console.error("Error during message handling", err);
      const errorMsg = {
        actor: Actor.INTERVIEWER,
        message:
          "I couldn't comprehend due to network issue, can you state that again?",
      };
      const fallbackMessages = [...updatedUserMessages, errorMsg];
      setMessages(fallbackMessages);
      await updateChatsInSession(fallbackMessages);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (onVerifyRef) {
      onVerifyRef.current = handleVerifyCode;
    }
  }, [code, problem]);

  const handleVerifyCode = useCallback(async (isAutoSubmit: boolean = false) => {
    const currentCode = codeRef.current;
    const userApproach = approachTextRef.current;


    if (!currentCode && isAutoSubmit) {
      if (stageRef.current === "EXPLAIN_PROBLEM" || stageRef.current === "ASK_UNDERSTAND" || stageRef.current === "WAIT_FOR_APPROACH") {

        setConfirmationModal({
          text1: "Time is up!",
          text2: "You haven't started coding. This session will now end.",
          btn1Text: "OK, Go to Home",
          btn2Text: "Cancel",
          btn1Handler: () => {
            setConfirmationModal(null);
            navigate("/home", { replace: true });
          },
          btn2Handler: () => {
            setConfirmationModal(null);
            setIsInputDisabled(true);
            addBotMessage("Time is up! Kindly End the session.");
          },
        });

        return;

      } else {
        await endSession(
          true,
          undefined,
          true,
          "Time is up! No code was written, proceeding to session evaluation."
        );
        return;
      }
    }

    if (!currentCode) {
      await addBotMessage(
        "It looks like you haven't written any code yet. Kindly implement your solution."
      );
      return;
    }

    if (!problem.title) {
      console.error("Problem title is missing, cannot verify solution.");
      await addBotMessage(
        "An unexpected error occurred and I cannot verify your solution right now."
      );
      return;
    }

    if (isAutoSubmit) {
      await addBotMessage(
        "Time is up! Automatically verifying your final code..."
      );
      setIsInputDisabled(true);
    }

    setLoading(true);

    try {
      let alignmentResult = null;
      if (userApproach) {
        console.log("Verifying approach against the code...", userApproach, currentCode);
        try {
          alignmentResult = await verifyApproach({
            approach: userApproach,
            code: currentCode,
            problemTitle: problem.title,
            userId: getTokenData()?.id || "",
          });
          console.log("Alignment result:", alignmentResult);
          if (alignmentResult.alignment === "MISMATCH") {
            await addBotMessage(
              alignmentResult.feedback +
              "\nPlease correct your code to match your approach and verify again."
            );
            return;
          }
        } catch (error) {
          console.error("Error verifying approach:", error);
          await addBotMessage(
            "Sorry, I had an issue verifying your approach. Let's proceed with checking the code's correctness."
          );
        }
      }

      const testCases = await generateTestCasesWithAI(problem);
      if (!testCases || testCases.length === 0) {
        await addBotMessage(
          "⚠️ AI couldn't generate test cases. Please try again later."
        );
        return;
      }

      const rubricResult = await evaluateSolutionWithRubric(
        currentCode,
        testCases
      );
      setrubricResult(rubricResult);

      const testCaseText = testCases
        .map(
          (t, i) =>
            `#${i + 1}: input=${JSON.stringify(
              t.input
            )}, expected=${JSON.stringify(t.expected)}`
        )
        .join("\n");

      const context = `
        Problem Title: ${problem.title}
        Description: ${problem.problemDescription}
        Candidate's solution code:\n${currentCode}
      Rubric Evaluation:
      - Correctness: ${rubricResult.rubricScores.correctness}
      - Edge Cases: ${rubricResult.rubricScores.edgeCases}
      - Performance: ${rubricResult.rubricScores.performance}
      - Structure: ${rubricResult.rubricScores.structureChoice}
      - Readability: ${rubricResult.rubricScores.readability}

      AI-Generated Test Cases:
      ${testCaseText}
      `.trim();

      const correctnessResponse = await getPromptResponse({
        actor: Actor.INTERVIEWER,
        context,
        promptKey: "verify-code",
        modelName: "gpt-4o",
      });

      const isCorrect = correctnessResponse.trim().startsWith("Correct");

      if (isCorrect) {
        await addBotMessage(correctnessResponse);
        setIsSolutionVerifiedCorrect(true);
        isSolutionVerifiedCorrectRef.current = true;
        stageRef.current = "FOLLOW_UP";
        if (onVerificationSuccess) {
          onVerificationSuccess();
        }
        const followUpResponse = await getPromptResponse({
          actor: Actor.INTERVIEWER,
          context,
          promptKey: "follow-up",
          modelName: "gpt-3.5-turbo",
        });
        await addBotMessage(followUpResponse);
      } else {
        if (alignmentResult?.alignment === "MATCH") {
          const combinedFeedback = `Your implementation faithfully reflects the described approach. However, your solution is incorrect. ${correctnessResponse}`;
          await addBotMessage(combinedFeedback);
        } else {
          await addBotMessage(correctnessResponse);
        }
      }
    } catch (error) {
      console.error(
        "An error occurred during the verification process:",
        error
      );
      await addBotMessage(
        "An unexpected error occurred while verifying your solution. Please try again."
      );
    } finally {
      setLoading(false);
      if (isAutoSubmit) {
        console.log("Auto-verification complete. Ending session now.");
        await endSession(
          true,
          undefined,
          true,
          "Your code has been submitted. Proceeding to session evaluation."
        );
      }
    }
  }, [problem, addBotMessage, endSession, onVerificationSuccess]);

  useEffect(() => {
    if (onVerifyRef) {
      onVerifyRef.current = handleVerifyCode;
    }
  }, [onVerifyRef, handleVerifyCode]);

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
        <textarea
          className="chatInput"
          placeholder="Ask for guidance..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isInputDisabled}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
        />
        <div className="buttonsContainer">
          <button type="submit" className="chatSendButton" disabled={loading}>
            <div className="buttonIcon">
              <IoSend />
            </div>
            Send
          </button>
          <button
            className="endSessionButton"
            onClick={() => endSession(false, setConfirmationModal)}
          >
            <div className="buttonIcon">
              <GoMoveToEnd />
            </div>
            End Session
          </button>
        </div>
      </form>
      {loadingSessionEnd && (
        <Loading
          message={loadingMessage || "Ending session, preparing evaluation..."}
          size="large"
        />
      )}
      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
    </div>
  );
};

export default ChatBox;
