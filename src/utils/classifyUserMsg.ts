import { getPromptResponse } from "./handlers/getPromptResponse";
import { Actor } from "mooterview-client";

export const classifyUserMessage = async (input: string, currentStage: string, recentMessages: any[]) => {
    const lastBotMessage = recentMessages
        .filter(msg => msg.actor === Actor.INTERVIEWER)
        .slice(-1)[0]?.message || "";

    const context = `
        The current interview stage is: "${currentStage}".
        
        The interviewer's last message was: "${lastBotMessage}"

        The user just said: "${input}"

        Recent chat history:
        ${JSON.stringify(recentMessages, null, 2)}

        IMPORTANT CLASSIFICATION RULES:
        
        1. If currentStage is "ASK_UNDERSTAND":
           - User says "yes", "I understand", "clear", "got it" → #UNDERSTOOD_CONFIRMATION
           - User asks for clarification, "I don't understand" → #CONFUSED
           - User asks for example → #REQUESTED_EXAMPLE
           - User talks about unrelated topics → #OFF_TOPIC
        
        2. If currentStage is "WAIT_FOR_APPROACH":
           - User explains their solution approach/algorithm → #APPROACH_PROVIDED
           - User asks for example → #REQUESTED_EXAMPLE
           - User talks about unrelated topics → #OFF_TOPIC
           - User was not able to answer, so he was explained the question again and has said yes and it is clear to him now → #UNDERSTOOD_CONFIRMATION
           - User says yes to interviewer's last question → #PROBLEM_EXPLANATIONS
        
        3. If currentStage is "CODING":
           - User explains an approach → #APPROACH_PROVIDED (only if they haven't started coding yet)
           - User asks coding questions, "where do I start", "how do I..." → #CODING_QUESTION
           - User says "yes" to clarification → #GENERAL_ACKNOWLEDGMENT
           - User asks for help with debugging or says "am i doing this right" or "is this correct" or "am i going in right direction" → #CODING_HELP
           - User gives assertive debugging statements like: “It’s not working”, “This gives wrong output”, “I tried recursion but it fails” →  #CODING_HELP
           - User says "I already checked this", "I am handling it", "I wrote this line already" → #CODING_HELP
           - User talks about unrelated topics → #OFF_TOPIC

        4. If currentStage is "FOLLOW_UP":
           - If user answers the follow-up question correctly (see context/transcript for question) → #RIGHT_ANSWER
           - If user answers the follow-up question incorrectly or even slightly incorrect (see context/transcript for question) → #WRONG_ANSWER (not #CONFUSED)
           - If user answers partially correct (incomplete or half-right) → #WRONG_ANSWER
           - If user asks for clarification or rephrasing the question ask the same question in different manner on the follow-up question → #REQUESTED_EXAMPLE
           - If user says "I think so", "maybe the answer is X", or other uncertain phrasing → classify as #RIGHT_ANSWER or #WRONG_ANSWER depending on correctness
           - If user gives unrelated or off-topic response → #OFF_TOPIC
           - If user answers "yes, I'll reply" or "yes" after he went off topic last time → #RESPOND
         
        5. If currentStage is "SESSION_END":
           - If user asks anything in this stage → #INTERVIEW_END

        5. General rules:
           - If user just says "yes", "okay", "sure" and we're NOT in ASK_UNDERSTAND stage → #GENERAL_ACKNOWLEDGMENT
           - If user acknowledges without answering (e.g., "hmm okay", "alright", "fine") → #GENERAL_ACKNOWLEDGMENT
           - If user describes algorithm/solution steps → #APPROACH_PROVIDED
           - If user asks about problem examples → #REQUESTED_EXAMPLE
           - If user seems confused about problem → #CONFUSED
           - If user talks about unrelated topics → #OFF_TOPIC
           - If user asks "where do i start or how should i do it" in WAIT_FOR_APPROACH -> #CODING_QUESTION
           - If the user is in WAIT_FOR_APPROACH and asks something out of context or not related to coding problem -> #CODING_QUESTION
           - If user is in FOLLOW_UP stage NEVER return #CONFUSED.
           - If user gives a vague uncertain answer ("I think so", "maybe") → do not leave ambiguous, always force into #RIGHT_ANSWER or #WRONG_ANSWER based on context correctness

        Respond with ONLY one of:
        #UNDERSTOOD_CONFIRMATION
        #PROBLEM_EXPLANATION
        #RESPOND
        #CONFUSED
        #REQUESTED_EXAMPLE
        #APPROACH_PROVIDED
        #CODING_QUESTION
        #CODING_HELP
        #GENERAL_ACKNOWLEDGMENT
        #OFF_TOPIC
        #WRONG_ANSWER
        #RIGHT_ANSWER
        #INTERVIEW_END
    `;

    const response = await getPromptResponse({
        actor: Actor.SYSTEM,
        context: context,
        promptKey: "classify-user-response",
        modelName: "gpt-4o"
    });
    
    return response.trim();
};