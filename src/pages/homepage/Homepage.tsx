import Navbar from "../../components/navbar/Navbar";
import "./homepage.css";
import { useProblems } from "../../hooks/useProblems";
import { useSolvedProblems } from "../../hooks/useSolvedProblems";
import { useProgressData } from "../../hooks/useProgressData";
import ProgressSection from "./components/ProgressSection";
import ProblemTable from "./components/ProblemTable";
import Filters from "./components/Filters";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/footer/Footer";

export default function Homepage() {
  const { problems, loading, error } = useProblems();
  const solvedIds = useSolvedProblems();
  const progressData = useProgressData(problems, solvedIds);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [solved, setSolved] = useState("All");

  const navigate = useNavigate();

  const filteredProblems = problems?.filter((p) => {
    const matchesLevel =
      selectedLevel === "All" ||
      p.level?.toLowerCase() === selectedLevel.toLowerCase();
    const matchesSearch = p.title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const isSolved = solvedIds.includes(String(p.problemId));
    const matchesSolve =
      solved === "All" ||
      (solved === "Solved" && isSolved) ||
      (solved === "UnSolved" && !isSolved);
    return matchesLevel && matchesSearch && matchesSolve;
  });

  return (
    <>
      <Navbar />
      <ProgressSection progressData={progressData} />
      <div className="seperationLineContainer">
        <hr className="seperationLine" />
      </div>
      <div className="homepageContainer">
        <section className="homepage" id="homePage">
          {loading ? (
            <div className="loaderContainer">
              <div className="loader"></div>
            </div>
          ) : error ? (
            <p className="error">{error}</p>
          ) : filteredProblems.length === 0 ? (
            <p>No problems available.</p>
          ) : (
            <ProblemTable problems={filteredProblems} solvedIds={solvedIds} />
          )}
        </section>
        <Filters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedLevel={selectedLevel}
          setSelectedLevel={setSelectedLevel}
          solved={solved}
          setSolved={setSolved}
          onAddProblem={() => navigate("/create-a-problem")}
        />
      </div>
      <Footer />
    </>
  );
}
