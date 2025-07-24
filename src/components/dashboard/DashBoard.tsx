import { useState, useEffect } from "react";
import type { Session } from "mooterview-client";
import { getAllSessionByUserId } from "../../utils/handlers/getAllSessionById";
import { getTokenData } from "../../utils/constants";
import { Link } from "react-router-dom";
import { getUserById } from "../../utils/handlers/getUserInfoById";
import type { GetUserByIdOutput } from "mooterview-client";
import avatarImage from "../../assets/avatar/avatar.png";
import "./dashboard.css";
import { getProblemById } from "../../utils/handlers/getProblemById";
import type { Problem } from "mooterview-client";
import Navbar from "../navbar/Navbar";
import Preparation from "./preparation";

const DashBoard = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setuserData] = useState<GetUserByIdOutput>();
  const [problems, setProblems] = useState<{ [key: string]: string }>({});
  const [ses, setses] = useState<boolean>(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        setses(true);

        const response: any = await getAllSessionByUserId(getTokenData().id);
        let fetchedSessions: Session[] = response.sessions;

        // Sort sessions by most recent start time
        fetchedSessions = fetchedSessions.sort((a, b) => {
          const timeA = new Date(a.startTime ?? 0).getTime();
          const timeB = new Date(b.startTime ?? 0).getTime();
          return timeB - timeA;
        });

        setSessions(fetchedSessions);

        const uniqueProblemIds = [
          ...new Set(fetchedSessions.map((s) => s.problemId).filter(Boolean)),
        ];
        const fetchedProblems: { [key: string]: string } = {};

        await Promise.all(
          uniqueProblemIds.map(async (problemId: any) => {
            try {
              const problem: Problem = await getProblemById(problemId);
              fetchedProblems[problemId] = problem.title || "Untitled";
            } catch {
              fetchedProblems[problemId] = "Title not found";
            }
          })
        );

        setProblems(fetchedProblems);
      } catch (error: any) {
        setError("Something went wrong while fetching sessions.");
      } finally {
        setses(false);
        setLoading(false);
      }
    };


    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const response: any = await getUserById(getTokenData().id);
        setuserData(response);
      } catch (error: any) {
        setError("Something went wrong while fetching user information.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
    fetchSessions();
  }, []);

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return "N/A";
    const date = new Date(timeString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="user-profile-section">
        <div className="profile-card">
          <div className="avatar-container">
            <img src={avatarImage} alt="Profile Avatar" className="profile-avatar" />
          </div>
          <div className="user-info">
            <h2 className="user-name">{userData?.fullName || "Loading..."}</h2>
            <p className="user-username">@{userData?.username}</p>
            <p className="user-email">{userData?.email}</p>
            <p className="user-location">{userData?.location}</p>
          </div>
        </div>
      </div>

      <div className="sessions-section">
        <Preparation />
      </div>

      <br />
      <div className="sessions-section">
        <h3 className="section-title">Problem Sessions</h3>

        {loading || (ses && <div className="loading">Loading...</div>)}
        {error && <p className="error-message">{error}</p>}

        {!ses && (
          <div className="sessions-list">
            {sessions.map((session, index) => (
              <Link
                key={session.sessionId}
                to="/session"
                state={{ sessionId: session.sessionId }}
                className="session-item"
              >
                <div className="session-number">{index + 1}</div>
                <div className="session-details">
                  <div className="session-problem-id">
                    <strong>Problem:</strong>{" "}
                    {problems[session.problemId ?? ""] ?? "Loading..."}
                  </div>
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
        )}

        {sessions.length === 0 && !loading && (
          <div className="no-sessions">
            <p>No sessions found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashBoard;
