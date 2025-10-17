/* eslint-disable @typescript-eslint/no-explicit-any */
import { Navigate, useLocation } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import "./problem.css";
import CodeEditor from "../../components/codeEditor/CodeEditor";
import { useEffect, useRef, useState } from "react";
import { getProblemById } from "../../utils/handlers/getProblemById";
import type { Problem } from "../../utils/generateTestCasesWithAI";
import ChatBox from "../../components/chatbox/ChatBox";
import Loading from "../../components/Loader/Loading";
import { generateTestCasesWithAI } from "../../utils/generateTestCasesWithAI";

const ProblemPage = () => {
  const location = useLocation();
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const problemId =
    location.state?.problemId || sessionStorage.getItem("mtv-problemId");
  const userId = location.state?.userId || userData.id;
  const [loading, setloading] = useState(true);

  const [problem, setProblem] = useState<Problem>();
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);

  const [testCases, setTestCases] = useState<{ input: any; expected: any; argument?: any }[]>(
    []
  );

  const verifySolutionRef = useRef<((isAutoSubmit?: boolean) => void) | null>(
    null
  );
  const endSessionRef = useRef<() => void | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const handleUnload = (e: BeforeUnloadEvent) => {
      if (problem || timeLeft > 0 || code.trim() !== "") {
        e.preventDefault();
        (e as any).returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [problem, timeLeft, code]);

  useEffect(() => {
    if (timeLeft === 0) {
      if (isVerified) {
        if (endSessionRef.current) {
          endSessionRef.current();
        }
      } else {
        if (verifySolutionRef.current) {
          verifySolutionRef.current(true);
        }
      }
    }
  }, [timeLeft, isVerified]);

  useEffect(() => {
    if (!problem) return;

    const fetchTestCases = async () => {
      try {
        const generated = await generateTestCasesWithAI(problem);
        if (generated && generated.length > 0) {
          setTestCases(generated);
        } else {
          console.warn("AI could not generate test cases");
        }
      } catch (err) {
        console.error("Failed to generate test cases", err);
      }
    };

    fetchTestCases();
  }, [problem]);

  useEffect(() => {
    if (!problemId) return;

    const fetchProblem = async () => {
      try {
        const fetchedProblem = await getProblemById(problemId);
        setProblem(fetchedProblem);        
        sessionStorage.setItem("mtv-problemId", problemId);
        const fullTime = Number(fetchedProblem.averageSolveTime ?? 15) * 60;
        setTimeLeft(fullTime);
      } catch (err: any) {
        setError(err.message || "Failed to load problem.");
      } finally {
        setloading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  useEffect(() => {
    localStorage.removeItem("mtv-sessionId");
  }, []);

  if (!problemId) {
    return <Navigate to="/home" replace />;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!problem) {
    return (
      <>
        <Loading message="Loading Interview..." size="large" />
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
            onApproachCorrectChange={(isCorrect) =>
              setIsEditorEnabled(isCorrect)
            }
            testCases={testCases}
            onVerificationSuccess={() => setIsVerified(true)}
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
            problemTitle={problem.title}
            testCases={testCases}
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
      {loading && <Loading message="Loading Evaluation..." size="large" />}
    </>
  );
};

export default ProblemPage;
