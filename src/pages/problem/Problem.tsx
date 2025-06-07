import { Navigate, useLocation, useParams } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import "./problem.css";
import CodeEditor from "../../components/codeEditor/CodeEditor";

const Problem = () => {
  const { title } = useParams();
  const location = useLocation();

  const problemId = location.state?.problemId;

  if (!problemId) {
    return <Navigate to="/home" replace />;
  }

  return (
    <>
      <Navbar />
      <section className="problemSection" id="problemSection">
        <div className="problemDetailContainer">
          <h1>{title}</h1>
          <p>{problemId}</p>
        </div>
        <div className="verticalLine"></div>
        <CodeEditor />
      </section>
    </>
  );
};

export default Problem;
