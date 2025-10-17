// components/MobileWarning.tsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./MobileWarning.css";

const MobileWarning: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const excludedRoutes = ["/sign-up", "/log-in", "/landing"];
  
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = /android(?!.*mobile)|webos|iphone|ipod|blackberry|iemobile|opera mini/;
      const isSmallScreen = window.innerWidth < 768; 

      return mobileKeywords.test(userAgent) || isSmallScreen;
    };

    const updateWarningVisibility = () => {
      const isExcludedRoute = excludedRoutes.includes(location.pathname);
      const isMobileDevice = checkIfMobile();

      if (isMobileDevice && !isExcludedRoute) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    updateWarningVisibility();

    const handleResize = () => {
      updateWarningVisibility();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [location.pathname]);

  if (!showWarning) return null;

  return (
    <div className="mobile-warning-overlay">
      <div className="mobile-warning-container">
        <div className="mobile-warning-icon">💻</div>
        <h2 className="mobile-warning-title">Desktop Mode</h2>
        <h2 className="mobile-warning-title">Required</h2>
          <p className="mobile-warning-message">
          Please access this platform from a desktop computer for full functionality.
        </p>
        <button
          className="mobile-warning-button"
          onClick={() => navigate("/landing")}
        >
          I Understand
        </button>
      </div>
    </div>
  );
};

export default MobileWarning;