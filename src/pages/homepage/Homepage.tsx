/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Navbar from "../../components/navbar/Navbar";
import "./homepage.css";
import { levelColor } from "../../utils/constants";
import type { ProblemSummary } from "mooterview-client";
import { FaPlay } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAllProblems } from "../../utils/handlers/getAllProblems";
import ConfirmationModal from "../../components/Confirmationmodal/Confirmationmodal";
import { getTokenData } from "../../utils/constants";
import { Solvedproblems } from "../../utils/handlers/getAllProblems";


interface ConfirmationModalData {
  text1: string;
  text2: string;
  btn1Text: string;
  btn2Text: string;
  btn1Handler: () => void;
  btn2Handler: () => void;
}


const Homepage = () => {
  const [problems, setProblems] = useState<any>();
  const [solvedProblem, setsolvedProblem] = useState<string[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [solved, setsolved] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalData | null>(null)

  const data = JSON.parse(
    localStorage.getItem("userData") || "{}"
  )
  console.log("access token: ", data);


  const CACHE_KEY = "cachedProblems";
  const CACHE_DURATION = 2 * 60 * 60 * 1000; 

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      setError(null);

      try {
        const cached = localStorage.getItem(CACHE_KEY);
        const now = new Date().getTime();

        if (cached) {
          const { problems, timestamp } = JSON.parse(cached);

          if (now - timestamp < CACHE_DURATION) {
            setProblems(problems);
            setLoading(false);
            return;
          } else {
            localStorage.removeItem(CACHE_KEY);
          }
        }

        const freshProblems = await getAllProblems();
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ problems: freshProblems, timestamp: now })
        );
        setProblems(freshProblems);
      } catch (err) {
        setError("Failed to load problems");
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);



  useEffect(() => {
    const fetchSolvedProblems = async () => {
      const result: string[] = await Solvedproblems(getTokenData().id);
      setsolvedProblem(result);
    };
    fetchSolvedProblems();
  }, []);

  console.log("problems: ", problems);

  const filteredProblems = problems?.filter((problem: ProblemSummary) => {
    const matchesLevel =
      selectedLevel === "All" ||
      problem.level?.toLowerCase() === selectedLevel.toLowerCase();

    const matchesSearch = problem.title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    const isSolved = solvedProblem.includes(String(problem.problemId));

    const matchesSolve =
      solved === "All" ||
      (solved === "Solved" && isSolved) ||
      (solved === "UnSolved" && !isSolved);

    return matchesLevel && matchesSearch && matchesSolve;
  });

  return (
    <>
      <Navbar />
      <div className="filterContainer">
        <div className="filterLeft">
          <label htmlFor="levelFilter">Filter by Level: </label>
          <select
            id="levelFilter"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <label htmlFor="solveFilter"> Problem Status:</label>
          <select
            id="solveFilter"
            value={solved}
            onChange={(e) => setsolved(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Solved">Attempted</option>
            <option value="UnSolved">Unattempted</option>
          </select>

          <input
            type="text"
            placeholder="Search problems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className="createProblemButton"


          onClick={() =>
            setConfirmationModal({
              text1: "This will redirect you to create your own problem.",
              text2: "Only do this if the problem you want doesn't exist.",
              btn1Text: "Create Problem",
              btn2Text: "Cancel",
              btn1Handler: () => navigate("/create-a-problem"),
              btn2Handler: () => setConfirmationModal(null),
            })}
        >
          Practice New Problem
        </button>
      </div >

      <section className="homepage" id="homePage">
        {loading ? (
          <div className="loaderContainer">
            <div className="loader"></div>
          </div>
        ) : error ? (
          <p className="error">{error}</p>
        ) : !problems || problems?.length === 0 ? (
          <p className="empty">No problems available.</p>
        ) : (
          filteredProblems.map((problem: ProblemSummary) => (
            <div className="problemCard" key={problem.problemId}>
              <div className="problemSummaryContainer">
                <p className="problemTitle">{problem.title}</p>
                <p
                  className="problemLevel"
                  style={{
                    backgroundColor:
                      levelColor[problem.level as keyof typeof levelColor],
                  }}
                >
                  {problem.level}
                </p>
              </div>

              <button
                onClick={() => {
                  setConfirmationModal({
                    text1: "Are you sure you want to start the interview?",
                    text2: `Problem: "${problem.title}"`,
                    btn1Text: "Start Interview",
                    btn2Text: "Cancel",
                    btn1Handler: () => {
                      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
                      const userId = userData.id;

                      // const sessionId = await createSession({ userId, problemId: problem.problemId || "" });
                      // localStorage.setItem("mtv-sessionId", sessionId);

                      navigate(`/problem/${encodeURIComponent(problem.title ?? "")}`, {
                        state: { problemId: problem.problemId, userId },
                      });

                      setConfirmationModal(null);
                    },
                    btn2Handler: () => setConfirmationModal(null),
                  });
                }}
                className="startInterviewButton"
              >
                <FaPlay />
              </button>


            </div>
          ))
        )}
      </section>
      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}

    </>
  );
};

export default Homepage;
