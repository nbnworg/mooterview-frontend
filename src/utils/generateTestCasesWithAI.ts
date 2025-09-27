/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Problem } from "mooterview-client";
import { getPromptResponse } from "./handlers/getPromptResponse";

export interface TestCase {
  input: any;
  expected: any;
  explanation?: string;
  argument?: any;
}

export const generateTestCasesWithAI = async (
  problem: Problem
): Promise<TestCase[]> => {
  const prompt = `
Problem Title: ${problem.title}
Description: ${problem.problemDescription}

IMPORTANT: Output MUST be ONLY a valid JSON array with no additional text, markdown, or code fences.
`;

  const response = await getPromptResponse({
    actor: "test-generator",
    context: prompt,
    promptKey: "generate-test-cases",
    modelName: "gpt-4o",
  });

  try {
    const parsed = JSON.parse(response);
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
