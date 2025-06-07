/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Navbar from "../../components/navbar/Navbar";
import "./homepage.css";
import axios from "axios";
import { BASE_URL, levelColor } from "../../utils/constants";
import type { ProblemSummary } from "mooterview-client";
import { FaPlay } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Homepage = () => {
  const [problems, setProblems] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>("All");

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${BASE_URL}/problems`);
        setProblems(response.data.problems);
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

  const filterProblems =
    selectedLevel === "All"
      ? problems
      : problems.filter(
          (problem: ProblemSummary) =>
            problem.level?.toLowerCase() === selectedLevel.toLowerCase()
        );

  return (
    <>
      <Navbar />
      <div className="filterContainer">
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
      </div>
      <section className="homepage" id="homePage">
        {loading ? (
          <div className="loaderContainer">
            <div className="loader"></div>
          </div>
        ) : error ? (
          <p className="error">{error}</p>
        ) : problems.length === 0 ? (
          <p className="empty">No problems available.</p>
        ) : (
          filterProblems.map((problem: ProblemSummary) => (
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
                onClick={() =>
                  navigate(
                    `/problem/${encodeURIComponent(problem.title ?? "")}`,
                    {
                      state: { problemId: problem.problemId },
                    }
                  )
                }
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
