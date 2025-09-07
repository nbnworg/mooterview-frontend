import React, { useState } from "react";
import { runPythonSandbox } from "../../utils/runPython";
import "./pythonRunner.css";

interface PythonRunnerProps {
  code: string;
}

const PythonRunner: React.FC<PythonRunnerProps> = ({ code }) => {
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    setOutput("");
    const result = await runPythonSandbox(code);
    setOutput(result);
    setRunning(false);
  };

  return (
    <div className="pythonRunner">
      <button onClick={handleRun} disabled={running} className="runCodeButton">
        {running ? "Running..." : "Run Code"}
      </button>
      {output && <pre className="pythonOutput">{output}</pre>}
    </div>
  );
};

export default PythonRunner;
