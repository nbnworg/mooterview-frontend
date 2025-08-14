/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { BASE_URL, getTokenData } from "../constants";
import { refreshAccessToken } from "../refreshAccessToken";
import type { ProblemSummary } from "mooterview-client";

export const getAllProblems = async (): Promise<ProblemSummary[]> => {
  try {
    const tokenData = getTokenData();
    if (!tokenData) throw new Error("No token found");
    const response = await axios.get(`${BASE_URL}/problems`, {
      headers: { Authorization: `Bearer ${tokenData.accessToken}` },
    });
    return response.data.problems as ProblemSummary[];
  } catch (error: any) {
    if (error?.response?.data?.error === "Invalid or expired token") {
      try {
        const newAccessToken = await refreshAccessToken();

        const response = await axios.get(`${BASE_URL}/problems`, {
          headers: {
            Authorization: `Bearer ${newAccessToken}`,
          },
        });

        return response.data.problems as ProblemSummary[];
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        throw new Error("Session expired. Please log in again.");
      }
    }
    console.error("Error fetching problems:", error);
    throw new Error(
      error.response?.data || "Server is busy, can't fetch problems right now."
    );
  }
};

export const Solvedproblems = async (userId: string): Promise<string[]> => {
  try {
    const tokenData = getTokenData();
    if (!tokenData) throw new Error("No token found");

    const response = await axios.get(
      `${BASE_URL}/users/${userId}/solved_problems`,
      {
        headers: { Authorization: `Bearer ${tokenData.idToken}` },
      }
    );

    return response.data.uniqueProblemIds;
  } catch (error: any) {
    if (error?.response?.data?.error === "Invalid or expired token") {
      try {
        const newAccessToken = await refreshAccessToken();

        const response = await axios.get(
          `${BASE_URL}/users/${userId}/solved_problems`,
          {
            headers: {
              Authorization: `Bearer ${newAccessToken}`,
            },
          }
        );

        return response.data.uniqueProblemIds;
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        throw new Error("Session expired. Please log in again.");
      }
    }

    console.error("Error fetching solved problems:", error);
    throw new Error(
      error.response?.data || "Server is busy, can't fetch problems right now."
    );
  }
};
