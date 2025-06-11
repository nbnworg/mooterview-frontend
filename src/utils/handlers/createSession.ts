import axios from "axios";
import { BASE_URL } from "../constants";
import { ProblemStatus } from "mooterview-client";

export const createSession = async ({
  userId,
  problemId,
}: {
  userId: string;
  problemId: string;
}) => {
  const startTime = new Date().toISOString();

  const payload = {
    userId,
    problemId,
    chatsQueue: [],
    startTime,
    endTime: "",
    problemStatus: ProblemStatus.NOT_STARTED,
    notes: [],
  };

  const res = await axios.post(`${BASE_URL}/sessions/`, payload);
  return res.data.sessionId; // Ensure backend returns this
};