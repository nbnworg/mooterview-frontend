import { useState, useEffect } from "react";
import { Solvedproblems } from "../utils/handlers/getAllProblems";
import { getTokenData } from "../utils/constants";

export const useSolvedProblems = () => {
  const [solvedProblemIds, setSolvedProblemIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchSolved = async () => {
      const result: string[] = await Solvedproblems(getTokenData().id);
      setSolvedProblemIds(result);
    };
    fetchSolved();
  }, []);

  return solvedProblemIds;
};
