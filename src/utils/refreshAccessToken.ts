import axios from "axios";
import { BASE_URL, getTokenData } from "./constants";

export const refreshAccessToken = async () => {
  const tokens = getTokenData();
  if (!tokens?.refreshToken) {
    throw new Error("No refresh token available.");
  }

  const response = await axios.post(`${BASE_URL}/auth/refresh`, {
    refreshToken: tokens.refreshToken,
  });

  const updated = {
    ...tokens,
    accessToken: response.data.accessToken,
    idToken: response.data.idToken,
  };

  localStorage.setItem("userData", JSON.stringify(updated));
  return updated.accessToken;
};
