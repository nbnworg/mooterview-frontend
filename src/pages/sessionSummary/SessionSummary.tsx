/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import { getSessionById } from "../../utils/handlers/getSessionById";
import type { Session } from "mooterview-client";
import "./sessionSummary.css";

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

const SessionSummary = () => {
  const { id } = useParams();
  const location = useLocation();
  const { finalCode } = (location.state as { finalCode?: string }) || {};
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchSession = async () => {
      try {
        const data = await getSessionById(id);
        setSession(data);
      } catch (err: any) {
        setError(err.message || "Failed to load session.");
      }
    };

    fetchSession();
  }, [id]);

  if (error) {
    return (
      <>
        <Navbar />
        <p className="error">{error}</p>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Navbar />
        <p>Loading...</p>
      </>
    );
  }

  const durationSec = session.startTime && session.endTime
    ? Math.floor(
        (new Date(session.endTime).getTime() -
          new Date(session.startTime).getTime()) /
          1000
      )
    : 0;

  return (
    <>
      <Navbar />
      <section className="sessionSummarySection">
        <h1>Session Summary</h1>
        <p>Duration: {formatDuration(durationSec)}</p>
        {finalCode && (
          <div>
            <h2>Final Code</h2>
            <pre>{finalCode}</pre>
          </div>
        )}
        <div>
          <h2>Chat Transcript</h2>
          {session.chatsQueue?.map((msg, idx) => (
            <p key={idx}>
              <strong>{msg.actor}: </strong>
              {msg.message}
            </p>
          ))}
        </div>
      </section>
    </>
  );
};

export default SessionSummary;
