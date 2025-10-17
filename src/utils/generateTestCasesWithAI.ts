/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Problem } from "./types/problem.types";

export interface TestCase {
  input: any;
  expected: any;
  explanation?: string;
  argumentNames?: string[];
}

export const generateTestCasesWithAI = (problem: Problem): TestCase[] => {
  if (!problem.example) return [];

  console.log("example,", problem.example)
  // If DynamoDB stores `example` as JSON string:

  if (typeof problem.example === "string") {
    try {
      return JSON.parse(problem.example) as TestCase[];
    } catch (err) {
      console.error("❌ Failed to parse problem.example string", err);
      return [];
    }
  }


  // If DynamoDB stores `example` as already parsed array:
  if (Array.isArray(problem.example)) {
    return problem.example as unknown as TestCase[];
  }

  return [];
};