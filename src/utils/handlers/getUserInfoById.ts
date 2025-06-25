/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { BASE_URL, getTokenData } from "../constants";
import { refreshAccessToken } from "../refreshAccessToken";
import type { GetUserByIdOutput } from "mooterview-client";

export const getUserById = async (userId: string): Promise<GetUserByIdOutput> => {
  try {
    const tokenData = getTokenData();
    if (!tokenData) throw new Error("No token found");

    const response = await axios.get(`${BASE_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${tokenData.accessToken}`,
      },
    });

    return response.data;
  } catch (error: any) {
    if (error?.response?.data?.error === "Invalid or expired token") {
      try {
        const newAccessToken = await refreshAccessToken();

        const response = await axios.get(`${BASE_URL}/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${newAccessToken}`,
          },
        });

        return response.data;
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        throw new Error("Session expired. Please log in again.");
      }
    }

    console.error(`Error fetching UserData with ID ${userId}:`, error);
    throw new Error(
      error.response?.data ||
        "Server is busy, can't fetch the problem right now."
    );
  }
};
