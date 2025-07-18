import { useLocation, useNavigate } from "react-router-dom";
import "./solution.css";
import { useEffect, useState } from "react";
import { getSessionById } from "../../utils/handlers/getSessionById";

const Solution = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const evaluation = location.state?.evaluation;
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