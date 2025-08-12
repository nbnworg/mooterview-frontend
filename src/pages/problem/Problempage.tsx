/* eslint-disable @typescript-eslint/no-explicit-any */
import { Navigate, useLocation } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import "./problem.css";
import CodeEditor from "../../components/codeEditor/CodeEditor";
import { useEffect, useRef, useState } from "react";
import { getProblemById } from "../../utils/handlers/getProblemById";
import type { Problem } from "mooterview-client";
import ChatBox from "../../components/chatbox/ChatBox";
import { clearChatSession } from "../../utils/localStorageReport";
const ProblemPage = () => {
  const location = useLocation();
  const problemId = location.state?.problemId;
  const userId = location.state?.userId;

  const [problem, setProblem] = useState<Problem>();
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string>(() => {
    return localStorage.getItem("mtv-codeSnippet") ?? "";
  });
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [isEditorEnabled, setIsEditorEnabled] = useState(() => {
    const savedApproach = localStorage.getItem("mtv-hasApproach");
    return savedApproach === "true";
  });

  const verifySolutionRef = useRef<() => void | null>(null);
  const endSessionRef = useRef<() => void | null>(null);

  useEffect(() => {
    if (timeLeft === 0) {
      endSessionRef.current?.();
    }
  }, [timeLeft]);

  useEffect(() => {
    if (!problemId) return;

    const fetchProblem = async () => {
      try {
        const fetchedProblem = await getProblemById(problemId);
        setProblem(fetchedProblem);
        const fullTime = Number(fetchedProblem.averageSolveTime ?? 15) * 60;
        const savedProblemId = localStorage.getItem("mtv-problemId");

        if (savedProblemId === problemId) {
          const timeRemain = localStorage.getItem("mtv-timeLeft");
          setTimeLeft(timeRemain ? JSON.parse(timeRemain) : fullTime);
          const hasApproach = localStorage.getItem("mtv-hasApproach");
          setIsEditorEnabled(hasApproach === "true");

        } else {
          localStorage.setItem("mtv-problemId", problemId);
          clearChatSession();
          localStorage.removeItem("mtv-timeLeft");
          setTimeLeft(fullTime);
          setIsEditorEnabled(false);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load problem.");
      }
    };

    fetchProblem();
  }, [problemId]);

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
      <section className="problemSection" id="problemSection">
        <div className="problemDetailAndChatContainer">
          <h1>{problem.title}</h1>
          <p>{problem.problemDescription}</p>
          <ChatBox
            problem={problem}
            elapsedTime={(problem.averageSolveTime ?? 15) * 60 - timeLeft}
            onVerifyRef={verifySolutionRef}
            userId={userId}
            code={code}
            onEndRef={endSessionRef}
            onApproachCorrectChange={(isCorrect) => setIsEditorEnabled(isCorrect)}
            setCode={setCode}

          />
        </div>

        <div className="verticalLine"></div>

        <div className="codeEditorAndOptionsContainer">
          <CodeEditor
            code={code}
            setCode={setCode}
            timeLeft={timeLeft}
            setTimeLeft={setTimeLeft}
            disabled={!isEditorEnabled}
          />

          <button
            className="verifyCodeButton"
            onClick={async () => {
              if (verifySolutionRef.current) {
                setVerifyLoading(true);
                await verifySolutionRef.current();
                setVerifyLoading(false);
              }
            }}
            disabled={verifyLoading}
          >
            {verifyLoading ? "Verifying..." : "Verify Code"}
          </button>
        </div>
      </section>
    </>
  );
};

export default ProblemPage;
