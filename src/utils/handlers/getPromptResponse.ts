/* eslint-disable @typescript-eslint/no-explicit-any */
import { BASE_URL, getTokenData } from "../constants";
import { refreshAccessToken } from "../refreshAccessToken";

export const getPromptResponse = async ({
  actor,
  context,
  promptKey,
}: {
  actor: string;
  context: string;
  promptKey: string;
}) => {
  const makeRequest = async (accessToken: string) => {
    const response = await fetch(`${BASE_URL}/prompt/response`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ actor, context, promptKey }),
    });

    if (!response.ok) {
      throw new Error("Failed to get response from AI.");
    }

    const data = await response.json();
    return data.response;
  };

  try {
    const tokenData = getTokenData();
    if (!tokenData) throw new Error("Token not found");

    return await makeRequest(tokenData.accessToken);
  } catch (error: any) {
    if (error?.message?.includes("Invalid or expired token")) {
      try {
        const newAccessToken = await refreshAccessToken();
        return await makeRequest(newAccessToken);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        throw new Error("Session expired. Please log in again.");
      }
    }

    throw error;
  }
};
