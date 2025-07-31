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
          <h2 className="solution-section-title">Evaluation Summary</h2>
          <ul className="solution-rubric-list">
            <li>
              <strong>Overall:</strong>{" "}
              <span className={rubricResult.isCorrect ? "strong-result" : "weak-result"}>
                {rubricResult.isCorrect
                  ? "The solution is overall correct."
                  : "The solution does not meet all the expected criteria."}
              </span>
            </li>
            <li>
              <strong>Correctness:</strong>{" "}
              <span className={rubricResult.rubricScores.correctness}>
                {rubricResult.rubricScores.correctness === "strong"
                  ? "Strong – Accurate and well-structured."
                  : rubricResult.rubricScores.correctness === "mixed"
                    ? "Mixed – Partially correct and may miss certain scenarios."
                    : "Weak – Flawed or incomplete."}
              </span>
            </li>
            <li>
              <strong>Edge Case Handling:</strong>{" "}
              <span className={rubricResult.rubricScores.edgeCases}>
                {rubricResult.rubricScores.edgeCases === "strong"
                  ? "Strong – Thoroughly handled."
                  : rubricResult.rubricScores.edgeCases === "mixed"
                    ? "Mixed – Partially covered."
                    : "Weak – Not adequately considered."}
              </span>
            </li>
            <li>
              <strong>Performance:</strong>{" "}
              <span className={rubricResult.rubricScores.performance}>
                {rubricResult.rubricScores.performance === "strong"
                  ? "Strong – Efficient and optimized."
                  : rubricResult.rubricScores.performance === "mixed"
                    ? "Mixed – Functional but could benefit from optimization."
                    : "Weak – Slow or inefficient."}
              </span>
            </li>
            <li>
              <strong>Structure & Implementation:</strong>{" "}
              <span className={rubricResult.rubricScores.structureChoice}>
                {rubricResult.rubricScores.structureChoice === "strong"
                  ? "Strong – Appropriate and thoughtful."
                  : rubricResult.rubricScores.structureChoice === "mixed"
                    ? "Mixed – Acceptable but not ideal."
                    : "Weak – Unclear or misaligned with the problem."}
              </span>
            </li>
            <li>
              <strong>Readability:</strong>{" "}
              <span className={rubricResult.rubricScores.readability}>
                {rubricResult.rubricScores.readability === "strong"
                  ? "Strong – Excellent, easy to follow."
                  : rubricResult.rubricScores.readability === "mixed"
                    ? "Mixed – Moderate, could be improved."
                    : "Weak – Difficult to read or poorly structured."}
              </span>
            </li>
          </ul>
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



