import { Route, Routes } from "react-router-dom";
import "./App.css";
import Homepage from "./pages/homepage/Homepage";
import Signup from "./pages/signup/Signup";
import Login from "./pages/login/Login";
import LandingPage from "./pages/landingPage/LandingPage";
import AuthRedirect from "./components/auth/AuthRedirect";
import CreateProblem from "./pages/createProblem/CreateProblem";
import Problempage from "./pages/problem/Problempage";
import SessionSummary from "./pages/sessionSummary/SessionSummary";
import NotFound from "./pages/notFound/NotFound";

function App() {
  return (
    <>
      <Routes>
        <Route path={"/"} element={<AuthRedirect />} />
        <Route path={"/sign-up"} element={<Signup />} />
        <Route path={"/log-in"} element={<Login />} />
        <Route path={"/landing"} element={<LandingPage />} />
        <Route path={"/home"} element={<Homepage />} />
        <Route path={"/problem/:title"} element={<Problempage />} />
        <Route path={"/create-a-problem"} element={<CreateProblem />} />
        <Route path={"/session/:id"} element={<SessionSummary />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
