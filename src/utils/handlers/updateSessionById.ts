/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { BASE_URL } from "../constants";
import type { UpdateSessionByIdInput } from "mooterview-client";

export const updateSessionById = async (
  input: UpdateSessionByIdInput
): Promise<void> => {
  try {
    const { sessionId, ...payload } = input;

    await axios.patch(`${BASE_URL}/sessions/${sessionId}`, payload);
  } catch (error: any) {
    console.error(`Error updating session with ID ${input.sessionId}:`, error);
    throw new Error(
      error.response?.data?.message ||
        "Failed to update the session. Please try again later."
    );
  }
};
