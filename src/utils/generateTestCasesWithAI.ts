/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Problem } from "mooterview-client";
import { getPromptResponse } from "./handlers/getPromptResponse";

export interface TestCase {
  input: any[];
  expected: any;
  explanation?: string;
}

export const generateTestCasesWithAI = async (
  problem: Problem
): Promise<TestCase[]> => {
  const prompt = `
You are a test case generator for coding problems.

Problem Title: ${problem.title}
Description: ${problem.problemDescription}

Generate exactly 3 Python test cases in the following strict JSON format:
[
  { "input": [...], "expected": ..., "explanation": "..." },
  ...
]

Rules:
- Only return the raw JSON array
- Do not include any comments, markdown, or extra text
- Make sure the last test case is an edge case
  `;

  const response = await getPromptResponse({
    actor: "test-generator",
    context: prompt,
    promptKey: "generate-test-cases",
  });

  try {
    const parsed = JSON.parse(response);
    if (!Array.isArray(parsed)) throw new Error("Invalid format");
    return parsed;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    console.error("❌ Failed to parse AI-generated test cases");
    console.error("Raw response:", response);
    return [];
  }
};
