import React from "react";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { ChatAuthForm } from "../../components/auth/ChatAuthForm";
import "./singup.css";

const signupSteps = [
  {
    id: "fullName",
    question: "Firstly can you tell me your Full Name?",
  },
  {
    id: "username",
    question: "Choose a username you'd like to use.",
  },
  {
    id: "email",
    question: "What email should we use for you account?",
  },
  {
    id: "location",
    question: "Which city and state are you currently living in?",
  },
  {
    id: "password",
    question:
      "Set a secure password (min. 8 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character)",
  },
];

const signupInitialMessages = [
  "👋 Welcome to Mooterview! I'm Moo — your personal coding interview coach.",
  "Before we dive in, let's get to know you a bit. I'll guide you through a few quick questions to set up your profile.",
];

const Signup: React.FC = () => {
  return (
    <AuthLayout
      title="Signup"
      linkText="Already have an account? [Log in]"
      linkTo="/log-in"
    >
      <ChatAuthForm
        steps={signupSteps}
        initialMessages={signupInitialMessages}
        apiEndpoint="/users/"
        successMessage="🎉🎊All done! Your account has been created successfully, Click the below button to start the interviews"
        errorMessage="❌ Oops! Something went wrong while creating your account. Please try again."
        redirectPath="/home"
        initialFormData={{
          fullName: "",
          username: "",
          email: "",
          location: "",
          password: "",
        }}
        finalButtonText="Create Account"
        completedButtonText="Go To interviews"
      />
    </AuthLayout>
  );
};

export default Signup;
