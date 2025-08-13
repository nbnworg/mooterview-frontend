/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
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
import { loadChatSession, clearChatSession, persistChatSession } from "../../utils/localStorageReport";


interface ChatBoxProps {
  problem: Problem;
  code: string;
  elapsedTime: number;
  onVerifyRef?: React.MutableRefObject<(() => void) | null>;
  userId: string;
  onEndRef?: React.MutableRefObject<(() => void) | null>;
  onApproachCorrectChange?: (isCorrect: boolean) => void;
  setCode: React.Dispatch<React.SetStateAction<string>>;

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
  setCode
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
  const stageRef = useRef<Stage>("EXPLAIN_PROBLEM");
  const intitalCodeContextRef = useRef("");
  const approachAttemptCountRef = useRef(0);
  const hasProvidedApproachRef = useRef(false);

  const phaseRef = useRef<Phase>("CODING_NOT_STARTED");


  const sessionId = sessionStorage.getItem("mtv-sessionId");
  const rubricResultRef = useRef<any>(null);
  const navigate = useNavigate();
  const approachTextRef = useRef<string>("");
  const [loadingSessionEnd, setLoadingSessionEnd] = useState(false);


  const [confirmationModal, setConfirmationModal] = useState<{
    text1: string;
    text2: string;
    btn1Text: string;
    btn2Text: string;
    btn1Handler: () => void;
    btn2Handler: () => void;
  } | null>(null);

  useEffect(() => {
    sessionStorage.setItem("mtv-codeSnippet", code);
  }, [code])


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
    if (onEndRef) {
      onEndRef.current = () => endSession(true);
    }
  }, [code, problem]);

  const addBotMessage = async (text: string) => {
    const newMessage = { actor: Actor.INTERVIEWER, message: text };

    if (stageRef.current === "CODING" || stageRef.current === "FOLLOW_UP") {
      hasProvidedApproachRef.current = true;
    }

    setMessages(prevMessages => {
      const updated = [...prevMessages, newMessage];
      persistChatSession({
        messages: updated,
        stage: stageRef.current,
        phase: phaseRef.current,
        approach: approachTextRef.current,
        hasApproach: hasProvidedApproachRef.current,
        hasExplainedRef: hasExplainedRef.current,
        rubricResult: rubricResultRef.current,
      });

      return updated;
    });

    await updateChatsInSession([newMessage]);
  };

  const persistState = (rubric = rubricResultRef.current) => {
    persistChatSession({
      messages,
      stage: stageRef.current,
      phase: phaseRef.current,
      approach: approachTextRef.current,
      hasApproach: hasProvidedApproachRef.current,
      hasExplainedRef: hasExplainedRef.current,
      rubricResult: rubric,
    });
  };

  const phase = sessionStorage.getItem("mtv-phase");
  if (!phase) {
    phaseRef.current = "CODING_NOT_STARTED"
  }

  if (problem.problemId !== sessionStorage.getItem("mtv-problemId")) {
    setCode("");
    clearChatSession();
  }

  useEffect(() => {
    const {
      messages: storedMessages,
      stage,
      phase,
      approach,
      hasApproach,
      hasproblemExplain,
      rubricResult: storedRubricResult
    } = loadChatSession();

    if (storedMessages.length > 0) {
      setMessages(storedMessages);
    }

    if (stage) stageRef.current = stage as any;
    if (phase) phaseRef.current = phase as any;
    if (approach) approachTextRef.current = approach;

    const isApproachBool = hasApproach === "true" ? true : false;
    
    if (onApproachCorrectChange) {
      onApproachCorrectChange(isApproachBool);
    }

    if (hasproblemExplain) {
      hasExplainedRef.current = hasproblemExplain;
    }

    if (storedRubricResult) {
      rubricResultRef.current = JSON.parse(storedRubricResult);
    }

    const storedCode = sessionStorage.getItem("mtv-codeSnippet");
    if (storedCode !== null) {
      setCode(storedCode);
    }

    const codeData: any = sessionStorage.getItem("mtv-codeSnippet");
    codeRef.current = codeData;

  }, []);


  const updateChatsInSession = async (newChats: any[]) => {
    const sessionId = sessionStorage.getItem("mtv-sessionId");
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
    skipAutoAlert?: boolean
  ) => {


    let wantsSolution = true;

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
          btn2Handler: () => setConfirmationModal(null),
        });
      }
      return;
    } else if (!skipAutoAlert) {
      alert("Your time is finished. Please move to the Evaluation page...");
    }

    const sessionId = sessionStorage.getItem("mtv-sessionId");
    if (!sessionId) {
      clearChatSession();
      navigate("/home", { replace: true });
      return;
    }
    try {
      setLoadingSessionEnd(true);

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

        sessionStorage.removeItem("mtv-sessionId");

        clearChatSession();
        navigate(`/solution/${encodeURIComponent(problem.title ?? "")}`, {
          state: {
            evaluation,
            sessionId,
            rubricResult: rubricResultRef.current
          },
          replace: true,
        });
      } else {

        clearChatSession();
        sessionStorage.removeItem("mtv-sessionId");
        navigate("/home", { replace: true });
      }

    } catch (err) {
      console.error("Failed to end session", err);
    } finally {

      setLoadingSessionEnd(false);
    }
  };

  useEffect(() => {
    const explainProblem = async () => {
      if (hasExplainedRef.current) {
        return;
      }
      hasExplainedRef.current = true;
      const response = await getPromptResponse({
        actor: Actor.INTERVIEWER,
        context: `The candidate has just started working on the following coding problem:\n\n${problem.problemDescription}`,
        promptKey: "explain-problem",
      });
      await addBotMessage(response);
      await addBotMessage("Have you understood the problem?");
      stageRef.current = "ASK_UNDERSTAND";
      persistChatSession({
        messages: messages,
        stage: stageRef.current,
        phase: phaseRef.current,
        approach: approachTextRef.current,
        hasApproach: hasProvidedApproachRef.current,
        hasExplainedRef: hasExplainedRef.current,
        rubricResult: rubricResultRef.current,
      });

      sessionStorage.setItem("mtv-problemId", problem.problemId as string);
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
                    Elapsed time: ${Math.floor(elapsed / 60)} minutes`;
        const prevAnalysisCode = intitalCodeContextRef.current;

        if (phaseRef.current === "CODING_NOT_STARTED") {
          await getPromptResponse({
            actor: Actor.INTERVIEWER,
            context: commonContext,
            promptKey: "nudge-start-coding",
          }).then(async (response) => await addBotMessage(response));
          persistState()
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

                        Evaluate the situation and respond with:
                        - One of: #STUCK, #WRONG_PATH, or #NORMAL
                        - Followed by a one-line suggestion.`,
            promptKey: "analyze-coding-progress",
          });

          if (response.includes("#NORMAL")) {
            await addBotMessage(response.replace("#NORMAL", "Good! "));
          }

          if (response.includes("#STUCK")) {
            phaseRef.current = "stuckWhileCoding";
            persistState()
            const tip = await getPromptResponse({
              actor: Actor.INTERVIEWER,
              context: `${commonContext}\nUser seems stuck. Offer hints or ask them to revisit logic.`,
              promptKey: "stuck-feedback",
            });

            await addBotMessage(tip);
            persistState();
          } else if (response.includes("WRONG_PATH")) {
            phaseRef.current = "goingOnWrongPath";
            const warning = await getPromptResponse({
              actor: Actor.INTERVIEWER,
              context: `${commonContext}\nThe user seems to be going in a wrong direction or using an incorrect approach.`,
              promptKey: "wrong-path-feedback",
            });
            await addBotMessage(warning);
            persistState();
          }
          intitalCodeContextRef.current = codeSnapshot;
          phaseRef.current = "CODING";
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [problem]);

  let followUp;
  const questionCounterValueRef = useRef<{ number: number } | null>(null);
  const handleFollowUp = useRef(0);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { actor: Actor.USER, message: input };
    const updatedUserMessages = [...messages, userMsg];
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, userMsg];

      persistChatSession({
        messages: updatedMessages,
        stage: stageRef.current,
        phase: phaseRef.current,
        approach: approachTextRef.current,
        hasApproach: hasProvidedApproachRef.current,
        hasExplainedRef: hasExplainedRef.current,
        rubricResult: rubricResultRef.current,
      });

      return updatedMessages;
    });
    setInput("");
    setLoading(true);

    await updateChatsInSession([userMsg]);
    persistState();
    const currentStage = stageRef.current;
    const codeSnapshot = codeRef.current?.trim() || "";


    try {
      const classification = await classifyUserMessage(
        input,
        currentStage,
        updatedUserMessages
      );

      switch (classification) {
        case "#UNDERSTOOD_CONFIRMATION": {
          if (currentStage === "ASK_UNDERSTAND" || currentStage === "WAIT_FOR_APPROACH") {
            const followup = await getPromptResponse({
              actor: Actor.INTERVIEWER,
              context: `User confirmed understanding. Ask them to explain their approach.
                            Chat transcript: ${JSON.stringify(
                messages,
                null,
                2
              )}\n 
                            Problem: ${problem.title}
                            Description: ${problem.problemDescription}
                        `,
              promptKey: "ask-approach",
            });
            await addBotMessage(followup);
            stageRef.current = "WAIT_FOR_APPROACH";
            approachAttemptCountRef.current = 0;
            hasProvidedApproachRef.current = false;
            persistState();
          } else {
            const response = await getPromptResponse({
              actor: Actor.INTERVIEWER,
              context: `User confirmed understanding during coding phase. Provide encouragement or next steps.
                            Current stage: ${currentStage}
                            Chat transcript: ${JSON.stringify(
                messages,
                null,
                2
              )}
                            Problem: ${problem.title}
                            Description: ${problem.problemDescription}`,
              promptKey: "coding-encouragement",
            });
            await addBotMessage(response);
            persistState();
          }
          break;
        }

        case "#CONFUSED": {
          const clarification = await getPromptResponse({
            actor: Actor.INTERVIEWER,
            context: `User seems confused. Provide a short clarification of the user question and re-ask if they understood.
                        Chat transcript: ${JSON.stringify(messages, null, 2)}\n 
                        Problem: ${problem.title}
                        Description: ${problem.problemDescription}`,
            promptKey: "clarify-problem",
          });
          await addBotMessage(clarification);
          persistState();
          break;
        }

        case "#RIGHT_ANSWER": {
          if (handleFollowUp.current === 0) {
            followUp = await getPromptResponse({
              actor: Actor.SYSTEM,
              context: `Chat transcrpt: ${JSON.stringify(messages, null, 2)}\n
                        Problem: ${problem.title}\n
                        Description: ${problem.problemDescription}\n
                        Code: ${codeSnapshot}
              `,
              promptKey: "follow-up-question-counter"
            });
            handleFollowUp.current += 1;
            questionCounterValueRef.current = { number: Number(JSON.parse(followUp).number) };
            persistState();
          }
          if (questionCounterValueRef.current && questionCounterValueRef.current.number !== 0) {
            const response = await getPromptResponse({
              actor: Actor.AI,
              context: `Chat transcrpt: ${JSON.stringify(messages, null, 2)}\n
                        Problem: ${problem.title}\n
                        Description: ${problem.problemDescription}\n
                        Code: ${codeSnapshot}`,
              promptKey: "repeat-follow-up"
            });

            await addBotMessage(response);
            questionCounterValueRef.current.number -= 1;
            if (stageRef.current === "FOLLOW_UP" || stageRef.current === "CODING") {
              hasProvidedApproachRef.current = true;
            }
            persistState();
          } else {
            await addBotMessage("Well done, that is correct");
            stageRef.current = "SESSION_END";
            hasProvidedApproachRef.current = true;
            persistState();
          }
          break;
        }

        case "#WRONG_ANSWER": {
          const response = await getPromptResponse({
            actor: Actor.INTERVIEWER,
            context: `Chat transcript: ${JSON.stringify(messages, null, 2)}\n 
                        Problem: ${problem.title}
                        Description: ${problem.problemDescription}`,
            promptKey: "ack-followup",
          });
          await addBotMessage(response);
          if (stageRef.current === "FOLLOW_UP" || stageRef.current === "CODING") {
            hasProvidedApproachRef.current = true;
          }
          persistState();
          break;
        }

        case "#REQUESTED_EXAMPLE": {
          const exampleResponse = await getPromptResponse({
            actor: Actor.INTERVIEWER,
            context: `User asked for an example or to rephrase the question.\n
                        Chat transcript: ${JSON.stringify(messages, null, 2)}\n 
                        Problem: ${problem.title}
                        Description: ${problem.problemDescription}
                        Current stage: ${currentStage}
                        `,
            promptKey: "provide-example",
          });
          await addBotMessage(exampleResponse);
          persistState();
          break;
        }

        case "#APPROACH_PROVIDED": {
          if (
            currentStage === "WAIT_FOR_APPROACH" &&
            !hasProvidedApproachRef.current
          ) {

            const ack = await getPromptResponse({
              actor: Actor.INTERVIEWER,
              context: `User has shared an approach. Evaluate it and respond with one of "#CORRECT" or "#WRONG" followed by your message.
                            Chat transcript: ${JSON.stringify(
                messages,
                null,
                2
              )}\n 
              User approach: ${input}
                            Problem: ${problem.title}
                            Description: ${problem.problemDescription}`,
              promptKey: "ack-approach",
            });

            if (ack.includes("#CORRECT")) {
              await addBotMessage(
                "Alright, you can start coding now.\nIf you get stuck at any point, feel free to ask for help. Once you've completed your code, click on 'Verify Code' button to check your solution."
              );
              approachTextRef.current = input;
              stageRef.current = "CODING";
              hasProvidedApproachRef.current = true;
              if (onApproachCorrectChange) {
                onApproachCorrectChange(true);
              }
            } else {
              await addBotMessage(ack.replace("#WRONG", "").trim());
              approachAttemptCountRef.current += 1;

              if (approachAttemptCountRef.current >= 2) {
                await addBotMessage(
                  "That's okay, you can start coding now and we'll work through it together."
                );
                stageRef.current = "CODING";
                hasProvidedApproachRef.current = true;
                if (onApproachCorrectChange) {
                  onApproachCorrectChange(true);
                }
                persistState();
              } else {
                const response = await getPromptResponse({
                  actor: Actor.INTERVIEWER,
                  context: `User has given an incorrect approach. Ask them to try again.
                                    Chat transcript: ${JSON.stringify(
                    messages,
                    null,
                    2
                  )}`,
                  promptKey: "repeat-ask",
                });
                await addBotMessage(response);
                persistState();
              }
            }
          } else {
            const response = await getPromptResponse({
              actor: Actor.INTERVIEWER,
              context: `User is asking a follow-up question. Provide helpful guidance.
                            Current stage: ${currentStage}
                            Chat transcript: ${JSON.stringify(
                messages,
                null,
                2
              )}
                            Problem: ${problem.title}
                            Description: ${problem.problemDescription}`,
              promptKey: "general-guidance",
            });
            await addBotMessage(response);
            persistState();
          }
          break;
        }

        case "#PROBLEM_EXPLANATION": {
          addBotMessage("Okay, you can explain the approach now!");
          persistState();
          break;
        }

        case "#RESPOND": {
          addBotMessage("Okay, go ahead");
          persistState();
          break;
        }

        case "#CODING_QUESTION": {
          if (
            currentStage === "WAIT_FOR_APPROACH" &&
            !hasProvidedApproachRef.current
          ) {
            const clarificationPrompt = await getPromptResponse({
              actor: Actor.INTERVIEWER,
              context: `
                            Chat transcript: ${JSON.stringify(
                messages.slice(-3),
                null,
                2
              )}
                            Problem: ${problem.title}
                            Description: ${problem.problemDescription}`,
              promptKey: "ask-approach-before-coding",
            });
            await addBotMessage(clarificationPrompt);
            persistState();
          } else {
            const response = await getPromptResponse({
              actor: Actor.INTERVIEWER,
              context: `User is asking a coding question. Provide helpful guidance on where to start or how to proceed.
                            Chat transcript: ${JSON.stringify(
                messages,
                null,
                2
              )}
                            Problem: ${problem.title}
                            Description: ${problem.problemDescription}
                            Current code: ${codeRef.current}`,
              promptKey: "coding-start-guidance",
            });
            await addBotMessage(response);
            persistState();
          }
          break;
        }

        case "#CODING_HELP": {
          const response = await getPromptResponse({
            actor: Actor.INTERVIEWER,
            context: `User needs help with coding/debugging. Provide specific assistance.
                        Chat transcript: ${JSON.stringify(messages.slice(-5), null, 2)}
                        Problem: ${problem.title}
                        Description: ${problem.problemDescription}
                        Current code: ${codeRef.current}`,
            promptKey: "coding-debug-help",
          });
          await addBotMessage(response);
          persistState();
          break;
        }

        case "#GENERAL_ACKNOWLEDGMENT": {
          const response = await getPromptResponse({
            actor: Actor.INTERVIEWER,
            context: `User acknowledged something. Provide encouragement and next steps.
                        Current stage: ${currentStage}
                        Chat transcript: ${JSON.stringify(messages, null, 2)}
                        Problem: ${problem.title}
                        Description: ${problem.problemDescription}`,
            promptKey: "general-encouragement",
          });
          await addBotMessage(response);
          persistState();
          break;
        }

        case "#OFF_TOPIC": {

          const followup = await getPromptResponse({
            actor: Actor.INTERVIEWER,
            context: `The user went off-topic, but you must keep the interview on track.
              Maintain the current stage and context.
              Here is the full chat so far:
              ${JSON.stringify(messages.slice(-3), null, 2)}
              Problem: ${problem.title}
              Description: ${problem.problemDescription}
              Current stage: ${currentStage}
             `,
            promptKey: "off-topic",
          });

          await addBotMessage(followup);
          persistState();
          break;
        }

        case "#INTERVIEW_END": {
          addBotMessage("The interview is over now, you can head back!");
          persistState();
          break;
        }

        default: {
          if (currentStage === "CODING") {
            const response = await getPromptResponse({
              actor: Actor.INTERVIEWER,
              context: `User is asking a question during coding phase. Provide helpful guidance.
                            Chat transcript: ${JSON.stringify(
                messages,
                null,
                2
              )}
                            Problem: ${problem.title}
                            Description: ${problem.problemDescription}
                            Current code: ${codeRef.current}`,
              promptKey: "coding-guidance",
            });
            await addBotMessage(response);
            persistState();

          }
          else {
            const response = await getPromptResponse({
              actor: Actor.INTERVIEWER,
              context: `
                User's message does not match predefined classifications
                in this ${currentStage} phase.
                Stay in this stage and respond in a way that moves this stage forward.
                ${JSON.stringify(messages.slice(-3), null, 2)}
                Problem: ${problem.title}
                Description: ${problem.problemDescription}
                Current code: ${codeRef.current || "N/A"}`,
              promptKey: "general-fallback",
            });
            await addBotMessage(response);
            persistState();
          }
          break;
        }
      }

      if (stageRef.current === "CODING") {
        if (!sessionId) {
          const sessionId = await createSession({
            userId,
            problemId: problem.problemId || "",
          });
          sessionStorage.setItem("mtv-sessionId", sessionId);
          clearCachedReport();
          updateChatsInSession([...messages]);
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

  const handleVerifyCode = async () => {
    const currentCode = codeRef.current;
    let rubricResult;

    if (!currentCode) {
      await addBotMessage(
        "It looks like you haven't written any code yet. Kindly implement your solution."
      );
      persistChatSession({
        messages,
        stage: stageRef.current,
        phase: phaseRef.current,
        approach: approachTextRef.current,
        hasApproach: hasProvidedApproachRef.current,
        hasExplainedRef: hasExplainedRef.current,
        rubricResult: rubricResult,
      });
      return;
    }

    if (approachTextRef.current.trim()) {
      const approachCheckResponse = await getPromptResponse({
        actor: Actor.INTERVIEWER,
        context: `
        The candidate initially described the following approach:
        ${approachTextRef.current}

        Their final submitted code is:
        ${currentCode}
      `,
        promptKey: "check-approach-alignment",
      });
      if (approachCheckResponse.includes("#MISMATCH")) {
        await addBotMessage(
          approachCheckResponse.replace(
            "#MISMATCH:",
            "Your code does not seem to follow the approach you described: "
          )
        )
        persistChatSession({
          messages,
          stage: stageRef.current,
          phase: phaseRef.current,
          approach: approachTextRef.current,
          hasApproach: hasProvidedApproachRef.current,
          hasExplainedRef: hasExplainedRef.current,
          rubricResult: rubricResult,
        });
        return;
      }
    }

    const testCases = await generateTestCasesWithAI(problem);

    if (!testCases || testCases.length === 0) {
      await addBotMessage(
        "⚠️ AI couldn't generate test cases. Please try again later."
      );
      persistChatSession({
        messages,
        stage: stageRef.current,
        phase: phaseRef.current,
        approach: approachTextRef.current,
        hasApproach: hasProvidedApproachRef.current,
        hasExplainedRef: hasExplainedRef.current,
        rubricResult: rubricResult,
      });
      return;
    }

    rubricResultRef.current = await evaluateSolutionWithRubric(currentCode);
    persistState(rubricResultRef.current);

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
      Description: ${problem.problemStatement}

      Candidate's solution code:
      ${currentCode || "[No code provided]"}

      Rubric Evaluation:
      - Correctness: ${rubricResultRef.current.rubricScores.correctness}
      - Edge Cases: ${rubricResultRef.current.rubricScores.edgeCases}
      - Performance: ${rubricResultRef.current.rubricScores.performance}
      - Structure: ${rubricResultRef.current.rubricScores.structureChoice}
      - Readability: ${rubricResultRef.current.rubricScores.readability}

      AI-Generated Test Cases:
      ${testCaseText}
      `.trim();

    const response = await getPromptResponse({
      actor: Actor.INTERVIEWER,
      context,
      promptKey: "verify-code",
    });

    await addBotMessage(response);
    persistState(rubricResultRef.current);
    if (response.trim().startsWith("Correct")) {
      setIsSolutionVerifiedCorrect(true);
      isSolutionVerifiedCorrectRef.current = true;
      stageRef.current = "FOLLOW_UP";
      persistState(rubricResultRef.current);

      const followUpResponse = await getPromptResponse({
        actor: Actor.INTERVIEWER,
        context,
        promptKey: "follow-up",
      });

      await addBotMessage(followUpResponse);
      persistState(rubricResultRef.current);
    }
  };

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

      <button className="endSessionButton" onClick={() => endSession(false, setConfirmationModal)}>
        End Session
      </button>

      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
      {loadingSessionEnd && (
        <div className="session-loading-overlay">
          <div className="spinner"></div>
          <p className="loading-message">Ending session and generating evaluation...</p>
        </div>
      )}

    </div>
  );
};

export default ChatBox;