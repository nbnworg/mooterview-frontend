/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

import "./codeEditor.css";

interface CodeEditorProps {
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  disabled?: boolean;
  problemTitle?: string;
  testCases: { input: any; expected: any; explanation?: string; argumentNames?: string[] }[];
}
function inferParamsFromInput(
  argument: any,
  argumentNames?: string[]
): string {
  // Prefer argumentNames if provided
  if (argumentNames && argumentNames.length > 0) {
    return argumentNames.join(", ");
  }

  // Otherwise infer from the data itself (old behavior)
  if (Array.isArray(argument)) return argument.join(", ");
  else if (typeof argument === "object" && argument !== null)
    return Object.keys(argument).join(", ");
  else return "input_data";
}


const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  setCode,
  timeLeft,
  setTimeLeft,
  disabled,
  problemTitle,
  testCases,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, setTimeLeft]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.scrollTop = editorRef.current.scrollHeight;
    }
  }, [code]);

 useEffect(() => {
  if (!code.trim() && testCases && testCases.length > 0) {
    const defaultFuncName = problemTitle?.replace(/\s+/g, "_").toLowerCase();
    const firstTestCase = testCases[0];
    const params = inferParamsFromInput(
      firstTestCase.input,
      firstTestCase.argumentNames // 👈 use names if present
    );
    const starterCode = `def ${defaultFuncName}(${params}):\n    # TODO: implement solution\n    pass\n`;
    setCode(starterCode);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [problemTitle, testCases]);

  const formatTime = (seconds: number) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div className="codeEditorContainer">
      <div className="languageAndTimerContainer">
        <div className="timerContainer">{formatTime(timeLeft)}</div>
      </div>

      <div
        ref={editorRef}
        className={`codeEditor ${disabled ? "disabled-editor" : ""}`}
      >
        {" "}
        <Editor
          height="60vh"
          value={code}
          language="python"
          theme="vs-dark"
          onChange={(value) => setCode(value || "")}
          options={{
            placeholder: "Write your python code here ...",
            fontSize: 16,
            minimap: { enabled: false },
            readOnly: disabled,
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
