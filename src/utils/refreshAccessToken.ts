import axios from "axios";
import { BASE_URL, getTokenData } from "./constants";

export const refreshAccessToken = async () => {
  const tokens = getTokenData();

  if (!tokens?.refreshToken) {
    localStorage.removeItem("userData");
    window.location.replace("/log-in");
    throw new Error("No refresh token available.");
  }


  try {
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
  } catch (err) {

    localStorage.removeItem("userData");
    window.location.replace("/log-in");
    throw new Error("Token refresh failed");
  }
};