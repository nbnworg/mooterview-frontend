/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import "./Chatbox.css";
import { getPromptResponse } from "../../utils/handlers/getPromptResponse";
import { updateSessionById } from "../../utils/handlers/updateSessionById";
import { Actor, type Problem } from "mooterview-client";
import { useNavigate } from "react-router-dom";
import { evaluateSolutionWithRubric } from "../../utils/evaluateSolutionWithRubric";
import { generateTestCasesWithAI } from "../../utils/generateTestCasesWithAI";

interface ChatBoxProps {
  problem: Problem;
  code: string;
  elapsedTime: number;
  onVerifyRef?: React.MutableRefObject<(() => void) | null>;
  onEndRef?: React.MutableRefObject<(() => void) | null>;
}

const ChatBox: React.FC<ChatBoxProps> = ({
  problem,
  code,
  elapsedTime,
  onVerifyRef,
  onEndRef,
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

  useEffect(() => {
    if (onEndRef) {
      onEndRef.current = () => endSession(true);
    }
  }, [code, problem]);

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

  const endSession = async (calledAutomatically: boolean) => {
    let wantsSolution = true;

    if (!calledAutomatically) {
      wantsSolution = window.confirm(
        "Are you sure you want to end session and view real solution?"
      );
    } else {
      alert(" Your time is finished. Please move to the Evaluation page...");
    }
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
    if (!input.trim()) return;

    const userMsg = { actor: Actor.USER, message: input };
    const updatedUserMessages = [...messages, userMsg];
    console.log("updatedUserMessages", updatedUserMessages);
    setMessages(updatedUserMessages);
    setInput("");
    setLoading(true);

    await updateChatsInSession([userMsg]);

    try {
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

    const testCases = await generateTestCasesWithAI(problem);
    if (!testCases || testCases.length === 0) {
      await addBotMessage(
        "⚠️ AI couldn't generate test cases. Please try again later."
      );
      return;
    }

    const rubricResult = await evaluateSolutionWithRubric(currentCode);

    if (rubricResult.isCorrect) {
      setIsSolutionVerifiedCorrect(true);
      isSolutionVerifiedCorrectRef.current = true;
    }

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

Candidate's Code:
${currentCode || "[No code submitted]"}

Rubric Evaluation:
- Correctness: ${rubricResult.rubricScores.correctness}
- Edge Cases: ${rubricResult.rubricScores.edgeCases}
- Performance: ${rubricResult.rubricScores.performance}
- Structure: ${rubricResult.rubricScores.structureChoice}
- Readability: ${rubricResult.rubricScores.readability}

Generated Test Cases:
${testCaseText}
`.trim();

    const interviewerFeedback = await getPromptResponse({
      actor: "interviewer",
      context,
      promptKey: "verify-code",
    });

    await addBotMessage(interviewerFeedback);
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

      <button className="endSessionButton" onClick={() => endSession(false)}>
        End Session
      </button>
    </div>
  );
};

export default ChatBox;
