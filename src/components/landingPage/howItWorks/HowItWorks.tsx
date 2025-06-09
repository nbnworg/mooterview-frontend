import { useRef } from "react";
import "./howItWorks.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  { id: 1, text: "Pick from curated LeetCode questions (Easy to Hard)" },
  { id: 2, text: "Code in a clean whiteboard-like interface (no syntax help)" },
  {
    id: 3,
    text: "Get live feedback — hints, edge cases, time/space complexity advice",
  },
  { id: 4, text: "Review with AI-generated suggestions and explanations" },
];

const HowItWorks = () => {
  const containerRef = useRef(null);

  useGSAP(
    () => {
      const steps = gsap.utils.toArray<HTMLElement>(".step");
      steps.forEach((step) => {
        ScrollTrigger.create({
          trigger: step,
          start: "top 90%",
          end: "top 40%",
          onEnter: () => {
            gsap.to(step, {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: "power2.out",
            });
          },
          onLeaveBack: () => {
            gsap.to(step, {
              opacity: 0,
              y: 100,
              duration: 0.5,
              ease: "power2.in",
            });
          },
        });
      });

      const line = document.querySelector(".verticalLine") as HTMLElement;
      const stepsEl = document.querySelector(".steps") as HTMLElement;

      gsap.fromTo(
        line,
        { height: 0 },
        {
          height: () => stepsEl.scrollHeight - 80 + "px",
          ease: "none",
          scrollTrigger: {
            trigger: stepsEl,
            start: "top center",
            end: "bottom bottom",
            scrub: true,
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <section className="howItWorksSection" ref={containerRef}>
      <h1>How It Works</h1>
      <div className="stepsContainer">
        <div className="verticalLine"></div>
        <div className="steps">
          {steps.map((step, idx) => (
            <div key={idx} className="step">
              <h5>{step.id}</h5>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
