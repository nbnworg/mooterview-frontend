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
        prompt: `Please explain this problem directly and clearly, like you're the candidate's interviewer. No extra greetings or framing. Just jump into the explanation. For example: For a two sum problem , you will say something like - Here is your problem for today's interview, you are given an array and a target sum, you will have to find me pairs in the array having that sum.`,
      });
      await addBotMessage(response);
    };

    explainProblem();
  }, [problem]);

  // ✅ Load existing chat messages from session
  useEffect(() => {
    const fetchInitialChats = async () => {
      try {
        const res = await fetch(`${BASE_URL}/sessions/${sessionId}`);
        const data = await res.json();
        if (data?.chatsQueue?.length) {
          setMessages(data.chatsQueue);
        }
      } catch (err) {
        console.error("Failed to load previous chat messages", err);
      }
    };

    if (sessionId) fetchInitialChats();
  }, [sessionId]);

  // ✅ Auto-tip every 5 mins (checks every 10s)
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = elapsedTimeRef.current;

      if (elapsed - lastAutoTimeRef.current >= 300) {
        lastAutoTimeRef.current = elapsed;

        const codeSnapshot = codeRef.current?.trim() || "";
        const autoPrompt = `
You're an experienced coding interviewer.

The candidate has been working on the problem for ${Math.floor(
          elapsed / 60
        )} minutes.
Here is their current code (incomplete code or blank is also valid input):

${codeSnapshot || "[No code written yet]"}

Your job is to give **one clear next step**, using a natural, human tone like:
- "You should start by writing a function signature."
- "Try breaking this into smaller helper functions."
- "Can you think about how to handle edge cases?"
- "Right now, the code is missing the core logic..."

Strict instructions:
- If the code is empty or just boilerplate, give constructive guidance on how to get started.
- If the code is wrong or incomplete, give a direct and actionable tip.
- DO NOT say “you’re on the right track” if there’s no real progress.
- NEVER say you’re an AI, interviewer, assistant etc. Just give human, concise, helpful advice.

Now respond:
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
You're acting as a human interviewer in a live coding interview.

Strict instructions:
- If the candidate asks anything unrelated to the problem (e.g. "How’s the weather?", "What’s your name?", "Can I go to the washroom?"), reply very briefly with something like:
  "Let's focus on the problem for now."
- If they ask anything directly or indirectly related to the current coding problem, give a clear, direct, human-like explanation or hint — like you would in a real tech interview.

Be professional at all times. Don't use any phrases like "As an AI" or "I'm just an assistant". Speak naturally like a human interviewer.

Now respond to the candidate's message:
"${input}"
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
