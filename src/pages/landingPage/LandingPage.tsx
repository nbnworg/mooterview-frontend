import Footer from "../../components/footer/Footer";
import HeroSection from "../../components/landingPage/heroSection/HeroSection";
import HowItWorks from "../../components/landingPage/howItWorks/HowItWorks";
import Navbar from "../../components/navbar/Navbar";
import "./landingPage.css";

const LandingPage = () => {
  return (
    <>
      <Navbar />
      <div className="LandingPageContainer">
        <HeroSection />
        <HowItWorks />
        <Footer />
      </div>
    </>
  );
};

export default LandingPage;
