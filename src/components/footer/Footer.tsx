import "./footer.css";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer>
      <div className="footerContent">
        <div className="footerHeader">
          <h1 className="footerHeading">Mooterview</h1>
          <h4 className="footerSubheading">
            Practice coding interviews with real-time AI guidance.
          </h4>
        </div>
        <div className="footerLinks">
          <div className="footerLink footerLegals">
            <Link className="footerlinks" to="/privacy-policy">Privacy Policy</Link>
            <Link className="footerlinks" to="/terms-and-conditions">Terms and Conditions</Link>
            <Link className="footerlinks" to="/faq">FAQs</Link>
          </div>
        </div>
      </div>
      <div className="copyrightText">
        <p>© 2025 Mooterview. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
