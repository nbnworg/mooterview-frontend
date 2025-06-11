/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef } from "react";
import { languageLabels } from "../../utils/constants";
import Editor from "@monaco-editor/react";

import "./codeEditor.css";

interface CodeEditorProps {
  averageSolveTime?: number;
  code: { [lang: string]: string };
  setCode: React.Dispatch<React.SetStateAction<{ [lang: string]: string }>>;
  language: string;
  setLanguage: React.Dispatch<React.SetStateAction<string>>;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  averageSolveTime,
  code,
  setCode,
  language,
  setLanguage,
  timeLeft,
  setTimeLeft,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

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
  }, [code[language]]);

  const formatTime = (seconds: number) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  console.log(averageSolveTime)

  return (
    <div className="codeEditorContainer">
      <div className="languageAndTimerContainer">
        <div className="selectContainer">
          <label htmlFor="language-select" style={{ fontWeight: "bold" }}>
            Select Language:&nbsp;
          </label>
          <select
            id="language-select"
            value={language}
            onChange={handleLanguageChange}
            className="languageSelect"
          >
            {Object.keys(languageLabels).map((lang) => (
              <option key={lang} value={lang}>
                {languageLabels[lang]}
              </option>
            ))}
          </select>
        </div>
        <div className="timerContainer">{formatTime(timeLeft)}</div>
      </div>

      <div ref={editorRef} className="codeEditor">
        <Editor
          height="60vh"
          defaultLanguage={language}
          value={code[language]}
          theme="vs-dark"
          onChange={(value) =>
            setCode((prev) => ({ ...prev, [language]: value || "" }))
          }
        />
      </div>
    </div>
  );
};

export default CodeEditor;
