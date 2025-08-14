import { useEffect, useState } from "react";
import type { ProblemSummary } from "mooterview-client";

export const useProgressData = (
  problems: ProblemSummary[],
  solvedIds: string[]
) => {
  const [progressData, setProgressData] = useState({
    easy: { attempted: 0, total: 0 },
    medium: { attempted: 0, total: 0 },
    hard: { attempted: 0, total: 0 },
  });

  useEffect(() => {
    if (problems.length && solvedIds.length >= 0) {
      const countByLevel = (level: string) => ({
        total: problems.filter((p) => p.level?.toLowerCase() === level).length,
        attempted: problems.filter(
          (p) =>
            p.level?.toLowerCase() === level &&
            solvedIds.includes(String(p.problemId))
        ).length,
      });

      setProgressData({
        easy: countByLevel("easy"),
        medium: countByLevel("medium"),
        hard: countByLevel("hard"),
      });
    }
  }, [problems, solvedIds]);

  return progressData;
};
