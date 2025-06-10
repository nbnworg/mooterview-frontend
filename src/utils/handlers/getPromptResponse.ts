import { BASE_URL } from "../constants";

export const getPromptResponse = async ({
  actor,
  context,
  prompt,
}: {
  actor: string;
  context: string;
  prompt: string;
}) => {
  const response = await fetch(`${BASE_URL}/prompt/response`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ actor, context, prompt }),
  });

  if (!response.ok) {
    throw new Error("Failed to get response from AI.");
  }

  const data = await response.json();
  return data.response;
};
