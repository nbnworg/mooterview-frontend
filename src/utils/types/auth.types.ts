export interface ChatMessage {
  from: "Moo" | "You";
  text: string;
}

export interface AuthStep {
  id: string;
  question: string;
}

export interface AuthFormData {
  [key: string]: string;
}
