/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { BASE_URL } from "../constants";
import type { ProblemSummary } from "mooterview-client";

export const getAllProblems = async (): Promise<ProblemSummary[]> => {
  try {
    console.log("here 3");
    const response = await axios.get(`${BASE_URL}/problems`);
    console.log("here 4");
    return response.data.problems as ProblemSummary[];
  } catch (error: any) {
    console.error("Error fetching problems:", error);
    throw new Error(
      error.response?.data || "Server is busy, can't fetch problems right now."
    );
  }
};
