/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useLocation, useNavigate } from "react-router-dom";
import "./solution.css";
import { useEffect, useState } from "react";
import { getSessionById } from "../../utils/handlers/getSessionById";
import Navbar from "../../components/navbar/Navbar";
import { FaRegFileAlt } from "react-icons/fa";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { IoMdArrowRoundBack } from "react-icons/io";

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const Solution = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const evaluation = location.state?.evaluation;
  const rubricResult = location.state?.rubricResult;
  const stateSessionId = location.state?.sessionId;
  const localSessionId = localStorage.getItem("mtv-sessionId");
  const sessionId = stateSessionId || localSessionId;

  const handleNavigateHome = () => {
    navigate("/home");
  };

  const [notes, setNotes] = useState<{ content: any }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        setError("No session ID found.");
        navigate("/home");
        return;
      }

      try {
        const session = await getSessionById(sessionId);
        setNotes(session.notes || []);
      } catch (err) {
        setError("Failed to fetch session notes.");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, navigate]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  const userSolution = notes[1]?.content || "No solution provided.";

  if (!evaluation) {
    return (
      <div className="solution-container solution-no-data">
        <h2 className="solution-no-data-title">No Evaluation Data Available</h2>
        <p className="solution-no-data-text">
          Please navigate here from a valid evaluation source.
        </p>
      </div>
    );
  }

  const ratingMap: Record<string, number> = {
    strong: 3,
    mixed: 2,
    weak: 1,
  };

  const labels = [
    "Overall",
    "Correctness",
    "Edge Case Handling",
    "Performance",
    "Structure & Implementation",
    "Readability",
  ];

  const rubricValues = rubricResult
    ? [
        rubricResult.isCorrect ? 3 : 1,
        ratingMap[rubricResult.rubricScores.correctness],
        ratingMap[rubricResult.rubricScores.edgeCases],
        ratingMap[rubricResult.rubricScores.performance],
        ratingMap[rubricResult.rubricScores.structureChoice],
        ratingMap[rubricResult.rubricScores.readability],
      ]
    : [];

  const radarData = {
    labels,
    datasets: [
      {
        label: "Evaluation Rating",
        data: rubricValues,
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        borderColor: "#007bff",
        pointBackgroundColor: "#007bff",
        borderWidth: 2,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const value = context.raw as number;
            if (value === 3) return "Strong";
            if (value === 2) return "Mixed";
            if (value === 1) return "Weak";
            return "";
          },
        },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 3,
        ticks: {
          stepSize: 1,
          callback: function (tickValue: string | number) {
            if (tickValue === 3) return "Strong";
            if (tickValue === 2) return "Mixed";
            if (tickValue === 1) return "Weak";
            return "";
          },
        },
        grid: { color: "#ddd" },
        angleLines: { color: "#ddd" },
        pointLabels: { font: { size: 14 } },
      },
    },
  };

  return (
    <>
      <Navbar />
      <div className="solution-container">
        <button className="return-home-button" onClick={handleNavigateHome}>
          <IoMdArrowRoundBack />
        </button>
        <h1 className="solution-main-title">Interview Evaluation</h1>

        <section className="solution-section solution-summary-section">
          <h2 className="solution-section-title">
            <FaRegFileAlt className="titleIcon" />
            Summary
          </h2>
          <p className="solution-summary-text">{evaluation.summary}</p>
        </section>

        {rubricResult && (
          <section className="solution-section solution-rubric-section">
            <h2 className="solution-section-title">Evaluation Summary</h2>
            <div className="radarGraphContainer">
              <Radar data={radarData} options={radarOptions} />
            </div>
          </section>
        )}

        <section className="solution-section solution-summary-section">
          <h2 className="solution-section-title">Your Solution</h2>
          <pre className="myCode">{userSolution}</pre>
        </section>

        <section className="solution-section solution-alternatives-section">
          <h2 className="solution-section-title">Alternative Solutions</h2>
          <ul className="solution-list solution-code-list">
            {evaluation.alternativeSolutions.map(
              (item: string, idx: number) => (
                <li
                  key={idx}
                  className="solution-list-item solution-code-list-item"
                >
                  <pre className="solution-code-block">
                    <code className="solution-code-content">{item}</code>
                  </pre>
                </li>
              )
            )}
          </ul>
        </section>
      </div>
    </>
  );
};

export default Solution;
