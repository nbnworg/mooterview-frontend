import React from "react";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { ChatAuthForm } from "../../components/auth/ChatAuthForm";
import "../signup/singup.css";

const loginSteps = [
  {
    id: "email",
    question: "Hey there 👋 Can you tell me the email you used to sign up?",
  },
  {
    id: "password",
    question: "Now enter your password securely.",
  },
];

const loginInitialMessages = [
  "👋 Welcome back to Mooterview! I'll help you log in.",
];

const Login: React.FC = () => {
  return (
    <AuthLayout
      title="Login"
      linkText="New To Mooterview [sign up]"
      linkTo="/sign-up"
    >
      <ChatAuthForm
        steps={loginSteps}
        initialMessages={loginInitialMessages}
        apiEndpoint="/users/login"
        successMessage="✅ Logged in successfully! Taking you to your dashboard..."
        errorMessage="❌ Hmm... login failed. Please double-check your credentials and try again."
        redirectPath="/"
        initialFormData={{
          email: "",
          password: "",
        }}
        finalButtonText="Log In"
        completedButtonText="Go To interviews"
      />
    </AuthLayout>
  );
};

export default Login;
