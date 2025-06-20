/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import "./Chatbox.css";
import { getPromptResponse } from "../../utils/handlers/getPromptResponse";
import { updateSessionById } from "../../utils/handlers/updateSessionById";
import { Actor, type Problem } from "mooterview-client";

interface ChatBoxProps {
  problem: Problem;
  code: string;
  elapsedTime: number;
  endSession: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({
  problem,
  code,
  elapsedTime,
  endSession,
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

  // const endSession = async () => {
  //   if (!sessionId) return;
  //   try {
  //     await updateSessionById({
  //       sessionId,
  //       endTime: new Date().toISOString(),
  //     });
  //     alert("Session ended successfully.");
  //     navigate("/home");
  //   } catch (err) {
  //     console.error("Failed to end session", err);
  //   }
  // };

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

  // Auto-tip every 5 mins
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
    console.log('elapsed', elapsed)
    
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
    setMessages(updatedUserMessages);
    setInput("");
    setLoading(true);

    await updateChatsInSession(updatedUserMessages);

    try {
    let aiResponse;
    
    if (waitingForHintResponse) {
      const wantsHint = /yes|yeah|sure|okay|ok|hint|help|please/i.test(input);
      
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
        aiResponse = "No problem! Feel free to ask if you need help later.";
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
