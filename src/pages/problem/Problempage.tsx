/* eslint-disable @typescript-eslint/no-explicit-any */
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import "./problem.css";
import CodeEditor from "../../components/codeEditor/CodeEditor";
import { useEffect, useRef, useState } from "react";
import { getProblemById } from "../../utils/handlers/getProblemById";
import type { Problem } from "mooterview-client";
import { updateSessionById } from "../../utils/handlers/updateSessionById";
import ChatBox from "../../components/chatbox/ChatBox";
import { initialCode } from "../../utils/constants";
// import Modal from "../../components/modal/Modal";

const ProblemPage = () => {
  const location = useLocation();
  const problemId = location.state?.problemId;

  const [problem, setProblem] = useState<Problem>();
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<{ [lang: string]: string }>(initialCode);
  const [language, setLanguage] = useState("python");
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  const verifySolutionRef = useRef<() => void | null>(null);

  const [timeUp, _setTimeUp] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!problemId) return;

    const fetchProblem = async () => {
      try {
        const fetchedProblem = await getProblemById(problemId);
        setProblem(fetchedProblem);
        const fullTime = Number(fetchedProblem.averageSolveTime ?? 15) * 60;
        setTimeLeft(fullTime);
      } catch (err: any) {
        setError(err.message || "Failed to load problem.");
      }
    };

    fetchProblem();
  }, [problemId]);

  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setTimeLeft((prev) => {
  //       if (prev <= 1) {
  //         clearInterval(timer);
  //         setTimeUpModalOpen(true);
  //         setTimeUp(true);
  //         return 0;
  //       }
  //       return prev - 1;
  //     });
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, []);

  // useEffect(() => {
  //   const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  //     if (timeLeft > 0) {
  //       e.preventDefault();

  //       setRefreshModalOpen(true);
  //       return "";
  //     }
  //   };

  //   window.addEventListener("beforeunload", handleBeforeUnload);
  //   return () => {
  //     window.removeEventListener("beforeunload", handleBeforeUnload);
  //   };
  // }, [timeLeft]);

  const endSession = async () => {
    const sessionId = localStorage.getItem("mtv-sessionId");
    if (!sessionId) return;

    try {
      await updateSessionById({
        sessionId,
        endTime: new Date().toISOString(),
      });
      alert("Session ended successfully.");
    } catch (err) {
      console.error("Failed to end session", err);
    } finally {
      navigate("/home");
    }
  };

  if (!problemId) {
    return <Navigate to="/home" replace />;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!problem) {
    return (
      <>
        <Navbar />
        <section className="problemSection" id="problemSection">
          <p>Loading...</p>
        </section>
      </>
    );
  }

  return (
    <>
      <Navbar />
      {timeUp && <div className="timeUpMessage">Time is up!</div>}
      <section className="problemSection" id="problemSection">
        <div className="problemDetailAndChatContainer">
          <h1>{problem.title}</h1>
          <p>{problem.problemDescription}</p>
          <ChatBox
            problem={problem}
            code={code[language]}
            elapsedTime={(problem.averageSolveTime ?? 15) * 60 - timeLeft}
            endSession={endSession}
            onVerifyRef={verifySolutionRef}
          />
        </div>
        <div className="verticalLine"></div>
        <div className="codeEditorAndOptionsContainer">
          <CodeEditor
            averageSolveTime={Number(problem.averageSolveTime)}
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
            timeLeft={timeLeft}
            setTimeLeft={setTimeLeft}
          />
          <button
            className="verifyCodeButton"
            onClick={() => verifySolutionRef.current?.()}
          >
            Verify Code
          </button>
        </div>
      </section>
    </>
  );
};

export default ProblemPage;
