import React, { useEffect, useRef, useState } from "react";
import { initialCode, languageLabels } from "../../utils/constants";
import Editor from "react-simple-code-editor";
import "./codeEditor.css";

const CodeEditor = () => {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(initialCode);
  const editorRef = useRef<HTMLDivElement>(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  const handleCodeChange = (updatedCode: string) => {
    setCode((prev) => ({
      ...prev,
      [language]: updatedCode,
    }));
  };

  useEffect(() => {
    if (timeLeft <= 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

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
          className="editor"
          value={code[language]}
          onValueChange={handleCodeChange}
          highlight={(code) => code}
          padding={12}
          aria-label={`${languageLabels[language]} Code Editor`}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
