import { useLocation, useNavigate } from "react-router-dom";
import "./solution.css";
import { useEffect, useState } from "react";
import { getSessionById } from "../../utils/handlers/getSessionById";

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

  return (
    <div className="solution-container">
      <h1 className="solution-main-title">Interview Evaluation</h1>

      <section className="solution-section solution-summary-section">
        <h2 className="solution-section-title">Summary</h2>
        <p className="solution-summary-text">{evaluation.summary}</p>
      </section>

      {rubricResult && (
        <section className="solution-section solution-rubric-section">
          <h2 className="solution-section-title">Evaluation</h2>
          <p className="solution-summary-text">
            {rubricResult.isCorrect
              ? "The solution is overall correct."
              : "The solution does not meet all the expected criteria."}{" "}
            In terms of correctness, the logic is{" "}
            {rubricResult.rubricScores.correctness === "strong"
              ? "accurate and well-structured"
              : rubricResult.rubricScores.correctness === "mixed"
                ? "partially correct and may miss certain scenarios"
                : "flawed or incomplete"}.
            Edge cases are{" "}
            {rubricResult.rubricScores.edgeCases === "strong"
              ? "handled thoroughly"
              : rubricResult.rubricScores.edgeCases === "mixed"
                ? "partially covered"
                : "not adequately considered"}.
            From a performance perspective, the code is{" "}
            {rubricResult.rubricScores.performance === "strong"
              ? "efficient and optimized"
              : rubricResult.rubricScores.performance === "mixed"
                ? "functional but could benefit from optimization"
                : "slow or inefficient"}.
            The choice of structure and implementation approach is{" "}
            {rubricResult.rubricScores.structureChoice === "strong"
              ? "appropriate and thoughtful"
              : rubricResult.rubricScores.structureChoice === "mixed"
                ? "acceptable but not ideal"
                : "unclear or misaligned with the problem"}.
            Lastly, the code's readability is{" "}
            {rubricResult.rubricScores.readability === "strong"
              ? "excellent, making it easy to follow"
              : rubricResult.rubricScores.readability === "mixed"
                ? "moderate but could be improved with formatting"
                : "difficult to read or poorly structured"}.
          </p>
        </section>
      )}



      <section className="solution-section solution-summary-section">
        <h2 className="solution-section-title">Your Solution</h2>
        <pre
          style={{
            padding: "1rem",
            borderRadius: "6px",
            overflowX: "auto",
          }}
        >
          {userSolution}
        </pre>
      </section>

      <section className="solution-section solution-alternatives-section">
        <h2 className="solution-section-title">Alternative Solutions</h2>
        <ul className="solution-list solution-code-list">
          {evaluation.alternativeSolutions.map((item: string, idx: number) => (
            <li
              key={idx}
              className="solution-list-item solution-code-list-item"
            >
              <pre className="solution-code-block">
                <code className="solution-code-content">{item}</code>
              </pre>
            </li>
          ))}
        </ul>
      </section>

      <button className="return-home-button" onClick={handleNavigateHome}>
        Return to home page
      </button>
    </div>
  );
};

export default Solution;



