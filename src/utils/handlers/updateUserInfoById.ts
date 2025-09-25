import axios from "axios";
import { BASE_URL, getTokenData } from "../constants";
import { refreshAccessToken } from "../refreshAccessToken";
import type { GetUserByIdInput } from "mooterview-client";

export const updateUserById = async (input: GetUserByIdInput): Promise<void> => {
    const { userId } = input;

    const attemptUpdate = async (accessToken: string) => {
        const noCache = new Date().getTime();
        return axios.patch(`${BASE_URL}/users/updateStreak/${userId}?_=${noCache}`, {
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
        `Error updating session with ID ${input.userId}:`,
        error
      );
      throw new Error(
        error.response?.data?.message ||
          "Failed to update the user info. Please try again later."
      );
    }
    }
}