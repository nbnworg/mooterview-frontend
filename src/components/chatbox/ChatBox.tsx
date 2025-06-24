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

        setMessages((prevMessages) => {
            const updated = [...prevMessages, newMessage];
            updateChatsInSession(updated);
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

        const prompt = `
            You're an experienced, no-nonsense coding interviewer evaluating a full mock interview.
                
            Your task is to return a strict evaluation JSON object in this **exact structure**:
                
            {
              "summary": "A detailed, direct paragraph (at least 3 sentences) evaluating the candidate's behavior, thinking, and code quality like “what did the user ask, what did he not ask, what testcases he considered”.",
              "alternativeSolutions": [
                "FULL self-contained code for an optimal or DIFFERENT approach #1 (must use a different logic or technique)",
                "FULL self-contained code for an optimal or DIFFERENT approach #2 (must use a different logic or technique)"
              ]
            }
                
            **Summary Requirements:**
            - Speak directly to the candidate using “you” and not “candidate”.
            - Be specific: Did you ask clarification questions? What did you test or miss? Did you show problem-solving skills or not?
            - Be blunt. No fluff or politeness.
            - DO NOT SAY THINGS like “The candidate showed good problem-solving skills by clearly understanding” if the candidate has done no work or provoded nothing in the entire session.
            - Minimum 3 sentences. Do NOT output fewer.
                
            **Alternative Solutions Requirements:**
            - Do NOT just rename variables; each must follow a different **approach** (e.g. brute-force, hash map, two-pointer with sort, etc.)
            - Each solution must be fully self-contained code (Python)
            - NO comments, NO markdown, NO explanations — just code
            - NEVER output text like "Full code for..." — only the raw code strings.
                
            If no code was written, generate both solutions from scratch using two different approaches.
                
            Problem: ${problem.title}
            Description: ${problem.problemDescription}
                
            Elapsed time: ${elapsedTimeRef.current / 60} minutes
                
            Final code:
            ${codeRef.current?.trim() || "No code was written."}
                
            Chat transcript:
            ${JSON.stringify(messages, null, 2)}
            `;

        const response = await getPromptResponse({
            actor: Actor.INTERVIEWER,
            context: `Problem: ${problem.title}`,
            prompt,
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
                    notes: [{ content: evaluation.summary }],
                });
                console.log("evaluation", evaluation);
                navigate(
                    `/solution/${encodeURIComponent(problem.title ?? "")}`,
                    { state: { evaluation } }
                );
            } else {
                alert("Session ended successfully.");
                navigate("/home");
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
            console.log("called");

            const response = await getPromptResponse({
                actor: Actor.INTERVIEWER,
                context: `The candidate has just started working on the following coding problem:\n\n${problem.problemDescription}`,
                prompt: `
        You're a calm, confident human interviewer. The candidate has just received this problem:

        "${problem.problemDescription}"

        Introduce the problem in a direct and natural way, as if you're speaking to the candidate live. Don’t over-explain — your goal is to clearly present the core task.

        Examples of tone:
        - "Here’s the problem for today..."
        - "You’re given X and Y — figure out how to Z."

        Strict guidelines:
        - DO NOT greet or say things like “Hi” or “Welcome.”
        - DO NOT say “I’m your interviewer” or “I’m here to help.”
        - Just state the problem in a straightforward, conversational way — as if the candidate asked “What’s the task?”

        Now speak directly to the candidate:
        `,
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
                const autoPrompt = `
          You are acting as a human coding interviewer.

          It’s been ${Math.floor(
              elapsed / 60
          )} minutes since the interview started. The candidate is working on the following problem:

          "${problem.title}"

          Their current code is:
          ${codeSnapshot || "[No code written yet]"}

          Give ONE clear next step — in a natural, human tone — like you're observing them live and want to guide without giving away the full solution.

          Examples:
          - “Try starting with the base case first.”
          - “It looks like your loop isn’t handling duplicates correctly.”
          - “Have you thought about using a set instead of a map?, Have you tried covering this testcase? Can you dry run this to me?”

          Rules:
          - If code is missing or boilerplate, give a gentle but specific nudge to start.
          - Don’t be vague or overly polite.
          - Don’t say you’re an AI or assistant.
          - Never say “Let’s focus on the problem.” Be practical and helpful.
          - anything technical related to the problem and the code, you will answer it.

          Now give a natural next-step prompt to the candidate:
          `;
                getPromptResponse({
                    actor: Actor.INTERVIEWER,
                    context: `Problem: ${problem.title}\n\n${problem.problemDescription}`,
                    prompt: autoPrompt,
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
            console.log("elapsed", elapsed);

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
                    prompt: autoPrompt,
                }).then(async (response) => {
                    await addBotMessage(response);
                    setWaitingForHintResponse(true);
                });
                console.log("functioncclled");
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

        await updateChatsInSession(updatedUserMessages);

        try {
            let aiResponse;

            if (waitingForHintResponse) {
                const wantsHint =
                    /yes|yeah|sure|okay|ok|hint|help|please/i.test(input);

                if (wantsHint) {
                    aiResponse = await getPromptResponse({
                        actor: Actor.USER,
                        context: `Problem: ${problem.title}\n\n${problem.problemDescription}\n\nCurrent code:\n${codeRef.current}`,
                        prompt: `
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
                    context: `Problem: ${problem.title}\n\n${problem.problemDescription}\n\nCurrent code:\n${codeRef.current}`,
                    prompt: `
          You're acting as a calm, professional human interviewer in a live coding interview.

        Your job is to evaluate and guide the candidate. Respond in a natural, human tone based on the candidate’s message.

        1. If the candidate is asking a technical question, answer clearly and briefly — like an experienced peer helping out.

        2. If the candidate wants to stop or tends to stop or says things like "I can't think of anything" or "I'll stop here":
          - **Acknowledge it** calmly.
          - **Ask once** if they’d like to take a final look or add anything.
          - If they confirm “no” or say “I’m done”, **end confidently.**
          - Examples:
            - "Alright, let’s stop here then. Good effort overall — hope this gave you some useful practice."
            - "Sounds good. Take care and keep practicing — you’re getting there."

        3. If they ask what to do next, suggest practice tips or tell them to wrap up the code cleanly.

        4. Never say you're an AI or assistant. Don't be overly polite or robotic. No greetings or closings like "Feel free to ask" or "Happy to help."

        5. Keep your response short — ideally 1-2 sentences max.

        Candidate's message:
        "${input}"

        Now write your reply as a human interviewer:
        `,
                });
            }

            const botMsg = { actor: Actor.INTERVIEWER, message: aiResponse };
            const updatedFinalMessages = [...updatedUserMessages, botMsg];
            setMessages(updatedFinalMessages);
            await updateChatsInSession(updatedFinalMessages);
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

        const prompt = `
    You are a human coding interviewer evaluating a submitted solution.

    Start your response with exactly one of the following two lines:
    - "Correct"
    - "Incorrect"

    Then follow up naturally as you would in a mock interview.

    Problem: ${problem.title}
    Description: ${problem.problemStatement}

    Candidate's solution code:
    ${currentCode || "[No code provided]"}

    Your job is to evaluate the code and do **one** of the following:

    1. ❌ If the solution is **incorrect** or **missing**:
      - Respond naturally as a live interviewer.
      - Give only **one specific and helpful tip**.
      - No lists or generic phrases — give one realistic nudge like:
        - “Looks like you haven't handled the loop correctly — try stepping through an example.”

    2. ✅ If the solution is **correct**:
      - Begin a realistic **back-and-forth conversation** with the candidate.
      - Start with a thoughtful follow-up question like:
        - “Can you walk me through your approach?”
      - Then imagine the candidate responds briefly.
      - Then you ask another deeper question.
      - Repeat for 3 to 4 rounds.
      - Keep it casual, like a real mock interview.

    Rules:
    - Speak naturally, like a calm, focused interviewer.
    - Avoid robotic phrases like “Correct solution.” or “Incorrect solution.”
    - Don’t say “the candidate” — talk directly.
    - Don’t give all follow-ups at once. Simulate a natural exchange.
    - Avoid saying you’re an AI or assistant.

    Now respond as the interviewer.
    `;

        const response = await getPromptResponse({
            actor: Actor.INTERVIEWER,
            context: `Problem: ${problem.title}\n${problem.problemStatement}`,
            prompt,
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
