import { Link } from "react-router-dom";
import "./navbar.css";

const Navbar = () => {
  return (
    <nav>
      <div className="logoContainer">
        <h1 className="brandName">Mooterview</h1>
      </div>
      <div className="navMenu">
        <Link to={"/log-in"} className="navMenuLinks">
          Login
        </Link>
        <Link to={"/sign-up"} className="navMenuLinks">
          Signup
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
