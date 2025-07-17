type EvaluationScore = "strong" | "mixed" | "weak";

export interface RubricResult {
  isCorrect: boolean;
  rubricScores: {
    correctness: EvaluationScore;
    edgeCases: EvaluationScore;
    performance: EvaluationScore;
    structureChoice: EvaluationScore;
    readability: EvaluationScore;
  };
  feedback: string;
}

export const evaluateSolutionWithRubric = async (
  code: string
): Promise<RubricResult> => {
  const hasLoops = /\b(for|while)\b/.test(code);
  const hasEdgeHandling = /if .*len|if .*==.*|return \[\]/.test(code);
  const isShort = code.length <= 600;

  const rubricScores: RubricResult["rubricScores"] = {
    correctness: hasLoops ? "strong" : "mixed",
    edgeCases: hasEdgeHandling ? "strong" : "mixed",
    performance: hasLoops ? "strong" : "mixed",
    structureChoice: "mixed",
    readability: isShort ? "strong" : "mixed",
  };

  const isCorrect =
    rubricScores.correctness === "strong" && rubricScores.edgeCases !== "weak";

  return {
    isCorrect,
    rubricScores,
    feedback: `This was evaluated based on code structure and common patterns (e.g., loops, edge handling).`,
  };
};
