import "./heroSection.css";

import heroImage from "../../../assets/landingPage/heroSection.gif";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  useGSAP(() => {
    const tl = gsap.timeline({ ease: "power2.out" });

    tl.to(".heroSection", {
      duration: 0.7,
      ease: "power2.out",
      onUpdate: function () {
        const angle = this.progress() * 40;
        (
          document.querySelector(".heroSection") as HTMLElement | null
        )?.style.setProperty("--angle", `${angle}deg`);
      },
    });

    tl.from(
      ".heroTextContainer > *",
      {
        x: -200,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: "power2.out",
      },
      "same"
    );

    tl.from(
      ".heroImageContainer",
      {
        x: 200,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
      },
      "same"
    );
  });

  return (
    <div>
      <section className="heroSection">
        <div className="heroTextContainer">
          <h1 className="heading">
            Practice Coding Interviews Like the Real Thing
          </h1>
          <h4 className="subHeading">
            An AI-powered whiteboard that simulates real interview environments
            used by top tech companies like Google, Meta, and Amazon.
          </h4>
          <button
            onClick={() => navigate("/sign-up")}
            className="signupForFreeButton"
          >
            Sign Up For Free
          </button>
        </div>
        <div className="heroImageContainer">
          <img src={heroImage} alt="heroSection Image" />
        </div>
      </section>
    </div>
  );
};

export default HeroSection;
