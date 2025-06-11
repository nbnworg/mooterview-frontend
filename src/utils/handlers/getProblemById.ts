/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { BASE_URL } from "../constants";
import type { Problem } from "mooterview-client";

export const getProblemById = async (problemId: string): Promise<Problem> => {
  try {
    const response = await axios.get(`${BASE_URL}/problems/${problemId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching problem with ID ${problemId}:`, error);
    throw new Error(
      error.response?.data ||
        "Server is busy, can't fetch the problem right now."
    );
  }
};
