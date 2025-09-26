/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { isEqual } from "lodash"

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
  isEdgeCase?: boolean;
  comparisonMode?: 'strict' | 'unordered-array';
}

const JUDGE0_URL = "https://ce.judge0.com";
const PYTHON_ID = 109;

function extractFunctionName(problemTitle: string): string {
  return problemTitle.replace(/\s+/g, "_").toLowerCase();
}

function areArraysEquivalent(a: any, b: any): boolean {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }
  // Create sorted copies to compare
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return isEqual(sortedA, sortedB);
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

print(json.dumps(result))  # ✅ ensures proper JSON output
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
  problemTitle?: string
): Promise<RubricResult> => {
  let passed = 0;
  let edgeCasesPassed = 0;
  let totalEdgeCases = 0;
  const failedCases: string[] = [];

  for (const t of testCases) {
    const stdin = JSON.stringify(t.input);
    const rawOutput = await executeCode(code, stdin, problemTitle || "solution");

    let parsedOutput: any;
    try {
      parsedOutput = JSON.parse(rawOutput);
    } catch (e) {
      parsedOutput = rawOutput; // Fallback if output is not valid JSON
    }

    if (t.isEdgeCase) {
      totalEdgeCases++;
    }

    // --- Dynamic Comparison Logic ---
    let isMatch = false;
    if (t.comparisonMode === 'unordered-array') {
      isMatch = areArraysEquivalent(parsedOutput, t.expected);
    } else {
      isMatch = isEqual(parsedOutput, t.expected); // Default to strict comparison
    }

    if (isMatch) {
      passed++;
      if (t.isEdgeCase) {
        edgeCasesPassed++;
      }
    } else {
      failedCases.push(
        `❌ Input=${JSON.stringify(t.input)} | Expected=${JSON.stringify(t.expected)} | Got=${rawOutput}`
      );
    }
  }

  const correctness: EvaluationScore =
    passed === testCases.length ? "strong" : passed > 0 ? "mixed" : "weak";

  // --- NEW, IMPROVED HEURISTICS ---

  // 1. Edge Case Score
  const getEdgeCaseScore = (): EvaluationScore => {
    if (totalEdgeCases === 0) return "strong"; // No defined edge cases to test against
    const ratio = edgeCasesPassed / totalEdgeCases;
    if (ratio === 1) return "strong";
    if (ratio > 0) return "mixed";
    return "weak";
  };

  // 2. Performance Score
  const hasLoop = /\b(for|while)\b/.test(code);
  const hasNestedLoop = /\b(for|while)\b[\s\S]*\b(for|while)\b/.test(code);
  const getPerformanceScore = (): EvaluationScore => {
    if (hasNestedLoop) return "weak";
    if (hasLoop) return "mixed";
    return "strong";
  };

  // 3. Readability Score
  const lines = code.split('\n').filter(line => line.trim() !== '');
  const commentLines = lines.filter(line => line.trim().startsWith('#')).length;
  const variableNames = (code.match(/\b([a-zA-Z_]\w*)\s*=/g) || []).map(s => s.split('=')[0].trim());
  const avgVarNameLength = variableNames.reduce((acc, name) => acc + name.length, 0) / (variableNames.length || 1);
  const getReadabilityScore = (): EvaluationScore => {
    let score = 0;
    if (lines.length > 1 && code.length > 50) score++; // Not a dense one-liner
    if (lines.length < 80) score++; // Not excessively long
    if (commentLines / lines.length > 0.05) score++; // Has some comments
    if (avgVarNameLength > 2.5) score++; // Variable names are not too short
    
    if (score >= 3) return "strong";
    if (score >= 1) return "mixed";
    return "weak";
  };
  
  const rubricScores: RubricResult["rubricScores"] = {
    correctness,
    edgeCases: getEdgeCaseScore(),
    performance: getPerformanceScore(),
    structureChoice: "mixed", // This remains a challenge for static analysis
    readability: getReadabilityScore(),
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
};;
