/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Problem } from "mooterview-client";
import { getPromptResponse } from "./handlers/getPromptResponse";

export interface TestCase {
  input: any;
  expected: any;
  explanation?: string;
  argumentNames?: string[];
}

export const generateTestCasesWithAI = async (
  problem: Problem
): Promise<TestCase[]> => {
  const prompt = `
Problem Title: ${problem.title}
Description: ${problem.problemDescription}
`;

  const response = await getPromptResponse({
    actor: "test-generator",
    context: prompt,
    promptKey: "generate-test-cases",
    modelName: "gpt-4o",
  });

// strip markdown code fences if present
let raw = response.trim();

// remove leading ```json or ```
raw = raw.replace(/^```(?:json)?\s*/i, "");
// remove trailing ```
raw = raw.replace(/```$/, "");

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Invalid format");
    console.log(parsed);
    return parsed;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    console.error("❌ Failed to parse AI-generated test cases");
    console.error("Raw response:", response);
    return [];
  }
};