/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { BASE_URL, getTokenData } from "../constants";
import { ProblemStatus } from "mooterview-client";
import { refreshAccessToken } from "../refreshAccessToken";

export const createSession = async ({
  userId,
  problemId,
  problemType
}: {
  userId: string;
  problemId: string;
  problemType: string
}) => {
  const startTime = new Date().toISOString();

  const payload = {
    userId,
    problemId,
    problemType,
    chatsQueue: [],
    startTime,
    endTime: "",
    problemStatus: ProblemStatus.NOT_STARTED,
    notes: [],
  };

  try {
    const tokenData = getTokenData();
    if (!tokenData) throw new Error("No token found");

    const res = await axios.post(`${BASE_URL}/sessions/`, payload, {
      headers: {
        Authorization: `Bearer ${tokenData.accessToken}`,
      },
    });

    return res.data.sessionId;
  } catch (error: any) {
    if (error?.response?.data?.error === "Invalid or expired token") {
      try {
        const newAccessToken = await refreshAccessToken();

        const res = await axios.post(`${BASE_URL}/sessions/`, payload, {
          headers: {
            Authorization: `Bearer ${newAccessToken}`,
          },
        });

        return res.data.sessionId;
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        throw new Error("Session expired. Please log in again.");
      }
    }

    console.error("Failed to create session:", error);
    throw new Error("Could not create session.");
  }
};
