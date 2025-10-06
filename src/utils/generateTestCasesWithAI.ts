/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ProblemLevel } from "mooterview-client";
// import { getPromptResponse } from "./handlers/getPromptResponse";

export interface TestCase {
  input: any;
  expected: any;
  explanation?: string;
  argumentNames?: string[];
}

export interface Problem {
  title: string | undefined;
  problemDescription: string | undefined;
  example: string[] | undefined;
  problemId: string | undefined;
  problemStatement: string | undefined;
  level: ProblemLevel | undefined;
  problemPattern: string | undefined;
  averageSolveTime: number | undefined;
  totalUsersAttempted: number | undefined;
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