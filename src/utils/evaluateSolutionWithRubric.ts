/* eslint-disable @typescript-eslint/no-explicit-any */

import axios from "axios";
import { getPromptResponse } from "./handlers/getPromptResponse";
import { Actor } from "mooterview-client";

type EvaluationScore = "strong" | "mixed" | "weak";

export interface RubricResult {
  isCorrect: boolean;
  rubricScores: {
    correctness: EvaluationScore;
    edgeCases: EvaluationScore;
    performance: EvaluationScore;
    structureChoice: EvaluationScore;
    readability: EvaluationScore;
  };
  feedback: string;
}

export interface TestCase {
  input: any;
  expected: any;
  explanation?: string;
}

const JUDGE0_URL = "https://ce.judge0.com";
const PYTHON_ID = 109;

function extractFunctionName(problemTitle: string): string {
  return problemTitle.replace(/\s+/g, "_").toLowerCase();
}

async function executeCode(
  code: string,
  stdin: string,
  problemTitle: string
): Promise<string> {
  try {
    const functionName = extractFunctionName(problemTitle);
    if (!functionName) throw new Error("No function definition found in code.");

    const harness = `
import sys, json
data = json.loads(sys.stdin.read())
try:
  if isinstance(data, dict):
    result = ${functionName}(**data)  
  elif isinstance(data, list):
    result = ${functionName}(*data)    
  else:
    result = ${functionName}(data)     
except Exception as e:
    result = f"Error: {str(e)}"
print(result)
`.trim();

    const completedCode = code + "\n" + harness;

    const submissionRes = await axios.post(
      `${JUDGE0_URL}/submissions/?base64_encoded=false&wait=false`,
      {
        source_code: completedCode,
        language_id: PYTHON_ID,
        stdin,
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const token = submissionRes.data.token;

    let result;
    while (true) {
      const res = await axios.get(
        `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`
      );
      await new Promise((r) => setTimeout(r, 1000));
      result = await res.data;

      if (result.status && result.status.id >= 3) break;
    }

    return (result.stdout || "").trim();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Judge0 API error:", error.response?.data);
      throw new Error(`Execution service unavailable: ${error.message}`);
    }
    throw error;
  }
}

export const evaluateSolutionWithRubric = async (
  code: string,
  testCases: TestCase[],
  problemTitle?: string,
  problemdescription?:any
): Promise<RubricResult> => {
  let passed = 0;
  const failedCases: string[] = [];

  const hasLoops = /\b(for|while)\b/.test(code);
  const hasEdgeHandling = /if .*len|if .*==.*|return \[\]/.test(code);
  const isShort = code.length <= 600;


  const testResults: {
  input: any;
  expected: any;
  got: any;
}[] = [];

for (const t of testCases) {
  const stdin = JSON.stringify(t.input);
  const rawOutput = await executeCode(
    code,
    stdin,
    problemTitle || "solution"
  );

  let parsedOutput: any = rawOutput;
  try {
    parsedOutput = JSON.parse(rawOutput);
  } catch {
    try {
      parsedOutput = JSON.parse(rawOutput.trim());
    } catch {
      parsedOutput = rawOutput.trim();
    }
  }

  // just collect input/expected/got
  testResults.push({
    input: t.input,
    expected: t.expected,
    got: parsedOutput,
  });
}


// after you’ve built testResults:
const response = await getPromptResponse({
  actor: Actor.AI,
  context: `
Problem Description: ${problemdescription}

Test Results:
${JSON.stringify(testResults, null, 2)}
  `,
  promptKey: "evaluate-test-results",
  modelName: "gpt-4o",
});



const passedCount = Number(response.trim());


  const correctness: EvaluationScore =
   passedCount === testCases.length ? "strong" : passedCount > 3 ? "mixed" : "weak";

  const rubricScores: RubricResult["rubricScores"] = {
    correctness,
    edgeCases: hasEdgeHandling ? "strong" : "mixed",
    performance: hasLoops ? "strong" : "mixed",
    structureChoice: "mixed",
    readability: isShort ? "strong" : "mixed",
  };

  const isCorrect = correctness === "strong";

  const feedback = isCorrect
    ? `✅ All ${testCases.length} test cases passed. Great job!`
    : `Ran ${testCases.length} test cases: ${passed} passed.\n` +
      (failedCases.length > 0 ? failedCases.join("\n") : "");

  return {
    isCorrect,
    rubricScores,
    feedback,
  };
};
