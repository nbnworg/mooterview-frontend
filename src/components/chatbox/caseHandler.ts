/* eslint-disable @typescript-eslint/no-explicit-any */
import { Actor, type Problem } from "mooterview-client";
import { getPromptResponse } from "../../utils/handlers/getPromptResponse";

type Stage =
  | "EXPLAIN_PROBLEM"
  | "ASK_UNDERSTAND"
  | "WAIT_FOR_APPROACH"
  | "CODING"
  | "FOLLOW_UP"
  | "SESSION_END";

// #UNDERSTOOD_CONFIRMATION CASE
export const handleUnderstoodConfirmation = async (
  currentStage: Stage,
  context: string,
  problemData: Problem,
  userInput: string,
  stageRef: React.MutableRefObject<Stage>,
  approachAttemptCountRef: React.MutableRefObject<number>,
  hasProvidedApproachRef: React.MutableRefObject<boolean>,
  addBotMessage: (text: string) => Promise<void>
): Promise<void> => {
  if (
    currentStage === "ASK_UNDERSTAND" ||
    currentStage === "WAIT_FOR_APPROACH"
  ) {
    const followup = await getPromptResponse({
      actor: Actor.INTERVIEWER,
      context: `User confirmed understanding. Ask them to explain their approach.
                 ${context}
                 Problem: ${problemData.title}
                 Description: ${problemData.problemDescription}
                 User's last message: ${userInput}`,
      promptKey: "ask-approach",
      modelName: "gpt-3.5-turbo",
    });

    await addBotMessage(followup);
    stageRef.current = "WAIT_FOR_APPROACH";
    approachAttemptCountRef.current = 0;
    hasProvidedApproachRef.current = false;
  }
};

// #CONFUSED CASE
export const handleConfusedCase = async (
  context: string,
  problemData: Problem,
  userInput: string
): Promise<string> => {
  const finalContext = `User seems confused. Provide a short clarification of the user question and re-ask if they understood.
                  ${context}
                  Problem: ${problemData.title}
                  Description: ${problemData.problemDescription}
                  User's last message: ${userInput}`;

  return await getPromptResponse({
    actor: Actor.INTERVIEWER,
    context: finalContext,
    promptKey: "clarify-problem",
    modelName: "gpt-4o",
  });
};

// RIGHT_ANSWER CASE
export const handleRightAnswerCase = async (
  context: string,
  problem: Problem,
  codeSnapshot: string,
  input: string,
  handleFollowUpRef: React.MutableRefObject<number>,
  questionCounterValueRef: React.MutableRefObject<{ number: number } | null>,
  stageRef: React.MutableRefObject<Stage>,
  addBotMessage: (text: string) => Promise<void>
) => {
  if (handleFollowUpRef.current === 0) {
    const followUp = await getPromptResponse({
      actor: Actor.SYSTEM,
      context: `${context}
                Problem: ${problem.title}
                Description: ${problem.problemDescription}
                Code: ${codeSnapshot}
                User's last message: ${input}`,
      promptKey: "follow-up-question-counter",
      modelName: "gpt-3.5-turbo",
    });

    handleFollowUpRef.current += 1;
    questionCounterValueRef.current = {
      number: Number(JSON.parse(followUp).number),
    };
  }

  if (
    questionCounterValueRef.current &&
    questionCounterValueRef.current.number !== 0
  ) {
    const response = await getPromptResponse({
      actor: Actor.AI,
      context: `${context}
                Problem: ${problem.title}
                Description: ${problem.problemDescription}
                Code: ${codeSnapshot}
                User's last message: ${input}`,
      promptKey: "repeat-follow-up",
      modelName: "gpt-4o",
    });

    await addBotMessage(response);
    questionCounterValueRef.current.number -= 1;
  } else {
    await addBotMessage("Well done, that is correct");
    stageRef.current = "SESSION_END";
  }
};

// #WRONG_ANSWER CASE
export const handleWrongCase = async (
  context: string,
  problem: Problem,
  input: string,
  addBotMessage: (text: string) => Promise<void>
) => {
  const response = await getPromptResponse({
    actor: Actor.INTERVIEWER,
    context: `${context}\n
              Problem: ${problem.title}
              Description: ${problem.problemDescription}\n
              User's last message: ${input}`,
    promptKey: "ack-followup",
    modelName: "gpt-4o",
  });
  await addBotMessage(response);
};

// #REQUESTED_EXAMPLE CASE
export const handleRequestExampleCase = async (
  context: string,
  problem: Problem,
  input: string,
  currentStage: Stage,
  addBotMessage: (text: string) => Promise<void>
) => {
  const exampleResponse = await getPromptResponse({
    actor: Actor.INTERVIEWER,
    context: `User asked for an example or to rephrase the question.\n
              ${context}\n 
              Problem: ${problem.title}
              Description: ${problem.problemDescription}
              Current stage: ${currentStage}
              User's last message: ${input}
              `,
    promptKey: "provide-example",
    modelName: "gpt-3.5-turbo",
  });
  await addBotMessage(exampleResponse);
};

// #APPROACH_PROVIDED CASE
export const handleApproachProvided = async (
  currentStage: Stage,
  messages: any[],
  problem: Problem,
  input: string,
  hasProvidedApproachRef: React.MutableRefObject<boolean>,
  stageRef: React.MutableRefObject<Stage>,
  approachTextRef: React.MutableRefObject<string>,
  onApproachCorrectChange: ((isCorrect: boolean) => void) | undefined,
  addBotMessage: (text: string) => Promise<void>
) => {
  if (currentStage === "WAIT_FOR_APPROACH" && !hasProvidedApproachRef.current) {
    const evaluation = await getPromptResponse({
      actor: Actor.INTERVIEWER,
      context: `User has shared an approach. Evaluate it and respond with one of "#CORRECT", "#PARTIAL", or "#WRONG" followed by your message.
          Chat transcript: ${JSON.stringify(messages, null, 2)}
          User approach: ${input}
          Problem: ${problem.title}
          Description: ${problem.problemDescription}`,
      promptKey: "ack-approach",
      modelName: "gpt-4o"
    });

    const tagMatch = evaluation.match(/^(#CORRECT|#PARTIAL|#WRONG)/);
    const tag = tagMatch ? tagMatch[0] : "#WRONG";

    const isSufficient = evaluation.includes("[SUFFICIENT]");
    const message = evaluation
      .replace(/^(#CORRECT|#PARTIAL|#WRONG)[:\s]*/, '')
      .replace(/\[SUFFICIENT\]|\[INSUFFICIENT\]/g, '')
      .trim();

    if (tag === "#CORRECT") {
      await addBotMessage(
        "Alright, you can start coding now.\nIf you get stuck at any point, feel free to ask for help. Once you've completed your code, click on 'Verify Code' button to check your solution."
      );
      approachTextRef.current = input;
      stageRef.current = "CODING";
      hasProvidedApproachRef.current = true;
      if (onApproachCorrectChange) {
        onApproachCorrectChange(true);
      }
    }
     else if (tag === "#PARTIAL") {
      if (isSufficient) {
        await addBotMessage(
          `This is a good starting point. You can begin coding and we'll refine as you implement.`
        );
        approachTextRef.current = input;
        stageRef.current = "CODING";
        hasProvidedApproachRef.current = true;
        if (onApproachCorrectChange) {
          onApproachCorrectChange(true);
        }
      } else {
        await addBotMessage(
          `${message}\n\nCould you elaborate more on your approach?`
        );
      }
    } else {
      const response = await getPromptResponse({
        actor: Actor.INTERVIEWER,
        context: `User has given an incorrect approach. Ask them to try again.
                    Chat transcript: ${JSON.stringify(messages, null, 2)}
                    User's last message: ${input}`,
        promptKey: "repeat-ask",
        modelName: "gpt-3.5-turbo",
      });
      await addBotMessage(response);
    }
  } else {
    const response = await getPromptResponse({
      actor: Actor.INTERVIEWER,
      context: `User is asking a follow-up question. Provide helpful guidance.
                Current stage: ${currentStage}
                Chat transcript: ${JSON.stringify(messages, null, 2)}
                Problem: ${problem.title}
                Description: ${problem.problemDescription}
                User's last message: ${input}`,
      promptKey: "general-guidance",
      modelName: "gpt-3.5-turbo",
    });
    await addBotMessage(response);
  }
};
// #PROBLEM_EXPLANATION
export const handleProblemExplanationCase = async (
  currentStage: Stage,
  context: string,
  problem: Problem,
  addBotMessage: (text: string) => Promise<void>,
  input: string
) => {
  const responses = await getPromptResponse({
    actor: Actor.INTERVIEWER,
    context: `User has ask explanation about the problem.Explain the problem.
              Current stage: ${currentStage}
              ${context}
              Problem: ${problem.title}
              Description: ${problem.problemDescription}\n
              User's last message: ${input}`,
    promptKey: "general-problem",
    modelName: "gpt-3.5-turbo",
  });
  await addBotMessage(responses);
};

interface CodingQuestionParams {
  currentStage: Stage;
  context: string;
  problem: Problem;
  input: string;
  currentCode: string;
  hasProvidedApproachRef: React.MutableRefObject<boolean>;
  addBotMessage: (text: string) => Promise<void>;
}

// #CODING_QUESTION CASE
export const handleCodingQuestion = async (params: CodingQuestionParams) => {
  const {
    currentStage,
    context,
    problem,
    input,
    currentCode,
    hasProvidedApproachRef,
    addBotMessage,
  } = params;

  if (currentStage === "WAIT_FOR_APPROACH" && !hasProvidedApproachRef.current) {
    const finalContext = `${context}
                    Problem: ${problem.title}
                    Description: ${problem.problemDescription}
                    User's last message: ${input}`;

    const clarificationPrompt = await getPromptResponse({
      actor: Actor.INTERVIEWER,
      context: finalContext,
      promptKey: "ask-approach-before-coding",
      modelName: "gpt-3.5-turbo",
    });
    await addBotMessage(clarificationPrompt);
  } else {
    const finalContext = `User is asking a coding question. Provide helpful guidance.
                    ${context}
                    Problem: ${problem.title}
                    Description: ${problem.problemDescription}
                    Current code: ${currentCode || "No code written yet"}
                    User's last message: ${input}`;

    const response = await getPromptResponse({
      actor: Actor.INTERVIEWER,
      context: finalContext,
      promptKey: "coding-start-guidance",
      modelName: "gpt-3.5-turbo",
    });
    await addBotMessage(response);
  }
};

// CODING_HELP CASE
export const handleCodingHelp = async (
  context: string,
  problem: Problem,
  currentCode: string,
  input: string,
  addBotMessage: (text: string) => Promise<void>
) => {
  const finalContext = `User needs help with coding/debugging. Provide specific assistance.
                  ${context}
                  Problem: ${problem.title}
                  Description: ${problem.problemDescription}
                  Current code: ${currentCode || "No code written yet"}
                  User's last message: ${input}`;

  const response = await getPromptResponse({
    actor: Actor.INTERVIEWER,
    context: finalContext,
    promptKey: "coding-debug-help",
    modelName: "gpt-4o",
  });

  await addBotMessage(response);
};

// #GENERAL_ACKNOWLEDGMENT
export const handleGenralAcknowledgement = async (
  currentStage: Stage,
  context: string,
  problem: Problem,
  addBotMessage: (text: string) => Promise<void>,
  input: string
) => {
  const response = await getPromptResponse({
    actor: Actor.INTERVIEWER,
    context: `User acknowledged something. Provide encouragement and next steps.
              Current stage: ${currentStage}
              ${context}
              Problem: ${problem.title}
              Description: ${problem.problemDescription}\n
              User's last message: ${input}`,
    promptKey: "general-encouragement",
    modelName: "gpt-3.5-turbo",
  });
  await addBotMessage(response);
};
// #OFF_TOPIC CASE
export const handleOffTopic = async (
  currentStage: Stage,
  context: string,
  problem: Problem,
  addBotMessage: (text: string, texts: boolean) => Promise<void>
) => {
  const followup = await getPromptResponse({
    actor: Actor.INTERVIEWER,
    context: `The user went off-topic, but you must keep the interview on track.
              Maintain the current stage and context.
              Here is the relevant context so far:
              ${context}
              Problem: ${problem.title}
              Description: ${problem.problemDescription}
              Current stage: ${currentStage}
             `,
    promptKey: "off-topic",
    modelName: "gpt-3.5-turbo",
  });

  await addBotMessage(followup, true);
};

// #DEFAULT CASE
export const handleDefaultCase = async (
  currentStage: Stage,
  context: string,
  problem: Problem,
  currentCode: string,
  input: string,
  addBotMessage: (text: string) => Promise<void>
) => {
  if (currentStage === "CODING") {
    const codingContext = `User is asking a question during coding phase. Provide helpful guidance.
                          ${context}
                          Problem: ${problem.title}
                          Description: ${problem.problemDescription}
                          Current code: ${currentCode || "No code written yet"}
                          User's last message: ${input}`;

    const response = await getPromptResponse({
      actor: Actor.INTERVIEWER,
      context: codingContext,
      promptKey: "coding-guidance",
      modelName: "gpt-3.5-turbo",
    });
    await addBotMessage(response);
  } else {
    const fallbackContext = `User's message does not match predefined classifications
                            in this ${currentStage} phase. Maintain the current context.
                            Recent chat history: ${context}
                            Problem: ${problem.title}
                            Description: ${problem.problemDescription}
                            Current code: ${currentCode || "N/A"}`;

    const response = await getPromptResponse({
      actor: Actor.INTERVIEWER,
      context: fallbackContext,
      promptKey: "general-fallback",
      modelName: "gpt-3.5-turbo",
    });
    await addBotMessage(response);
  }
};
