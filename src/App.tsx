import { Route, Routes } from "react-router-dom";
import "./App.css";
import Homepage from "./pages/homepage/Homepage";
import Signup from "./pages/signup/Signup";
import Login from "./pages/login/Login";
import LandingPage from "./pages/landingPage/LandingPage";
import AuthRedirect from "./components/auth/AuthRedirect";
import CreateProblem from "./pages/createProblem/CreateProblem";
import Problempage from "./pages/problem/Problempage";
import PrivateRoute from "./privateRoute";

function App() {
  return (
    <>
      <Routes>
        <Route path={"/"} element={<AuthRedirect />} />
        <Route path={"/sign-up"} element={<Signup />} />
        <Route path={"/log-in"} element={<Login />} />
        <Route path={"/landing"} element={<LandingPage />} />
        <Route
          path={"/home"}
          element={
            <PrivateRoute>
              <Homepage />
            </PrivateRoute>
          }
        />
        <Route
          path={"/problem/:title"}
          element={
            <PrivateRoute>
              <Problempage />
            </PrivateRoute>
          }
        />
        <Route
          path={"/create-a-problem"}
          element={
            <PrivateRoute>
              <CreateProblem />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
