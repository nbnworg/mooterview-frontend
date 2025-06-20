/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { BASE_URL, getTokenData } from "../constants";
import { refreshAccessToken } from "../refreshAccessToken";
import type { UpdateSessionByIdInput } from "mooterview-client";

export const updateSessionById = async (
  input: UpdateSessionByIdInput
): Promise<void> => {
  const { sessionId, ...payload } = input;

  const attemptUpdate = async (accessToken: string) => {
    return axios.patch(`${BASE_URL}/sessions/${sessionId}`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  };

  try {
    const tokenData = getTokenData();
    if (!tokenData) throw new Error("No token found");

    await attemptUpdate(tokenData.accessToken);
  } catch (error: any) {
    if (error?.response?.data?.error === "Invalid or expired token") {
      try {
        const newAccessToken = await refreshAccessToken();
        await attemptUpdate(newAccessToken);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        throw new Error("Session expired. Please log in again.");
      }
    } else {
      console.error(
        `Error updating session with ID ${input.sessionId}:`,
        error
      );
      throw new Error(
        error.response?.data?.message ||
          "Failed to update the session. Please try again later."
      );
    }
  }
};
