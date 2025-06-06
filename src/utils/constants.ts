export const BASE_URL =
  "https://w7eo1zzql3.execute-api.us-east-1.amazonaws.com/sandbox";

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
