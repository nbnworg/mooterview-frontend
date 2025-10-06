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
/*
function inferParamsFromInput(
  argument: any,
  argumentNames?: string[]
): string {
  // Prefer argumentNames if provided
  if (argumentNames && argumentNames.length > 0) {
    return argumentNames.join(", ");
  }

<<<<<<< HEAD
  // Otherwise infer from the data itself (old behavior)
  if (Array.isArray(argument)) return argument.join(", ");
  else if (typeof argument === "object" && argument !== null)
    return Object.keys(argument).join(", ");
  else return "input_data";
=======

function inferParamsFromInput(argument: any, argumentNames?: string[]): string {
  if (argumentNames && argumentNames.length > 0) return argumentNames.join(", ");

  if (Array.isArray(argument)) return argument.map((_, idx) => `arg${idx + 1}`).join(", ");

  if (typeof argument === "object" && argument !== null) return Object.keys(argument).join(", ");

  return "input_data";
>>>>>>> 4d5fc5f3146f2b02efeb7ece5c86be65fa919476
}
  */

function inferParamsFromInput(argument: any, argumentNames?: string[]): string {
  if (argumentNames && argumentNames.length > 0) return argumentNames.join(", ");

  // Default naming if array
  if (Array.isArray(argument)) return argument.map((_, idx) => `arg${idx + 1}`).join(", ");

  if (typeof argument === "object" && argument !== null) return Object.keys(argument).join(", ");

  return "input_data";
}



function detectDataStructure(testCase: { input: any; argumentNames?: string[] }): string {
  // get the "first" value from the input, regardless of shape
  let firstArg: any;

  if (Array.isArray(testCase.input)) {
    firstArg = testCase.input[0];
  } else if (typeof testCase.input === "object" && testCase.input !== null) {
    // unwrap the first property value (head/root/list1/list2…)
    const firstKey = Object.keys(testCase.input)[0];
    firstArg = testCase.input[firstKey];
  } else {
    firstArg = testCase.input;
  }

  // detect binary tree level-order array
 if (Array.isArray(firstArg) && firstArg.includes(null)) {
    return (
`# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

`
      );
    }
  

  if (firstArg && typeof firstArg === "object") {
    if ("val" in firstArg && "next" in firstArg) {
      return (
`# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

`
      );
    }
    if ("val" in firstArg && ("left" in firstArg || "right" in firstArg)) {
      return (
`# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

`
      );
    }
  }

  return "";
}






function detectDataStructure(testCase: { input: any; argumentNames?: string[] }): string {
  
  let firstArg: any;

  if (Array.isArray(testCase.input)) {
    firstArg = testCase.input[0];
  } else if (typeof testCase.input === "object" && testCase.input !== null) {
   
    const firstKey = Object.keys(testCase.input)[0];
    firstArg = testCase.input[firstKey];
  } else {
    firstArg = testCase.input;
  }

 
 if (Array.isArray(firstArg) && firstArg.includes(null)) {
    return (
`# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

`
      );
    }
  

  if (firstArg && typeof firstArg === "object") {
    if ("val" in firstArg && "next" in firstArg) {
      return (
`# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

`
      );
    }
    if ("val" in firstArg && ("left" in firstArg || "right" in firstArg)) {
      return (
`# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

`
      );
    }
  }

  return "";
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

<<<<<<< HEAD
 /*useEffect(() => {
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
*/
=======
>>>>>>> 4d5fc5f3146f2b02efeb7ece5c86be65fa919476
useEffect(() => {
  if (!code.trim() && testCases && testCases.length > 0) {
    const defaultFuncName = problemTitle?.replace(/\s+/g, "_").toLowerCase();
    const edgeCaseTest = testCases[4] || testCases[0];
    const params = inferParamsFromInput(edgeCaseTest.input, edgeCaseTest.argumentNames);

    // get snippet first
    const snippet = detectDataStructure(edgeCaseTest);

    // put snippet at top before def line
    const starterCode = `${snippet}def ${defaultFuncName}(${params}):\n    # TODO: implement solution\n    pass\n`;
    setCode(starterCode);
  }
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
