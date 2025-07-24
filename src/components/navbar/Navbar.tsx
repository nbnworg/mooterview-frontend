import { Link } from "react-router-dom";
import { useState } from "react";
import "./navbar.css";
import avatar from "../../assets/avatar/avatar.png";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import ConfirmationModal from "../Confirmationmodal/Confirmationmodal";
import mooLogo from "../../assets/moo_logo_1.png";

interface ConfirmationModalData {
  text1: string;
  text2: string;
  btn1Text: string;
  btn2Text: string;
  btn1Handler: () => void;
  btn2Handler: () => void;
}

const Navbar = () => {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalData | null>(null);

  const handleLogout = () => {
    logout();
    setConfirmationModal(null);
    navigate("/log-in");

  };

  return (
    <nav>
      <Link to="/" className="brandName">
        <img src={mooLogo} alt="Moo Logo" className="brandLogo" />
        <span className="brandText">Moo</span>
      </Link>


      {isLoggedIn ? (
        <div className="navMenu">
          <button className="profileAvatar"
            onClick={() => { navigate("/dashboard") }}
          >
            <img
              className="profileAvatarImage"
              src={avatar}
              alt="User avatar"
            />

          </button>
          <button onClick={() =>
            setConfirmationModal({
              text1: "Are you Sure?",
              text2: "You will be logged out of your Account",
              btn1Text: "Logout",
              btn2Text: "Cancel",
              btn1Handler: handleLogout,
              btn2Handler: () => setConfirmationModal(null),
            })
          } className="navMenuLinksButton">
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
      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}

    </nav>
  );
};

export default Navbar;
