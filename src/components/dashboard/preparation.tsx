import { useState, useEffect } from "react";
import type { Session } from "mooterview-client";
import { getAllSessionByUserId } from "../../utils/handlers/getAllSessionById";
import { getTokenData } from "../../utils/constants";
import { getPromptResponse } from "../../utils/handlers/getPromptResponse";
import './dashboard.css';

const Preparation = () => {
  const [gptSummary, setGptSummary] = useState({
    headline: "",
    summary: "",
    overallReadiness: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionsAndCallGPT = async () => {
      try {
        setLoading(true);
        setError(null);

        const response: any = await getAllSessionByUserId(getTokenData().id);
        let fetchedSessions: Session[] = response.sessions;

        fetchedSessions.sort(
          (a, b) => new Date(b.startTime || "").getTime() - new Date(a.startTime || "").getTime()
        );
        fetchedSessions = fetchedSessions.slice(0, 5);

        const extractedSessionData = fetchedSessions.map((session) => ({
          chatsQueue: session.chatsQueue,
          note0: session.notes?.[0] || null,
          note1: session.notes?.[1] || null,
          problemId: session.problemId,
        }));

        const sessionContext = extractedSessionData
          .map((session, i) => {
            const chatMessages = session.chatsQueue ||[]
              .map((chat: any) => `• ${chat.role}: ${chat.content}`)
              .join("\n");

            return `Session ${i + 1}:
 Problem ID: ${session.problemId}

 User Summary (notes[0]):
${session.note0?.content || "No summary written."}

 Final Code (notes[1]):
${session.note1?.content || "No code submitted."}

 Chat Transcript:
${chatMessages}`;
          })
          .join("\n\n");

        const context = `${sessionContext}`;
        const promptKey = "performance-evaluation";

        const gptResponse = await getPromptResponse({
          actor: "INTERVIEWER",
          context,
          promptKey,
        });

        try {
          const parsed = JSON.parse(gptResponse);
          setGptSummary({
            headline: parsed.headline || "",
            summary: parsed.summary || "",
            overallReadiness: parsed.overallReadiness || "",
          });
        } catch (err) {
          setGptSummary({
            headline: "Invalid GPT response",
            summary: gptResponse,
            overallReadiness: "",
          });
        }
      } catch (err) {
        setError("Failed to fetch sessions.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionsAndCallGPT();
  }, []);

  return (
    <div >
      <h3 className="section-title"> Preparation Report</h3>
      
      {loading && <p> Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {gptSummary.summary && (
        <div>
           <p><strong>🏁Overall Readiness score:{gptSummary.overallReadiness}</strong></p>
          <h4> {gptSummary.headline}.</h4>
          <p style={{ whiteSpace: "pre-wrap" }}>{gptSummary.summary}</p>
         
        </div>
      )}
    </div>
  );
};

export default Preparation;
