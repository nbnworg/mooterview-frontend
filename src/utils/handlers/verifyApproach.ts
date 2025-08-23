import axios, { isAxiosError } from "axios";
import { BASE_URL, getTokenData } from "../constants";
import { refreshAccessToken } from "../refreshAccessToken";

interface VerifyApproachPayload {
  approach: string;
  code: string;
  problemTitle: string;
}

interface VerifyApproachResponse {
  alignment: "MATCH" | "MISMATCH";
  feedback: string;
}

export const verifyApproach = async (
  payload: VerifyApproachPayload
): Promise<VerifyApproachResponse> => {
  const makeRequest = async (accessToken: string) => {
    const response = await axios.post(
      `${BASE_URL}/prompt/verify-approach`, 
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data;
  };

  try {
    const tokenData = getTokenData();
    if (!tokenData) throw new Error("No token found");
    return await makeRequest(tokenData.accessToken);
  } catch (error) {

    if (isAxiosError(error) && error.response?.data?.error === "Invalid or expired token") {
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