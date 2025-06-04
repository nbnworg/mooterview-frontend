import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../signup/singup.css";
import { BASE_URL } from "../../utils/constants";
import axios from "axios";
import { IoSend } from "react-icons/io5";

const steps = [
  {
    id: "email",
    question: "Hey there 👋 Can you tell me the email you used to sign up?",
  },
  {
    id: "password",
    question: "Now enter your password securely.",
  },
];

const Login = () => {
  const [chat, setChat] = useState<{ from: "Moo" | "You"; text: string }[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [input, setInput] = useState("");
  const [credentials, setCredentials] = useState({
    email: "",
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
          text: "👋 Welcome back to Mooterview! I’ll help you log in.",
        },
      ]);
    }, 500);

    const timeout2 = setTimeout(() => {
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

    setCredentials((prev) => ({
      ...prev,
      [currentStep.id]: input.trim(),
    }));

    setInput("");
    setStepIndex((prev) => prev + 1);
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/users/login`, credentials);
      console.log("Login successful: ", response.data);

      setChat((prev) => [
        ...prev,
        {
          from: "Moo",
          text: "✅ Logged in successfully! Taking you to your dashboard...",
        },
      ]);

      setFinalSubmissionComplete(true);
    } catch (error) {
      console.error("Login failed:", error);
      setChat((prev) => [
        ...prev,
        {
          from: "Moo",
          text: "❌ Hmm... login failed. Please double-check your credentials and try again.",
        },
      ]);
    }
  };

  const handleRouteToHome = () => {
    navigate("/");
  };

  const isPasswordStep = steps[stepIndex]?.id === "password";
  return (
    <section className="loginSection">
      <div className="authContainer">
        <h1 className="SignupHeading">Login</h1>
        <Link to={"/sign-up"} className="authLink">
          New To Mooterview [sign up]
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
                finalSubmissionComplete ? handleRouteToHome : handleLogin
              }
              className="finalButton"
            >
              {finalSubmissionComplete ? "Go To interviews" : "Log In"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default Login;
