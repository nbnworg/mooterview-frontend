import type { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/log-in" />;
};

export default PrivateRoute;
