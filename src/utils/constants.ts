export const BASE_URL =
  "https://w7eo1zzql3.execute-api.us-east-1.amazonaws.com/sandbox"; // sandbox
// "https://4yf5536i0g.execute-api.us-east-1.amazonaws.com/production"; // production

export const levelColor = {
  Easy: "#10b981",
  Medium: "#f59e0b",
  Hard: "#ff3f33",
};

export const exceptionMap: Record<string, { message: string; stepId: string }> =
  {
    UsernameExistsException: {
      message: "⚠️ That email already exists. Try a different one.",
      stepId: "email",
    },
    InvalidPasswordException: {
      message: "🔐 That password doesn't meet our rules. Enter a stronger one.",
      stepId: "password",
    },
    UserNotFoundException: {
      message: "⚠️ Incorrect email Let's try again.",
      stepId: "email",
    },
    NotAuthorizedException: {
      message: "❌ Incorrect email or password. Let's try again.",
      stepId: "email",
    },
  };

export const languageLabels: Record<string, string> = {
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
};

export const initialCode: Record<string, string> = {
  javascript: "// Write JavaScript code",
  python: "# Write Python code",
  java: "// Write Java code",
  cpp: "// Write C++ code",
};
