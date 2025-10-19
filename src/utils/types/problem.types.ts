import type { ProblemLevel } from "mooterview-client";

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