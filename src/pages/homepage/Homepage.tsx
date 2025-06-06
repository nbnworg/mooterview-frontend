import { useState, useEffect } from "react";
import Navbar from "../../components/navbar/Navbar";
import "./homepage.css";
import axios from "axios";
import { BASE_URL, levelColor } from "../../utils/constants";
import type { ProblemSummary } from "mooterview-client";
import { FaPlay } from "react-icons/fa";

const Homepage = () => {
  const [problems, setProblems] = useState([]);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/problems`);
        setProblems(response.data.problems);
      } catch (error) {
        console.log(error);
      }
    };

    fetchProblems();
  }, []);

  return (
    <>
      <Navbar />
      <section className="homepage" id="homePage">
        {problems.map((problem: ProblemSummary) => (
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
            <button className="startInterviewButton">
              <FaPlay />
            </button>
          </div>
        ))}
      </section>
    </>
  );
};

export default Homepage;
