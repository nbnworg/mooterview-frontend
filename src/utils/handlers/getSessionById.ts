/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { BASE_URL } from "../constants";
import type { Session } from "mooterview-client";

export const getSessionById = async (sessionId: string): Promise<Session> => {
  try {
    const response = await axios.get(`${BASE_URL}/sessions/${sessionId}`);
    return response.data.session as Session;
  } catch (error: any) {
    console.error(`Error fetching session with ID ${sessionId}:`, error);
    throw new Error(
      error.response?.data?.message ||
        "Failed to fetch the session. Please try again later."
    );
  }
};

