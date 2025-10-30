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
import SessionSummary from "./pages/sessionSummary/SessionSummary";
import NotFound from "./pages/notFound/NotFound";
import DashBoard from "./pages/dashboard/Dashboard";
import SessionOfProblem from "./components/sessionInfo/SessionOfProblem";
import Solution from "./pages/solution/Solution";
import MobileWarning from "./pages/homepage/components/MobileWarning";
import PrivacyPolicy from "./pages/legalPages/privacyPolicy/PrivacyPolicy";
import TermsAndConditions from "./pages/legalPages/T&C/T&C";
import FAQ from "./pages/legalPages/FAQ/FAQ";

function App() {
  return (
    <>
      <MobileWarning />
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
          path={"/dashboard"}
          element={
            <PrivateRoute>
              <DashBoard />
            </PrivateRoute>
          }
        />
        <Route
          path={"/session"}
          element={
            <PrivateRoute>
              <SessionOfProblem />
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
        <Route
          path={"/session/:id"}
          element={
            <PrivateRoute>
              <SessionSummary />
            </PrivateRoute>
          }
        />
        <Route
          path={"/solution/:id"}
          element={
            <PrivateRoute>
              <Solution />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/FAQ" element={<FAQ />} />

      </Routes>
    </>
  );
}

export default App;