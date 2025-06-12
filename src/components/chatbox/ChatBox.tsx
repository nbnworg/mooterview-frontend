/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";

import "./Chatbox.css";
import { getPromptResponse } from "../../utils/handlers/getPromptResponse";
import { updateSessionById } from "../../utils/handlers/updateSessionById";
import { Actor, type Problem } from "mooterview-client";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../utils/constants";

interface ChatBoxProps {
  problem: Problem;
  code: string;
  elapsedTime: number;
}

const ChatBox: React.FC<ChatBoxProps> = ({ problem, code, elapsedTime }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const lastAutoTimeRef = useRef(0);
  const elapsedTimeRef = useRef(elapsedTime);
  const codeRef = useRef(code);
  const navigate = useNavigate();
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const sessionId = localStorage.getItem("mtv-sessionId");

  useEffect(() => {
    elapsedTimeRef.current = elapsedTime;
  }, [elapsedTime]);

  useEffect(() => {
    messagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  const addBotMessage = async (text: string) => {
    const newMessage = { actor: Actor.INTERVIEWER, message: text };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    await updateChatsInSession(updatedMessages);
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

  const endSession = async () => {
    if (!sessionId) return;
    try {
      await updateSessionById({
        sessionId,
        endTime: new Date().toISOString(),
      });
      alert("Session ended successfully.");
      navigate("/home");
    } catch (err) {
      console.error("Failed to end session", err);
    }
  };

  // ✅ Initial problem explanation
  useEffect(() => {
    const explainProblem = async () => {
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

  // ✅ Auto-tip every 5 mins (checks every 10s)
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = elapsedTimeRef.current;

      if (elapsed - lastAutoTimeRef.current >= 300) {
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
- “Have you thought about using a set instead of a map?”

Rules:
- If code is missing or boilerplate, give a gentle but specific nudge to start.
- Don’t be vague or overly polite.
- Don’t say you’re an AI or assistant.
- Never say “Let’s focus on the problem.” Be practical and helpful.

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

  // ✅ User sends manual message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { actor: Actor.USER, message: input };
    const updatedUserMessages = [...messages, userMsg];
    setMessages(updatedUserMessages);
    setInput("");
    setLoading(true);

    await updateChatsInSession(updatedUserMessages);

    try {
      const aiResponse = await getPromptResponse({
        actor: Actor.USER,
        context: `Problem: ${problem.title}\n\n${problem.problemDescription}\n\nCurrent code:\n${codeRef.current}`,
        prompt: `
You're acting as a calm, professional human interviewer in a live coding interview.

Your job is to evaluate and guide the candidate. Respond in a natural, human tone based on the candidate’s message.

👉 Instructions:
1. **If the candidate is asking a technical question** (like time complexity, TLE, code issue), answer clearly and concisely — like a peer engineer would.
2. **If they want to end**, you can allow it, or redirect if it's too early — but never say “Let’s focus on the problem” in a robotic way. Example:
   - "You can, but take a final look — anything else you might want to improve?"
3. **If they ask what's next**, give an honest answer:
   - "We'll stop here for now — but practicing X would help you next."
   - Or redirect politely if not finished.
4. **Never use phrases like** “Feel free to ask” or “Happy to help.” Be natural and straight to the point.
5. **Keep it short** (1-2 sentences max). Don't summarize what they already know. End with purpose, not politeness.

Candidate's message:
"${input}"

Now write your reply as a human interviewer:
`,
      });

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
    </div>
  );
};

export default ChatBox;
