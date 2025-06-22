/* eslint-disable @typescript-eslint/no-explicit-any */
import { Navigate, useLocation } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import "./problem.css";
import CodeEditor from "../../components/codeEditor/CodeEditor";
import { useEffect, useRef, useState } from "react";
import { getProblemById } from "../../utils/handlers/getProblemById";
import type { Problem } from "mooterview-client";
import ChatBox from "../../components/chatbox/ChatBox";
import { initialCode } from "../../utils/constants";

const ProblemPage = () => {
  const location = useLocation();
  const problemId = location.state?.problemId;

  const [problem, setProblem] = useState<Problem>();
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<{ [lang: string]: string }>(initialCode);
  const [language, setLanguage] = useState("python");
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  const verifySolutionRef = useRef<() => void | null>(null);

  // const navigate = useNavigate();

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
            code={code[language]}
            elapsedTime={(problem.averageSolveTime ?? 15) * 60 - timeLeft}
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
