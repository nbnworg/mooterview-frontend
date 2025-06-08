import { Link } from "react-router-dom";
import "./navbar.css";
import avatar from "../../assets/avatar/avatar.png";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";

const Navbar = () => {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/log-in");
  };

  return (
    <nav>
      <div className="logoContainer">
        <h1 className="brandName">Mooterview</h1>
      </div>
      {isLoggedIn ? (
        <div className="navMenu">
          <button className="profileAvatar">
            <img
              className="profileAvatarImage"
              src={avatar}
              alt="User avatar"
            />
          </button>
          <button onClick={handleLogout} className="navMenuLinksButton">
            Logout
            <FiLogOut />
          </button>
        </div>
      ) : (
        <div className="navMenu">
          <Link to={"/log-in"} className="navMenuLinks">
            Login
          </Link>
          <Link to={"/sign-up"} className="navMenuLinks">
            Signup
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
