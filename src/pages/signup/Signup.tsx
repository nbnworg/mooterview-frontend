import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./singup.css";
import { BASE_URL } from "../../utils/constants";
import axios from "axios";
import { IoSend } from "react-icons/io5";

const steps = [
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

const Signup = () => {
  const [chat, setChat] = useState<{ from: "Moo" | "You"; text: string }[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [input, setInput] = useState("");
  const [userData, setUserData] = useState({
    fullName: "",
    username: "",
    email: "",
    location: "",
    password: "",
  });
  const [introComplete, setIntroComplete] = useState(false);
  const [finalSubmissionComplete, setFinalSubmissionComplete] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const timeout1 = setTimeout(() => {
      setChat((prev) => [
        ...prev,
        {
          from: "Moo",
          text: "👋 Welcome to Mooterview! I'm Moo — your personal coding interview coach.",
        },
      ]);
    }, 500);

    const timeout2 = setTimeout(() => {
      setChat((prev) => [
        ...prev,
        {
          from: "Moo",
          text: "Before we dive in, let’s get to know you a bit. I’ll guide you through a few quick questions to set up your profile.",
        },
      ]);
      setIntroComplete(true);
    }, 1500);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, []);

  useEffect(() => {
    if (introComplete && stepIndex < steps.length) {
      const question = steps[stepIndex].question;
      setTimeout(() => {
        setChat((prev) => [...prev, { from: "Moo", text: question }]);
      }, 600);
    }
  }, [introComplete, stepIndex]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleSubmit = () => {
    if (!input.trim()) return;

    const currentStep = steps[stepIndex];
    setChat((prev) => [...prev, { from: "You", text: input.trim() }]);

    setUserData((prev) => ({
      ...prev,
      [currentStep.id]: input.trim(),
    }));

    setInput("");
    setStepIndex((prev) => prev + 1);
  };

  const handleFinalSubmit = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/users/`, userData);

      console.log("Account Created: ", response.data);

      setChat((prev) => [
        ...prev,
        {
          from: "Moo",
          text: "🎉🎊All done! Your account has been created successfully, Click the below button to start the interviews",
        },
      ]);
      setFinalSubmissionComplete(true);
    } catch (error) {
      console.error("Signup failed:", error);
      setChat((prev) => [
        ...prev,
        {
          from: "Moo",
          text: "❌ Oops! Something went wrong while creating your account. Please try again.",
        },
      ]);
    }
  };

  const handleRouteToHome = () => {
    navigate("/");
  };

  const isPasswordStep = steps[stepIndex]?.id === "password";

  return (
    <section className="singUpSection">
      <div className="authContainer">
        <h1 className="SignupHeading">Signup</h1>
        <Link to={"/log-in"} className="authLink">
          Already have an account? [Log in]
        </Link>
        <div className="chatSignupContainer">
          <div className="chatBox">
            {chat.map((message, index) => (
              <div key={index} className={`chatMessage ${message.from}`}>
                {message.text}
              </div>
            ))}
            <div ref={chatEndRef}></div>
          </div>
          {stepIndex < steps.length ? (
            <div className="inputRow">
              <input
                type={isPasswordStep ? "password" : "text"}
                placeholder="Type your response..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="chatInput"
              />
              <button onClick={handleSubmit} className="sendButton">
                <IoSend />
              </button>
            </div>
          ) : (
            <button
              onClick={
                finalSubmissionComplete ? handleRouteToHome : handleFinalSubmit
              }
              className="finalButton"
            >
              {finalSubmissionComplete ? "Go To interviews" : "Create Account"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default Signup;
