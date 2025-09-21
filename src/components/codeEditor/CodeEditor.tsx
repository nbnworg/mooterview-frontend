import React, { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

import "./codeEditor.css";

interface CodeEditorProps {
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  setCode,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.scrollTop = editorRef.current.scrollHeight;
    }
  }, [code]);

  return (
    <div className="codeEditorContainer">
      <div
        ref={editorRef}
        className="codeEditor"
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
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;