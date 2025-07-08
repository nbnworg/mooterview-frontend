import { getPromptResponse } from "./handlers/getPromptResponse";
import { Actor } from "mooterview-client";

/**
 * Classifies the user's input to determine the intent.
 * Returns one of:
 * - #UNDERSTOOD_CONFIRMATION
 * - #CONFUSED
 * - #REQUESTED_EXAMPLE
 * - #APPROACH_PROVIDED
 * - #OFF_TOPIC
 */
export const classifyUserMessage = async (input: string, currentStage: string, recentMessages: string[]) => {
    const response = await getPromptResponse({
        actor: Actor.SYSTEM,
        context: `
            The current interview stage is: "${currentStage}".

            The user just said:
            "${input}"

            Recent chat history:
            ${JSON.stringify(recentMessages.slice(-10), null, 2)}

            Classify the user's intent. Respond with ONLY one of:
            #UNDERSTOOD_CONFIRMATION
            #CONFUSED
            #REQUESTED_EXAMPLE
            #APPROACH_PROVIDED
            #OFF_TOPIC
        `,
        promptKey: "classify-user-response",
    });

    return response.trim();
};
