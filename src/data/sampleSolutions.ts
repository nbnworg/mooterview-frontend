import { Actor } from "mooterview-client";
import { getPromptResponse } from "../utils/handlers/getPromptResponse";
import { offlineSampleSolutions } from "./offlineSampleSolutions";

export interface SolutionSnippet {
  language: string;
  code: string;
}

/**
 * Request example solutions from the backend using the same prompt service
 * that powers the chat interface.
 *
 * The API often responds with a plain text block rather than structured JSON,
 * so we return the raw string and only fall back to the offline dataset when
 * necessary.
 */
export const getSampleSolutions = async (
  problemDescription: string,
  problemId?: string
): Promise<string> => {
  try {
    const responseText = await getPromptResponse({
      actor: Actor.SYSTEM,
      context: "",
      prompt:
        "Give two short optimal solution snippets in Python and JavaScript for the following coding problem:" +
        "\n\n" +
        problemDescription,
    });

    if (responseText.trim()) {
      return responseText.trim();
    }
  } catch (err) {
    console.error("Failed to generate sample solutions", err);
  }

  if (problemId && offlineSampleSolutions[problemId]) {
    return offlineSampleSolutions[problemId]
      .map((s) => `${s.language}:\n${s.code}`)
      .join("\n\n");
  }

  return "";
};
