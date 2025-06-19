/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { BASE_URL } from "../constants";

export interface UserStats {
  totalSolved: number;
  totalSessions: number;
  averageSolveTime: number;
}

export const getUserStats = async (userId: string): Promise<UserStats> => {
  try {
    const response = await axios.get(`${BASE_URL}/users/${userId}/stats`);
    return response.data as UserStats;
  } catch (error: any) {
    console.error(`Error fetching stats for user ${userId}:`, error);
    throw new Error(
      error.response?.data?.message ||
        "Failed to fetch user statistics."
    );
  }
};
