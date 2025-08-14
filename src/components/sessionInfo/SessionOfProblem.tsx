/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getSessionById } from "../../utils/handlers/getSessionById";
import type { Session } from "mooterview-client";
import "./sessionOfProblem.css";
import { useNavigate } from "react-router-dom";
import { getProblemById } from "../../utils/handlers/getProblemById";
import Navbar from "../navbar/Navbar";
import { IoArrowBack, IoChevronDown, IoChevronUp } from "react-icons/io5";
import { FaRegFileAlt, FaStopCircle } from "react-icons/fa";
import { MdOutlineAccessTime } from "react-icons/md";
import { FaCirclePlay } from "react-icons/fa6";
import Footer from "../footer/Footer";

const SessionOfProblem = () => {
  const navigate = useNavigate();

  const location = useLocation();
  const sessionId = location.state?.sessionId as string | undefined;
  const [problemTitle, setProblemTitle] = useState<string>("");
  const [ses, setses] = useState<boolean>(false);

  const [currentSession, setCurrentSession] = useState<Partial<Session> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const [showSummary, setShowSummary] = useState<boolean>(true);
  const [showCode, setShowCode] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);

  useEffect(() => {
    const fetchSessionById = async () => {
      try {
        if (!sessionId) {
          setError("Missing sessionId");
          return;
        }
        setses(true);
        const result = await getSessionById(sessionId);
        setCurrentSession(result);

        if (result.problemId) {
          const problem = await getProblemById(result.problemId);
          setProblemTitle(problem.title || "Untitled");
          setses(false);
        }
      } catch (err) {
        setError("Failed to fetch session or problem details");
      }
    };

    fetchSessionById();
  }, [sessionId]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const calculateDuration = () => {
    if (!currentSession?.startTime) return "N/A";

    const start = new Date(currentSession.startTime);
    const end = currentSession.endTime
      ? new Date(currentSession.endTime)
      : new Date();
    const diffMs = end.getTime() - start.getTime();

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div>
      <Navbar />
      <div className="session-container">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          <IoArrowBack />
        </button>
        <strong className="session-title">Session Details</strong>
        <p>Comprehensive overview of your coding session</p>

        {error && <div className="session-error">{error}</div>}

        {currentSession && !ses ? (
          <>
            <div className="session-info">
              <div className="info-item">
                <div className="info-icon">
                  <FaRegFileAlt />
                </div>
                <div>
                  <span className="info-label">Problem </span>
                  <span className="info-value">{problemTitle}</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <FaCirclePlay />
                </div>
                <div>
                  <span className="info-label">Start Time</span>
                  <span className="info-value">
                    {formatDate(currentSession.startTime)}
                  </span>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">
                  <FaStopCircle />
                </div>
                <div>
                  <span className="info-label">End Time</span>
                  <span className="info-value">
                    {currentSession.endTime
                      ? formatDate(currentSession.endTime)
                      : "In Progress"}
                  </span>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">
                  <MdOutlineAccessTime />
                </div>
                <div>
                  <span className="info-label">Duration</span>
                  <span className="info-value">{calculateDuration()}</span>
                </div>
              </div>
            </div>

            <div className="chat-section">
              <div
                className="section-title toggle-title"
                onClick={() => setShowSummary(!showSummary)}
              >
                <span>Summary</span>
                {showSummary ? <IoChevronUp /> : <IoChevronDown />}
              </div>

              <div
                className={`toggle-content ${
                  showSummary ? "toggle-content--open" : ""
                }`}
              >
                <div className="chat-container ">
                  {currentSession.notes?.[0]?.content ||
                    "No summary available."}
                </div>
              </div>
            </div>
            <br />

            <div className="chat-section">
              <div
                className="section-title toggle-title"
                onClick={() => setShowCode(!showCode)}
              >
                <span>Your Code</span>
                {showCode ? <IoChevronUp /> : <IoChevronDown />}
              </div>

              {showCode && (
                <pre className="chat-container code-block">
                  {currentSession.notes?.[1]?.content || "No code available."}
                </pre>
              )}
            </div>
            <br />

            <div className="chat-section">
              <div
                className="section-title toggle-title"
                onClick={() => setShowChat(!showChat)}
              >
                <span>Chat History</span>
                {showChat ? <IoChevronUp /> : <IoChevronDown />}
              </div>

              {showChat &&
                (currentSession.chatsQueue?.length ? (
                  <div className="chat-container">
                    {currentSession.chatsQueue.map((chat, index) => (
                      <div
                        key={index}
                        className={`chat-item chat-${chat?.actor?.toLowerCase()}`}
                      >
                        <div className="chat-header">
                          <span className="chat-actor">{chat.actor}</span>
                        </div>
                        <div className="chat-message">{chat.message}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">
                    <p>No chat messages found.</p>
                  </div>
                ))}
            </div>
          </>
        ) : (
          !error && (
            <div className="loading-indicator">
              Loading session information...
            </div>
          )
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SessionOfProblem;
