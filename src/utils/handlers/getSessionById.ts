/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { BASE_URL } from "../constants";
import type { Session } from "mooterview-client";
import { getTokenData } from "../constants";
export const getSessionById = async (sessionId: string): Promise<Session> => {
  try {
    const tokenData = getTokenData();
    const response = await axios.get(`${BASE_URL}/sessions/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${tokenData.accessToken}`,
      },
    });


    return response.data as Session;
  } catch (error: any) {
    console.error(`Error fetching session with ID ${sessionId}:`, error);
    throw new Error(
      error.response?.data?.message ||
        "Failed to fetch session details. Please try again later."
    );
  }

};




