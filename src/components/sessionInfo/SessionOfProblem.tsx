import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getSessionById } from "../../utils/handlers/getSessionById";
import type { Session } from "mooterview-client";
import "./sessionOfProblem.css";
import { useNavigate } from "react-router-dom";
import { getProblemById } from "../../utils/handlers/getProblemById";
import Navbar from "../navbar/Navbar";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";


const SessionOfProblem = () => {
    const navigate = useNavigate();

    const location = useLocation();
    const sessionId = location.state?.sessionId as string | undefined;
    const [problemTitle, setProblemTitle] = useState<string>("");
    const [ses, setses] = useState<boolean>(false);

    const [currentSession, setCurrentSession] = useState<Partial<Session> | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Toggle states
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
        const end = currentSession.endTime ? new Date(currentSession.endTime) : new Date();
        const diffMs = end.getTime() - start.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const remainingMins = diffMins % 60;

        if (diffHours > 0) {
            return `${diffHours}h ${remainingMins}m`;
        }
        return `${diffMins}m`;
    };

    return (
        <div>
            <Navbar />
            <div className="session-container">
                <strong className="session-title">Session Details</strong>

                {error && <div className="session-error">{error}</div>}

                {currentSession && !ses ? (
                    <>
                        <div className="session-info">
                            <div className="info-item">
                                <span className="info-label">Problem :</span>
                                <span className="info-value">{problemTitle}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Status:</span>
                                <span className={`status-badge ${currentSession.problemStatus}`}>
                                    {currentSession.problemStatus || "Unknown"}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Start Time:</span>
                                <span className="info-value">{formatDate(currentSession.startTime)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">End Time:</span>
                                <span className="info-value">
                                    {currentSession.endTime ? formatDate(currentSession.endTime) : "In Progress"}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Duration:</span>
                                <span className="info-value">{calculateDuration()}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Total Messages:</span>
                                <span className="info-value">{currentSession.chatsQueue?.length || 0}</span>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="chat-section">
                            <div
                                className="section-title toggle-title"
                                onClick={() => setShowSummary(!showSummary)}
                            >
                                <span>Summary</span>
                                {showSummary ? <IoChevronUp /> : <IoChevronDown />}
                            </div>

                            <div className={`toggle-content ${showSummary ? "toggle-content--open" : ""}`}>
                                <div className="chat-container ">
                                    {currentSession.notes?.[0]?.content || "No summary available."}
                                </div>
                            </div>

                        </div>
                        <br />

                        {/* Your Code */}
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

                        {/* Chat History */}
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
                                                    <span className="chat-index">#{index + 1}</span>
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
                    !error && <div className="loading-indicator">Loading session information...</div>
                )}
                <button className="back-button" onClick={() => navigate("/dashboard")}>
                    Back
                </button>
            </div>
        </div>
    );
};

export default SessionOfProblem;
