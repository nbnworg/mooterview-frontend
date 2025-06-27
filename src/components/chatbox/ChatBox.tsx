/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import "./Chatbox.css";
import { getPromptResponse } from "../../utils/handlers/getPromptResponse";
import { updateSessionById } from "../../utils/handlers/updateSessionById";
import { Actor, type Problem } from "mooterview-client";
import { useNavigate } from "react-router-dom";

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
    const has15SecTriggered = useRef(false);
    const [waitingForHintResponse, setWaitingForHintResponse] = useState(false);
    const elapsedTimeRef = useRef(elapsedTime);
    const codeRef = useRef(code);
    const messagesRef = useRef<HTMLDivElement | null>(null);
    const hasExplainedRef = useRef(false);
    const [isSolutionVerifiedCorrect, setIsSolutionVerifiedCorrect] =
        useState(false);
    const isSolutionVerifiedCorrectRef = useRef(false);

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
                            content:
                                codeRef.current.trim() || "No code provided",
                        },
                    ],
                });
                console.log("evaluation", evaluation);
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

    // ✅ Initial problem explanation
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

    // Auto-tip every 5 mins
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
                    context: `Problem: ${problem.title}\n\n${
                        problem.problemDescription
                    }
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

    useEffect(() => {
        const interval = setInterval(() => {
            const elapsed = elapsedTimeRef.current;
            if (Math.floor(elapsed) >= 900 && !has15SecTriggered.current) {
                has15SecTriggered.current = true;

                const codeSnapshot = codeRef.current?.trim() || "";
                const autoPrompt = `

        You're acting as a human interviewer in a live coding interview.

        Here is the current problem:
        ${problem.problemDescription}

        The candidate has been working on this problem for about 15 minutes.
        Here is their current code:

        ${codeSnapshot || "[No code written yet]"}

        Now, based on the candidate's code, respond with ONE of the following:

        ---

        **IF THE CODE IS CORRECT:**
        - Congratulate them very briefly.
        - Ask them to explain their thought process.
        Example: "Nice work! That looks like a correct solution. Can you walk me through your approach?"

        **IF THE CODE IS INCOMPLETE OR INCORRECT (including no code):**
        - DO NOT give any hint yet.
        - You must ONLY ask the candidate if they would like a hint — without giving any suggestion, advice, or solution.
        - Example: "We're about 15 minutes in. Would you like a hint to help you move forward?"

        IMPORTANT:
        - Do NOT include any hints, advice, or nudges.
        - Do NOT say things like “Consider doing X” or “You might want to try…”.
        - Your job right now is ONLY to ask if they want a hint. Wait for their response before saying anything else.

        Never say you're an AI or assistant. Speak naturally, like a human interviewer.

        Now respond:
        `;

                getPromptResponse({
                    actor: Actor.INTERVIEWER,
                    context: `Problem: ${problem.title}\n\n${problem.problemDescription}`,
                    promptKey: autoPrompt,
                }).then(async (response) => {
                    await addBotMessage(response);
                    setWaitingForHintResponse(true);
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // User sends manual message
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { actor: Actor.USER, message: input };
        const updatedUserMessages = [...messages, userMsg];
        console.log("updatedUserMessages", updatedUserMessages);
        setMessages(updatedUserMessages);
        setInput("");
        setLoading(true);

        await updateChatsInSession([userMsg]);

        try {
            let aiResponse;

            if (waitingForHintResponse) {
                const wantsHint =
                    /yes|yeah|sure|okay|ok|hint|help|please/i.test(input);

                if (wantsHint) {
                    aiResponse = await getPromptResponse({
                        actor: Actor.USER,
                        context: `Problem: ${problem.title}\n\n${problem.problemDescription}\n\nCurrent code:\n${codeRef.current}`,
                        promptKey: `
            The candidate just asked for a hint about this coding problem.

            **Give them ONE clear, actionable hint that:**
            - Helps them move forward without solving the entire problem
            - Is specific to their current code state
            - Guides them toward the right approach

            Current code state:
            ${codeRef.current?.trim() || "[No code written yet]"}

            Respond like a human interviewer giving a helpful hint.
            `,
                    });
                } else {
                    aiResponse =
                        "No problem! Feel free to ask if you need help later.";
                }

                setWaitingForHintResponse(false);
            } else {
                aiResponse = await getPromptResponse({
                    actor: Actor.USER,
                    context: `Problem: ${problem.title}\n\n${problem.problemDescription}\n\nCurrent code:\n${codeRef.current}\nCandidate's message:
        "${input}"`,
                    promptKey: `handle-chat`,
                });
            }

            const botMsg = { actor: Actor.INTERVIEWER, message: aiResponse };
            const updatedFinalMessages = [...updatedUserMessages, botMsg];
            setMessages(updatedFinalMessages);
            await updateChatsInSession([botMsg]);
        } catch {
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

        console.log("code", currentCode);

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
