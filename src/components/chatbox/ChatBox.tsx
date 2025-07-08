/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import "./Chatbox.css";
import { getPromptResponse } from "../../utils/handlers/getPromptResponse";
import { updateSessionById } from "../../utils/handlers/updateSessionById";
import { Actor, type Problem } from "mooterview-client";
import { useNavigate } from "react-router-dom";
import { createSession } from "../../utils/handlers/createSession";
import { classifyUserMessage } from "../../utils/classifyUserMsg";

interface ChatBoxProps {
    problem: Problem;
    code: string;
    elapsedTime: number;
    onVerifyRef?: React.MutableRefObject<(() => void) | null>;
    userId: string;
}

type Stage =
    | "EXPLAIN_PROBLEM"
    | "ASK_UNDERSTAND"
    | "WAIT_FOR_APPROACH"
    | "CODING"
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
    const [_stage, setStage] = useState<Stage>("EXPLAIN_PROBLEM");
    const intitalCodeContextRef = useRef("");

    const [_phase, setPhase] = useState<Phase>("CODING_NOT_STARTED");
    const phaseRef = useRef("CODING_NOT_STARTED");

    const sessionId = localStorage.getItem("mtv-sessionId");

    const navigate = useNavigate();

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

    const addBotMessage = async (text: string) => {
        const newMessage = { actor: Actor.INTERVIEWER, message: text };
        await updateChatsInSession([newMessage]);

        setMessages((prevMessages) => {
            const updated = [...prevMessages, newMessage];
            return updated;
        });
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

            localStorage.removeItem("mtv-sessionId");
            if (wantsSolution) {
                const evaluation = await generateEvaluationSummary();
                await updateSessionById({
                    sessionId,
                    notes: [
                        { content: evaluation.summary },
                        {
                            content:
                                codeRef.current.trim() || "No code provided",
                        },
                    ],
                });
                navigate(
                    `/solution/${encodeURIComponent(problem.title ?? "")}`,
                    { state: { evaluation }, replace: true }
                );
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
            await addBotMessage("Have you understood the problem?");
            setStage("ASK_UNDERSTAND");
            stageRef.current = "ASK_UNDERSTAND";
        };

        explainProblem();
    }, [problem]);

    useEffect(() => {
        const interval = setInterval(async () => {
            const elapsed = elapsedTimeRef.current;
            console.log(
                "Elapsed:",
                elapsed,
                "LastAuto:",
                lastAutoTimeRef.current,
                "Diff:",
                elapsed - lastAutoTimeRef.current
            );

            if (
                !isSolutionVerifiedCorrectRef.current &&
                elapsed - lastAutoTimeRef.current >= 300
            ) {
                lastAutoTimeRef.current = elapsed;
                const codeSnapshot = codeRef.current?.trim() || "";
                if (codeSnapshot.length > 20) {
                    setPhase("CODING");
                    phaseRef.current = "CODING";
                }

                const commonContext = `Problem: ${problem.title}\n\n${
                    problem.problemDescription
                }
                    Elapsed time: ${Math.floor(elapsed / 60)} minutes`;
                const prevAnalysisCode = intitalCodeContextRef.current;

                if (phaseRef.current === "CODING_NOT_STARTED") {

                    await getPromptResponse({
                        actor: Actor.INTERVIEWER,
                        context: commonContext,
                        promptKey: "nudge-start-coding",
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

                        Evaluate the situation and respond with:
                        - One of: #STUCK, #WRONG_PATH, or #NORMAL
                        - Followed by a one-line suggestion.`,
                        promptKey: "analyze-coding-progress",
                    });

                    if (response.includes("#NORMAL")) {
                        await addBotMessage(response);
                    }

                    if (response.includes("#STUCK")) {
                        setPhase("stuckWhileCoding");
                        phaseRef.current = "stuckWhileCoding";
                        const tip = await getPromptResponse({
                            actor: Actor.INTERVIEWER,
                            context: `${commonContext}\nUser seems stuck. Offer hints or ask them to revisit logic.`,
                            promptKey: "stuck-feedback",
                        });

                        await addBotMessage(tip);
                    } else if (response.includes("WRONG_PATH")) {
                        setPhase("goingOnWrongPath");
                        phaseRef.current = "goingOnWrongPath";
                        const warning = await getPromptResponse({
                            actor: Actor.INTERVIEWER,
                            context: `${commonContext}\nThe user seems to be going in a wrong direction or using an incorrect approach.`,
                            promptKey: "wrong-path-feedback",
                        });
                        await addBotMessage(warning);
                    }
                    intitalCodeContextRef.current = codeSnapshot;
                    setPhase("CODING");
                    phaseRef.current = "CODING";
                }
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [problem]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { actor: Actor.USER, message: input };
        const updatedUserMessages = [...messages, userMsg];
        setMessages(updatedUserMessages);
        setInput("");
        setLoading(true);
        let attemptCount = 0;

        await updateChatsInSession([userMsg]);

        const currentStage = stageRef.current;

        try {
            const classification = await classifyUserMessage(
                input,
                currentStage,
                updatedUserMessages
            );

            switch (classification) {
                case "#UNDERSTOOD_CONFIRMATION": {
                    const followup = await getPromptResponse({
                        actor: Actor.INTERVIEWER,
                        context: `User confirmed understanding. Ask them to explain their approach.
                        Chat transcript: ${JSON.stringify(messages, null, 2)}\n 
                        Problem: ${problem.title}
                        Description: ${problem.problemDescription}
                    `,
                        promptKey: "ask-approach",
                    });
                    await addBotMessage(followup);
                    setStage("WAIT_FOR_APPROACH");
                    stageRef.current = "WAIT_FOR_APPROACH";
                    break;
                }

                case "#CONFUSED": {
                    const clarification = await getPromptResponse({
                        actor: Actor.INTERVIEWER,
                        context: `User seems confused. Provide a short clarification of the problem and re-ask if they understood.
                        Chat transcript: ${JSON.stringify(messages, null, 2)}\n 
                        Problem: ${problem.title}
                        Description: ${problem.problemDescription}`,
                        promptKey: "clarify-problem",
                    });
                    await addBotMessage(clarification);
                    break;
                }

                case "#REQUESTED_EXAMPLE": {
                    const exampleResponse = await getPromptResponse({
                        actor: Actor.INTERVIEWER,
                        context: `User asked for an example. Provide a concise input/output example and repeat the original prompt.
                        Chat transcript: ${JSON.stringify(messages, null, 2)}\n 
                        Problem: ${problem.title}
                        Description: ${problem.problemDescription}`,
                        promptKey: "provide-example",
                    });
                    await addBotMessage(exampleResponse);
                    break;
                }

                case "#APPROACH_PROVIDED": {
                    const ack = await getPromptResponse({
                        actor: Actor.INTERVIEWER,
                        context: `User has shared an approach. Evaluate it and respond with one of "#CORRECT" or "#WRONG" followed by your message.
                        Chat transcript: ${JSON.stringify(messages, null, 2)}\n 
                        Problem: ${problem.title}
                        Description: ${problem.problemDescription}`,
                        promptKey: "ack-approach",
                    });

                    if (ack.includes("#CORRECT")) {
                        await addBotMessage("Okay, you can start coding now.");
                        setStage("CODING");
                        stageRef.current = "CODING";
                    } else {
                        await addBotMessage(ack.replace("#WRONG", "").trim());
                        attemptCount += 1;
                        if (attemptCount > 2) {
                            setStage("CODING");
                            stageRef.current = "CODING";
                            addBotMessage("Okay, you can start coding now");
                        } else {
                            const response = await getPromptResponse({
                                actor: Actor.INTERVIEWER,
                                context: `User has probably given wrong answer so acknowledge the approach.
                                Chat transcript: ${JSON.stringify(messages, null, 2)}`,
                                promptKey: "repeat-ask",
                            });
                            await addBotMessage(response);
                        }
                    }
                    break;
                }

                case "#OFF_TOPIC": {
                    await addBotMessage(
                        "Let's try to stay focused on the problem for now."
                    );
                    break;
                }

                default: {
                    await addBotMessage(
                        "Hmm, I’m not sure how to respond to that. Could you rephrase?"
                    );
                    break;
                }
            }

            // Auto session creation if we enter coding stage
            if (stageRef.current === "CODING") {
                if (!sessionId) {
                    const sessionId = await createSession({
                        userId,
                        problemId: problem.problemId || "",
                    });
                    localStorage.setItem("mtv-sessionId", sessionId);
                    updateChatsInSession([...messages]);
                }
            }
        } catch (err) {
            console.error("Error during message handling", err);
            const errorMsg = {
                actor: Actor.AI,
                message: "Sorry, I couldn't process that.",
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


        if (response.trim().startsWith("Correct")) {
            setIsSolutionVerifiedCorrect(true);
            isSolutionVerifiedCorrectRef.current = true;
        }

        await addBotMessage(response);
    };

    return (
        <div className="chatbox">
            <div className="chatMessages">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`chatMessage ${msg.actor.toLowerCase()}`}
                    >
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
                <button
                    type="submit"
                    className="chatSendButton"
                    disabled={loading}
                >
                    Send
                </button>
            </form>

            <button className="endSessionButton" onClick={endSession}>
                End Session
            </button>
        </div>
    );
};

export default ChatBox;
