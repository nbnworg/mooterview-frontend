import { useState, useEffect } from "react";
import { getAllProblems } from "../utils/handlers/getAllProblems";
import type { ProblemSummary } from "mooterview-client";

export const useProblems = () => {
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CACHE_KEY = "cachedProblems";
  const CACHE_DURATION = 2 * 60 * 60 * 1000;

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      setError(null);
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        const now = Date.now();

        if (cached) {
          const { problems, timestamp } = JSON.parse(cached);
          if (now - timestamp < CACHE_DURATION) {
            setProblems(problems);
            setLoading(false);
            return;
          } else {
            localStorage.removeItem(CACHE_KEY);
          }
        }

        const freshProblems = await getAllProblems();
        console.log("Problem", problems);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ problems: freshProblems, timestamp: now })
        );
        setProblems(freshProblems);
      } catch {
        setError("Failed to load problems");
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  return { problems, loading, error };
};
