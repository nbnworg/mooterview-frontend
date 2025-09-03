import { useEffect } from "react";
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
import streakImage from "../../assets/landingPage/streak.jpg";
import Randomizer from "./components/Randomizer";
import { useStreak } from "../../hooks/useStreak";

export default function Homepage() {
    const { problems, loading, error } = useProblems();
    const { streak } = useStreak();
    const solvedIds = useSolvedProblems();
    const progressData = useProgressData(problems, solvedIds);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [solved, setSolved] = useState("All");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);  

  const navigate = useNavigate();
  useEffect(() => {
    localStorage.removeItem("mtv-sessionId");
  }, []);
  

  const filteredProblems = problems?.filter((p: any) => {
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
    const matchType =
      selectedTypes.length === 0 ||
      selectedTypes.includes(p.problemPattern?.trim().toLowerCase());

    return matchesLevel && matchesSearch && matchesSolve && matchType;
  });
  console.log(streak);
  

    return (
        <>
            <Navbar />
            <div className="progressContent">
                <ProgressSection progressData={progressData} />
                <div className="streakAndRandomButton">
                    <div className="streakCountContainer">
                        <img
                            className="streakImage"
                            src={streakImage}
                            alt="User's streak fire"
                        />
                        <h1>{streak?.currentStreak || 0}</h1>
                    </div>
                    <Randomizer problems={problems} />
                </div>
            </div>
            <div className="randomizerButtonDiv"></div>
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
                        <ProblemTable
                            problems={filteredProblems}
                            solvedIds={solvedIds}
                        />
                    )}
                </section>
                <Filters
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedLevel={selectedLevel}
                    setSelectedLevel={setSelectedLevel}
                    solved={solved}
                    setSolved={setSolved}
                    selectedTypes={selectedTypes}
          setSelectedTypes={setSelectedTypes}
          onAddProblem={() => navigate("/create-a-problem")}
                />
            </div>
            <Footer />
        </>
    );
}
