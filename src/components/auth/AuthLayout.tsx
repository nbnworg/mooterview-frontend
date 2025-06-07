import React from "react";
import { FaRegArrowAltCircleLeft } from "react-icons/fa";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  title: string;
  linkText: string;
  linkTo: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  linkText,
  linkTo,
  children,
}) => {
  return (
    <section className="singUpSection">
      <Link className="goToHomeButton" to={"/"}>
        <FaRegArrowAltCircleLeft />
      </Link>
      <div className="authContainer">
        <h1 className="SignupHeading">{title}</h1>
        <Link to={linkTo} className="authLink">
          {linkText}
        </Link>
        <div className="chatSignupContainer">{children}</div>
      </div>
    </section>
  );
};
