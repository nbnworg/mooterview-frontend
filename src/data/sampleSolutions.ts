import { Actor } from "mooterview-client";
import { getPromptResponse } from "../utils/handlers/getPromptResponse";

export interface SolutionSnippet {
  language: string;
  code: string;
}

/**
 * Request example solutions from the backend using the same prompt service
 * that powers the chat interface.
 */
export const getSampleSolutions = async (
  problemDescription: string
): Promise<SolutionSnippet[]> => {
  try {
    const responseText = await getPromptResponse({
      actor: Actor.SYSTEM,
      context: "", // no additional context needed
      prompt: `Give two short optimal solution snippets in Python and JavaScript for the following coding problem. Respond as a JSON array of objects with "language" and "code" keys.\n\n${problemDescription}`,
    });

    return JSON.parse(responseText) as SolutionSnippet[];
  } catch (err) {
    console.error("Failed to generate sample solutions", err);
    return [];
  }
};
