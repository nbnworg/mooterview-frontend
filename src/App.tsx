import { Route, Routes } from "react-router-dom";
import "./App.css";
import Homepage from "./pages/homepage/Homepage";
import Signup from "./pages/signup/Signup";
import Login from "./pages/login/Login";

function App() {
  return (
    <>
      <Routes>
        <Route path={"/"} element={<Homepage />} />
        <Route path={"/sign-up"} element={<Signup />} />
        <Route path={"/log-in"} element={<Login />} />
      </Routes>
    </>
  );
}

export default App;
