/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Navbar from "../../components/navbar/Navbar";
import "./homepage.css";
import { levelColor } from "../../utils/constants";
import type { ProblemSummary } from "mooterview-client";
import { FaPlay } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAllProblems } from "../../utils/handlers/getAllProblems";
import { createSession } from "../../utils/handlers/createSession";
import { getTokenData } from "../../utils/constants";
import { Solvedproblems } from "../../utils/handlers/getAllProblems";

const Homepage = () => {
  const [problems, setProblems] = useState<any>();
  const [solvedProblem, setsolvedProblem] = useState<string[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [solved, setsolved] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const data = JSON.parse(
    localStorage.getItem("userData") || "{}"
  )
  console.log("access token: ", data);

  useEffect(() => {
    console.log("before problems");
    const fetchProblems = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("here 1");
        const problems: ProblemSummary[] = await getAllProblems();
        console.log("here 2");
        setProblems(problems);
      } catch (error: any) {
        setError(
          error.response?.data ||
          "Server Is busy, Can't Fetch problem right now."
        );
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
    }
    fetchSolvedProblems();
  }, [])

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
          onClick={() => {
            const confirm = window.confirm(
              "This will redirect you to create your own problem.\nOnly do this if the problem you want doesn't exist."
            );
            if (confirm) {
              navigate("/create-a-problem");
            }
          }}
        >
          Practice New Problem
        </button>
      </div>

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
                onClick={async () => {
                  const confirmed = window.confirm(
                    "Are you sure you want to start the interview for this problem?"
                  );
                  if (confirmed) {
                    const userData = JSON.parse(
                      localStorage.getItem("userData") || "{}"
                    );
                    const userId = userData.id;

                    try {
                      // const sessionId = await createSession({
                      //   userId,
                      //   problemId: problem.problemId || "",
                      // });

                      // localStorage.setItem("mtv-sessionId", sessionId);

                      navigate(
                        `/problem/${encodeURIComponent(problem.title ?? "")}`,
                        {
                          state: { problemId: problem.problemId, userId },
                        }
                      );
                    } catch (err) {
                      console.error("Failed to create session", err);
                      alert("Failed to start interview. Try again.");
                    }
                  }
                }}
                className="startInterviewButton"
              >
                <FaPlay />
              </button>
            </div>
          ))
        )}
      </section>
    </>
  );
};

export default Homepage;
