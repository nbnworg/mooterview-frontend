import { Route, Routes } from "react-router-dom";
import "./App.css";
import Homepage from "./pages/homepage/Homepage";
import Signup from "./pages/signup/Signup";
import Login from "./pages/login/Login";
import LandingPage from "./pages/landingPage/LandingPage";
import AuthRedirect from "./components/auth/AuthRedirect";
import Problem from "./pages/problem/problem";

function App() {
  return (
    <>
      <Routes>
        <Route path={"/"} element={<AuthRedirect />} />
        <Route path={"/sign-up"} element={<Signup />} />
        <Route path={"/log-in"} element={<Login />} />
        <Route path={"/landing"} element={<LandingPage />} />
        <Route path={"/home"} element={<Homepage />} />
        <Route path={"/problem/:title"} element={<Problem />} />
      </Routes>
    </>
  );
}

export default App;
