import { useState, useEffect, useMemo } from "react";
import type { Session, SessionSummary } from "mooterview-client";
import { getAllSessionByUserId } from "../../utils/handlers/getAllSessionById";
import { getTokenData } from "../../utils/constants";
import { Link } from "react-router-dom";
import { getUserById } from "../../utils/handlers/getUserInfoById";
import type { GetUserByIdOutput } from "mooterview-client";
import "./dashboard.css";
import { getProblemById } from "../../utils/handlers/getProblemById";
import type { Problem } from "mooterview-client";
import Navbar from "../navbar/Navbar";
import Preparation from "./preparation";
import PreparationChart from "./PreparationChart";
import { IoMdArrowRoundBack } from "react-icons/io";
import Footer from "../footer/Footer";

const BASE_PROBLEM_TYPES = [
  "Arrays & Hashing",
  "Two Pointers",
  "Stack",
  "Sliding Window",
  "Linked List",
  "Binary Search",
  "Trees",
  "Tries",
  "Heap/Priority Queue",
  "Backtracking"
];

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  return (
    <div className="pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-button"
      >
        &larr;
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`pagination-button ${currentPage === page ? "active" : ""}`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="pagination-button"
      >
        &rarr;
      </button>
    </div>
  );
};

const DashBoard = () => {
  const [sessions, setSessions] = useState<Session[] | SessionSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<GetUserByIdOutput>();
  const [problems, setProblems] = useState<{ [key: string]: string }>({});
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 10;
  const [typeToProblems, setTypeToProblems] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    localStorage.removeItem("mtv-sessionId");
  }, []);
  
  useEffect(() => {
    const fetchAll = async () => {
      setPageLoading(true);
      setError(null);

      try {
        const [userResponse, sessionResponse] = await Promise.all([
          getUserById(getTokenData().id),
          getAllSessionByUserId(getTokenData().id),
        ]);
        setUserData(userResponse);

        let fetchedSessions: Session[] | SessionSummary[] = sessionResponse.sessions || [];
        fetchedSessions = fetchedSessions.sort(
          (a, b) => new Date(b.startTime ?? 0).getTime() - new Date(a.startTime ?? 0).getTime()
        );
        setSessions(fetchedSessions);

        const uniqueProblemIds = [
          ...new Set(fetchedSessions.map((s) => s.problemId).filter(Boolean)),
        ] as string[];

        const fetchedProblems: { [key: string]: string } = {};
        await Promise.all(
          uniqueProblemIds.map(async (problemId) => {
            try {
              const problem: Problem = await getProblemById(problemId);
              fetchedProblems[problemId] = problem.title || "Untitled";
            } catch {
              fetchedProblems[problemId] = "Title not found";
            }
          })
        );
        setProblems(fetchedProblems);

        const seenProblems = new Set<string>();
        const typeMap: { [key: string]: string[] } = {};
        fetchedSessions.forEach((session) => {
          if (!session.problemId || seenProblems.has(session.problemId)) return;
          seenProblems.add(session.problemId);
          let type: string = "Unknown";
          if ("problemPattern" in session) {
            type = (session.problemPattern as string) || "Unknown";
          }
          if (!typeMap[type]) typeMap[type] = [];
          typeMap[type].push(fetchedProblems[session.problemId] || "Untitled Problem");
        });

        const completeTypeToProblems: { [key: string]: string[] } = {};
        BASE_PROBLEM_TYPES.forEach((type) => {
          completeTypeToProblems[type] = typeMap[type] || [];
        });
        setTypeToProblems(completeTypeToProblems);

      } catch (err) {
        setError("Failed to load dashboard. Please try again later.");
        console.error(err);
      } finally {
        setPageLoading(false);
      }
    };

    fetchAll();
  }, []);

  const solvedProblems = useMemo(() => {
    const solved = new Set<string>();
    sessions.forEach((session) => {
      if (session.endTime && session.problemId) {
        solved.add(session.problemId);
      }
    });
    return Array.from(solved);
  }, [sessions]);

  const problemSessions = useMemo(() => {
    if (!selectedProblemId) return [];
    return sessions.filter(
      (session) => session.problemId === selectedProblemId
    );
  }, [selectedProblemId, sessions]);

  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * sessionsPerPage;
    return problemSessions.slice(startIndex, startIndex + sessionsPerPage);
  }, [problemSessions, currentPage]);

  const totalPages = Math.ceil(problemSessions.length / sessionsPerPage);

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return "N/A";
    const date = new Date(timeString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const isSessionArray = (
    sessions: (Session | SessionSummary)[]
  ): sessions is Session[] => {
    if (sessions.length === 0) return true;
    return "userId" in sessions[0];
  };

  const handleProblemSelect = (problemId: string) => {
    setSelectedProblemId(problemId);
    setCurrentPage(1);
  };

  if (pageLoading) {
    return (
      <>
        <Navbar />
        <div className="loaderContainer">
          <div className="loader"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="user-profile-section">
          <div className="profile-card">
            <div className="user-info">
              <h2 className="user-name">{userData?.fullName || "Loading..."}</h2>
              <p className="user-email">{userData?.email}</p>
              <p className="user-location">{userData?.location}</p>
            </div>
          </div>
        </div>
        <div className="sessions-section">
          {isSessionArray(sessions) && <Preparation sessions={sessions} />}
        </div>
        <div className="parent-sessions-section">
          <PreparationChart typeToProblems={typeToProblems} />
        </div>
        <br />
        <div className="sessions-section">
          <h3 className="section-title">
            {selectedProblemId ? (
              <div className="problem-sessions-header">
                <button
                  className="back-button"
                  onClick={() => setSelectedProblemId(null)}
                >
                  <IoMdArrowRoundBack />
                </button>
                <span>
                  Sessions for: {problems[selectedProblemId] || "Selected Problem"}
                </span>
              </div>
            ) : (
              "Solved Problems"
            )}
          </h3>
          {error ? (
            <p className="error-message">{error}</p>
          ) : selectedProblemId ? (
            <>
              <div className="sessions-list">
                {paginatedSessions.map((session) => (
                  <Link
                    key={session.sessionId}
                    to="/session"
                    state={{ sessionId: session.sessionId }}
                    className="session-item"
                  >
                    <div className="session-details">
                      <div className="session-time">
                        <strong>Started:</strong> {formatTime(session.startTime)}
                        {session.endTime && (
                          <span className="end-time">
                            <strong> | Ended:</strong> {formatTime(session.endTime)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {problemSessions.length === 0 && (
                <div className="no-sessions">
                  <p>No sessions found for this problem.</p>
                </div>
              )}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          ) : (
            <div className="problems-grid">
              {solvedProblems.length > 0 ? (
                solvedProblems.map((problemId) => (
                  <div
                    key={problemId}
                    className="problem-card"
                    onClick={() => handleProblemSelect(problemId)}
                  >
                    <div className="problem-title">
                      {problems[problemId] || "Untitled Problem"}
                    </div>
                    <div className="session-count">
                      {sessions.filter((s) => s.problemId === problemId).length}
                      {sessions.filter((s) => s.problemId === problemId).length === 1
                        ? " session"
                        : " sessions"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-sessions">
                  <p>No solved problems yet. Start practicing!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DashBoard;
