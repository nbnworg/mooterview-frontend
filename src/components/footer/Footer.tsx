import "./footer.css";

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
            <p>Privacy Policy </p>
            <p>Terms of Service </p>
            <p>FAQs </p>
          </div>
          <div className="footerLink footerSocials">
            <p>LinkedIn</p>
            <p>X </p>
            <p>Discord </p>
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
